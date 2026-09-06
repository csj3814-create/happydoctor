const { GoogleGenAI } = require('@google/genai');

const { getDoctorSummaryConfig } = require('../config');

// Deliberately separate from llmService.js. That module is the patient-facing
// path and stays free of model output: commit d78e4e9 removed automated
// clinical replies to patients, and nothing here reinstates them. This summary
// is written for a clinician who is about to read the same chart themselves,
// and is only ever rendered inside the authenticated portal.
const SYSTEM_INSTRUCTION = [
  "당신은 비영리 온라인 의료상담 '해피닥터'의 예진 보조 '인턴 닥터 보듬'입니다.",
  '자원봉사 의료진이 환자 문진을 빠르게 파악하고 답변을 시작할 수 있도록 두 가지를 작성합니다.',
  '',
  '[중요] 두 결과물 모두 의료진만 봅니다. 환자에게 자동으로 전달되지 않습니다.',
  '의료진이 읽고 판단해 직접 전송합니다. 당신은 판단하지 않고 초안만 제공합니다.',
  '',
  '[절대 금지]',
  '- 진단명을 확정하지 마세요.',
  '- 약물명, 용량, 복용법을 쓰지 마세요.',
  '- 검사 지시(Lab, 영상, 처치)를 쓰지 마세요.',
  '- 응급 여부를 단정하지 마세요. 그 판단은 의료진이 합니다.',
  '- 환자가 입력하지 않은 사실을 지어내지 마세요.',
  '',
  '[soap] 의료진용 SOAP 정리',
  '- S: 환자가 말한 증상을 정리합니다.',
  '- O: 환자가 언급한 객관적 정보만. 없으면 "환자 입력 없음".',
  '- A: 확정 진단이 아니라, 의료진이 확인해볼 방향과 판단 근거를 서술합니다.',
  '- P: 처치 계획이 아니라, 판단을 위해 환자에게 추가로 물어볼 항목을 나열합니다.',
  '- 정보가 부족하면 부족하다고 명시하세요.',
  '',
  '[replyDraft] 의료진이 검토·수정해 환자에게 보낼 답변 초안',
  '- 환자가 읽을 글이므로 따뜻하고 쉬운 한국어로 쓰세요.',
  '- 증상을 이해했다는 공감으로 시작하세요.',
  '- 확정적인 표현 대신 "의료진이 확인한 바로는" 같은 여지를 두세요.',
  '- 어떤 변화가 생기면 병원을 찾아야 하는지 알려주세요.',
  '- 정보가 부족하면 무엇을 더 알려달라고 요청하세요.',
  '- 의료진이 그대로 보내도 안전하고, 고쳐 쓰기도 쉬운 문장으로 작성하세요.',
  '',
  '[출력] 반드시 JSON: {"soap": "...", "replyDraft": "..."}',
].join('\n');

const SUMMARY_DISCLAIMER = 'AI가 환자 입력만으로 정리한 초안입니다. 진단·처방이 아니며 의료진 검토가 필요합니다.';
const REPLY_DRAFT_DISCLAIMER = '의료진 검토 전에는 환자에게 전달되지 않습니다. 확인 후 수정하여 보내 주세요.';

function parseModelJson(raw) {
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (!text) return null;

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch (error) {
    return null;
  }
}

function buildPatientChartText(patientData = {}) {
  return [
    ['나이/연령대', patientData.age],
    ['성별', patientData.gender],
    ['주호소', patientData.cc],
    ['발생 시기', patientData.onset],
    ['통증 NRS', patientData.nrs],
    ['증상 양상', patientData.symptom],
    ['동반 증상', patientData.associated],
    ['과거력/복용약', patientData.pmhx],
  ]
    .filter(([, value]) => typeof value === 'string' && value.trim())
    .map(([label, value]) => `${label}: ${String(value).trim()}`)
    .join('\n');
}

class DoctorSummaryService {
  constructor() {
    this.cachedClient = null;
    this.cachedApiKey = null;
  }

  getConfig() {
    return getDoctorSummaryConfig();
  }

  isEnabled() {
    return this.getConfig().enabled;
  }

  getClient() {
    const config = this.getConfig();
    if (!config.enabled) return null;

    if (!this.cachedClient || this.cachedApiKey !== config.apiKey) {
      this.cachedClient = new GoogleGenAI({ apiKey: config.apiKey });
      this.cachedApiKey = config.apiKey;
    }

    return this.cachedClient;
  }

  // Returns null rather than throwing. A consultation must be recorded and a
  // clinician alerted whether or not this succeeds.
  async generate(patientData = {}) {
    const config = this.getConfig();
    if (!config.enabled) return null;

    const chart = buildPatientChartText(patientData);
    if (!chart) return null;

    const client = this.getClient();
    if (!client) return null;

    const response = await client.models.generateContent({
      model: config.model,
      contents: `아래 환자 문진 내용을 정리하고 답변 초안을 작성해 주세요.\n\n${chart}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
        maxOutputTokens: config.maxOutputTokens,
        responseMimeType: 'application/json',
        abortSignal: AbortSignal.timeout(config.timeoutMs),
      },
    });

    const parsed = parseModelJson(response?.text);
    const soap = String(parsed?.soap || '').trim();
    const replyDraft = String(parsed?.replyDraft || '').trim();
    if (!soap && !replyDraft) return null;

    return {
      text: soap || null,
      replyDraft: replyDraft || null,
      disclaimer: SUMMARY_DISCLAIMER,
      replyDraftDisclaimer: REPLY_DRAFT_DISCLAIMER,
      model: config.model,
      status: 'ready',
    };
  }

  async generateSafely(patientData = {}) {
    if (!this.isEnabled()) return null;

    try {
      return await this.generate(patientData);
    } catch (error) {
      console.error('[Doctor Summary Error]', error?.message || error);
      return {
        text: null,
        replyDraft: null,
        disclaimer: SUMMARY_DISCLAIMER,
        replyDraftDisclaimer: REPLY_DRAFT_DISCLAIMER,
        model: this.getConfig().model,
        status: 'failed',
        error: String(error?.message || 'summary_failed').slice(0, 300),
      };
    }
  }
}

module.exports = new DoctorSummaryService();
module.exports.DoctorSummaryService = DoctorSummaryService;
module.exports.buildPatientChartText = buildPatientChartText;
module.exports.SUMMARY_DISCLAIMER = SUMMARY_DISCLAIMER;
module.exports.REPLY_DRAFT_DISCLAIMER = REPLY_DRAFT_DISCLAIMER;
module.exports.SYSTEM_INSTRUCTION = SYSTEM_INSTRUCTION;
