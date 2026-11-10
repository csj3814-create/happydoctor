const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');

const CONFIG_PATH = path.join(__dirname, '..', 'config.js');
const DB_SERVICE_PATH = path.join(__dirname, '..', 'services', 'dbService.js');
const EMAIL_SERVICE_PATH = path.join(__dirname, '..', 'services', 'emailService.js');
const DIGEST_SERVICE_PATH = path.join(__dirname, '..', 'services', 'unansweredDigestService.js');

function loadDigestServiceWithMocks({ config, dbService, emailService }) {
  const originalLoad = Module._load;

  Module._load = function patchedLoad(request, parent, isMain) {
    const resolved = (() => {
      try {
        return Module._resolveFilename(request, parent, isMain);
      } catch (error) {
        return request;
      }
    })();

    if (resolved === CONFIG_PATH) return { getUnansweredDigestConfig: () => config };
    if (resolved === DB_SERVICE_PATH) return dbService;
    if (resolved === EMAIL_SERVICE_PATH) return emailService;

    return originalLoad(request, parent, isMain);
  };

  delete require.cache[DIGEST_SERVICE_PATH];

  try {
    return require(DIGEST_SERVICE_PATH);
  } finally {
    Module._load = originalLoad;
    delete require.cache[DIGEST_SERVICE_PATH];
  }
}

const DEFAULT_CONFIG = Object.freeze({
  enabled: true,
  hourKst: 9,
  checkIntervalMs: 15 * 60 * 1000,
  maxItems: 50,
});

// A single shared doc guards the daily send; the fake reproduces its
// read-then-write transaction so restarts inside the window can be exercised.
function createFakeDb(initialState = null) {
  const state = { value: initialState };

  return {
    state,
    getDb: () => ({
      collection: () => ({
        doc: () => ({ __digestDoc: true }),
      }),
      runTransaction: async (handler) => handler({
        get: async () => ({
          exists: state.value !== null,
          data: () => state.value,
        }),
        set: (ref, value) => {
          state.value = { ...(state.value || {}), ...value };
        },
      }),
    }),
  };
}

// The digest reads two tabs: consultations nobody has answered, and ones where
// an answered patient has asked something new.
function createConsultationsStub({
  pending = { total: 0, consultations: [] },
  followup = { total: 0, consultations: [] },
} = {}) {
  return async (options = {}) => (options.status === 'followup' ? followup : pending);
}

function createEmailServiceSpy(sent) {
  return {
    isConfigured: () => true,
    sendUnansweredDigestEmail: async (payload) => {
      sent.push(payload);
      return true;
    },
  };
}

test('the digest only fires during the configured KST hour', { concurrency: false }, async () => {
  const sent = [];
  const fakeDb = createFakeDb();
  const digest = loadDigestServiceWithMocks({
    config: DEFAULT_CONFIG,
    dbService: {
      ...fakeDb,
      getActiveConsultations: createConsultationsStub({ pending: { total: 3, consultations: [] } }),
    },
    emailService: createEmailServiceSpy(sent),
  });

  // 2026-09-01T23:30Z is 08:30 KST on 2026-09-02 - outside the 09:00 window.
  assert.equal(await digest.runOnce(new Date('2026-09-01T23:30:00Z')), false);
  assert.deepEqual(sent, []);

  // 2026-09-02T00:10Z is 09:10 KST - inside the window.
  assert.equal(await digest.runOnce(new Date('2026-09-02T00:10:00Z')), true);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].total, 3);
});

test('a restart inside the digest hour does not send a second mail', { concurrency: false }, async () => {
  const sent = [];
  const fakeDb = createFakeDb();
  const digest = loadDigestServiceWithMocks({
    config: DEFAULT_CONFIG,
    dbService: {
      ...fakeDb,
      getActiveConsultations: createConsultationsStub({ pending: { total: 2, consultations: [] } }),
    },
    emailService: createEmailServiceSpy(sent),
  });

  assert.equal(await digest.runOnce(new Date('2026-09-02T00:05:00Z')), true);
  assert.equal(await digest.runOnce(new Date('2026-09-02T00:45:00Z')), false);
  assert.equal(sent.length, 1);
  assert.equal(fakeDb.state.value.lastSentDateKst, '2026-09-02');

  // The next Korean day claims the guard again.
  assert.equal(await digest.runOnce(new Date('2026-09-03T00:05:00Z')), true);
  assert.equal(sent.length, 2);
});

test('an empty pending queue claims the day but sends nothing', { concurrency: false }, async () => {
  const sent = [];
  const fakeDb = createFakeDb();
  const digest = loadDigestServiceWithMocks({
    config: DEFAULT_CONFIG,
    dbService: {
      ...fakeDb,
      getActiveConsultations: createConsultationsStub(),
    },
    emailService: createEmailServiceSpy(sent),
  });

  assert.equal(await digest.runOnce(new Date('2026-09-02T00:05:00Z')), false);
  assert.deepEqual(sent, []);
});

