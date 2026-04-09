const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const DB_SERVICE_PATH = path.resolve(__dirname, '../services/dbService.js');
const NOTIFY_SERVICE_PATH = path.resolve(__dirname, '../services/notifyService.js');
const FOLLOW_UP_SERVICE_PATH = path.resolve(__dirname, '../services/followUpService.js');

function loadFollowUpService({ dbOverrides = {}, notifyOverrides = {} } = {}) {
  const originalDbService = require.cache[DB_SERVICE_PATH];
  const originalNotifyService = require.cache[NOTIFY_SERVICE_PATH];
  const originalFollowUpService = require.cache[FOLLOW_UP_SERVICE_PATH];

  const dbService = {
    reclaimExpiredFollowUpLeases: async () => 0,
    claimDueFollowUpSession: async () => null,
    saveFollowUpSession: async () => {},
    releaseFollowUpLease: async () => {},
    deleteFollowUpSession: async () => {},
    getFollowUpSession: async () => null,
    ...dbOverrides,
  };

  const notifyService = {
    enqueuePatientChannelPush: async () => true,
    ...notifyOverrides,
  };

  delete require.cache[FOLLOW_UP_SERVICE_PATH];
  require.cache[DB_SERVICE_PATH] = {
    id: DB_SERVICE_PATH,
    filename: DB_SERVICE_PATH,
    loaded: true,
    exports: dbService,
  };
  require.cache[NOTIFY_SERVICE_PATH] = {
    id: NOTIFY_SERVICE_PATH,
    filename: NOTIFY_SERVICE_PATH,
    loaded: true,
    exports: notifyService,
  };

  const service = require(FOLLOW_UP_SERVICE_PATH);
  service.processorHandle = null;
  service.isProcessing = false;
  service.batchSize = 10;
  service.pollIntervalMs = 30 * 1000;
  service.leaseMs = 60 * 1000;

  return {
    service,
    restore() {
      if (service.processorHandle) {
        clearInterval(service.processorHandle);
        service.processorHandle = null;
      }
      service.isProcessing = false;

      delete require.cache[FOLLOW_UP_SERVICE_PATH];
      if (originalFollowUpService) {
        require.cache[FOLLOW_UP_SERVICE_PATH] = originalFollowUpService;
      }

      if (originalDbService) {
        require.cache[DB_SERVICE_PATH] = originalDbService;
      } else {
        delete require.cache[DB_SERVICE_PATH];
      }

      if (originalNotifyService) {
        require.cache[NOTIFY_SERVICE_PATH] = originalNotifyService;
      } else {
        delete require.cache[NOTIFY_SERVICE_PATH];
      }
    },
  };
}

test('processDueSessions drains claimed sessions up to the configured batch size', { concurrency: false }, async () => {
  const claims = [
    { userId: 'user-1' },
    { userId: 'user-2' },
    { userId: 'user-3' },
  ];
  const claimedUsers = [];
  const context = loadFollowUpService({
    dbOverrides: {
      claimDueFollowUpSession: async () => claims.shift() || null,
    },
  });

  try {
    context.service.batchSize = 2;
    context.service.executeClaimedFollowUpPush = async (session) => {
      claimedUsers.push(session.userId);
    };

    const processed = await context.service.processDueSessions();

    assert.equal(processed, 2);
    assert.deepEqual(claimedUsers, ['user-1', 'user-2']);
    assert.equal(context.service.isProcessing, false);
  } finally {
    context.restore();
  }
});

test('executeClaimedFollowUpPush enqueues the reminder and saves the next durable state', { concurrency: false }, async () => {
  const enqueueCalls = [];
  const saveCalls = [];
  const context = loadFollowUpService({
    dbOverrides: {
      saveFollowUpSession: async (userId, payload) => {
        saveCalls.push({ userId, payload });
      },
    },
    notifyOverrides: {
      enqueuePatientChannelPush: async (userId, message, type) => {
        enqueueCalls.push({ userId, message, type });
        return true;
      },
    },
  });

  try {
    const session = {
      userId: 'patientA',
      createdAt: new Date(),
      reminderDelaysMinutes: [15, 180, 1440],
      nextReminderIndex: 0,
    };

    await context.service.executeClaimedFollowUpPush(session);

    assert.equal(enqueueCalls.length, 1);
    assert.equal(enqueueCalls[0].userId, 'patientA');
    assert.equal(enqueueCalls[0].type, 'follow_up');
    assert.ok(typeof enqueueCalls[0].message === 'string' && enqueueCalls[0].message.length > 0);

    assert.equal(saveCalls.length, 1);
    assert.equal(saveCalls[0].userId, 'patientA');
    assert.equal(saveCalls[0].payload.pendingMessage, enqueueCalls[0].message);
    assert.equal(saveCalls[0].payload.nextReminderIndex, 1);
    assert.equal(saveCalls[0].payload.status, 'scheduled');
    assert.equal(saveCalls[0].payload.leaseId, null);
    assert.equal(saveCalls[0].payload.leaseExpiresAt, null);
    assert.equal(saveCalls[0].payload.lastLeaseFailureReason, null);
    assert.ok(saveCalls[0].payload.lastActiveAt instanceof Date);
    assert.ok(saveCalls[0].payload.pendingCreatedAt instanceof Date);
    assert.ok(saveCalls[0].payload.dueAt instanceof Date);
    assert.ok(saveCalls[0].payload.dueAt.getTime() > Date.now());
  } finally {
    context.restore();
  }
});

test('executeClaimedFollowUpPush releases the lease when patient push enqueue fails', { concurrency: false }, async () => {
  const releasedLeases = [];
  const saveCalls = [];
  const context = loadFollowUpService({
    dbOverrides: {
      releaseFollowUpLease: async (userId, reason) => {
        releasedLeases.push({ userId, reason });
      },
      saveFollowUpSession: async (userId, payload) => {
        saveCalls.push({ userId, payload });
      },
    },
    notifyOverrides: {
      enqueuePatientChannelPush: async () => {
        throw new Error('push_enqueue_failed');
      },
    },
  });

  try {
    const session = {
      userId: 'patientB',
      createdAt: new Date(),
      reminderDelaysMinutes: [15, 180, 1440],
      nextReminderIndex: 0,
    };

    await assert.rejects(
      context.service.executeClaimedFollowUpPush(session),
      /push_enqueue_failed/,
    );

    assert.deepEqual(releasedLeases, [
      {
        userId: 'patientB',
        reason: 'push_enqueue_failed',
      },
    ]);
    assert.equal(saveCalls.length, 0);
  } finally {
    context.restore();
  }
});
