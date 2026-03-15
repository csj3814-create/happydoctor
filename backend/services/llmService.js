const { GoogleGenerativeAI } = require('@google/generative-ai');

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.3,
        responseMimeType: 'application/json',
    },
    systemInstruction: { parts: [{ text: `
당신은 '행복한 의사' 단체의 똑똑하고 다정한 예진 비서 '인턴 닥터 보듬'입니다.
'행복한 의사'는 병원에 가기 어려운 의료 취약계층(노숙자, 다문화 가정, 외국인 노동자, 주민등록 말소자, 의료보험 체불자 등) 환자분들을 온라인에서 돌보기 위해 자원봉사 의사들이 운영하는 비영리 봉사 단체입니다. 누구든지 상담을 받을 수 있습니다.
환자가 입력한 문진 내용(육하원칙)을 분석하여, 이 환자가 단순 홈케어/일반적 안내로 끝날 수 있는 경증인지(자율 해결), 아니면 전문의 선생님의 확인이 꼭 필요한지(협진)를 먼저 판단하세요.

[판단 기준 및 행동 (핵심 제약사항: 절대 구체적인 약물 투여나 의학적 검사 지시를 내리지 말 것)]
1. 경증 파악 (AUTONOMOUS_REPLY): 집에서 쉬거나 내일 천천히 병원에 가봐도 되는 경우
   - 전문의 보고용 차트를 생성하지 않습니다 (null 처리).
   - 환자에게 인턴 닥터 보듬의 따뜻한 위로와 휴식을 권하는 안심 멘트를 합니다. (예: "괜찮아요, 큰일 아닙니다. 내일 가까운 의원 가보세요.")
   - 답변 마지막에 다음 문구를 반드시 포함하세요: "\n\n🏥 '행복한 의사'는 의료 취약계층 환자분들을 위해 의사들이 자원봉사로 운영하는 비영리 단체입니다. 오늘 상담이 도움이 되셨다면, 이 활동이 계속될 수 있도록 작은 응원을 보내주세요. 💛"
2. 전문의 협진 (ESCALATE): 응급실에 가야 하거나 전문의의 확인이 필요한 애매한 경우
   - 전문의 보고용 SOAP 폼의 요약 차트를 생성하되, **검사 내용(Lab, X-ray)이나 구체적 투약 지시(Plan)는 절대 쓰지 마세요**. 오직 환자의 현재 증상 요약과 대략적인 위험도/응급도(Triage: 응급실행, 내일 의원 방문 등) 평가만 씁니다.
   - 환자에게 건넬 1차 안심 및 대기/응급실 권유 멘트를 작성하세요.
   - 답변 마지막에 다음 문구를 반드시 포함하세요: "\n\n🏥 '행복한 의사'는 의료 취약계층 환자분들을 위해 의사들이 자원봉사로 운영하는 비영리 단체입니다. 오늘 상담이 도움이 되셨다면, 이 활동이 계속될 수 있도록 작은 응원을 보내주세요. 💛"

[출력 양식: 반드시 JSON 포맷으로 렌더링할 것]
{
  "action": "AUTONOMOUS_REPLY" | "ESCALATE",
  "replyToPatient": "(환자에게 직송출할 다정한 답변 텍스트)",
  "soapChartForDoctor": "(ESCALATE일 경우에만 작성되는 마크다운 형태의 전문의용 예진 노트. 아닐 경우 null)"
}
` }] }
});

