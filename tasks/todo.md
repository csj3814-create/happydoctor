# Happy Doctor Project - Tasks

## Phase 1: Planning ✅
- [x] Project overview and goal definition
- [x] Chatbot MVP scenario and architecture design
- [x] Persona refinement (Intern Doctor / Bodeum)
- [x] Integrate CLAUDE.md principles

## Phase 2: Technical Setup & Backend ✅
- [x] Analyze reference project (Habitchatbot)
- [x] Create backend implementation plan
- [x] Set up Kakao i OpenBuilder account and channel
- [x] Initialize backend project repository (Node.js)
- [x] Set up API integrations (Gemini, Telegram)
- [x] Create basic endpoints (kakaoWebhook, messengerBot)
- [x] Connect Kakao Webhook to Render cloud backend

## Phase 3: Kakao OpenBuilder Configuration ✅
- [x] Create triage skill (POST /api/kakao/triage-complete)
- [x] Create follow-up skill (POST /api/kakao/fu-reply)
- [x] Configure "예진완료" block with slot-filling (parameter prompts)
- [x] Set up callback mode (approved & working)
- [x] Activate system entities (sys.constant, sys.text, sys.image.url)
- [x] Configure parameter order: consent → gender → age → chief_complaint → onset → symptom_detail → nrs → associated_symptom → past_medical_history
- [x] Remove location, symptom_image params (simplification)

## Phase 4: Bug Fixes & Optimization ✅
- [x] Fix Gemini JSON truncation (maxOutputTokens 1024→2048, add responseMimeType)
- [x] Add JSON parse fallback (graceful error instead of crash)
- [x] Add sys.* literal value sanitizer (onset "sys.date" → default value)
- [x] Remove [DONATION_LINK] placeholder (until website ready)
- [x] E2E test success: slot-filling → callback → Gemini analysis → patient response ✅

## Phase 5: Notification & Follow-Up System ✅
- [x] Set up Kakao MessengerBotR for medical team group chat
- [x] Implement AI conditional routing logic (Autonomous vs Escalate)
- [x] Test F/U scenario (15-min follow-up trigger → patient response → re-analysis)
- [x] Verify ESCALATE flow: doctor notification delivery via MessengerBotR
- [x] Implement close-consultation feature (호전/응급실/외래 사유)
- [x] F/U push via MessengerBotR polling (fuPushQueue)

## Phase 6: Deployment & Polish ✅
- [x] Initialize Git repository & Push to GitHub (csj3814-create/happydoctor)
- [x] Connect repository to Render (auto-deploy from claude/upbeat-tharp branch)
- [x] Set up Environment Variables on Render (GEMINI_API_KEY, MESSENGER_API_KEY)
- [x] Gemini API: paid plan confirmed (via 해빛스쿨)
- [x] Firebase Firestore: set up FIREBASE_SERVICE_ACCOUNT for persistent logging
- [x] E2E testing of ESCALATE scenario (doctor receives SOAP chart)
- [x] maxOutputTokens 2048→4096 for Korean SOAP charts
- [x] Chatbot launch announcement message updated

## Phase 7: Live Testing & Polish ✅
- [x] 코드 정리 — upbeat-tharp→main 머지, 로그 태그 통일, 보안 엔드포인트 정리
- [x] API E2E 테스트 — 헬스체크/슬롯미완료/예진중단/상담종료(3사유)/F/U만료 전체 통과
- [x] close_reason 매칭 버그 확인 및 수정 (trim 추가, 인코딩 이슈 확인)
- [x] 카카오 채널 실제 E2E 테스트 — 상담종료 사유별 메시지 정상 확인
- [x] SOAP 차트 Assessment에 감별진단(DDx) 3~5개 + 확률(%) 추가
- [x] MessengerBotR 스크립트 디버그 및 room 식별자 수정
- [x] Firestore 영속 알림 큐 (doctor_notifications) 구축 — 2단계 상태 전환(pending→notified→delivered)
- [x] 증상 키워드 반응을 PATIENT_ROOM(행복한 의사의 응급상담방)에만 국한

