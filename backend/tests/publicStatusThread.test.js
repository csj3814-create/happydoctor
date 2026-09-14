const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');

const DB_SERVICE_PATH = path.resolve(__dirname, '..', 'services', 'dbService.js');

// dbService opens Firestore at require time, so the build function is exercised
// through a stubbed admin surface rather than by loading the whole module.
function loadBuildPublicConsultationStatus() {
  const originalLoad = Module._load;

  Module._load = function patchedLoad(request, parent, isMain) {
    const resolved = (() => {
      try {
        return Module._resolveFilename(request, parent, isMain);
      } catch (error) {
        return request;
      }
    })();

    if (resolved.endsWith('firebase-admin\\app') || resolved.endsWith('firebase-admin/app')) {
      return { cert: () => ({}), initializeApp: () => ({}) };
    }

    if (resolved.endsWith('firebase-admin\\firestore') || resolved.endsWith('firebase-admin/firestore')) {
      return {
        FieldValue: { serverTimestamp: () => 'now', increment: () => 1, arrayUnion: () => [] },
        Timestamp: { now: () => ({ toDate: () => new Date() }) },
        getFirestore: () => null,
      };
    }

    if (resolved.endsWith('firebase-admin\\auth') || resolved.endsWith('firebase-admin/auth')) {
      return { getAuth: () => null };
    }

    if (resolved.endsWith('firebase-admin\\storage') || resolved.endsWith('firebase-admin/storage')) {
      return { getStorage: () => null };
    }

    return originalLoad(request, parent, isMain);
  };

  delete require.cache[DB_SERVICE_PATH];
  const dbService = require(DB_SERVICE_PATH);

  return {
    dbService,
    restore() {
      Module._load = originalLoad;
      delete require.cache[DB_SERVICE_PATH];
    },
  };
}

function isoTimestamp(iso) {
  return { toDate: () => new Date(iso) };
}

test('the public status carries the patient their own questions, oldest first', { concurrency: false }, async () => {
  const { dbService, restore } = loadBuildPublicConsultationStatus();

  try {
    const build = dbService.buildPublicConsultationStatus;
    assert.equal(typeof build, 'function', 'buildPublicConsultationStatus must be exported');

    const status = await build({
      id: 'consult-1',
      status: 'ACTIVE',
      aiAction: 'ESCALATE',
      createdAt: isoTimestamp('2026-09-14T01:00:00.000Z'),
      patientData: { cc: '온 몸이 아파요' },
      followUpLogs: [
        {
          action: 'PATIENT_FOLLOW_UP_QUESTION',
          timestamp: isoTimestamp('2026-09-14T04:00:00.000Z'),
          originalQuestion: 'Do I need to see a doctor?',
          alertMessage: '병원에 꼭 가야 하나요?',
        },
        {
          action: 'PATIENT_FOLLOW_UP_QUESTION',
          timestamp: isoTimestamp('2026-09-14T02:00:00.000Z'),
          originalQuestion: '약은 먹지 않아도 되나요?',
          alertMessage: '약은 먹지 않아도 되나요?',
        },
        { action: 'ESCALATE', timestamp: isoTimestamp('2026-09-14T03:00:00.000Z'), alertMessage: '알림' },
      ],
    }, []);

    assert.deepEqual(
      status.patientQuestions.map((entry) => entry.question),
      ['약은 먹지 않아도 되나요?', 'Do I need to see a doctor?'],
    );
    // What the patient wrote, not the Korean rendering made for the clinician.
    assert.equal(status.patientQuestions[1].question, 'Do I need to see a doctor?');
    // Non-question log entries are not part of the patient's own thread.
    assert.equal(status.patientQuestions.length, 2);
    assert.equal(status.followUpCount, 3);
  } finally {
    restore();
  }
});

test('a consultation with no follow-up questions reports an empty list', { concurrency: false }, async () => {
  const { dbService, restore } = loadBuildPublicConsultationStatus();

  try {
    const status = await dbService.buildPublicConsultationStatus({
      id: 'consult-2',
      status: 'ACTIVE',
      aiAction: 'ESCALATE',
      createdAt: isoTimestamp('2026-09-14T01:00:00.000Z'),
      patientData: { cc: '두통' },
      followUpLogs: [],
    }, []);

    assert.deepEqual(status.patientQuestions, []);
  } finally {
    restore();
  }
});
