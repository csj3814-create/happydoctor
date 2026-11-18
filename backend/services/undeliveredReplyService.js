const dbService = require('./dbService');
const notifyService = require('./notifyService');
const { summarizeSmsForReplies, isUndeliveredReply } = require('./replyDelivery');

// Whether a consultation's latest reply is sitting unread after the text that
// should have announced it failed. Returns that reply, or null.
//
// Never throws: both callers are background jobs, and a lookup that fails
// must not be read as "delivered" by one and crash the other. On error it
// answers "undelivered", the answer that keeps a consultation open and in
// front of a person rather than closing it unseen.
async function findUndeliveredLatestReply(consultation) {
  try {
    const replies = await dbService.getDoctorRepliesForConsultation(consultation?.id);
    const latest = replies[replies.length - 1];
    if (!latest || latest.seen) return null;

    const outcomes = await notifyService.getPatientSmsOutcomes(consultation.userId);
    const sms = summarizeSmsForReplies(replies, outcomes).get(latest.id);
    return isUndeliveredReply(latest, sms) ? { reply: latest, sms } : null;
  } catch (error) {
    console.error('[Undelivered Reply Check Error]', error?.message || error);
    return { reply: null, sms: { status: 'unknown', reason: String(error?.message || error) } };
  }
}

module.exports = { findUndeliveredLatestReply };
