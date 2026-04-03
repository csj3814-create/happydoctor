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
- Doctor portal: `portal.happydoctor.kr`
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

### Expansion Domain to English Entry

If product policy is "international traffic enters via `/en`":

- [ ] In Vercel domain UI, set domain-level redirect target to `happydoctor.kr` (domain only, no `/en` path)
- [ ] In app-level proxy (`proxy.ts`), redirect requests with host `happydoctors.net` / `www.happydoctors.net` to `https://happydoctor.kr/en`
- [ ] Verify query params (UTM) are preserved to `/en`

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

## Portal Cutover Checklist

### Vercel Domain Setup

- [ ] Add `portal.happydoctor.kr` to the `portal` project
- [ ] Set `portal.happydoctor.kr` as the primary production domain for the portal
- [ ] Keep `happydoctor.vercel.app` attached only if Vercel requires it for redirect behavior
- [ ] If `www.portal.happydoctor.kr` is added, redirect it to `portal.happydoctor.kr`

### Portal DNS Tasks

Use the exact values shown in Vercel domain settings.

- [ ] Add or update the `portal` subdomain record on `happydoctor.kr`
- [ ] Remove conflicting legacy records for `portal.happydoctor.kr`
- [ ] Wait for DNS propagation and confirm Vercel marks the domain as valid

### Portal App Settings

- [ ] Set `NEXT_PUBLIC_PORTAL_SITE_URL=https://portal.happydoctor.kr` in the Vercel portal project
- [ ] Confirm portal metadata and canonical tags resolve to `https://portal.happydoctor.kr`
- [ ] Confirm app-level redirect/proxy sends `happydoctor.vercel.app/*` to `portal.happydoctor.kr/*`

### Portal Verification

- [ ] `https://portal.happydoctor.kr` loads the doctor portal
- [ ] `https://happydoctor.vercel.app` redirects to `https://portal.happydoctor.kr`
- [ ] Existing authenticated portal flows still work after the host changes
- [ ] Login, inbox, detail view, and reply submission work on the new domain

## Rollback Notes

If critical issue appears after cutover:

- [ ] Keep Vercel deployment as source of truth
- [ ] Temporarily rollback DNS records to previous known-good host
- [ ] Keep HTTPS redirect behavior deterministic during rollback
- [ ] Log root cause and re-run this checklist before next cutover attempt

## Cafe24 Hosting Sunset (When Domain Works on Vercel)

If you plan to stop paid Cafe24 web hosting:

- [ ] Confirm `happydoctors.net` and `www.happydoctors.net` both resolve to Vercel records
- [ ] Confirm `https://happydoctors.net` and `https://www.happydoctors.net` redirect correctly
- [ ] Keep only required DNS records for mail if still needed (MX/TXT)
- [ ] Remove legacy web A/CNAME records pointing to old Cafe24 web server
- [ ] Take final backup/screenshot/export from Cafe24 hosting before cancellation
- [ ] Cancel Cafe24 hosting product after 24-48h stable monitoring
