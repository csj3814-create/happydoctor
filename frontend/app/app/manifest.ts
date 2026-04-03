import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '해피닥터 앱',
    short_name: '해피닥터',
    description: '카카오톡에서 시작하고 앱처럼 이어지는 해피닥터 상담 셸',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f8fb',
    theme_color: '#0c4f88',
    lang: 'ko-KR',
    icons: [
      {
        src: '/app-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/app-screenshot.png',
        sizes: '1179x2556',
        type: 'image/png',
        label: '해피닥터 앱 상담 셸 미리보기',
      },
    ],
  }
}
