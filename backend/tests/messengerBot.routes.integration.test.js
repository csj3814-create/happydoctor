const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const http = require('node:http');
const express = require('express');

const NOTIFY_SERVICE_PATH = path.resolve(__dirname, '../services/notifyService.js');
const ROUTE_PATH = path.resolve(__dirname, '../routes/messengerBot.js');

function createModuleRecord(modulePath, exports) {
  return {
    id: modulePath,
    filename: modulePath,
    loaded: true,
    exports,
  };
}

function loadMessengerBotRoute(notifyService) {
  const originalRoute = require.cache[ROUTE_PATH];
  const originalNotifyService = require.cache[NOTIFY_SERVICE_PATH];

  delete require.cache[ROUTE_PATH];
  require.cache[NOTIFY_SERVICE_PATH] = createModuleRecord(NOTIFY_SERVICE_PATH, notifyService);

  const router = require(ROUTE_PATH);

  return {
    router,
    restore() {
      delete require.cache[ROUTE_PATH];
      if (originalRoute) {
        require.cache[ROUTE_PATH] = originalRoute;
      }

      if (originalNotifyService) {
        require.cache[NOTIFY_SERVICE_PATH] = originalNotifyService;
      } else {
        delete require.cache[NOTIFY_SERVICE_PATH];
      }
    },
  };
}

async function startServer(router) {
  const app = express();
  app.use(express.json());
  app.use('/api/messengerbot', router);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();

  return {
    baseUrl: `http://127.0.0.1:${address.port}/api/messengerbot`,
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

async function getJson(url, options = {}) {
  const response = await fetch(url, {
    method: 'GET',
    headers: options.headers || {},
  });

  return {
    status: response.status,
    body: await response.json(),
  };
}

async function postJson(url, body, options = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: JSON.stringify(body),
  });

  return {
    status: response.status,
    body: await response.json(),
  };
}

async function withMessengerApiKey(fn) {
  const previousKey = process.env.MESSENGER_API_KEY;
  process.env.MESSENGER_API_KEY = 'test-messenger-key';

  try {
    await fn();
  } finally {
    if (typeof previousKey === 'string') {
      process.env.MESSENGER_API_KEY = previousKey;
    } else {
      delete process.env.MESSENGER_API_KEY;
    }
  }
}

test('messengerBot doctor poll returns the leased notification payload and ack forwards delivery results', { concurrency: false }, async () => {
  await withMessengerApiKey(async () => {
    const calls = [];
    const routeModule = loadMessengerBotRoute({
      recordMessengerBotPoll: async () => false,
      claimDoctorNotification: async () => {
        calls.push({ type: 'claimDoctorNotification' });
        return {
          notificationId: 'doctor-note-1',
          leaseId: 'lease-1',
          message: 'line one\nline two',
          priority: 'urgent',
        };
      },
      acknowledgeDoctorNotification: async (notificationId, payload) => {
        calls.push({ type: 'acknowledgeDoctorNotification', notificationId, payload });
      },
      confirmDoctorNotifications: async () => [],
      claimPatientChannelPush: async () => null,
      acknowledgePatientChannelPush: async () => {},
      registerRoom: async () => {},
      registerDoctorRoom: async () => ({ ok: true, roomName: 'doctor room' }),
      getDoctorRoomName: async () => {
        throw new Error('doctor room should not be used when operator room is registered');
      },
      getOperatorAlertRoomName: async () => {
        calls.push({ type: 'getOperatorAlertRoomName' });
        return 'owner room';
      },
    });

    const server = await startServer(routeModule.router);

    try {
      const poll = await getJson(`${server.baseUrl}/poll`, {
        headers: { 'x-api-key': 'test-messenger-key' },
      });

      assert.equal(poll.status, 200);
      assert.equal(poll.body.hasNew, true);
      assert.equal(poll.body.notificationId, 'doctor-note-1');
      assert.equal(poll.body.leaseId, 'lease-1');
      assert.equal(poll.body.roomName, 'owner room');
      assert.equal(poll.body.deliveryMode, 'operator_personal');
      assert.match(poll.body.reply, /line one/);
      assert.match(poll.body.reply, /portal\.happydoctor\.kr\/open-browser/);

      const ack = await postJson(
        `${server.baseUrl}/poll/ack`,
        {
          notificationId: 'doctor-note-1',
          delivered: false,
          error: 'x'.repeat(300),
        },
        {
          headers: { 'x-api-key': 'test-messenger-key' },
        },
      );

      assert.equal(ack.status, 200);
      assert.deepEqual(ack.body, { ok: true });

      assert.deepEqual(calls, [
        { type: 'getOperatorAlertRoomName' },
        { type: 'claimDoctorNotification' },
        {
          type: 'acknowledgeDoctorNotification',
          notificationId: 'doctor-note-1',
          payload: {
            delivered: false,
            error: 'x'.repeat(240),
          },
        },
      ]);
    } finally {
      await server.close();
      routeModule.restore();
    }
  });
});

