import type { Metadata } from 'next'
import RootDocument, { LANGUAGE_ALTERNATES, OG_IMAGE, SHARED_ICONS } from '../root-document'

const TITLE = 'Happy Doctor | Free Online Medical Support'
const DESCRIPTION =
  'Happy Doctor connects underserved communities with volunteer medical professionals through free online consultation.'

// The English page used to inherit the Korean defaults and override only part
// of them. Next replaces nested metadata rather than merging it, so a shared
// /en link previewed with no image at all and with a Korean title on X.
export const metadata: Metadata = {
  metadataBase: new URL('https://happydoctor.kr'),
  title: TITLE,
  description: DESCRIPTION,
  keywords: 'free online medical consultation, volunteer doctors, Happy Doctor, Korea, free medical advice',
  alternates: {
    canonical: '/en',
    languages: LANGUAGE_ALTERNATES,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    locale: 'en_US',
    type: 'website',
    url: '/en',
    images: [{ ...OG_IMAGE, alt: 'Happy Doctor share preview' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  icons: SHARED_ICONS,
}

export default function EnglishRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootDocument lang="en">{children}</RootDocument>
}
