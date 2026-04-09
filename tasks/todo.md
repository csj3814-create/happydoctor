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
- [x] Connect repository to Render
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

## Phase 60: 상담 미디어 업로드 설계 (2026.04.06)

### 목표
- [x] 카카오 상담에서 사진 업로드를 어떤 방식으로 받을 수 있는지 공식 문서와 현재 시나리오 기준으로 확인
- [x] 웹앱 상담에서 사진/3분 이내 동영상 업로드를 받을 수 있는 구조 설계
- [x] 동영상은 서버에서 경량본으로 변환 저장하고 원본 삭제하는 파이프라인 가능 여부 검토
- [x] 현재 Render + Firebase 기반 인프라에서 가장 무리 없는 저장 전략과 구현 순서 정리

### 확인 포인트
- [x] 카카오 오픈빌더가 `sys.image.url` 기반 사진 입력을 계속 지원하는지 확인
- [x] 카카오에서 사용자 동영상 입력을 직접 받을 수 있는 공식 경로가 있는지 확인
- [x] 웹앱 업로드 API, 저장소, 압축 처리에 필요한 라이브러리/런타임 제약 정리
- [x] 환자/의료진 화면에 어떤 형태로 미디어를 노출할지 데이터 모델 초안 정리

## Phase 61: 웹앱 사진 업로드 1차 구현 (2026.04.07)

### 목표
- [x] 환자가 `app.happydoctor.kr/status` 화면에서 현재 상담에 사진을 첨부할 수 있게 한다.
- [x] 첨부한 사진을 Firebase Storage에 저장하고 상담 문서에 메타데이터를 남긴다.
- [x] 상태 화면과 의료진 포털 상세 화면에서 첨부 사진을 바로 확인할 수 있게 한다.
- [x] 공개 링크/코드 기반 상담 흐름을 유지하면서 로그인 없이도 안전하게 현재 상담에만 사진을 추가할 수 있게 한다.

### 구현 메모
- [x] 카카오 링크 `https://open.kakao.com/me/csj3814` → `https://open.kakao.com/me/happydoctors` 전역 교체
- [x] 백엔드에 사진 업로드용 public API 추가
- [x] Firebase Storage 버킷 설정값(`FIREBASE_STORAGE_BUCKET`) 사용 준비
- [x] 상담 문서 `mediaItems` 구조 추가
- [x] 환자 앱 상태 화면 업로더 UI 추가
- [x] 의료진 포털 상세 화면 사진 미리보기 추가

### 검증
- [x] `backend`: `node --check routes/public.js`
- [x] `backend`: `node --check services/dbService.js`
- [x] `backend`: `createApp()` 로드 확인
- [x] `frontend/app`: `npm run lint`
- [x] `frontend/app`: `npm run build`
- [x] `frontend/portal`: `npm run lint`
- [x] `frontend/portal`: `npm run build`

## Stage 71: portal follow-up tab and quick links (2026.04.09)

### Goals
- [x] Add a dedicated `follow-up` tab to the portal consultation inbox.
- [x] Add quick-link buttons on the summary cards for pending, follow-up, replied, and closed.
- [x] Keep tab counts, search, and pagination aligned with the new follow-up view.

### Verification
- [x] `frontend/portal`: `npm run build`
- [x] Manual check: summary card quick links switch tabs correctly
- [x] Manual check: follow-up tab lists consultations with follow-up logs

## Stage 72: deploy branch cleanup (2026.04.09)

### Goals
- [x] Confirm the old temporary deploy branch was only a legacy Git branch used by Render auto-deploy.
- [x] Update repository notes to treat `main` as the only long-term deploy branch.
- [x] Switch Render auto-deploy branch to `main` in the dashboard.
- [x] Remove the obsolete remote branch once `main` matches it.

### Notes
- [x] `main` and the old temporary deploy branch pointed to the same commit before cleanup.
- [x] Render dashboard branch setting is already `main`; the remaining blocker is build/deploy progression.

## Stage 73: wrap-up and deploy blocker note (2026.04.09)

### Done
- [x] Portal follow-up tab UI shipped to production.
- [x] Summary card shortcut buttons shipped to production.
- [x] Legacy temporary deploy branch removed from the remote repository.
- [x] New handoff note added for the next session.

### Blocked
- [ ] Render backend deploy is not yet live.
  - Live `/api/version` is still on `8003c29`.
  - Expected next live revision is `eda0c36` or newer.
  - Render UI stayed on `Building` / `Awaiting build logs...` during repeated deploy attempts.
- [x] `frontend/homepage`: `npm run lint`
- [x] `frontend/homepage`: `npm run build`

## Stage 74: portal tab separation fix (2026.04.09)

### Goals
- [x] `follow-up` 탭과 `답변 완료` 탭이 같은 상담을 동시에 보여주지 않도록 분리한다.
- [x] 포털 요약 카운트도 같은 분류 규칙을 따르도록 맞춘다.
- [x] Render 백엔드가 아직 구버전이어도 포털 프런트에서 겹침 없이 보이도록 안전장치를 둔다.

### Notes
- [x] 원인: `followUpLogs`가 있는 상담이 `doctorRepliedAt` 기준에도 함께 걸려 두 탭에 중복 노출되고 있었다.
- [x] 백엔드 분류 우선순위를 `closed -> followup -> replied -> pending`으로 정리했다.
- [x] 포털 프런트는 `status=all` 전체 목록을 받아 같은 우선순위로 다시 나눠 탭 목록과 요약 수치를 계산한다.
- [x] 보정: `follow-up 기록 존재`만으로는 부족했고, `가장 최근 follow-up > 가장 최근 의사 답변`일 때만 follow-up 탭에 남도록 좁혔다.
- [x] 포털 상세 화면 상태 배지도 같은 기준으로 맞췄다.

### Verification
- [x] `frontend/portal`: `npm run build`
- [x] `frontend/portal`: `npm run lint`
- [x] `backend`: `node --check services/dbService.js`
- [x] portal production deploy: `happydoctor-5ou70mv16-csj3814-8131s-projects.vercel.app`

## Stage 75: public status flow regression fix (2026.04.09)

### Goals
- [x] 웹 상담 접수 직후 status 화면에서 보듬이의 1차 답변을 다시 보여준다.
- [x] `확인 대기` 상태 카드보다 보듬이 답변이 먼저 보이도록 순서를 조정한다.
- [x] `상담 상태를 불러오고 있습니다...` 안내는 화면 하단으로 내리고, background refresh에서는 1분에 한 번만 노출되게 조정한다.

