const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ConfigurationError,
  getFirebaseServiceAccount,
  getFollowUpRuntimeConfig,
  getPatientSmsRuntimeConfig,
  getSolapiSmsConfig,
  isKeepAliveDisabled,
  validateStartupConfig,
} = require('../config');

async function withEnv(overrides, fn) {
  const previousValues = new Map();

  for (const [name, value] of Object.entries(overrides)) {
    if (Object.prototype.hasOwnProperty.call(process.env, name)) {
      previousValues.set(name, process.env[name]);
    } else {
      previousValues.set(name, undefined);
    }

    if (typeof value === 'undefined') {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }

  try {
    await fn();
  } finally {
    for (const [name, value] of previousValues.entries()) {
      if (typeof value === 'undefined') {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  }
}

test('getFollowUpRuntimeConfig uses defaults and boolean parsing stays stable when env vars are absent', { concurrency: false }, async () => {
  await withEnv({
    FOLLOW_UP_LEASE_MS: undefined,
    FOLLOW_UP_POLL_INTERVAL_MS: undefined,
    FOLLOW_UP_PROCESS_BATCH_SIZE: undefined,
    PATIENT_SMS_LEASE_MS: undefined,
    PATIENT_SMS_POLL_INTERVAL_MS: undefined,
    PATIENT_SMS_PROCESS_BATCH_SIZE: undefined,
    SOLAPI_API_KEY: undefined,
    SOLAPI_API_SECRET: undefined,
    SOLAPI_SENDER: undefined,
    DISABLE_KEEP_ALIVE: undefined,
  }, async () => {
    assert.deepEqual(getFollowUpRuntimeConfig(), {
      leaseMs: 60 * 1000,
      pollIntervalMs: 30 * 1000,
      batchSize: 10,
    });
    assert.deepEqual(getPatientSmsRuntimeConfig(), {
      leaseMs: 60 * 1000,
      pollIntervalMs: 30 * 1000,
      batchSize: 10,
    });
    assert.equal(getSolapiSmsConfig(), null);
    assert.equal(isKeepAliveDisabled(), false);
  });
});

test('getFollowUpRuntimeConfig rejects malformed numeric env values with a clear config error', { concurrency: false }, async () => {
  await withEnv({
    FOLLOW_UP_LEASE_MS: 'soon',
    FOLLOW_UP_POLL_INTERVAL_MS: '30000',
    FOLLOW_UP_PROCESS_BATCH_SIZE: '10',
  }, async () => {
    assert.throws(
      () => getFollowUpRuntimeConfig(),
      (error) => {
        assert.ok(error instanceof ConfigurationError);
        assert.match(error.message, /FOLLOW_UP_LEASE_MS/);
        return true;
      },
    );
  });
});

test('getFirebaseServiceAccount parses a JSON object and rejects malformed payloads', { concurrency: false }, async () => {
  await withEnv({
    FIREBASE_SERVICE_ACCOUNT: JSON.stringify({
      project_id: 'happydoctor0',
      client_email: 'firebase-adminsdk@test.invalid',
      private_key: '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n',
    }),
  }, async () => {
    const serviceAccount = getFirebaseServiceAccount();
    assert.equal(serviceAccount.project_id, 'happydoctor0');
  });

  await withEnv({
    FIREBASE_SERVICE_ACCOUNT: '{"project_id":',
  }, async () => {
    assert.throws(
      () => getFirebaseServiceAccount(),
      (error) => {
        assert.ok(error instanceof ConfigurationError);
        assert.match(error.message, /FIREBASE_SERVICE_ACCOUNT/);
        return true;
      },
    );
  });
});

test('validateStartupConfig requires the backend secrets and surfaces missing-key errors clearly', { concurrency: false }, async () => {
  await withEnv({
    GEMINI_API_KEY: undefined,
    MESSENGER_API_KEY: 'messenger-secret',
    FIREBASE_SERVICE_ACCOUNT: undefined,
  }, async () => {
    assert.throws(
      () => validateStartupConfig(),
      (error) => {
        assert.ok(error instanceof ConfigurationError);
        assert.match(error.message, /GEMINI_API_KEY/);
        return true;
      },
    );
  });

  await withEnv({
    GEMINI_API_KEY: 'gemini-secret',
    MESSENGER_API_KEY: 'messenger-secret',
    FIREBASE_SERVICE_ACCOUNT: undefined,
    SOLAPI_API_KEY: undefined,
    SOLAPI_API_SECRET: undefined,
    SOLAPI_SENDER: undefined,
  }, async () => {
    assert.equal(validateStartupConfig(), true);
  });
});

test('getSolapiSmsConfig rejects partial SMS provider config and validates complete sets', { concurrency: false }, async () => {
  await withEnv({
    SOLAPI_API_KEY: 'api-key',
    SOLAPI_API_SECRET: undefined,
    SOLAPI_SENDER: '01012345678',
  }, async () => {
    assert.throws(
      () => getSolapiSmsConfig(),
      (error) => {
        assert.ok(error instanceof ConfigurationError);
        assert.match(error.message, /SOLAPI_API_KEY, SOLAPI_API_SECRET, and SOLAPI_SENDER/);
        return true;
      },
    );
  });

  await withEnv({
    SOLAPI_API_KEY: 'api-key',
    SOLAPI_API_SECRET: 'api-secret',
    SOLAPI_SENDER: '01012345678',
  }, async () => {
    assert.deepEqual(getSolapiSmsConfig(), {
      apiKey: 'api-key',
      apiSecret: 'api-secret',
      sender: '01012345678',
    });
  });
});
