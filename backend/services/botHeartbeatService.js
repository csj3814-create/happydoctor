const emailService = require('./emailService');
const {
  getMessengerBotHeartbeat,
  setMessengerBotAlertState,
} = require('./notifyService');
const { getBotHeartbeatConfig } = require('../config');

// Doctor alerts are delivered by a MessengerBot phone that polls this server.
// When that phone stopped, nothing recorded the fact and the queue simply went
// quiet, which is how consultations piled up unnoticed. This watches the gap.
class BotHeartbeatService {
  constructor() {
    const config = getBotHeartbeatConfig();
    this.enabled = config.enabled;
    this.staleMinutes = config.staleMinutes;
    this.checkIntervalMs = config.checkIntervalMs;
    this.processorHandle = null;
    this.isChecking = false;
  }

  isOperational() {
    return this.enabled && emailService.isConfigured();
  }

  async initialize() {
    if (!this.isOperational()) {
      console.log('[Bot Heartbeat] Disabled (watchdog off or SMTP not configured).');
      return;
    }

    try {
      await this.runOnce();
    } catch (error) {
      console.error('[Bot Heartbeat] Initial check failed, continuing:', error?.message || error);
    }

    this.startProcessorLoop();
  }

  startProcessorLoop() {
    if (this.processorHandle || !this.isOperational()) return;

    this.processorHandle = setInterval(() => {
      this.runOnce().catch((error) => {
        console.error('[Bot Heartbeat Error]', error);
      });
    }, this.checkIntervalMs);
  }

  async runOnce(now = new Date()) {
    if (this.isChecking || !this.isOperational()) return null;
    this.isChecking = true;

    try {
      const heartbeat = await getMessengerBotHeartbeat();

      // No heartbeat recorded yet means this build has never seen the bot poll.
      // Staying silent avoids alerting on a fresh deploy before the first poll.
      if (!heartbeat?.lastPolledAt) return null;

      const minutesSinceLastPoll = Math.floor(
        (now.getTime() - heartbeat.lastPolledAt.getTime()) / 60000,
      );
      const stale = minutesSinceLastPoll >= this.staleMinutes;
      const alreadyAlerting = Boolean(heartbeat.alertingSince);

      if (stale && !alreadyAlerting) {
        await setMessengerBotAlertState({ alerting: true, at: now });
        await emailService.sendBotHeartbeatAlertEmail({
          minutesSinceLastPoll,
          lastPolledAt: heartbeat.lastPolledAt.toISOString(),
          recovered: false,
        });
        console.error(`[Bot Heartbeat] No poll for ${minutesSinceLastPoll} minutes; alert sent.`);
        return { state: 'alerted', minutesSinceLastPoll };
      }

      if (!stale && alreadyAlerting) {
        await setMessengerBotAlertState({ alerting: false, at: now });
        await emailService.sendBotHeartbeatAlertEmail({
          minutesSinceLastPoll,
          lastPolledAt: heartbeat.lastPolledAt.toISOString(),
          recovered: true,
        });
        console.log('[Bot Heartbeat] Polling resumed; recovery notice sent.');
        return { state: 'recovered', minutesSinceLastPoll };
      }

      // One alert per outage: a stale bot that is already flagged stays quiet
      // until it recovers, so an overnight outage cannot flood the inbox.
      return { state: stale ? 'still_stale' : 'healthy', minutesSinceLastPoll };
    } finally {
      this.isChecking = false;
    }
  }
}

module.exports = new BotHeartbeatService();
module.exports.BotHeartbeatService = BotHeartbeatService;