### Notes
- [x] 원인 확인 및 수정 내용을 정리한다.

### Verification
- [x] `frontend/app`: `npm run build`
- [x] `frontend/app`: `npm run lint`
- [x] `backend`: `node --check services/dbService.js`

## 오늘 우선 작업 정리 (2026.04.09)

### 실제 우선순위
- [ ] Render 서비스 Events를 다시 확인한다.
- [ ] `Deploy latest commit` 또는 `Clear build cache & deploy`를 재시도한다.
- [ ] `https://happydoctor.onrender.com/api/version`가 `eda0c36` 이상으로 올라왔는지 확인한다.
- [ ] 환자 앱 `/status` 실제 브라우저 화면에서 사진 업로드 UI를 다시 확인한다.
- [ ] 포털 상세 화면에서 같은 이미지가 보이는지 확인한다.
- [ ] 필요하면 Render 환경변수 `FIREBASE_STORAGE_BUCKET` 값을 다시 점검한다.
- [ ] 백엔드 반영 뒤 포털 `follow-up` 탭이 실제 데이터를 제대로 보여주는지 확인한다.

### 메모
- [x] Render 자동 배포 브랜치는 최신 handoff 기준 이미 `main`이다.
- [x] 오늘의 핵심 미해결 이슈는 브랜치 설정이 아니라 Render 배포 정체와 라이브 사진 업로드 확인이다.
- [x] Render 공식 상태 페이지 확인: 2026-04-09 기준 `All Systems Operational`, 2026-04-08 빌드/프로비저닝 장애는 해소된 상태다.
- [x] 라이브 API 기준 사진 업로드 E2E 확인 완료
  - 테스트 상담 `73WTZS` 생성
  - 이미지 업로드 후 상태 조회에서 `mediaItems` 확인
  - 서명 URL `200` 확인
  - 테스트 상담 종료 후 Firestore 문서/이미지 삭제 및 `public_stats` 재빌드로 정리 완료
- [x] Vercel 포털/앱 프로덕션 배포는 둘 다 최신 `3f58d9e` 기준 READY 상태다.
- [x] 포털 환자 상세 페이지 코드는 `mediaItems`를 이미지 섹션에서 직접 렌더한다.
- [x] 포털 최근 24시간 production runtime error/warning 로그는 별도 없음.
- [ ] 포털 인증 화면에서 이미지가 실제로 렌더되는지에 대한 시각 검증은 아직 남아 있다.

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

## Phase 55: 의료진 승인 대기 + 웹 상담 세션 복구 (2026.04.06)

### Goal
- [x] Google 로그인 후 미승인 의료진을 `승인 대기` 상태로 저장하고, 대표자가 포털에서 승인할 수 있게 만든다
- [x] 승인된 의료진만 포털 상담 목록/답변 기능에 접근하도록 권한 구조를 재정리한다
- [x] 환자 웹앱에서 상담 생성 후 새로고침해도 1시간 동안 상담 상태 화면을 복구할 수 있게 한다
- [x] 환자 웹앱 문진 입력 중 새로고침해도 임시 입력 내용이 복구되게 한다

### Verification
- [x] `backend`: 앱 로드 확인
- [x] `frontend/portal`: `npm run lint`
- [x] `frontend/portal`: `npm run build`
- [x] `frontend/app`: `npm run lint`
- [x] `frontend/app`: `npm run build`

### 진행 메모 (2026.04.06 - 승인 대기/세션 복구)
- [x] 포털 인증 상태 API를 추가해 `approved / pending` 상태와 관리자 여부를 함께 내려주도록 정리했다.
- [x] 미승인 의료진은 로그인 직후 `승인 대기` 화면으로 보내고, 승인 전에는 상담 목록과 답변 기능에 접근하지 못하게 막았다.
- [x] 대표자는 포털 상단의 `승인 대기 중인 의료진` 목록에서 바로 승인할 수 있게 했다.
- [x] `PORTAL_ADMIN_EMAILS` 환경변수가 있으면 그 이메일을 대표자(admin)로 사용하고, 없으면 `ALLOWED_DOCTOR_EMAILS`가 1개일 때만 자동 대표자로 간주한다.
- [x] 웹 상담 시작 폼은 1시간 동안 임시 입력 초안을 브라우저에 저장해 새로고침 후 복구할 수 있게 했다.
- [x] 웹 상담 제출 후에는 최근 상담 세션(상태 조회 코드/링크)을 1시간 저장해 `/status`에서 자동 복구할 수 있게 했다.

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

## 단계 47: 의료진 알림 흐름 정리 (2026.04.05)

### 목표
- [ ] 자동 해결된 경증 상담의 F/U는 의료진 큐로 보내지 않고, 의사 대응이 필요한 상담만 의료진방 알림 대상으로 남긴다.
- [ ] 의사 대응이 필요한 F/U 상담은 답변 전까지 15분 간격으로 의료진방에 다시 알린다.
- [ ] MessengerBotR이 실제 의료진방을 서버에 등록해 즉시 푸시가 그 방으로 가도록 하드코딩 의존도를 낮춘다.
- [ ] `~차트확인`은 자동 푸시 보조 수단으로만 동작하게 하고, 예전처럼 한꺼번에 밀린 알림을 과도하게 쏟아내지 않게 정리한다.

### 검증
- [x] `backend`: 라우트/서비스 로드 확인
- [ ] 운영 리허설 수준에서 `requiresDoctorReview: true` 상담이 즉시 의료진 큐로 들어가는지 확인
- [ ] 경증 자동 해결 상담은 15분 뒤 의료진 큐에 쌓이지 않는지 확인
- [ ] `public` 웹 상담 생성 경로도 같은 규칙(응급 즉시 푸시, 경증 의료진 미알림)을 타는지 확인

### 결과 메모
- [x] `notifyService`, `followUpService`, `kakaoWebhook`, `messengerBot`, `portal`, `public` 라우트/서비스 로드를 로컬에서 함께 확인했다.
- [x] 카카오 상담 경로뿐 아니라 `public` 웹 상담 생성 경로도 동일한 의료진 알림/F/U 규칙을 타도록 코드 정리를 마쳤다.

## 단계 48: 카카오 인앱 브라우저 포털 열기 보완 (2026.04.05)

### 목표
- [ ] `portal.happydoctor.kr/open-browser`가 카카오 인앱 브라우저에서 더 보수적으로 외부 브라우저 열기를 시도하도록 보완한다.
- [ ] Android에서는 크롬 intent와 일반 외부 브라우저 열기 둘 다 제공해 Google 로그인 차단을 줄인다.

