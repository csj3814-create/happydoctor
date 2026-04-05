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

## 단계 25: 환자 앱 배포 라우팅 수정 (2026.04.03)

### 목표
- [x] Vercel이 `frontend/app`을 일반 `Other` 배포가 아니라 실제 Next.js 프로젝트로 인식하게 만든다.
- [x] `happydoctor-app.vercel.app`와 `app.happydoctor.kr`가 모두 빌드된 `/` 경로를 가리키도록 재배포한다.
- [x] 커스텀 도메인이 Vercel `NOT_FOUND` 페이지가 아니라 실제 모바일 앱 셸을 서빙하는지 확인한다.

### 검증
- [x] `frontend/app`: `npm run lint`
- [x] `frontend/app`: `npm run build`
- [x] `npx vercel deploy --prod`로 `https://app.happydoctor.kr` 배포 확인
- [x] `curl -I https://app.happydoctor.kr`가 `200 OK` 반환
- [x] `curl -I https://happydoctor-app.vercel.app`가 `200 OK` 반환

## 단계 26: 환자 앱 Git 자동 배포 설정 (2026.04.03)

### 목표
- [x] `happydoctor-app`을 GitHub 저장소에 연결해 push만으로 배포가 생성되게 만든다.
- [x] `app.happydoctor.kr` 도메인을 유지한 채 브랜치 기반 배포를 가능하게 한다.
- [x] 프로젝트가 의도한 저장소/브랜치를 추적하고 더 이상 수동 배포에만 의존하지 않는지 확인한다.

### 검증
- [x] `rootDirectory = frontend/app`인 Git 연동 Vercel 프로젝트 생성
- [x] `git push origin main`으로 자동 프로덕션 배포 생성 확인
- [x] `app.happydoctor.kr`를 Git 연동 프로젝트에 재연결하고 `200 OK` 확인
- [x] `vercel project inspect happydoctor-app`에서 `Framework Preset: Next.js`, `Root Directory: frontend/app` 확인

## 단계 27: 환자 앱 첫 진입 경험 정리 (2026.04.03)

### 목표
- [x] 현재 앱 셸을 더 강한 모바일 우선 상담 진입 표면으로 바꾼다.
- [x] 누구를 위한 앱인지, 상담 흐름이 어떤지, 지금 가능한 것과 다음 단계가 무엇인지 분명히 한다.
- [x] 첫 화면이 placeholder가 아니라 실제 제품처럼 느껴지도록 시각적 위계를 개선한다.

### 검증
- [x] `frontend/app`: `npm run lint`
- [x] `frontend/app`: `npm run build`

## 단계 28: 환자 앱 상담 상태 추적 추가 (2026.04.03)

### 목표
- [x] 상담이 기록될 때 환자에게 안전한 공개 추적 토큰을 발급한다.
- [x] 환자용 상담 상태만 노출하는 공개 백엔드 조회 엔드포인트를 추가한다.
- [x] 사용자가 카카오에서 받았던 상담 진행 상태를 앱에서 다시 확인할 수 있도록 상태 페이지와 진입 흐름을 만든다.

### 검증
- [x] `backend`에서 `app`과 `routes/public` require 시 런타임 오류 없음
- [x] `frontend/app`: `npm run lint`
- [x] `frontend/app`: `npm run build`

## 단계 29: 환자 앱 미션 중심 카피 재정렬 (2026.04.03)

### 목표
- [x] 환자 앱이 해피닥터의 미션 중심 온라인 의료상담 서비스로 먼저 읽히도록 문구를 다시 쓴다.
- [x] 사전 문진 앱이나 단순 triage 도구처럼 보이는 표현을 줄인다.
- [x] 새 상태 확인 기능은 유지하되, 서비스 정체성과 돌봄 미션 아래에 두도록 정리한다.

### 검증
- [x] `frontend/app`: `npm run lint`
- [x] `frontend/app`: `npm run build`

## 단계 30: 환자 앱 미션 중심 비주얼 재정렬 (2026.04.04)

### 목표
- [x] 앱 랜딩 화면에서 오래된 제품 프레이밍을 고정시킬 수 있는 정적 스크린샷/배너 의존도를 줄인다.
- [x] 히어로 폰 목업이 해피닥터를 의료 접근성 취약계층을 위한 미션 중심 온라인 의료상담 서비스로 설명하게 만든다.
- [x] 하단 브랜드 패널을 이미지 위주가 아니라 정체성을 강화하는 HTML/CSS 메시지 중심으로 교체한다.

