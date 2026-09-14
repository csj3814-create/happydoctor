// Reply-notification contacts, shared by the web form and the KakaoTalk
// channel. The web intake has always collected one; a channel consultation had
// no way to offer a phone or an email, so its only delivery path was the
// patient coming back to the channel on their own.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const PHONE_PATTERN = /^\+?\d{10,15}$/;

function normalizePhoneNumber(value) {
  if (typeof value !== 'string') return '';

  return value
    .trim()
    .replace(/[^\d+]/g, '')
    .replace(/(?!^)\+/g, '')
    .slice(0, 20);
}

function normalizeEmailAddress(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase().slice(0, 254);
}

function isDeliverablePhone(value) {
  return PHONE_PATTERN.test(normalizePhoneNumber(value));
}

function isDeliverableEmail(value) {
  return EMAIL_PATTERN.test(normalizeEmailAddress(value));
}

function buildConsentedContact({ phone = '', email = '', source = 'unknown' } = {}) {
  const rawPhone = typeof phone === 'string' ? phone.trim().slice(0, 40) : '';
  const rawEmail = typeof email === 'string' ? email.trim().slice(0, 254) : '';
  const normalizedPhone = normalizePhoneNumber(rawPhone);
  const normalizedEmail = normalizeEmailAddress(rawEmail);

  if (!normalizedPhone && !normalizedEmail) return null;
  if (normalizedPhone && !PHONE_PATTERN.test(normalizedPhone)) return null;
  if (normalizedEmail && !EMAIL_PATTERN.test(normalizedEmail)) return null;

  return {
    consented: true,
    phone: rawPhone || null,
    normalizedPhone: normalizedPhone || null,
    email: rawEmail || null,
    normalizedEmail: normalizedEmail || null,
    source,
  };
}

// Reads a contact out of something the patient typed into the channel. Strict
// on purpose: this runs on every unmatched message, and a consultation should
// not acquire a phone number because someone mentioned one in a sentence. Only
// a message that *is* a contact counts.
function parseContactFromUtterance(utterance) {
  const text = typeof utterance === 'string' ? utterance.trim() : '';
  if (!text || text.length > 254) return null;

  if (isDeliverableEmail(text)) {
    return buildConsentedContact({ email: text, source: 'kakao_channel' });
  }

  // "010-1234-5678" and "010 1234 5678" are the same contact.
  const compact = text.replace(/[\s-]/g, '');
  if (PHONE_PATTERN.test(compact)) {
    return buildConsentedContact({ phone: compact, source: 'kakao_channel' });
  }

  return null;
}

// Echoed back into a chat that someone else may be looking at.
function maskContact(contact) {
  if (contact?.normalizedPhone) {
    const digits = contact.normalizedPhone.replace(/\D/g, '');
    const tail = digits.slice(-4);
    return `${digits.slice(0, 3)}-****-${tail}`;
  }

  if (contact?.normalizedEmail) {
    const [name, domain] = contact.normalizedEmail.split('@');
    const head = name.slice(0, 2);
    return `${head}${'*'.repeat(Math.max(1, name.length - 2))}@${domain}`;
  }

  return '';
}

module.exports = {
  EMAIL_PATTERN,
  PHONE_PATTERN,
  normalizePhoneNumber,
  normalizeEmailAddress,
  isDeliverablePhone,
  isDeliverableEmail,
  buildConsentedContact,
  parseContactFromUtterance,
  maskContact,
};