## Phase 8: 의사-환자 양방향 소통 & 포털 ✅ (2026.03.26)
- [x] 백엔드 Portal API — GET consultations, GET consultation/:id, POST reply
- [x] Firebase Admin SDK ID 토큰 검증 + ALLOWED_DOCTOR_EMAILS 접근 제어
- [x] 의사 포털 프론트엔드 (Next.js + Tailwind) — Vercel 배포
  - [x] Google OAuth 로그인
  - [x] 환자 목록 (미답변 / 답변 완료 / 상담 종료 탭)
  - [x] 최신순 정렬, COMPLETED 상담도 표시
  - [x] 환자 상세 차트 + 답변 입력
- [x] CORS 미들웨어 순서 버그 수정
- [x] 차트 알림에 포털 사용 안내 추가
- [x] HDT (Happy Doctor Token) 시스템
  - [x] 답변 전송 시 +100 HDT 자동 적립
  - [x] 환자 확인(seen) 시 +50 HDT 추가
  - [x] doctor_stats 컬렉션 (Firestore)
  - [x] 리더보드 탭 (🏆 순위 + 내 HDT 헤더 표시)

## Phase 8-C: 공개 홈페이지 ✅ (2026.03.28)
- [x] Next.js 홈페이지 신규 구축 (frontend/homepage)
- [x] BI 디자인 적용 (메인블루 #185FA5, 딥블루 #0C447C, 스카이 #E6F1FB, 그린 #1D9E75)
- [x] 섹션 구성 (13개):
  - [x] Hero — 슬로건, 카카오 상담 CTA
  - [x] 설립 이야기 — 행복한 왕자 제비 + 2020.10 설립 취지
  - [x] 통계 — 누적 상담·전문의 회신(레거시 312건 포함)·잠재수혜인구 67,700명·MOU 6개
  - [x] 서비스 소개 (Features)
  - [x] 이용방법 (HowTo)
  - [x] 협력기관 — MOU 6개 기관 카드
  - [x] 활동 연혁 — 타임라인 2020~2026
  - [x] 갤러리 — 12장 + 라이트박스
  - [x] Q&A — 실제 상담 282건, 질문 앞 20자 + 전체 답변, 검색·페이지네이션
  - [x] 대표 소개 — 최석재 원장 프로필·약력·저서·방송·SNS 7개 링크
  - [x] 자원봉사 의사 모집
  - [x] 후원 안내 (신한은행 100-034-864699)
  - [x] Footer
- [x] Q&A 282건 크롤링 (구 happydoctors.net)
- [x] 활동사진 12장 정리 (창립총회·MOU·강의·봉사)
- [x] 공개 /api/stats 엔드포인트 (레거시 312건 기본값 포함)
- [x] Vercel 배포: https://homepage-five-fawn.vercel.app

## Phase 9: 잔여 과제
- [ ] **카카오 오픈빌더**: 폴백 블록 → `/kakao/check-doctor-reply` 연결 (환자 재접속 시 의사 답변 전달)
  - 사용자가 "1번 했어"라고 했으나 실제 동작 확인 필요
- [ ] **MessengerBotR** 공기계 스크립트 재컴파일 확인
- [ ] **홈페이지 고도화** (우선순위 낮음):
  - [ ] 도메인 연결 (happydoctors.net 또는 신규 도메인)
  - [ ] 다국어 지원 (영어·베트남어·중국어)
  - [ ] 의사 사진 — 동의 재취득 후 자원봉사 의사 소개 섹션 추가
  - [ ] SEO: Q&A 정적 페이지 생성 (/qna/[idx])
  - [ ] 언론보도 섹션 (동아일보 등 추가 보도 확보 시)
  - [ ] 스크롤 fade-in 애니메이션

## Current Status
- **Last updated**: 2026.03.28
- **MVP Status**: Full triage + F/U + close + ESCALATE + 의사 포털 + 공개 홈페이지 ✅
- **Deployed at**:
  - Backend: https://happydoctor.onrender.com
  - 의사 포털: https://happydoctor.vercel.app
  - 공개 홈페이지: https://homepage-five-fawn.vercel.app
- **GitHub**: https://github.com/csj3814-create/happydoctor
- **Kakao 채널**: https://pf.kakao.com/_PxaTxhX
- **Firebase**: happydoctor0 (Firestore logging active)
- **Model**: gemini-2.5-flash (paid plan via 해빛스쿨)

## Phase 10: Code Review & Improvement Plan (2026.04.02)

### Review Summary
- [x] Repo structure reviewed across `backend`, `frontend/homepage`, and `frontend/portal`
- [x] Backend entrypoints, routes, services, and Firestore integration reviewed
- [x] Homepage and portal entrypoints, layout, API client, and auth flow reviewed
- [x] Deployment surfaces checked: homepage, portal, live stats API
- [x] Verification run: homepage lint/build, portal lint/build, backend local health check

### Key Findings
- [ ] Backend follow-up/session state is still memory-based, so restarts or multi-instance deploys can lose timers, room mappings, and pending follow-up state
- [ ] Notification delivery is split between Firestore-backed doctor notifications and memory-only F/U push helpers, leaving dead or incomplete delivery paths
- [ ] `/api/stats` and consultation list APIs rely on collection scans / in-memory merging and need indexed, scalable query patterns
- [ ] Portal is mostly client-rendered and functionally works, but the doctor workflow is still thin: no search, filters beyond tabs, unread emphasis, or pagination
- [ ] Homepage is a single large client component with hard-coded content/data, which makes maintenance, SEO, accessibility, and content editing harder than necessary
- [ ] Automated verification is incomplete: backend has no real `npm test`, and there is no CI path proving the chatbot / portal contracts end-to-end

### Execution Plan

#### Track A. Backend Reliability First
- [x] Replace in-memory follow-up/session storage with durable persistence (Firestore or Redis) and introduce an explicit state model for triage, follow-up pending, reply pending, and closed flows
- [ ] Unify doctor notification and patient follow-up delivery into one queue/dispatcher path so MessengerBotR polling, portal replies, and follow-up reminders share the same persistence guarantees
- [x] Guard keep-alive behavior behind environment flags and separate app bootstrap from server startup so local tests and production runtime are easier to control

#### Track B. Backend Data + API Hardening
- [x] Rework `/api/stats` to use cached counters or pre-aggregated values instead of scanning the full consultations collection on every request
- [ ] Add pagination, tighter sorting, and explicit query constraints for portal consultation APIs and doctor reply history
- [ ] Add request validation and stronger authorization rules around doctor replies, consultation visibility, and closed-case behavior
- [ ] Introduce a central config/env validation layer so missing keys fail fast with clear errors

#### Track C. Portal Workflow Improvements
- [ ] Move the portal toward a better server/client split: lighter shell, clearer loading states, locale-correct metadata, and stronger accessibility defaults
- [x] Improve the doctor inbox UX with search, priority cues, unread counts, reply templates, and post-reply refresh behavior that feels instantaneous
- [ ] Add consultation-level context blocks for follow-up history, close reason, and delivery/read state so doctors can act without piecing together multiple fields

#### Track D. Homepage Architecture + Content Quality
- [ ] Break the homepage into section components plus structured content/data files so edits do not require touching one 700-line client page
- [x] Move stats and Q&A loading to server-side/ISR-friendly paths where possible to improve first paint, SEO, and resilience
- [ ] Replace raw `<img>` usage with a more intentional image strategy, and improve gallery accessibility (keyboard close, focus handling, labels)
- [ ] Tighten metadata/canonical/OG handling around the real production domain and add SEO-ready Q&A detail pages if content growth continues

#### Track E. Quality Gates
- [ ] Add backend unit/integration tests for triage routing, follow-up state transitions, portal auth, and reply delivery
- [ ] Add smoke E2E coverage for homepage load, portal login shell, consultation list fetch, and doctor reply submission
- [ ] Add CI to run frontend lint/build plus backend tests before deploy

### Verification Notes (2026.04.02)
- [x] `frontend/homepage`: `npm run lint`
- [x] `frontend/homepage`: `npm run build`
- [x] `frontend/portal`: `npm run lint`
- [x] `frontend/portal`: `npm run build`
- [x] `backend`: local `/` health check returned `200`
- [x] Live stats endpoint returned `{"total":373,"doctorReplied":321}`

### Recommended Order
- [ ] 1) Backend reliability and durable state
- [ ] 2) Portal workflow/data hardening
- [ ] 3) Homepage architecture and SEO/accessibility
- [ ] 4) Automated tests and CI completion

