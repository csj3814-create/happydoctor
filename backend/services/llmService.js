const DOCTOR_PORTAL_URL = 'https://portal.happydoctor.kr/open-browser?next=%2F';

// This module is the patient-facing path and stays free of model output.
// Commit d78e4e9 removed automated clinical replies to patients; the Bodeum
// work that followed produces a draft for a clinician to approve, never text
// that reaches a patient unreviewed. See services/doctorSummaryService.js.
const INITIAL_PATIENT_REPLY = [
    '상담 내용이 접수되었습니다.',
    '자동 진단이나 치료 안내 없이 자원봉사 의료진이 직접 확인합니다.',
    '답변이 준비될 때까지 잠시 기다려 주세요.',
    '증상이 급하거나 심해지고 있거나 즉시 도움이 필요하면 기다리지 말고 119 또는 가까운 응급실을 이용해 주세요.',
].join('\n');

const FOLLOW_UP_PATIENT_REPLY = [
    '추가로 보내주신 내용이 접수되었습니다.',
    '자동 진단이나 치료 안내 없이 의료진이 다시 확인합니다.',
    '증상이 급하거나 심해지고 있거나 즉시 도움이 필요하면 기다리지 말고 119 또는 가까운 응급실을 이용해 주세요.',
].join('\n');

function buildDoctorReviewNotice(kind) {
    const title = kind === 'follow_up'
        ? '[해피닥터] 상담 후속 내용 접수'
        : '[해피닥터] 새 상담 접수';

    return [
        title,
        '긴급도: 자동 분류하지 않음 - 의료진 확인 필요',
        '건강정보와 상담 내용은 인증된 의료진 포털에서 확인해 주세요.',
        `포털 확인: ${DOCTOR_PORTAL_URL}`,
    ].join('\n');
}

async function analyzeAndRouteTriage() {
    return {
        action: 'ESCALATE',
        replyToPatient: INITIAL_PATIENT_REPLY,
        soapChartForDoctor: buildDoctorReviewNotice('initial'),
    };
}

async function analyzeFollowUp() {
    return {
        action: 'ESCALATE_FU',
        replyToPatient: FOLLOW_UP_PATIENT_REPLY,
        fuChartForDoctor: buildDoctorReviewNotice('follow_up'),
    };
}

module.exports = {
    analyzeAndRouteTriage,
    analyzeFollowUp,
    buildDoctorReviewNotice,
};
