const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');

const CONFIG_PATH = path.resolve(__dirname, '..', 'config.js');
const GENAI_PATH = require.resolve('@google/genai', { paths: [path.resolve(__dirname, '..')] });
const SERVICE_PATH = path.resolve(__dirname, '..', 'services', 'doctorSummaryService.js');
const LLM_SERVICE_PATH = path.resolve(__dirname, '..', 'services', 'llmService.js');

const ENABLED_CONFIG = Object.freeze({
  enabled: true,
  apiKey: 'test-key',
  model: 'gemini-2.5-flash',
  timeoutMs: 20000,
  maxOutputTokens: 1200,
});

function loadServiceWithMocks({ config = ENABLED_CONFIG, generate }) {
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

    if (resolved === CONFIG_PATH) return { getDoctorSummaryConfig: () => config };

    if (resolved === GENAI_PATH) {
      return {
        GoogleGenAI: class GoogleGenAI {
          constructor(options) {
            calls.push({ type: 'construct', apiKey: options?.apiKey });
            this.models = {
              generateContent: async (request) => {
                calls.push({ type: 'generateContent', request });
                return generate(request);
              },
            };
          }
        },
      };
    }

    return originalLoad(request, parent, isMain);
  };

  delete require.cache[SERVICE_PATH];

  try {
    return { service: require(SERVICE_PATH), calls };
  } finally {
    Module._load = originalLoad;
    delete require.cache[SERVICE_PATH];
  }
}

const PATIENT_DATA = Object.freeze({
  age: '20-39세',
  gender: '남성',
  cc: '항문 주변에 작은 살이 튀어나온 것처럼 보입니다.',
  onset: '약 1년 전부터',
  nrs: '0',
  symptom: '통증이나 가려움은 없습니다.',
  associated: '없음',
  pmhx: '없음',
});

test('the patient-facing path still returns no model output', { concurrency: false }, async () => {
  // The whole point of the doctor summary is that it does not reinstate
  // automated clinical replies to patients.
  delete require.cache[LLM_SERVICE_PATH];
  const llmService = require(LLM_SERVICE_PATH);

  const triage = await llmService.analyzeAndRouteTriage(PATIENT_DATA);
  assert.equal(triage.action, 'ESCALATE');
  assert.match(triage.replyToPatient, /자동 진단이나 치료 안내 없이/);
  assert.match(triage.soapChartForDoctor, /자동 분류하지 않음/);
  assert.doesNotMatch(triage.soapChartForDoctor, /항문/);
});

test('the chart sent to the model carries only what the patient supplied', { concurrency: false }, async () => {
  const { service, calls } = loadServiceWithMocks({
    generate: async () => ({ text: JSON.stringify({ soap: 'S: ...', replyDraft: '안녕하세요.' }) }),
  });

  await service.generate(PATIENT_DATA);

  const call = calls.find((entry) => entry.type === 'generateContent');
  assert.match(call.request.contents, /주호소: 항문 주변에 작은 살이/);
  assert.match(call.request.contents, /과거력\/복용약: 없음/);
  assert.equal(call.request.model, 'gemini-2.5-flash');

  // Diagnosis, prescription and test orders are forbidden in the instruction.
  const instruction = call.request.config.systemInstruction;
  assert.match(instruction, /진단명을 확정하지 마세요/);
  assert.match(instruction, /약물명, 용량, 복용법을 쓰지 마세요/);
  assert.match(instruction, /검사 지시/);
  assert.match(instruction, /응급 여부를 단정하지 마세요/);
  // The draft is written for a clinician to approve, never sent on its own.
  assert.match(instruction, /환자에게 자동으로 전달되지 않습니다/);
});

test('a generated summary carries a SOAP note and a reply draft for approval', { concurrency: false }, async () => {
  const { service } = loadServiceWithMocks({
    generate: async () => ({
      text: JSON.stringify({
        soap: '  S: 항문 주변 종괴감\nA: 확인 필요  ',
        replyDraft: '  걱정되셨겠습니다. 말씀해 주신 내용을 확인했습니다.  ',
      }),
    }),
  });

  const summary = await service.generateSafely(PATIENT_DATA);

  assert.equal(summary.status, 'ready');
  assert.equal(summary.text, 'S: 항문 주변 종괴감\nA: 확인 필요');
  assert.equal(summary.replyDraft, '걱정되셨겠습니다. 말씀해 주신 내용을 확인했습니다.');
  assert.match(summary.disclaimer, /진단·처방이 아니며 의료진 검토가 필요합니다/);
  assert.match(summary.replyDraftDisclaimer, /의료진 검토 전에는 환자에게 전달되지 않습니다/);
  assert.equal(summary.model, 'gemini-2.5-flash');
});

test('a model failure is recorded rather than thrown at the consultation', { concurrency: false }, async () => {
  const { service } = loadServiceWithMocks({
    generate: async () => {
      throw new Error('gemini_unavailable');
    },
  });

  const summary = await service.generateSafely(PATIENT_DATA);

  assert.equal(summary.status, 'failed');
  assert.equal(summary.text, null);
  assert.match(summary.error, /gemini_unavailable/);
});

test('an empty model response yields no summary rather than an empty one', { concurrency: false }, async () => {
  const { service } = loadServiceWithMocks({
    generate: async () => ({ text: JSON.stringify({ soap: '   ', replyDraft: '  ' }) }),
  });

  assert.equal(await service.generateSafely(PATIENT_DATA), null);
});

test('the service stays off without an API key, and the model is never constructed', { concurrency: false }, async () => {
  const { service, calls } = loadServiceWithMocks({
    config: { ...ENABLED_CONFIG, enabled: false, apiKey: '' },
    generate: async () => ({ text: 'should not run' }),
  });

  assert.equal(service.isEnabled(), false);
  assert.equal(await service.generateSafely(PATIENT_DATA), null);
  assert.deepEqual(calls, []);
});

test('an empty chart is not sent to the model at all', { concurrency: false }, async () => {
  const { service, calls } = loadServiceWithMocks({
    generate: async () => ({ text: 'should not run' }),
  });

  assert.equal(await service.generate({ age: '   ', cc: '' }), null);
  assert.deepEqual(calls.filter((entry) => entry.type === 'generateContent'), []);
});
