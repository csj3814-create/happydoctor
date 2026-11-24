const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildInitialPatientReply,
  isNightInKorea,
  isStandardPatientReply,
  INITIAL_PATIENT_REPLY,
  INITIAL_PATIENT_REPLY_NIGHT,
  FOLLOW_UP_PATIENT_REPLY,
  analyzeAndRouteTriage,
} = require('../services/llmService');

// Times given in UTC; Korea is UTC+9.
const kst = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(Date.UTC(2026, 10, 24, h - 9, m));
};

test('the emergency line no longer sends patients abroad to 119', () => {
  // Translated for patients in Birmingham, Yaoundé and Karachi, where 119
  // reaches nobody.
  for (const text of [INITIAL_PATIENT_REPLY, INITIAL_PATIENT_REPLY_NIGHT, FOLLOW_UP_PATIENT_REPLY]) {
    assert.doesNotMatch(text, /119 또는/);
    assert.match(text, /가까운 응급실이나 응급 전화\(한국은 119\)/);
  }
});

test('between midnight and 7am in Korea the wait is stated honestly', () => {
  // Those hours waited a median 4.8 hours against 37 minutes overall.
  assert.equal(isNightInKorea(kst('00:00')), true);
  assert.equal(isNightInKorea(kst('03:30')), true);
  assert.equal(isNightInKorea(kst('06:59')), true);
  assert.equal(isNightInKorea(kst('07:00')), false);
  assert.equal(isNightInKorea(kst('14:00')), false);
  assert.equal(isNightInKorea(kst('23:59')), false);

  assert.match(buildInitialPatientReply(kst('03:00')), /한국은 지금 밤이라/);
  assert.doesNotMatch(buildInitialPatientReply(kst('03:00')), /잠시 기다려/);
  assert.match(buildInitialPatientReply(kst('14:00')), /잠시 기다려 주세요/);
});

test('the triage result carries the reply for the time it was received', async () => {
  const night = await analyzeAndRouteTriage({}, { now: kst('02:00') });
  const day = await analyzeAndRouteTriage({}, { now: kst('11:00') });
  assert.equal(night.replyToPatient, INITIAL_PATIENT_REPLY_NIGHT);
  assert.equal(day.replyToPatient, INITIAL_PATIENT_REPLY);
});

test('every acknowledgement ever sent is recognised as the standard one', () => {
  // The portal hides these from the chart. Forgetting the old wording would
  // bring the card back on every past consultation.
  const legacyInitial = [
    '상담 내용이 접수되었습니다.',
    '자동 진단이나 치료 안내 없이 자원봉사 의료진이 직접 확인합니다.',
    '답변이 준비될 때까지 잠시 기다려 주세요.',
    '증상이 급하거나 심해지고 있거나 즉시 도움이 필요하면 기다리지 말고 119 또는 가까운 응급실을 이용해 주세요.',
  ].join('\n');
  const legacyFollowUp = [
    '추가로 보내주신 내용이 접수되었습니다.',
    '자동 진단이나 치료 안내 없이 의료진이 다시 확인합니다.',
    '증상이 급하거나 심해지고 있거나 즉시 도움이 필요하면 기다리지 말고 119 또는 가까운 응급실을 이용해 주세요.',
  ].join('\n');

  for (const text of [INITIAL_PATIENT_REPLY, INITIAL_PATIENT_REPLY_NIGHT, FOLLOW_UP_PATIENT_REPLY, legacyInitial, legacyFollowUp]) {
    assert.equal(isStandardPatientReply(text), true);
  }
  assert.equal(isStandardPatientReply('의료진이 직접 쓴 다른 내용'), false);
  assert.equal(isStandardPatientReply(''), false);
});
