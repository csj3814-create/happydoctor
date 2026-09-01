const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ConfigurationError,
  getAlertEmailRecipients,
  getNotificationChannelIssues,
  getFirebaseServiceAccount,
  getFollowUpRuntimeConfig,
  getPatientSmsRuntimeConfig,
  getSmtpConfig,
  getSmtpConfigIssue,
  getSolapiSmsConfig,
  getSolapiSmsConfigIssue,
  getUnansweredDigestConfig,
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

test('validateStartupConfig no longer requires a clinical AI key and still requires backend access secrets', { concurrency: false }, async () => {
  await withEnv({
    GEMINI_API_KEY: undefined,
    MESSENGER_API_KEY: undefined,
    FIREBASE_SERVICE_ACCOUNT: undefined,
  }, async () => {
    assert.throws(
      () => validateStartupConfig(),
      (error) => {
        assert.ok(error instanceof ConfigurationError);
        assert.match(error.message, /MESSENGER_API_KEY/);
        return true;
      },
    );
  });

  await withEnv({
    GEMINI_API_KEY: undefined,
    MESSENGER_API_KEY: 'messenger-secret',
    FIREBASE_SERVICE_ACCOUNT: undefined,
    SOLAPI_API_KEY: undefined,
    SOLAPI_API_SECRET: undefined,
    SOLAPI_SENDER: undefined,
  }, async () => {
    assert.equal(validateStartupConfig(), true);
  });
});

