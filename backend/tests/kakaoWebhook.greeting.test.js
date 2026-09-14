const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const http = require('node:http');
const express = require('express');

const ROUTE_PATH = path.resolve(__dirname, '../routes/kakaoWebhook.js');
const DB_SERVICE_PATH = path.resolve(__dirname, '../services/dbService.js');
const NOTIFY_SERVICE_PATH = path.resolve(__dirname, '../services/notifyService.js');
const FOLLOW_UP_SERVICE_PATH = path.resolve(__dirname, '../services/followUpService.js');
const SCHEDULER_PATH = path.resolve(__dirname, '../services/doctorSummaryScheduler.js');
const CONFIG_PATH = path.resolve(__dirname, '../config.js');

function createModuleRecord(modulePath, exports) {
  return { id: modulePath, filename: modulePath, loaded: true, exports };
}

function loadKakaoRoute(mocks) {
  const originals = new Map();
  delete require.cache[ROUTE_PATH];

  Object.entries(mocks).forEach(([modulePath, exports]) => {
    originals.set(modulePath, require.cache[modulePath]);
    require.cache[modulePath] = createModuleRecord(modulePath, exports);
  });

  const router = require(ROUTE_PATH);

  return {
    router,
    restore() {
      delete require.cache[ROUTE_PATH];
      originals.forEach((cached, modulePath) => {
        if (cached) require.cache[modulePath] = cached;
        else delete require.cache[modulePath];
      });
    },
  };
}

async function startServer(router) {
  const app = express();
  app.use(express.json());
  app.use('/kakao', router);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  return {
    baseUrl: `http://127.0.0.1:${server.address().port}/kakao`,
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

async function postUtterance(baseUrl, utterance) {
  const response = await fetch(`${baseUrl}/check-doctor-reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userRequest: { user: { id: 'kakao-user-1' }, utterance },
      action: { params: {}, detailParams: {} },
    }),
  });

  const body = await response.json();
  return { status: response.status, text: body?.template?.outputs?.[0]?.simpleText?.text || '' };
}

function buildMocks({ trackingCalls, tracking = null }) {
  return {
    [DB_SERVICE_PATH]: {
      getPendingDoctorReply: async () => null,
      getLatestConsultationTracking: async (userId, options) => {
        trackingCalls.push({ userId, options });
        return tracking;
      },
      getConsultationTrackingById: async () => null,
      markReplyAsSeen: async () => {},
      awardHDT: async () => {},
      HDT_SEEN: 50,
    },
    [NOTIFY_SERVICE_PATH]: {
      enqueueDoctorNotification: async () => true,
      clearDoctorNotifications: async () => {},
      clearPatientChannelPushes: async () => {},
      clearPatientSmsNotifications: async () => {},
      clearOperatorUnansweredAlerts: async () => 0,
    },
    [FOLLOW_UP_SERVICE_PATH]: { scheduleFollowUpWithOptions: async () => {}, cancelFollowUp: async () => {} },
    [SCHEDULER_PATH]: { scheduleDoctorSummary: () => {} },
    [CONFIG_PATH]: {
      appSiteUrl: 'https://app.happydoctor.kr',
      ConfigurationError: class ConfigurationError extends Error {},
      getMessengerApiKey: () => 'test-key',
    },
  };
}

test('the greeting repeats what the patient said and sends them to 상담 시작', { concurrency: false }, async () => {
  const trackingCalls = [];
  const routeModule = loadKakaoRoute(buildMocks({ trackingCalls }));
  const server = await startServer(routeModule.router);

  try {
    const { status, text } = await postUtterance(server.baseUrl, '온 몸이 아파요');

    assert.equal(status, 200);
    // The patient described a symptom; the reply has to show it was heard.
    assert.match(text, /"온 몸이 아파요"라고 말씀해 주셨네요/);
    assert.match(text, /\[상담 시작\]을 눌러 상담을 시작해 주세요/);
    // And it must not leave them believing the symptom is already filed.
    assert.match(text, /상담 시작 후 다시 한 번 적어 주세요/);
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('a button label is not quoted back as if it were a symptom', { concurrency: false }, async () => {
  const trackingCalls = [];
  const routeModule = loadKakaoRoute(buildMocks({ trackingCalls }));
  const server = await startServer(routeModule.router);

  try {
    const { text } = await postUtterance(server.baseUrl, '상담 시작');

    assert.doesNotMatch(text, /말씀해 주셨네요/);
    assert.doesNotMatch(text, /다시 한 번 적어 주세요/);
    assert.match(text, /\[상담 시작\]을 눌러 상담을 시작해 주세요/);
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('the greeting asks only for an open, recent consultation before offering a status link', { concurrency: false }, async () => {
  const trackingCalls = [];
  const routeModule = loadKakaoRoute(buildMocks({ trackingCalls }));
  const server = await startServer(routeModule.router);

  try {
    const { text } = await postUtterance(server.baseUrl, '머리가 아파요');

    assert.equal(trackingCalls.length, 1);
    assert.equal(trackingCalls[0].options.requireOpen, true);
    assert.ok(trackingCalls[0].options.maxAgeMs > 0);
    // Nothing qualified, so no link: a months-old answered case is not
    // "the thing you are waiting on".
    assert.doesNotMatch(text, /진행 상태 확인하기/);
    assert.doesNotMatch(text, /직접 입력 코드/);
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('an open consultation still gets its status link', { concurrency: false }, async () => {
  const trackingCalls = [];
  const routeModule = loadKakaoRoute(buildMocks({
    trackingCalls,
    tracking: { consultationId: 'consult-open', trackingToken: 'token-abc', trackingCode: 'MRK7U8' },
  }));
  const server = await startServer(routeModule.router);

  try {
    const { text } = await postUtterance(server.baseUrl, '목이 아파요');

    assert.match(text, /진행 상태 확인하기/);
    assert.match(text, /status#token=token-abc/);
    assert.match(text, /직접 입력 코드: MRK7U8/);
  } finally {
    await server.close();
    routeModule.restore();
  }
});
