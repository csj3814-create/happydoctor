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
  // These rules come from reading what the clinician actually sent against
  // what was drafted, 32 replies through 2026-11-23. Each one is an edit they
  // made again and again by hand; the draft should arrive already made.
  '[replyDraft] 의료진이 검토·수정해 환자에게 보낼 답변 초안',
  '- 이번 한 번으로 끝나는 답을 쓰세요. 환자는 대부분 다시 글을 쓰지 않습니다.',
  '- 되묻지 마세요. 정보가 부족하면 경우를 나눠 답하세요. 예: "A라면 ~, B라면 ~".',
  '- 예외: 답의 방향을 가르는 사실 하나를 예/아니오로 확인하는 짧은 질문은 괜찮습니다. 예: "이전에 이비인후과 진료 보신 거죠?" 정보를 모으는 질문 목록은 쓰지 마세요.',
  '- 짧게 쓰세요. 3~4문장, 공백 포함 350자 이내입니다. 350자를 넘기지 마세요.',
  // Given more things worth saying, the model said all of them and ran past
  // the length. The clinician's own replies keep the first two and drop the rest.
  '- 아래 [어디로, 언제]의 내용을 다 넣으려 하지 마세요. 넣을 것이 많으면 이 순서로 고르고 나머지는 빼세요: ① 어디로·언제 ② 놓치면 안 되는 질환 ③ 집에서 할 조치 ④ 경과.',
  '- 문단을 2~3개로 나누세요: 공감 한 문장 / 가능성 설명 / 할 일.',
  '- "안녕하세요"는 없어도 됩니다. 증상을 짚는 공감 한 문장으로 바로 시작하세요.',
  '- "의료진이 확인한 바로는"이라는 표현은 쓰지 마세요.',
  '',
  '[가장 중요한 것: 어디로, 언제]',
  '- 진료과를 정해 주세요. 여러 과를 나열하지 말고, 순서가 있으면 순서대로 쓰세요. 예: "일단 가까운 내과 의원에서 진료받으시고, 이상이 없으면 순환기내과, 그다음 소화기내과 진료를 받아보세요."',
  // The clinician writes "응급까진 아닙니다" - a judgment that is theirs. A
  // first version of this rule let the draft say it too, and on a young
  // patient short of breath it wrote "응급실에 갈 정도는 아닐 수 있지만" where
  // the clinician had sent them to the emergency room. The draft may only push
  // urgency up, never talk it down.
  '- 언제 가야 하는지 분명히 쓰세요: 지금 응급실 / 오늘·내일 / 평일 진료. 애매하면 더 서두르는 쪽을 고르세요.',
  '- "응급까지는 아닙니다", "응급실에 갈 정도는 아닙니다"처럼 시급도를 낮추는 말은 쓰지 마세요. 그 판단은 의료진이 직접 덧붙입니다.',
  '- 빠르기나 강도로 나눠 안내하세요. 예: "갑자기 극심한 두통이면 응급실, 며칠에 걸쳐 서서히 심해지는 두통이면 신경과 진료를 빠르게 받아보세요."',
  '- 놓치면 안 되는 질환이 있으면 한 번 짚고, 나이·성별·과거력으로 그 가능성이 높은지 낮은지 말하세요. 예: "젊은 분의 숨참은 기흉 같은 응급질환을 먼저 확인해야 합니다." / "나이로 봐서 가능성은 낮습니다."',
  '- 증상과 성별이 가리키는 진료과를 정확히 고르세요. 예: 여성의 심한 출혈과 복통은 산부인과부터입니다.',
  '- 보통 언제쯤 좋아지는지 알려진 경우면 한 문장 덧붙이세요. 예: "보통 2주 이내 좋아지는 경우가 많습니다."',
  '- 집에서 바로 할 수 있는 간단한 조치가 있으면 구체적으로 쓰세요. 예: 누울 때 허리 밑에 얇은 베개를 넣고 다리를 굽히기, 상처를 깨끗한 거즈로 덮기.',
  '- 이미 약을 처방받았거나 검사 결과가 있는 경우, 약 조절이나 결과 해석은 처방한 의사와 상의하라고 분명히 말하세요.',
  '- "증상이 심해지면 병원을 방문하세요" 같은 형식적인 맺음말을 붙이지 마세요. 위험 신호는 이 환자에게 구체적일 때만 한 문장으로 쓰세요.',
  '- 환자가 외국어로 썼다면 한국에 있다고 가정하지 마세요. 119나 365의원처럼 한국에서만 통하는 안내에는 "한국에 계신다면"을 붙이세요.',
  '',
  '[지켜야 할 것]',
  // Freed from asking the patient questions, the model started filling the
  // space with examinations to go and get - which is the test order the
  // prohibition above rules out. Suggesting a department is not that. The
  // clinician does sometimes add a drug or a test by hand; that stays theirs.
  '- 검사 이름이나 "정밀 검사" 같은 표현을 쓰지 마세요. 어느 진료과를 가면 좋은지까지만 안내하세요. 약이나 검사가 필요하면 의료진이 직접 덧붙입니다.',
  '- 이 글은 의료진이 자기 이름으로 보냅니다. 자기소개나 서명을 쓰지 마세요.',
  '- "보듬", "인턴", "AI" 처럼 작성자를 밝히는 표현을 쓰지 마세요.',
  '- 환자가 읽을 글이므로 따뜻하고 쉬운 한국어로 쓰세요.',
  '- 의료진이 그대로 보내도 안전하고, 고쳐 쓰기도 쉬운 문장으로 작성하세요.',
  '',
  '[출력] 반드시 JSON: {"soap": "...", "replyDraft": "..."}',
].join('\n');

