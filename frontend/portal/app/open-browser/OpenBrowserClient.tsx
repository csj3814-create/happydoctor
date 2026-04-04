'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

const PORTAL_SITE_URL = process.env.NEXT_PUBLIC_PORTAL_SITE_URL || 'https://portal.happydoctor.kr'

function resolvePortalTarget(nextPath: string | null | undefined) {
  if (!nextPath || !nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return new URL('/', PORTAL_SITE_URL).toString()
  }

  return new URL(nextPath, PORTAL_SITE_URL).toString()
}

function buildAndroidIntentUrl(targetUrl: string) {
  const parsed = new URL(targetUrl)
  const scheme = parsed.protocol.replace(':', '')
  const pathWithQuery = `${parsed.pathname}${parsed.search}${parsed.hash}`
  return `intent://${parsed.host}${pathWithQuery}#Intent;scheme=${scheme};action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`
}

function buildIosExternalUrl(targetUrl: string) {
  if (targetUrl.startsWith('https://')) {
    return targetUrl.replace('https://', 'x-safari-https://')
  }

  if (targetUrl.startsWith('http://')) {
    return targetUrl.replace('http://', 'x-safari-http://')
  }

  return targetUrl
}

function isKakaoInAppBrowser(userAgent: string) {
  return /KAKAOTALK/i.test(userAgent)
}

function isAndroid(userAgent: string) {
  return /Android/i.test(userAgent)
}

function isIos(userAgent: string) {
  return /iPhone|iPad|iPod/i.test(userAgent)
}

type OpenBrowserClientProps = {
  nextPath?: string
}

export default function OpenBrowserClient({ nextPath }: OpenBrowserClientProps) {
  const [autoOpenAttempted, setAutoOpenAttempted] = useState(false)

  const targetUrl = useMemo(() => resolvePortalTarget(nextPath), [nextPath])

  const externalUrl = useMemo(() => {
    if (typeof navigator === 'undefined') {
      return targetUrl
    }

    const userAgent = navigator.userAgent || ''

    if (isAndroid(userAgent)) {
      return buildAndroidIntentUrl(targetUrl)
    }

    if (isIos(userAgent)) {
      return buildIosExternalUrl(targetUrl)
    }

    return targetUrl
  }, [targetUrl])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const userAgent = navigator.userAgent || ''

    if (!isKakaoInAppBrowser(userAgent)) {
      window.location.replace(targetUrl)
      return
    }

    const timer = window.setTimeout(() => {
      setAutoOpenAttempted(true)
      window.location.href = externalUrl
    }, 180)

    return () => window.clearTimeout(timer)
  }, [externalUrl, targetUrl])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eff7ff_0%,#ffffff_48%,#f7fbff_100%)] px-5 py-10 text-slate-900">
      <div className="mx-auto max-w-lg rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-[0_24px_60px_rgba(15,47,89,0.10)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Open In Browser</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-900">
          포털을 기본 브라우저에서 여는 중입니다
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          카카오톡 안에서는 Google 로그인이 막힐 수 있어요. 해피닥터 포털을 크롬이나 기본 브라우저로 다시 열어 로그인할 수
          있게 도와드릴게요.
        </p>

        <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-4 text-sm leading-7 text-slate-600">
          <p className="font-semibold text-slate-900">자동으로 열리지 않으면</p>
          <ol className="mt-3 list-decimal space-y-1 pl-5">
            <li>아래 버튼을 눌러 기본 브라우저로 열어 주세요.</li>
            <li>그래도 안 되면 카카오톡 우측 상단 메뉴에서 브라우저 열기를 선택해 주세요.</li>
          </ol>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <a
            href={externalUrl}
            className="rounded-full bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            기본 브라우저로 열기
          </a>
          <a
            href={targetUrl}
            className="rounded-full border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            포털 링크 다시 열기
          </a>
          <Link
            href="/"
            className="rounded-full border border-transparent px-5 py-3 text-center text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
          >
            포털 첫 화면으로
          </Link>
        </div>

        <p className="mt-5 text-xs leading-6 text-slate-400">
          {autoOpenAttempted
            ? '외부 브라우저 열기를 한 번 시도했습니다.'
            : '잠시 후 외부 브라우저를 자동으로 시도합니다.'}
        </p>
      </div>
    </main>
  )
}
