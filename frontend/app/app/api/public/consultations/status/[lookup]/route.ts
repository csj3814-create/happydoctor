import { NextResponse } from 'next/server'

const BACKEND_BASE_URL =
  process.env.HAPPYDOCTOR_BACKEND_URL || 'https://happydoctor.onrender.com'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{
    lookup: string
  }>
}

export async function GET(_: Request, context: RouteContext) {
  try {
    const { lookup } = await context.params

    const response = await fetch(
      `${BACKEND_BASE_URL}/api/public/consultations/status/${encodeURIComponent(lookup)}`,
      {
        cache: 'no-store',
      },
    )

    const text = await response.text()

    return new NextResponse(text, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[App Public Consultation Status Proxy Error]', error)
    return NextResponse.json(
      { error: '상담 상태를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 503 },
    )
  }
}
