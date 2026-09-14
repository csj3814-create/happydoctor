const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');

const DB_SERVICE_PATH = path.resolve(__dirname, '..', 'services', 'dbService.js');
const SUMMARY_SERVICE_PATH = path.resolve(__dirname, '..', 'services', 'doctorSummaryService.js');
const SCHEDULER_PATH = path.resolve(__dirname, '..', 'services', 'doctorSummaryScheduler.js');

function loadSchedulerWithMocks({ enabled = true, generateSafely, saveAiDoctorSummary }) {
  const originalLoad = Module._load;
  const calls = [];

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
        saveAiDoctorSummary: async (consultationId, summary) => {
          calls.push({ type: 'save', consultationId, summary });
          return saveAiDoctorSummary ? saveAiDoctorSummary(consultationId, summary) : true;
        },
      };
    }

    if (resolved === SUMMARY_SERVICE_PATH) {
      return {
        isEnabled: () => enabled,
        generateSafely: async (patientData) => {
          calls.push({ type: 'generate', patientData });
          return generateSafely ? generateSafely(patientData) : { text: 'S: ...', status: 'ready' };
        },
      };
    }

    return originalLoad(request, parent, isMain);
  };

  delete require.cache[SCHEDULER_PATH];
  const scheduler = require(SCHEDULER_PATH);

  return {
    scheduler,
    calls,
    restore() {
      Module._load = originalLoad;
      delete require.cache[SCHEDULER_PATH];
    },
  };
}

// The work is deferred with setImmediate so intake is never delayed by it.
function flush() {
  return new Promise((resolve) => setImmediate(() => setImmediate(resolve)));
}

test('a scheduled summary is generated and stored on the consultation', { concurrency: false }, async () => {
  const { scheduler, calls, restore } = loadSchedulerWithMocks({
    generateSafely: async () => ({ text: 'S: 증상 정리', replyDraft: '초안', status: 'ready' }),
  });

  try {
    scheduler.scheduleDoctorSummary('consult-1', { cc: '복통' });
    await flush();

    assert.deepEqual(calls.map((call) => call.type), ['generate', 'save']);
    assert.deepEqual(calls[0].patientData, { cc: '복통' });
    assert.equal(calls[1].consultationId, 'consult-1');
    assert.equal(calls[1].summary.replyDraft, '초안');
  } finally {
    restore();
  }
});

test('scheduling returns immediately and never throws at the caller', { concurrency: false }, async () => {
  const { scheduler, restore } = loadSchedulerWithMocks({
    generateSafely: async () => {
      throw new Error('model exploded');
    },
  });

  try {
    // An intake path calls this after the patient has been answered. A failure
    // here must not surface as a failed consultation.
    assert.doesNotThrow(() => scheduler.scheduleDoctorSummary('consult-2', { cc: '두통' }));
    await flush();
  } finally {
    restore();
  }
});

test('nothing is generated without a consultation id or while the service is off', { concurrency: false }, async () => {
  const disabled = loadSchedulerWithMocks({ enabled: false });
  try {
    disabled.scheduler.scheduleDoctorSummary('consult-3', { cc: '기침' });
    await flush();
    assert.deepEqual(disabled.calls, []);
  } finally {
    disabled.restore();
  }

  const missingId = loadSchedulerWithMocks({});
  try {
    missingId.scheduler.scheduleDoctorSummary(undefined, { cc: '기침' });
    await flush();
    assert.deepEqual(missingId.calls, []);
  } finally {
    missingId.restore();
  }
});

test('an empty summary is not written to the consultation', { concurrency: false }, async () => {
  const { scheduler, calls, restore } = loadSchedulerWithMocks({
    generateSafely: async () => null,
  });

  try {
    scheduler.scheduleDoctorSummary('consult-4', { cc: '어지럼' });
    await flush();

    assert.deepEqual(calls.map((call) => call.type), ['generate']);
  } finally {
    restore();
  }
});

test('a follow-up draft answers the new question with the chart as context', { concurrency: false }, async () => {
  const calls = [];
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
        getConsultationById: async (id) => {
          calls.push({ type: 'load', id });
          return {
            id,
            patientData: { cc: '복통' },
            translatedPatientDataKo: null,
            doctorReplies: [{ message: '첫 답변입니다.' }, { message: '두 번째 답변입니다.' }],
          };
        },
        saveAiFollowUpDraft: async (consultationId, draft) => {
          calls.push({ type: 'save', consultationId, draft });
          return true;
        },
      };
    }

    if (resolved === SUMMARY_SERVICE_PATH) {
      return {
        isEnabled: () => true,
        generateFollowUpSafely: async (input) => {
          calls.push({ type: 'generate', input });
          return { question: input.question, replyDraft: '초안입니다.', status: 'ready' };
        },
      };
    }

    return originalLoad(request, parent, isMain);
  };

  delete require.cache[SCHEDULER_PATH];
  const scheduler = require(SCHEDULER_PATH);

  try {
    scheduler.scheduleFollowUpDraft('consult-fu', '약은 언제까지 먹나요?');
    await flush();
    await flush();

    assert.deepEqual(calls.map((call) => call.type), ['load', 'generate', 'save']);
    assert.equal(calls[1].input.question, '약은 언제까지 먹나요?');
    assert.deepEqual(calls[1].input.patientData, { cc: '복통' });
    // The most recent reply is the context that matters, not the first one.
    assert.equal(calls[1].input.priorReply, '두 번째 답변입니다.');
    assert.equal(calls[2].consultationId, 'consult-fu');
    assert.equal(calls[2].draft.replyDraft, '초안입니다.');
  } finally {
    Module._load = originalLoad;
    delete require.cache[SCHEDULER_PATH];
  }
});

test('no follow-up draft is attempted without a question', { concurrency: false }, async () => {
  const { scheduler, calls, restore } = loadSchedulerWithMocks({});

  try {
    scheduler.scheduleFollowUpDraft('consult-fu', '   ');
    await flush();
    assert.deepEqual(calls, []);
  } finally {
    restore();
  }
});
