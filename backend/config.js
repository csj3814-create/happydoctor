const LEGACY_TOTAL = 312;
const LEGACY_COMPLETED = 295;
const DEFAULT_STATS = Object.freeze({
  total: LEGACY_TOTAL,
  doctorReplied: LEGACY_COMPLETED,
});

class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

function getEnv(name, fallback = '') {
  const value = process.env[name];
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function getRequiredEnv(name) {
  const value = getEnv(name);
  if (!value) {
    throw new ConfigurationError(`[Config] Missing required environment variable: ${name}`);
  }
  return value;
}

function getBooleanEnv(name, fallback = false) {
  const value = getEnv(name);
  if (!value) return fallback;

  if (value === 'true') return true;
  if (value === 'false') return false;

  throw new ConfigurationError(`[Config] ${name} must be "true" or "false". Received: ${value}`);
}

function getNumberEnv(name, fallback, { min = null, integer = false } = {}) {
  const value = getEnv(name);
  if (!value) return fallback;

  const parsed = Number(value);
  const isValidNumber = Number.isFinite(parsed) && (!integer || Number.isInteger(parsed));
  if (!isValidNumber) {
    throw new ConfigurationError(
      `[Config] ${name} must be a${integer ? 'n integer' : ' valid number'}. Received: ${value}`,
    );
  }

  if (min !== null && parsed < min) {
    throw new ConfigurationError(`[Config] ${name} must be >= ${min}. Received: ${parsed}`);
  }

  return parsed;
}

function getOptionalJsonObjectEnv(name) {
  const value = getEnv(name);
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('not an object');
    }
    return parsed;
  } catch (error) {
    throw new ConfigurationError(`[Config] ${name} must be a valid JSON object.`);
  }
}

