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

module.exports = {
  LEGACY_TOTAL,
  LEGACY_COMPLETED,
  DEFAULT_STATS,
  getAllowedDoctorEmails,
  port: getEnv('PORT', '3000'),
  portalOrigin: getEnv('PORTAL_ORIGIN', '*'),
  renderExternalUrl: getEnv('RENDER_EXTERNAL_URL', 'https://happydoctor.onrender.com'),
};
