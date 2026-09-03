const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');

const CONFIG_PATH = path.resolve(__dirname, '..', 'config.js');
const NOTIFY_SERVICE_PATH = path.resolve(__dirname, '..', 'services', 'notifyService.js');
const EMAIL_SERVICE_PATH = path.resolve(__dirname, '..', 'services', 'emailService.js');
const HEARTBEAT_SERVICE_PATH = path.resolve(__dirname, '..', 'services', 'botHeartbeatService.js');

const DEFAULT_CONFIG = Object.freeze({
  enabled: true,
  staleMinutes: 30,
  checkIntervalMs: 5 * 60 * 1000,
});

function loadHeartbeatServiceWithMocks({ config = DEFAULT_CONFIG, state, emailService }) {
  const originalLoad = Module._load;

  Module._load = function patchedLoad(request, parent, isMain) {
    const resolved = (() => {
      try {
        return Module._resolveFilename(request, parent, isMain);
      } catch (error) {
        return request;
      }
    })();

    if (resolved === CONFIG_PATH) return { getBotHeartbeatConfig: () => config };
    if (resolved === EMAIL_SERVICE_PATH) return emailService;
    if (resolved === NOTIFY_SERVICE_PATH) {
      return {
        getMessengerBotHeartbeat: async () => state.heartbeat,
        setMessengerBotAlertState: async ({ alerting, at }) => {
          state.heartbeat = {
            ...state.heartbeat,
            alertingSince: alerting ? at : null,
            lastAlertAt: alerting ? at : state.heartbeat.lastAlertAt,
          };
          return true;
        },
      };
    }

    return originalLoad(request, parent, isMain);
  };

  delete require.cache[HEARTBEAT_SERVICE_PATH];

  try {
    return require(HEARTBEAT_SERVICE_PATH);
  } finally {
    Module._load = originalLoad;
    delete require.cache[HEARTBEAT_SERVICE_PATH];
  }
}

function createEmailSpy(sent) {
  return {
    isConfigured: () => true,
    sendBotHeartbeatAlertEmail: async (payload) => {
      sent.push(payload);
      return true;
    },
  };
}

const NOW = new Date('2026-09-02T12:00:00.000Z');

function minutesAgo(minutes) {
  return new Date(NOW.getTime() - minutes * 60 * 1000);
}

test('a bot polling normally raises no alert', { concurrency: false }, async () => {
  const sent = [];
  const state = { heartbeat: { lastPolledAt: minutesAgo(2), alertingSince: null } };
  const service = loadHeartbeatServiceWithMocks({ state, emailService: createEmailSpy(sent) });

  const result = await service.runOnce(NOW);

  assert.equal(result.state, 'healthy');
  assert.deepEqual(sent, []);
});

test('a bot silent past the threshold raises one alert', { concurrency: false }, async () => {
  const sent = [];
  const state = { heartbeat: { lastPolledAt: minutesAgo(45), alertingSince: null } };
  const service = loadHeartbeatServiceWithMocks({ state, emailService: createEmailSpy(sent) });

  const result = await service.runOnce(NOW);

  assert.equal(result.state, 'alerted');
  assert.equal(sent.length, 1);
  assert.equal(sent[0].recovered, false);
  assert.equal(sent[0].minutesSinceLastPoll, 45);
  assert.ok(state.heartbeat.alertingSince, 'the outage must be flagged');
});

test('an ongoing outage is not re-alerted on every check', { concurrency: false }, async () => {
  const sent = [];
  const state = { heartbeat: { lastPolledAt: minutesAgo(45), alertingSince: null } };
  const service = loadHeartbeatServiceWithMocks({ state, emailService: createEmailSpy(sent) });

  await service.runOnce(NOW);
  // An overnight outage would otherwise mail on every interval until morning.
  const second = await service.runOnce(new Date(NOW.getTime() + 10 * 60 * 1000));
  const third = await service.runOnce(new Date(NOW.getTime() + 60 * 60 * 1000));

  assert.equal(second.state, 'still_stale');
  assert.equal(third.state, 'still_stale');
  assert.equal(sent.length, 1);
});

test('polling resuming clears the flag and sends one recovery notice', { concurrency: false }, async () => {
  const sent = [];
  const state = {
    heartbeat: { lastPolledAt: minutesAgo(45), alertingSince: minutesAgo(15) },
  };
  const service = loadHeartbeatServiceWithMocks({ state, emailService: createEmailSpy(sent) });

  state.heartbeat = { ...state.heartbeat, lastPolledAt: minutesAgo(1) };
  const result = await service.runOnce(NOW);

  assert.equal(result.state, 'recovered');
  assert.equal(sent.length, 1);
  assert.equal(sent[0].recovered, true);
  assert.equal(state.heartbeat.alertingSince, null);
});

test('a bot that has never polled is not treated as an outage', { concurrency: false }, async () => {
  const sent = [];
  // A fresh deploy has no heartbeat yet; alerting here would cry wolf.
  const state = { heartbeat: null };
  const service = loadHeartbeatServiceWithMocks({ state, emailService: createEmailSpy(sent) });

  assert.equal(await service.runOnce(NOW), null);
  assert.deepEqual(sent, []);
});

test('the watchdog stays inert when disabled or SMTP is unavailable', { concurrency: false }, async () => {
  const sent = [];
  const state = { heartbeat: { lastPolledAt: minutesAgo(120), alertingSince: null } };

  const disabled = loadHeartbeatServiceWithMocks({
    config: { ...DEFAULT_CONFIG, enabled: false },
    state,
    emailService: createEmailSpy(sent),
  });
  assert.equal(disabled.isOperational(), false);
  assert.equal(await disabled.runOnce(NOW), null);

  const withoutSmtp = loadHeartbeatServiceWithMocks({
    state,
    emailService: { isConfigured: () => false, sendBotHeartbeatAlertEmail: async () => true },
  });
  assert.equal(withoutSmtp.isOperational(), false);
  assert.equal(await withoutSmtp.runOnce(NOW), null);

  assert.deepEqual(sent, []);
});