### 검증
- [x] `frontend/app`: `npm run lint`
- [x] `frontend/app`: `npm run build`

## 단계 31: 홈페이지/앱 핵심 카피 정렬 (2026.04.04)

### 목표
- [x] 홈페이지와 환자 앱 문구를 `무료 온라인 의료상담`, `의료 접근성 취약계층`, `AI 인턴 보듬이 + 자원봉사 의료진` 축으로 맞춘다.
- [x] 홈페이지에 남아 있는 triage 도구 느낌 또는 과하게 임상적인 제품 톤을 줄인다.
- [x] 두 표면의 역할은 다르게 유지하되, 같은 미션을 말하도록 정리한다.

### 검증
- [x] `frontend/homepage`: `npm run lint`
- [x] `frontend/homepage`: `npm run build`
- [x] `frontend/app`: `npm run lint`
- [x] `frontend/app`: `npm run build`

## 단계 32: 백엔드 Follow-Up 전달 상태 안정화 (2026.04.04)

### 목표
- [x] in-memory follow-up 세션 캐시를 제거해 Firestore가 단일 진실원으로 남게 한다.
- [x] MessengerBot room 등록과 F/U push queue 저장을 프로세스 메모리 밖 Firestore 컬렉션으로 옮긴다.
- [x] 기존 MessengerBot 엔드포인트 호환성을 유지하면서 재시작 시 동작이 덜 취약해지게 만든다.

### 검증
- [x] `node -e "const { createApp } = require('./backend/app'); createApp(); console.log('app-ok');"`
- [x] `node -e "require('./backend/services/notifyService'); require('./backend/services/followUpService'); require('./backend/routes/messengerBot'); console.log('services-ok');"`
- [x] `git grep -n "memorySessions\|fuPushQueue\|roomMapping" -- backend` 결과가 없음

## 단계 33: 백엔드 Health Check 및 요청 검증 추가 (2026.04.04)

### 목표
- [x] Render 배포 확인이 쉬워지도록 가벼운 backend health/version 응답을 추가한다.
- [x] Kakao webhook 핸들러가 중첩 payload 구조를 무조건 가정하지 않도록 방어 로직을 넣는다.
- [x] 포털 목록/답변 요청 파싱을 정규화해 잘못된 query/body 입력이 더 예측 가능하게 흐르도록 만든다.

### 검증
- [x] `node -e "require('./backend/routes/portal'); require('./backend/routes/kakaoWebhook'); console.log('routes-ok');"`
- [x] 임시 로컬 포트에서 `createApp()`을 띄우고 `/healthz`, `/api/version` 응답 확인
- [x] `git diff -- backend/app.js backend/config.js backend/routes/portal.js backend/routes/kakaoWebhook.js` 검토로 health/version + validation 범위만 반영된 것 확인

## 단계 34: 홈페이지/앱 공유 이미지 정렬 (2026.04.04)

### 목표
- [x] 기존의 일반적인 앱 미리보기 이미지를 교체해 해피닥터가 단순 채팅 도구나 사전 문진 앱처럼 보이지 않게 한다.
- [x] 디자인 원본 OG 아트워크를 기반으로 홈페이지와 앱 공유 이미지를 현재의 미션 중심 정체성에 맞춘다.
- [x] 홈페이지/앱 메타데이터 카피도 현재 서비스 프레이밍에 맞게 정리한다.

### 검증
- [x] `frontend/homepage`: `npm run lint`
- [x] `frontend/homepage`: `npm run build`
- [x] `frontend/app`: `npm run lint`
- [x] `frontend/app`: `npm run build`
- [x] `frontend/homepage/public/design/brand-og.png`, `frontend/app/public/app-screenshot.png` 갱신 확인

## 단계 35: 카카오 상담 문구 및 안전 fallback 정리 (2026.04.04)

### 목표
- [x] 환자에게 보이는 카카오 상담 메시지가 차가운 봇/일반 triage 도구가 아니라 해피닥터의 미션 중심 온라인 의료상담처럼 들리도록 다시 쓴다.
- [x] `상담 시작`, `상담 종료` 퀵리플라이 라벨을 일관되게 맞춰 흐름이 더 의도적으로 느껴지게 한다.
- [x] 잘못된 카카오 payload 처리 시 하드 에러를 떨어뜨리지 않고, 상담으로 되돌려 보내는 `200` 안전 fallback을 제공한다.

