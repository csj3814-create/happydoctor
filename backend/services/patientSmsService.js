const { SolapiMessageService } = require('solapi');

const emailService = require('./emailService');
const {
  acknowledgePatientSmsNotification,
  claimPatientSmsNotification,
  isSmsDeliverableNumber,
  reclaimExpiredPatientSmsLeases,
} = require('./notifyService');
const { getPatientSmsRuntimeConfig, getSolapiSmsConfig } = require('../config');

const DEFAULT_PATIENT_SMS_LEASE_MS = 60 * 1000;
const DEFAULT_PATIENT_SMS_POLL_INTERVAL_MS = 30 * 1000;
const DEFAULT_PATIENT_SMS_BATCH_SIZE = 10;
const FAILURE_REASON_MAX_LENGTH = 300;

// Failures of our SOLAPI account rather than of the recipient. The message is
// fine and will go once the account is; retrying it five times in thirty
// minutes and giving up just loses it. From 24 October to 14 November every
// reply text failed this way and was abandoned.
const ACCOUNT_FAILURE_PATTERN = /NotEnoughBalance|잔액이 부족/i;
const ACCOUNT_HOLD_MINUTES = 30;
// "Your answer has arrived" a day late is still worth sending; much later and
// the patient has either looked already or stopped expecting it.
const ACCOUNT_HOLD_MAX_AGE_MS = 24 * 60 * 60 * 1000;
// One mail says the account needs topping up. Thirty does not say it louder.
const ACCOUNT_ALERT_INTERVAL_MS = 6 * 60 * 60 * 1000;

function isAccountFailure(reason) {
  return ACCOUNT_FAILURE_PATTERN.test(String(reason || ''));
}

