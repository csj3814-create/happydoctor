import { NextResponse } from 'next/server'

const BACKEND_BASE_URL =
  process.env.HAPPYDOCTOR_BACKEND_URL || 'https://happydoctor.onrender.com'

export const dynamic = 'force-dynamic'

const LONG_TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,128}$/

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { lookup?: unknown; confirmed?: unknown }
    const lookup = typeof body.lookup === 'string' ? body.lookup.trim() : ''

    if (!LONG_TOKEN_PATTERN.test(lookup) || body.confirmed !== true) {
      return NextResponse.json(
        { error: '장기 상태 확인 토큰과 삭제 확인이 필요합니다.' },
        { status: 400 },
      )
    }

    const response = await fetch(`${BACKEND_BASE_URL}/api/public/data-deletion-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lookup, confirmed: true }),
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
    console.error('[App Data Deletion Request Proxy Error]', error)
    return NextResponse.json(
      { error: '삭제 요청을 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 503 },
    )
  }
}
