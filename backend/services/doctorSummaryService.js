const { GoogleGenAI } = require('@google/genai');

const { getDoctorSummaryConfig } = require('../config');

// Deliberately separate from llmService.js. That module is the patient-facing
// path and stays free of model output: commit d78e4e9 removed automated
// clinical replies to patients, and nothing here reinstates them. This summary
// is written for a clinician who is about to read the same chart themselves,
// and is only ever rendered inside the authenticated portal.
const SYSTEM_INSTRUCTION = [
  "당신은 비영리 온라인 의료상담 '해피닥터'의 예진 보조 '보듬'입니다.",
  '자원봉사 의료진이 환자 문진을 빠르게 파악하도록, 환자가 입력한 내용만으로 SOAP 형식 요약을 작성합니다.',
  '',
  '[절대 금지]',
  '- 진단명을 확정하지 마세요.',
  '- 약물명, 용량, 복용법을 쓰지 마세요.',
  '- 검사 지시(Lab, 영상, 처치)를 쓰지 마세요.',
  '- 환자에게 전달할 문장을 쓰지 마세요. 이 글은 의료진만 봅니다.',
  '- 환자가 입력하지 않은 사실을 지어내지 마세요.',
  '',
  '[작성 규칙]',
  '- S: 환자가 말한 증상을 정리합니다.',
  '- O: 환자가 언급한 객관적 정보만 씁니다. 없으면 "환자 입력 없음"이라고 쓰세요.',
  '- A: 확정 진단이 아니라, 의료진이 확인해볼 만한 방향과 판단에 필요한 근거를 서술합니다.',
  '- P: 처치 계획이 아니라, 판단을 위해 환자에게 추가로 물어봐야 할 항목을 나열합니다.',
  '- 정보가 부족하면 부족하다고 명시하세요. 추측으로 채우지 마세요.',
  '- 한국어로, 800자 이내 일반 텍스트로 작성하세요. 머리말이나 맺음말은 붙이지 마세요.',
].join('\n');

const SUMMARY_DISCLAIMER = 'AI가 환자 입력만으로 정리한 초안입니다. 진단·처방이 아니며 의료진 검토가 필요합니다.';

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
      contents: `아래 환자 문진 내용을 SOAP 형식으로 정리해 주세요.\n\n${chart}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
        maxOutputTokens: config.maxOutputTokens,
        abortSignal: AbortSignal.timeout(config.timeoutMs),
      },
    });

    const text = typeof response?.text === 'string' ? response.text.trim() : '';
    if (!text) return null;

    return {
      text,
      disclaimer: SUMMARY_DISCLAIMER,
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
        disclaimer: SUMMARY_DISCLAIMER,
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
module.exports.SYSTEM_INSTRUCTION = SYSTEM_INSTRUCTION;