test('the digest stays inert when SMTP is unavailable or the job is disabled', { concurrency: false }, async () => {
  const sent = [];
  const fakeDb = createFakeDb();

  const withoutSmtp = loadDigestServiceWithMocks({
    config: DEFAULT_CONFIG,
    dbService: { ...fakeDb, getActiveConsultations: createConsultationsStub({ pending: { total: 5, consultations: [] } }) },
    emailService: { isConfigured: () => false, sendUnansweredDigestEmail: async () => true },
  });
  assert.equal(withoutSmtp.isOperational(), false);
  assert.equal(await withoutSmtp.runOnce(new Date('2026-09-02T00:05:00Z')), false);

  const disabled = loadDigestServiceWithMocks({
    config: { ...DEFAULT_CONFIG, enabled: false },
    dbService: { ...fakeDb, getActiveConsultations: createConsultationsStub({ pending: { total: 5, consultations: [] } }) },
    emailService: createEmailServiceSpy(sent),
  });
  assert.equal(disabled.isOperational(), false);
  assert.equal(await disabled.runOnce(new Date('2026-09-02T00:05:00Z')), false);
  assert.deepEqual(sent, []);
});

test('digest rows carry only timing and channel, never symptom text', { concurrency: false }, async () => {
  const sent = [];
  const fakeDb = createFakeDb();
  const digest = loadDigestServiceWithMocks({
    config: DEFAULT_CONFIG,
    dbService: {
      ...fakeDb,
      getActiveConsultations: createConsultationsStub({
        pending: {
          total: 1,
          consultations: [{
            id: 'consult-1',
            createdAt: '2026-08-22T14:25:55.092Z',
            entryChannel: 'kakao',
            chiefComplaint: '항문 주변에 작은 살이 튀어나온 것처럼 보입니다',
          }],
        },
      }),
    },
    emailService: createEmailServiceSpy(sent),
  });

  assert.equal(await digest.runOnce(new Date('2026-09-02T00:05:00Z')), true);
  assert.deepEqual(sent[0].items, [{
    kind: 'first_reply',
    receivedAt: '2026-08-22 23:25 KST',
    waitingDays: 10,
    channel: 'kakao',
  }]);
});

test('KST bucketing rolls the date key over at Korean midnight', { concurrency: false }, async () => {
  const digest = loadDigestServiceWithMocks({
    config: DEFAULT_CONFIG,
    dbService: { ...createFakeDb(), getActiveConsultations: createConsultationsStub() },
    emailService: { isConfigured: () => true, sendUnansweredDigestEmail: async () => true },
  });

  assert.deepEqual(digest.toKstParts(new Date('2026-09-01T14:59:00Z')), { dateKey: '2026-09-01', hour: 23 });
  assert.deepEqual(digest.toKstParts(new Date('2026-09-01T15:00:00Z')), { dateKey: '2026-09-02', hour: 0 });
});

test('a patient waiting on a follow-up question is in the digest too', { concurrency: false }, async () => {
  // One patient asked again on an answered consultation, waited 19 hours,
  // wrote "왜 아무도 내 질문에 답해주지 않는 거죠?" and closed the consultation
  // themselves. Every alert had been delivered; this digest was looking only at
  // the pending tab, so the next morning it reported nothing was waiting.
  const sent = [];
  const fakeDb = createFakeDb();
  const digest = loadDigestServiceWithMocks({
    config: DEFAULT_CONFIG,
    dbService: {
      ...fakeDb,
      getActiveConsultations: createConsultationsStub({
        pending: {
          total: 1,
          consultations: [{ id: 'fresh', createdAt: '2026-09-01T23:00:00.000Z', entryChannel: 'web' }],
        },
        followup: {
          total: 1,
          consultations: [{
            id: 'asked-again',
            createdAt: '2026-08-20T01:00:00.000Z',
            entryChannel: 'kakao',
            followUpLogs: [
              { action: 'COMPLETE', timestamp: '2026-08-20T02:00:00.000Z' },
              { action: 'PATIENT_FOLLOW_UP_QUESTION', timestamp: '2026-08-28T00:00:00.000Z' },
              { action: 'PATIENT_FOLLOW_UP_QUESTION', timestamp: '2026-08-31T05:00:00.000Z' },
            ],
          }],
        },
      }),
    },
    emailService: createEmailServiceSpy(sent),
  });

  assert.equal(await digest.runOnce(new Date('2026-09-02T00:05:00Z')), true);
  assert.equal(sent[0].total, 2);
  assert.deepEqual(sent[0].items, [
    // Longest wait first, and dated from the newest question rather than from
    // an intake that was answered days ago.
    { kind: 'follow_up', receivedAt: '2026-08-31 14:00 KST', waitingDays: 1, channel: 'kakao' },
    { kind: 'first_reply', receivedAt: '2026-09-02 08:00 KST', waitingDays: 0, channel: 'web' },
  ]);
});

test('a follow-up tab entry with no patient question falls back to intake time', { concurrency: false }, async () => {
  // An auto-close note is newer than the last reply, which is enough to park a
  // consultation in the follow-up tab. Nothing was asked, so there is no
  // question to date the wait from.
  const sent = [];
  const fakeDb = createFakeDb();
  const digest = loadDigestServiceWithMocks({
    config: DEFAULT_CONFIG,
    dbService: {
      ...fakeDb,
      getActiveConsultations: createConsultationsStub({
        followup: {
          total: 1,
          consultations: [{
            id: 'no-question',
            createdAt: '2026-08-30T01:00:00.000Z',
            entryChannel: 'web',
            followUpLogs: [{ action: 'FOLLOW_UP', timestamp: '2026-08-31T01:00:00.000Z' }],
          }],
        },
      }),
    },
    emailService: createEmailServiceSpy(sent),
  });

  assert.equal(await digest.runOnce(new Date('2026-09-02T00:05:00Z')), true);
  assert.deepEqual(sent[0].items, [
    { kind: 'follow_up', receivedAt: '2026-08-30 10:00 KST', waitingDays: 2, channel: 'web' },
  ]);
});
