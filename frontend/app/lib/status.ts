export const PUBLIC_STATUS_CODE_LENGTH = 6
const LEGACY_STATUS_CODE_LENGTH = 8

export interface PublicDoctorReply {
  id: string
  doctorName: string
  message: string
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

export interface PublicConsultationStatus {
  consultationId: string
  trackingCode: string | null
  status: PublicConsultationStage
  chiefComplaint: string | null
  createdAt: string | null
  doctorRepliedAt: string | null
  closedAt: string | null
  closeReason: string | null
  requiresDoctorReview: boolean
  followUpCount: number
  latestFollowUpAt: string | null
  doctorReplies: PublicDoctorReply[]
  mediaItems: PublicConsultationMediaItem[]
  entryChannel: 'kakao' | 'web' | string
}

function tryExtractTokenFromUrl(value: string): string | null {
  try {
    const parsed = new URL(value)
    return (
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
  replyToPatient: string
}

export function normalizeStatusLookup(rawToken?: string | string[] | null): string | null {
  const source = Array.isArray(rawToken) ? rawToken[0] : rawToken
  const trimmed = source?.trim()
  if (!trimmed) return null

  const fromUrl = tryExtractTokenFromUrl(trimmed)
  const candidate = (fromUrl || trimmed).trim()
  const upperCandidate = candidate.toUpperCase()

  if (
    new RegExp(
      `^(?:[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{${PUBLIC_STATUS_CODE_LENGTH}}|[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{${LEGACY_STATUS_CODE_LENGTH}})$`,
    ).test(upperCandidate)
  ) {
    return upperCandidate
  }

  if (!/^[a-zA-Z0-9_-]{16,128}$/.test(candidate)) {
    return null
  }

  return candidate
}

export const normalizeStatusToken = normalizeStatusLookup

export async function fetchConsultationStatus(
  token: string,
): Promise<PublicConsultationStatus | null> {
  const response = await fetch(`/api/public/consultations/status/${encodeURIComponent(token)}`, {
    cache: 'no-store',
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch consultation status (${response.status})`)
  }

  return response.json()
}
