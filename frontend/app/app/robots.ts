import type { MetadataRoute } from 'next'

// A status page URL can carry a consultation's lookup code (/status?code=...).
// Search engines must not crawl those, so /status is kept out entirely, along
// with the API and the data-deletion flow.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/start', '/privacy'],
      disallow: ['/status', '/api/', '/delete-data'],
    },
    sitemap: 'https://app.happydoctor.kr/sitemap.xml',
  }
}
