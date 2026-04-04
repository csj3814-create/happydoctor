import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://happydoctor.kr'),
  title: '행복한 의사 | Happy Doctor',
  description:
    '제비처럼, 필요한 곳에 닿는 의료. 의료 접근성 취약계층을 위한 무료 온라인 의료상담 서비스입니다.',
  keywords:
    '무료 의료상담, 행복한 의사, 해피닥터, 의료 접근성 취약계층, 카카오톡 의료상담',
  alternates: {
    canonical: '/ko',
    languages: {
      'ko-KR': '/ko',
      'en-US': '/en',
    },
  },
  openGraph: {
    title: '행복한 의사 | Happy Doctor',
    description:
      '의료 접근성 취약계층을 위한 무료 온라인 의료상담. AI 인턴 보듬이와 자원봉사 의료진이 함께 움직입니다.',
    locale: 'ko_KR',
    type: 'website',
    url: '/ko',
    images: [
      {
        url: '/design/brand-og.png',
        width: 1200,
        height: 630,
        alt: '행복한 의사 공유 미리보기',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '행복한 의사 | Happy Doctor',
    description:
      '의료 접근성 취약계층을 위한 무료 온라인 의료상담. AI 인턴 보듬이와 자원봉사 의료진이 함께 움직입니다.',
    images: ['/design/brand-og.png'],
  },
  icons: {
    icon: [{ url: '/icon.png', type: 'image/png' }],
    shortcut: ['/icon.png'],
    apple: [{ url: '/icon.png' }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${notoSansKR.className} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