test('messengerBot doctor poll falls back to the doctor group when no personal alert room is registered', { concurrency: false }, async () => {
  await withMessengerApiKey(async () => {
    const calls = [];
    const routeModule = loadMessengerBotRoute({
      recordMessengerBotPoll: async () => false,
      claimDoctorNotification: async () => {
        calls.push({ type: 'claimDoctorNotification' });
        return {
          notificationId: 'doctor-note-2',
          leaseId: 'lease-2',
          message: 'fallback chart',
          priority: 'normal',
        };
      },
      acknowledgeDoctorNotification: async () => {},
      confirmDoctorNotifications: async () => [],
      claimPatientChannelPush: async () => null,
      acknowledgePatientChannelPush: async () => {},
      registerRoom: async () => {},
      registerDoctorRoom: async () => ({ ok: true, roomName: 'doctor room' }),
      getOperatorAlertRoomName: async () => {
        calls.push({ type: 'getOperatorAlertRoomName' });
        return null;
      },
      getDoctorRoomName: async () => {
        calls.push({ type: 'getDoctorRoomName' });
        return 'doctor room';
      },
    });

    const server = await startServer(routeModule.router);

    try {
      const poll = await getJson(`${server.baseUrl}/poll`, {
        headers: { 'x-api-key': 'test-messenger-key' },
      });

      assert.equal(poll.status, 200);
      assert.equal(poll.body.hasNew, true);
      assert.equal(poll.body.notificationId, 'doctor-note-2');
      assert.equal(poll.body.leaseId, 'lease-2');
      assert.equal(poll.body.roomName, 'doctor room');
      assert.equal(poll.body.deliveryMode, 'doctor_group');
      assert.match(poll.body.reply, /fallback chart/);

      assert.deepEqual(calls, [
        { type: 'getOperatorAlertRoomName' },
        { type: 'getDoctorRoomName' },
        { type: 'claimDoctorNotification' },
      ]);
    } finally {
      await server.close();
      routeModule.restore();
    }
  });
});

test('messengerBot doctor poll reports missing registration and rejects missing ack ids', { concurrency: false }, async () => {
  await withMessengerApiKey(async () => {
    const routeModule = loadMessengerBotRoute({
      recordMessengerBotPoll: async () => false,
      claimDoctorNotification: async () => {
        throw new Error('not_used');
      },
      acknowledgeDoctorNotification: async () => {},
      confirmDoctorNotifications: async () => [],
      claimPatientChannelPush: async () => null,
      acknowledgePatientChannelPush: async () => {},
      registerRoom: async () => {},
      registerDoctorRoom: async () => ({ ok: true, roomName: 'doctor room' }),
      getOperatorAlertRoomName: async () => null,
      getDoctorRoomName: async () => null,
    });

    const server = await startServer(routeModule.router);

    try {
      const poll = await getJson(`${server.baseUrl}/poll`, {
        headers: { 'x-api-key': 'test-messenger-key' },
      });
      assert.equal(poll.status, 200);
      assert.deepEqual(poll.body, {
        hasNew: false,
        reason: 'doctor_alert_room_not_registered',
      });

      const ack = await postJson(
        `${server.baseUrl}/poll/ack`,
        {},
        {
          headers: { 'x-api-key': 'test-messenger-key' },
        },
      );
      assert.equal(ack.status, 400);
      assert.deepEqual(ack.body, { error: 'notificationId required' });
    } finally {
      await server.close();
      routeModule.restore();
    }
  });
});