## Phase 11: Homepage Design Refresh (2026.04.02)

### Goal
- [x] Review the live homepage and identify design gaps in hierarchy, visual rhythm, and image usage
- [x] Reuse high-quality assets from `imgs/` to strengthen the homepage hero, section transitions, and CTA areas
- [x] Improve visual polish without changing the product message or breaking the existing information structure

### Execution Plan
- [x] Sync selected `imgs/` assets into `frontend/homepage/public`
- [x] Redesign the homepage hero and section framing around stronger art direction
- [x] Upgrade CTA, stats, gallery, and contact blocks so the page feels more premium and cohesive
- [x] Verify with `npm run lint` and `npm run build` in `frontend/homepage`

## Phase 12: Domain, Language, and Platform Direction (2026.04.02)

### Strategy Decisions
- [x] Decide Korean-first primary domain: `happydoctor.kr`
- [x] Reserve `happydoctors.net` for future international expansion
- [x] Choose one multilingual public site over two duplicate public homepages for now
- [x] Choose web app / PWA as the first app direction
- [x] Separate future product surfaces into homepage / app / portal

### Documentation
- [x] Record the domain and platform strategy in `docs/domain_platform_strategy.md`
- [x] Update homepage canonical / metadata assumptions from temporary deployment URLs to the agreed production domain strategy
- [x] Document final DNS / redirect tasks for domain cutover

