const BACKEND_BASE_URL =
  process.env.HAPPYDOCTOR_BACKEND_URL || 'https://happydoctor.onrender.com'

export interface PublicDoctorReply {
  id: string
  doctorName: string
  message: string
  createdAt: string | null
  seen: boolean
  seenAt: string | null
}

export type PublicConsultationStage =
  | 'guidance_delivered'
  | 'waiting_doctor'
  | 'doctor_replied'
  | 'closed'

export interface PublicConsultationStatus {
  consultationId: string
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
}

function tryExtractTokenFromUrl(value: string): string | null {
  try {
    const parsed = new URL(value)
    return parsed.searchParams.get('token')
  } catch {
    return null
  }
}

export function normalizeStatusToken(rawToken?: string | string[] | null): string | null {
  const source = Array.isArray(rawToken) ? rawToken[0] : rawToken
  const trimmed = source?.trim()
  if (!trimmed) return null

  const fromUrl = tryExtractTokenFromUrl(trimmed)
  const candidate = (fromUrl || trimmed).trim()

  if (!/^[a-zA-Z0-9_-]{16,128}$/.test(candidate)) {
    return null
  }

  return candidate
}

export async function fetchConsultationStatus(
  token: string,
): Promise<PublicConsultationStatus | null> {
  const response = await fetch(
    `${BACKEND_BASE_URL}/api/public/consultations/status/${encodeURIComponent(token)}`,
    {
      cache: 'no-store',
    },
  )

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch consultation status (${response.status})`)
  }

  return response.json()
}
