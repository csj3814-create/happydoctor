---
name: HappyDoctor portal project context
description: Key facts about the 해피닥터 doctor portal Next.js app — version, patterns, and auth setup
type: project
---

The portal is a Next.js 16.2.1 + React 19 App Router project at `D:\antigravity\happydoctor\frontend\portal\`.

Firebase 12.x is used for Google OAuth (lib/firebase.ts). The API client (lib/api.ts) attaches Firebase ID tokens to requests sent to `https://happydoctor.onrender.com`.

**Why:** Medical portal for escalated consultations — doctors log in via Google, review ESCALATE-flagged cases, and send replies to patients via the backend API.

**How to apply:** All interactive pages must be `'use client'` components because auth state (onAuthStateChanged) and form handling require browser APIs. Keep server components out of auth-gated routes.

Key breaking change: `params` in dynamic route pages is a `Promise<{ id: string }>` in this Next.js version — always `await params` or resolve via `useEffect` + `.then()` in client components. The `PageProps<'/path'>` helper only resolves after `next dev/build` generates types, so prefer explicit `{ params: Promise<{ id: string }> }` typing in client components.

Routes built:
- `/` — login card (unauthenticated) or ESCALATE consultation list (authenticated)
- `/patient/[id]` — full consultation detail: patient data, SOAP chart, reply history, reply form