### 검증
- [x] `frontend/portal`: `npm run build`
- [ ] `open-browser` 경로에서 외부 브라우저 유도 버튼/문구가 정상 렌더되는지 확인

### 결과 메모
- [x] 카카오 인앱 브라우저 감지를 더 보수적으로 바꾸고, Android에서는 크롬 intent와 일반 외부 브라우저 열기를 순차 시도하도록 보완했다.
- [x] 라이브 `portal.happydoctor.kr/open-browser`에서 기본 브라우저 유도 문구가 반영된 HTML 응답을 확인했다.

## 단계 49: MessengerBotR 명령 분기 안정화 (2026.04.06)

### 목표
- [ ] `~알림방등록`, `~차트확인` 같은 운영 명령이 한글 문자열 인코딩 차이와 무관하게 서버에서 안정적으로 동작하게 한다.
- [ ] 메신저봇 스크립트가 서버로는 ASCII command 키를 보내고, 서버는 그 키를 우선 분기하도록 맞춘다.

### 검증
- [ ] `backend`: `/api/messengerbot`에 `command=register_doctor_room` 요청 시 등록 응답이 오는지 확인
- [ ] `backend`: `/api/messengerbot`에 `command=confirm_doctor_notifications` 요청 시 수동 조회 응답이 오는지 확인

## 단계 50: 의료진 알림 유실 방지 (2026.04.06)

### 목표
- [ ] 의료진 알림이 공기계 폴링 시점에 바로 사라지지 않고, 카카오 전송 성공 후에만 최종 소비되도록 바꾼다.
- [ ] 자동 푸시는 포털 확인용 간결한 요약 문구로 보내고, 상세 차트는 수동 조회/포털에서 보게 해 카카오 전송 실패 가능성을 줄인다.

### 검증
- [x] `backend`: 라우트/서비스 로드 확인
- [ ] `/api/messengerbot/poll` 호출 시 `notificationId`가 내려오는지 확인
- [ ] `/api/messengerbot/poll/ack` 호출 시 알림 ack가 성공하는지 확인

### 결과 메모
- [x] `notifyService`와 `messengerBot` 라우트가 로컬에서 정상 로드됐고, doctor notification claim/ack 경로를 코드 수준에서 연결했다.

## 다음 세션 우선순위

- [ ] 공기계 MessengerBotR에 최신 [messengerbot_script.js](C:/SJ/antigravity/happydoctor/backend/messengerbot_script.js)를 반영한다.
- [ ] `2기 행복한 의사 의료봉사방`에서 `~알림방등록`을 보내 실제 의료진 알림방 등록을 완료한다.
- [ ] 응급/협진 테스트 상담 1건으로 자동 의료진 푸시가 즉시 도착하는지 운영 리허설을 다시 한다.
- [ ] 경증 자동 해결 상담 1건으로 15분 뒤 의료진방에 불필요한 F/U 알림이 가지 않는지 확인한다.

## 단계 51: 의료진 알림방 오등록/개인톡 fallback 차단 (2026.04.06)

### 목표
- [x] `~알림방등록` 명령이 MessengerBotR의 `isGroupChat` 판정에 의존하지 않고 현재 방 기준으로 안정적으로 등록되게 한다.
- [x] 의료진 알림 대상 방이 등록되지 않았을 때 개인톡 식별자로 fallback 되지 않도록 막는다.
- [x] 의료진 알림방 관련 운영자가 현재 등록 방을 확인할 수 있는 최소 진단 경로를 마련한다.

### 검증
- [x] `backend`: `routes/messengerBot` 와 `messengerbot_script.js` 로드 확인
- [x] 로컬 임시 서버에서 `register_doctor_room` 명령이 `isGroupChat=false`여도 성공하는지 확인
- [ ] 등록 방이 없을 때 `/api/messengerbot/poll` 결과를 스크립트가 개인톡이 아닌 안전한 미전달 상태로 처리하는지 확인

## 단계 52: 의료진 단톡방 재알림 주기 제한 (2026.04.06)

### 목표
- [ ] 의료진 단톡방 알림을 `즉시`, `5분`, `15분` 세 번으로만 보내고 그 이후 반복은 중단한다.
- [ ] 환자 follow-up 타이머와 의료진 재알림 타이머를 분리해, 환자 안내 주기 변경이 의료진 단톡방 알림에 섞이지 않게 한다.
- [ ] 의사 답변 또는 상담 종료 시 남아 있는 의료진 재알림을 취소한다.

### 검증
- [ ] `backend`: notify/follow-up/portal/public/kakao routes 로드 확인
- [ ] 로컬에서 의료진 알림 enqueue 시 0/5/15분 스케줄 문서가 생성되는지 확인
- [ ] 의사 답변 또는 상담 종료 호출 시 pending 의료진 재알림이 취소되는지 확인

### 진행 메모 (2026.04.06)
- [x] 의료진 알림을 환자 follow-up 타이머와 분리했다.
- [x] 의사 대응 필요 상담은 즉시 / 5분 / 15분 세 번만 알림 문서를 생성하도록 정리했다.
- [x] 의사 답변 전송 또는 상담 종료 시 남아 있는 의료진 알림을 취소하도록 연결했다.
- [x] backend/routes/kakaoWebhook.js, backend/routes/public.js, backend/routes/portal.js, backend/services/notifyService.js, backend/services/followUpService.js 구문 및 앱 로드를 확인했다.

## 단계 53: 환자 F/U 재질문 3회 제한 (2026.04.06)

### 목표
- [ ] 환자 follow-up 질문을 15분, 3시간, 1일 뒤 총 세 번만 보낸다.
- [ ] 환자가 응답하지 않아도 무한 반복되지 않게 한다.
- [ ] follow-up 응답 후에도 다음 질문 주기가 명확하게 유지되도록 정리한다.

### 검증
- [ ] follow-up 서비스 구문 및 앱 로드 확인
- [ ] 세 번 이후 추가 dueAt 이 생기지 않는지 확인
- [ ] F/U 응답 경로가 새 스케줄 구조와 충돌하지 않는지 확인

### 진행 메모 (2026.04.06 - 환자 F/U)
- [x] 환자 follow-up 기본 스케줄을 15분 / 3시간 / 1일 세 단계로 통일했다.
- [x] F/U 응답 라우트에서 임의의 15분·1시간 재스케줄을 제거했다.
- [x] follow-up 타이머가 환자 채널 푸시를 보내면서도 다음 dueAt 만 남기도록 정리했다.
- [x] 마지막 질문 뒤에는 추가 dueAt 없이 종료되도록 정리했다.

