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

module.exports = {
  LEGACY_TOTAL,
  LEGACY_COMPLETED,
  DEFAULT_STATS,
  getAllowedDoctorEmails,
  getPortalOrigins,
  port: getEnv('PORT', '3000'),
  renderExternalUrl: getEnv('RENDER_EXTERNAL_URL', 'https://happydoctor.onrender.com'),
};