### 검증
- [x] `node -e "require('./backend/routes/kakaoWebhook'); console.log('kakao-copy-ok');"`
- [x] 임시 로컬 포트에서 `POST /api/kakao/triage-complete`에 잘못된 non-object payload를 보내 `200` + 재시작 안내 응답 확인
- [x] `git diff -- backend/routes/kakaoWebhook.js` 검토로 카카오 환자 문구, 안전 fallback, 공용 quick-reply helper 범위만 바뀐 것 확인

## 단계 36: 한국어 표면용 이미지 자산 정리 (2026.04.04)

### 목표
- [x] 한국어 표면에서 직접 보이는 영어 오버레이 문구를 한국어 기준으로 다시 만든다.
- [x] 홈페이지 공유 이미지, 앱 공유 이미지, 채팅 미리보기 이미지가 새 언어 원칙을 따르도록 맞춘다.
- [x] 같은 작업을 반복할 수 있도록 자산 재생성 스크립트를 남긴다.

### 검증
- [x] `python scripts/refresh_korean_surface_assets.py`
- [x] `frontend/homepage/public/design/brand-og.png`, `frontend/homepage/public/design/chat-preview.png`, `frontend/app/public/app-screenshot.png` 시각 확인
- [x] `frontend/homepage`: `npm run build`
- [x] `frontend/app`: `npm run build`

## 단계 37: 웹 상담 시작 + 짧은 상태 코드 도입 (2026.04.04)

### 목표
- [x] 카카오톡이 어려운 사용자도 홈페이지/웹앱에서 바로 상담을 시작할 수 있게 공개 상담 생성 흐름을 추가한다.
- [x] 기존 긴 추적 토큰은 계속 동작하게 두되, 사람이 직접 입력할 수 있는 짧은 상태 코드를 새로 발급한다.
- [x] 홈페이지는 웹 상담 시작 진입을 노출하고, 웹앱은 실제 상담 시작 폼과 짧은 코드 중심 상태 확인 흐름을 제공한다.

### 검증
- [x] `backend`: 공개 상담 생성/상태 조회를 로컬 require + 라이브 안전 요청(`400`/`404`)으로 확인
- [x] `frontend/homepage`: `npm run build`
- [x] `frontend/app`: `npm run lint`
- [x] `frontend/app`: `npm run build`

### 결과 메모
- [x] `https://app.happydoctor.kr/start`에서 웹 상담 시작 화면이 라이브로 노출된다.
- [x] `https://happydoctor.kr/ko`에서 `웹으로 상담 시작` CTA가 노출된다.
- [x] `https://app.happydoctor.kr/api/public/consultations`는 잘못된 입력에 대해 `400`으로 안전하게 응답한다.
- [x] `https://happydoctor.onrender.com/api/public/consultations/status/ABCDEFGH`는 존재하지 않는 8자리 코드에 대해 `404`로 응답한다.
- [x] Render 라이브 백엔드 `/api/version`이 리비전 `aa904bd`를 반환해 실배포 반영을 확인했다.

## 단계 38: 한국어 공유 이미지 텍스트 겹침 수정 (2026.04.04)

### 목표
- [x] 한국어 표면용 공유 이미지의 하단 카피가 서로 겹치지 않도록 레이아웃을 조정한다.
- [x] 이미지 생성 스크립트 기준에서 한글 줄간격과 텍스트 박스 높이를 더 안전하게 잡는다.

### 검증
- [x] 수정된 이미지를 다시 생성한다.
- [x] 생성된 이미지를 실제로 열어 하단 한글 줄이 겹치지 않는지 확인한다.

## 단계 39: 한국어 상태 화면 시간대 고정 (2026.04.04)

### 목표
- [x] 상태 확인 화면에서 한글 날짜/시간을 표시할 때 한국 시간(`Asia/Seoul`) 기준으로 보이게 한다.
- [x] 기기 로컬 시간대나 서버 기본 시간대에 따라 접수 시각이 어긋나지 않도록 한다.

### 검증
- [x] `frontend/app`: `npm run build`
- [x] 상태 화면 코드에서 `ko-KR` 포맷에 `Asia/Seoul` 시간대가 함께 지정됐는지 확인한다.

## 단계 40: 카카오 인앱 브라우저 포털 링크 우회 (2026.04.04)

