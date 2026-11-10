const ACTIVE_SESSION_KEY = 'happydoctor-active-consultation'
const DRAFT_SESSION_KEY = 'happydoctor-web-consultation-draft'

export const CONSULTATION_SESSION_TTL_MS = 60 * 60 * 1000

export type WebConsultationDraft = {
  age: string
  gender: string
  chiefComplaint: string
  onset: string
  symptomDetail: string
  nrs: string
  associatedSymptom: string
  pastMedicalHistory: string
  privacyConsent: boolean
  sensitiveInfoConsent: boolean
  adultConfirmed: boolean
  replyNotificationConsent: boolean
  replyNotificationPhone: string
  replyNotificationEmail: string
}

export type ActiveConsultationSession = {
  consultationId: string
  lookup: string
  trackingCode: string | null
  statusUrl: string
  uiLanguage?: 'ko' | 'en'
  chatbotReply?: string | null
  savedAt: number
}

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function isExpired(savedAt?: number | null) {
  if (!savedAt) return true
  return Date.now() - savedAt > CONSULTATION_SESSION_TTL_MS
}

function readJson<T>(key: string): T | null {
  if (!isBrowser()) return null

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown) {
  if (!isBrowser()) return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage write failures on restricted browsers.
  }
}

function removeItem(key: string) {
  if (!isBrowser()) return

  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore storage removal failures on restricted browsers.
  }
}

export function extractLookupFromStatusUrl(statusUrl?: string | null): string | null {
  if (!statusUrl) return null

  try {
    const parsed = new URL(statusUrl, typeof window !== 'undefined' ? window.location.origin : 'https://app.happydoctor.kr')
    const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''))
    return (
      hashParams.get('token')
      || hashParams.get('lookup')
      || hashParams.get('code')
      || parsed.searchParams.get('lookup')
      || parsed.searchParams.get('code')
      || parsed.searchParams.get('token')
    )
  } catch {
    return null
  }
}

export function saveActiveConsultationSession(session: Omit<ActiveConsultationSession, 'savedAt'>) {
  const lookup = session.lookup || extractLookupFromStatusUrl(session.statusUrl) || session.trackingCode || ''
  if (!lookup) return

  writeJson(ACTIVE_SESSION_KEY, {
    ...session,
    lookup,
    savedAt: Date.now(),
  })
}

export function getActiveConsultationSession(): ActiveConsultationSession | null {
  const session = readJson<ActiveConsultationSession>(ACTIVE_SESSION_KEY)
  if (!session) return null

  if (isExpired(session.savedAt)) {
    removeItem(ACTIVE_SESSION_KEY)
    return null
  }

  return session
}

export function clearActiveConsultationSession() {
  removeItem(ACTIVE_SESSION_KEY)
}

export function saveWebConsultationDraft(draft: WebConsultationDraft) {
  writeJson(DRAFT_SESSION_KEY, {
    draft,
    savedAt: Date.now(),
  })
}

export function getWebConsultationDraft(): WebConsultationDraft | null {
  const payload = readJson<{ draft?: WebConsultationDraft; savedAt?: number }>(DRAFT_SESSION_KEY)
  if (!payload?.draft) return null

  if (isExpired(payload.savedAt)) {
    removeItem(DRAFT_SESSION_KEY)
    return null
  }

  return payload.draft
}

export function clearWebConsultationDraft() {
  removeItem(DRAFT_SESSION_KEY)
}

// A question half typed into the status page used to vanish if the patient
// left the page, locked the phone, or let the tab be reclaimed - and a patient
// who has to type it again mostly does not. It is kept until it is sent.
//
// The lookup token is the key to the whole consultation, so it is not written
// into storage a second time; a short digest of it is enough to keep two
// consultations apart on one device.
const FOLLOW_UP_DRAFT_KEY_PREFIX = 'happydoctor-follow-up-draft-'

function digestLookup(lookup: string): string {
  let hash = 5381
  for (let index = 0; index < lookup.length; index += 1) {
    hash = ((hash << 5) + hash + lookup.charCodeAt(index)) | 0
  }
  return (hash >>> 0).toString(36)
}

function followUpDraftKey(lookup: string): string {
  return `${FOLLOW_UP_DRAFT_KEY_PREFIX}${digestLookup(lookup)}`
}

export function getFollowUpDraft(lookup: string): string {
  if (!isBrowser() || !lookup) return ''

  try {
    return window.localStorage.getItem(followUpDraftKey(lookup)) || ''
  } catch {
    // Private windows and blocked site data both throw on access.
    return ''
  }
}

export function saveFollowUpDraft(lookup: string, text: string) {
  if (!isBrowser() || !lookup) return

  try {
    if (text.trim()) window.localStorage.setItem(followUpDraftKey(lookup), text)
    else window.localStorage.removeItem(followUpDraftKey(lookup))
  } catch {
    // Losing the backup must not break asking the question.
  }
}
