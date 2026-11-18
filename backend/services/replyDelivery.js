// What became of the "your answer has arrived" text for each doctor reply.
// Pure and DB-free so the portal, the auto-close job and the daily digest all
// read the same answer from the same rule.
//
// Each reply queues its texts within seconds of being saved, and a later reply
// queues its own, so a text belongs to the newest reply saved before it.
const MATCH_SLACK_MS = 2 * 60 * 1000;

function toMillis(value) {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (value.toMillis) return value.toMillis();
  if (value._seconds) return value._seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

// delivered beats pending beats failed beats cancelled: one reminder that got
// through means the patient was told, whatever happened to the others.
function summarize(outcomes) {
  if (outcomes.length === 0) return { status: 'none', reason: null };
  if (outcomes.some((o) => o.status === 'delivered')) return { status: 'delivered', reason: null };

  const waiting = outcomes.filter((o) => o.status === 'pending' || o.status === 'leased');
  if (waiting.length > 0) {
    return { status: waiting.some((o) => o.held) ? 'held' : 'pending', reason: waiting.find((o) => o.reason)?.reason || null };
  }

  const failed = outcomes.filter((o) => o.status === 'failed');
  if (failed.length > 0) return { status: 'failed', reason: failed.find((o) => o.reason)?.reason || null };

  // Cancelled because the patient opened the reply before the text was due.
  return { status: 'cancelled', reason: null };
}

function summarizeSmsForReplies(replies = [], outcomes = []) {
  const ordered = [...replies]
    .map((reply) => ({ reply, at: toMillis(reply.createdAt) }))
    .sort((a, b) => a.at - b.at);

  const result = new Map();
  ordered.forEach(({ reply, at }, index) => {
    const from = at - MATCH_SLACK_MS;
    const until = index + 1 < ordered.length ? ordered[index + 1].at - MATCH_SLACK_MS : Infinity;
    const mine = outcomes.filter((o) => o.createdAtMs >= from && o.createdAtMs < until);
    result.set(reply.id, summarize(mine));
  });

  return result;
}

// The patient has an answer they do not know about, and the one channel that
// could have told them failed. Distinct from a patient with no channel at all:
// nobody can act on that one, while this one a clinician can still reach by
// some other means - which is why it is held open and listed, not closed.
function isUndeliveredReply(reply, smsSummary) {
  if (!reply || reply.seen) return false;
  return smsSummary?.status === 'failed';
}

module.exports = {
  summarizeSmsForReplies,
  isUndeliveredReply,
  toMillis,
};