### 목표
- [x] 의료진 카카오 알림에서 포털 링크를 눌렀을 때 Google 로그인이 카카오 인앱 브라우저에 막히지 않도록 외부 브라우저 유도 경로를 만든다.
- [x] Android에서는 기본/선호 브라우저로 자동 전환을 먼저 시도하고, 실패해도 수동으로 열 수 있는 안내를 제공한다.

### 검증
- [x] `frontend/portal`: `npm run build`
- [x] `backend`: `routes/messengerBot` 로드 확인
- [x] 포털 외부 브라우저 유도 페이지 경로와 MessengerBot 알림 링크가 새 경로를 가리키는지 확인한다.

## 단계 41: 웹 상담 시작 화면 문구/대비 조정 (2026.04.04)

### 목표
- [x] 웹 상담 문진 화면에서 카카오 대체 안내 문구를 제거해 사용 흐름을 단순하게 만든다.
- [x] 결과 화면의 `상태 확인 화면 열기` 버튼 텍스트를 흰색으로 고정해 군청 배경에서 또렷하게 보이게 한다.

### 검증
- [x] `frontend/app`: `npm run build`
- [x] 시작 화면에서 카카오 대체 안내 문구가 제거됐는지 확인한다.
- [x] 결과 버튼 클래스에 흰색 텍스트가 명시적으로 고정됐는지 확인한다.

## 단계 42: 6자리 상태 코드 + 환자 화면 간결화 (2026.04.05)

### 목표
- [x] 새로 발급되는 공개 상태 코드를 6자리로 줄이되, 기존 8자리 코드와 링크는 계속 조회되게 유지한다.
- [x] 상태 확인 화면에서 반복 설명을 줄이고 현재 상태, 접수 시각, 주요 증상, 코드, 최근 답변 중심으로 단순화한다.
- [x] 앱 홈/상담 시작/상담 접수 완료 화면의 중복 문구를 줄이고 필요한 안내만 남긴다.

### 검증
- [x] `frontend/app`: `npm run build`
- [x] `node -e "require('./backend/services/dbService'); require('./backend/routes/public'); require('./backend/routes/kakaoWebhook'); console.log('status-code-ok');"`
- [x] 라이브 `app.happydoctor.kr/status`와 `app.happydoctor.kr/start` 문구가 간결하게 정리됐는지 확인한다.

## 다음 세션 우선순위

- [ ] 새 웹 상담 시작 흐름이 실제 사용자/의료진 운영 방식과 맞는지 보고 후속 입력 항목·안내 문구를 조정한다.
- [ ] 라이브 Kakao webhook 로그를 보고 follow-up/status 경로에 더 부드러운 safe-fallback 문구가 필요한지 판단한다.
- [ ] `imgs/`의 남은 디자인 원본 자산 중 아직 영어 중심이거나 언어 혼합이 어색한 항목이 있는지 검토하고, 꼭 필요한 것만 추가로 한국어 버전으로 정리한다.
- [ ] `app.happydoctor.kr`를 계속 상담 진입/상태 확인 중심으로 둘지, 이후 재방문/후속 안내까지 확장할지 다음 제품 단계를 결정한다.
- [ ] Kakao 전용 공유 이미지가 일반 OG 이미지와 분리돼야 하는지 검토한다.

## 단계 43: 상태 화면 종료 + 카카오 답변 전달 강화 (2026.04.05)

### 목표
- [x] 상태 확인 화면에서 환자가 의료진 답변을 본 뒤 바로 상담 종료를 선택할 수 있게 한다.
- [x] 상태 화면의 `새 상담 시작` 버튼과 종료 CTA를 흰 글씨로 고정해 작은 화면에서도 대비가 무너지지 않게 한다.
- [x] 의료진 답변 저장 시 환자 카카오 채널로 답변과 종료 안내를 함께 보낼 수 있는 대기 큐를 만든다.
- [x] MessengerBotR 기준 5분 주기로 환자 답변 알림을 확인해 채널에 전달하는 경로를 추가한다.

### 검증
- [ ] `frontend/app`: `npm run build`
- [ ] `node -e "require('./backend/routes/public'); require('./backend/routes/portal'); require('./backend/routes/messengerBot'); console.log('phase43-ok');"`
- [ ] `https://app.happydoctor.kr/status?...`에서 의료진 답변 후 종료 버튼이 보이는지 확인
- [ ] `https://happydoctor.onrender.com/api/version`으로 Render 최신 리비전 반영 확인

