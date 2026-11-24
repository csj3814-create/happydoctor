import type { Metadata, Viewport } from 'next'
// The same font files as before, installed from npm instead of downloaded
// from Google at build time. That download failed a CI build on 2026-11-10
// for a commit that did not touch this app, and passed on rerun. Families and
// weights are unchanged; the names are set in globals.css.
import '@fontsource/noto-sans-kr/400.css'
import '@fontsource/noto-sans-kr/500.css'
import '@fontsource/noto-sans-kr/700.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/700.css'

import AppPrivacyFooter from '@/components/AppPrivacyFooter'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://app.happydoctor.kr'),
  title: '해피닥터 앱 | Happy Doctor',
  description:
    '의료 접근성 취약계층을 위한 무료 온라인 의료상담 웹앱입니다. 상담을 시작하고 상태를 다시 확인할 수 있습니다.',
  applicationName: '해피닥터 앱',
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '해피닥터 앱 | Happy Doctor',
    description:
      '의료가 멀게 느껴질 때 먼저 닿는 온라인 의료상담. 접수된 모든 상담을 의료진이 직접 검토하는 해피닥터 앱입니다.',
    type: 'website',
    url: '/',
    images: [
      {
        url: '/app-screenshot.png',
        width: 1200,
        height: 630,
        alt: '해피닥터 앱 공유 미리보기',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '해피닥터 앱 | Happy Doctor',
    description:
      '의료가 멀게 느껴질 때 먼저 닿는 온라인 의료상담. 접수된 모든 상담을 의료진이 직접 검토하는 해피닥터 앱입니다.',
    images: ['/app-screenshot.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '해피닥터 앱',
  },
  icons: {
    icon: [{ url: '/app-icon.png', type: 'image/png' }],
    apple: [{ url: '/app-icon.png' }],
    shortcut: ['/app-icon.png'],
  },
}

export const viewport: Viewport = {
  themeColor: '#0c4f88',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full bg-[var(--surface)] text-[var(--ink)] antialiased">
        {children}
        <AppPrivacyFooter />
      </body>
    </html>
  )
}
