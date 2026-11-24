import type { MetadataRoute } from 'next'
import { LANGUAGE_ALTERNATES } from './root-document'

// The homepage is where every overseas patient so far arrived from, and it had
// no sitemap at all. Both language versions are listed with the same
// alternates the pages declare, so a search engine can send each reader to
// the one they read.
const SITE = 'https://happydoctor.kr'

const languages = Object.fromEntries(
  Object.entries(LANGUAGE_ALTERNATES).map(([language, path]) => [language, `${SITE}${path}`]),
)

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/ko`, changeFrequency: 'monthly', priority: 1, alternates: { languages } },
    { url: `${SITE}/en`, changeFrequency: 'monthly', priority: 0.9, alternates: { languages } },
  ]
}
