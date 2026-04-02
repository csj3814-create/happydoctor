import type { Metadata } from 'next'
import HomepageClient from '../../components/HomepageClient'

export const metadata: Metadata = {
  title: '행복한 의사 | Happy Doctor',
  description: '의료 취약계층을 위한 무료 온라인 의료상담 서비스, 행복한 의사.',
  alternates: {
    canonical: '/ko',
    languages: {
      'ko-KR': '/ko',
      'en-US': '/en',
    },
  },
  openGraph: {
    locale: 'ko_KR',
    url: '/ko',
  },
}

export default function KoreanHomepage() {
  return <HomepageClient />
}