### Next Build Steps
- [x] Refactor homepage structure for multilingual routing (`/ko`, `/en`)
- [ ] Extract homepage copy/content into structured data for localization
- [x] Define `app.happydoctor.kr` scope and initial web app shell requirements
- [x] Define `portal.happydoctor.kr` cutover requirements
- [ ] Plan redirect behavior for `happydoctors.net` during the pre-international stage

## Phase 13: Homepage Visual Polish + Q&A Privacy Tuning (2026.04.02)

### Requested UI Adjustments
- [x] Replace browser tab icon with Happy Doctor brand icon (remove Vercel default favicon path conflict)
- [x] Rebuild favicon/icon with tighter logo crop so tab icon appears visually larger
- [x] Adjust hero section so the main right visual block sits slightly lower
- [x] Keep the hero headline and core description visually as single-line on desktop
- [x] Move the Story section white overlay card so it does not cover the background tagline

### Q&A Exposure Adjustment
- [x] Limit public question preview length in Q&A list (apply 50-character truncation)
- [x] Keep doctor answers fully visible in expanded view

### Verification
- [x] `frontend/homepage`: `npm run lint`
- [x] `frontend/homepage`: `npm run build`

## Phase 14: happydoctors.net Vercel Cutover + Cafe24 Hosting Sunset (2026.04.02)

### Build
- [x] Add host-based redirect so `happydoctors.net` traffic lands on `https://happydoctor.kr/en`
- [x] Document domain cutover steps that allow Cafe24 hosting cancellation without service break

### Verification
- [x] `frontend/homepage`: `npm run lint`
- [x] `frontend/homepage`: `npm run build`

## Phase 15: Portal Detail Context + Metadata Polish (2026.04.03)

