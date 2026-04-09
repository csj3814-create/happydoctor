const { SolapiMessageService } = require('solapi');

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

    await reclaimExpiredPatientSmsLeases();
    await this.processDueNotifications();
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

  async executeClaimedNotification(notification) {
    try {
      await this.sendSms({
        phoneNumber: notification.phoneNumber,
        message: notification.message,
      });

      await acknowledgePatientSmsNotification(notification.notificationId, {
        delivered: true,
      });
    } catch (error) {
      await acknowledgePatientSmsNotification(notification.notificationId, {
        delivered: false,
        error: error?.message || 'sms_delivery_failed',
      });
      throw error;
    }
  }
}

module.exports = new PatientSmsService();