test('messengerBot patient push poll and ack share the same contract for main and follow-up aliases', { concurrency: false }, async () => {
  await withMessengerApiKey(async () => {
    const calls = [];
    const routeModule = loadMessengerBotRoute({
      recordMessengerBotPoll: async () => false,
      claimDoctorNotification: async () => null,
      acknowledgeDoctorNotification: async () => {},
      confirmDoctorNotifications: async () => [],
      claimPatientChannelPush: async () => {
        calls.push({ type: 'claimPatientChannelPush' });
        return {
          queueId: 'push-1',
          leaseId: 'push-lease-1',
          roomName: 'patient room',
          message: 'patient reply ready',
          userId: 'public_user_7',
          type: 'doctor_reply',
        };
      },
      acknowledgePatientChannelPush: async (queueId, payload) => {
        calls.push({ type: 'acknowledgePatientChannelPush', queueId, payload });
      },
      registerRoom: async () => {},
      registerDoctorRoom: async () => ({ ok: true, roomName: 'doctor room' }),
      getDoctorRoomName: async () => 'doctor room',
    });

    const server = await startServer(routeModule.router);

    try {
      const patientPoll = await getJson(`${server.baseUrl}/patient-push-poll`, {
        headers: { 'x-api-key': 'test-messenger-key' },
      });

      assert.equal(patientPoll.status, 200);
      assert.deepEqual(patientPoll.body, {
        hasNew: true,
        queueId: 'push-1',
        leaseId: 'push-lease-1',
        roomName: 'patient room',
        message: 'patient reply ready',
        userId: 'public_user_7',
        type: 'doctor_reply',
      });

      const followUpPoll = await getJson(`${server.baseUrl}/fu-push-poll`, {
        headers: { 'x-api-key': 'test-messenger-key' },
      });

      assert.equal(followUpPoll.status, 200);
      assert.equal(followUpPoll.body.queueId, 'push-1');

      const patientAck = await postJson(
        `${server.baseUrl}/patient-push-poll/ack`,
        {
          queueId: 'push-1',
          delivered: false,
          error: 'temporary_failure',
        },
        {
          headers: { 'x-api-key': 'test-messenger-key' },
        },
      );
      assert.equal(patientAck.status, 200);
      assert.deepEqual(patientAck.body, { ok: true });

      const followUpAck = await postJson(
        `${server.baseUrl}/fu-push-poll/ack`,
        {
          queueId: 'push-1',
        },
        {
          headers: { 'x-api-key': 'test-messenger-key' },
        },
      );
      assert.equal(followUpAck.status, 200);
      assert.deepEqual(followUpAck.body, { ok: true });

      assert.deepEqual(calls, [
        { type: 'claimPatientChannelPush' },
        { type: 'claimPatientChannelPush' },
        {
          type: 'acknowledgePatientChannelPush',
          queueId: 'push-1',
          payload: {
            delivered: false,
            error: 'temporary_failure',
          },
        },
        {
          type: 'acknowledgePatientChannelPush',
          queueId: 'push-1',
          payload: {
            delivered: true,
            error: null,
          },
        },
      ]);
    } finally {
      await server.close();
      routeModule.restore();
    }
  });
});

test('messengerBot personal operator alert room commands register and show the target room', { concurrency: false }, async () => {
  await withMessengerApiKey(async () => {
    const calls = [];
    const routeModule = loadMessengerBotRoute({
      recordMessengerBotPoll: async () => false,
      claimDoctorNotification: async () => null,
      acknowledgeDoctorNotification: async () => {},
      confirmDoctorNotifications: async () => [],
      claimPatientChannelPush: async () => null,
      acknowledgePatientChannelPush: async () => {},
      registerRoom: async () => {},
      registerDoctorRoom: async () => ({ ok: true, roomName: 'doctor room' }),
      registerOperatorAlertRoom: async (roomName) => {
        calls.push({ type: 'registerOperatorAlertRoom', roomName });
        return { ok: true, roomName };
      },
      getDoctorRoomName: async () => 'doctor room',
      getOperatorAlertRoomName: async () => {
        calls.push({ type: 'getOperatorAlertRoomName' });
        return 'owner room';
      },
    });

    const server = await startServer(routeModule.router);

    try {
      const register = await postJson(
        `${server.baseUrl}/`,
        {
          room: 'owner room',
          msg: '~개인알림등록',
          sender: 'owner',
          isGroupChat: false,
          command: 'register_operator_alert_room',
        },
        {
          headers: { 'x-api-key': 'test-messenger-key' },
        },
      );

      assert.equal(register.status, 200);
      assert.match(register.body.reply, /개인 알림방/);
      assert.match(register.body.reply, /owner room/);

      const show = await postJson(
        `${server.baseUrl}/`,
        {
          room: 'owner room',
          msg: '~개인알림확인',
          sender: 'owner',
          isGroupChat: false,
          command: 'show_operator_alert_room',
        },
        {
          headers: { 'x-api-key': 'test-messenger-key' },
        },
      );

      assert.equal(show.status, 200);
      assert.match(show.body.reply, /owner room/);

      assert.deepEqual(calls, [
        { type: 'registerOperatorAlertRoom', roomName: 'owner room' },
        { type: 'getOperatorAlertRoomName' },
      ]);
    } finally {
      await server.close();
      routeModule.restore();
    }
  });
});

test('messengerBot endpoints reject requests without the configured API key', { concurrency: false }, async () => {
  await withMessengerApiKey(async () => {
    const routeModule = loadMessengerBotRoute({
      recordMessengerBotPoll: async () => false,
      claimDoctorNotification: async () => null,
      acknowledgeDoctorNotification: async () => {},
      confirmDoctorNotifications: async () => [],
      claimPatientChannelPush: async () => null,
      acknowledgePatientChannelPush: async () => {},
      registerRoom: async () => {},
      registerDoctorRoom: async () => ({ ok: true, roomName: 'doctor room' }),
      getDoctorRoomName: async () => 'doctor room',
    });

    const server = await startServer(routeModule.router);

    try {
      const poll = await getJson(`${server.baseUrl}/patient-push-poll`);
      assert.equal(poll.status, 401);
      assert.deepEqual(poll.body, { error: 'Invalid API Key' });

      const ack = await postJson(`${server.baseUrl}/patient-push-poll/ack`, {
        queueId: 'push-1',
      });
      assert.equal(ack.status, 401);
      assert.deepEqual(ack.body, { error: 'Invalid API Key' });
    } finally {
      await server.close();
      routeModule.restore();
    }
  });
});