function getAllowedDoctorEmails() {
  return getEnv('ALLOWED_DOCTOR_EMAILS')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function getPortalAdminEmails() {
  const configured = getEnv('PORTAL_ADMIN_EMAILS')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (configured.length > 0) {
    return configured;
  }

  const allowedDoctors = getAllowedDoctorEmails();
  if (allowedDoctors.length === 1) {
    return allowedDoctors;
  }

  return [];
}

function getPortalOrigins() {
  const configured = getEnv('PORTAL_ORIGIN');
  const defaults = [
    'https://happydoctor.vercel.app',
    'https://portal.happydoctor.kr',
    'https://www.portal.happydoctor.kr',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  if (!configured) {
    return defaults;
  }

  if (configured === '*') {
    return '*';
  }

  return Array.from(new Set([
    ...configured.split(',').map((origin) => origin.trim()).filter(Boolean),
    ...defaults,
  ]));
}

function getRuntimeRevision() {
  const candidates = [
    ['RENDER_GIT_COMMIT', getEnv('RENDER_GIT_COMMIT')],
    ['VERCEL_GIT_COMMIT_SHA', getEnv('VERCEL_GIT_COMMIT_SHA')],
    ['GIT_COMMIT', getEnv('GIT_COMMIT')],
  ];

  const match = candidates.find(([, value]) => value);
  if (!match) {
    return {
      revision: 'unknown',
      source: 'unavailable',
    };
  }

  const [source, revision] = match;
  return {
    revision,
    source,
  };
}

function getGeminiApiKey() {
  return getEnv('GEMINI_API_KEY');
}

// Governs the SOAP summary shown inside the authenticated doctor portal.
function getDoctorSummaryConfig() {
  const apiKey = getGeminiApiKey();

  return {
    enabled: getBooleanEnv('DOCTOR_SUMMARY_ENABLED', true) && Boolean(apiKey),
    apiKey,
    model: getEnv('DOCTOR_SUMMARY_MODEL', 'gemini-2.5-flash'),
    timeoutMs: getNumberEnv('DOCTOR_SUMMARY_TIMEOUT_MS', 20 * 1000, { min: 1000, integer: true }),
    maxOutputTokens: getNumberEnv('DOCTOR_SUMMARY_MAX_TOKENS', 2048, { min: 128, integer: true }),
  };
}

function getGoogleTranslateApiKey() {
  return getEnv('GOOGLE_TRANSLATE_API_KEY');
}

function getMessengerApiKey() {
  return getRequiredEnv('MESSENGER_API_KEY');
}

function getFirebaseServiceAccount() {
  return getOptionalJsonObjectEnv('FIREBASE_SERVICE_ACCOUNT');
}

function getFirebaseStorageBucket() {
  return getEnv('FIREBASE_STORAGE_BUCKET');
}

function getFollowUpRuntimeConfig() {
  return {
    leaseMs: getNumberEnv('FOLLOW_UP_LEASE_MS', 60 * 1000, { min: 1000, integer: true }),
    pollIntervalMs: getNumberEnv('FOLLOW_UP_POLL_INTERVAL_MS', 30 * 1000, { min: 1000, integer: true }),
    batchSize: getNumberEnv('FOLLOW_UP_PROCESS_BATCH_SIZE', 10, { min: 1, integer: true }),
  };
}

function getPatientSmsRuntimeConfig() {
  return {
    leaseMs: getNumberEnv('PATIENT_SMS_LEASE_MS', 60 * 1000, { min: 1000, integer: true }),
    pollIntervalMs: getNumberEnv('PATIENT_SMS_POLL_INTERVAL_MS', 30 * 1000, { min: 1000, integer: true }),
    batchSize: getNumberEnv('PATIENT_SMS_PROCESS_BATCH_SIZE', 10, { min: 1, integer: true }),
  };
}

// Credential pairs are typed by hand into the Render dashboard, where a partial
// save is easy to make. Half-configured optional channels therefore report an
// issue and stay disabled instead of taking the whole service down at boot.
function readSolapiSmsSettings() {
  const apiKey = getEnv('SOLAPI_API_KEY');
  const apiSecret = getEnv('SOLAPI_API_SECRET');
  const sender = getEnv('SOLAPI_SENDER');

  const configuredCount = [apiKey, apiSecret, sender].filter(Boolean).length;
  if (configuredCount === 0) {
    return { config: null, issue: null };
  }

  if (!apiKey || !apiSecret || !sender) {
    return {
      config: null,
      issue: 'SOLAPI_API_KEY, SOLAPI_API_SECRET, and SOLAPI_SENDER must all be set together.',
    };
  }

  return {
    config: { apiKey, apiSecret, sender },
    issue: null,
  };
}

function getSolapiSmsConfig() {
  return readSolapiSmsSettings().config;
}

function getSolapiSmsConfigIssue() {
  return readSolapiSmsSettings().issue;
}

function readSmtpSettings() {
  const user = getEnv('SMTP_USER');
  const pass = getEnv('SMTP_PASS');

  if (!user && !pass) {
    return { config: null, issue: null };
  }

  if (!user || !pass) {
    return { config: null, issue: 'SMTP_USER and SMTP_PASS must be set together.' };
  }

  let port;
  try {
    port = getNumberEnv('SMTP_PORT', 465, { min: 1, integer: true });
  } catch (error) {
    return { config: null, issue: error.message.replace('[Config] ', '') };
  }

  return {
    config: {
      host: getEnv('SMTP_HOST', 'smtp.gmail.com'),
      port,
      // 465 is implicit TLS; every other port negotiates STARTTLS after connect.
      secure: port === 465,
      user,
      pass,
      from: getEnv('SMTP_FROM') || user,
    },
    issue: null,
  };
}

function getSmtpConfig() {
  return readSmtpSettings().config;
}

function getSmtpConfigIssue() {
  return readSmtpSettings().issue;
}

// Render drops outbound SMTP: a direct TCP probe to smtp.gmail.com:465 times
// out on IPv4 and has no route on IPv6. Mail therefore has to leave over
// HTTPS, which is what this provider is for.
function getResendConfig() {
  const apiKey = getEnv('RESEND_API_KEY');
  if (!apiKey) return null;

  const from = getEnv('RESEND_FROM') || getEnv('SMTP_FROM');
  if (!from) {
    return null;
  }

  return {
    apiKey,
    from,
    endpoint: getEnv('RESEND_ENDPOINT', 'https://api.resend.com/emails'),
    timeoutMs: getNumberEnv('RESEND_TIMEOUT_MS', 10000, { min: 1000, integer: true }),
  };
}

function getResendConfigIssue() {
  if (!getEnv('RESEND_API_KEY')) return null;
  if (getEnv('RESEND_FROM') || getEnv('SMTP_FROM')) return null;
  return 'RESEND_FROM (or SMTP_FROM) must be set alongside RESEND_API_KEY.';
}

function getAlertEmailRecipients() {
  const configured = getEnv('ALERT_EMAIL_RECIPIENTS')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (configured.length > 0) {
    return Array.from(new Set(configured));
  }

  return getPortalAdminEmails();
}

function getUnansweredDigestConfig() {
  return {
    enabled: getBooleanEnv('UNANSWERED_DIGEST_ENABLED', true),
    // Local hour in Asia/Seoul, so the digest lands during Korean office hours.
    hourKst: getNumberEnv('UNANSWERED_DIGEST_HOUR_KST', 9, { min: 0, integer: true }),
    checkIntervalMs: getNumberEnv('UNANSWERED_DIGEST_CHECK_INTERVAL_MS', 15 * 60 * 1000, {
      min: 60 * 1000,
      integer: true,
    }),
    maxItems: getNumberEnv('UNANSWERED_DIGEST_MAX_ITEMS', 50, { min: 1, integer: true }),
  };
}

function getBotHeartbeatConfig() {
  return {
    enabled: getBooleanEnv('BOT_HEARTBEAT_ALERT_ENABLED', true),
    // The MessengerBot phone polls about every 10 seconds, so a gap this long
    // means it is off, crashed, or has lost its network.
    staleMinutes: getNumberEnv('BOT_HEARTBEAT_STALE_MINUTES', 30, { min: 1, integer: true }),
    checkIntervalMs: getNumberEnv('BOT_HEARTBEAT_CHECK_INTERVAL_MS', 5 * 60 * 1000, {
      min: 60 * 1000,
      integer: true,
    }),
  };
}

function isKeepAliveDisabled() {
  return getBooleanEnv('DISABLE_KEEP_ALIVE', false);
}

// Returns the misconfiguration of every optional notification channel. These
// never abort startup: consultations must keep flowing even when an alert
// channel is misconfigured. They surface on /api/version instead of a log line
// nobody reads.
function getNotificationChannelIssues() {
  return [
    ['smtp', getSmtpConfigIssue()],
    ['resend', getResendConfigIssue()],
    ['solapi', getSolapiSmsConfigIssue()],
  ]
    .filter(([, issue]) => Boolean(issue))
    .map(([channel, issue]) => ({ channel, issue }));
}

function validateStartupConfig() {
  getMessengerApiKey();
  getFollowUpRuntimeConfig();
  getPatientSmsRuntimeConfig();
  getFirebaseServiceAccount();
  getUnansweredDigestConfig();
  getBotHeartbeatConfig();
  getDoctorSummaryConfig();

  getNotificationChannelIssues().forEach(({ channel, issue }) => {
    console.error(`[Config] ${channel} notification channel is DISABLED: ${issue}`);
  });

  return true;
}

module.exports = {
  ConfigurationError,
  LEGACY_TOTAL,
  LEGACY_COMPLETED,
  DEFAULT_STATS,
  getEnv,
  getRequiredEnv,
  getBooleanEnv,
  getNumberEnv,
  getAllowedDoctorEmails,
  getPortalAdminEmails,
  getPortalOrigins,
  getRuntimeRevision,
  getGoogleTranslateApiKey,
  getGeminiApiKey,
  getDoctorSummaryConfig,
  getMessengerApiKey,
  getFirebaseServiceAccount,
  getFirebaseStorageBucket,
  getFollowUpRuntimeConfig,
  getPatientSmsRuntimeConfig,
  getSolapiSmsConfig,
  getSolapiSmsConfigIssue,
  getSmtpConfig,
  getSmtpConfigIssue,
  getNotificationChannelIssues,
  getAlertEmailRecipients,
  getResendConfig,
  getResendConfigIssue,
  getUnansweredDigestConfig,
  getBotHeartbeatConfig,
  isKeepAliveDisabled,
  validateStartupConfig,
  port: getEnv('PORT', '3000'),
  appSiteUrl: getEnv('APP_SITE_URL', 'https://app.happydoctor.kr'),
  renderExternalUrl: getEnv('RENDER_EXTERNAL_URL', 'https://happydoctor.onrender.com'),
};
