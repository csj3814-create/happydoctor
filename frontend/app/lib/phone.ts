// Mirrors isSmsDeliverableNumber() in backend/services/notifyService.js.
// Reply alerts go out by text from a Korean number, which reaches Korean
// mobiles only: 010/011/016-019, or the same after +82. Overseas patients -
// 44% of consultations in November 2026 - often leave a foreign number and
// then never hear that their answer arrived.
const KOREAN_MOBILE_PATTERN = /^(?:\+82|0)?0?1[016789]\d{7,8}$/

export function normalizePhoneInput(value: string): string {
  return value.trim().replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '')
}

export function canReceiveReplyText(value: string): boolean {
  const normalized = normalizePhoneInput(value)
  if (!normalized) return false
  if (normalized.startsWith('+') && !normalized.startsWith('+82')) return false
  if (!normalized.startsWith('+82') && !normalized.startsWith('01')) return false
  return KOREAN_MOBILE_PATTERN.test(normalized)
}

// Only worth warning about once the patient has typed something that could be
// a whole number, not on the first keystroke.
export function looksLikeCompleteNumber(value: string): boolean {
  return normalizePhoneInput(value).replace('+', '').length >= 8
}