## 단계 54: 정식 오픈 최종 체크리스트 문서화 (2026.04.06)

### 목표
- [x] 해피닥터 정식 서비스 시작 전 확인해야 할 운영 체크리스트를 한글 문서로 정리한다.
- [x] 소프트 오픈 가능 기준과 대외 홍보 전 필수 확인 항목을 분리해 남긴다.
- [x] 장애 발생 시 즉시 확인할 경로와 롤백 판단 기준을 함께 적어 둔다.

### 검증
- [x] 문서가 `docs/` 아래에 생성되었는지 확인
- [x] 문서 안 링크와 경로가 현재 라이브 표면 기준과 일치하는지 확인

### 진행 메모 (2026.04.06 - 정식 오픈 체크리스트)
- [x] `docs/service_launch_checklist.md` 문서 생성
- [x] 홈페이지, 환자 앱, 포털, Render 확인 항목 분리
- [x] 운영 리허설 통과 기준과 오픈 보류 기준 정리

## 단계 55: 의료진 알림 몰림/중복 전송 방지 (2026.04.06)

### 목표
- [x] 같은 환자 기준으로 due 상태 의료진 알림이 여러 개 쌓여도 단톡방에는 최신 1개만 가도록 정리한다.
- [x] 기기 지연이나 lease 만료가 생겨도 5분/15분 알림이 한꺼번에 폭주하지 않게 한다.
- [x] `~차트확인` 수동 조회에서도 같은 환자 알림이 여러 건 연속 덤프되지 않게 한다.

### 검증
- [x] `backend/services/notifyService.js` 구문 확인
- [x] `backend/routes/messengerBot.js` 앱 로드 확인
- [x] 중복 due 알림 샘플에 대해 최신 1건만 남기는 정리 로직 확인

### 진행 메모 (2026.04.06 - 의료진 알림 몰림 방지)
- [x] due 알림 coalescing 로직 추가
- [x] superseded 상태 정리 추가
- [x] poll / 차트확인 경로에 같은 규칙 적용

## 단계 56: 의료진 알림 미리보기 범위 표기 보존 (2026.04.06)

### 목표
- [ ] 의료진 단톡방 미리보기에서 `40~59세`, `4~6/10점` 같은 범위 표기가 붙어서 깨지지 않게 한다.
- [ ] `~` 표시는 카카오 미리보기에서 읽기 쉽도록 `-`로 통일한다.

### 검증
- [ ] `backend/routes/messengerBot.js` 구문 확인
- [ ] 샘플 문자열 `40~59세`, `4~6/10점`이 `40-59세`, `4-6/10점`으로 유지되는지 확인

### 진행 메모 (2026.04.06 - 의료진 알림 미리보기)
- [ ] 미리보기 sanitize 규칙에서 `-` 보존
- [ ] `~` 를 `-` 로 치환

## 단계 57: 의료진 승인 경로/재알림 중복 방지 정리 (2026.04.06)

### 목표
- [ ] 새로 가입한 의료진을 현재 어떤 경로로 허가하는지 확인하고 운영자가 바로 따라할 수 있게 정리한다.
- [ ] 의료진 알림이 즉시/5분/15분 3회 규칙을 따르되, 같은 상담 세트가 중복 enqueue되어 알림이 몰리지 않게 막는다.
- [ ] 폴링 지연이나 lease 만료가 있어도 5분/15분 알림이 한꺼번에 단톡방으로 쏟아지지 않게 완충 로직을 보강한다.

### 검증
- [x] `backend`: 알림 enqueue/claim 관련 파일 구문 확인
- [x] `backend`: 동일 환자/동일 상담 세트를 여러 번 enqueue해도 active reminder set 이 1개로 유지되는지 확인
- [x] `backend`: 지연 상황에서 같은 상담의 due 알림 여러 개가 동시에 살아나도 한 번에 몰리지 않게 정리되는지 확인

### 진행 메모 (2026.04.06 - 의료진 승인/재알림)
- [x] 포털의 신규 의료진 허가는 현재 UI가 아니라 백엔드 허용 이메일 목록(`ALLOWED_DOCTOR_EMAILS`) 기준임을 확인했다.
- [x] 최신 triage 알림 문서를 직접 조회해 즉시/5분/15분 세 문서가 실제로 생성되고 모두 delivered 되는 것을 확인했다.
- [x] 의료진 재알림 enqueue 시 같은 환자·같은 유형의 최근 동일 세트를 건너뛰고, 남아 있는 active 세트는 새 세트로 교체하도록 정리했다.
- [x] claim/수동 확인 시 같은 세트의 due 알림이 여러 개면 지금 보낼 1건만 꺼내고 나머지는 미래 시각으로 defer 하도록 보강했다.

## 단계 58: 포털 탭 아이콘 브랜딩 정렬 (2026.04.06)

### 목표
- [x] `portal.happydoctor.kr` 브라우저 탭 아이콘이 홈페이지처럼 크게 보이도록 해피닥터 브랜드 아이콘으로 통일한다.
- [x] 포털 메타 아이콘 경로를 명시해 기본 favicon이나 작은 템플릿 아이콘이 우선되지 않게 한다.

### 검증
- [x] `frontend/portal`: `npm run build`
- [x] 포털 레이아웃 metadata에 `/icon.png`가 연결됐는지 확인

### 진행 메모 (2026.04.06 - 포털 아이콘)
- [x] 홈페이지 `app/icon.png`를 포털 `app/icon.png`로 복사했다.
- [x] 포털 metadata `icons`를 명시적으로 추가했다.
- [x] 기존 `app/favicon.ico`가 우선 적용되던 원인을 확인하고 제거했다.
- [x] 브라우저 파비콘 캐시를 끊기 위해 포털 아이콘 파일 경로를 `portal-favicon.png`로 변경했다.

## 다음 세션 우선순위 (2026.04.08)

- [ ] Render 백엔드에 `FIREBASE_STORAGE_BUCKET` 환경변수 추가
- [ ] 환자 앱 `/status`에서 사진 업로드 라이브 테스트
- [ ] 포털 상세 화면에서 업로드 이미지 표시 확인
- [ ] 웹앱 동영상 업로드 1차 설계 시작
- [ ] 카카오 상담에서 사진 첨부 경로 연결 방식 정리

## 단계 59: 매니저용 해피닥터 소개 브리프 작성 (2026.04.07)

