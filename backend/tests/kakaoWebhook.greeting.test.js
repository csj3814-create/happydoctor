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

function buildMocks({ trackingCalls, tracking = null, followUps = [], alerts = [], drafts = [], pending = null }) {
  return {
    [DB_SERVICE_PATH]: {
      getPendingDoctorReply: async () => pending,
      appendPublicFollowUpQuestionByLookup: async (lookup, question, options) => {
        followUps.push({ lookup, question, options });
        return {
          consultationId: tracking?.consultationId || null,
          userId: 'kakao-user-1',
          question,
          translatedQuestionKo: null,
          doctorNotificationMessage: `추가 질문: ${question}`,
        };
      },
      getLatestConsultationTracking: async (userId, options) => {
        trackingCalls.push({ userId, options });
        return tracking;
      },
      getConsultationTrackingById: async () => null,
      markReplyAsSeen: async () => {},
      awardHDT: async () => {},
      closeConsultation: async () => true,
      HDT_SEEN: 50,
    },
    [NOTIFY_SERVICE_PATH]: {
      enqueueDoctorNotification: async (message, userId, options) => {
        alerts.push({ message, userId, options });
        return true;
      },
      clearDoctorNotifications: async () => {},
      clearPatientChannelPushes: async () => {},
      clearPatientSmsNotifications: async () => {},
      clearOperatorUnansweredAlerts: async () => 0,
    },
    [FOLLOW_UP_SERVICE_PATH]: { scheduleFollowUpWithOptions: async () => {}, cancelFollowUp: async () => {} },
    [SCHEDULER_PATH]: { scheduleDoctorSummary: () => {}, scheduleFollowUpDraft: (id, q) => { drafts.push({ id, q }); } },
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

    // One lookup, shared by the follow-up path and the status link.
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
    // A greeting is not a question, so this reaches the greeting and its link.
    const { text } = await postUtterance(server.baseUrl, '안녕하세요');

    assert.match(text, /진행 상태 확인하기/);
    assert.match(text, /status#token=token-abc/);
    assert.match(text, /직접 입력 코드: MRK7U8/);
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('closing a consultation carries the support notice and says it is optional', { concurrency: false }, async () => {
  const trackingCalls = [];
  const routeModule = loadKakaoRoute(buildMocks({ trackingCalls }));
  const server = await startServer(routeModule.router);

  try {
    const response = await fetch(`${server.baseUrl}/close-consultation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userRequest: { user: { id: 'kakao-user-1' }, utterance: '상담종료' },
        action: { params: { close_reason: '증상 호전' }, detailParams: {} },
      }),
    });

    const body = await response.json();
    const text = body?.template?.outputs?.[0]?.simpleText?.text || '';

    assert.equal(response.status, 200);
    assert.match(text, /신한은행 100-034-864699/);
    // This service exists for people who cannot easily pay for care, so the
    // ask has to carry its own way out.
    assert.match(text, /후원은 의무가 아닙니다/);
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('a phone number typed into the channel becomes the reply contact', { concurrency: false }, async () => {
  const saved = [];
  const trackingCalls = [];
  const mocks = buildMocks({ trackingCalls });
  mocks[DB_SERVICE_PATH].savePatientNotificationContactByUserId = async (userId, contact) => {
    saved.push({ userId, contact });
    return 'consult-open';
  };

  const routeModule = loadKakaoRoute(mocks);
  const server = await startServer(routeModule.router);

  try {
    const { status, text } = await postUtterance(server.baseUrl, '010-1234-5678');

    assert.equal(status, 200);
    assert.equal(saved.length, 1);
    assert.equal(saved[0].contact.normalizedPhone, '01012345678');
    assert.equal(saved[0].contact.consented, true);
    assert.equal(saved[0].contact.source, 'kakao_channel');
    // Echoed back masked: a channel conversation can be read over a shoulder.
    assert.match(text, /010-\*\*\*\*-5678/);
    assert.doesNotMatch(text, /1234-5678(?!\s)/);
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('a sentence that merely mentions a number is not taken as a contact', { concurrency: false }, async () => {
  const saved = [];
  const trackingCalls = [];
  const mocks = buildMocks({ trackingCalls });
  mocks[DB_SERVICE_PATH].savePatientNotificationContactByUserId = async (userId, contact) => {
    saved.push({ userId, contact });
    return 'consult-open';
  };

  const routeModule = loadKakaoRoute(mocks);
  const server = await startServer(routeModule.router);

  try {
    const { text } = await postUtterance(server.baseUrl, '3일째 열이 38도까지 올라요');

    assert.deepEqual(saved, []);
    // Falls through to the ordinary greeting.
    assert.match(text, /상담 시작/);
  } finally {
    await server.close();
    routeModule.restore();
  }
});

// 23 November: a patient answered at 11:18 asked about the answer at 13:48 by
// starting a new consultation, because typing a question here only got
// "상담 시작을 눌러 주세요". The clinician opening the new one saw no trace of
// the reply already sent.
const OPEN_TRACKING = { consultationId: 'consult-open', trackingToken: 'token-abc', trackingCode: 'MRK7U8' };

test('a question typed with an open consultation goes onto that consultation', { concurrency: false }, async () => {
  const followUps = [];
  const alerts = [];
  const drafts = [];
  const routeModule = loadKakaoRoute(buildMocks({ trackingCalls: [], tracking: OPEN_TRACKING, followUps, alerts, drafts }));
  const server = await startServer(routeModule.router);

  try {
    const { text } = await postUtterance(server.baseUrl, '응급실에 가야 하는 상황인가요?');

    // Filed the way a web patient's follow-up is, on the same consultation.
    assert.deepEqual(followUps, [{
      lookup: 'token-abc',
      question: '응급실에 가야 하는 상황인가요?',
      options: { source: 'kakao_channel' },
    }]);
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].options.type, 'patient_follow_up_question');
    assert.equal(alerts[0].options.priority, 'high');
    assert.deepEqual(drafts, [{ id: 'consult-open', q: '응급실에 가야 하는 상황인가요?' }]);

    assert.match(text, /추가 질문을 의료진에게 전달했습니다/);
    // A different problem can still start fresh.
    assert.match(text, /새로 상담하시려면 \[상담 시작\]/);
    assert.doesNotMatch(text, /상담 시작 후 다시 한 번 적어 주세요/);
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('without an open consultation, a typed symptom is still sent to 상담 시작', { concurrency: false }, async () => {
  const followUps = [];
  const alerts = [];
  const routeModule = loadKakaoRoute(buildMocks({ trackingCalls: [], tracking: null, followUps, alerts }));
  const server = await startServer(routeModule.router);

  try {
    const { text } = await postUtterance(server.baseUrl, '어제부터 배가 아파요');

    assert.deepEqual(followUps, []);
    assert.deepEqual(alerts, []);
    assert.match(text, /\[상담 시작\]을 눌러 상담을 시작해 주세요/);
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('a thank-you is acknowledged without paging anyone', { concurrency: false }, async () => {
  const followUps = [];
  const alerts = [];
  const routeModule = loadKakaoRoute(buildMocks({ trackingCalls: [], tracking: OPEN_TRACKING, followUps, alerts }));
  const server = await startServer(routeModule.router);

  try {
    for (const thanks of ['감사합니다', '네 알겠습니다', 'Thank you']) {
      // eslint-disable-next-line no-await-in-loop
      const { text } = await postUtterance(server.baseUrl, thanks);
      assert.match(text, /확인했습니다/);
    }
    assert.deepEqual(followUps, []);
    assert.deepEqual(alerts, []);
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('a question that starts politely is still a question', { concurrency: false }, async () => {
  const followUps = [];
  const routeModule = loadKakaoRoute(buildMocks({ trackingCalls: [], tracking: OPEN_TRACKING, followUps }));
  const server = await startServer(routeModule.router);

  try {
    // Starts like a thank-you, but asks something.
    await postUtterance(server.baseUrl, '네 그런데 약은 계속 먹어도 되나요?');
    await postUtterance(server.baseUrl, '감사합니다 혹시 내일 가도 될까요');
    assert.equal(followUps.length, 2);
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('a waiting reply is delivered first, and the typed text is not silently dropped', { concurrency: false }, async () => {
  const followUps = [];
  const routeModule = loadKakaoRoute(buildMocks({
    trackingCalls: [],
    tracking: OPEN_TRACKING,
    followUps,
    pending: { id: 'reply-1', consultationId: 'consult-open', doctorName: '김의사', message: '신경과 진료를 받아보세요.' },
  }));
  const server = await startServer(routeModule.router);

  try {
    const { text } = await postUtterance(server.baseUrl, '어느 병원으로 가야 하나요?');

    assert.match(text, /의료진 답변이 도착했습니다/);
    assert.match(text, /신경과 진료를 받아보세요/);
    // The answer may already cover it, so it is not filed - but they are told.
    assert.deepEqual(followUps, []);
    assert.match(text, /답변을 읽어 보신 뒤에도 궁금하시면 다시 적어/);
    // And the way to ask a follow-up is now spelled out.
    assert.match(text, /더 궁금한 점은 이 채널에 그대로 적어 보내 주세요/);
  } finally {
    await server.close();
    routeModule.restore();
  }
});

// The first live test: two questions twenty seconds apart, and the full
// guidance - link, code and preview card - came back after each one.
function buildBurstMocks({ previousPatientQuestionAtMs, doctorRepliedAtMs }) {
  const mocks = buildMocks({ trackingCalls: [], tracking: OPEN_TRACKING });
  mocks[DB_SERVICE_PATH].appendPublicFollowUpQuestionByLookup = async (lookup, question) => ({
    consultationId: 'consult-open',
    userId: 'kakao-user-1',
    question,
    translatedQuestionKo: null,
    doctorNotificationMessage: question,
    previousPatientQuestionAtMs,
    doctorRepliedAtMs,
  });
  return mocks;
}

test('a question following another within the burst gets one short line', { concurrency: false }, async () => {
  const routeModule = loadKakaoRoute(buildBurstMocks({
    previousPatientQuestionAtMs: Date.now() - 20 * 1000,
    doctorRepliedAtMs: null,
  }));
  const server = await startServer(routeModule.router);

  try {
    const { text } = await postUtterance(server.baseUrl, '언제까지 기다리나요?');
    assert.equal(text, '이어서 보내주신 내용도 의료진에게 함께 전달했습니다.');
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('the full guidance returns once a reply has come or the burst is over', { concurrency: false }, async () => {
  const cases = [
    // Answered since the last question: this one starts a new wait.
    { previousPatientQuestionAtMs: Date.now() - 10 * 60 * 1000, doctorRepliedAtMs: Date.now() - 5 * 60 * 1000 },
    // Asked long ago.
    { previousPatientQuestionAtMs: Date.now() - 2 * 60 * 60 * 1000, doctorRepliedAtMs: null },
    // The first question on this consultation.
    { previousPatientQuestionAtMs: null, doctorRepliedAtMs: null },
  ];

  for (const timing of cases) {
    const routeModule = loadKakaoRoute(buildBurstMocks(timing));
    // eslint-disable-next-line no-await-in-loop
    const server = await startServer(routeModule.router);
    try {
      // eslint-disable-next-line no-await-in-loop
      const { text } = await postUtterance(server.baseUrl, '약은 계속 먹어도 되나요?');
      assert.match(text, /추가 질문을 의료진에게 전달했습니다/);
      assert.match(text, /진행 상태 확인하기/);
    } finally {
      // eslint-disable-next-line no-await-in-loop
      await server.close();
      routeModule.restore();
    }
  }
});

async function postIntake(baseUrl, params) {
  const response = await fetch(`${baseUrl}/triage-complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userRequest: { user: { id: 'kakao-user-1' }, utterance: '완료' },
      action: { params, detailParams: {} },
    }),
  });
  const body = await response.json();
  return (body?.template?.outputs || []).map((output) => output?.simpleText?.text || '');
}

function buildIntakeMocks() {
  const mocks = buildMocks({ trackingCalls: [] });
  mocks[DB_SERVICE_PATH].logConsultation = async () => ({ consultationId: 'consult-new', trackingToken: 'token-new', trackingCode: 'NEW123' });
  mocks[FOLLOW_UP_SERVICE_PATH] = {
    consumePendingFollowUp: async () => null,
    resetSession: async () => {},
    scheduleFollowUpWithOptions: async () => {},
    cancelFollowUp: async () => {},
  };
  return mocks;
}

const INTAKE_PARAMS = { chief_complaint: '두통', age: '30대', gender: '남성', onset: '어제', symptom_detail: '욱신거림', nrs: '5' };

test('the contact request is its own bubble and says what not leaving one means', { concurrency: false }, async () => {
  const routeModule = loadKakaoRoute(buildIntakeMocks());
  const server = await startServer(routeModule.router);

  try {
    const outputs = await postIntake(server.baseUrl, INTAKE_PARAMS);

    assert.equal(outputs.length, 2);
    assert.match(outputs[0], /상담 내용이 접수되었습니다/);
    assert.doesNotMatch(outputs[0], /알려드릴까요/);
    // 3 of 16 KakaoTalk patients left a number when this trailed the link.
    assert.match(outputs[1], /답변이 오면 문자로 알려드릴까요/);
    assert.match(outputs[1], /먼저 메시지를 보낼 수 없어서/);
    // The old prompt offered the status link as the alternative.
    assert.doesNotMatch(outputs[1], /위 링크로 언제든/);
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('a patient who gave a number during intake is not asked for one again', { concurrency: false }, async () => {
  const routeModule = loadKakaoRoute(buildIntakeMocks());
  const server = await startServer(routeModule.router);

  try {
    const outputs = await postIntake(server.baseUrl, { ...INTAKE_PARAMS, reply_notification_phone: '010-1234-5678' });
    assert.equal(outputs.length, 1);
    assert.doesNotMatch(outputs[0], /알려드릴까요/);
  } finally {
    await server.close();
    routeModule.restore();
  }
});
