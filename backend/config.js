const LEGACY_TOTAL = 312;
const LEGACY_COMPLETED = 295;
const DEFAULT_STATS = Object.freeze({
  total: LEGACY_TOTAL,
  doctorReplied: LEGACY_COMPLETED,
});

function getEnv(name, fallback = '') {
  const value = process.env[name];
  if (typeof value !== 'string') return fallback;
  return value.trim();
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

module.exports = {
  LEGACY_TOTAL,
  LEGACY_COMPLETED,
  DEFAULT_STATS,
  getAllowedDoctorEmails,
  getPortalAdminEmails,
  getPortalOrigins,
  getRuntimeRevision,
  port: getEnv('PORT', '3000'),
  appSiteUrl: getEnv('APP_SITE_URL', 'https://app.happydoctor.kr'),
  renderExternalUrl: getEnv('RENDER_EXTERNAL_URL', 'https://happydoctor.onrender.com'),
};