### 목표
- [x] 해피닥터가 어떤 의의에서 시작된 단체인지 한눈에 설명하는 소개 문서를 만든다.
- [x] 지금까지의 주요 사업, 협력, 운영 성과를 대외 커뮤니케이션 관점에서 정리한다.
- [x] 현재 서비스가 어느 단계에 와 있는지 최신 내부 문서와 라이브 상태 기준으로 정리한다.

### 검증
- [x] `README.md`, `docs/project_plan.md`, `docs/service_launch_checklist.md`, `docs/session_handoff_2026-04-07.md`를 근거로 서술했는지 확인
- [x] 홈페이지 소스와 라이브 백엔드 통계(`/api/stats`, `/api/version`) 기준 최신 수치를 반영했는지 확인
- [x] 문서가 언론/SNS/매니저 공유용으로 바로 읽히는 톤과 구조인지 확인

### 진행 메모 (2026.04.07 - 매니저 브리프)
- [x] 설립 배경, 대상, 비영리 성격 정리
- [x] 주요 사업 및 연혁 요약
- [x] 현재 단계 및 남은 관문 정리
- [x] 짧은 소개 문구까지 포함

### 리뷰
- [x] 결과 문서: `docs/happydoctor_manager_brief.md`
- [x] 라이브 통계 확인: `/api/stats` 응답 `total=382`, `doctorReplied=326`
- [x] 라이브 버전 확인: `/api/version` 응답 기준 2026-04-07 리비전 정상 응답
- [x] 현재 단계 표현은 “정식 홍보 직전 운영 안정화 단계”로 정리

## 단계 60: 해피닥터 보도자료 초안 작성 (2026.04.07)

### 목표
- [x] 매니저 브리프를 바탕으로 언론 배포용 한국어 보도자료 초안을 만든다.
- [x] 과장 없이 현재 단계에 맞는 표현으로 제목, 리드, 본문, 단체 소개를 정리한다.
- [x] 해피닥터의 설립 취지, 협력 구조, 운영 현황, 현재 수치를 자연스럽게 녹인다.

### 검증
- [x] `docs/happydoctor_manager_brief.md`와 `docs/service_launch_checklist.md` 기준으로 톤과 단계 표현을 맞췄는지 확인
- [x] 라이브 통계(`/api/stats`)와 라이브 버전(`/api/version`) 확인 결과를 반영했는지 확인
- [x] “정식 병원” 또는 “대면진료 대체”로 오해될 표현이 없는지 확인

### 진행 메모 (2026.04.07 - 보도자료)
- [x] 제목/부제 초안 작성
- [x] 리드 문단 작성
- [x] 본문 구조화
- [x] 단체 소개 문안 정리

### 리뷰
- [x] 결과 문서: `docs/happydoctor_press_release_draft.md`
- [x] 표현 톤은 “정식 출시”보다 “운영 본격화/운영 안정화 단계” 중심으로 정리
- [x] 라이브 통계 확인: `/api/stats` 응답 `total=382`, `doctorReplied=326`
- [x] 라이브 버전 확인: `/api/version` 2026-04-07 정상 응답 확인

## 단계 61: 농아인협회 인사위원 위촉 반영 보도자료/워드 작성 (2026.04.07)

### 목표
- [x] 기존 보도자료 초안에 최석재 대표의 한국농아인협회 서울특별시협회 인사위원 위촉 사실을 반영한다.
- [x] 위촉일, 임기, 2026-04-06 위촉장 전달 및 차담 사실을 정확한 날짜로 반영한다.
- [x] 사진 자료를 포함한 Word 문서를 생성한다.

### 검증
- [x] 위촉 정보가 사용자 제공 내용과 사진 속 위촉장 정보에 맞는지 확인
- [x] 해피닥터의 기존 청각장애인 접근성 협력 맥락과 무리 없이 연결되는지 확인
- [x] `.docx` 파일이 실제로 생성되고 열 수 있는 형태인지 확인

### 진행 메모 (2026.04.07 - 농아인협회 위촉 보도자료)
- [x] 새 제목/부제 작성
- [x] 위촉 사실과 해피닥터 사업 내용을 통합한 본문 작성
- [x] 삽입 가능한 사진 자산 정리
- [x] 워드 파일 생성

### 리뷰
- [x] 결과 원문: `docs/happydoctor_press_release_deaf_committee_draft.md`
- [x] 결과 워드: `docs/happydoctor_press_release_deaf_committee_2026-04-07.docx`
- [x] 이미지 자산: 사용자 제공 위촉장 이미지 마스킹본 + 기존 `lecture-deaf.jpg`
- [x] `.docx` 내부 media 확인: `word/media/image1.png`, `word/media/image2.jpg`

## 단계 62: 원본 사진 4장 반영 최종 보도자료 재생성 (2026.04.07)

### 목표
- [x] 다운로드 폴더 원본 사진 4장을 모두 반영한 최종 보도자료를 만든다.
- [x] 사용자가 민감정보 삭제가 필요 없다고 확인한 사항을 반영해 마스킹 없이 원본을 사용한다.
- [x] 최종 Word 문서를 다시 생성한다.

### 검증
- [x] `C:\Users\user\Downloads\260406서울시농아인협회인사위원위촉1.jpg`
- [x] `C:\Users\user\Downloads\260406서울시농아인협회인사위원위촉2.jpg`
- [x] `C:\Users\user\Downloads\260406서울시농아인협회인사위원위촉3.jpg`
- [x] `C:\Users\user\Downloads\260406서울시농아인협회인사위원위촉장.jpg`
- [x] 최종 `.docx` 안에 사진 4장이 들어갔는지 확인

### 진행 메모 (2026.04.07 - 원본 사진 반영)
- [x] 문서 사진 섹션 교체
- [x] Word 생성 스크립트 수정
- [x] 최종 Word 재생성

### 리뷰
- [x] 최종 원문: `docs/happydoctor_press_release_deaf_committee_draft.md`
- [x] 최종 워드: `docs/happydoctor_press_release_deaf_committee_2026-04-07.docx`
- [x] 원본 사진 4장 복사본 생성: `docs/assets/deaf_committee_photo1.jpg`, `docs/assets/deaf_committee_photo2.jpg`, `docs/assets/deaf_committee_certificate.jpg`, `docs/assets/deaf_committee_photo3.jpg`
- [x] `.docx` 내부 media 확인: `image1.jpg`, `image2.jpg`, `image3.jpg`, `image4.jpg`

## 단계 63: 배포용 최종 문안 및 언론사 메일 초안 작성 (2026.04.07)

