const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const PATIENT_SMS_SERVICE_PATH = path.resolve(__dirname, '../services/patientSmsService.js');
const NOTIFY_SERVICE_PATH = path.resolve(__dirname, '../services/notifyService.js');
const EMAIL_SERVICE_PATH = path.resolve(__dirname, '../services/emailService.js');
const CONFIG_PATH = path.resolve(__dirname, '../config.js');
const SOLAPI_PATH = require.resolve('solapi', { paths: [path.resolve(__dirname, '..')] });

function createModuleRecord(modulePath, exports) {
  return {
    id: modulePath, filename: modulePath, loaded: true, exports,
  };
}

function loadPatientSmsServiceWithMocks(mocks) {
  const originalService = require.cache[PATIENT_SMS_SERVICE_PATH];
  const originalMocks = new Map();

  delete require.cache[PATIENT_SMS_SERVICE_PATH];

  Object.entries(mocks).forEach(([modulePath, exports]) => {
    originalMocks.set(modulePath, require.cache[modulePath]);
    require.cache[modulePath] = createModuleRecord(modulePath, exports);
  });

  const service = require(PATIENT_SMS_SERVICE_PATH);

  return {
    service,
    restore() {
      delete require.cache[PATIENT_SMS_SERVICE_PATH];
      if (originalService) {
        require.cache[PATIENT_SMS_SERVICE_PATH] = originalService;
      }

      originalMocks.forEach((cachedModule, modulePath) => {
        if (cachedModule) {
          require.cache[modulePath] = cachedModule;
        } else {
          delete require.cache[modulePath];
        }
      });
    },
  };
}

const RUNTIME_CONFIG = {
  getPatientSmsRuntimeConfig: () => ({
    leaseMs: 60 * 1000,
    pollIntervalMs: 30 * 1000,
    batchSize: 10,
  }),
  getSolapiSmsConfig: () => ({
    apiKey: 'api-key',
    apiSecret: 'api-secret',
    sender: '029302266',
  }),
};

function createSolapiMock(failFor = []) {
  return {
    SolapiMessageService: class SolapiMessageService {
      async send({ to }) {
        if (failFor.includes(to)) {
          throw new Error('solapi_rejected_recipient');
        }
        return { ok: true };
      }
    },
  };
}

test('a permanently failing message no longer strands the queue behind it', { concurrency: false }, async () => {
  const sent = [];
  const acked = [];
  // The poison pill sits first, exactly as the June 4 message did in production.
  const queue = [
    { notificationId: 'poison', userId: 'patientA', phoneNumber: '01000000000', message: 'a', type: 'doctor_reply' },
    { notificationId: 'ok-1', userId: 'patientB', phoneNumber: '01011112222', message: 'b', type: 'doctor_reply' },
    { notificationId: 'ok-2', userId: 'patientC', phoneNumber: '01033334444', message: 'c', type: 'doctor_reply' },
  ];

  const context = loadPatientSmsServiceWithMocks({
    [NOTIFY_SERVICE_PATH]: {
      reclaimExpiredPatientSmsLeases: async () => {},
      isSmsDeliverableNumber: (phone) => typeof phone === 'string'
        && (phone.startsWith('+82') || (!phone.startsWith('+') && phone.startsWith('0'))),
      claimPatientSmsNotification: async () => queue.shift() || null,
      acknowledgePatientSmsNotification: async (notificationId, payload) => {
        acked.push({ notificationId, delivered: payload.delivered !== false });
        return { status: 'pending', exhausted: false, attemptCount: 1 };
      },
    },
    [EMAIL_SERVICE_PATH]: { isConfigured: () => true, sendPatientSmsFailureEmail: async () => true },
    [CONFIG_PATH]: RUNTIME_CONFIG,
    [SOLAPI_PATH]: createSolapiMock(['01000000000']),
  });

  try {
    const processed = await context.service.processDueNotifications();

    assert.equal(processed, 3);
    assert.deepEqual(acked, [
      { notificationId: 'poison', delivered: false },
      { notificationId: 'ok-1', delivered: true },
      { notificationId: 'ok-2', delivered: true },
    ]);
  } finally {
    context.restore();
  }
});

