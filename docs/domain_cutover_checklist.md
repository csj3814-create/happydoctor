# Domain Cutover Checklist

Updated: 2026-04-02

## Scope

This checklist describes how to move the public canonical homepage to:

- `https://happydoctor.kr`

while keeping:

- `happydoctors.net` as a redirect-only expansion domain (for now)

## Target Domain Map

- Public homepage (canonical): `happydoctor.kr`
- Korean homepage path: `/ko`
- English homepage path: `/en`
- Future app: `app.happydoctor.kr`
- Future portal: `portal.happydoctor.kr`
- Expansion reserve: `happydoctors.net` (redirect to `happydoctor.kr`)

## Pre-Cutover Checks

- [ ] Confirm Vercel `homepage` project is healthy and building from the correct root directory
- [ ] Confirm latest `main` commit deploys successfully
- [ ] Confirm homepage works on both desktop and mobile in preview/prod deployment
- [ ] Confirm metadata and canonical settings in code are aligned with `happydoctor.kr`

## Vercel Domain Setup

- [ ] Add `happydoctor.kr` to the `homepage` project
- [ ] Add `www.happydoctor.kr` to the `homepage` project
- [ ] Set `happydoctor.kr` as the primary production domain
- [ ] Configure domain redirect: `www.happydoctor.kr` -> `happydoctor.kr`

## DNS Tasks

Use values exactly as shown in Vercel domain settings.

- [ ] Update apex (`@`) record for `happydoctor.kr`
- [ ] Update `www` record for `happydoctor.kr`
- [ ] Remove conflicting legacy records pointing to old hosting
- [ ] Wait for DNS propagation and re-check domain verification in Vercel

## HTTPS / SSL Checks

- [ ] Verify `https://happydoctor.kr` works
- [ ] Verify `https://www.happydoctor.kr` redirects to apex over HTTPS
- [ ] Verify no certificate warning remains

## Redirect Policy

### Required Redirects

- [ ] `http://happydoctor.kr` -> `https://happydoctor.kr`
- [ ] `http://www.happydoctor.kr` -> `https://happydoctor.kr`
- [ ] `https://www.happydoctor.kr` -> `https://happydoctor.kr`

### Expansion Domain Redirects (for now)

- [ ] `http://happydoctors.net` -> `https://happydoctor.kr`
- [ ] `https://happydoctors.net` -> `https://happydoctor.kr`
- [ ] `http://www.happydoctors.net` -> `https://happydoctor.kr`
- [ ] `https://www.happydoctors.net` -> `https://happydoctor.kr`

## Content/SEO Validation

- [ ] Confirm canonical URLs resolve to `https://happydoctor.kr/ko` and `https://happydoctor.kr/en`
- [ ] Confirm `hreflang` alternates are consistent (`ko-KR`, `en-US`)
- [ ] Confirm OG image URLs and metadata resolve on production domain
- [ ] Re-submit sitemap/domain in search console tools after cutover

## Regression Checks After Cutover

- [ ] Homepage loads quickly and without broken assets
- [ ] Kakao consultation CTA works
- [ ] `/ko` and `/en` routes return expected pages
- [ ] API-backed homepage sections (stats, Q&A) still load correctly
- [ ] Existing portal URL remains unaffected

## Rollback Notes

If critical issue appears after cutover:

- [ ] Keep Vercel deployment as source of truth
- [ ] Temporarily rollback DNS records to previous known-good host
- [ ] Keep HTTPS redirect behavior deterministic during rollback
- [ ] Log root cause and re-run this checklist before next cutover attempt
