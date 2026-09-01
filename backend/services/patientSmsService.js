const { SolapiMessageService } = require('solapi');

const emailService = require('./emailService');
const {
  acknowledgePatientSmsNotification,
  claimPatientSmsNotification,
  reclaimExpiredPatientSmsLeases,
} = require('./notifyService');
const { getPatientSmsRuntimeConfig, getSolapiSmsConfig } = require('../config');

const DEFAULT_PATIENT_SMS_LEASE_MS = 60 * 1000;
const DEFAULT_PATIENT_SMS_POLL_INTERVAL_MS = 30 * 1000;
const DEFAULT_PATIENT_SMS_BATCH_SIZE = 10;

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
    try {
      await this.sendSms({
        phoneNumber: notification.phoneNumber,
        message: notification.message,
      });

      await acknowledgePatientSmsNotification(notification.notificationId, { delivered: true });
      return true;
    } catch (error) {
      const reason = error?.message || 'sms_delivery_failed';
      let outcome = null;

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
