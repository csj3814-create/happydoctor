const test = require('node:test');
const assert = require('node:assert/strict');

const { CLOSED_STATUSES, isConsultationClosed } = require('../services/consultationStatus');

test('a consultation closed under either status is closed', () => {
  assert.equal(isConsultationClosed({ status: 'COMPLETED' }), true);
  // The status this service used before 'COMPLETED'. Ignoring it left these
  // consultations in no portal tab at all.
  assert.equal(isConsultationClosed({ status: 'CLOSED' }), true);
});

test('a closedAt closes a consultation whatever its status says', () => {
  assert.equal(isConsultationClosed({ status: 'ACTIVE', closedAt: '2026-09-14T00:00:00.000Z' }), true);
});

test('an open consultation stays open', () => {
  assert.equal(isConsultationClosed({ status: 'ACTIVE' }), false);
  assert.equal(isConsultationClosed({}), false);
  assert.equal(isConsultationClosed(null), false);
  assert.equal(isConsultationClosed(undefined), false);
});

test('an unfamiliar status is not treated as closed', () => {
  // Guessing would hide a live consultation from the queue.
  assert.equal(isConsultationClosed({ status: 'PENDING' }), false);
  assert.equal(isConsultationClosed({ status: 'completed' }), false);
});

test('the closed statuses are usable in a Firestore "in" query', () => {
  assert.ok(Array.isArray(CLOSED_STATUSES));
  assert.ok(CLOSED_STATUSES.length > 0 && CLOSED_STATUSES.length <= 10);
  assert.deepEqual([...CLOSED_STATUSES].sort(), ['CLOSED', 'COMPLETED']);
});