async function analyzeAndRouteTriage(patientData) {
    try {
        const prompt = `[환자 입력 문진 데이터]\n` +
            `- 연령: ${patientData.age}\n` +
            `- 성별: ${patientData.gender}\n` +
            `- 주증상(C.C): ${patientData.cc}\n` +
            `- 발생시기(Onset): ${patientData.onset}\n` +
            `- 양상/부위: ${patientData.symptom}\n` +
            `- NRS(통증점수): ${patientData.nrs}\n` +
            `- 동반증상: ${patientData.associated}\n` +
            `- 기저질환/약물: ${patientData.pmhx}\n` +
            `- 현재 위치: ${patientData.location}\n` +
            (patientData.symptomImage ? `- 증상 사진: ${patientData.symptomImage}\n` : '') +
            `\n위 정보를 분석하여 지침에 맞는 JSON 형태로 답변해주세요. JSON 구조체(마크다운 백틱 제외)만 정확히 반환하세요.`;

        const result = await model.generateContent(prompt);
        let textResult = result.response.text().trim();
        
        // JSON 파싱을 위해 혹시 모를 마크다운 블록 제거
        if (textResult.startsWith('```json')) {
            textResult = textResult.substring(7, textResult.length - 3).trim();
        } else if (textResult.startsWith('```')) {
            textResult = textResult.substring(3, textResult.length - 3).trim();
        }

        try {
            return JSON.parse(textResult);
        } catch (parseError) {
            console.error('JSON Parse failed, raw response:', textResult.substring(0, 200));
            // 잘린 JSON 복구 시도: 응답이 잘려서 파싱 실패한 경우 기본 응답 반환
            return {
                action: 'AUTONOMOUS_REPLY',
                replyToPatient: '증상을 확인했습니다. 현재 입력해주신 내용으로는 심각한 응급 상황은 아닌 것으로 보이지만, 증상이 지속되거나 악화된다면 가까운 병원이나 응급실을 방문해 주세요. 편히 쉬시고 수분을 충분히 섭취하세요. 💛\n\n🏥 \'행복한 의사\'는 의료 취약계층 환자분들을 위해 의사들이 자원봉사로 운영하는 비영리 단체입니다. 오늘 상담이 도움이 되셨다면, 이 활동이 계속될 수 있도록 작은 응원을 보내주세요. 💛',
                soapChartForDoctor: null
            };
        }

    } catch (error) {
        console.error('Gemini Analysis Error:', error);
        throw error;
    }
}

/**
 * [추가] F/U(추적 관찰) 상태를 비교 분석하는 Gemini 프롬프트
 */
async function analyzeFollowUp(originalChart, nrsChange, additionalSymptom) {
    try {
        const prompt = `[이전 환자 예진 차트 기록]\n${originalChart}\n\n` +
            `[일정 시간 경과 후 환자 상태 변화]\n` +
            `- 현재 통증 점수(NRS): ${nrsChange}\n` +
            `- 추가된 증상(환자 입력): ${additionalSymptom}\n\n` +
            `위 정보를 비교 분석하여 환자의 상태가 호전되었는지, 악화되었는지 판단하고 지침에 맞는 JSON 형태로 답변해주세요.\n` +
            `[판단 기준 및 주의사항: 절대 투약 지시나 검사 오더를 내리지 마세요. 오직 증상에 따른 다음 액션(응급실 가기, 병원 가기, 안심하기)만 제시하세요.]\n` +
            `1. 악화 (ESCALATE_FU): 통증 점수가 올랐거나 새로운 위험 증상 추가 시. 즉시 전문의 보고용 F/U 노트를 작성(증상 요약과 위급도 판단만)하고 환자에게 응급실 방문 권유 또는 대기 멘트.\n` +
            `2. 호전/유지 (AUTONOMOUS_FU): 통증이 줄거나 경미한 상태 유지 시. 환자에게 다정하게 안심시키는 멘트만 (의사 보고 안 함).\n` +
            `[출력 양식: 아래 JSON 구조(마크다운 백틱 제외)로만 반환]\n` +
            `{\n` +
            `  "action": "AUTONOMOUS_FU" | "ESCALATE_FU",\n` +
            `  "replyToPatient": "(환자에게 직송출할 F/U 다정한 답변 텍스트)",\n` +
            `  "fuChartForDoctor": "(ESCALATE_FU일 경우 작성되는 기존 대비 변화된 마크다운 F/U 노트. 아닐 경우 null)"\n` +
            `}`;

        const result = await model.generateContent(prompt);
        let textResult = result.response.text().trim();
        
        if (textResult.startsWith('\`\`\`json')) {
            textResult = textResult.substring(7, textResult.length - 3);
        } else if (textResult.startsWith('\`\`\`')) {
            textResult = textResult.substring(3, textResult.length - 3);
        }

        return JSON.parse(textResult);

    } catch (error) {
        console.error('Gemini FollowUp Error:', error);
        throw error;
    }
}

module.exports = {
    analyzeAndRouteTriage,
    analyzeFollowUp
};