### Goal
- [x] Add a stronger consultation summary so doctors can understand status, reply state, and timeline at a glance
- [x] Surface follow-up history directly in the patient detail view without requiring backend changes
- [x] Tighten portal metadata for a staff-only surface (domain-ready metadata + noindex)

### Verification
- [x] `frontend/portal`: `npm run lint`
- [x] `frontend/portal`: `npm run build`

## Phase 16: Portal Inbox Prioritization Polish (2026.04.03)

### Goal
- [x] Make consultation cards easier to triage at a glance from the list view
- [x] Surface follow-up count, close context, and reply timing directly on inbox cards
- [x] Strengthen the top-level inbox summary so doctors can spot where attention is needed

### Verification
- [x] `frontend/portal`: `npm run lint`
- [x] `frontend/portal`: `npm run build`

## Phase 17: Portal Detail 404 Fix (2026.04.03)

### Goal
- [x] Fix the case where a consultation is visible in the inbox but detail lookup returns 404
- [x] Ensure Firestore's real document id always wins over any stored `id` field in document data
- [x] Preserve compatibility for any legacy links that may still point at a stored consultation id

### Verification
- [x] `backend`: require `services/dbService` and `routes/portal` without runtime errors

## Phase 18: Portal Detail Frontend Fallback Hardening (2026.04.03)

### Goal
- [x] Keep the portal detail page usable even when the primary detail id lookup misses
- [x] Pass a stable secondary identifier from the inbox to the detail page
- [x] Fall back to inbox/list data so doctors can still read a consultation while backend detail recovery catches up

### Verification
- [x] `frontend/portal`: `npm run lint`
- [x] `frontend/portal`: `npm run build`

## Phase 19: Portal Detail API Root Cause Fix (2026.04.03)

### Goal
- [x] Remove the backend condition that turns detail query failures into false 404 responses
- [x] Make doctor reply lookup work without requiring an extra Firestore composite index
- [x] Push the backend fix through the Render deployment branch

### Verification
- [x] `backend`: require `services/dbService` and `routes/portal` without runtime errors

## Phase 20: Portal Domain Cutover Prep (2026.04.03)

### Goal
- [x] Set `portal.happydoctor.kr` as the portal's default canonical/runtime domain assumption
- [x] Redirect legacy portal hosts (including the Vercel project domain) to `portal.happydoctor.kr`
- [x] Document the Vercel and DNS steps required to complete the portal cutover safely

### Verification
- [x] `frontend/portal`: `npm run lint`
- [x] `frontend/portal`: `npm run build`

## Phase 21: Portal Domain CORS Alignment (2026.04.03)

### Goal
- [x] Allow both the legacy Vercel portal host and `portal.happydoctor.kr` at the backend CORS layer
- [x] Stop relying on a single `PORTAL_ORIGIN` string for portal API access
- [x] Route portal browser API calls through the Vercel domain so custom-domain cutovers are not blocked by backend CORS lag
- [x] Push the backend CORS fix through the Render deployment branch

### Verification
- [x] `backend`: require `app` and resolve allowed portal origins without runtime errors
- [x] `frontend/portal`: `npm run lint`
- [x] `frontend/portal`: `npm run build`

## Phase 22: Portal Inbox Server Pagination (2026.04.03)

### Goal
- [x] Move portal inbox search/tab filtering onto the existing backend query params
- [x] Keep summary counts visible without downloading the full consultation list into the browser
- [x] Preserve the detail-page fallback path while reducing inbox payload size

### Verification
- [x] `backend`: require `app` and load the new portal summary route without runtime errors
- [x] `frontend/portal`: `npm run lint`
- [x] `frontend/portal`: `npm run build`

## Phase 23: Patient Web App Shell Foundation (2026.04.03)

### Goal
- [x] Create a new `frontend/app` Next.js surface for `app.happydoctor.kr`
- [x] Ship a mobile-first consultation web app shell with branded CTA, workflow framing, and PWA metadata
- [x] Reuse approved Happy Doctor brand assets so the app surface feels connected to the homepage

