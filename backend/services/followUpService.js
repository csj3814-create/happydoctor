const dbService = require('./dbService');
const { enqueuePatientChannelPush } = require('./notifyService');
const { getFollowUpRuntimeConfig } = require('../config');

const DEFAULT_FOLLOW_UP_REMINDER_DELAYS_MINUTES = Object.freeze([15, 180, 1440]);
const DEFAULT_FOLLOW_UP_LEASE_MS = 60 * 1000;
const DEFAULT_FOLLOW_UP_POLL_INTERVAL_MS = 30 * 1000;
const DEFAULT_FOLLOW_UP_BATCH_SIZE = 10;

class FollowUpService {
  constructor() {
    const runtimeConfig = getFollowUpRuntimeConfig();
    this.pendingMessageExpiryMs = 2 * 24 * 60 * 60 * 1000;
    this.absoluteExpiryMs = 4 * 24 * 60 * 60 * 1000;
    this.leaseMs = runtimeConfig.leaseMs || DEFAULT_FOLLOW_UP_LEASE_MS;
    this.pollIntervalMs = runtimeConfig.pollIntervalMs || DEFAULT_FOLLOW_UP_POLL_INTERVAL_MS;
    this.batchSize = runtimeConfig.batchSize || DEFAULT_FOLLOW_UP_BATCH_SIZE;
    this.processorHandle = null;
    this.isProcessing = false;
  }

  async initialize() {
    await dbService.reclaimExpiredFollowUpLeases();
    await this.processDueSessions();
    this.startProcessorLoop();
  }

  toDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value.toDate === 'function') return value.toDate();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  startProcessorLoop() {
    if (this.processorHandle) return;

    this.processorHandle = setInterval(() => {
      this.processDueSessions().catch((error) => {
        console.error('[F/U Scheduler Error]', error);
      });
    }, this.pollIntervalMs);
  }

  async processDueSessions() {
    if (this.isProcessing) return 0;
    this.isProcessing = true;

    try {
      let processedCount = 0;

      while (processedCount < this.batchSize) {
        const claimedSession = await dbService.claimDueFollowUpSession({
          leaseMs: this.leaseMs,
          limit: this.batchSize,
        });

        if (!claimedSession?.userId) {
          break;
        }

        await this.executeClaimedFollowUpPush(claimedSession);
        processedCount += 1;
      }

      return processedCount;
    } finally {
      this.isProcessing = false;
    }
  }

  normalizeReminderDelaysMinutes(delays = DEFAULT_FOLLOW_UP_REMINDER_DELAYS_MINUTES) {
    const values = Array.isArray(delays) ? delays : [delays];
    const normalized = values
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0)
      .map((value) => Math.round(value));

    if (normalized.length === 0) {
      return [...DEFAULT_FOLLOW_UP_REMINDER_DELAYS_MINUTES];
    }

    return [...new Set(normalized)];
  }

  async scheduleFollowUp(userId, originalSoapChart, delayMinutes = 15) {
    return this.scheduleFollowUpWithOptions(userId, originalSoapChart, delayMinutes, {});
  }

  async scheduleFollowUpWithOptions(userId, originalSoapChart, delayMinutes = 15, options = {}) {
    const now = new Date();
    const reminderDelaysMinutes = this.normalizeReminderDelaysMinutes(
      options.reminderDelaysMinutes || delayMinutes,
    );
    const dueAt = new Date(now.getTime() + reminderDelaysMinutes[0] * 60 * 1000);

    await dbService.saveFollowUpSession(userId, {
      chart: originalSoapChart,
      createdAt: now,
      lastActiveAt: now,
      reminderDelaysMinutes,
      nextReminderIndex: 0,
      dueAt,
      status: 'scheduled',
      pendingMessage: null,
      pendingCreatedAt: null,
      leaseId: null,
      leaseExpiresAt: null,
      leasedAt: null,
      lastLeaseFailureReason: null,
      lastLeaseFailedAt: null,
    });

    console.log(`[Follow-Up Scheduled] ${userId} follow-up in ${delayMinutes} minutes.`);
  }

  async loadSession(userId) {
    const persisted = await dbService.getFollowUpSession(userId);
    if (!persisted) return null;

    return {
      ...persisted,
      createdAt: this.toDate(persisted.createdAt),
      lastActiveAt: this.toDate(persisted.lastActiveAt),
      dueAt: this.toDate(persisted.dueAt),
      pendingCreatedAt: this.toDate(persisted.pendingCreatedAt),
      reminderDelaysMinutes: this.normalizeReminderDelaysMinutes(persisted.reminderDelaysMinutes),
      nextReminderIndex: Number.isFinite(Number(persisted.nextReminderIndex))
        ? Number(persisted.nextReminderIndex)
        : 0,
    };
  }

  isExpired(session) {
    if (!session) return true;

    const now = Date.now();
    const createdAt = this.toDate(session.createdAt);
    if (!createdAt) return true;
    if (now - createdAt.getTime() > this.absoluteExpiryMs) return true;

    return false;
  }

  async executeClaimedFollowUpPush(session) {
    const userId = session?.userId;
    if (!userId) return;

    console.log(`[F/U Due Session Claimed] ${userId}`);

    if (this.isExpired(session)) {
      await this.cancelFollowUp(userId);
      return;
    }

    const message = [
      '보듬입니다 :)',
      '상담하신 지 시간이 조금 지나서요.',
      '',
      '지금 증상 점수는 어느 정도인가요?',
      '(0=없음, 10=극심함)',
      '',
      '새로운 증상이 있다면 함께 알려주세요.',
    ].join('\n');

    const now = new Date();
    const reminderDelaysMinutes = this.normalizeReminderDelaysMinutes(session.reminderDelaysMinutes);
    const currentReminderIndex = Number.isFinite(Number(session.nextReminderIndex))
      ? Number(session.nextReminderIndex)
      : 0;
    const nextReminderIndex = currentReminderIndex + 1;
    const nextDelayMinutes = reminderDelaysMinutes[nextReminderIndex];
    const nextDueAt = Number.isFinite(nextDelayMinutes)
      ? new Date(now.getTime() + nextDelayMinutes * 60 * 1000)
      : null;

    try {
      await enqueuePatientChannelPush(userId, message, 'follow_up');

      await dbService.saveFollowUpSession(userId, {
        lastActiveAt: now,
        pendingMessage: message,
        pendingCreatedAt: now,
        nextReminderIndex,
        dueAt: nextDueAt,
        status: nextDueAt ? 'scheduled' : 'pending',
        leaseId: null,
        leaseExpiresAt: null,
        leasedAt: null,
        lastLeaseFailureReason: null,
      });
    } catch (error) {
      await dbService.releaseFollowUpLease(userId, error?.message || 'push_enqueue_failed');
      throw error;
    }
  }

  async executeFollowUpPush(userId) {
    const session = await this.loadSession(userId);
    if (!session) return false;

    await this.executeClaimedFollowUpPush(session);
    return true;
  }

  async getOriginalChart(userId) {
    const session = await this.loadSession(userId);
    if (!session || this.isExpired(session)) {
      await this.cancelFollowUp(userId);
      return '이전 차트 기록 없음';
    }

    await dbService.saveFollowUpSession(userId, { lastActiveAt: new Date() });
    return session.chart;
  }

  async consumePendingFollowUp(userId) {
    const session = await this.loadSession(userId);
    if (!session || !session.pendingMessage) return null;

    const pendingCreatedAt = this.toDate(session.pendingCreatedAt);
    if (!pendingCreatedAt || Date.now() - pendingCreatedAt.getTime() > this.pendingMessageExpiryMs) {
      await this.cancelFollowUp(userId);
      return null;
    }

    const message = session.pendingMessage;
    await dbService.saveFollowUpSession(userId, {
      lastActiveAt: new Date(),
      pendingMessage: null,
      pendingCreatedAt: null,
      status: session.dueAt ? 'scheduled' : 'active',
    });

    return message;
  }

  async resetSession(userId) {
    await this.cancelFollowUp(userId);
    console.log(`[Session Reset] ${userId}`);
  }

  async cancelFollowUp(userId) {
    await dbService.deleteFollowUpSession(userId);
    console.log(`[F/U Cancelled] ${userId}`);
  }
}

module.exports = new FollowUpService();