## 단계 44: 환자 앱 홈 문구 압축 + CTA 대비 정리 (2026.04.05)

### 목표
- [x] `app.happydoctor.kr` 첫 화면에서 같은 설명이 여러 번 반복되지 않도록 내용을 줄인다.
- [x] 앱 홈을 `무엇인지`, `누구를 위한지`, `어떻게 시작하는지` 중심으로만 다시 구성한다.
- [x] 상단 `웹으로 상담 시작`, 하단 `웹으로 상담 시작`, `카카오톡 채널 열기` 버튼 텍스트 색을 배경 대비에 맞게 명시적으로 고정한다.

### 검증
- [x] `frontend/app`: `npm run lint`
- [x] `frontend/app`: `npm run build`

## 단계 45: 홈페이지 히어로 재배치 + CTA 역할 복원 (2026.04.05)

### 목표
- [x] `happydoctor.kr` 첫 화면에서 모바일 기준 이미지가 텍스트보다 먼저 보이도록 히어로 순서를 재배치한다.
- [x] 홈페이지 히어로에서 반복 설명용 카드 밀도를 줄이고, 핵심 소개와 행동 버튼만 먼저 보이게 정리한다.
- [x] `카카오톡으로 상담하기` CTA는 카카오 노랑으로, `웹으로 상담 시작`은 해피닥터 기본 진입 CTA 톤으로 역할을 다시 분명히 한다.

### 검증
- [x] `frontend/homepage`: `npm run lint`
- [x] `frontend/homepage`: `npm run build`

## 단계 46: 라이브 웹 상담 흐름 리허설 (2026.04.05)

### 목표
- [x] 라이브 기준으로 웹 상담 생성 → 상태 확인 → 상담 종료까지 실제 요청으로 점검한다.
- [x] 실운영 의료진 알림을 불필요하게 울리지 않도록 일반 안내형 상담으로 안전하게 리허설한다.
- [x] 의료진 답변/카카오 전달 구간에서 자동으로 재현되지 않는 수동 요소를 분리해 기록한다.

### 검증
- [x] `https://app.happydoctor.kr/api/public/consultations`에 테스트 상담을 생성해 `201` 응답과 6자리 코드(`ALFL5M`)를 확인
- [x] `https://happydoctor.onrender.com/api/public/consultations/status/ALFL5M`에서 상태 조회 성공 확인
- [x] `https://app.happydoctor.kr/api/public/consultations/status/ALFL5M/close`로 종료 요청 성공 확인
- [x] 종료 후 상태 재조회 시 `closed` 상태와 종료 시각이 반영됐는지 확인
- [x] `https://happydoctor.onrender.com/api/version`에서 Render 라이브 리비전 `076be23` 확인

### 결과 메모
- [x] 테스트 상담 문진은 `codex-rehearsal` 표면으로 생성했고, 의료진 알림을 울리지 않는 일반 안내형 상담으로 안전하게 검증했다.
- [x] 웹 상담은 상태 코드만으로 재조회/종료가 가능했다.
- [x] 의료진 답변 → 환자 카카오 전달 흐름은 서버 코드와 큐는 준비돼 있지만, 실제 5분 폴링 전달은 공기계 MessengerBotR 스크립트 최신 반영이 있어야 실동작한다.
- [x] 실운영에서 의료진 알림까지 포함한 리허설은 테스트 전용 채널 또는 스테이징 없이 바로 수행하면 실제 담당자에게 혼선을 줄 수 있으므로 분리 운영이 필요하다.
- [x] 실제 운영 리허설로 `uZEIa3rkNdj5OQzJeeMD` / `TYYX7Q` 상담을 생성했고, `requiresDoctorReview: true` 및 `waiting_doctor` 상태로 의료진 알림 큐 적재까지 확인했다.
- [x] 생성 18초 후 `/api/messengerbot/poll`이 `hasNew: true`를 반환해, 그 시점에는 MessengerBotR 공기계가 알림을 소비하지 못하고 있었다.
- [x] 진단용 폴링 호출은 대기 중 알림을 가져가므로, 실제 방 전달 여부를 볼 리허설에서는 기기 상태를 먼저 확인한 뒤 최소 횟수로만 사용해야 한다.
- [x] 운영 목록 혼선을 막기 위해 테스트 상담 `TYYX7Q`는 종료 처리했다.
