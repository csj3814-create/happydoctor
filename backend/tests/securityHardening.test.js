const test = require('node:test');
const assert = require('node:assert/strict');

const {
  analyzeAndRouteTriage,
  analyzeFollowUp,
  buildDoctorReviewNotice,
} = require('../services/llmService');
const {
  buildDoctorFollowUpNotificationMessage,
  isShortTrackingCodeLookupExpired,
} = require('../services/dbService');
const { createApp } = require('../app');

test('the API trusts exactly one Render proxy hop for client rate-limit keys', () => {
  const app = createApp();

  assert.equal(app.get('trust proxy'), 1);
});

test('new consultations deterministically route to clinician review without medical advice', async () => {
  const result = await analyzeAndRouteTriage({
    cc: '이 값은 자동 분석되면 안 됩니다.',
    symptom: '민감한 건강정보',
  });

  assert.equal(result.action, 'ESCALATE');
  assert.match(result.replyToPatient, /접수/);
  assert.match(result.replyToPatient, /의료진/);
  assert.match(result.replyToPatient, /119/);
  assert.doesNotMatch(result.replyToPatient, /복용하세요|투약|치료하세요|질환|가능성이/);
  assert.match(result.soapChartForDoctor, /자동 분류하지 않음/);
  assert.match(result.soapChartForDoctor, /인증된 의료진 포털/);
  assert.doesNotMatch(result.soapChartForDoctor, /민감한 건강정보/);
});

test('follow-up consultations deterministically route to clinician review without medical advice', async () => {
  const result = await analyzeFollowUp('민감한 기존 차트', '1', '민감한 추가 증상');

  assert.equal(result.action, 'ESCALATE_FU');
  assert.match(result.replyToPatient, /접수/);
  assert.match(result.replyToPatient, /의료진/);
  assert.match(result.replyToPatient, /119/);
  assert.doesNotMatch(result.replyToPatient, /복용하세요|투약|치료하세요|질환|가능성이/);
  assert.match(result.fuChartForDoctor, /자동 분류하지 않음/);
  assert.doesNotMatch(result.fuChartForDoctor, /민감한 기존 차트|민감한 추가 증상/);
});

test('doctor review notifications contain no supplied health information', () => {
  const initialNotice = buildDoctorReviewNotice('initial');
  const followUpNotice = buildDoctorReviewNotice('follow_up');

  for (const notice of [initialNotice, followUpNotice]) {
    assert.match(notice, /긴급도: 자동 분류하지 않음/);
    assert.match(notice, /https:\/\/portal\.happydoctor\.kr\/open-browser/);
    assert.doesNotMatch(notice, /증상|진단명|환자 메시지/);
  }

  const publicFollowUpNotice = buildDoctorFollowUpNotificationMessage(
    { patientData: { cc: '민감한 증상' }, doctorChart: '민감한 기존 차트' },
    '민감한 환자 메시지',
    '민감한 번역문',
    'ko',
  );
  assert.match(publicFollowUpNotice, /긴급도: 자동 분류하지 않음/);
  assert.match(publicFollowUpNotice, /https:\/\/portal\.happydoctor\.kr\/open-browser/);
  assert.doesNotMatch(publicFollowUpNotice, /민감한 증상|민감한 기존 차트|민감한 환자 메시지|민감한 번역문/);
});

test('six-character tracking codes expire after 24 hours', () => {
  const nowMs = Date.parse('2026-07-28T12:00:00.000Z');

  assert.equal(isShortTrackingCodeLookupExpired('ABC234', {
    publicTrackingCodeIssuedAt: new Date(nowMs - (23 * 60 * 60 * 1000)),
  }, nowMs), false);

  assert.equal(isShortTrackingCodeLookupExpired('ABC234', {
    publicTrackingCodeIssuedAt: new Date(nowMs - (24 * 60 * 60 * 1000)),
  }, nowMs), true);

  assert.equal(isShortTrackingCodeLookupExpired('ABC234', {}, nowMs), true);
});

test('long tokens and legacy eight-character codes are not subject to the short-code expiry', () => {
  const nowMs = Date.parse('2026-07-28T12:00:00.000Z');
  const oldRecord = { createdAt: new Date('2020-01-01T00:00:00.000Z') };

  assert.equal(isShortTrackingCodeLookupExpired('ABC23456', oldRecord, nowMs), false);
  assert.equal(isShortTrackingCodeLookupExpired('a'.repeat(48), oldRecord, nowMs), false);
});