### 목표
- [x] 보도자료를 실제 배포용 톤으로 한 번 더 다듬는다.
- [x] 최종 Word 파일도 같은 문안 기준으로 다시 만든다.
- [x] 언론사 메일 제목/본문 초안을 함께 만든다.

### 검증
- [x] 보도자료 final 원문 생성
- [x] final 기준 `.docx` 생성
- [x] 언론사 메일 초안 문서 생성
- [x] 기존 수치와 날짜가 그대로 유지되는지 확인

### 진행 메모 (2026.04.07 - 배포 직전 다듬기)
- [x] 제목/리드 압축
- [x] 문단 흐름 정리
- [x] 메일 제목 옵션 작성
- [x] 메일 본문 작성

### 리뷰
- [x] final 원문: `docs/happydoctor_press_release_deaf_committee_final.md`
- [x] final 워드: `docs/happydoctor_press_release_deaf_committee_final_2026-04-07.docx`
- [x] 메일 초안: `docs/happydoctor_press_email_draft.md`
- [x] final `.docx` 내부 media 확인: 사진 4장 포함

## 단계 64: 비공개 정보 제거 및 협력 중심 공개본 재작성 (2026.04.07)

### 목표
- [x] 비공개 요청에 따라 인사위원/위촉 관련 공개 문구를 모두 제거한다.
- [x] 보도자료와 메일 초안을 단체 간 협력 중심으로 다시 쓴다.
- [x] 위촉장 단독 사진은 제외하고, 현장 사진의 문서 노출 부분만 블러 처리한 공개용 자산으로 교체한다.

### 검증
- [x] `docs/*.md` 기준 `인사위원`, `위촉`, `위촉장` 공개 문구 제거 확인
- [x] 최종 `.docx` 2종 모두 사진 3장 포함 확인
- [x] `docs/assets`에는 공개용 블러 사진 3장만 남겨둠

### 진행 메모 (2026.04.07 - 공개본 재작성)
- [x] 보도자료 제목/리드/본문을 협력 논의 중심으로 재작성
- [x] 메일 제목/본문 초안 재작성
- [x] 공개용 블러 사진 생성
- [x] 기존 중간 자산 정리

### 리뷰
- [x] 공개용 draft: `docs/happydoctor_press_release_deaf_committee_draft.md`
- [x] 공개용 final: `docs/happydoctor_press_release_deaf_committee_final.md`
- [x] 공개용 메일 초안: `docs/happydoctor_press_email_draft.md`
- [x] 공개용 사진: `docs/assets/deaf_collab_public1.jpg`, `docs/assets/deaf_collab_public2.jpg`, `docs/assets/deaf_collab_public3.jpg`

## 단계 65: 사용자 수정본 사진 반영 재생성 (2026.04.07)

### 목표
- [x] 사용자가 다시 수정해 전달한 공개용 사진 3장을 기준으로 보도자료 자산을 교체한다.
- [x] Word 생성 스크립트가 이전 자동 블러 규칙이 아니라 사용자 수정본 사진을 그대로 반영하도록 정리한다.
- [x] 보도자료 문안의 사진 처리 메모를 현재 자산 기준으로 갱신한다.

### 검증
- [x] `docs/assets/deaf_collab_public1.jpg`, `docs/assets/deaf_collab_public2.jpg`, `docs/assets/deaf_collab_public3.jpg` 재생성
- [x] `docs/happydoctor_press_release_deaf_committee_2026-04-07.docx` 재생성
- [x] `docs/happydoctor_press_release_deaf_committee_final_2026-04-07.docx` 재생성
- [x] `.docx` 이미지 개수와 비공개 표현 미포함 여부 재확인

### 진행 메모 (2026.04.07 - 수정본 사진 반영)
- [x] `scripts/generate_press_release_docx.py`에서 자동 블러 처리 제거
- [x] 보도자료 draft/final의 작성 기준을 `사용자 제공 수정본 사진 3장 사용`으로 갱신

### 리뷰
- [x] 공개용 사진 3장 재생성 시각: 2026-04-07 13:51
- [x] draft `.docx` 재생성 완료: `docs/happydoctor_press_release_deaf_committee_2026-04-07.docx`
- [x] final `.docx` 재생성 완료: `docs/happydoctor_press_release_deaf_committee_final_2026-04-07.docx`
- [x] 보도자료/메일 문서 기준 `인사위원`, `위촉`, `위촉장`, `블러 처리` 검색 결과 없음

## 단계 66: 공식 단체명 반영 (2026.04.07)

### 목표
- [x] 보도자료 문안의 단체 표기를 공식 명칭 `행복한 의사 Happy Doctor`로 통일한다.
- [x] 언론사 메일 초안의 단체 표기도 같은 기준으로 정리한다.
- [x] 공식 명칭 반영본 기준으로 워드 파일을 다시 생성한다.

### 검증
- [x] `docs/happydoctor_press_release_deaf_committee_draft.md`와 `docs/happydoctor_press_release_deaf_committee_final.md`에서 공식 명칭 반영 확인
- [x] `docs/happydoctor_press_email_draft.md`에서 공식 명칭 반영 확인
- [x] `docs/happydoctor_press_release_deaf_committee_2026-04-07.docx` 재생성
- [x] `docs/happydoctor_press_release_deaf_committee_final_2026-04-07.docx` 재생성

### 진행 메모 (2026.04.07 - 공식명 반영)
- [x] 제목, 부제, 리드, 본문, 단체 소개의 단체명 통일
- [x] 메일 제목 후보와 본문 단체명 통일

### 리뷰
- [x] 보도자료 title/subtitle/lead 첫 표기 모두 `행복한 의사 Happy Doctor` 반영
- [x] 메일 초안 제목 후보와 본문 첫 문단 반영
- [x] 워드 2종 재생성 완료 시각: 2026-04-07 14:29

## 단계 67: 환자 상태 조회 프록시 복구 및 사진 업로드 1차 점검 (2026.04.08)

### 목표
- [x] 환자 웹앱 상태 화면이 브라우저에서 직접 Render 백엔드를 조회하다 실패하는 문제를 복구한다.
- [x] 상태 조회를 앱 내부 API 프록시 경로로 통일해 사진 업로더가 실제로 렌더되도록 만든다.
- [x] 라이브 사진 업로드 엔드포인트의 현재 실패 여부를 1차 확인한다.

