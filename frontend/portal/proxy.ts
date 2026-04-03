import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PORTAL_PRIMARY_DOMAIN = 'https://portal.happydoctor.kr'
const LEGACY_PORTAL_HOSTS = new Set([
  'happydoctor.vercel.app',
  'www.portal.happydoctor.kr',
])

export function proxy(request: NextRequest) {
  const host = request.headers.get('host')?.toLowerCase().split(':')[0]

  if (!host || !LEGACY_PORTAL_HOSTS.has(host)) {
    return NextResponse.next()
  }

  const destination = new URL(request.nextUrl.pathname, PORTAL_PRIMARY_DOMAIN)
  destination.search = request.nextUrl.search

  return NextResponse.redirect(destination, 308)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
