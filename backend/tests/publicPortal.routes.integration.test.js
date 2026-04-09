const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const http = require('node:http');
const express = require('express');

const DB_SERVICE_PATH = path.resolve(__dirname, '../services/dbService.js');
const FOLLOW_UP_SERVICE_PATH = path.resolve(__dirname, '../services/followUpService.js');
const NOTIFY_SERVICE_PATH = path.resolve(__dirname, '../services/notifyService.js');
const LLM_SERVICE_PATH = path.resolve(__dirname, '../services/llmService.js');
const CONFIG_PATH = path.resolve(__dirname, '../config.js');
const PUBLIC_ROUTE_PATH = path.resolve(__dirname, '../routes/public.js');
const PORTAL_ROUTE_PATH = path.resolve(__dirname, '../routes/portal.js');

function createModuleRecord(modulePath, exports) {
  return {
    id: modulePath,
    filename: modulePath,
    loaded: true,
    exports,
  };
}

function loadRouteWithMocks(routePath, mocks) {
  const originalRoute = require.cache[routePath];
  const originalMocks = new Map();

  delete require.cache[routePath];

  Object.entries(mocks).forEach(([modulePath, exports]) => {
    originalMocks.set(modulePath, require.cache[modulePath]);
    require.cache[modulePath] = createModuleRecord(modulePath, exports);
  });

  const router = require(routePath);

  return {
    router,
    restore() {
      delete require.cache[routePath];
      if (originalRoute) {
        require.cache[routePath] = originalRoute;
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

async function startServer(router, mountPath) {
  const app = express();
  app.use(express.json());
  app.use(mountPath, router);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}${mountPath}`;

  return {
    baseUrl,
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
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

test('public follow-up route appends the question, queues a doctor notification, and returns fresh status', { concurrency: false }, async () => {
  const calls = [];
  const routeModule = loadRouteWithMocks(PUBLIC_ROUTE_PATH, {
    [DB_SERVICE_PATH]: {
      appendPublicFollowUpQuestionByLookup: async (lookup, question, options) => {
        calls.push({ type: 'appendFollowUp', lookup, question, options });
        return {
          doctorNotificationMessage: 'doctor follow-up summary',
          userId: 'public_user_1',
        };
      },
      getPublicConsultationStatusByLookup: async (lookup) => {
        calls.push({ type: 'loadStatus', lookup });
        return {
          lookup,
          status: 'waiting_doctor',
          followUps: [{ question: '열이 계속 나요?' }],
        };
      },
    },
    [FOLLOW_UP_SERVICE_PATH]: {
      cancelFollowUp: async () => {},
      scheduleFollowUpWithOptions: async () => {},
    },
    [LLM_SERVICE_PATH]: {
      analyzeAndRouteTriage: async () => {
        throw new Error('not_used');
      },
    },
    [NOTIFY_SERVICE_PATH]: {
      enqueueDoctorNotification: async (message, userId, options) => {
        calls.push({ type: 'enqueueDoctorNotification', message, userId, options });
        return true;
      },
      clearDoctorNotifications: async () => {},
      clearPatientChannelPushes: async (userId, pushType) => {
        calls.push({ type: 'clearPatientChannelPushes', userId, pushType });
      },
    },
    [CONFIG_PATH]: {
      appSiteUrl: 'https://app.happydoctor.kr',
    },
  });

  const server = await startServer(routeModule.router, '/api/public');

  try {
    const response = await postJson(
      `${server.baseUrl}/consultations/status/PCBXWN/follow-up`,
      { question: '열이 계속 나요?' },
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.consultation.status, 'waiting_doctor');

    assert.deepEqual(calls, [
      {
        type: 'appendFollowUp',
        lookup: 'PCBXWN',
        question: '열이 계속 나요?',
        options: { source: 'web_status' },
      },
      {
        type: 'enqueueDoctorNotification',
        message: 'doctor follow-up summary',
        userId: 'public_user_1',
        options: {
          type: 'patient_follow_up_question',
          priority: 'high',
          reminderDelaysMinutes: [0, 5, 15],
        },
      },
      { type: 'clearPatientChannelPushes', userId: 'public_user_1', pushType: 'doctor_reply' },
      {
        type: 'loadStatus',
        lookup: 'PCBXWN',
      },
    ]);
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('public status route acknowledges doctor replies and clears queued reply reminders when the patient opens the status page', { concurrency: false }, async () => {
  const calls = [];
  const routeModule = loadRouteWithMocks(PUBLIC_ROUTE_PATH, {
    [DB_SERVICE_PATH]: {
      getAcknowledgedPublicConsultationStatusByLookup: async (lookup) => {
        calls.push({ type: 'getAcknowledgedPublicConsultationStatusByLookup', lookup });
        return {
          userId: 'public_user_status_1',
          consultation: {
            consultationId: 'consult-1',
            status: 'doctor_replied',
            doctorReplies: [
              {
                id: 'reply-1',
                message: '의료진 답변',
                seen: true,
              },
            ],
          },
        };
      },
    },
    [FOLLOW_UP_SERVICE_PATH]: {
      cancelFollowUp: async () => {},
      scheduleFollowUpWithOptions: async () => {},
    },
    [LLM_SERVICE_PATH]: {
      analyzeAndRouteTriage: async () => {
        throw new Error('not_used');
      },
    },
    [NOTIFY_SERVICE_PATH]: {
      enqueueDoctorNotification: async () => true,
      clearDoctorNotifications: async () => {},
      clearPatientChannelPushes: async (userId, pushType) => {
        calls.push({ type: 'clearPatientChannelPushes', userId, pushType });
      },
    },
    [CONFIG_PATH]: {
      appSiteUrl: 'https://app.happydoctor.kr',
    },
  });

  const server = await startServer(routeModule.router, '/api/public');

  try {
    const response = await getJson(`${server.baseUrl}/consultations/status/PCBXWN`);

    assert.equal(response.status, 200);
    assert.equal(response.body.status, 'doctor_replied');
    assert.equal(response.body.doctorReplies.length, 1);

    assert.deepEqual(calls, [
      { type: 'getAcknowledgedPublicConsultationStatusByLookup', lookup: 'PCBXWN' },
      { type: 'clearPatientChannelPushes', userId: 'public_user_status_1', pushType: 'doctor_reply' },
    ]);
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('public close route clears durable follow-up and reply delivery state before returning updated consultation', { concurrency: false }, async () => {
  const calls = [];
  const routeModule = loadRouteWithMocks(PUBLIC_ROUTE_PATH, {
    [DB_SERVICE_PATH]: {
      closePublicConsultationByLookup: async (lookup, reason) => {
        calls.push({ type: 'closeConsultation', lookup, reason });
        return { userId: 'public_user_2' };
      },
      getPublicConsultationStatusByLookup: async (lookup) => {
        calls.push({ type: 'loadStatus', lookup });
        return {
          lookup,
          status: 'closed',
          closeReason: '상담 종료',
        };
      },
    },
    [FOLLOW_UP_SERVICE_PATH]: {
      cancelFollowUp: async (userId) => {
        calls.push({ type: 'cancelFollowUp', userId });
      },
      scheduleFollowUpWithOptions: async () => {},
    },
    [LLM_SERVICE_PATH]: {
      analyzeAndRouteTriage: async () => {
        throw new Error('not_used');
      },
    },
    [NOTIFY_SERVICE_PATH]: {
      enqueueDoctorNotification: async () => true,
      clearDoctorNotifications: async (userId) => {
        calls.push({ type: 'clearDoctorNotifications', userId });
      },
      clearPatientChannelPushes: async (userId, pushType) => {
        calls.push({ type: 'clearPatientChannelPushes', userId, pushType });
      },
    },
    [CONFIG_PATH]: {
      appSiteUrl: 'https://app.happydoctor.kr',
    },
  });

  const server = await startServer(routeModule.router, '/api/public');

  try {
    const response = await postJson(
      `${server.baseUrl}/consultations/status/PCBXWN/close`,
      { reason: '상담 종료' },
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.consultation.status, 'closed');

    assert.deepEqual(calls, [
      { type: 'closeConsultation', lookup: 'PCBXWN', reason: '상담 종료' },
      { type: 'cancelFollowUp', userId: 'public_user_2' },
      { type: 'clearDoctorNotifications', userId: 'public_user_2' },
      { type: 'clearPatientChannelPushes', userId: 'public_user_2', pushType: 'doctor_reply' },
      { type: 'loadStatus', lookup: 'PCBXWN' },
    ]);
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('public status routes reject malformed lookup values before hitting the database', { concurrency: false }, async () => {
  const calls = [];
  const routeModule = loadRouteWithMocks(PUBLIC_ROUTE_PATH, {
    [DB_SERVICE_PATH]: {
      getPublicConsultationStatusByLookup: async (lookup) => {
        calls.push({ type: 'getPublicConsultationStatusByLookup', lookup });
        return null;
      },
      appendPublicFollowUpQuestionByLookup: async () => {
        calls.push({ type: 'appendPublicFollowUpQuestionByLookup' });
        return null;
      },
    },
    [FOLLOW_UP_SERVICE_PATH]: {
      cancelFollowUp: async () => {},
      scheduleFollowUpWithOptions: async () => {},
    },
    [LLM_SERVICE_PATH]: {
      analyzeAndRouteTriage: async () => {
        throw new Error('not_used');
      },
    },
    [NOTIFY_SERVICE_PATH]: {
      enqueueDoctorNotification: async () => true,
      clearDoctorNotifications: async () => {},
      clearPatientChannelPushes: async () => {},
    },
    [CONFIG_PATH]: {
      appSiteUrl: 'https://app.happydoctor.kr',
    },
  });

  const server = await startServer(routeModule.router, '/api/public');

  try {
    const statusResponse = await getJson(`${server.baseUrl}/consultations/status/bad%20lookup`);
    assert.equal(statusResponse.status, 400);
    assert.match(statusResponse.body.error, /조회 코드 형식/);

    const followUpResponse = await postJson(
      `${server.baseUrl}/consultations/status/bad%20lookup/follow-up`,
      { question: '열이 계속 나요?' },
    );
    assert.equal(followUpResponse.status, 400);
    assert.match(followUpResponse.body.error, /조회 코드 형식/);

    assert.deepEqual(calls, []);
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('portal consultation list route validates query params and returns pagination metadata', { concurrency: false }, async () => {
  const calls = [];
  const routeModule = loadRouteWithMocks(PORTAL_ROUTE_PATH, {
    [DB_SERVICE_PATH]: {
      getActiveConsultations: async (options) => {
        calls.push({ type: 'getActiveConsultations', options });
        return {
          consultations: [
            {
              id: 'consult-1',
              userId: 'public_user_4',
              patientData: {
                age: '44세',
                gender: '남성',
                cc: '흉통',
                symptom: '어제부터 답답합니다.',
                associated: '숨차요',
                pmhx: '없음',
                nrs: '8',
              },
              aiAction: 'ESCALATE',
              status: 'ACTIVE',
              createdAt: new Date('2026-04-09T00:00:00.000Z'),
            },
          ],
          total: 21,
        };
      },
      getConsultationSummary: async () => ({ pending: 0, replied: 0, closed: 0, followUp: 0 }),
      getConsultationById: async () => null,
      saveDoctorReply: async () => 'reply-1',
      getConsultationTrackingById: async () => null,
      awardHDT: async () => {},
      getDoctorStats: async () => null,
      getAdmin: () => ({
        auth() {
          return {
            verifyIdToken: async (token) => {
              calls.push({ type: 'verifyIdToken', token });
              return {
                uid: 'doctor-uid',
                email: 'doctor@example.com',
                name: '김의사',
              };
            },
          };
        },
      }),
      getDoctorAccessRecordByEmail: async (email) => {
        calls.push({ type: 'getDoctorAccessRecordByEmail', email });
        return null;
      },
      upsertDoctorAccessRequest: async () => null,
      ensureApprovedDoctorAccess: async (doctor) => {
        calls.push({ type: 'ensureApprovedDoctorAccess', doctor });
        return {
          status: 'approved',
          email: doctor.email,
        };
      },
      approveDoctorAccessRequest: async () => null,
      listPendingDoctorAccessRequests: async () => [],
      HDT_REPLY: 50,
    },
    [NOTIFY_SERVICE_PATH]: {
      enqueuePatientChannelPush: async () => true,
      clearDoctorNotifications: async () => {},
    },
    [FOLLOW_UP_SERVICE_PATH]: {
      cancelFollowUp: async () => {},
    },
    [CONFIG_PATH]: {
      appSiteUrl: 'https://app.happydoctor.kr',
      getAllowedDoctorEmails: () => ['doctor@example.com'],
      getPortalAdminEmails: () => [],
    },
  });

  const server = await startServer(routeModule.router, '/api/portal');

  try {
    const listResponse = await getJson(
      `${server.baseUrl}/consultations?status=followup&search=%ED%9D%89%ED%86%B5&offset=12&limit=5`,
      {
        headers: {
          Authorization: 'Bearer portal-token',
        },
      },
    );

    assert.equal(listResponse.status, 200);
    assert.equal(listResponse.body.total, 21);
    assert.equal(listResponse.body.offset, 12);
    assert.equal(listResponse.body.limit, 5);
    assert.equal(listResponse.body.status, 'followup');
    assert.equal(listResponse.body.search, '흉통');
    assert.equal(listResponse.body.returned, 1);
    assert.equal(listResponse.body.hasMore, true);

    assert.deepEqual(calls, [
      { type: 'verifyIdToken', token: 'portal-token' },
      { type: 'getDoctorAccessRecordByEmail', email: 'doctor@example.com' },
      {
        type: 'ensureApprovedDoctorAccess',
        doctor: {
          uid: 'doctor-uid',
          email: 'doctor@example.com',
          name: '김의사',
        },
      },
      {
        type: 'getActiveConsultations',
        options: {
          status: 'followup',
          search: '흉통',
          offset: 12,
          limit: 5,
        },
      },
    ]);

    const invalidResponse = await getJson(
      `${server.baseUrl}/consultations?status=weird&limit=-1`,
      {
        headers: {
          Authorization: 'Bearer portal-token',
        },
      },
    );

    assert.equal(invalidResponse.status, 400);
    assert.match(invalidResponse.body.error, /조회 상태/);
    assert.equal(calls.length, 7);
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('portal reply route authenticates the doctor and enqueues the patient reply push with the status link', { concurrency: false }, async () => {
  const calls = [];
  const routeModule = loadRouteWithMocks(PORTAL_ROUTE_PATH, {
    [DB_SERVICE_PATH]: {
      getConsultationById: async (consultationId) => {
        calls.push({ type: 'getConsultationById', consultationId });
        return {
          id: consultationId,
          userId: 'public_user_3',
          aiAction: 'ESCALATE',
          status: 'ACTIVE',
        };
      },
      saveDoctorReply: async (consultationId, userId, message, doctorName, doctorEmail) => {
        calls.push({
          type: 'saveDoctorReply',
          consultationId,
          userId,
          message,
          doctorName,
          doctorEmail,
        });
        return 'reply-1';
      },
      getConsultationTrackingById: async (consultationId) => {
        calls.push({ type: 'getConsultationTrackingById', consultationId });
        return {
          trackingCode: 'PCBXWN',
          trackingToken: 'token-1',
        };
      },
      awardHDT: async (email, name, points, reason) => {
        calls.push({ type: 'awardHDT', email, name, points, reason });
      },
      getDoctorStats: async () => null,
      getAdmin: () => ({
        auth() {
          return {
            verifyIdToken: async (token) => {
              calls.push({ type: 'verifyIdToken', token });
              return {
                uid: 'doctor-uid',
                email: 'doctor@example.com',
                name: '김의사',
              };
            },
          };
        },
      }),
      getDoctorAccessRecordByEmail: async (email) => {
        calls.push({ type: 'getDoctorAccessRecordByEmail', email });
        return null;
      },
      ensureApprovedDoctorAccess: async (doctor) => {
        calls.push({ type: 'ensureApprovedDoctorAccess', doctor });
        return {
          status: 'approved',
          email: doctor.email,
        };
      },
      upsertDoctorAccessRequest: async () => {
        throw new Error('not_used');
      },
      approveDoctorAccessRequest: async () => {
        throw new Error('not_used');
      },
      listPendingDoctorAccessRequests: async () => [],
      HDT_REPLY: 50,
    },
    [NOTIFY_SERVICE_PATH]: {
      enqueuePatientChannelPush: async (userId, message, pushType, options) => {
        calls.push({ type: 'enqueuePatientChannelPush', userId, message, pushType, options });
        return true;
      },
      clearPatientChannelPushes: async (userId, pushType) => {
        calls.push({ type: 'clearPatientChannelPushes', userId, pushType });
      },
      clearDoctorNotifications: async (userId) => {
        calls.push({ type: 'clearDoctorNotifications', userId });
      },
    },
    [FOLLOW_UP_SERVICE_PATH]: {
      cancelFollowUp: async (userId) => {
        calls.push({ type: 'cancelFollowUp', userId });
      },
    },
    [CONFIG_PATH]: {
      appSiteUrl: 'https://app.happydoctor.kr',
      getAllowedDoctorEmails: () => ['doctor@example.com'],
      getPortalAdminEmails: () => [],
    },
  });

  const server = await startServer(routeModule.router, '/api/portal');

  try {
    const response = await postJson(
      `${server.baseUrl}/consultations/consult-1/reply`,
      { message: '흉통이 지속되면 오늘 진료 보세요.' },
      {
        headers: {
          Authorization: 'Bearer portal-token',
        },
      },
    );

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { ok: true, replyId: 'reply-1' });

    const pushCall = calls.find((entry) => entry.type === 'enqueuePatientChannelPush');
    assert.equal(pushCall.userId, 'public_user_3');
    assert.equal(pushCall.pushType, 'doctor_reply');
    assert.deepEqual(pushCall.options, { reminderDelaysMinutes: [0, 5, 15] });
    assert.match(pushCall.message, /김의사/);
    assert.match(pushCall.message, /흉통이 지속되면 오늘 진료 보세요\./);
    assert.match(pushCall.message, /https:\/\/app\.happydoctor\.kr\/status\?code=PCBXWN/);
    assert.match(pushCall.message, /PCBXWN/);

    assert.deepEqual(calls, [
      { type: 'verifyIdToken', token: 'portal-token' },
      { type: 'getDoctorAccessRecordByEmail', email: 'doctor@example.com' },
      {
        type: 'ensureApprovedDoctorAccess',
        doctor: {
          uid: 'doctor-uid',
          email: 'doctor@example.com',
          name: '김의사',
        },
      },
      { type: 'getConsultationById', consultationId: 'consult-1' },
      {
        type: 'saveDoctorReply',
        consultationId: 'consult-1',
        userId: 'public_user_3',
        message: '흉통이 지속되면 오늘 진료 보세요.',
        doctorName: '김의사',
        doctorEmail: 'doctor@example.com',
      },
      { type: 'getConsultationTrackingById', consultationId: 'consult-1' },
      { type: 'clearPatientChannelPushes', userId: 'public_user_3', pushType: 'doctor_reply' },
      pushCall,
      { type: 'cancelFollowUp', userId: 'public_user_3' },
      { type: 'clearDoctorNotifications', userId: 'public_user_3' },
      { type: 'awardHDT', email: 'doctor@example.com', name: '김의사', points: 50, reason: 'reply' },
    ]);
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('portal detail and reply routes hide non-escalated consultations from the doctor portal', { concurrency: false }, async () => {
  const calls = [];
  const routeModule = loadRouteWithMocks(PORTAL_ROUTE_PATH, {
    [DB_SERVICE_PATH]: {
      getActiveConsultations: async () => ({ consultations: [], total: 0 }),
      getConsultationSummary: async () => ({ pending: 0, replied: 0, closed: 0, followUp: 0 }),
      getConsultationById: async (consultationId) => {
        calls.push({ type: 'getConsultationById', consultationId });
        return {
          id: consultationId,
          userId: 'public_user_hidden',
          aiAction: 'AUTONOMOUS_REPLY',
          status: 'ACTIVE',
        };
      },
      saveDoctorReply: async () => {
        calls.push({ type: 'saveDoctorReply' });
        return 'reply-should-not-happen';
      },
      getConsultationTrackingById: async () => {
        calls.push({ type: 'getConsultationTrackingById' });
        return null;
      },
      awardHDT: async () => {
        calls.push({ type: 'awardHDT' });
      },
      getDoctorStats: async () => null,
      getAdmin: () => ({
        auth() {
          return {
            verifyIdToken: async (token) => {
              calls.push({ type: 'verifyIdToken', token });
              return {
                uid: 'doctor-uid',
                email: 'doctor@example.com',
                name: '김의사',
              };
            },
          };
        },
      }),
      getDoctorAccessRecordByEmail: async (email) => {
        calls.push({ type: 'getDoctorAccessRecordByEmail', email });
        return null;
      },
      ensureApprovedDoctorAccess: async (doctor) => {
        calls.push({ type: 'ensureApprovedDoctorAccess', doctor });
        return {
          status: 'approved',
          email: doctor.email,
        };
      },
      upsertDoctorAccessRequest: async () => null,
      approveDoctorAccessRequest: async () => null,
      listPendingDoctorAccessRequests: async () => [],
      HDT_REPLY: 50,
    },
    [NOTIFY_SERVICE_PATH]: {
      enqueuePatientChannelPush: async () => {
        calls.push({ type: 'enqueuePatientChannelPush' });
        return true;
      },
      clearDoctorNotifications: async () => {
        calls.push({ type: 'clearDoctorNotifications' });
      },
    },
    [FOLLOW_UP_SERVICE_PATH]: {
      cancelFollowUp: async () => {
        calls.push({ type: 'cancelFollowUp' });
      },
    },
    [CONFIG_PATH]: {
      appSiteUrl: 'https://app.happydoctor.kr',
      getAllowedDoctorEmails: () => ['doctor@example.com'],
      getPortalAdminEmails: () => [],
    },
  });

  const server = await startServer(routeModule.router, '/api/portal');

  try {
    const detailResponse = await getJson(`${server.baseUrl}/consultations/consult-hidden`, {
      headers: { Authorization: 'Bearer portal-token' },
    });

    assert.equal(detailResponse.status, 404);
    assert.match(detailResponse.body.error, /상담을 찾을 수 없습니다/);

    const replyResponse = await postJson(
      `${server.baseUrl}/consultations/consult-hidden/reply`,
      { message: '답변' },
      { headers: { Authorization: 'Bearer portal-token' } },
    );

    assert.equal(replyResponse.status, 404);
    assert.match(replyResponse.body.error, /상담을 찾을 수 없습니다/);
    assert.deepEqual(calls, [
      { type: 'verifyIdToken', token: 'portal-token' },
      { type: 'getDoctorAccessRecordByEmail', email: 'doctor@example.com' },
      {
        type: 'ensureApprovedDoctorAccess',
        doctor: {
          uid: 'doctor-uid',
          email: 'doctor@example.com',
          name: '김의사',
        },
      },
      { type: 'getConsultationById', consultationId: 'consult-hidden' },
      { type: 'verifyIdToken', token: 'portal-token' },
      { type: 'getDoctorAccessRecordByEmail', email: 'doctor@example.com' },
      {
        type: 'ensureApprovedDoctorAccess',
        doctor: {
          uid: 'doctor-uid',
          email: 'doctor@example.com',
          name: '김의사',
        },
      },
      { type: 'getConsultationById', consultationId: 'consult-hidden' },
    ]);
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('portal reply route rejects closed consultations before saving a new doctor reply', { concurrency: false }, async () => {
  const calls = [];
  const routeModule = loadRouteWithMocks(PORTAL_ROUTE_PATH, {
    [DB_SERVICE_PATH]: {
      getActiveConsultations: async () => ({ consultations: [], total: 0 }),
      getConsultationSummary: async () => ({ pending: 0, replied: 0, closed: 0, followUp: 0 }),
      getConsultationById: async (consultationId) => {
        calls.push({ type: 'getConsultationById', consultationId });
        return {
          id: consultationId,
          userId: 'public_user_closed',
          aiAction: 'ESCALATE',
          status: 'COMPLETED',
          closedAt: '2026-04-10T00:00:00.000Z',
        };
      },
      saveDoctorReply: async () => {
        calls.push({ type: 'saveDoctorReply' });
        return 'reply-should-not-happen';
      },
      getConsultationTrackingById: async () => {
        calls.push({ type: 'getConsultationTrackingById' });
        return null;
      },
      awardHDT: async () => {
        calls.push({ type: 'awardHDT' });
      },
      getDoctorStats: async () => null,
      getAdmin: () => ({
        auth() {
          return {
            verifyIdToken: async (token) => {
              calls.push({ type: 'verifyIdToken', token });
              return {
                uid: 'doctor-uid',
                email: 'doctor@example.com',
                name: '김의사',
              };
            },
          };
        },
      }),
      getDoctorAccessRecordByEmail: async (email) => {
        calls.push({ type: 'getDoctorAccessRecordByEmail', email });
        return null;
      },
      ensureApprovedDoctorAccess: async (doctor) => {
        calls.push({ type: 'ensureApprovedDoctorAccess', doctor });
        return {
          status: 'approved',
          email: doctor.email,
        };
      },
      upsertDoctorAccessRequest: async () => null,
      approveDoctorAccessRequest: async () => null,
      listPendingDoctorAccessRequests: async () => [],
      HDT_REPLY: 50,
    },
    [NOTIFY_SERVICE_PATH]: {
      enqueuePatientChannelPush: async () => {
        calls.push({ type: 'enqueuePatientChannelPush' });
        return true;
      },
      clearDoctorNotifications: async () => {
        calls.push({ type: 'clearDoctorNotifications' });
      },
    },
    [FOLLOW_UP_SERVICE_PATH]: {
      cancelFollowUp: async () => {
        calls.push({ type: 'cancelFollowUp' });
      },
    },
    [CONFIG_PATH]: {
      appSiteUrl: 'https://app.happydoctor.kr',
      getAllowedDoctorEmails: () => ['doctor@example.com'],
      getPortalAdminEmails: () => [],
    },
  });

  const server = await startServer(routeModule.router, '/api/portal');

  try {
    const response = await postJson(
      `${server.baseUrl}/consultations/consult-closed/reply`,
      { message: '답변' },
      { headers: { Authorization: 'Bearer portal-token' } },
    );

    assert.equal(response.status, 400);
    assert.match(response.body.error, /종료된 상담/);
    assert.deepEqual(calls, [
      { type: 'verifyIdToken', token: 'portal-token' },
      { type: 'getDoctorAccessRecordByEmail', email: 'doctor@example.com' },
      {
        type: 'ensureApprovedDoctorAccess',
        doctor: {
          uid: 'doctor-uid',
          email: 'doctor@example.com',
          name: '김의사',
        },
      },
      { type: 'getConsultationById', consultationId: 'consult-closed' },
    ]);
  } finally {
    await server.close();
    routeModule.restore();
  }
});
