const dbService = require('./dbService');
const emailService = require('./emailService');
const { getUnansweredDigestConfig } = require('../config');

const DIGEST_STATE_COLLECTION = 'system_jobs';
const DIGEST_STATE_DOC_ID = 'unanswered_digest';
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function toKstParts(date) {
  const shifted = new Date(date.getTime() + KST_OFFSET_MS);
  return {
    dateKey: shifted.toISOString().slice(0, 10),
    hour: shifted.getUTCHours(),
  };
}

function formatKst(value) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${new Date(parsed.getTime() + KST_OFFSET_MS).toISOString().slice(0, 16).replace('T', ' ')} KST`;
}

function getWaitingDays(createdAt, now) {
  const parsed = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - parsed.getTime()) / DAY_MS));
}

class UnansweredDigestService {
  constructor() {
    const config = getUnansweredDigestConfig();
    this.enabled = config.enabled;
    this.hourKst = config.hourKst;
    this.checkIntervalMs = config.checkIntervalMs;
    this.maxItems = config.maxItems;
    this.processorHandle = null;
    this.isProcessing = false;
  }

  isOperational() {
    return this.enabled && emailService.isConfigured();
  }

  async initialize() {
    if (!this.isOperational()) {
      console.log('[Unanswered Digest] Disabled (digest off or SMTP not configured).');
      return;
    }

    await this.runOnce();
    this.startProcessorLoop();
  }

  startProcessorLoop() {
    if (this.processorHandle || !this.isOperational()) return;

    this.processorHandle = setInterval(() => {
      this.runOnce().catch((error) => {
        console.error('[Unanswered Digest Error]', error);
      });
    }, this.checkIntervalMs);
  }

  // The send window is guarded by a Firestore doc rather than in-memory state so
  // a Render restart inside the digest hour cannot produce a duplicate mail.
  async claimTodaysDigest(dateKey) {
    const db = dbService.getDb();
    if (!db) return false;

    const docRef = db.collection(DIGEST_STATE_COLLECTION).doc(DIGEST_STATE_DOC_ID);

    return db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(docRef);
      if (snapshot.exists && snapshot.data()?.lastSentDateKst === dateKey) {
        return false;
      }

      transaction.set(docRef, {
        lastSentDateKst: dateKey,
        lastSentAt: new Date(),
      }, { merge: true });

      return true;
    });
  }

  async collectUnanswered(now) {
    const result = await dbService.getActiveConsultations({
      status: 'pending',
      limit: this.maxItems,
    });

    const items = (result.consultations || []).map((consultation) => ({
      receivedAt: formatKst(consultation.createdAt),
      waitingDays: getWaitingDays(consultation.createdAt, now),
      channel: consultation.entryChannel || null,
    }));

    return { items, total: result.total || items.length };
  }

  async runOnce(now = new Date()) {
    if (this.isProcessing || !this.isOperational()) return false;
    this.isProcessing = true;

    try {
      const { dateKey, hour } = toKstParts(now);
      if (hour !== this.hourKst) {
        return false;
      }

      const claimed = await this.claimTodaysDigest(dateKey);
      if (!claimed) {
        return false;
      }

      const { items, total } = await this.collectUnanswered(now);
      if (total === 0) {
        console.log('[Unanswered Digest] Nothing pending, digest skipped.');
        return false;
      }

      await emailService.sendUnansweredDigestEmail({
        items,
        total,
        generatedAt: formatKst(now),
      });

      console.log(`[Unanswered Digest] Sent digest for ${total} pending consultation(s).`);
      return true;
    } finally {
      this.isProcessing = false;
    }
  }
}

module.exports = new UnansweredDigestService();
module.exports.UnansweredDigestService = UnansweredDigestService;
module.exports.toKstParts = toKstParts;
module.exports.getWaitingDays = getWaitingDays;
