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
  metadataBase: new URL('https://homepage-five-fawn.vercel.app'),
  title: '행복한 의사 | Happy Doctor',
  description: '제비처럼, 필요한 곳에 닿는 의료. 의료 취약계층을 위한 무료 온라인 의료상담 서비스.',
  keywords: '무료 의료상담, 행복한의사, 해피닥터, 응급의학과, 의료봉사, 카카오 의료상담',
  openGraph: {
    title: '행복한 의사 | Happy Doctor',
    description: '제비처럼, 필요한 곳에 닿는 의료',
    locale: 'ko_KR',
    type: 'website',
    images: [{ url: '/design/brand-og.png', width: 1200, height: 630, alt: '행복한 의사 Happy Doctor' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '행복한 의사 | Happy Doctor',
    description: '제비처럼, 필요한 곳에 닿는 의료',
    images: ['/design/brand-og.png'],
  },
  icons: {
    icon: '/design/app-icon-square.png',
    apple: '/design/app-icon-square.png',
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
