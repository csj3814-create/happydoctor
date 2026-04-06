const dbService = require('./dbService');
const { enqueuePatientChannelPush } = require('./notifyService');

const DEFAULT_FOLLOW_UP_REMINDER_DELAYS_MINUTES = Object.freeze([15, 180, 1440]);

class FollowUpService {
  constructor() {
    this.timers = new Map();
    this.pendingMessageExpiryMs = 2 * 24 * 60 * 60 * 1000;
    this.absoluteExpiryMs = 4 * 24 * 60 * 60 * 1000;
  }

  async initialize() {
    const sessions = await dbService.getScheduledFollowUpSessions();
    for (const session of sessions) {
      const dueAt = this.toDate(session.dueAt);
      if (!dueAt) continue;
      this.scheduleLocalTimer(session.userId, dueAt);
    }
  }

  toDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value.toDate === 'function') return value.toDate();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  scheduleLocalTimer(userId, dueAt) {
    this.clearLocalTimer(userId);

    const delayMs = Math.max(0, dueAt.getTime() - Date.now());
    const timerId = setTimeout(() => {
      this.executeFollowUpPush(userId).catch((error) => {
        console.error('[F/U Timer Error]', error);
      });
    }, delayMs);

    this.timers.set(userId, timerId);
  }

  clearLocalTimer(userId) {
    if (!this.timers.has(userId)) return;
    clearTimeout(this.timers.get(userId));
    this.timers.delete(userId);
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
    });

    this.scheduleLocalTimer(userId, dueAt);
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

  async executeFollowUpPush(userId) {
    console.log(`[F/U Timer Fired] ${userId}`);

    const session = await this.loadSession(userId);
    if (!session) return;

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

    await enqueuePatientChannelPush(userId, message, 'follow_up');

    await dbService.saveFollowUpSession(userId, {
      lastActiveAt: now,
      pendingMessage: message,
      pendingCreatedAt: now,
      nextReminderIndex,
      dueAt: nextDueAt,
      status: nextDueAt ? 'scheduled' : 'pending',
    });

    if (nextDueAt) {
      this.scheduleLocalTimer(userId, nextDueAt);
    } else {
      this.clearLocalTimer(userId);
    }
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
    this.clearLocalTimer(userId);
    await dbService.deleteFollowUpSession(userId);
    console.log(`[F/U Cancelled] ${userId}`);
  }
}

module.exports = new FollowUpService();
