import { NextResponse } from 'next/server'

const BACKEND_BASE_URL =
  process.env.HAPPYDOCTOR_BACKEND_URL || 'https://happydoctor.onrender.com'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{
    lookup: string
  }>
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { lookup } = await context.params
    const rawBody = await request.text()

    const response = await fetch(
      `${BACKEND_BASE_URL}/api/public/consultations/status/${encodeURIComponent(lookup)}/close`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: rawBody,
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
    console.error('[App Public Consultation Close Proxy Error]', error)
    return NextResponse.json(
      { error: '상담을 종료하지 못했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 503 },
    )
  }
}
