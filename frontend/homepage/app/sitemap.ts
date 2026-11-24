import type { MetadataRoute } from 'next'

// The homepage is where every overseas patient so far arrived from, and it had
// no sitemap at all. Both language versions are listed with their alternates
// so a search engine can send each reader to the one they read.
const SITE = 'https://happydoctor.kr'

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = { ko: `${SITE}/ko`, en: `${SITE}/en` }

  return [
    { url: `${SITE}/ko`, changeFrequency: 'monthly', priority: 1, alternates: { languages } },
    { url: `${SITE}/en`, changeFrequency: 'monthly', priority: 0.9, alternates: { languages } },
  ]
}