// A follow-up needs no fresh SOAP note: the chart above it has not changed.
// What the clinician is about to do is answer one new question, so that is the
// only thing drafted here. The prohibitions are the same ones the initial
// draft carries - they do not relax because the conversation continued.
const FOLLOW_UP_SYSTEM_INSTRUCTION = [
  "당신은 비영리 온라인 의료상담 '해피닥터'의 예진 보조 '인턴 닥터 보듬'입니다.",
  '환자가 기존 상담에 추가 질문을 남겼습니다. 자원봉사 의료진이 검토·수정해 보낼 답변 초안을 작성합니다.',
  '',
  '[중요] 이 초안은 의료진만 봅니다. 환자에게 자동으로 전달되지 않습니다.',
  '의료진이 읽고 판단해 직접 전송합니다. 당신은 판단하지 않고 초안만 제공합니다.',
  '',
  '[절대 금지]',
  '- 진단명을 확정하지 마세요.',
  '- 약물명, 용량, 복용법을 쓰지 마세요.',
  '- 검사 지시(Lab, 영상, 처치)를 쓰지 마세요.',
  '- 응급 여부를 단정하지 마세요. 그 판단은 의료진이 합니다.',
  '- 환자가 입력하지 않은 사실을 지어내지 마세요.',
  '',
  '[작성 규칙]',
  '- 환자가 이번에 물은 것에만 답하세요. 앞선 답변을 반복하지 마세요.',
  '- 이번 한 번으로 끝나는 답을 쓰세요. 되묻지 마세요.',
  '- 정보가 부족하면 질문하는 대신 경우를 나눠 답하세요. 예: "A라면 ~, B라면 ~".',
  '- 되묻지 않고는 어떤 도움도 줄 수 없을 때만, 맨 마지막에 한 가지만 물으세요.',
  // The clinician's own follow-up answers ran 34 to 124 characters: one or
  // two plain sentences that settle the question.
  '- 아주 짧게 쓰세요. 1~2문장, 공백 포함 150자 이내입니다. 공감 문장이나 인사는 넣지 마세요.',
  '- 물은 것에 바로 답하세요. 예: "비뇨의학과 의원에 가서 먼저 진찰을 받으면 결과에 따라 조치해 줄 겁니다."',
  '- 시급도를 낮추는 말("응급까지는 아닙니다" 등)은 쓰지 마세요. 그 판단은 의료진이 직접 덧붙입니다.',
  '- 처방받은 약의 조절이나 검사 결과처럼 처방한 의사만 판단할 수 있는 질문이면 그렇게 말하세요. 예: "그런 결정은 약을 처방한 의사만 할 수 있습니다. 진료받은 병원에서 빠르게 진료받으세요."',
  '- 진찰이나 검사로만 알 수 있는 문제면 온라인으로 해결할 수 없다고 분명히 말하세요.',
  '- 환자가 감사 인사만 남겼다면 짧게 받으세요.',
  '- 환자가 외국어로 썼다면 한국에 있다고 가정하지 마세요.',
  '- 이 글은 의료진이 자기 이름으로 보냅니다. 자기소개나 서명을 쓰지 마세요.',
  '- "보듬", "인턴", "AI" 처럼 작성자를 밝히는 표현을 쓰지 마세요.',
  '- "의료진이 확인한 바로는"이라는 표현은 쓰지 마세요.',
  '',
  '[출력] 반드시 JSON: {"replyDraft": "..."}',
].join('\n');

