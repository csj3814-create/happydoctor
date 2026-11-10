const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');

const CONFIG_PATH = path.join(__dirname, '..', 'config.js');
const DB_SERVICE_PATH = path.join(__dirname, '..', 'services', 'dbService.js');
const SERVICE_PATH = path.join(__dirname, '..', 'services', 'consultationAutoCloseService.js');

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-11-11T00:00:00.000Z');

const DEFAULT_CONFIG = Object.freeze({
  enabled: true,
  afterDays: 7,
  checkIntervalMs: 60 * 60 * 1000,
  maxPerRun: 25,
});

function loadServiceWithMocks({ config = DEFAULT_CONFIG, dbService }) {
  const originalLoad = Module._load;

  Module._load = function patchedLoad(request, parent, isMain) {
    const resolved = (() => {
      try {
        return Module._resolveFilename(request, parent, isMain);
      } catch (error) {
        return request;
      }
    })();

    if (resolved === CONFIG_PATH) return { getConsultationAutoCloseConfig: () => config };
    if (resolved === DB_SERVICE_PATH) return dbService;

    return originalLoad(request, parent, isMain);
  };

  delete require.cache[SERVICE_PATH];

  try {
    return require(SERVICE_PATH);
  } finally {
    Module._load = originalLoad;
    delete require.cache[SERVICE_PATH];
  }
}

// Records what the job asked for and what it closed.
function createFakeDb(candidates = []) {
  const calls = { listedCutoffs: [], closed: [] };

  return {
    calls,
    listRepliedConsultationsBefore: async (cutoffMs, limit) => {
      calls.listedCutoffs.push({ cutoffMs, limit });
      return candidates;
    },
    closeConsultationById: async (id, reason, options) => {
      calls.closed.push({ id, reason, options });
      return { consultationId: id, alreadyClosed: false };
    },
  };
}

function repliedDaysAgo(days, extra = {}) {
  return {
    id: `replied-${days}d`,
    doctorRepliedAt: new Date(NOW.getTime() - days * DAY_MS).toISOString(),
    ...extra,
  };
}

test('a consultation quiet since the reply is closed, and says why', { concurrency: false }, async () => {
  const fakeDb = createFakeDb([repliedDaysAgo(9)]);
  const service = loadServiceWithMocks({ dbService: fakeDb });

  assert.equal(await service.runOnce(NOW), 1);
  assert.equal(fakeDb.calls.closed.length, 1);

  const [closed] = fakeDb.calls.closed;
  assert.equal(closed.id, 'replied-9d');
  assert.equal(closed.options.action, 'AUTO_CLOSE');
  assert.match(closed.reason, /마지막 답변 후 7일 동안 추가 질문이 없어 자동으로 종료/);

  // The cutoff is the configured age, not "now".
  const [listed] = fakeDb.calls.listedCutoffs;
  assert.equal(listed.cutoffMs, NOW.getTime() - 7 * DAY_MS);
});

test('a reply inside the window is left alone', { concurrency: false }, async () => {
  // The candidate query filters by cutoff too; this proves the job does not
  // rely on it, so a looser query can never close something early.
  const fakeDb = createFakeDb([repliedDaysAgo(3), repliedDaysAgo(6)]);
  const service = loadServiceWithMocks({ dbService: fakeDb });

  assert.equal(await service.runOnce(NOW), 0);
  assert.deepEqual(fakeDb.calls.closed, []);
});

