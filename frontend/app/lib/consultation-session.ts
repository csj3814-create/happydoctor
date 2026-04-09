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
  replyNotificationConsent: boolean
  replyNotificationPhone: string
}

export type ActiveConsultationSession = {
  consultationId: string
  lookup: string
  trackingCode: string | null
  statusUrl: string
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
    return (
      parsed.searchParams.get('lookup')
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