test('getSolapiSmsConfig disables SMS on partial config instead of throwing', { concurrency: false }, async () => {
  await withEnv({
    SOLAPI_API_KEY: 'api-key',
    SOLAPI_API_SECRET: undefined,
    SOLAPI_SENDER: '01012345678',
  }, async () => {
    assert.equal(getSolapiSmsConfig(), null);
    assert.match(getSolapiSmsConfigIssue(), /SOLAPI_API_KEY, SOLAPI_API_SECRET, and SOLAPI_SENDER/);
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

test('getSmtpConfig stays disabled until both credentials are present', { concurrency: false }, async () => {
  await withEnv({ SMTP_USER: undefined, SMTP_PASS: undefined, SMTP_HOST: undefined, SMTP_PORT: undefined, SMTP_FROM: undefined }, async () => {
    assert.equal(getSmtpConfig(), null);
    assert.equal(getSmtpConfigIssue(), null);
  });

  await withEnv({ SMTP_USER: 'alerts@happydoctor.kr', SMTP_PASS: undefined }, async () => {
    assert.equal(getSmtpConfig(), null);
    assert.match(getSmtpConfigIssue(), /SMTP_USER and SMTP_PASS must be set together/);
  });

  await withEnv({ SMTP_USER: undefined, SMTP_PASS: 'secret' }, async () => {
    assert.equal(getSmtpConfig(), null);
    assert.match(getSmtpConfigIssue(), /SMTP_USER and SMTP_PASS must be set together/);
  });
});

test('a half-entered credential pair disables its channel without aborting startup', { concurrency: false }, async () => {
  await withEnv({
    MESSENGER_API_KEY: 'messenger-key',
    SMTP_USER: 'alerts@happydoctor.kr',
    SMTP_PASS: undefined,
    SOLAPI_API_KEY: 'api-key',
    SOLAPI_API_SECRET: undefined,
    SOLAPI_SENDER: undefined,
  }, async () => {
    // A partial save in the Render dashboard must never take consultations down.
    assert.equal(validateStartupConfig(), true);
    assert.deepEqual(getNotificationChannelIssues().map((entry) => entry.channel), ['smtp', 'solapi']);
  });
});

test('a malformed SMTP port disables mail instead of aborting startup', { concurrency: false }, async () => {
  await withEnv({
    MESSENGER_API_KEY: 'messenger-key',
    SMTP_USER: 'alerts@happydoctor.kr',
    SMTP_PASS: 'secret',
    SMTP_PORT: 'not-a-port',
  }, async () => {
    assert.equal(getSmtpConfig(), null);
    assert.match(getSmtpConfigIssue(), /SMTP_PORT/);
    assert.equal(validateStartupConfig(), true);
  });
});

test('a fully configured service reports no channel issues', { concurrency: false }, async () => {
  await withEnv({
    MESSENGER_API_KEY: 'messenger-key',
    SMTP_USER: 'alerts@happydoctor.kr',
    SMTP_PASS: 'secret',
    SMTP_PORT: undefined,
    SOLAPI_API_KEY: 'api-key',
    SOLAPI_API_SECRET: 'api-secret',
    SOLAPI_SENDER: '01012345678',
  }, async () => {
    assert.deepEqual(getNotificationChannelIssues(), []);
    assert.equal(validateStartupConfig(), true);
  });
});

test('getSmtpConfig defaults to implicit TLS on Gmail and negotiates STARTTLS elsewhere', { concurrency: false }, async () => {
  await withEnv({
    SMTP_USER: 'alerts@happydoctor.kr',
    SMTP_PASS: 'secret',
    SMTP_HOST: undefined,
    SMTP_PORT: undefined,
    SMTP_FROM: undefined,
  }, async () => {
    assert.deepEqual(getSmtpConfig(), {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      user: 'alerts@happydoctor.kr',
      pass: 'secret',
      from: 'alerts@happydoctor.kr',
    });
  });

  await withEnv({
    SMTP_USER: 'alerts@happydoctor.kr',
    SMTP_PASS: 'secret',
    SMTP_HOST: 'smtp.example.com',
    SMTP_PORT: '587',
    SMTP_FROM: '해피닥터 <alerts@happydoctor.kr>',
  }, async () => {
    const config = getSmtpConfig();
    assert.equal(config.host, 'smtp.example.com');
    assert.equal(config.port, 587);
    assert.equal(config.secure, false);
    assert.equal(config.from, '해피닥터 <alerts@happydoctor.kr>');
  });
});

test('getAlertEmailRecipients dedupes explicit recipients and falls back to portal admins', { concurrency: false }, async () => {
  await withEnv({ ALERT_EMAIL_RECIPIENTS: ' A@happydoctor.kr , a@happydoctor.kr ,b@happydoctor.kr' }, async () => {
    assert.deepEqual(getAlertEmailRecipients(), ['a@happydoctor.kr', 'b@happydoctor.kr']);
  });

  await withEnv({
    ALERT_EMAIL_RECIPIENTS: undefined,
    PORTAL_ADMIN_EMAILS: 'admin@happydoctor.kr',
  }, async () => {
    assert.deepEqual(getAlertEmailRecipients(), ['admin@happydoctor.kr']);
  });
});

test('getUnansweredDigestConfig validates the digest hour and interval bounds', { concurrency: false }, async () => {
  await withEnv({
    UNANSWERED_DIGEST_ENABLED: undefined,
    UNANSWERED_DIGEST_HOUR_KST: undefined,
    UNANSWERED_DIGEST_CHECK_INTERVAL_MS: undefined,
    UNANSWERED_DIGEST_MAX_ITEMS: undefined,
  }, async () => {
    const config = getUnansweredDigestConfig();
    assert.equal(config.enabled, true);
    assert.equal(config.hourKst, 9);
    assert.equal(config.checkIntervalMs, 15 * 60 * 1000);
    assert.equal(config.maxItems, 50);
  });

  await withEnv({ UNANSWERED_DIGEST_HOUR_KST: '-1' }, async () => {
    assert.throws(() => getUnansweredDigestConfig(), ConfigurationError);
  });

  await withEnv({ UNANSWERED_DIGEST_ENABLED: 'false' }, async () => {
    assert.equal(getUnansweredDigestConfig().enabled, false);
  });
});
