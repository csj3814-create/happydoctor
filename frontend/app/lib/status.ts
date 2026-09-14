export const PUBLIC_STATUS_CODE_LENGTH = 6
const LEGACY_STATUS_CODE_LENGTH = 8

export interface PublicDoctorReply {
  id: string
  doctorName: string
  message: string
  patientDeliveredLanguage?: string | null
  createdAt: string | null
  seen: boolean
  seenAt: string | null
}

export interface PublicConsultationMediaItem {
  id: string | null
  kind: 'image' | string
  source: string | null
  status: string
  contentType: string | null
  originalName: string | null
  size: number | null
  storagePath: string | null
  createdAt: string | null
  url: string | null
}

export type PublicConsultationStage =
  | 'guidance_delivered'
  | 'waiting_doctor'
  | 'doctor_replied'
  | 'closed'

export interface PublicFollowUpQuestion {
  question: string
  createdAt: string | null
}

export interface PublicConsultationStatus {
  consultationId: string
  trackingCode: string | null
  status: PublicConsultationStage
  uiLanguage: 'ko' | 'en'
  sourceLanguage: string | null
  patientReplyLanguage: string | null
  chiefComplaint: string | null
  chatbotReply: string | null
  createdAt: string | null
  doctorRepliedAt: string | null
  closedAt: string | null
  closeReason: string | null
  requiresDoctorReview: boolean
  followUpCount: number
  latestFollowUpAt: string | null
  patientQuestions: PublicFollowUpQuestion[]
  doctorReplies: PublicDoctorReply[]
  mediaItems: PublicConsultationMediaItem[]
  entryChannel: 'kakao' | 'web' | string
}

export function extractStatusLookupFromUrl(value: string): string | null {
  try {
    const parsed = new URL(value, 'https://app.happydoctor.kr')
    const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''))
    return (
      hashParams.get('token') ||
      hashParams.get('lookup') ||
      hashParams.get('code') ||
      parsed.searchParams.get('lookup') ||
      parsed.searchParams.get('code') ||
      parsed.searchParams.get('token')
    )
  } catch {
    return null
  }
}

export interface PublicConsultationCreateResponse {
  ok: boolean
  consultationId: string
  trackingCode: string | null
  statusUrl: string
  status: PublicConsultationStage
  requiresDoctorReview: boolean
  uiLanguage?: 'ko' | 'en'
  sourceLanguage?: string | null
  patientReplyLanguage?: string | null
  replyToPatient: string
}

export function isStatusCode(value: string) {
  const upperValue = value.toUpperCase()
  return new RegExp(
    `^(?:[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{${PUBLIC_STATUS_CODE_LENGTH}}|[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{${LEGACY_STATUS_CODE_LENGTH}})$`,
  ).test(upperValue)
}

export function normalizeStatusLookup(rawToken?: string | string[] | null): string | null {
  const source = Array.isArray(rawToken) ? rawToken[0] : rawToken
  const trimmed = source?.trim()
  if (!trimmed) return null

  const fromUrl = extractStatusLookupFromUrl(trimmed)
  const candidate = (fromUrl || trimmed).trim()
  const upperCandidate = candidate.toUpperCase()

  if (isStatusCode(upperCandidate)) {
    return upperCandidate
  }

  if (!/^[a-zA-Z0-9_-]{16,128}$/.test(candidate)) {
    return null
  }

  return candidate
}

export const normalizeStatusToken = normalizeStatusLookup

export function buildStatusPageHref(
  lookup: string,
  uiLanguage: 'ko' | 'en',
  origin = 'https://app.happydoctor.kr',
) {
  const normalizedLookup = normalizeStatusLookup(lookup)
  if (!normalizedLookup) return `/status?lang=${uiLanguage}`

  const url = new URL('/status', origin)
  url.searchParams.set('lang', uiLanguage)

  if (isStatusCode(normalizedLookup)) {
    url.searchParams.set('lookup', normalizedLookup)
  } else {
    url.hash = new URLSearchParams({ token: normalizedLookup }).toString()
  }

  return url.origin === 'https://app.happydoctor.kr'
    ? `${url.pathname}${url.search}${url.hash}`
    : url.toString()
}

export function localizeAndProtectStatusUrl(
  statusUrl: string,
  uiLanguage: 'ko' | 'en',
) {
  const lookup = extractStatusLookupFromUrl(statusUrl)
  if (!lookup) return buildStatusPageHref('', uiLanguage)

  try {
    const parsed = new URL(statusUrl, 'https://app.happydoctor.kr')
    return buildStatusPageHref(lookup, uiLanguage, parsed.origin)
  } catch {
    return buildStatusPageHref(lookup, uiLanguage)
  }
}

// The backend sleeps when idle and can take most of a minute to wake, during
// which a plain fetch simply hangs and the page shows "loading" forever with
// no way out. Bound the wait so the screen can say something instead.
export const STATUS_REQUEST_TIMEOUT_MS = 45 * 1000

export async function fetchConsultationStatus(
  token: string,
): Promise<PublicConsultationStatus | null> {
  const response = await fetch('/api/public/consultations/status', {
    headers: { 'X-Consultation-Lookup': token },
    cache: 'no-store',
    signal: AbortSignal.timeout(STATUS_REQUEST_TIMEOUT_MS),
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch consultation status (${response.status})`)
  }

  return response.json()
}
