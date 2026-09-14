// Whether a consultation is over. A pure rule with no database behind it, kept
// out of dbService so every caller gets the real thing rather than whatever a
// test happened to mock.
//
// It was written inline in eight places, which is how 'CLOSED' - the status
// this service used before 'COMPLETED' - came to be honoured by some paths and
// ignored by others, leaving 26 consultations in no portal tab at all.
const CLOSED_STATUSES = Object.freeze(['COMPLETED', 'CLOSED']);

function isConsultationClosed(doc) {
  return CLOSED_STATUSES.includes(doc?.status) || Boolean(doc?.closedAt);
}

module.exports = {
  CLOSED_STATUSES,
  isConsultationClosed,
};
