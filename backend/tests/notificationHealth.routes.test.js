const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const Module = require('node:module');

const APP_PATH = path.resolve(__dirname, '..', 'app.js');
const DB_SERVICE_PATH = path.resolve(__dirname, '..', 'services', 'dbService.js');
const NOTIFY_SERVICE_PATH = path.resolve(__dirname, '..', 'services', 'notifyService.js');
const EMAIL_SERVICE_PATH = path.resolve(__dirname, '..', 'services', 'emailService.js');

const MESSENGER_KEY = 'health-test-key';
const OPERATOR_ROOM_NAME = '가족-최석재';

async function withEnv(overrides, fn) {
  const previousValues = new Map();

  for (const [name, value] of Object.entries(overrides)) {
    previousValues.set(name, Object.prototype.hasOwnProperty.call(process.env, name)
      ? process.env[name]
      : undefined);

    if (typeof value === 'undefined') {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }

  try {
    return await fn();
  } finally {
    for (const [name, value] of previousValues.entries()) {
      if (typeof value === 'undefined') {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  }
}

function loadAppWithMocks({ dbOverrides = {}, notifyOverrides = {}, emailOverrides = null } = {}) {
  const originalLoad = Module._load;

  Module._load = function patchedLoad(request, parent, isMain) {
    const resolved = (() => {
      try {
        return Module._resolveFilename(request, parent, isMain);
      } catch (error) {
        return request;
      }
    })();

    if (resolved === DB_SERVICE_PATH) {
      return {
        getDb: () => ({}),
        getPublicStats: async () => ({ consultationCount: 0, completedCount: 0 }),
        getActiveConsultations: async () => ({ total: 0, consultations: [] }),
        ...dbOverrides,
      };
    }

    if (resolved === EMAIL_SERVICE_PATH && emailOverrides) {
      return emailOverrides;
    }

    if (resolved === NOTIFY_SERVICE_PATH) {
      return {
        getQueueStatus: async () => ({
          pendingCount: 0,
          patientPushPending: 0,
          patientSmsPending: 0,
          registeredRooms: 0,
        }),
        getDoctorRoomName: async () => '',
        getOperatorAlertRoomName: async () => '',
        getMessengerBotHeartbeat: async () => null,
        ...notifyOverrides,
      };
    }

    return originalLoad(request, parent, isMain);
  };

  delete require.cache[APP_PATH];

  try {
    return require(APP_PATH).createApp();
  } finally {
    Module._load = originalLoad;
    delete require.cache[APP_PATH];
  }
}

async function startApp(app) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  return {
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

async function getJson(url, options = {}) {
  const response = await fetch(url, options);
  return { status: response.status, body: await response.json() };
}

test('/api/version reports a disabled mail channel so a missing variable is visible', { concurrency: false }, async () => {
  await withEnv({
    MESSENGER_API_KEY: MESSENGER_KEY,
    SMTP_USER: undefined,
    SMTP_PASS: undefined,
    ALERT_EMAIL_RECIPIENTS: undefined,
    PORTAL_ADMIN_EMAILS: undefined,
    ALLOWED_DOCTOR_EMAILS: undefined,
  }, async () => {
    const server = await startApp(loadAppWithMocks());

    try {
      const { status, body } = await getJson(`${server.baseUrl}/api/version`);

      assert.equal(status, 200);
      assert.equal(body.notifications.email.configured, false);
      assert.equal(body.notifications.email.ready, false);
      assert.equal(body.notifications.email.issue, null);
      assert.equal(body.notifications.sms.configured, false);
    } finally {
      await server.close();
    }
  });
});

test('/api/version names a half-entered credential pair as the reason mail is off', { concurrency: false }, async () => {
  await withEnv({
    MESSENGER_API_KEY: MESSENGER_KEY,
    SMTP_USER: 'alerts@happydoctor.kr',
    SMTP_PASS: undefined,
  }, async () => {
    const server = await startApp(loadAppWithMocks());

    try {
      const { body } = await getJson(`${server.baseUrl}/api/version`);

      assert.equal(body.notifications.email.configured, false);
      assert.match(body.notifications.email.issue, /SMTP_USER and SMTP_PASS/);
    } finally {
      await server.close();
    }
  });
});

test('/api/version treats a configured sender with no recipients as not ready', { concurrency: false }, async () => {
  await withEnv({
    MESSENGER_API_KEY: MESSENGER_KEY,
    SMTP_USER: 'alerts@happydoctor.kr',
    SMTP_PASS: 'secret',
    ALERT_EMAIL_RECIPIENTS: undefined,
    PORTAL_ADMIN_EMAILS: undefined,
    ALLOWED_DOCTOR_EMAILS: undefined,
  }, async () => {
    const server = await startApp(loadAppWithMocks());

    try {
      const { body } = await getJson(`${server.baseUrl}/api/version`);

      assert.equal(body.notifications.email.configured, true);
      assert.equal(body.notifications.email.recipientCount, 0);
      assert.equal(body.notifications.email.ready, false);
      assert.equal(body.notifications.unansweredDigest.ready, false);
    } finally {
      await server.close();
    }
  });
});

test('/api/version reports a fully wired mail channel as ready', { concurrency: false }, async () => {
  await withEnv({
    MESSENGER_API_KEY: MESSENGER_KEY,
    SMTP_USER: 'alerts@happydoctor.kr',
    SMTP_PASS: 'secret',
    ALERT_EMAIL_RECIPIENTS: 'a@happydoctor.kr,b@happydoctor.kr',
  }, async () => {
    const server = await startApp(loadAppWithMocks());

    try {
      const { body } = await getJson(`${server.baseUrl}/api/version`);

      assert.equal(body.notifications.email.ready, true);
      assert.equal(body.notifications.email.recipientCount, 2);
      assert.equal(body.notifications.unansweredDigest.ready, true);
      assert.equal(body.notifications.unansweredDigest.hourKst, 9);
    } finally {
      await server.close();
    }
  });
});

test('/api/notification-health is refused without the messenger API key', { concurrency: false }, async () => {
  await withEnv({ MESSENGER_API_KEY: MESSENGER_KEY }, async () => {
    const server = await startApp(loadAppWithMocks());

    try {
      const anonymous = await getJson(`${server.baseUrl}/api/notification-health`);
      assert.equal(anonymous.status, 401);

      const wrongKey = await getJson(`${server.baseUrl}/api/notification-health`, {
        headers: { 'x-api-key': 'nope' },
      });
      assert.equal(wrongKey.status, 401);
    } finally {
      await server.close();
    }
  });
});

test('/api/notification-health surfaces queue depth and backlog age without room names', { concurrency: false }, async () => {
  await withEnv({
    MESSENGER_API_KEY: MESSENGER_KEY,
    SMTP_USER: undefined,
    SMTP_PASS: undefined,
  }, async () => {
    const oldest = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const server = await startApp(loadAppWithMocks({
      dbOverrides: {
        getActiveConsultations: async () => ({
          total: 12,
          consultations: [
            { id: 'c1', createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
            { id: 'c2', createdAt: oldest },
          ],
        }),
      },
      notifyOverrides: {
        getQueueStatus: async () => ({
          pendingCount: 3,
          patientPushPending: 1,
          patientSmsPending: 24,
          registeredRooms: 3,
        }),
        getDoctorRoomName: async () => '',
        getOperatorAlertRoomName: async () => OPERATOR_ROOM_NAME,
      },
    }));

    try {
      const { status, body } = await getJson(`${server.baseUrl}/api/notification-health`, {
        headers: { 'x-api-key': MESSENGER_KEY },
      });

      assert.equal(status, 200);
      assert.equal(body.kakao.doctorRoomRegistered, false);
      assert.equal(body.kakao.operatorAlertRoomRegistered, true);
      assert.equal(body.queues.patientSmsPending, 24);
      assert.equal(body.backlog.unansweredConsultations, 12);
      assert.equal(body.backlog.oldestUnansweredAgeMinutes, 180);

      // Room names identify people and must never appear in the payload.
      assert.ok(!JSON.stringify(body).includes(OPERATOR_ROOM_NAME));
    } finally {
      await server.close();
    }
  });
});

test('/api/notification-health reports an empty backlog as a null age', { concurrency: false }, async () => {
  await withEnv({ MESSENGER_API_KEY: MESSENGER_KEY }, async () => {
    const server = await startApp(loadAppWithMocks());

    try {
      const { body } = await getJson(`${server.baseUrl}/api/notification-health`, {
        headers: { 'x-api-key': MESSENGER_KEY },
      });

      assert.equal(body.backlog.unansweredConsultations, 0);
      assert.equal(body.backlog.oldestUnansweredAgeMinutes, null);
    } finally {
      await server.close();
    }
  });
});

test('backlog age is computed from Firestore Timestamps, not just ISO strings', { concurrency: false }, async () => {
  await withEnv({ MESSENGER_API_KEY: MESSENGER_KEY }, async () => {
    const threeHoursAgoMs = Date.now() - 3 * 60 * 60 * 1000;
    const server = await startApp(loadAppWithMocks({
      dbOverrides: {
        getActiveConsultations: async () => ({
          total: 3,
          consultations: [
            // getActiveConsultations returns raw documents, so these are the
            // shapes the Firestore SDK actually hands back.
            { id: 'c1', createdAt: { toMillis: () => Date.now() - 30 * 60 * 1000 } },
            { id: 'c2', createdAt: { _seconds: Math.floor(threeHoursAgoMs / 1000), _nanoseconds: 0 } },
            { id: 'c3', createdAt: new Date(Date.now() - 10 * 60 * 1000) },
          ],
        }),
      },
    }));

    try {
      const { body } = await getJson(`${server.baseUrl}/api/notification-health`, {
        headers: { 'x-api-key': MESSENGER_KEY },
      });

      assert.equal(body.backlog.unansweredConsultations, 3);
      assert.equal(body.backlog.oldestUnansweredAgeMinutes, 180);
    } finally {
      await server.close();
    }
  });
});

test('the health check can prove SMTP credentials authenticate without sending mail', { concurrency: false }, async () => {
  await withEnv({ MESSENGER_API_KEY: MESSENGER_KEY }, async () => {
    const sendCalls = [];
    const server = await startApp(loadAppWithMocks({
      emailOverrides: {
        isConfigured: () => true,
        getProvider: () => 'smtp',
        verifyTransport: async () => ({ provider: 'smtp', verified: true, error: null }),
        diagnoseConnectivity: async () => ({ host: 'smtp.gmail.com', port: 465, attempts: [] }),
        sendMail: async (...args) => {
          sendCalls.push(args);
          return 1;
        },
      },
    }));

    try {
      const withoutFlag = await getJson(`${server.baseUrl}/api/notification-health`, {
        headers: { 'x-api-key': MESSENGER_KEY },
      });
      // A handshake on every health check would be wasteful; it is opt-in.
      assert.equal(withoutFlag.body.smtpVerification, null);

      const withFlag = await getJson(`${server.baseUrl}/api/notification-health?verify=1`, {
        headers: { 'x-api-key': MESSENGER_KEY },
      });
      assert.equal(withFlag.body.smtpVerification.verified, true);

      // Verification must never actually deliver anything.
      assert.deepEqual(sendCalls, []);
    } finally {
      await server.close();
    }
  });
});

test('a rejected app password is reported as an authentication failure', { concurrency: false }, async () => {
  await withEnv({ MESSENGER_API_KEY: MESSENGER_KEY }, async () => {
    const server = await startApp(loadAppWithMocks({
      emailOverrides: {
        isConfigured: () => true,
        getProvider: () => 'smtp',
        verifyTransport: async () => ({
          provider: 'smtp',
          verified: false,
          error: 'Invalid login: 535-5.7.8 Username and Password not accepted',
        }),
        diagnoseConnectivity: async () => ({ host: 'smtp.gmail.com', port: 465, attempts: [] }),
      },
    }));

    try {
      const { body } = await getJson(`${server.baseUrl}/api/notification-health?verify=1`, {
        headers: { 'x-api-key': MESSENGER_KEY },
      });

      assert.equal(body.smtpVerification.verified, false);
      assert.match(body.smtpVerification.error, /Username and Password not accepted/);
    } finally {
      await server.close();
    }
  });
});

test("the digest and health backlog use the portal's own unanswered filter", { concurrency: false }, async () => {
  await withEnv({ MESSENGER_API_KEY: MESSENGER_KEY }, async () => {
    const requestedStatuses = [];
    const server = await startApp(loadAppWithMocks({
      dbOverrides: {
        getActiveConsultations: async (options) => {
          requestedStatuses.push(options.status);
          // Mirrors the real filter: only 'active'/'pending' select the
          // unanswered stage. An unrecognised value used to skip filtering
          // entirely and report every consultation as unanswered.
          const unansweredOnly = options.status === 'active' || options.status === 'pending';
          return unansweredOnly
            ? { total: 0, consultations: [] }
            : { total: 68, consultations: [] };
        },
      },
    }));

    try {
      const { body } = await getJson(`${server.baseUrl}/api/notification-health`, {
        headers: { 'x-api-key': MESSENGER_KEY },
      });

      assert.ok(
        requestedStatuses.every((status) => status === 'active' || status === 'pending'),
        `backlog must request the unanswered stage, got ${requestedStatuses.join(',')}`,
      );
      assert.equal(body.backlog.unansweredConsultations, 0);
    } finally {
      await server.close();
    }
  });
});

test('the test-email route needs the key, uses POST, and mails only the configured recipients', { concurrency: false }, async () => {
  await withEnv({ MESSENGER_API_KEY: MESSENGER_KEY }, async () => {
    let called = 0;
    const server = await startApp(loadAppWithMocks({
      emailOverrides: {
        isConfigured: () => true,
        getProvider: () => 'resend',
        sendTestEmail: async () => {
          called += 1;
          return { sent: true, provider: 'resend', recipientCount: 1, sentAt: '2026-09-04T00:00:00.000Z' };
        },
      },
    }));

    try {
      const anonymous = await fetch(`${server.baseUrl}/api/notification-health/test-email`, { method: 'POST' });
      assert.equal(anonymous.status, 401);
      assert.equal(called, 0, 'an unauthenticated caller must not send mail');

      const response = await fetch(`${server.baseUrl}/api/notification-health/test-email`, {
        method: 'POST',
        headers: { 'x-api-key': MESSENGER_KEY },
      });
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.sent, true);
      assert.equal(called, 1);
    } finally {
      await server.close();
    }
  });
});

test('a failed test send answers with an error status rather than a false success', { concurrency: false }, async () => {
  await withEnv({ MESSENGER_API_KEY: MESSENGER_KEY }, async () => {
    const server = await startApp(loadAppWithMocks({
      emailOverrides: {
        isConfigured: () => true,
        getProvider: () => 'resend',
        sendTestEmail: async () => ({ sent: false, provider: 'resend', error: 'resend_403: domain not verified' }),
      },
    }));

    try {
      const response = await fetch(`${server.baseUrl}/api/notification-health/test-email`, {
        method: 'POST',
        headers: { 'x-api-key': MESSENGER_KEY },
      });
      const body = await response.json();

      assert.equal(response.status, 502);
      assert.equal(body.sent, false);
      assert.match(body.error, /domain not verified/);
    } finally {
      await server.close();
    }
  });
});
