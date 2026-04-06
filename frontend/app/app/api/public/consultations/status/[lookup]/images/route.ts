import { NextResponse } from 'next/server'

const BACKEND_BASE_URL =
  process.env.HAPPYDOCTOR_BACKEND_URL || 'https://happydoctor.onrender.com'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ lookup: string }>
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { lookup } = await params
    const incoming = await request.formData()
    const payload = new FormData()

    for (const [key, value] of incoming.entries()) {
      if (typeof value === 'string') {
        payload.append(key, value)
        continue
      }

      payload.append(key, value, value.name)
    }

    const response = await fetch(
      `${BACKEND_BASE_URL}/api/public/consultations/status/${encodeURIComponent(lookup)}/images`,
      {
        method: 'POST',
        body: payload,
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
    console.error('[App Public Consultation Image Proxy Error]', error)
    return NextResponse.json(
      { error: '사진을 업로드하지 못했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 503 },
    )
  }
}
