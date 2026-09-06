const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const http = require('node:http');
const express = require('express');

const DB_SERVICE_PATH = path.resolve(__dirname, '../services/dbService.js');
const FOLLOW_UP_SERVICE_PATH = path.resolve(__dirname, '../services/followUpService.js');
const NOTIFY_SERVICE_PATH = path.resolve(__dirname, '../services/notifyService.js');
const EMAIL_SERVICE_PATH = path.resolve(__dirname, '../services/emailService.js');
const DOCTOR_SUMMARY_SERVICE_PATH = path.resolve(__dirname, '../services/doctorSummaryService.js');
const LLM_SERVICE_PATH = path.resolve(__dirname, '../services/llmService.js');
const TRANSLATION_SERVICE_PATH = path.resolve(__dirname, '../services/translationService.js');
const UI_COPY_SERVICE_PATH = path.resolve(__dirname, '../services/uiCopyService.js');
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

async function postForm(url, formData, options = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: options.headers || {},
    body: formData,
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

function createTranslationServiceMock(overrides = {}) {
  return {
    TRANSLATION_PROVIDER: 'google-cloud-translation',
    detectLanguage: async () => 'ko',
    isKoreanLanguage: (language) => String(language || '').toLowerCase() === 'ko',
    translatePatientDataToKorean: async (patientData) => patientData,
    translateText: async (text) => text,
    ...overrides,
  };
}

test('public start UI copy route returns the translated bundle for the selected language', { concurrency: false }, async () => {
  const routeModule = loadRouteWithMocks(PUBLIC_ROUTE_PATH, {
    [DB_SERVICE_PATH]: {},
    [FOLLOW_UP_SERVICE_PATH]: {
      cancelFollowUp: async () => {},
      scheduleFollowUpWithOptions: async () => {},
    },
    [LLM_SERVICE_PATH]: {
      analyzeAndRouteTriage: async () => {
        throw new Error('not used');
      },
    },
    [TRANSLATION_SERVICE_PATH]: createTranslationServiceMock(),
    [UI_COPY_SERVICE_PATH]: {
      getLocalizedStartUiCopy: async (language) => ({
        page: {
          eyebrow: 'Happy Doctor Start',
          title: 'Bat dau tu van truc tuyen',
          description: 'translated description',
          homeLabel: 'Trang chu tieng Anh',
          statusLabel: 'Kiem tra trang thai',
          homeHref: 'https://happydoctor.kr/en',
          heroEyebrow: 'Care Access',
          heroTitle: 'translated hero title',
          heroBody: 'translated hero body',
          infoTitle: 'translated info title',
          infoItems: ['item 1', 'item 2', 'item 3'],
          supportEyebrow: 'How this works',
          supportTitle: 'translated support title',
          supportItems: ['support 1', 'support 2', 'support 3'],
        },
        form: {
          recentEyebrow: 'recent eyebrow',
          recentBody: 'recent {code}',
          recentLink: 'recent link',
          restoredDraft: 'restored draft',
          languageHintEyebrow: 'language hint eyebrow',
          languageHintTitle: 'title {language}',
          languageHintBody: 'body {language}',
          phoneConsentRequired: 'phone required',
          phoneConsentMismatch: 'phone mismatch',
          submitError: 'submit error',
          ageLabel: 'age label',
          agePlaceholder: 'age placeholder',
          genderLabel: 'gender label',
          genderPlaceholder: 'gender placeholder',
          genderOptions: [{ value: 'male', label: 'Nam' }],
          chiefComplaintLabel: 'chief label',
          chiefComplaintPlaceholder: 'chief placeholder',
          onsetLabel: 'onset label',
          onsetPlaceholder: 'onset placeholder',
          nrsLabel: 'nrs label',
          nrsUnknown: 'nrs unknown',
          symptomDetailLabel: 'detail label',
          symptomDetailPlaceholder: 'detail placeholder',
          associatedLabel: 'associated label',
          associatedPlaceholder: 'associated placeholder',
          historyLabel: 'history label',
          historyPlaceholder: 'history placeholder',
          imageLabel: 'image label',
          imageDescription: 'image description',
          imageChooseLabel: 'image choose',
          imageEmptyLabel: 'image empty',
          imageSelectedLabel: '{count} selected',
          notificationTitle: 'notification title',
          notificationDescription: 'notification description',
          phoneLabel: 'phone label',
          phonePlaceholder: 'phone placeholder',
          policyNote: 'policy note',
          submitLoading: 'submit loading',
          submitIdle: 'submit idle',
          englishSupportNote: 'translated support note',
        },
        requestedLanguage: language,
      }),
    },
    [NOTIFY_SERVICE_PATH]: {
      enqueueDoctorNotification: async () => true,
      clearDoctorNotifications: async () => {},
      clearPatientChannelPushes: async () => {},
      clearPatientSmsNotifications: async () => {},
    },
    [CONFIG_PATH]: {
      appSiteUrl: 'https://app.happydoctor.kr',
      getDoctorSummaryConfig: () => ({ enabled: false }),
    },
  });

  const server = await startServer(routeModule.router, '/api/public');

  try {
    const response = await getJson(`${server.baseUrl}/ui-copy/start?lang=vi`);

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.lang, 'vi');
    assert.equal(response.body.copy.page.title, 'Bat dau tu van truc tuyen');
    assert.equal(response.body.copy.form.languageHintTitle, 'title {language}');
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('public create route stores an optional consented notification phone for web consultations', { concurrency: false }, async () => {
  const calls = [];
  const routeModule = loadRouteWithMocks(PUBLIC_ROUTE_PATH, {
    [DB_SERVICE_PATH]: {
      logConsultation: async (userId, patientData, analysisResult, options) => {
        calls.push({ type: 'logConsultation', userId, patientData, analysisResult, options });
        return {
          consultationId: 'consult-create-1',
          trackingCode: 'PCBXWN',
          trackingToken: 'token-1',
        };
      },
      addConsultationImagesById: async () => {
        calls.push({ type: 'addConsultationImagesById' });
        return [];
      },
    },
    [FOLLOW_UP_SERVICE_PATH]: {
      cancelFollowUp: async () => {},
      scheduleFollowUpWithOptions: async (userId, chart, minutes, options) => {
        calls.push({ type: 'scheduleFollowUpWithOptions', userId, chart, minutes, options });
      },
    },
    [LLM_SERVICE_PATH]: {
      analyzeAndRouteTriage: async (patientData) => {
        calls.push({ type: 'analyzeAndRouteTriage', patientData });
        return {
          action: 'AUTONOMOUS_REPLY',
          replyToPatient: 'First reply',
          soapChartForDoctor: 'SOAP',
        };
      },
    },
    [TRANSLATION_SERVICE_PATH]: createTranslationServiceMock(),
    [NOTIFY_SERVICE_PATH]: {
      enqueueDoctorNotification: async (...args) => {
        calls.push({ type: 'enqueueDoctorNotification', args });
        return true;
      },
      clearDoctorNotifications: async () => {},
      clearPatientChannelPushes: async () => {},
      clearPatientSmsNotifications: async () => {},
    },
    [CONFIG_PATH]: {
      appSiteUrl: 'https://app.happydoctor.kr',
      getDoctorSummaryConfig: () => ({ enabled: false }),
    },
  });

  const server = await startServer(routeModule.router, '/api/public');

  try {
    const formData = new FormData();
    formData.append('age', '44');
    formData.append('gender', 'male');
    formData.append('chiefComplaint', 'cough');
    formData.append('onset', 'today');
    formData.append('symptomDetail', 'details about cough');
    formData.append('nrs', '4');
    formData.append('associatedSymptom', 'fatigue');
    formData.append('pastMedicalHistory', 'none');
    formData.append('entrySurface', 'app');
    formData.append('privacyConsent', 'true');
    formData.append('sensitiveInfoConsent', 'true');
    formData.append('adultConfirmed', 'true');
    formData.append('replyNotificationConsent', 'true');
    formData.append('replyNotificationPhone', '010-1234-5678');

    const response = await postForm(`${server.baseUrl}/consultations`, formData);

    assert.equal(response.status, 201, JSON.stringify(response.body));
    assert.equal(response.body.consultationId, 'consult-create-1');
    assert.equal(response.body.statusUrl, 'https://app.happydoctor.kr/status#token=token-1');

    const logCall = calls.find((entry) => entry.type === 'logConsultation');
    assert.ok(logCall);
    assert.equal(logCall.analysisResult.action, 'ESCALATE');
    assert.equal(response.body.status, 'waiting_doctor');
    assert.equal(response.body.requiresDoctorReview, true);
    assert.deepEqual(logCall.options.patientNotificationContact, {
      consented: true,
      phone: '010-1234-5678',
      normalizedPhone: '01012345678',
      email: null,
      normalizedEmail: null,
      source: 'web_start',
    });
    assert.deepEqual(logCall.options.consent, {
      privacy: true,
      sensitiveInfo: true,
      adultConfirmed: true,
    });
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('public create route rejects notification consent without a phone number', { concurrency: false }, async () => {
  const calls = [];
  const routeModule = loadRouteWithMocks(PUBLIC_ROUTE_PATH, {
    [DB_SERVICE_PATH]: {
      logConsultation: async () => {
        calls.push({ type: 'logConsultation' });
        return null;
      },
    },
    [FOLLOW_UP_SERVICE_PATH]: {
      cancelFollowUp: async () => {},
      scheduleFollowUpWithOptions: async () => {},
    },
    [LLM_SERVICE_PATH]: {
      analyzeAndRouteTriage: async () => {
        calls.push({ type: 'analyzeAndRouteTriage' });
        return {
          action: 'AUTONOMOUS_REPLY',
          replyToPatient: 'unused',
        };
      },
    },
    [TRANSLATION_SERVICE_PATH]: createTranslationServiceMock(),
    [NOTIFY_SERVICE_PATH]: {
      enqueueDoctorNotification: async () => true,
      clearDoctorNotifications: async () => {},
      clearPatientChannelPushes: async () => {},
      clearPatientSmsNotifications: async () => {},
    },
    [CONFIG_PATH]: {
      appSiteUrl: 'https://app.happydoctor.kr',
      getDoctorSummaryConfig: () => ({ enabled: false }),
    },
  });

  const server = await startServer(routeModule.router, '/api/public');

  try {
    const formData = new FormData();
    formData.append('age', '44');
    formData.append('gender', 'male');
    formData.append('chiefComplaint', 'cough');
    formData.append('symptomDetail', 'details about cough');
    formData.append('privacyConsent', 'true');
    formData.append('sensitiveInfoConsent', 'true');
    formData.append('adultConfirmed', 'true');
    formData.append('replyNotificationConsent', 'true');

    const response = await postForm(`${server.baseUrl}/consultations`, formData);

    assert.equal(response.status, 400);
    assert.ok(response.body.error);
    assert.deepEqual(calls, []);
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('public create route accepts an email-only reply notification contact', { concurrency: false }, async () => {
  const calls = [];
  const routeModule = loadRouteWithMocks(PUBLIC_ROUTE_PATH, {
    [DB_SERVICE_PATH]: {
      logConsultation: async (userId, patientData, analysisResult, options) => {
        calls.push({ type: 'logConsultation', options });
        return {
          consultationId: 'consult-create-email',
          trackingCode: 'PCBXWM',
          trackingToken: 'token-email',
        };
      },
      addConsultationImagesById: async () => [],
    },
    [FOLLOW_UP_SERVICE_PATH]: {
      cancelFollowUp: async () => {},
      scheduleFollowUpWithOptions: async () => {},
    },
    [LLM_SERVICE_PATH]: {
      analyzeAndRouteTriage: async () => ({
        action: 'ESCALATE',
        replyToPatient: 'First reply',
        soapChartForDoctor: 'SOAP',
      }),
    },
    [TRANSLATION_SERVICE_PATH]: createTranslationServiceMock(),
    [NOTIFY_SERVICE_PATH]: {
      enqueueDoctorNotification: async () => true,
      clearDoctorNotifications: async () => {},
      clearPatientChannelPushes: async () => {},
      clearPatientSmsNotifications: async () => {},
    },
    [CONFIG_PATH]: {
      appSiteUrl: 'https://app.happydoctor.kr',
      getDoctorSummaryConfig: () => ({ enabled: false }),
    },
  });

  const server = await startServer(routeModule.router, '/api/public');

  try {
    const formData = new FormData();
    formData.append('age', '44');
    formData.append('gender', 'male');
    formData.append('chiefComplaint', 'cough');
    formData.append('symptomDetail', 'details about cough');
    formData.append('privacyConsent', 'true');
    formData.append('sensitiveInfoConsent', 'true');
    formData.append('adultConfirmed', 'true');
    formData.append('replyNotificationConsent', 'true');
    formData.append('replyNotificationEmail', ' Patient@Example.COM ');

    const response = await postForm(`${server.baseUrl}/consultations`, formData);

    assert.equal(response.status, 201, JSON.stringify(response.body));

    const logCall = calls.find((entry) => entry.type === 'logConsultation');
    assert.ok(logCall);
    assert.deepEqual(logCall.options.patientNotificationContact, {
      consented: true,
      phone: null,
      normalizedPhone: null,
      email: 'Patient@Example.COM',
      normalizedEmail: 'patient@example.com',
      source: 'web_start',
    });
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('public create route rejects a malformed reply notification email', { concurrency: false }, async () => {
  const calls = [];
  const routeModule = loadRouteWithMocks(PUBLIC_ROUTE_PATH, {
    [DB_SERVICE_PATH]: {
      logConsultation: async () => {
        calls.push({ type: 'logConsultation' });
        return null;
      },
    },
    [FOLLOW_UP_SERVICE_PATH]: {
      cancelFollowUp: async () => {},
      scheduleFollowUpWithOptions: async () => {},
    },
    [LLM_SERVICE_PATH]: {
      analyzeAndRouteTriage: async () => ({ action: 'ESCALATE', replyToPatient: 'unused' }),
    },
    [TRANSLATION_SERVICE_PATH]: createTranslationServiceMock(),
    [NOTIFY_SERVICE_PATH]: {
      enqueueDoctorNotification: async () => true,
      clearDoctorNotifications: async () => {},
      clearPatientChannelPushes: async () => {},
      clearPatientSmsNotifications: async () => {},
    },
    [CONFIG_PATH]: {
      appSiteUrl: 'https://app.happydoctor.kr',
      getDoctorSummaryConfig: () => ({ enabled: false }),
    },
  });

  const server = await startServer(routeModule.router, '/api/public');

  try {
    const formData = new FormData();
    formData.append('age', '44');
    formData.append('gender', 'male');
    formData.append('chiefComplaint', 'cough');
    formData.append('symptomDetail', 'details about cough');
    formData.append('privacyConsent', 'true');
    formData.append('sensitiveInfoConsent', 'true');
    formData.append('adultConfirmed', 'true');
    formData.append('replyNotificationConsent', 'true');
    formData.append('replyNotificationEmail', 'not-an-email');

    const response = await postForm(`${server.baseUrl}/consultations`, formData);

    assert.equal(response.status, 400);
    assert.ok(response.body.error);
    assert.deepEqual(calls, []);
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('public data deletion requires a long token and protects receipt status with a header secret', { concurrency: false }, async () => {
  const calls = [];
  const lookup = 'a'.repeat(48);
  const receiptToken = 'b'.repeat(64);
  const routeModule = loadRouteWithMocks(PUBLIC_ROUTE_PATH, {
    [DB_SERVICE_PATH]: {
      requestPublicDataDeletionByLookup: async (value) => {
        calls.push({ type: 'requestDeletion', value });
        return { requestId: 'delete_request_1', receiptToken, status: 'completed' };
      },
      getPublicDataDeletionRequestStatus: async (requestId, token) => {
        calls.push({ type: 'getDeletion', requestId, token });
        return { requestId, status: 'completed', deletedCounts: { consultations: 1 } };
      },
    },
    [FOLLOW_UP_SERVICE_PATH]: {
      cancelFollowUp: async () => {},
      scheduleFollowUpWithOptions: async () => {},
    },
    [LLM_SERVICE_PATH]: {
      analyzeAndRouteTriage: async () => {
        throw new Error('not used');
      },
    },
    [TRANSLATION_SERVICE_PATH]: createTranslationServiceMock(),
    [UI_COPY_SERVICE_PATH]: {
      getLocalizedStartUiCopy: async () => ({}),
    },
    [NOTIFY_SERVICE_PATH]: {
      enqueueDoctorNotification: async () => true,
      clearDoctorNotifications: async () => {},
      clearPatientChannelPushes: async () => {},
      clearPatientSmsNotifications: async () => {},
    },
    [CONFIG_PATH]: {
      appSiteUrl: 'https://app.happydoctor.kr',
      getDoctorSummaryConfig: () => ({ enabled: false }),
    },
  });

  const server = await startServer(routeModule.router, '/api/public');

  try {
    const shortCodeResponse = await postJson(`${server.baseUrl}/data-deletion-requests`, {
      lookup: 'PCBXWN',
      confirmed: true,
    });
    assert.equal(shortCodeResponse.status, 400);

    const unconfirmedResponse = await postJson(`${server.baseUrl}/data-deletion-requests`, {
      lookup,
      confirmed: false,
    });
    assert.equal(unconfirmedResponse.status, 400);

    const createResponse = await postJson(`${server.baseUrl}/data-deletion-requests`, {
      lookup,
      confirmed: true,
    });
    assert.equal(createResponse.status, 201);
    assert.deepEqual(createResponse.body, {
      requestId: 'delete_request_1',
      receiptToken,
      status: 'completed',
    });

    const missingReceiptResponse = await getJson(
      `${server.baseUrl}/data-deletion-requests/delete_request_1`,
    );
    assert.equal(missingReceiptResponse.status, 400);

    const statusResponse = await getJson(
      `${server.baseUrl}/data-deletion-requests/delete_request_1`,
      { headers: { 'X-Deletion-Receipt-Token': receiptToken } },
    );
    assert.equal(statusResponse.status, 200);
    assert.deepEqual(statusResponse.body, {
      requestId: 'delete_request_1',
      status: 'completed',
      deletedCounts: { consultations: 1 },
    });
    assert.deepEqual(calls, [
      { type: 'requestDeletion', value: lookup },
      { type: 'getDeletion', requestId: 'delete_request_1', token: receiptToken },
    ]);
  } finally {
    await server.close();
    routeModule.restore();
  }
});

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
    [TRANSLATION_SERVICE_PATH]: createTranslationServiceMock(),
    [NOTIFY_SERVICE_PATH]: {
      enqueueDoctorNotification: async (message, userId, options) => {
        calls.push({ type: 'enqueueDoctorNotification', message, userId, options });
        return true;
      },
      clearDoctorNotifications: async () => {},
      clearPatientChannelPushes: async (userId, pushType) => {
        calls.push({ type: 'clearPatientChannelPushes', userId, pushType });
      },
      clearPatientSmsNotifications: async (userId, pushType) => {
        calls.push({ type: 'clearPatientSmsNotifications', userId, pushType });
      },
    },
    [CONFIG_PATH]: {
      appSiteUrl: 'https://app.happydoctor.kr',
      getDoctorSummaryConfig: () => ({ enabled: false }),
    },
  });

  const server = await startServer(routeModule.router, '/api/public');

  try {
    const response = await postJson(
      `${server.baseUrl}/consultations/status/follow-up`,
      { question: '열이 계속 나요?' },
      { headers: { 'X-Consultation-Lookup': 'PCBXWN' } },
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
      { type: 'clearPatientSmsNotifications', userId: 'public_user_1', pushType: 'doctor_reply' },
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
    [TRANSLATION_SERVICE_PATH]: createTranslationServiceMock(),
    [NOTIFY_SERVICE_PATH]: {
      enqueueDoctorNotification: async () => true,
      clearDoctorNotifications: async () => {},
      clearPatientChannelPushes: async (userId, pushType) => {
        calls.push({ type: 'clearPatientChannelPushes', userId, pushType });
      },
      clearPatientSmsNotifications: async (userId, pushType) => {
        calls.push({ type: 'clearPatientSmsNotifications', userId, pushType });
      },
    },
    [CONFIG_PATH]: {
      appSiteUrl: 'https://app.happydoctor.kr',
      getDoctorSummaryConfig: () => ({ enabled: false }),
    },
  });

  const server = await startServer(routeModule.router, '/api/public');

  try {
    const response = await getJson(`${server.baseUrl}/consultations/status`, {
      headers: { 'X-Consultation-Lookup': 'PCBXWN' },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.status, 'doctor_replied');
    assert.equal(response.body.doctorReplies.length, 1);

    assert.deepEqual(calls, [
      { type: 'getAcknowledgedPublicConsultationStatusByLookup', lookup: 'PCBXWN' },
      { type: 'clearPatientChannelPushes', userId: 'public_user_status_1', pushType: 'doctor_reply' },
      { type: 'clearPatientSmsNotifications', userId: 'public_user_status_1', pushType: 'doctor_reply' },
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
    [TRANSLATION_SERVICE_PATH]: createTranslationServiceMock(),
    [NOTIFY_SERVICE_PATH]: {
      enqueueDoctorNotification: async () => true,
      clearDoctorNotifications: async (userId) => {
        calls.push({ type: 'clearDoctorNotifications', userId });
      },
      clearPatientChannelPushes: async (userId, pushType) => {
        calls.push({ type: 'clearPatientChannelPushes', userId, pushType });
      },
      clearPatientSmsNotifications: async (userId, pushType) => {
        calls.push({ type: 'clearPatientSmsNotifications', userId, pushType });
      },
    },
    [CONFIG_PATH]: {
      appSiteUrl: 'https://app.happydoctor.kr',
      getDoctorSummaryConfig: () => ({ enabled: false }),
    },
  });

  const server = await startServer(routeModule.router, '/api/public');

  try {
    const response = await postJson(
      `${server.baseUrl}/consultations/status/close`,
      { reason: '상담 종료' },
      { headers: { 'X-Consultation-Lookup': 'PCBXWN' } },
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.consultation.status, 'closed');

    assert.deepEqual(calls, [
      { type: 'closeConsultation', lookup: 'PCBXWN', reason: '상담 종료' },
      { type: 'cancelFollowUp', userId: 'public_user_2' },
      { type: 'clearDoctorNotifications', userId: 'public_user_2' },
      { type: 'clearPatientChannelPushes', userId: 'public_user_2', pushType: 'doctor_reply' },
      { type: 'clearPatientSmsNotifications', userId: 'public_user_2', pushType: 'doctor_reply' },
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
    [TRANSLATION_SERVICE_PATH]: createTranslationServiceMock(),
    [NOTIFY_SERVICE_PATH]: {
      enqueueDoctorNotification: async () => true,
      clearDoctorNotifications: async () => {},
      clearPatientChannelPushes: async () => {},
      clearPatientSmsNotifications: async () => {},
    },
    [CONFIG_PATH]: {
      appSiteUrl: 'https://app.happydoctor.kr',
      getDoctorSummaryConfig: () => ({ enabled: false }),
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

test('public status route rate-limits repeated failed lookup attempts', { concurrency: false }, async () => {
  const calls = [];
  const routeModule = loadRouteWithMocks(PUBLIC_ROUTE_PATH, {
    [DB_SERVICE_PATH]: {
      getAcknowledgedPublicConsultationStatusByLookup: async (lookup) => {
        calls.push(lookup);
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
    [TRANSLATION_SERVICE_PATH]: createTranslationServiceMock(),
    [NOTIFY_SERVICE_PATH]: {
      enqueueDoctorNotification: async () => true,
      clearDoctorNotifications: async () => {},
      clearPatientChannelPushes: async () => {},
      clearPatientSmsNotifications: async () => {},
    },
    [CONFIG_PATH]: {
      appSiteUrl: 'https://app.happydoctor.kr',
      getDoctorSummaryConfig: () => ({ enabled: false }),
    },
  });

  const server = await startServer(routeModule.router, '/api/public');

  try {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await getJson(`${server.baseUrl}/consultations/status/AAAAA${attempt}`);
      assert.equal(response.status, 404);
    }

    const blockedResponse = await getJson(`${server.baseUrl}/consultations/status/BBBBB0`);
    assert.equal(blockedResponse.status, 429);
    assert.match(blockedResponse.body.error, /조회 시도/);
    assert.equal(calls.length, 10);
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
      enqueuePatientSmsNotification: async (userId, phoneNumber, message, pushType, options) => {
        calls.push({ type: 'enqueuePatientSmsNotification', userId, phoneNumber, message, pushType, options });
        return true;
      },
      clearPatientChannelPushes: async (userId, pushType) => {
        calls.push({ type: 'clearPatientChannelPushes', userId, pushType });
      },
      clearPatientSmsNotifications: async (userId, pushType) => {
        calls.push({ type: 'clearPatientSmsNotifications', userId, pushType });
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
    assert.equal(response.body.ok, true);
    assert.equal(response.body.replyId, 'reply-1');

    const pushCall = calls.find((entry) => entry.type === 'enqueuePatientChannelPush');
    assert.equal(pushCall.userId, 'public_user_3');
    assert.equal(pushCall.pushType, 'doctor_reply');
    assert.deepEqual(pushCall.options, { reminderDelaysMinutes: [0, 5, 15] });
    assert.match(pushCall.message, /김의사/);
    assert.match(pushCall.message, /흉통이 지속되면 오늘 진료 보세요\./);
    assert.match(pushCall.message, /https:\/\/app\.happydoctor\.kr\/status#token=token-1/);
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
      { type: 'clearPatientSmsNotifications', userId: 'public_user_3', pushType: 'doctor_reply' },
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

test('portal reply route falls back to SMS queue for consented web contacts when no Kakao room is registered', { concurrency: false }, async () => {
  const calls = [];
  const routeModule = loadRouteWithMocks(PORTAL_ROUTE_PATH, {
    [DB_SERVICE_PATH]: {
      getConsultationById: async (consultationId) => {
        calls.push({ type: 'getConsultationById', consultationId });
        return {
          id: consultationId,
          userId: 'public_user_sms',
          aiAction: 'ESCALATE',
          status: 'ACTIVE',
          patientNotificationContact: {
            consented: true,
            phone: '010-1234-5678',
            normalizedPhone: '01012345678',
          },
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
        return 'reply-sms-1';
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
                name: '源?섏궗',
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
        return false;
      },
      enqueuePatientSmsNotification: async (userId, phoneNumber, message, pushType, options) => {
        calls.push({ type: 'enqueuePatientSmsNotification', userId, phoneNumber, message, pushType, options });
        return true;
      },
      clearPatientChannelPushes: async (userId, pushType) => {
        calls.push({ type: 'clearPatientChannelPushes', userId, pushType });
      },
      clearPatientSmsNotifications: async (userId, pushType) => {
        calls.push({ type: 'clearPatientSmsNotifications', userId, pushType });
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
      `${server.baseUrl}/consultations/consult-sms/reply`,
      { message: '?됲넻??吏?띾릺硫??ㅻ뒛 吏꾨즺 蹂댁꽭??' },
      {
        headers: {
          Authorization: 'Bearer portal-token',
        },
      },
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.replyId, 'reply-sms-1');
    assert.deepEqual(response.body.notifiedChannels, ['sms']);

    const pushCall = calls.find((entry) => entry.type === 'enqueuePatientChannelPush');
    const smsCall = calls.find((entry) => entry.type === 'enqueuePatientSmsNotification');

    assert.ok(pushCall);
    assert.ok(smsCall);
    assert.equal(smsCall.userId, 'public_user_sms');
    assert.equal(smsCall.phoneNumber, '01012345678');
    assert.equal(smsCall.pushType, 'doctor_reply');
    assert.deepEqual(smsCall.options, { reminderDelaysMinutes: [0, 5, 15] });
    assert.ok(smsCall.message.includes('[해피닥터]'));
    assert.ok(smsCall.message.includes('답변'));
    assert.ok(smsCall.message.split('\n').length >= 4);
    assert.match(smsCall.message, /https:\/\/app\.happydoctor\.kr\/status#token=token-1/);
    assert.match(smsCall.message, /PCBXWN/);

    assert.deepEqual(calls, [
      { type: 'verifyIdToken', token: 'portal-token' },
      { type: 'getDoctorAccessRecordByEmail', email: 'doctor@example.com' },
      {
        type: 'ensureApprovedDoctorAccess',
        doctor: {
          uid: 'doctor-uid',
          email: 'doctor@example.com',
          name: '源?섏궗',
        },
      },
      { type: 'getConsultationById', consultationId: 'consult-sms' },
      {
        type: 'saveDoctorReply',
        consultationId: 'consult-sms',
        userId: 'public_user_sms',
        message: '?됲넻??吏?띾릺硫??ㅻ뒛 吏꾨즺 蹂댁꽭??',
        doctorName: '源?섏궗',
        doctorEmail: 'doctor@example.com',
      },
      { type: 'getConsultationTrackingById', consultationId: 'consult-sms' },
      { type: 'clearPatientChannelPushes', userId: 'public_user_sms', pushType: 'doctor_reply' },
      { type: 'clearPatientSmsNotifications', userId: 'public_user_sms', pushType: 'doctor_reply' },
      pushCall,
      smsCall,
      { type: 'cancelFollowUp', userId: 'public_user_sms' },
      { type: 'clearDoctorNotifications', userId: 'public_user_sms' },
      { type: 'awardHDT', email: 'doctor@example.com', name: '源?섏궗', points: 50, reason: 'reply' },
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

test('portal reply route mails the patient alongside the other channels, not only as a last resort', { concurrency: false }, async () => {
  const calls = [];
  const routeModule = loadRouteWithMocks(PORTAL_ROUTE_PATH, {
    [DB_SERVICE_PATH]: {
      getActiveConsultations: async () => ({ consultations: [], total: 0 }),
      getConsultationSummary: async () => ({ pending: 0, replied: 0, closed: 0, followUp: 0 }),
      getConsultationById: async () => ({
        id: 'consult-both',
        userId: 'public_user_both',
        status: 'ACTIVE',
        aiAction: 'ESCALATE',
        uiLanguage: 'ko',
        patientReplyLanguage: 'ko',
        patientNotificationContact: {
          consented: true,
          normalizedPhone: '01012345678',
          normalizedEmail: 'patient@example.com',
        },
      }),
      saveDoctorReply: async () => 'reply-both-1',
      getConsultationTrackingById: async () => ({ trackingCode: 'PCBXWN', trackingToken: 'token-1' }),
      awardHDT: async () => {},
      getDoctorStats: async () => null,
      getAdmin: () => ({
        auth() {
          return {
            verifyIdToken: async () => ({ uid: 'doctor-uid', email: 'doctor@example.com', name: '김의사' }),
          };
        },
      }),
      getDoctorAccessRecordByEmail: async () => null,
      upsertDoctorAccessRequest: async () => null,
      ensureApprovedDoctorAccess: async (doctor) => ({ status: 'approved', email: doctor.email }),
      approveDoctorAccessRequest: async () => null,
      listPendingDoctorAccessRequests: async () => [],
      HDT_REPLY: 50,
    },
    [NOTIFY_SERVICE_PATH]: {
      // The Kakao channel succeeds here; mail must still go out.
      enqueuePatientChannelPush: async () => true,
      enqueuePatientSmsNotification: async () => {
        calls.push({ type: 'enqueuePatientSmsNotification' });
        return true;
      },
      clearPatientChannelPushes: async () => {},
      clearPatientSmsNotifications: async () => {},
      clearDoctorNotifications: async () => {},
      clearOperatorUnansweredAlerts: async () => {},
    },
    [EMAIL_SERVICE_PATH]: {
      isConfigured: () => true,
      sendPatientReplyEmail: async (payload) => {
        calls.push({ type: 'sendPatientReplyEmail', to: payload.to, text: payload.text });
        return true;
      },
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
    const response = await postJson(
      `${server.baseUrl}/consultations/consult-both/reply`,
      { message: '경과를 지켜봐 주세요.' },
      { headers: { Authorization: 'Bearer portal-token' } },
    );

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.notifiedChannels, ['kakao', 'email']);

    const mailCall = calls.find((entry) => entry.type === 'sendPatientReplyEmail');
    assert.ok(mailCall, 'the patient must be mailed even though Kakao succeeded');
    assert.equal(mailCall.to, 'patient@example.com');
    assert.match(mailCall.text, /경과를 지켜봐 주세요\./);
    assert.match(mailCall.text, /PCBXWN/);
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('the AI summary is stored on the consultation and never reaches the doctor alert', { concurrency: false }, async () => {
  const calls = [];
  const routeModule = loadRouteWithMocks(PUBLIC_ROUTE_PATH, {
    [DB_SERVICE_PATH]: {
      logConsultation: async () => ({
        consultationId: 'consult-summary-1',
        trackingCode: 'PCBXWN',
        trackingToken: 'token-1',
      }),
      addConsultationImagesById: async () => [],
      saveAiDoctorSummary: async (consultationId, summary) => {
        calls.push({ type: 'saveAiDoctorSummary', consultationId, summary });
        return true;
      },
    },
    [FOLLOW_UP_SERVICE_PATH]: {
      cancelFollowUp: async () => {},
      scheduleFollowUpWithOptions: async () => {},
    },
    [LLM_SERVICE_PATH]: {
      analyzeAndRouteTriage: async () => ({
        action: 'ESCALATE',
        replyToPatient: '상담 내용이 접수되었습니다.',
        soapChartForDoctor: ['[해피닥터] 새 상담 접수', '긴급도: 자동 분류하지 않음 - 의료진 확인 필요'].join('\n'),
      }),
      buildDoctorReviewNotice: () => '[해피닥터] 새 상담 접수',
    },
    [DOCTOR_SUMMARY_SERVICE_PATH]: {
      isEnabled: () => true,
      generateSafely: async (patientData) => {
        calls.push({ type: 'generateSafely', cc: patientData.cc });
        return { text: ['S: 기침 3일째', 'A: 상기도 감염 가능성 확인 필요'].join('\n'), status: 'ready' };
      },
    },
    [TRANSLATION_SERVICE_PATH]: createTranslationServiceMock(),
    [NOTIFY_SERVICE_PATH]: {
      enqueueDoctorNotification: async (message) => {
        calls.push({ type: 'enqueueDoctorNotification', message });
        return true;
      },
      clearDoctorNotifications: async () => {},
      clearPatientChannelPushes: async () => {},
      clearPatientSmsNotifications: async () => {},
    },
    [CONFIG_PATH]: { appSiteUrl: 'https://app.happydoctor.kr' },
  });

  const server = await startServer(routeModule.router, '/api/public');

  try {
    const formData = new FormData();
    formData.append('age', '44');
    formData.append('gender', 'male');
    formData.append('chiefComplaint', '기침이 3일째 납니다');
    formData.append('symptomDetail', '밤에 심해집니다');
    formData.append('privacyConsent', 'true');
    formData.append('sensitiveInfoConsent', 'true');
    formData.append('adultConfirmed', 'true');

    const response = await postForm(`${server.baseUrl}/consultations`, formData);
    assert.equal(response.status, 201, JSON.stringify(response.body));

    // The summary is produced after the patient is answered.
    await new Promise((resolve) => setTimeout(resolve, 50));

    const saveCall = calls.find((entry) => entry.type === 'saveAiDoctorSummary');
    assert.ok(saveCall, 'the summary must be stored on the consultation');
    assert.equal(saveCall.consultationId, 'consult-summary-1');
    assert.match(saveCall.summary.text, /상기도 감염 가능성 확인 필요/);

    // The alert still carries nothing clinical: it travels through KakaoTalk
    // and ordinary inboxes.
    const alertCall = calls.find((entry) => entry.type === 'enqueueDoctorNotification');
    assert.ok(alertCall);
    assert.match(alertCall.message, /자동 분류하지 않음/);
    assert.doesNotMatch(alertCall.message, /기침|상기도 감염/);

    // Nor does the patient receive any of it.
    assert.doesNotMatch(response.body.replyToPatient, /상기도 감염/);
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('portal reject route marks a pending doctor rejected and drops it from the queue', { concurrency: false }, async () => {
  const calls = [];
  const routeModule = loadRouteWithMocks(PORTAL_ROUTE_PATH, {
    [DB_SERVICE_PATH]: {
      getActiveConsultations: async () => ({ consultations: [], total: 0 }),
      getConsultationSummary: async () => ({ pending: 0, replied: 0, closed: 0, followUp: 0 }),
      getConsultationById: async () => null,
      saveDoctorReply: async () => null,
      getConsultationTrackingById: async () => null,
      awardHDT: async () => {},
      getDoctorStats: async () => null,
      getAdmin: () => ({
        auth() {
          return {
            verifyIdToken: async () => ({ uid: 'admin-uid', email: 'admin@happydoctor.kr', name: '대표' }),
          };
        },
      }),
      getDoctorAccessRecordByEmail: async () => ({ email: 'admin@happydoctor.kr', status: 'approved' }),
      upsertDoctorAccessRequest: async () => null,
      ensureApprovedDoctorAccess: async (doctor) => ({ status: 'approved', email: doctor.email }),
      approveDoctorAccessRequest: async () => null,
      rejectDoctorAccessRequest: async (email, reviewer, reason) => {
        calls.push({ type: 'reject', email, reviewer: reviewer?.email, reason });
        return { email, status: 'rejected', rejectionReason: reason };
      },
      listPendingDoctorAccessRequests: async () => [],
      HDT_REPLY: 50,
    },
    [NOTIFY_SERVICE_PATH]: {
      enqueuePatientChannelPush: async () => true,
      clearDoctorNotifications: async () => {},
    },
    [FOLLOW_UP_SERVICE_PATH]: { cancelFollowUp: async () => {} },
    [CONFIG_PATH]: {
      appSiteUrl: 'https://app.happydoctor.kr',
      getDoctorSummaryConfig: () => ({ enabled: false }),
      getAllowedDoctorEmails: () => ['admin@happydoctor.kr'],
      getPortalAdminEmails: () => ['admin@happydoctor.kr'],
    },
  });

  const server = await startServer(routeModule.router, '/api/portal');

  try {
    const response = await postJson(
      `${server.baseUrl}/admin/doctor-requests/nsb0927%40gmail.com/reject`,
      { reason: '연락이 닿지 않음' },
      { headers: { Authorization: 'Bearer portal-token' } },
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.rejected.status, 'rejected');
    assert.deepEqual(response.body.pendingRequests, []);

    const rejectCall = calls.find((entry) => entry.type === 'reject');
    assert.equal(rejectCall.email, 'nsb0927@gmail.com');
    assert.equal(rejectCall.reviewer, 'admin@happydoctor.kr');
    assert.equal(rejectCall.reason, '연락이 닿지 않음');
  } finally {
    await server.close();
    routeModule.restore();
  }
});

test('rejecting someone who is not pending answers 404 rather than inventing a record', { concurrency: false }, async () => {
  const routeModule = loadRouteWithMocks(PORTAL_ROUTE_PATH, {
    [DB_SERVICE_PATH]: {
      getActiveConsultations: async () => ({ consultations: [], total: 0 }),
      getConsultationSummary: async () => ({ pending: 0, replied: 0, closed: 0, followUp: 0 }),
      getConsultationById: async () => null,
      saveDoctorReply: async () => null,
      getConsultationTrackingById: async () => null,
      awardHDT: async () => {},
      getDoctorStats: async () => null,
      getAdmin: () => ({
        auth() {
          return {
            verifyIdToken: async () => ({ uid: 'admin-uid', email: 'admin@happydoctor.kr', name: '대표' }),
          };
        },
      }),
      getDoctorAccessRecordByEmail: async () => ({ email: 'admin@happydoctor.kr', status: 'approved' }),
      upsertDoctorAccessRequest: async () => null,
      ensureApprovedDoctorAccess: async (doctor) => ({ status: 'approved', email: doctor.email }),
      approveDoctorAccessRequest: async () => null,
      rejectDoctorAccessRequest: async () => null,
      listPendingDoctorAccessRequests: async () => [],
      HDT_REPLY: 50,
    },
    [NOTIFY_SERVICE_PATH]: {
      enqueuePatientChannelPush: async () => true,
      clearDoctorNotifications: async () => {},
    },
    [FOLLOW_UP_SERVICE_PATH]: { cancelFollowUp: async () => {} },
    [CONFIG_PATH]: {
      appSiteUrl: 'https://app.happydoctor.kr',
      getDoctorSummaryConfig: () => ({ enabled: false }),
      getAllowedDoctorEmails: () => ['admin@happydoctor.kr'],
      getPortalAdminEmails: () => ['admin@happydoctor.kr'],
    },
  });

  const server = await startServer(routeModule.router, '/api/portal');

  try {
    const response = await postJson(
      `${server.baseUrl}/admin/doctor-requests/nobody%40example.com/reject`,
      {},
      { headers: { Authorization: 'Bearer portal-token' } },
    );

    assert.equal(response.status, 404);
  } finally {
    await server.close();
    routeModule.restore();
  }
});
