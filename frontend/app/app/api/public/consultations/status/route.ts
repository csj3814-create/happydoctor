import { NextResponse } from 'next/server'

const BACKEND_BASE_URL =
  process.env.HAPPYDOCTOR_BACKEND_URL || 'https://happydoctor.onrender.com'
const LOOKUP_PATTERN = /^[A-Za-z0-9_-]{6,160}$/

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const lookup = request.headers.get('x-consultation-lookup')?.trim() || ''
    if (!LOOKUP_PATTERN.test(lookup)) {
      return NextResponse.json({ error: '상담 조회 정보를 다시 확인해 주세요.' }, { status: 400 })
    }

    const response = await fetch(`${BACKEND_BASE_URL}/api/public/consultations/status`, {
      headers: { 'X-Consultation-Lookup': lookup },
      cache: 'no-store',
    })
    const text = await response.text()

    return new NextResponse(text, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[App Public Consultation Status Header Proxy Error]', error)
    return NextResponse.json(
      { error: '상담 상태를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 503 },
    )
  }
}