### 검증
- [x] `frontend/app`: `npm run build`
- [x] 새 라우트 `app/api/public/consultations/status/[lookup]` 생성 확인
- [x] `frontend/app/lib/status.ts`가 앱 내부 `/api/public/consultations/status/:lookup` 경로를 사용하도록 반영 확인
- [x] 라이브 백엔드 `GET /api/public/consultations/status/TXN3TV` 정상 응답 확인
- [x] 라이브 백엔드 `POST /api/public/consultations/status/TXN3TV/images` 1차 호출 결과 generic 저장 오류 확인

### 진행 메모 (2026.04.08 - 상태/사진 점검)
- [x] 상태 조회 CORS 원인 확인: Render 응답 헤더에 `Access-Control-Allow-Origin` 없음
- [x] 생성/종료/이미지와 동일한 패턴의 상태 조회 프록시 라우트 추가
- [x] 상태 조회 클라이언트 fetch를 직접 백엔드 호출에서 앱 프록시 호출로 변경

### 리뷰
- [x] 상태 화면 에러 문구는 백엔드 미응답이 아니라 브라우저 직접 호출 경로 문제였음
- [x] 프런트 수정 후 빌드는 통과했지만, 라이브 반영 전까지 실제 앱 화면은 기존과 동일함
- [x] 사진 저장은 별도로 Firebase Storage 설정/권한 또는 버킷 설정 점검이 추가 필요함

## 단계 68: 의료진 알림방 오발송 및 중복 전송 차단 (2026.04.08)

### 목표
- [x] 운영위원회 방이 의료진 알림방으로 등록되거나 상담 내용을 받지 못하도록 서버에서 차단한다.
- [x] 개인톡을 의료진 알림방으로 등록하지 못하게 하고, 스크립트의 개인톡 fallback 경로를 제거한다.
- [x] 여러 MessengerBotR 인스턴스가 같은 pending 알림을 동시에 가져가 중복 발송하는 경쟁 상태를 줄인다.

### 검증
- [x] `backend/services/notifyService.js`: `node --check`
- [x] `backend/routes/messengerBot.js`: `node --check`
- [x] `backend/messengerbot_script.js`: `node --check`
- [x] `notifyService.__test__.validateDoctorRoomCandidate()`로 운영위 차단 / 개인톡 차단 / 의료진 단톡방 허용 / group flag 누락 차단 확인

### 진행 메모 (2026.04.08 - 알림 라우팅 수정)
- [x] 의료진 알림방 등록 시 `kind`, `isGroupChat`, `registeredBy` 메타데이터를 함께 저장하도록 변경
- [x] 기존 legacy doctor room 문서는 재등록 전까지 유효하지 않게 처리
- [x] `~차트확인`은 등록된 의료진 알림방에서만 사용 가능하도록 제한
- [x] `/api/messengerbot/poll`은 유효한 의료진 알림방이 없으면 claim 자체를 하지 않도록 변경
- [x] 의료진 알림 claim과 환자 채널 push dequeue를 Firestore transaction 기반으로 바꿔 동시 폴링 중복을 줄임

### 리뷰
- [x] 운영위원회 방 오발송 원인은 잘못 저장된 doctor room 값과 방 검증 부재가 결합된 문제였음
- [x] 개인톡 다중 발송은 stale 스크립트 fallback 가능성과 함께 non-atomic queue claim 구조가 중복을 키우는 원인이었음
- [x] 실제 운영 반영에는 백엔드 배포와 공기계 MessengerBotR 스크립트 업데이트, 의료진 단톡방에서 `~알림방등록` 재실행이 필요함

## 단계 69: 상태 조회 프록시 라이브 배포 및 재검증 (2026.04.08)

### 목표
- [x] 상태 조회 프록시 코드가 로컬 빌드에만 있고 라이브 앱에는 반영되지 않은 상태를 바로잡는다.
- [x] `app.happydoctor.kr`의 상태 조회 API가 실제로 `404`가 아닌 `200`으로 응답하도록 앱 프로젝트를 프로덕션 배포한다.
- [x] 로컬 빌드 통과와 별개로 라이브 앱 도메인 기준 재검증 절차를 남긴다.

### 검증
- [x] `frontend/app`: `npm run build`
- [x] 로컬 빌드 산출물에 `/api/public/consultations/status/[lookup]` 포함 확인
- [x] 배포 전 `https://app.happydoctor.kr/api/public/consultations/status/TXN3TV` 가 `404`였음을 확인
- [x] `npx vercel --prod --yes` 로 `happydoctor-app` 프로덕션 배포
- [x] 배포 후 `https://app.happydoctor.kr/api/public/consultations/status/TXN3TV` 가 `200`으로 응답하는 것 확인

### 진행 메모 (2026.04.08 - 상태 조회 라이브 반영)
- [x] 원인 재확인: Render 백엔드는 정상 응답했지만 앱 도메인 프록시 라우트가 라이브 배포본에 없어서 상태 화면이 계속 실패함
- [x] `frontend/app/.vercel/project.json` 기준 앱 프로젝트 식별
- [x] 저장소 루트가 포털 프로젝트에 링크되어 있어 앱 프로젝트 링크를 임시 전환해 배포 후 원복

### 리뷰
- [x] “코드는 고쳤지만 라이브가 아직 안 바뀐 상태”였고, 사용자 화면 에러는 그 미반영 상태를 그대로 보여준 것
- [x] 상태 조회 문제는 이제 라이브 앱 도메인 기준으로도 API 응답이 정상화됨

## 단계 70: 사진 업로드 복구 및 답변 후속 흐름 확장 (2026.04.08)

### 목표
- [ ] Firebase Storage 버킷 해석과 업로드 경로를 점검해 사진 저장 실패를 복구한다.
- [ ] 웹 상담 시작 화면에서도 사진 1~3장을 함께 받을 수 있게 만든다.
- [ ] 카카오 상담의 `symptom_image`를 상담 미디어로 저장해 포털/상태 화면에서 이어서 볼 수 있게 만든다.
- [ ] 상태 화면이 의료진 답변을 주기적으로 확인하고, 답변 뒤에는 `추가 질문하기`를 같은 상담 흐름 안에서 제공한다.
- [ ] 환자 채널 답변 전달 폴링 간격을 실시간에 가깝게 줄인다.

