const test = require('node:test');
const assert = require('node:assert/strict');

const { getPortalInboxStage } = require('../services/dbService');

const REPLIED_AT = '2026-11-20T01:00:00.000Z';
const LATER = '2026-11-21T01:00:00.000Z';

function openConsultation(logs) {
  return { status: 'ACTIVE', doctorRepliedAt: REPLIED_AT, followUpLogs: logs };
}

test('a system record after the reply does not look like a waiting patient', () => {
  for (const action of ['AUTO_CLOSE', 'DOCTOR_CLOSE', 'COMPLETE']) {
    assert.equal(getPortalInboxStage(openConsultation([{ action, timestamp: LATER }])), 'replied', action);
  }
});

test('the patient speaking after the reply still puts it in the follow-up tab', () => {
  // A question typed on the status page or in KakaoTalk.
  assert.equal(getPortalInboxStage(openConsultation([{ action: 'PATIENT_FOLLOW_UP_QUESTION', timestamp: LATER }])), 'followup');
  // An answer to the KakaoTalk check-in, which pages the clinicians as urgent.
  assert.equal(getPortalInboxStage(openConsultation([{ action: 'ESCALATE_FU', timestamp: LATER }])), 'followup');
});

test('an action nobody listed counts as the patient, not as the system', () => {
  // Wrongly showing a consultation as waiting costs a glance; wrongly hiding
  // one costs a patient.
  assert.equal(getPortalInboxStage(openConsultation([{ action: 'SOMETHING_NEW', timestamp: LATER }])), 'followup');
  assert.equal(getPortalInboxStage(openConsultation([{ timestamp: LATER }])), 'followup');
});

test('a question before the reply is answered, and closing wins over everything', () => {
  assert.equal(getPortalInboxStage(openConsultation([{ action: 'PATIENT_FOLLOW_UP_QUESTION', timestamp: '2026-11-19T01:00:00.000Z' }])), 'replied');
  assert.equal(getPortalInboxStage({ ...openConsultation([{ action: 'PATIENT_FOLLOW_UP_QUESTION', timestamp: LATER }]), status: 'COMPLETED' }), 'closed');
});
