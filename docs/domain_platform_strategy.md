# Happy Doctor Domain & Platform Strategy

Updated: 2026-04-02

## Decision Summary

- Primary public brand domain: `happydoctor.kr`
- Future international expansion domain: `happydoctors.net`
- Current strategy: operate one multilingual public site, not two duplicate public sites
- App delivery strategy: build as a web app / PWA first
- Doctor portal should be separated under its own subdomain when domain cutover is ready

## Why This Direction

### 1. One public site is better than two right now

At the current stage, Happy Doctor benefits more from:

- one canonical domain
- one SEO surface
- one content system
- one design system
- one deployment flow

Running separate Korean and international public sites too early would increase:

- duplicate content risk
- SEO fragmentation
- translation maintenance cost
- deployment and analytics complexity

So the near-term recommendation is:

- operate one public homepage
- serve Korean and English within that single site
- split into separate regional sites only when product, content, and operations truly diverge

### 2. `happydoctor.kr` should be the Korean-first brand anchor

Reasons:

- shorter and cleaner for Korean users
- stronger fit for current audience and brand rollout
- better for printed materials, QR campaigns, Kakao profiles, and offline outreach

### 3. `happydoctors.net` should be reserved for later global expansion

Reasons:

- natural fit for a broader international or multilingual brand
- valuable as a future domain if overseas traffic, content, or partnerships expand
- should not host a duplicate public homepage right now

Near term, it should redirect to the Korean primary domain.

## Recommended Domain Architecture

### Public Site

- Canonical public homepage: `https://happydoctor.kr`
- Korean content: `https://happydoctor.kr/ko`
- English content: `https://happydoctor.kr/en`
- Default root `/`: either Korean-first, or language-aware redirect based on browser locale

Recommended near-term behavior:

- `/` loads Korean-first homepage or a lightweight language-aware homepage
- `/en` is a full English version of the same marketing structure
- content, design, and CTA structure remain aligned across languages

### Web App

- User-facing consultation web app / PWA: `https://app.happydoctor.kr`

This should eventually hold:

- chatbot or AI intern interaction shell
- consultation status/history
- mobile installable experience
- notification-friendly PWA behavior

Why a subdomain:

- separates product app concerns from marketing content
- allows different caching, auth, and deployment behavior
- keeps room for future app navigation without making the homepage messy

### Doctor Portal

- Doctor portal: `https://portal.happydoctor.kr`

This should be the stable home for:

- doctor login
- inbox/worklist
- reply workflow
- consultation history and operational tooling

### Future International Domain

- Reserve `https://happydoctors.net` for future international growth

Near-term usage:

- `happydoctors.net` -> `happydoctor.kr`
- `www.happydoctors.net` -> `happydoctor.kr`

Later, when expansion is real:

- `happydoctors.net` can become the global or English-first public site
- or it can redirect directly to `happydoctor.kr/en` until a true split is needed

## Recommended Redirect Rules

### Near-Term

- `http://happydoctor.kr` -> `https://happydoctor.kr`
- `http://www.happydoctor.kr` -> `https://happydoctor.kr`
- `https://www.happydoctor.kr` -> `https://happydoctor.kr`
- `http://happydoctors.net` -> `https://happydoctor.kr`
- `https://happydoctors.net` -> `https://happydoctor.kr`
- `http://www.happydoctors.net` -> `https://happydoctor.kr`
- `https://www.happydoctors.net` -> `https://happydoctor.kr`

### Mid-Term International Prep

Optional later:

- `happydoctors.net` -> `happydoctor.kr/en`

This only makes sense if the English version is polished enough to stand on its own.

## Language Strategy

### Recommended Now

Use one multilingual public site with path-based language routing.

Recommended paths:

- `/ko`
- `/en`

Why path-based routing instead of separate domains right now:

- easier SEO management
- simpler analytics
- lower deployment complexity
- easier shared component architecture
- easier shared content governance

### Split Criteria for the Future

Only split Korean and international sites into separate domains if several of these become true:

- different partnership ecosystems by region
- meaningfully different messaging by audience
- region-specific legal or trust content
- separate editorial/content owners
- different product flows by language/market
- sustained international traffic that justifies dedicated SEO strategy

