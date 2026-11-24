const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');

const CONFIG_PATH = path.join(__dirname, '..', 'config.js');
const DB_SERVICE_PATH = path.join(__dirname, '..', 'services', 'dbService.js');
const EMAIL_SERVICE_PATH = path.join(__dirname, '..', 'services', 'emailService.js');
const SERVICE_PATH = path.join(__dirname, '..', 'services', 'smsBalanceService.js');
const SOLAPI_PATH = require.resolve('solapi', { paths: [path.join(__dirname, '..')] });

const DAY = 24 * 60 * 60 * 1000;

function createFakeDb() {
  const state = { value: null };
  return {
    state,
    getDb: () => ({
      collection: () => ({ doc: () => ({}) }),
      runTransaction: async (handler) => handler({
        get: async () => ({ exists: state.value !== null, data: () => state.value }),
        set: (ref, value) => { state.value = { ...(state.value || {}), ...value }; },
      }),
    }),
  };
}

function load({ reading, failRead = false, enabled = true }) {
  const mails = [];
  const fakeDb = createFakeDb();
  const originalLoad = Module._load;
  Module._load = function patched(request, parent, isMain) {
    const resolved = (() => { try { return Module._resolveFilename(request, parent, isMain); } catch { return request; } })();
    if (resolved === CONFIG_PATH) {
      return {
        getSolapiSmsConfig: () => ({ apiKey: 'k', apiSecret: 's', sender: '0200000000' }),
        getSmsBalanceAlertConfig: () => ({ enabled, threshold: 3000, checkIntervalMs: 60000, alertIntervalMs: DAY }),
      };
    }
    if (resolved === DB_SERVICE_PATH) return fakeDb;
    if (resolved === EMAIL_SERVICE_PATH) {
      return { isConfigured: () => true, sendSmsLowBalanceEmail: async (payload) => { mails.push(payload); return true; } };
    }
    if (resolved === SOLAPI_PATH) {
      return {
        SolapiMessageService: class {
          async getBalance() {
            if (failRead) throw new Error('solapi_unreachable');
            return reading;
          }
        },
      };
    }
    return originalLoad(request, parent, isMain);
  };
  delete require.cache[SERVICE_PATH];
  try {
    return { service: require(SERVICE_PATH), mails, fakeDb };
  } finally {
    Module._load = originalLoad;
    delete require.cache[SERVICE_PATH];
  }
}

test('a balance below the threshold is reported before texts start failing', async () => {
  // 24 October to 14 November: the first sign of an empty account was every
  // patient's text failing.
  const { service, mails } = load({ reading: { balance: 1200, point: 30 } });

  assert.equal(await service.runOnce(Date.now()), true);
  assert.deepEqual(mails, [{ balance: 1200, point: 30, threshold: 3000 }]);
});

test('points count toward what is available, as SOLAPI spends them too', async () => {
  const { service, mails } = load({ reading: { balance: 2000, point: 1500 } });

  assert.equal(await service.runOnce(Date.now()), false);
  assert.deepEqual(mails, []);
});

test('while it stays low, the alert goes once a day, not every check', async () => {
  const { service, mails } = load({ reading: { balance: 0, point: 0 } });
  const start = Date.UTC(2026, 10, 24, 0, 0);

  assert.equal(await service.runOnce(start), true);
  assert.equal(await service.runOnce(start + 6 * 60 * 60 * 1000), false);
  assert.equal(await service.runOnce(start + 18 * 60 * 60 * 1000), false);
  assert.equal(await service.runOnce(start + DAY + 1), true);
  assert.equal(mails.length, 2);
});

test('an unreadable balance is not reported as a low one', async () => {
  const { service, mails } = load({ reading: null, failRead: true });

  assert.equal(await service.runOnce(Date.now()), false);
  assert.deepEqual(mails, []);
});

test('the check stays off when disabled', async () => {
  const { service, mails } = load({ reading: { balance: 0, point: 0 }, enabled: false });

  assert.equal(service.isOperational(), false);
  assert.equal(await service.runOnce(Date.now()), false);
  assert.deepEqual(mails, []);
});