test('an abandoned message raises a mail report carrying no phone number or reply text', { concurrency: false }, async () => {
  const reports = [];
  let claimed = false;

  const context = loadPatientSmsServiceWithMocks({
    [NOTIFY_SERVICE_PATH]: {
      reclaimExpiredPatientSmsLeases: async () => {},
      isSmsDeliverableNumber: (phone) => typeof phone === 'string'
        && (phone.startsWith('+82') || (!phone.startsWith('+') && phone.startsWith('0'))),
      claimPatientSmsNotification: async () => {
        if (claimed) return null;
        claimed = true;
        return {
          notificationId: 'dead',
          userId: 'public_abc',
          phoneNumber: '01000000000',
          message: '의료진 답변이 도착했습니다',
          type: 'doctor_reply',
        };
      },
      acknowledgePatientSmsNotification: async () => ({
        status: 'failed',
        exhausted: true,
        attemptCount: 5,
        userId: 'public_abc',
      }),
    },
    [EMAIL_SERVICE_PATH]: {
      isConfigured: () => true,
      sendPatientSmsFailureEmail: async (payload) => {
        reports.push(payload);
        return true;
      },
    },
    [CONFIG_PATH]: RUNTIME_CONFIG,
    [SOLAPI_PATH]: createSolapiMock(['01000000000']),
  });

  try {
    await context.service.processDueNotifications();

    assert.equal(reports.length, 1);
    assert.equal(reports[0].userId, 'public_abc');
    assert.equal(reports[0].attemptCount, 5);

    const serialized = JSON.stringify(reports[0]);
    assert.ok(!serialized.includes('01000000000'));
    assert.ok(!serialized.includes('의료진 답변이 도착했습니다'));
  } finally {
    context.restore();
  }
});

test('a mail report failure does not stop the batch', { concurrency: false }, async () => {
  const queue = [
    { notificationId: 'dead', userId: 'a', phoneNumber: '01000000000', message: 'a', type: 'doctor_reply' },
    { notificationId: 'ok', userId: 'b', phoneNumber: '01011112222', message: 'b', type: 'doctor_reply' },
  ];

  const context = loadPatientSmsServiceWithMocks({
    [NOTIFY_SERVICE_PATH]: {
      reclaimExpiredPatientSmsLeases: async () => {},
      isSmsDeliverableNumber: (phone) => typeof phone === 'string'
        && (phone.startsWith('+82') || (!phone.startsWith('+') && phone.startsWith('0'))),
      claimPatientSmsNotification: async () => queue.shift() || null,
      acknowledgePatientSmsNotification: async () => ({ exhausted: true, attemptCount: 5 }),
    },
    [EMAIL_SERVICE_PATH]: {
      isConfigured: () => true,
      sendPatientSmsFailureEmail: async () => {
        throw new Error('smtp_unreachable');
      },
    },
    [CONFIG_PATH]: RUNTIME_CONFIG,
    [SOLAPI_PATH]: createSolapiMock(['01000000000']),
  });

  try {
    assert.equal(await context.service.processDueNotifications(), 2);
  } finally {
    context.restore();
  }
});

test('the processor loop starts even when the initial drain throws', { concurrency: false }, async () => {
  const context = loadPatientSmsServiceWithMocks({
    [NOTIFY_SERVICE_PATH]: {
      // A throw here previously escaped initialize(), so startProcessorLoop()
      // never ran and SMS stayed dead until the next deploy.
      reclaimExpiredPatientSmsLeases: async () => {
        throw new Error('firestore_unavailable');
      },
      isSmsDeliverableNumber: (phone) => typeof phone === 'string'
        && (phone.startsWith('+82') || (!phone.startsWith('+') && phone.startsWith('0'))),
      claimPatientSmsNotification: async () => null,
      acknowledgePatientSmsNotification: async () => ({ exhausted: false }),
    },
    [EMAIL_SERVICE_PATH]: { isConfigured: () => true, sendPatientSmsFailureEmail: async () => true },
    [CONFIG_PATH]: RUNTIME_CONFIG,
    [SOLAPI_PATH]: createSolapiMock(),
  });

  try {
    await context.service.initialize();
    assert.ok(context.service.processorHandle, 'processor loop must be armed');
  } finally {
    if (context.service.processorHandle) {
      clearInterval(context.service.processorHandle);
      context.service.processorHandle = null;
    }
    context.restore();
  }
});