function toMillis(value) {
  if (!value) return 0;
  if (value.toMillis) return value.toMillis();
  if (value._seconds) return value._seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

// SOLAPI reports per-recipient rejections inside failedMessageList; the generic
// error message only says to go look there. Recipient numbers are dropped: the
// status code and text are what identify the problem.
function describeSmsFailure(error) {
  const failedMessages = Array.isArray(error?.failedMessageList) ? error.failedMessageList : [];

  if (failedMessages.length > 0) {
    const reasons = Array.from(new Set(failedMessages.map((entry) => {
      const code = entry?.statusCode || 'unknown';
      const detail = entry?.statusMessage || '';
      return detail ? `${code} ${detail}` : code;
    })));

    return reasons.join(' | ').slice(0, FAILURE_REASON_MAX_LENGTH);
  }

  return String(error?.message || 'sms_delivery_failed').slice(0, FAILURE_REASON_MAX_LENGTH);
}

class PatientSmsService {
  constructor() {
    const runtimeConfig = getPatientSmsRuntimeConfig();
    this.leaseMs = runtimeConfig.leaseMs || DEFAULT_PATIENT_SMS_LEASE_MS;
    this.pollIntervalMs = runtimeConfig.pollIntervalMs || DEFAULT_PATIENT_SMS_POLL_INTERVAL_MS;
    this.batchSize = runtimeConfig.batchSize || DEFAULT_PATIENT_SMS_BATCH_SIZE;
    this.processorHandle = null;
    this.isProcessing = false;
    this.cachedClient = null;
    this.cachedConfigKey = null;
    this.lastAccountAlertAt = 0;
  }

  getSmsConfig() {
    return getSolapiSmsConfig();
  }

  isConfigured() {
    return Boolean(this.getSmsConfig());
  }

  getClient() {
    const smsConfig = this.getSmsConfig();
    if (!smsConfig) {
      return null;
    }

    const configKey = `${smsConfig.apiKey}:${smsConfig.apiSecret}`;
    if (!this.cachedClient || this.cachedConfigKey !== configKey) {
      this.cachedClient = new SolapiMessageService(smsConfig.apiKey, smsConfig.apiSecret);
      this.cachedConfigKey = configKey;
    }

    return this.cachedClient;
  }

  async initialize() {
    if (!this.isConfigured()) {
      console.log('[Patient SMS] SOLAPI config missing, SMS delivery loop disabled.');
      return;
    }

    // The initial drain must never stop the loop from starting: a single
    // failing message here previously left SMS delivery dead until the next
    // deploy, and the same message failed again on every restart.
    try {
      await reclaimExpiredPatientSmsLeases();
      await this.processDueNotifications();
    } catch (error) {
      console.error('[Patient SMS] Initial drain failed, continuing:', error?.message || error);
    }

    this.startProcessorLoop();
  }

  startProcessorLoop() {
    if (this.processorHandle || !this.isConfigured()) return;

    this.processorHandle = setInterval(() => {
      this.processDueNotifications().catch((error) => {
        console.error('[Patient SMS Scheduler Error]', error);
      });
    }, this.pollIntervalMs);
  }

  async processDueNotifications() {
    if (this.isProcessing || !this.isConfigured()) return 0;
    this.isProcessing = true;

    try {
      let processedCount = 0;

      while (processedCount < this.batchSize) {
        const claimedNotification = await claimPatientSmsNotification();
        if (!claimedNotification?.notificationId) {
          break;
        }

        await this.executeClaimedNotification(claimedNotification);
        processedCount += 1;
      }

      return processedCount;
    } finally {
      this.isProcessing = false;
    }
  }

  async sendSms({ phoneNumber, message }) {
    const client = this.getClient();
    const smsConfig = this.getSmsConfig();

    if (!client || !smsConfig) {
      throw new Error('sms_not_configured');
    }

    await client.send({
      to: phoneNumber,
      from: smsConfig.sender,
      text: message,
      autoTypeDetect: true,
    });
  }

  // Never rethrows: one undeliverable message must not abort the batch and
  // strand every message queued behind it.
  async executeClaimedNotification(notification) {
    // Queued before the deliverability check existed, or queued for a number
    // SOLAPI cannot reach. Retrying five times cannot change the outcome.
    if (!isSmsDeliverableNumber(notification.phoneNumber)) {
      const reason = 'unsupported_recipient_country';
      const outcome = await acknowledgePatientSmsNotification(notification.notificationId, {
        delivered: false,
        error: reason,
        exhaust: true,
      });

      console.error(`[Patient SMS] ${notification.notificationId} targets a number SOLAPI cannot reach.`);
      await this.reportExhaustedNotification(notification, outcome, reason);
      return false;
    }

    try {
      await this.sendSms({
        phoneNumber: notification.phoneNumber,
        message: notification.message,
      });

      await acknowledgePatientSmsNotification(notification.notificationId, { delivered: true });
      return true;
    } catch (error) {
      const reason = describeSmsFailure(error);
      let outcome = null;

      const queuedAt = toMillis(notification.createdAt);
      const fresh = !queuedAt || Date.now() - queuedAt < ACCOUNT_HOLD_MAX_AGE_MS;
      if (isAccountFailure(reason) && fresh) {
        try {
          await acknowledgePatientSmsNotification(notification.notificationId, {
            delivered: false,
            error: reason,
            holdMinutes: ACCOUNT_HOLD_MINUTES,
          });
        } catch (ackError) {
          console.error('[Patient SMS Ack Error]', ackError?.message || ackError);
        }

        console.error(`[Patient SMS] SOLAPI account cannot send (${reason}); holding ${notification.notificationId}.`);
        await this.reportAccountFailure(reason);
        return false;
      }

      try {
        outcome = await acknowledgePatientSmsNotification(notification.notificationId, {
          delivered: false,
          error: reason,
        });
      } catch (ackError) {
        console.error('[Patient SMS Ack Error]', ackError?.message || ackError);
      }

      if (outcome?.exhausted) {
        console.error(
          `[Patient SMS] Giving up on ${notification.notificationId} after ${outcome.attemptCount} attempts: ${reason}`,
        );
        await this.reportExhaustedNotification(notification, outcome, reason);
      } else {
        console.warn(`[Patient SMS] Delivery failed, will retry: ${reason}`);
      }

      return false;
    }
  }

  // Throttled in memory: a restart may send one extra mail, which is better
  // than a Firestore write on every held message.
  async reportAccountFailure(reason, now = Date.now()) {
    if (now - this.lastAccountAlertAt < ACCOUNT_ALERT_INTERVAL_MS) return false;
    this.lastAccountAlertAt = now;

    try {
      await emailService.sendSmsAccountFailureEmail({ reason });
      return true;
    } catch (error) {
      console.error('[Patient SMS Account Alert Error]', error?.message || error);
      return false;
    }
  }

  // Phone numbers and reply bodies stay out of the report: it says only that a
  // patient could not be reached and points at the portal.
  async reportExhaustedNotification(notification, outcome, reason) {
    try {
      await emailService.sendPatientSmsFailureEmail({
        userId: notification.userId || outcome?.userId || null,
        attemptCount: outcome?.attemptCount || null,
        reason,
      });
    } catch (error) {
      console.error('[Patient SMS Failure Report Error]', error?.message || error);
    }
  }
}

module.exports = new PatientSmsService();
module.exports.PatientSmsService = PatientSmsService;
module.exports.isAccountFailure = isAccountFailure;
