const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const PATIENT_SMS_SERVICE_PATH = path.resolve(__dirname, '../services/patientSmsService.js');
const NOTIFY_SERVICE_PATH = path.resolve(__dirname, '../services/notifyService.js');
const CONFIG_PATH = path.resolve(__dirname, '../config.js');
const SOLAPI_PATH = require.resolve('solapi', { paths: [path.resolve(__dirname, '..')] });

function createModuleRecord(modulePath, exports) {
  return {
    id: modulePath,
    filename: modulePath,
    loaded: true,
    exports,
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

test('initialize is a safe no-op when SOLAPI config is absent', { concurrency: false }, async () => {
  const calls = [];

  const context = loadPatientSmsServiceWithMocks({
    [NOTIFY_SERVICE_PATH]: {
      reclaimExpiredPatientSmsLeases: async () => {
        calls.push({ type: 'reclaimExpiredPatientSmsLeases' });
      },
      claimPatientSmsNotification: async () => {
        calls.push({ type: 'claimPatientSmsNotification' });
        return null;
      },
      acknowledgePatientSmsNotification: async () => {
        calls.push({ type: 'acknowledgePatientSmsNotification' });
        return true;
      },
    },
    [CONFIG_PATH]: {
      getPatientSmsRuntimeConfig: () => ({
        leaseMs: 60 * 1000,
        pollIntervalMs: 30 * 1000,
        batchSize: 10,
      }),
      getSolapiSmsConfig: () => null,
    },
    [SOLAPI_PATH]: {
      SolapiMessageService: class SolapiMessageService {
        constructor() {
          calls.push({ type: 'solapi-constructor' });
        }
      },
    },
  });

  try {
    await context.service.initialize();
    assert.deepEqual(calls, []);
  } finally {
    context.restore();
  }
});

test('processDueNotifications sends claimed SMS jobs through SOLAPI and acknowledges success', { concurrency: false }, async () => {
  const calls = [];
  let claimed = false;

  const context = loadPatientSmsServiceWithMocks({
    [NOTIFY_SERVICE_PATH]: {
      reclaimExpiredPatientSmsLeases: async () => {
        calls.push({ type: 'reclaimExpiredPatientSmsLeases' });
      },
      claimPatientSmsNotification: async () => {
        if (claimed) return null;
        claimed = true;
        return {
          notificationId: 'sms-1',
          userId: 'patientA',
          phoneNumber: '01012345678',
          message: 'doctor reply sms',
          type: 'doctor_reply',
        };
      },
      acknowledgePatientSmsNotification: async (notificationId, payload) => {
        calls.push({ type: 'acknowledgePatientSmsNotification', notificationId, payload });
        return true;
      },
    },
    [CONFIG_PATH]: {
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
    },
    [SOLAPI_PATH]: {
      SolapiMessageService: class SolapiMessageService {
        constructor(apiKey, apiSecret) {
          calls.push({ type: 'solapi-constructor', apiKey, apiSecret });
        }

        async send(payload) {
          calls.push({ type: 'solapi-send', payload });
          return { groupId: 'group-1' };
        }
      },
    },
  });

  try {
    const processedCount = await context.service.processDueNotifications();
    assert.equal(processedCount, 1);
    assert.deepEqual(calls, [
      { type: 'solapi-constructor', apiKey: 'api-key', apiSecret: 'api-secret' },
      {
        type: 'solapi-send',
        payload: {
          to: '01012345678',
          from: '029302266',
          text: 'doctor reply sms',
          autoTypeDetect: true,
        },
      },
      {
        type: 'acknowledgePatientSmsNotification',
        notificationId: 'sms-1',
        payload: { delivered: true },
      },
    ]);
  } finally {
    context.restore();
  }
});

test('processDueNotifications requeues the SMS job when SOLAPI send fails', { concurrency: false }, async () => {
  const calls = [];
  let claimed = false;

  const context = loadPatientSmsServiceWithMocks({
    [NOTIFY_SERVICE_PATH]: {
      reclaimExpiredPatientSmsLeases: async () => {
        calls.push({ type: 'reclaimExpiredPatientSmsLeases' });
      },
      claimPatientSmsNotification: async () => {
        if (claimed) return null;
        claimed = true;
        return {
          notificationId: 'sms-2',
          userId: 'patientB',
          phoneNumber: '01099998888',
          message: 'doctor reply sms 2',
          type: 'doctor_reply',
        };
      },
      acknowledgePatientSmsNotification: async (notificationId, payload) => {
        calls.push({ type: 'acknowledgePatientSmsNotification', notificationId, payload });
        return true;
      },
    },
    [CONFIG_PATH]: {
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
    },
    [SOLAPI_PATH]: {
      SolapiMessageService: class SolapiMessageService {
        async send() {
          throw new Error('solapi_send_failed');
        }
      },
    },
  });

  try {
    await assert.rejects(() => context.service.processDueNotifications(), /solapi_send_failed/);
    assert.deepEqual(calls, [
      {
        type: 'acknowledgePatientSmsNotification',
        notificationId: 'sms-2',
        payload: { delivered: false, error: 'solapi_send_failed' },
      },
    ]);
  } finally {
    context.restore();
  }
});