### Verification
- [x] `frontend/app`: `npm install`
- [x] `frontend/app`: `npm run lint`
- [x] `frontend/app`: `npm run build`

## Phase 24: Patient App Vercel Deployment (2026.04.03)

### Goal
- [x] Create or link a Vercel project for `frontend/app`
- [x] Deploy the patient web app shell and capture the live preview/production URL
- [x] Document the exact `app.happydoctor.kr` domain connection step

### Verification
- [x] `npx vercel whoami`
- [x] `npx vercel deploy --prod` returned `https://app.happydoctor.kr`

## Phase 25: Patient App Deployment Routing Fix (2026.04.03)

### Goal
- [x] Make Vercel recognize `frontend/app` as a real Next.js project instead of a generic `Other` deployment
- [x] Redeploy the patient app so `happydoctor-app.vercel.app` and `app.happydoctor.kr` resolve to the built `/` route
- [x] Verify the custom domain serves the mobile app shell, not a Vercel `NOT_FOUND` page

### Verification
- [x] `frontend/app`: `npm run lint`
- [x] `frontend/app`: `npm run build`
- [x] `npx vercel deploy --prod` produced `https://app.happydoctor.kr`
- [x] `curl -I https://app.happydoctor.kr` returned `200 OK`
- [x] `curl -I https://happydoctor-app.vercel.app` returned `200 OK`

## Phase 26: Patient App Git Auto-Deploy Setup (2026.04.03)

### Goal
- [x] Connect `happydoctor-app` to the GitHub repository so pushes create deployments automatically
- [x] Keep `app.happydoctor.kr` attached to the patient app project while enabling branch-based deploys
- [x] Verify the project tracks the intended repo/branch and no longer depends on manual-only deploys

### Verification
- [x] Created a Git-connected Vercel project with `rootDirectory = frontend/app`
- [x] `git push origin main` triggered a new automatic production deployment for the patient app project
- [x] `app.happydoctor.kr` was reassigned to the Git-connected patient app project and returned `200 OK`
- [x] `vercel project inspect happydoctor-app` now shows `Framework Preset: Next.js` and `Root Directory: frontend/app`

## Phase 27: Patient App Entry Experience (2026.04.03)

### Goal
- [x] Turn the current app shell into a stronger mobile-first consultation entry surface
- [x] Clarify who the app is for, how the consultation flow works, and what is available now vs next
- [x] Improve the visual hierarchy so the first screen feels like a real product, not a placeholder

### Verification
- [x] `frontend/app`: `npm run lint`
- [x] `frontend/app`: `npm run build`

## Phase 28: Patient App Consultation Status Tracking (2026.04.03)

### Goal
- [x] Issue a patient-safe public tracking token when a consultation is logged
- [x] Add a public backend status lookup endpoint that only exposes patient-facing consultation state
- [x] Add an app status page and homepage entry flow so users can reopen their consultation progress from Kakao

### Verification
- [x] `backend`: require `app` and `routes/public` without runtime errors
- [x] `frontend/app`: `npm run lint`
- [x] `frontend/app`: `npm run build`

## Phase 29: Patient App Mission Copy Reframing (2026.04.03)

### Goal
- [x] Rewrite the patient app so it reads first as Happy Doctor's mission-led online medical consultation service
- [x] Reduce any wording that makes the app sound like a pre-visit questionnaire or triage-only utility
- [x] Keep the new status-check feature, but subordinate it to the service identity and care mission

### Verification
- [x] `frontend/app`: `npm run lint`
- [x] `frontend/app`: `npm run build`

## Next Session Priorities

- [ ] Update patient app visual assets/screenshots so in-image copy matches the new mission-led messaging
- [ ] Review homepage/app copy consistency around `무료 온라인 의료상담`, `의료 접근성 취약계층`, and `AI 인턴 보듬이 + 자원봉사 의료진`
- [ ] Resume backend reliability work: unify follow-up/notification delivery and harden request validation
