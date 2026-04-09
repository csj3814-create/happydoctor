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
  return getRequiredEnv('GEMINI_API_KEY');
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

function getSolapiSmsConfig() {
  const apiKey = getEnv('SOLAPI_API_KEY');
  const apiSecret = getEnv('SOLAPI_API_SECRET');
  const sender = getEnv('SOLAPI_SENDER');

  const configuredCount = [apiKey, apiSecret, sender].filter(Boolean).length;
  if (configuredCount === 0) {
    return null;
  }

  if (!apiKey || !apiSecret || !sender) {
    throw new ConfigurationError(
      '[Config] SOLAPI_API_KEY, SOLAPI_API_SECRET, and SOLAPI_SENDER must all be set together.',
    );
  }

  return {
    apiKey,
    apiSecret,
    sender,
  };
}

function isKeepAliveDisabled() {
  return getBooleanEnv('DISABLE_KEEP_ALIVE', false);
}

function validateStartupConfig() {
  getGeminiApiKey();
  getMessengerApiKey();
  getFollowUpRuntimeConfig();
  getPatientSmsRuntimeConfig();
  getSolapiSmsConfig();
  getFirebaseServiceAccount();

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
  getGeminiApiKey,
  getMessengerApiKey,
  getFirebaseServiceAccount,
  getFirebaseStorageBucket,
  getFollowUpRuntimeConfig,
  getPatientSmsRuntimeConfig,
  getSolapiSmsConfig,
  isKeepAliveDisabled,
  validateStartupConfig,
  port: getEnv('PORT', '3000'),
  appSiteUrl: getEnv('APP_SITE_URL', 'https://app.happydoctor.kr'),
  renderExternalUrl: getEnv('RENDER_EXTERNAL_URL', 'https://happydoctor.onrender.com'),
};
