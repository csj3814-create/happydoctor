import { NextResponse } from 'next/server'

const BACKEND_BASE_URL =
  process.env.HAPPYDOCTOR_BACKEND_URL || 'https://happydoctor.onrender.com'

export const dynamic = 'force-dynamic'

const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/
const RECEIPT_TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,256}$/

type RouteContext = {
  params: Promise<{ requestId: string }>
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { requestId } = await context.params
    const receiptToken = request.headers.get('x-deletion-receipt-token')?.trim() || ''

    if (!REQUEST_ID_PATTERN.test(requestId) || !RECEIPT_TOKEN_PATTERN.test(receiptToken)) {
      return NextResponse.json(
        { error: '삭제 요청 번호와 영수증 토큰을 다시 확인해 주세요.' },
        { status: 400 },
      )
    }

    const response = await fetch(
      `${BACKEND_BASE_URL}/api/public/data-deletion-requests/${encodeURIComponent(requestId)}`,
      {
        headers: { 'X-Deletion-Receipt-Token': receiptToken },
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
    console.error('[App Data Deletion Receipt Proxy Error]', error)
    return NextResponse.json(
      { error: '삭제 요청 상태를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 503 },
    )
  }
}
