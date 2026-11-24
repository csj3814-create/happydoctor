import type { MetadataRoute } from 'next'

// Only the pages a stranger should find. /status is deliberately absent: it is
// opened with a consultation's lookup code, and those must never be indexed.
const APP = 'https://app.happydoctor.kr'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${APP}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${APP}/start`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${APP}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