### 검증
- [ ] `backend`: `node --check services/dbService.js`
- [ ] `backend`: `node --check routes/public.js`
- [ ] `backend`: `node --check routes/kakaoWebhook.js`
- [ ] `backend`: `node --check messengerbot_script.js`
- [ ] `frontend/app`: `npm run build`
- [ ] `frontend/portal`: `npm run build`
- [ ] 로컬/라이브 업로드 및 상태 갱신 흐름 재확인
### 진행 메모 (2026.04.08 - 사진/후속 흐름 확장)
- [x] `dbService.js`에 Firebase Storage 버킷 후보 탐색과 `firebasestorage.app` fallback, 외부 이미지 저장 경로를 추가했다.
- [x] `public.js`에 첫 상담 화면 multipart 업로드와 `status/:lookup/follow-up` 추가 질문 라우트를 연결했다.
- [x] `kakaoWebhook.js`에서 `symptom_image`를 상담 `mediaItems`에도 저장하도록 연결했다.
- [x] `WebConsultationStartForm.tsx`에 첫 화면 이미지 업로드를 붙이고 JSON 제출을 multipart 제출로 바꿨다.
- [x] `StatusPageClient.tsx`에 15초 주기 실시간 새로고침, 포커스 복귀 갱신, 새 의료진 답변 배너를 추가했다.
- [x] `StatusCloseActions.tsx`에 답변 후 추가 질문하기 흐름을 추가했다.
- [x] `messengerbot_script.js` 환자 알림 폴링 간격을 5분에서 20초로 줄였다.

### 리뷰
- [x] `backend/services/dbService.js`: `node --check`
- [x] `backend/routes/public.js`: `node --check`
- [x] `backend/routes/kakaoWebhook.js`: `node --check`
- [x] `backend/messengerbot_script.js`: `node --check`
- [x] `backend/services/notifyService.js`: `node --check`
- [x] `backend/routes/messengerBot.js`: `node --check`
- [x] `frontend/app`: `npm run build`
- [x] `frontend/portal`: `npm run build`
- [x] 라이브 API 기준 사진 업로드 생성/조회/서명 URL/종료/정리까지 확인
- [ ] Render 최신 리비전 반영과 포털 인증 화면 시각 검증은 아직 남음
- [x] Stage 75 public status flow regression fix shipped on 2026-04-09
  - Restored the initial Bodeum reply on the status page by persisting `replyToPatient` in the active web consultation session and exposing `chatbotReply` from the public status API.
  - Kept the Bodeum reply card above the waiting-doctor status card, including the first redirected load before the status payload finishes loading.
  - Moved the `상담 상태를 불러오고 있습니다...` notice to the bottom of the page and throttled background refresh notices to once per minute.
  - Verification: `frontend/app npm run lint`, `frontend/app npm run build`, `backend node --check services/dbService.js`.
  - Deployment: `happydoctor-8d8ny2x38-csj3814-8131s-projects.vercel.app` promoted and aliased to `app.happydoctor.kr`.
- [x] Stage 76 public status doctor-reply prioritization (2026-04-09)
  - Moved the doctor reply card and next-action card directly under the reply-arrived state so they appear before the Bodeum first-reply summary.
  - Kept the lower sections for images, metadata, and informational follow-up content.
  - Verification: `frontend/app npm run lint`, `frontend/app npm run build`.
- [x] Stage 77 mobile landing-page wrap cleanup (2026-04-09)
  - Cleaned up awkward two-line wraps on the app landing page for the mobile hero header, headline, and CTA labels.
  - Made the top action button and hero CTAs keep intentional single-line labels on small screens.
  - Verification: `frontend/app npm run lint`, `frontend/app npm run build`.
- [x] Stage 78 mobile mockup sizing and install CTA polish (2026-04-09)
  - Shorten the decorative phone shell on small screens so it supports the hero instead of dominating the page height.
  - Add a real PWA install button inside the install-guide card, with graceful fallback guidance when the browser does not expose an install prompt.
  - Verification: `frontend/app npm run lint`, `frontend/app npm run build`, `Invoke-WebRequest https://app.happydoctor.kr/` install-button check.
  - Deployment: `happydoctor-fmshvoxwm-csj3814-8131s-projects.vercel.app` promoted and aliased to `app.happydoctor.kr`.
- [x] Stage 79 landing mockup microcopy polish (2026-04-09)
  - Change the first phone-mockup step from `증상과 걱정을 먼저 보냅니다.` to the more concrete `증상과 궁금한 점을 먼저 남깁니다.`
  - Verification: `frontend/app npm run lint`, `Invoke-WebRequest https://app.happydoctor.kr/` updated-microcopy check.
  - Deployment: `happydoctor-429b01itl-csj3814-8131s-projects.vercel.app` promoted and aliased to `app.happydoctor.kr`.
- [x] Stage 80 landing install language cleanup (2026-04-09)
  - Replace technical `PWA` wording with user-facing `앱` wording in the install card and button.
  - Align the first 상담 흐름 step copy so the mockup card and the timeline section do not disagree.
  - Review nearby landing-page copy for other user-facing wording that is awkward or incomplete, then report the recommended follow-up edits.
  - Verification: `frontend/app npm run lint`, `Invoke-WebRequest https://app.happydoctor.kr/` install-label and updated-copy checks.
  - Deployment: `happydoctor-gnka3j5ht-csj3814-8131s-projects.vercel.app` promoted and aliased to `app.happydoctor.kr`.
- [x] Stage 81 landing CTA copy polish (2026-04-09)
  - Change the install heading to clearer home-screen language.
  - Simplify the iPhone install tip into a direct action sentence.
  - Replace the final CTA heading with a more concrete `방법`-based phrase.
  - Verification: `frontend/app npm run lint`, `Invoke-WebRequest https://app.happydoctor.kr/` CTA-copy checks.
  - Deployment: `happydoctor-cpoyqo71w-csj3814-8131s-projects.vercel.app` promoted and aliased to `app.happydoctor.kr`.
- [x] Stage 82 durable follow-up scheduler (2026-04-09)
  - Replace the in-memory `setTimeout` follow-up scheduler with a Firestore lease/claim loop so restarts and multi-instance deploys do not double-send or lose due reminders.
  - Store follow-up lease metadata on `follow_up_sessions` and reclaim expired leases before processing.
  - Keep patient follow-up push delivery behavior unchanged while making scheduling durable.
  - Verification: `backend node --check services/dbService.js`, `backend node --check services/followUpService.js`, `backend node --check index.js`, `backend node -e "require('./services/dbService'); require('./services/followUpService'); require('./routes/public'); require('./routes/kakaoWebhook'); require('./routes/portal'); require('./routes/messengerBot'); console.log('backend-load-ok');"`.
  - Deployment: Render `/api/version` updated to `c368bedd8b7f89a12e534bc25a10e94e2cffe7bd`.
