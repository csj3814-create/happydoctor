const { SolapiMessageService } = require('solapi');

const dbService = require('./dbService');
const emailService = require('./emailService');
const { getSolapiSmsConfig, getSmsBalanceAlertConfig } = require('../config');

const STATE_COLLECTION = 'system_jobs';
const STATE_DOC_ID = 'sms_balance_alert';

// From 24 October to 14 November 2026 the SOLAPI account had no balance and
// every reply text failed. The only signal was each text failing, after the
// patient had already gone untold. This looks at the balance itself, before
// it runs out, and says so once a day while it is low.
class SmsBalanceService {
  constructor() {
    const config = getSmsBalanceAlertConfig();
    this.enabled = config.enabled;
    this.threshold = config.threshold;
    this.checkIntervalMs = config.checkIntervalMs;
    this.alertIntervalMs = config.alertIntervalMs;
    this.processorHandle = null;
    this.cachedClient = null;
  }

  isOperational() {
    return this.enabled && Boolean(getSolapiSmsConfig()) && emailService.isConfigured();
  }

  getClient() {
    if (!this.cachedClient) {
      const sms = getSolapiSmsConfig();
      if (!sms) return null;
      this.cachedClient = new SolapiMessageService(sms.apiKey, sms.apiSecret);
    }
    return this.cachedClient;
  }

  async initialize() {
    if (!this.isOperational()) {
      console.log('[SMS Balance] Disabled (alert off, SOLAPI or mail not configured).');
      return;
    }

    await this.runOnce();
    this.processorHandle = setInterval(() => {
      this.runOnce().catch((error) => console.error('[SMS Balance Error]', error?.message || error));
    }, this.checkIntervalMs);
  }

  // Points pay for messages too: the failure that started this read
  // "차감금액 45, 보유잔액 0, 보유포인트 30" - both, together, were short.
  async readAvailable() {
    const client = this.getClient();
    if (!client) return null;
    const { balance = 0, point = 0 } = await client.getBalance();
    return { balance: Number(balance) || 0, point: Number(point) || 0, available: (Number(balance) || 0) + (Number(point) || 0) };
  }

  async runOnce(now = Date.now()) {
    if (!this.isOperational()) return false;

    let reading;
    try {
      reading = await this.readAvailable();
    } catch (error) {
      // An unreadable balance is not a low one; the next check tries again.
      console.error('[SMS Balance] Could not read balance:', error?.message || error);
      return false;
    }
    if (!reading || reading.available >= this.threshold) return false;

    if (!(await this.claimAlert(now))) return false;

    await emailService.sendSmsLowBalanceEmail({
      balance: reading.balance,
      point: reading.point,
      threshold: this.threshold,
    });
    console.warn(`[SMS Balance] Low: ${reading.available} available (threshold ${this.threshold}); operators told.`);
    return true;
  }

  // Once a day at most, across restarts: the guard lives in Firestore.
  async claimAlert(now) {
    const db = dbService.getDb();
    if (!db) return false;

    const ref = db.collection(STATE_COLLECTION).doc(STATE_DOC_ID);
    return db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const last = snapshot.exists ? Number(snapshot.data()?.lastAlertAtMs) || 0 : 0;
      if (now - last < this.alertIntervalMs) return false;
      transaction.set(ref, { lastAlertAtMs: now }, { merge: true });
      return true;
    });
  }
}

module.exports = new SmsBalanceService();
module.exports.SmsBalanceService = SmsBalanceService;
