import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const EN_ENTRY_HOSTS = new Set(['happydoctors.net', 'www.happydoctors.net'])
const PRIMARY_DOMAIN = 'https://happydoctor.kr'

export function proxy(request: NextRequest) {
  const host = request.headers.get('host')?.toLowerCase().split(':')[0]

  if (!host || !EN_ENTRY_HOSTS.has(host)) {
    return NextResponse.next()
  }

  const destination = new URL('/en', PRIMARY_DOMAIN)
  destination.search = request.nextUrl.search

  return NextResponse.redirect(destination, 308)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png).*)'],
}