const FOLLOW_UP_DISCLAIMER = 'AI가 추가 질문만 보고 작성한 초안입니다. 진단·처방이 아니며 의료진 검토가 필요합니다.';

const SUMMARY_DISCLAIMER = 'AI가 환자 입력만으로 정리한 초안입니다. 진단·처방이 아니며 의료진 검토가 필요합니다.';
const REPLY_DRAFT_DISCLAIMER = '의료진 검토 전에는 환자에게 전달되지 않습니다. 확인 후 수정하여 보내 주세요.';

// The model returns a SOAP string when asked plainly, but an object keyed by
// S/O/A/P when it has been thinking. String() on that yields "[object Object]".
function coerceText(value) {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.map(coerceText).filter(Boolean).join('\n');
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .map(([key, entry]) => {
        const text = coerceText(entry);
        return text ? `${key}: ${text}` : '';
      })
      .filter(Boolean)
      .join('\n');
  }

  return '';
}

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
        // Gemini 2.5 charges internal reasoning against maxOutputTokens. At the
        // previous budget it spent 1,149 tokens thinking and had 37 left, which
        // truncated the JSON mid-object and silently produced no summary. This
        // is structured extraction, not reasoning, so the budget buys nothing.
        thinkingConfig: { thinkingBudget: 0 },
        abortSignal: AbortSignal.timeout(config.timeoutMs),
      },
    });

    const parsed = parseModelJson(response?.text);
    const soap = coerceText(parsed?.soap);
    const replyDraft = coerceText(parsed?.replyDraft);
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

  // Drafts an answer to one new question asked on an existing consultation.
  // The chart is passed for context but is not re-summarised: the clinician
  // already has the SOAP note from intake above this.
  async generateFollowUp({ patientData = {}, question = '', priorReply = '' } = {}) {
    const config = this.getConfig();
    if (!config.enabled) return null;

    const trimmedQuestion = String(question || '').trim();
    if (!trimmedQuestion) return null;

    const client = this.getClient();
    if (!client) return null;

    const chart = buildPatientChartText(patientData);
    const contents = [
      chart ? `[기존 문진]\n${chart}` : '',
      priorReply ? `[의료진이 이미 보낸 답변]\n${String(priorReply).trim()}` : '',
      `[환자의 추가 질문]\n${trimmedQuestion}`,
    ].filter(Boolean).join('\n\n');

    const response = await client.models.generateContent({
      model: config.model,
      contents,
      config: {
        systemInstruction: FOLLOW_UP_SYSTEM_INSTRUCTION,
        temperature: 0.2,
        maxOutputTokens: config.maxOutputTokens,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
        abortSignal: AbortSignal.timeout(config.timeoutMs),
      },
    });

    const replyDraft = coerceText(parseModelJson(response?.text)?.replyDraft);
    if (!replyDraft) return null;

    return {
      question: trimmedQuestion,
      replyDraft,
      disclaimer: FOLLOW_UP_DISCLAIMER,
      replyDraftDisclaimer: REPLY_DRAFT_DISCLAIMER,
      model: config.model,
      status: 'ready',
    };
  }

  async generateFollowUpSafely(input = {}) {
    if (!this.isEnabled()) return null;

    try {
      return await this.generateFollowUp(input);
    } catch (error) {
      console.error('[Doctor Follow-Up Draft Error]', error?.message || error);
      return {
        question: String(input?.question || '').trim() || null,
        replyDraft: null,
        disclaimer: FOLLOW_UP_DISCLAIMER,
        replyDraftDisclaimer: REPLY_DRAFT_DISCLAIMER,
        model: this.getConfig().model,
        status: 'failed',
        error: String(error?.message || 'follow_up_draft_failed').slice(0, 300),
      };
    }
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
module.exports.coerceText = coerceText;
module.exports.SUMMARY_DISCLAIMER = SUMMARY_DISCLAIMER;
module.exports.REPLY_DRAFT_DISCLAIMER = REPLY_DRAFT_DISCLAIMER;
module.exports.SYSTEM_INSTRUCTION = SYSTEM_INSTRUCTION;
module.exports.FOLLOW_UP_SYSTEM_INSTRUCTION = FOLLOW_UP_SYSTEM_INSTRUCTION;
module.exports.FOLLOW_UP_DISCLAIMER = FOLLOW_UP_DISCLAIMER;
