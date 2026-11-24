const DOCTOR_PORTAL_URL = 'https://portal.happydoctor.kr/open-browser?next=%2F';

// This module is the patient-facing path and stays free of model output.
// Commit d78e4e9 removed automated clinical replies to patients; the Bodeum
// work that followed produces a draft for a clinician to approve, never text
// that reaches a patient unreviewed. See services/doctorSummaryService.js.
// This acknowledgement is translated for every non-Korean patient, and they
// write from Birmingham, Yaoundé and Karachi as well as from Korea. "119" is
// only an emergency number in Korea; elsewhere it sent someone in trouble to
// dial a number that does nothing.
const EMERGENCY_LINE = '증상이 급하거나 심해지고 있거나 즉시 도움이 필요하면 기다리지 말고 가까운 응급실이나 응급 전화(한국은 119)를 이용해 주세요.';

// Consultations received between midnight and 7am in Korea waited a median
// 4.8 hours for a first reply, against 37 minutes overall - the clinicians are
// volunteers, and asleep. "잠시 기다려 주세요" was not true then. It says
// "in Korea" because for most patients writing at that hour it is daytime.
const DAY_WAIT_LINE = '답변이 준비될 때까지 잠시 기다려 주세요.';
const NIGHT_WAIT_LINE = '한국은 지금 밤이라, 자원봉사 의료진의 답변은 한국 시간으로 아침에 도착할 수 있습니다.';
const NIGHT_START_HOUR_KST = 0;
const NIGHT_END_HOUR_KST = 7;

function isNightInKorea(now = new Date()) {
    const hour = new Date(now.getTime() + 9 * 60 * 60 * 1000).getUTCHours();
    return hour >= NIGHT_START_HOUR_KST && hour < NIGHT_END_HOUR_KST;
}

function buildInitialPatientReply(now = new Date()) {
    return [
        '상담 내용이 접수되었습니다.',
        '자동 진단이나 치료 안내 없이 자원봉사 의료진이 직접 확인합니다.',
        isNightInKorea(now) ? NIGHT_WAIT_LINE : DAY_WAIT_LINE,
        EMERGENCY_LINE,
    ].join('\n');
}

const INITIAL_PATIENT_REPLY = buildInitialPatientReply(new Date('2026-01-01T03:00:00Z'));
const INITIAL_PATIENT_REPLY_NIGHT = buildInitialPatientReply(new Date('2026-01-01T18:00:00Z'));

const FOLLOW_UP_PATIENT_REPLY = [
    '추가로 보내주신 내용이 접수되었습니다.',
    '자동 진단이나 치료 안내 없이 의료진이 다시 확인합니다.',
    EMERGENCY_LINE,
].join('\n');

// Every acknowledgement a patient may have been sent, including the wording
// stored on consultations before the emergency line changed. The portal hides
// these from the chart; dropping the old ones would bring the card back on
// every past consultation.
const LEGACY_EMERGENCY_LINE = '증상이 급하거나 심해지고 있거나 즉시 도움이 필요하면 기다리지 말고 119 또는 가까운 응급실을 이용해 주세요.';
const STANDARD_PATIENT_REPLIES = new Set([
    INITIAL_PATIENT_REPLY,
    INITIAL_PATIENT_REPLY_NIGHT,
    FOLLOW_UP_PATIENT_REPLY,
    INITIAL_PATIENT_REPLY.replace(EMERGENCY_LINE, LEGACY_EMERGENCY_LINE),
    FOLLOW_UP_PATIENT_REPLY.replace(EMERGENCY_LINE, LEGACY_EMERGENCY_LINE),
]);

function isStandardPatientReply(text) {
    return STANDARD_PATIENT_REPLIES.has(String(text || '').trim());
}

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

async function analyzeAndRouteTriage(patientData, options = {}) {
    return {
        action: 'ESCALATE',
        replyToPatient: buildInitialPatientReply(options.now || new Date()),
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
    INITIAL_PATIENT_REPLY,
    INITIAL_PATIENT_REPLY_NIGHT,
    FOLLOW_UP_PATIENT_REPLY,
    buildInitialPatientReply,
    isNightInKorea,
    isStandardPatientReply,
};