test('a number SOLAPI cannot reach is abandoned immediately, not retried five times', { concurrency: false }, async () => {
  const acked = [];
  const reports = [];
  const sendAttempts = [];
  const queue = [
    { notificationId: 'intl', userId: 'patientA', phoneNumber: '+923278655785', message: 'a', type: 'doctor_reply' },
    { notificationId: 'domestic', userId: 'patientB', phoneNumber: '01011112222', message: 'b', type: 'doctor_reply' },
  ];

  const context = loadPatientSmsServiceWithMocks({
    [NOTIFY_SERVICE_PATH]: {
      reclaimExpiredPatientSmsLeases: async () => {},
      isSmsDeliverableNumber: (phone) => typeof phone === 'string'
        && (phone.startsWith('+82') || (!phone.startsWith('+') && phone.startsWith('0'))),
      claimPatientSmsNotification: async () => queue.shift() || null,
      acknowledgePatientSmsNotification: async (notificationId, payload) => {
        acked.push({
          notificationId,
          delivered: payload.delivered !== false,
          exhaust: payload.exhaust,
          error: payload.error,
        });
        return { status: 'failed', exhausted: true, attemptCount: 1 };
      },
    },
    [EMAIL_SERVICE_PATH]: {
      isConfigured: () => true,
      sendPatientSmsFailureEmail: async (payload) => {
        reports.push(payload);
        return true;
      },
    },
    [CONFIG_PATH]: RUNTIME_CONFIG,
    [SOLAPI_PATH]: {
      SolapiMessageService: class SolapiMessageService {
        async send({ to }) {
          sendAttempts.push(to);
          return { ok: true };
        }
      },
    },
  });

  try {
    await context.service.processDueNotifications();

    // The international number never reaches SOLAPI at all, while the domestic
    // one behind it still goes out.
    assert.deepEqual(sendAttempts, ['01011112222']);

    const failures = acked.filter((entry) => !entry.delivered);
    assert.equal(failures.length, 1);
    assert.equal(failures[0].notificationId, 'intl');
    assert.equal(failures[0].exhaust, true);
    assert.equal(failures[0].error, 'unsupported_recipient_country');

    assert.deepEqual(
      acked.filter((entry) => entry.delivered).map((entry) => entry.notificationId),
      ['domestic'],
    );
    assert.equal(reports.length, 1);
  } finally {
    context.restore();
  }
});

test('a SOLAPI rejection is recorded as its status code, not a wall of SDK type text', { concurrency: false }, async () => {
  const acked = [];
  let claimed = false;

  class MessageNotReceivedError extends Error {
    constructor() {
      super('1개의 메시지가 접수되지 못했습니다. 자세한 에러 메시지는 해당 에러 내 failedMessageList를 확인해주세요.');
      this.failedMessageList = [
        { to: '01011112222', statusCode: '3037', statusMessage: '발신번호 사전등록이 되어있지 않습니다.' },
        { to: '01033334444', statusCode: '3037', statusMessage: '발신번호 사전등록이 되어있지 않습니다.' },
      ];
    }
  }

  const context = loadPatientSmsServiceWithMocks({
    [NOTIFY_SERVICE_PATH]: {
      reclaimExpiredPatientSmsLeases: async () => {},
      isSmsDeliverableNumber: (phone) => typeof phone === 'string'
        && (phone.startsWith('+82') || (!phone.startsWith('+') && phone.startsWith('0'))),
      claimPatientSmsNotification: async () => {
        if (claimed) return null;
        claimed = true;
        return {
          notificationId: 'rejected',
          userId: 'patientA',
          phoneNumber: '01011112222',
          message: 'reply',
          type: 'doctor_reply',
        };
      },
      acknowledgePatientSmsNotification: async (notificationId, payload) => {
        acked.push(payload);
        return { status: 'pending', exhausted: false, attemptCount: 1 };
      },
    },
    [EMAIL_SERVICE_PATH]: { isConfigured: () => true, sendPatientSmsFailureEmail: async () => true },
    [CONFIG_PATH]: RUNTIME_CONFIG,
    [SOLAPI_PATH]: {
      SolapiMessageService: class SolapiMessageService {
        async send() {
          throw new MessageNotReceivedError();
        }
      },
    },
  });

  try {
    await context.service.processDueNotifications();

    assert.equal(acked.length, 1);
    // Duplicate rejections collapse to one reason, and the recipient numbers
    // are left out of what gets stored.
    assert.equal(acked[0].error, '3037 발신번호 사전등록이 되어있지 않습니다.');
    assert.ok(!acked[0].error.includes('01011112222'));
    assert.ok(acked[0].error.length <= 300);
  } finally {
    context.restore();
  }
});