Until then, a multilingual single site is the right default.

## Product Surface Map

### 1. Public Homepage

Domain:

- `happydoctor.kr`

Purpose:

- trust building
- mission/story
- consultation CTA
- FAQ and proof
- multilingual brand entry

### 2. Consultation App / PWA

Domain:

- `app.happydoctor.kr`

Purpose:

- mobile-friendly app shell
- installable web app
- future patient-facing product workflows

### 3. Doctor Portal

Domain:

- `portal.happydoctor.kr`

Purpose:

- authenticated medical staff operations
- consultation management
- response workflow

## DNS and Platform Plan

### Immediate Domain Goal

Move the public homepage canonical from temporary Vercel deployment URLs to `happydoctor.kr`.

### Suggested Mapping

- Vercel project `homepage` -> `happydoctor.kr`, `www.happydoctor.kr`
- Vercel project `portal` -> `portal.happydoctor.kr`
- `happydoctors.net` remains attached as redirect-only until needed

### SSL

Make sure HTTPS works on all official domains before public rollout:

- `happydoctor.kr`
- `www.happydoctor.kr`
- `portal.happydoctor.kr`
- optionally `happydoctors.net`

## Codebase Implications

### Homepage

Should be updated to:

- set `metadataBase` to `https://happydoctor.kr`
- use canonical URLs based on `happydoctor.kr`
- prepare for `/ko` and `/en` routing
- centralize content for multilingual expansion

### Portal

Should be updated to:

- target `portal.happydoctor.kr` as its canonical production address
- keep auth and API assumptions domain-safe
- redirect the legacy Vercel project host (`happydoctor.vercel.app`) to `portal.happydoctor.kr`

### App / PWA

Should be planned as:

- a separate frontend surface under `app.happydoctor.kr`
- shared design language with homepage
- mobile-first shell suitable for installable web app behavior

Current implementation status:

- initial shell now lives in `frontend/app`
- includes a branded consultation entry surface, PWA manifest, and installable web app metadata
- keeps Kakao consultation as the immediate entry point while reserving room for future status/history features
- pins the Vercel framework at the app surface so `app.happydoctor.kr` deploys as a real Next.js app
- Vercel project `happydoctor-app` is now linked and live at `https://app.happydoctor.kr`
- production deploys for the app surface are now triggered automatically from GitHub `main`

## Execution Order

### Phase A. Domain Canonicalization

1. Set `happydoctor.kr` as the official homepage domain
2. Redirect `www.happydoctor.kr` to the apex domain
3. Redirect `happydoctors.net` to `happydoctor.kr`
4. Update homepage metadata/canonical/OG base URLs

### Phase B. Multilingual Homepage Foundation

1. Refactor homepage content into structured data/files
2. Add `/ko` and `/en` route strategy
3. Localize metadata and major CTA copy
4. Prepare language switcher and canonical/hreflang tags

### Phase C. Platform Separation

1. Reserve `portal.happydoctor.kr` for doctor workflows
2. Plan `app.happydoctor.kr` as the patient-facing web app / PWA
3. Keep homepage, app, and portal visually related but operationally separate

### Portal Cutover Notes

When the portal domain cutover happens:

- attach `portal.happydoctor.kr` to the Vercel portal project
- keep `happydoctor.vercel.app` reachable only as a redirect target, not as a canonical URL
- prefer `portal.happydoctor.kr` over any `www` variant
- set `NEXT_PUBLIC_PORTAL_SITE_URL=https://portal.happydoctor.kr` in Vercel so metadata stays correct even if defaults change later

### Phase D. International Expansion

Only after meaningful international traction:

1. decide whether `happydoctors.net` should remain a redirect
2. or promote it into a dedicated international site

## Final Recommendation

For now, the best structure is:

- `happydoctor.kr` = official homepage
- `happydoctor.kr/ko` and `happydoctor.kr/en` = multilingual public site
- `app.happydoctor.kr` = future web app / PWA
- `portal.happydoctor.kr` = doctor portal
- `happydoctors.net` = reserved global domain, redirecting for now

This gives Happy Doctor:

- one clear public brand
- one clean SEO strategy
- room for multilingual growth
- room for product expansion
- a future-safe international option without overcommitting too early
