// The same font files as before, from npm rather than downloaded from Google
// at build time - that download failed a CI build once. Same weights as the
// old next/font setup; globals.css names the family on body.
import '@fontsource/noto-sans-kr/400.css'
import '@fontsource/noto-sans-kr/500.css'
import '@fontsource/noto-sans-kr/700.css'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

// The Korean and English homepages each have their own root layout so that
// each can declare its own language: the English page used to ship as
// <html lang="ko">, which tells search engines and screen readers that the
// page overseas patients land on is Korean. Everything else they share lives
// here.
export default function RootDocument({
  lang,
  children,
}: Readonly<{ lang: 'ko' | 'en'; children: React.ReactNode }>) {
  return (
    <html lang={lang} className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}

// One definition of which page serves which language. 'en' rather than
// 'en-US': the English page is for patients in Birmingham and Karachi as much
// as in Ohio. x-default points readers of any other language at the English
// page, which links into a consultation form in their own language.
export const LANGUAGE_ALTERNATES = {
  ko: '/ko',
  en: '/en',
  'x-default': '/en',
} as const

export const SHARED_ICONS = {
  icon: [{ url: '/icon.png', type: 'image/png' }],
  shortcut: ['/icon.png'],
  apple: [{ url: '/icon.png' }],
}

export const OG_IMAGE = {
  url: '/design/brand-og.png',
  width: 1200,
  height: 630,
}
