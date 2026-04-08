import { NextResponse } from 'next/server'

const BACKEND_BASE_URL =
  process.env.HAPPYDOCTOR_BACKEND_URL || 'https://happydoctor.onrender.com'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let response: Response

    if (contentType.includes('multipart/form-data')) {
      const incoming = await request.formData()
      const payload = new FormData()

      for (const [key, value] of incoming.entries()) {
        if (typeof value === 'string') {
          payload.append(key, value)
        } else {
          payload.append(key, value, value.name)
        }
      }

      response = await fetch(`${BACKEND_BASE_URL}/api/public/consultations`, {
        method: 'POST',
        body: payload,
        cache: 'no-store',
      })
    } else {
      const rawBody = await request.text()
      response = await fetch(`${BACKEND_BASE_URL}/api/public/consultations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: rawBody,
        cache: 'no-store',
      })
    }

    const text = await response.text()

    return new NextResponse(text, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[App Public Consultation Proxy Error]', error)
    return NextResponse.json(
      { error: '상담을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 503 },
    )
  }
}