test('a patient waiting on a follow-up question is never closed', { concurrency: false }, async () => {
  // The whole point of the job's narrowness. One patient waited 19 hours on a
  // second question, asked why nobody was answering, and closed the
  // consultation themselves; closing these automatically would have filed that
  // away as finished business.
  const waiting = repliedDaysAgo(20, {
    id: 'asked-again',
    followUpLogs: [
      { action: 'PATIENT_FOLLOW_UP_QUESTION', timestamp: new Date(NOW.getTime() - 19 * DAY_MS).toISOString() },
    ],
  });
  const finished = repliedDaysAgo(20, {
    id: 'asked-before-the-reply',
    followUpLogs: [
      { action: 'PATIENT_FOLLOW_UP_QUESTION', timestamp: new Date(NOW.getTime() - 21 * DAY_MS).toISOString() },
    ],
  });

  const fakeDb = createFakeDb([waiting, finished]);
  const service = loadServiceWithMocks({ dbService: fakeDb });

  assert.equal(await service.runOnce(NOW), 1);
  assert.deepEqual(fakeDb.calls.closed.map((entry) => entry.id), ['asked-before-the-reply']);
});

test('a system log after the reply does not protect a finished consultation', { concurrency: false }, async () => {
  // Only the patient speaking counts. An auto-reanalysis note is not a patient
  // waiting for anything.
  const fakeDb = createFakeDb([repliedDaysAgo(10, {
    id: 'system-note-only',
    followUpLogs: [{ action: 'FOLLOW_UP', timestamp: new Date(NOW.getTime() - 9 * DAY_MS).toISOString() }],
  })]);
  const service = loadServiceWithMocks({ dbService: fakeDb });

  assert.equal(await service.runOnce(NOW), 1);
  assert.equal(fakeDb.calls.closed[0].id, 'system-note-only');
});

test('a consultation with no reply at all is never closed', { concurrency: false }, async () => {
  // listRepliedConsultationsBefore() should not return these, and if it ever
  // does - a missing field, a legacy record - the job still refuses.
  const fakeDb = createFakeDb([
    { id: 'never-answered', createdAt: new Date(NOW.getTime() - 30 * DAY_MS).toISOString() },
    { id: 'empty-reply-time', doctorRepliedAt: null },
  ]);
  const service = loadServiceWithMocks({ dbService: fakeDb });

  assert.equal(await service.runOnce(NOW), 0);
  assert.deepEqual(fakeDb.calls.closed, []);
});

test('one run closes no more than the configured maximum', { concurrency: false }, async () => {
  const candidates = Array.from({ length: 6 }, (unused, index) => ({
    id: `old-${index}`,
    doctorRepliedAt: new Date(NOW.getTime() - (10 + index) * DAY_MS).toISOString(),
  }));
  const fakeDb = createFakeDb(candidates);
  const service = loadServiceWithMocks({ config: { ...DEFAULT_CONFIG, maxPerRun: 2 }, dbService: fakeDb });

  assert.equal(await service.runOnce(NOW), 2);
  assert.equal(fakeDb.calls.closed.length, 2);
  // It asks for more candidates than it will close, because some are dropped.
  assert.equal(fakeDb.calls.listedCutoffs[0].limit, 8);
});

test('an already closed consultation is not counted twice', { concurrency: false }, async () => {
  const fakeDb = createFakeDb([repliedDaysAgo(10)]);
  fakeDb.closeConsultationById = async (id) => ({ consultationId: id, alreadyClosed: true });
  const service = loadServiceWithMocks({ dbService: fakeDb });

  assert.equal(await service.runOnce(NOW), 0);
});

test('the job stays inert when disabled', { concurrency: false }, async () => {
  const fakeDb = createFakeDb([repliedDaysAgo(30)]);
  const service = loadServiceWithMocks({ config: { ...DEFAULT_CONFIG, enabled: false }, dbService: fakeDb });

  assert.equal(service.isOperational(), false);
  assert.equal(await service.runOnce(NOW), 0);
  assert.deepEqual(fakeDb.calls.listedCutoffs, []);
});

test('the configured age appears in the reason the patient reads', { concurrency: false }, async () => {
  const fakeDb = createFakeDb([repliedDaysAgo(31)]);
  const service = loadServiceWithMocks({ config: { ...DEFAULT_CONFIG, afterDays: 30 }, dbService: fakeDb });

  await service.runOnce(NOW);
  assert.match(fakeDb.calls.closed[0].reason, /마지막 답변 후 30일/);
});
