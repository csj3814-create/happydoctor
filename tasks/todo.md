# Happy Doctor Project - Tasks

## 2026-07-13
- [x] Stage 126 대표 소개 최신 소속 반영
  - 공개 홈페이지 대표 소개에 `가톨릭대학교 여의도성모병원 응급의학과 진료교수`를 추가한다.
  - 기존 대표 역할·저서·방송·SNS와 상단 다국어 링크 변경은 그대로 보존한다.
  - Verification: `frontend/homepage npm run verify:ci`, 로컬 대표 소개 렌더 확인.
  - Result: 이름 아래 직함과 `현직` 목록 첫 항목에 최신 소속을 반영했다.
  - Result: `frontend/homepage npm run verify:ci`가 통과했고, `http://127.0.0.1:3101/ko` 대표 소개에서 직함·공저 표기·기존 링크 배치를 확인했다.

## 2026-06-14 review
- [x] Stage 125 대표 개인 알림방 우선 의료진 알림 모드
  - Problem: MessengerBotR cannot safely distinguish the intended 2nd medical volunteer group because the room is reported as `가족-최석재`, so group delivery is unsafe for now.
  - Fix: route new doctor notification poll responses to the registered operator personal alert room first; only fall back to the doctor group room if no personal alert room is registered.
  - Fix: remove the ambiguous `가족-최석재` alias from the trusted doctor group allowlist so it cannot be used as a group fallback destination.
  - Verification: `backend npm run verify:ci`, then deploy and confirm live `/api/version`.
  - Result: `backend npm run verify:ci` passed with 50 tests.
  - Result: Render `/api/version` advanced to `d3379aba43c2a9affdb16c89e1214b48470f44f4`.

## 2026-06-13 review (continued 2)
- [x] Stage 124 MessengerBotR internal room alias for 2nd volunteer group
  - Problem: the user confirmed the actual 2nd medical volunteer Kakao group is reported by MessengerBotR as `가족-최석재`, so the backend still rejects `~알림방등록` as a non-group room.
  - Fix: allow only this exact internal room alias as a trusted doctor-room candidate, while keeping public emergency consultation rooms blocked.
  - Verification: `backend npm run verify:ci`, then deploy and confirm live `/api/version`.
  - Result: `backend npm run verify:ci` passed with 49 tests.
  - Result: Render `/api/version` advanced to `a4c0c55a56b28a48bfe12829df1761d2daff2657`.

## 2026-06-13 review (continued)
- [x] Stage 123 의료봉사방 알림방 등록 재실패 보강
  - Problem: the 2nd medical volunteer Kakao group still receives `GROUP_CHAT_REQUIRED`, which means the live request is probably arriving with a room title that differs from the full visible title or is being treated as non-group by MessengerBotR.
  - Fix: allow the narrow `2기 행복한 의사 의료...` room-title family as a trusted doctor group fallback while continuing to block public emergency consultation rooms.
  - Fix: make registration failure replies include the room name received by the server so the next diagnosis does not rely on the Kakao UI title.
  - Verification: `backend npm run verify:ci`, then deploy and confirm live `/api/version`.
  - Result: `backend npm run verify:ci` passed with 48 tests.
  - Result: Render `/api/version` advanced to `45c88a16f67b88dbd24ff447151a10b175427141`.

## 2026-06-13 review
- [x] Stage 122 의료봉사방 알림방 등록 실패 보정
  - Problem: in the `2기 행복한 의사 의료봉사자` Kakao group, `~알림방등록` was rejected as a personal chat because MessengerBotR passed `isGroupChat=false`.
  - Fix: keep blocking public `응급상담방` rooms, but allow doctor-room registration when the room name clearly contains `의료봉사` or `의료봉사자`.
  - Verification: `backend npm run verify:ci`, Render revision check after deploy.
  - Result: `validateDoctorRoomCandidate()` now accepts trusted medical volunteer room names even when the Kakao group flag is false, while blocked public emergency consultation rooms still return `BLOCKED_ROOM`.
  - Result: added a regression test for the `2기 행복한 의사 의료봉사자` room-name path.
  - Result: Render `/api/version` advanced to `9222e09294c539c95c850d7ffd5c9d908eda0c67`.

## 2026-06-05 review (continued)
- [x] Stage 121 의료진 알림방과 대표 개인 후속 알림방 분리
  - Problem: the operator unanswered-alert test was delivered to the 95-member public emergency consultation room, which should not receive operational alerts.
  - Fix: remove the mistaken `messenger_rooms/operator_alerts -> 행복한의사` binding so delayed personal alerts cannot go to that public room.
  - Fix: add MessengerBotR support for `~개인알림등록` and `~개인알림확인` so the representative's real 1:1 room can be registered separately from the medical volunteer group.
  - Fix: block rooms containing `응급상담방` from being registered as the doctor alert room.
  - Verification: `backend npm run verify:ci`, Firestore registration check.
  - Result: 운영 Firestore에서 `messenger_rooms/operator_alerts` 문서를 삭제해 95명방으로 대표 후속 알림이 가는 경로를 차단했다.
  - Result: 현재 `delivery_rooms/doctor_room` 값은 의료봉사방 제목이 아니라 `최석재 진료교수...` 형태로 잡혀 있어 해당 문서도 삭제했다. 실제 의료봉사방에서 `~알림방등록`으로 재등록해야 한다.
  - Result: 대표 개인 알림은 MessengerBotR 스크립트 최신본 반영 후 대표 1:1 방에서 `~개인알림등록`을 보내 등록해야 다시 켜진다.

## 2026-06-05 review
- [x] Stage 120 개인 미답변 알림 한글 깨짐 원인 확인
  - Screenshot symptom: the operator alert test message appeared as question marks in Kakao.
  - Check whether the stored Firestore message was already corrupted by the Windows test script or whether the MessengerBotR delivery path corrupts Korean text.
  - Verification: inspect recent `patient_channel_pushes` message code points, enqueue one clean Korean test message without direct PowerShell Korean literals, and confirm it reaches `delivered`.
  - Result: the broken screenshot message was already stored in Firestore as literal `?` code points, so Kakao delivery only displayed what was stored.
  - Result: the real backend alert builder produced valid Korean code points, and a clean test alert was stored as Korean and reached `delivered` at `2026-06-04T20:04:00.134Z`.
  - Result: no production code change was needed for encoding; the issue was the manual Windows PowerShell test input method.

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
- [x] Render 서비스 Events를 다시 확인한다.
- [x] `Deploy latest commit` 또는 `Clear build cache & deploy`를 재시도한다.
- [x] `https://happydoctor.onrender.com/api/version`가 `eda0c36` 이상으로 올라왔는지 확인한다.
- [x] 환자 앱 `/status` 실제 브라우저 화면에서 사진 업로드 UI를 다시 확인한다.
- [x] 포털 상세 화면에서 같은 이미지가 보이는지 확인한다.
- [x] 필요하면 Render 환경변수 `FIREBASE_STORAGE_BUCKET` 값을 다시 점검한다.
- [x] 백엔드 반영 뒤 포털 `follow-up` 탭이 실제 데이터를 제대로 보여주는지 확인한다.

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
- [x] 2026-04-10 재배포 성공, 사진 업로드 정상, 포털 `follow-up` 데이터 확인 완료를 사용자 기준으로 재확인했다.
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
- [x] Stage 83 durable patient push delivery (2026-04-09)
  - Replace immediate `dequeue -> delivered` behavior for `patient_channel_pushes` with the same Firestore lease/ack semantics used by doctor notifications.
  - Add patient push reclaim/claim/ack helpers so follow-up reminders and portal reply pushes can retry safely after MessengerBot delivery failures or worker restarts.
  - Update MessengerBot poll routes and the MessengerBot R script so patient pushes acknowledge delivery success/failure explicitly instead of assuming success on dequeue.
  - Verification: `backend node --check services/notifyService.js`, `backend node --check routes/messengerBot.js`, `backend node --check messengerbot_script.js`, `backend node --check index.js`, `backend node -e "require('./services/dbService'); require('./services/followUpService'); require('./services/notifyService'); require('./routes/public'); require('./routes/kakaoWebhook'); require('./routes/portal'); require('./routes/messengerBot'); console.log('backend-load-ok');"`.
  - Deployment: Render `/api/version` updated to `fdd42c2c8913ffcc5de50fc00265b67a44c62261`.
- [x] Stage 84 backend patient-push tests (2026-04-09)
  - Add a real backend test entrypoint instead of relying only on ad hoc `test_fu*.js` scripts.
  - Cover patient push lease/ack semantics so pending -> leased -> delivered, failed ack retry, and expired lease reclaim behavior are locked down.
  - Keep the new test runner scoped to dedicated `backend/tests/*.test.js` files so old manual scripts do not start failing CI.
  - Verification: `backend npm test`, `backend node --check services/notifyService.js`, `backend node --check routes/messengerBot.js`, `backend node --check messengerbot_script.js`, `backend node --check index.js`, `backend node -e "require('./services/dbService'); require('./services/followUpService'); require('./services/notifyService'); require('./routes/public'); require('./routes/kakaoWebhook'); require('./routes/portal'); require('./routes/messengerBot'); console.log('backend-load-ok');"`.
  - Deployment: Render `/api/version` updated to `4cc12ab09cf15cd2ec36a304848cd4a3bd32b772`.
- [x] Stage 85 backend reliability test expansion (2026-04-09)
  - Extend the new queue test harness to doctor notifications so lease/ack retries and same-patient coalescing stay covered.
  - Add focused `followUpService` tests for durable due-session processing, successful queue handoff, and lease release on enqueue failure.
  - Keep the test runner scoped to dedicated `backend/tests/*.test.js` files and avoid touching the old manual scripts.
  - Verification: `backend npm test`, `backend node --check tests/notifyService.patientPush.test.js`, `backend node --check tests/followUpService.durableScheduler.test.js`, `backend node --check services/notifyService.js`, `backend node --check services/followUpService.js`, `backend node --check routes/messengerBot.js`, `backend node --check messengerbot_script.js`, `backend node --check index.js`, `backend node -e "require('./services/dbService'); require('./services/followUpService'); require('./services/notifyService'); require('./routes/public'); require('./routes/kakaoWebhook'); require('./routes/portal'); require('./routes/messengerBot'); console.log('backend-load-ok');"`.
  - Deployment: Render `/api/version` updated to `ef329c5309302ee0f7bf40a0808209bbcca275e7`.
- [x] Stage 86 backend route integration tests (2026-04-09)
  - Add thin Express integration tests for the public consultation status routes so follow-up and close flows verify both the HTTP contract and the cleanup side effects.
  - Add a portal reply integration test with mocked doctor auth so patient push message composition, follow-up cancellation, and doctor notification cleanup stay covered together.
  - Keep the tests inside `backend/tests/*.test.js` and reuse mocked module loading instead of adding another test dependency.
  - Verification: `backend npm test`, `backend node --check tests/publicPortal.routes.integration.test.js`, `backend node --check tests/notifyService.patientPush.test.js`, `backend node --check tests/followUpService.durableScheduler.test.js`, `backend node --check services/notifyService.js`, `backend node --check services/followUpService.js`, `backend node --check routes/public.js`, `backend node --check routes/portal.js`, `backend node --check routes/messengerBot.js`, `backend node --check messengerbot_script.js`, `backend node --check index.js`, `backend node -e "require('./services/dbService'); require('./services/followUpService'); require('./services/notifyService'); require('./routes/public'); require('./routes/kakaoWebhook'); require('./routes/portal'); require('./routes/messengerBot'); console.log('backend-load-ok');"`.
  - Deployment: Render `/api/version` updated to `a716254d7e040983d13756051ea319336871c9ae`.
- [x] Stage 87 messenger bot route integration tests (2026-04-09)
  - Add Express integration tests for `messengerBot` doctor poll/ack and patient push poll/ack endpoints with mocked notify service methods.
  - Verify API key enforcement and keep the route contract stable for the MessengerBot R script, including doctor-room gating and patient push alias endpoints.
  - Keep everything inside `backend/tests/*.test.js` with module mocks only; no new test dependency.
  - Verification: `backend npm test`, `backend node --check tests/messengerBot.routes.integration.test.js`, `backend node --check tests/publicPortal.routes.integration.test.js`, `backend node --check tests/notifyService.patientPush.test.js`, `backend node --check tests/followUpService.durableScheduler.test.js`, `backend node --check routes/messengerBot.js`, `backend node --check routes/public.js`, `backend node --check routes/portal.js`, `backend node --check services/notifyService.js`, `backend node --check services/followUpService.js`, `backend node --check messengerbot_script.js`, `backend node --check index.js`, `backend node -e "require('./services/dbService'); require('./services/followUpService'); require('./services/notifyService'); require('./routes/public'); require('./routes/kakaoWebhook'); require('./routes/portal'); require('./routes/messengerBot'); console.log('backend-load-ok');"`.
  - Deployment: Render `/api/version` updated to `482f752898822132269fdb72d5e5e3321edf51f0`.
- [x] Stage 88 backend CI automation (2026-04-09)
  - Add reusable backend verification scripts so the same checks run locally and in CI.
  - Add a GitHub Actions workflow that installs backend dependencies and runs the backend verification suite on push, pull request, and manual dispatch.
  - Keep the workflow narrow and deterministic: no deployment, just backend verification, and use Node 24-compatible GitHub Action majors to avoid runner deprecation warnings.
  - Verification: `backend npm run verify:ci`, inspect `.github/workflows/backend-ci.yml`.
- [x] Stage 89 frontend CI automation (2026-04-09)
  - Add reusable `verify:ci` scripts to the `frontend/app`, `frontend/portal`, and `frontend/homepage` workspaces so the same checks run locally and in CI.
  - Add a GitHub Actions workflow that installs dependencies and runs each frontend workspace in a separate matrix job on push, pull request, and manual dispatch.
  - Keep the workflow verification-only: lint/build checks, no deployment side effects.
  - Follow-up hardening: keep the portal workspace buildable even when CI does not inject Firebase public env vars, so static prerender does not fail before the runtime login screen loads.
  - Verification: `frontend/app npm run verify:ci`, `frontend/portal npm run verify:ci`, `frontend/homepage npm run verify:ci`, `frontend/portal npm run build` with Firebase env vars blanked, inspect `.github/workflows/frontend-ci.yml`.
- [x] Stage 90 CI path-filter tightening (2026-04-09)
  - Add `paths` filters to `backend-ci.yml` so backend verification runs only for backend changes or backend-workflow edits.
  - Add `paths` filters to `frontend-ci.yml` so frontend verification runs only for the three frontend workspaces or frontend-workflow edits.
  - Keep `workflow_dispatch` available so either workflow can still be run manually even when the filtered paths do not match.
  - Verification: inspect `.github/workflows/backend-ci.yml`, inspect `.github/workflows/frontend-ci.yml`, confirm the new GitHub Actions runs for the workflow-update commit succeed.
- [x] Stage 91 main-branch required checks (2026-04-09)
  - Protect `main` and require the live GitHub Actions checks `Backend Verify`, `Frontend Verify (app)`, `Frontend Verify (homepage)`, and `Frontend Verify (portal)`.
  - Leave admin enforcement off so repository admins can still use the current direct-maintenance workflow while non-admin contributors are gated by the required checks.
  - Keep the rule minimal: no pull-request review requirement, no extra history/lock restrictions, and no force-push or deletion allowance.
  - Verification: `gh api repos/csj3814-create/happydoctor/branches/main/protection`, `gh api repos/csj3814-create/happydoctor/branches/main --jq '{name: .name, protected: .protected, protection_url: .protection_url}'`.
- [x] Stage 92 backend config validation layer (2026-04-09)
  - Extend `backend/config.js` into the single backend env entrypoint for required strings, optional JSON, optional booleans, and bounded numeric settings.
  - Fail fast on real server startup when required backend secrets are missing or malformed, while keeping module-load checks and tests usable without production secrets.
  - Replace scattered `process.env` reads in startup, LLM bootstrap, MessengerBot auth, Firebase init, and follow-up scheduler tuning with config helpers.
  - Add focused backend tests for config parsing/validation and include the touched files in the reusable syntax/load verification path.
  - Verification: `backend npm test`, `backend npm run check:syntax`, `backend npm run check:load`.
  - Result: `index.js` now validates required runtime config before starting the real server, while `llmService` switched to lazy Gemini model creation so load checks do not require production secrets.
  - Result: MessengerBot auth, Firebase service-account parsing, and follow-up scheduler tuning now share the same config helpers and emit clearer config errors.
  - Result: Added `backend/tests/config.test.js` and expanded syntax/load scripts to cover `config.js`, `llmService.js`, `dbService.js`, and `kakaoWebhook.js`.
- [x] Stage 93 portal/public API validation and pagination hardening (2026-04-09)
  - Reject invalid `status`, `offset`, `limit`, overly long search strings, malformed lookup codes, and empty/oversized reply payloads with explicit `400` errors instead of silently coercing them.
  - Narrow portal consultation reads by requested inbox status so `pending`, `followup`, and `replied` tabs do not fetch completed consultations unnecessarily.
  - Return stable pagination metadata from the portal list route and update the portal frontend to consume the real paginated endpoint instead of refetching `status=all` for every tab/search interaction.
  - Add route/integration coverage for the new validation behavior and paginated portal list contract.
  - Verification: `backend npm test`, `backend npm run check:syntax`, `backend npm run check:load`, `frontend/portal npm run build`, `frontend/portal npm run lint`.
  - Result: `backend/routes/portal.js` now rejects malformed query/body params with explicit `400` errors and returns `offset`, `limit`, `returned`, and `hasMore` metadata.
  - Result: `backend/routes/public.js` now validates public lookup codes before DB access and rejects empty follow-up questions earlier.
  - Result: `backend/services/dbService.js` now scopes portal consultation reads by requested inbox status, so non-closed tabs no longer fetch completed consultations.
  - Result: `frontend/portal/app/page.tsx` now consumes the backend summary and paginated consultation endpoint directly instead of reloading `status=all` and re-slicing on the client.
- [x] Stage 94 portal visibility and reply authorization hardening (2026-04-10)
  - Limit portal detail/reply access to consultations that actually belong in the doctor workflow (`aiAction === ESCALATE`) instead of allowing any consultation id to resolve.
  - Reject new doctor replies for consultations that are already closed or missing a patient delivery target.
  - Add integration coverage so hidden non-escalated consultations return `404` and closed consultations reject replies with `400` before any downstream side effects run.
  - Verification: `backend npm test`, `backend npm run check:syntax`, `backend npm run check:load`.
  - Result: `backend/routes/portal.js` now hides non-escalated consultations from detail/reply routes and blocks replies to closed or disconnected consultations before any save/push/HDT side effects.
  - Result: `backend/tests/publicPortal.routes.integration.test.js` now locks the new authorization contract with non-escalated `404` and closed-reply `400` cases.
- [x] Stage 95 patient doctor-reply acknowledgement and reminder hardening (2026-04-10)
  - Mark doctor replies as seen when patients actually open the public status page, and clear any queued doctor-reply reminders at the same time so the portal no longer shows `미확인` after a real view.
  - Turn doctor-reply patient pushes into a small durable reminder schedule for Kakao-linked patients instead of a one-shot enqueue, so a missed first alert still gets another chance to bring the patient back.
  - Keep the scope honest: web-only public consultations still have no SMS-capable contact channel today, so document that limitation rather than pretending the system can text patients already.
  - Verification: `backend npm test`, `backend npm run check:syntax`, `backend npm run check:load`.
  - Result: `backend/routes/public.js` now acknowledges doctor replies as seen when the patient opens the public status page and clears queued `doctor_reply` reminders during public status/follow-up activity.
  - Result: `backend/routes/kakaoWebhook.js` now clears queued `doctor_reply` reminders when the patient checks a pending doctor reply inside Kakao, so reminder pushes stop once the reply is actually opened.
  - Result: `backend/services/notifyService.js` now supports scheduled patient reply reminders via `availableAt`, and `backend/routes/portal.js` uses that to enqueue doctor replies with an immediate + 5 minute + 15 minute reminder cadence for Kakao-linked patients.
  - Result: `backend/tests/notifyService.patientPush.test.js` and `backend/tests/publicPortal.routes.integration.test.js` now cover scheduled doctor-reply reminders and public-status acknowledgement cleanup.
- [x] Stage 96 optional consent-based patient contact capture (2026-04-10)
  - Add an optional reply-notification consent step to the public web consultation start form so patients can share a contact number only when they explicitly want follow-up alerts.
  - Persist the consented phone number on the consultation record, surface it in the portal detail view, and include it in consultation search so operations can find opted-in patients without treating the field as mandatory.
  - Reject partial contact capture (`consent` without a phone number or a phone number without `consent`) at both the form and route level, and lock the contract down with route integration tests.
  - Verification: `backend npm run verify:ci`, `frontend/app npm run verify:ci`, `frontend/portal npm run verify:ci`.
  - Result: `frontend/app/components/WebConsultationStartForm.tsx` now captures optional consent + phone input, clears the field when consent is turned off, and shows a direct validation error before submit if the contact data is incomplete.
  - Result: `backend/routes/public.js` and `backend/services/dbService.js` now normalize/store only explicit opt-in contact info via `patientNotificationContact`, and the create route returns `400` instead of `500` for consent validation errors.
  - Result: `frontend/portal/app/patient/[id]/page.tsx` now shows the consented alert phone and consent timestamp in the doctor portal detail view, and `backend/tests/publicPortal.routes.integration.test.js` covers the multipart web start route for both valid opt-in and invalid missing-phone cases.
- [x] Stage 97 opt-in SMS doctor-reply delivery (2026-04-10)
  - Keep the current Kakao room delivery flow as the first path for existing Kakao-linked patients.
  - Add a durable SMS queue for web consultations that explicitly opted into reply alerts, so doctor replies can reach consented phone numbers even when no Kakao room is registered.
  - Use a provider-backed sender abstraction with config gating, retry-safe lease/ack processing, and focused integration coverage for reply enqueue + SMS dispatch behavior.
  - Verification: `backend npm run verify:ci`, inspect production `/api/version`, and confirm the new queue can no-op safely when SMS provider config is absent.
  - Result: `backend/services/notifyService.js` now owns a durable `patient_sms_notifications` queue with SOLAPI config gating, lease/ack handling, cancellation helpers, and queue status counting for consented web SMS reply alerts.
  - Result: `backend/services/patientSmsService.js` now runs the SOLAPI-backed SMS worker loop at server startup and safely disables itself when SMS provider secrets are absent.
  - Result: `backend/routes/portal.js`, `backend/routes/public.js`, and `backend/routes/kakaoWebhook.js` now clear stale doctor-reply SMS reminders on reply/view/follow-up/close flows, and the portal reply route falls back to SMS only when no Kakao room delivery was queued.
  - Result: `backend/tests/notifyService.patientPush.test.js`, `backend/tests/patientSmsService.test.js`, `backend/tests/publicPortal.routes.integration.test.js`, and `backend/tests/config.test.js` now lock the SMS enqueue, no-config, worker, and fallback reply contracts in place.

- [x] Stage 98 홍보 실행 문서 패키지 작성 (2026-04-17)
  - 해피닥터를 널리 알리기 위한 채널 우선순위, 대상별 메시지, 30일 실행 순서를 한 문서로 정리한다.
  - 기관 제휴용 원페이지 소개서 초안을 만들어 가족센터, 다누리 연계 기관, 외국인주민센터, 무료진료소, 노숙인 지원기관에 바로 보낼 수 있게 한다.
  - 언론사·후원자용 소개문 초안을 만들어 보도 제안과 후원 미팅 소개에 바로 쓸 수 있게 한다.
  - Verification: `docs/happydoctor_growth_outreach_plan_2026-04-17.md`, `docs/happydoctor_partner_outreach_onepager_2026-04-17.md`, `docs/happydoctor_press_support_intro_2026-04-17.md` 내용 재검토.
  - Result: `docs/happydoctor_growth_outreach_plan_2026-04-17.md`에 기관 제휴 중심의 채널 우선순위, 대상별 메시지, 30일 실행 순서, KPI, 표현 주의사항을 정리했다.
  - Result: `docs/happydoctor_partner_outreach_onepager_2026-04-17.md`에 기관 제휴용 소개 문안, 제안 메일, 실무자 전달 문구를 넣어 바로 발송 가능한 초안으로 만들었다.
  - Result: `docs/happydoctor_press_support_intro_2026-04-17.md`에 언론·후원자용 소개문, 메일 제목/본문, 인터뷰 포인트를 정리했다.
  - Result: 라이브 `https://happydoctor.onrender.com/api/stats`를 확인해 2026-04-17 기준 누적 상담 390건, 의료진 직접 회신 328건을 문서에 반영했다.

- [x] Stage 99 1차 제휴 기관 리스트업 및 발송 초안 작성 (2026-04-17)
  - 가족센터, 외국인주민센터, 무료진료소, 노숙인 지원기관, 장애인·농아인 지원기관 중심으로 1차 제휴 대상 20곳을 정리한다.
  - 각 기관의 공식 사이트 기준 기본 정보, 추천 이유, 1차 연락 경로를 한 문서에 정리한다.
  - 기관 유형별 또는 기관별 1차 발송 메일 초안을 만들어 바로 복붙해 보낼 수 있게 한다.
  - Verification: 공식 사이트 기준 정보 재확인, `docs/happydoctor_partner_target_list_2026-04-17.md`, `docs/happydoctor_partner_firstwave_emails_2026-04-17.md` 내용 재검토.
  - Result: `docs/happydoctor_partner_target_list_2026-04-17.md`에 1차 제휴 대상 20곳을 A/B 우선순위와 추천 이유, 공식 경로, 1차 연락 경로, 발송 순서까지 포함해 정리했다.
  - Result: `docs/happydoctor_partner_firstwave_emails_2026-04-17.md`에 기관별 제목/첫 문장, 유형별 완성형 메일, 후속 메일, 통화 후 메모 문구를 넣어 바로 발송 가능한 초안으로 만들었다.
  - Result: 두 문서 모두 발송 직전 공식 사이트 기준 연락처 재확인 원칙을 명시해 실무 사용 시 오발송 위험을 줄였다.

- [x] Stage 100 A우선순위 8개 기관 실제 발송본 작성 (2026-04-17)
  - 서울외국인주민센터, 서울글로벌센터, 동부외국인주민센터, 영등포구 가족센터, 성북구 가족센터, 요셉의원, 라파엘클리닉, 시립서대문농아인복지관 대상의 실제 발송본을 완성한다.
  - 각 기관 공식 사이트 기준 대표 연락 경로와 담당 톤을 다시 확인한 뒤 제목, 수신처 메모, 본문, 후속 연락 포인트를 기관별로 고정한다.
  - 실무자가 그대로 복붙해 메일과 전화 후속에 쓸 수 있도록 한 문서로 정리한다.
  - Verification: 공식 사이트 기준 A우선순위 8곳 정보 재확인, `docs/happydoctor_partner_priority8_sendpack_2026-04-17.md` 내용 재검토.
  - Result: `docs/happydoctor_partner_priority8_sendpack_2026-04-17.md`에 A우선순위 8개 기관별 공개 연락처, 수신처 메모, 실제 제목, 실제 본문, 후속 전화 멘트를 묶은 발송 패키지를 작성했다.
  - Result: 서울외국인주민센터, 서울글로벌센터, 영등포구 가족센터, 성북구 가족센터, 요셉의원, 라파엘클리닉은 공식 공개 연락 경로 기준 메일 우선 발송 흐름으로 정리했다.
  - Result: 동부외국인주민센터와 시립서대문농아인복지관은 공개 메일 노출 신뢰도를 함께 메모하고, 메일과 대표전화 후속을 병행하는 보수적 발송 방식으로 정리했다.

- [x] Stage 101 승인 대기 1차 발송 큐 정리 (2026-04-17)
  - 사용자 승인 전에는 외부 메일을 실제 발송하지 않는 원칙을 명시한다.
  - 오늘 바로 검토할 수 있는 1차 발송 후보 4곳을 추려 수신처, 제목, 첨부물, 발송 방식, 승인 상태를 한 문서에 정리한다.
  - 승인되면 바로 보낼 수 있도록 발송 순서와 후속 일정도 같이 정리한다.
  - Verification: `docs/happydoctor_partner_approval_queue_2026-04-17.md` 내용 재검토.
  - Result: `docs/happydoctor_partner_approval_queue_2026-04-17.md`에 승인 전 외부 발송 금지 원칙과 승인 대기 상태를 명시했다.
  - Result: 오늘 바로 검토할 1차 발송 후보를 서울외국인주민센터, 서울글로벌센터, 영등포구 가족센터, 요셉의원 4곳으로 추려 수신처, 제목, 첨부물, 후속 일정까지 정리했다.
  - Result: 사용자 승인 문구 예시를 같이 적어 두어 승인 후 즉시 발송 단계로 넘어갈 수 있게 만들었다.

- [x] Stage 102 happydoctor.kr 무료 대표메일 포워딩 준비 (2026-05-19)
  - `Forward Email` 무료 플랜 기준으로 `president@happydoctor.kr` 대표메일 포워딩 구성을 정리한다.
  - Vercel DNS에 넣을 MX/TXT 레코드와 Gmail `Send mail as` 연동 흐름을 공식 문서 기준으로 확인한다.
  - 실제 수신 Gmail 주소만 정해지면 바로 적용할 수 있도록 설정 문서와 체크리스트를 만든다.
  - Verification: `docs/happydoctor_forward_email_setup_2026-05-19.md` 내용 재검토, 현재 `happydoctor.kr` MX 상태 확인.
  - Result: `docs/happydoctor_forward_email_setup_2026-05-19.md`에 실제 포워딩 주소를 `csj3814@gmail.com`으로 확정하고 Vercel DNS 최종 입력값을 복붙 가능한 형태로 정리했다.
  - Result: `president@happydoctor.kr -> csj3814@gmail.com` 무료 포워딩 구성을 기준으로 MX 2개, TXT 1개, 권장 SPF 1개를 확정했다.

- [x] Stage 103 happydoctor.kr 대표메일 포워딩 실제 적용 (2026-05-19)
  - Vercel DNS에 Forward Email용 MX 2개와 TXT 2개를 실제 추가한다.
  - `president@happydoctor.kr`가 `csj3814@gmail.com`으로 포워딩되도록 최종 구성을 반영한다.
  - 외부 DNS 조회 기준으로 MX/TXT 응답이 보이는지 검증한다.
  - Verification: `vercel dns ls happydoctor.kr`, `nslookup -type=mx happydoctor.kr`, `nslookup -type=txt happydoctor.kr`.
  - Result: `happydoctor.kr`에 `mx1.forwardemail.net`, `mx2.forwardemail.net`, `forward-email=president:csj3814@gmail.com`, `v=spf1 a include:spf.forwardemail.net -all` 레코드를 실제 반영했다.
  - Result: 외부 `nslookup` 조회 기준으로 MX와 TXT가 모두 응답하는 것을 확인했다.
  - Result: 실사용 테스트 기준 `president@happydoctor.kr` 수신 메일이 `csj3814@gmail.com`으로 정상 도착하는 것을 확인했다.
  - Result: 현재 구성은 무료 포워딩이라 답장 발신은 기본적으로 `csj3814@gmail.com` 기준으로 나가며, 수신 목적은 달성했지만 `@happydoctor.kr` 발신 정체성은 별도 설정 또는 정식 메일 호스팅이 필요하다.

- [x] Stage 104 기관 제휴 메일 소개 문안 강화 (2026-05-19)
  - 기관 제휴 메일에 `행복한 의사` 단체 소개와 `해피닥터 앱` 작동 흐름이 더 분명히 드러나도록 공통 본문을 개정한다.
  - 실제 발송 패키지와 원페이지 소개서에도 같은 핵심 설명을 반영해 문서 간 메시지를 맞춘다.
  - 최석재 대표 서명을 발송용 문서에 반영한다.
  - Verification: `docs/happydoctor_partner_firstwave_emails_2026-04-17.md`, `docs/happydoctor_partner_priority8_sendpack_2026-04-17.md`, `docs/happydoctor_partner_outreach_onepager_2026-04-17.md` 내용 재검토.
  - Result: `docs/happydoctor_partner_firstwave_emails_2026-04-17.md`에 `행복한 의사 소개`, `해피닥터 앱 설명`, `공통 설명형 본문`을 새로 넣고, 완성형 메일 6종을 같은 구조로 다시 정리했다.
  - Result: `docs/happydoctor_partner_priority8_sendpack_2026-04-17.md`에 A우선순위 8개 기관 실제 발송본을 `단체 소개 -> 앱 작동 흐름 -> 기관 맞춤 연결` 구조로 개정하고 최석재 대표 서명을 반영했다.
  - Result: `docs/happydoctor_partner_outreach_onepager_2026-04-17.md`에 `행복한 의사는 어떤 단체인가`, `해피닥터 앱은 어떻게 작동하나`, `이미 쌓아온 협력 기반` 섹션을 추가해 기관 설명 자료를 보강했다.
  - Result: 원페이지 운영 수치는 2026-05-19 라이브 확인값 기준 `누적 상담 393건`, `의료진 직접 회신 328건`으로 갱신했다.

- [x] Stage 105 외국인 친화성 및 다국어 상담 준비도 점검 (2026-05-19)
  - 웹앱이 외국인 사용자를 위해 어떤 언어와 입력 흐름을 실제로 지원하는지 코드 기준으로 점검한다.
  - 백엔드가 영어 및 기타 언어 입력을 어떻게 처리하는지, 의료진 답변 전달 시 언어 장벽이 있는지 확인한다.
  - 외국인주민센터 제휴 전에 우선 보완해야 할 다국어 준비 항목을 정리한다.
  - Verification: `frontend/app`, `backend` 관련 코드 재검토 및 요약.
  - Result: `frontend/app/app/page.tsx`, `frontend/app/components/WebConsultationStartForm.tsx`, `frontend/app/components/StatusPageClient.tsx` 기준 환자용 랜딩/시작/상태 화면 문구와 검증 메시지가 사실상 한국어 단일 언어로 고정되어 있어 외국인 사용자용 진입 경험이 준비되지 않았다.
  - Result: `frontend/app/lib/consultation-session.ts`와 `backend/routes/public.js` 기준 공개 웹 상담 데이터에는 `preferredLanguage`, `locale`, `needsInterpreter` 같은 필드가 없어 환자 언어 선호를 수집·저장·전달하지 못한다.
  - Result: `backend/services/llmService.js` 시스템 프롬프트와 fallback 응답이 한국어 중심으로 작성되어 있고, 환자 입력 언어로 `replyToPatient`를 반드시 돌려주라는 제약이 없어 영어/다국어 회신 품질을 신뢰하기 어렵다.
  - Result: `backend/routes/portal.js` 및 환자 상태/알림 문구 기준 의료진 답변 푸시·SMS·후속 안내도 한국어 고정이라, 외국인 상담자가 접수 후 답변을 받아도 후속 경험에서 다시 언어 장벽이 생긴다.
  - Result: 로컬 런타임에서 영어 샘플 triage를 직접 돌리려 했지만 `GEMINI_API_KEY` 부재로 `analyzeAndRouteTriage` 실험 실행은 못 했고, 따라서 실제 영문 답변 동작 평가는 코드 구조 기준 추정으로 남는다.

- [ ] Stage 106 다국어 접근성 1차 구현 (2026-05-19)
  - `frontend/homepage` 영어 홈페이지에 Google 번역 기반 다국어 보기 진입점을 추가하고, 영어 CTA가 `app` 영어 상담 흐름으로 들어가게 정리한다.
  - `frontend/app` 환자 웹앱의 시작/상태 핵심 화면과 환자 액션 컴포넌트를 `ko/en` UI로 분리하고, 영어 화면에서 다른 언어 자유 입력을 받을 수 있게 한다.
  - `backend` 공개 상담 생성/상태/의사 답변 전달 경로에 번역 메타데이터와 Google Translation 기반 언어 감지/번역 파이프라인을 추가한다.
  - `frontend/portal` 상세 및 목록에서 환자 원문, 감지 언어, 한국어 번역, 환자 전달 번역본을 보여주도록 반영한다.
  - Verification: `frontend/homepage npm run verify:ci`, `frontend/app npm run verify:ci`, `frontend/portal npm run verify:ci`, `backend npm run verify:ci`.

- [x] Stage 106 review update (2026-05-19)
  - Verification: `frontend/homepage npm run verify:ci`, `frontend/app npm run verify:ci`, `frontend/portal npm run verify:ci`, `backend npm run verify:ci`.
  - Result: 영어 홈페이지에 Google 번역 기반 다국어 보기 진입점을 추가했고, 영어 CTA가 `?lang=en` 웹 상담 경로로 들어가도록 연결했다.
  - Result: 환자용 웹앱 시작/상태 화면과 상태 액션, 사진 업로더를 `ko/en` UI로 분리하고 영어 화면에서 다른 언어 자유 입력을 받을 수 있도록 정리했다.
  - Result: 백엔드에 Google Translation 기반 언어 감지/번역 서비스와 `uiLanguage`, `sourceLanguage`, `patientReplyLanguage`, `translatedPatientDataKo`, `patientDeliveredChatbotReply`, `patientDeliveredMessage` 저장 필드를 추가했다.
  - Result: 포털 목록과 상세에서 원문 언어 배지, 의사용 한국어 번역본, 환자 전달 번역본을 함께 볼 수 있도록 반영했다.

- [x] Stage 107 runtime translation auth verification (2026-05-19)
  - Existing `FIREBASE_SERVICE_ACCOUNT`를 Google Cloud Translation fallback 자격 증명으로 재사용하도록 정리해서, 별도 `GOOGLE_TRANSLATE_API_KEY`는 선택 사항으로 만들었다.
  - API key 인증, Firebase service account fallback 인증, 무자격 증명 실패 경로를 다루는 백엔드 테스트를 추가했다.
  - Verification: `backend npm run verify:ci`; 현재 backend `.env` 기준 `detectLanguage()` / `translateText()` 런타임 스모크 스크립트.
  - Result: translation auth fallback 변경 후에도 백엔드 검증은 모두 통과했다.
  - Result: 실제 Google 호출은 인증까지는 통과했지만 `403 SERVICE_DISABLED`를 반환했고, 현재 서비스 계정이 연결된 GCP 프로젝트에서 Cloud Translation API가 아직 비활성 상태임을 확인했다.
  - Result: 남은 수동 단계는 기존 프로젝트에서 `translate.googleapis.com`를 활성화하고 전파 시간을 기다린 뒤 다시 확인하는 것이다. 이 작업이 끝나면 fallback 경로 기준 추가 번역 비밀값은 필요 없다.

- [x] Stage 108 multilingual production deploy (2026-05-19)
  - Commit `00728ed89c1c8db6d647d5728e7dd9a4d8f8f5e8`를 `main`에 push해서 자동 배포를 시작했다.
  - Vercel production deploy를 홈페이지, 환자 앱, 포털 프로젝트에 각각 직접 실행해 `happydoctor.kr`, `app.happydoctor.kr`, `portal.happydoctor.kr` 별칭 반영까지 확인했다.
  - Verification: `frontend/homepage npm run verify:ci`, `frontend/app npm run verify:ci`, `frontend/portal npm run verify:ci`, `backend npm run verify:ci`, 라이브 `https://happydoctor.kr/en`, `https://app.happydoctor.kr/start?lang=en`, `https://portal.happydoctor.kr`, `https://happydoctor.onrender.com/api/version`.
  - Result: `happydoctor.kr/en`에서 `Start Consultation on Web`, `View this page in your language` 문구가 보이는 최신 영어 홈페이지가 라이브 반영되었다.
  - Result: `app.happydoctor.kr/start?lang=en`에서 `Start a consultation on the web`, `Korean and English UI are supported` 문구가 보이는 최신 영어 상담 UI가 라이브 반영되었다.
  - Result: `portal.happydoctor.kr`는 `200` 응답으로 새 프로덕션 배포가 연결된 것을 확인했다.
  - Result: Render `api/version` 응답 revision이 `00728ed89c1c8db6d647d5728e7dd9a4d8f8f5e8`로 올라와 백엔드도 같은 커밋이 반영되었다.

- [x] Stage 109 region-safe language entry fix (2026-05-21)
  - 영어 홈페이지의 `Google Translate` 웹페이지 번역 바로가기가 지역 제한으로 실패하는 문제를 확인했다.
  - 다국어 카드의 동선을 `외부 번역 페이지 열기`에서 `영어 UI 상담 시작 + 해당 언어 입력 안내` 흐름으로 바꿨다.
  - 환자 웹 상담 시작 화면에 선택 언어 안내 배너를 추가해, 사용자가 `Tiếng Việt`, `Español` 등 선택 언어로 바로 입력해도 된다는 점을 명확히 안내하도록 보강했다.
  - Verification: `frontend/homepage npm run verify:ci`, `frontend/app npm run verify:ci`.
  - Result: 더 이상 지역 제한이 있는 Google 웹페이지 번역 링크를 핵심 유입 경로에 사용하지 않게 되었다.
  - Result: 다국어 사용자는 영어 홈페이지에서 자기 언어 카드를 눌렀을 때 바로 상담 폼으로 이동하고, 시작 화면에서 선택 언어 입력이 가능하다는 안내를 보게 된다.

- [x] Stage 110 localized file picker UI fix (2026-05-21)
  - 영어 상담 화면에서 브라우저 기본 파일 입력 UI가 `파일 선택`, `선택된 파일 없음` 같은 시스템 문구를 노출하는 문제를 확인했다.
  - 환자 상담 시작 화면과 상태 화면 업로더를 모두 커스텀 파일 선택 UI로 바꿔 버튼/상태 문구를 앱 번역 문자열로 제어하도록 수정했다.
  - Verification: `frontend/app npm run verify:ci`.
  - Result: 영어 UI에서는 `Choose files`, `No file selected` 또는 선택 파일명이 일관되게 표시되고, 시스템 기본 로캘 문구가 섞이지 않게 되었다.

- [x] Stage 111 selected-language full start-page translation (2026-05-21)
  - 다국어 카드에서 `inputLanguage`를 고른 뒤에도 환자 시작 화면 전체가 영어에 머물고, 선택 언어는 입력 힌트로만 쓰이는 문제를 수정한다.
  - 백엔드에 시작 화면 UI 번역 복사본 API를 추가하고, 프런트가 선택 언어 기준으로 페이지/폼 전체 문구를 받아 렌더링하도록 연결한다.
  - `언어 안내`, 파일 선택 상태, 하단 지원 문구처럼 남아 있던 폼 내부 정적 문구도 모두 선택 언어 번역본을 따르게 정리한다.
  - Verification: `frontend/app npm run verify:ci`, `backend npm run verify:ci`, 라이브 `https://app.happydoctor.kr/start?source=homepage&lang=en&inputLanguage=vi`.
  - Result: `backend/routes/public.js`, `backend/services/uiCopyService.js`에 선택 언어별 시작 화면 번역 복사본 API를 추가해 영어 원문 묶음을 런타임에 번역하고 캐시하도록 정리했다.
  - Result: `frontend/app/app/start/page.tsx`, `frontend/app/lib/start-copy.ts`, `frontend/app/components/WebConsultationStartForm.tsx`에서 페이지 상단, 진행 안내, 폼 라벨, 파일 선택 상태, 하단 안내를 모두 선택 언어 번역본으로 렌더링하도록 연결했다.
  - Result: 라이브 `https://app.happydoctor.kr/start?source=homepage&lang=en&inputLanguage=vi` HTML 기준 `Bắt đầu tư vấn trực tuyến`, `Bạn có thể viết vào Tiếng Việt.`, `Chọn tập tin` 등 베트남어 문구가 시작 화면 전반에 반영된 것을 확인했다.

- [x] Stage 112 English homepage hero rebalance (2026-05-21)
  - 영어 홈페이지 히어로에서 왼쪽 텍스트 스택이 너무 길어 오른쪽 비주얼 카드가 첫 화면 아래로 밀리고, 로고 중심 비주얼이 한쪽에만 떠 보이는 균형 문제를 수정한다.
  - `Language support` 카드를 히어로 본문 아래 별도 전폭 섹션으로 내리고, 메인 2열은 `미션 + CTA`와 `비주얼 구성`만 남겨 첫 화면 집중도를 높인다.
  - 오른쪽 비주얼에는 한국어 홈에서 검증된 방식처럼 보조 오버레이 카드와 접근성 칩을 추가해 단일 이미지 카드보다 풍성한 구도로 재구성한다.
  - Verification: `frontend/homepage npm run verify:ci`, `https://happydoctor.kr/en` 데스크톱/모바일 렌더 확인.
  - Result: `frontend/homepage/app/en/page.tsx`에서 메인 히어로를 `items-start` 2열로 재배치하고, 언어 지원 카드를 히어로 아래 전폭 섹션으로 분리해 첫 화면에서 미션/CTA와 우측 비주얼만 남도록 정리했다.
  - Result: 우측 비주얼에 `Bodeum + volunteer doctors` 오버레이 카드와 `Web + KakaoTalk` 접근 칩을 추가해, 단일 로고 이미지처럼 보이던 구도를 보조 정보가 있는 시각 구성으로 바꿨다.
  - Result: 언어 지원 섹션 설명을 현재 제품 동작에 맞게 갱신해, 선택한 언어로 상담 폼이 먼저 열리고 필요한 경우 의료진용 번역과 번역 답변이 이어진다는 내용으로 정리했다.
  - Result: 라이브 `https://happydoctor.kr/en`에서 `1920x1080`, `1440x900`, `390x844` 기준으로 히어로 균형을 확인했고, `Tiếng Việt` 카드 클릭 시 `https://app.happydoctor.kr/start?source=homepage&lang=en&inputLanguage=vi`로 이동하는 것도 검증했다.

- [x] Stage 113 English mission block centering tweak (2026-05-21)
  - 영어 홈페이지에서 이미지가 아래로 스택되는 폭에서는 미션 블록도 가운데 축으로 맞춰, 상단 텍스트와 하단 비주얼의 시선 흐름을 더 자연스럽게 만든다.
  - 큰 화면의 좌측 정렬 히어로는 유지하고, `lg` 미만에서만 미션 라벨/헤드라인/설명/CTA 묶음을 가운데 정렬하도록 보정한다.
  - Verification: `frontend/homepage npm run verify:ci`, `https://happydoctor.kr/en` 태블릿/모바일 렌더 확인.
  - Result: `frontend/homepage/app/en/page.tsx`에서 미션 컬럼을 `lg` 미만 구간에만 `items-center`와 `text-center`로 바꾸고, CTA 묶음도 같은 구간에서 가운데 정렬되도록 조정했다.
  - Result: 라이브 `https://happydoctor.kr/en`에서 `960x1023`, `390x844` 기준으로 미션 라벨, 헤드라인, 설명, CTA가 모두 가운데 축으로 정렬된 것을 확인했다.

- [x] Stage 114 선택 언어 시작 화면 정적 번역 fallback 보강 (2026-05-21)
  - 일본어 등 일부 선택 언어에서 시작 화면 UI 번역 API가 실패해 영어로 fallback 되는 문제를 재현하고 원인을 정리한다.
  - 환자 앱 시작 화면은 홈페이지 카드에 노출한 언어들에 대해 프런트 내부의 안정적인 번역 사전을 우선 사용하고, 런타임 번역 API는 보조 경로로만 남긴다.
  - 일본어를 포함한 선택 언어에서 제목, 진행 안내, 폼 라벨, 파일 선택 문구, 하단 보조 문구가 전부 해당 언어로 보이는지 라이브에서 다시 검증한다.
  - Verification: `frontend/app npm run verify:ci`, 라이브 `https://app.happydoctor.kr/start?source=homepage&lang=en&inputLanguage=ja` 및 대표 언어 샘플 확인.
  - Result: 라이브 `/api/public/ui-copy/start?lang=ja`는 실패하지만 `vi`, `es`, `tr` 등 일부 언어만 성공하는 불안정 상태를 재현했고, 시작 화면 번역을 런타임 백엔드 API에만 의존하면 언어별로 영어 fallback이 섞일 수 있음을 확인했다.
  - Result: `frontend/app/lib/start-copy-localized.ts`에 홈페이지 카드 20개 언어용 시작 화면 번역 사전을 추가하고, `frontend/app/lib/start-copy.ts`가 이 내장 사전을 먼저 읽도록 바꿔 선택 언어 화면이 백엔드 번역 상태와 무관하게 안정적으로 렌더링되게 했다.
  - Result: 로컬 `http://127.0.0.1:3100/start?source=homepage&lang=en&inputLanguage=ja`와 라이브 `https://app.happydoctor.kr/start?source=homepage&lang=en&inputLanguage=ja`에서 `ウェブで相談を始める`, `ご自身の言葉で書いてください`, `ファイルを選択` 문구를 직접 확인했다.
  - Result: 추가 라이브 점검으로 `fr`, `ar` 선택 언어 화면도 제목, 진행 안내, 파일 선택 문구가 모두 현지 언어로 노출되는 것을 브라우저로 확인했다.

- [x] Stage 115 사회적 의료접근 취약기관 1차 발송 준비 및 발신 경로 점검 (2026-05-22)
  - 오늘 실제로 보낼 1차 기관 묶음을 기존 승인 대기 큐 기준으로 다시 잠그고, 현재 서비스 구조에 맞는 최신 링크와 설명을 반영한다.
  - 메일 본문에 한국어 홈페이지, 영어 홈페이지, 다국어 상담 시작 링크 구조를 현재 운영 주소 기준으로 정리한다.
  - 실제 발송 전 현재 메일 발신 주소가 어떻게 보이는지 확인하고, 필요하면 사용자와 발신 정체성 결정을 짧게 재확인한다.
  - Verification: `docs/happydoctor_partner_approval_queue_2026-04-17.md`, `docs/happydoctor_partner_priority8_sendpack_2026-04-17.md` 재검토, Gmail 발신 경로 확인.
  - Progress: `docs/happydoctor_partner_approval_queue_2026-04-17.md`에 현재 실제 발신 Gmail 계정이 `csj3814@gmail.com`이라는 점과 1차 발송은 첨부 없이 링크 중심으로 가는 운영 메모를 추가했다.
  - Progress: `docs/happydoctor_partner_priority8_sendpack_2026-04-17.md`의 서울외국인주민센터, 서울글로벌센터, 영등포구 가족센터, 요셉의원 발송본에 `https://happydoctor.kr/ko`, `https://happydoctor.kr/en`, `https://app.happydoctor.kr/start?source=homepage&lang=en` 링크와 2026-05-22 기준 운영 수치(`누적 상담 397건`, `의료진 직접 회신 328건`)를 반영했다.
  - Progress: 사용자 피드백에 맞춰 4개 발송본의 수신 호칭을 `또는` 없이 단일 담당 호칭으로 통일하고, 후속 CTA를 `필요하시면 기관 내부 공유용 해피닥터 소개서를 보내드리겠습니다.` 문장으로 정리했다.
  - Progress: 4개 발송본 모두에 영어·다국어 페이지가 준비되어 있어 언어 문제로 병원 방문이나 초기 의료 문의가 어려운 분들께 먼저 도움을 드릴 수 있다는 설명을 반영했다.
  - Progress: 사용자 피드백에 맞춰 4개 발송본의 본문을 `단체 소개 선언문`보다 `왜 이 기관에 메일드리는지`, `어떻게 쓰는지`가 먼저 보이도록 짧고 구체적인 문장으로 다시 정리했다.
  - Progress: Gmail 드래프트 4통을 실제로 생성했고, 현재 드래프트 발신 표시는 모두 `\"최석재\" <csj3814@gmail.com>`로 확인되었다.
  - Progress: Gmail 드래프트 4통도 같은 문구로 다시 덮어써, 서울외국인주민센터·서울글로벌센터·영등포구 가족센터·요셉의원 초안 미리보기에서 단일 담당 호칭이 반영된 것을 확인했다.
  - Progress: Gmail 드래프트 4통의 첫 문장과 본문 톤도 다시 다듬어, `행복한 의사 해피닥터를 운영하는 최석재입니다.`처럼 실제 담당자가 직접 쓴 메일처럼 읽히는 방향으로 맞췄다.
  - Progress: 사용자 문장 교정에 맞춰 `1차 상담 후에 추가 질문도 이어갈 수 있습니다.`, `응급실로 바로 방문해야 할지...` 같은 더 직접적인 표현으로 바꾸고, `우선은 첨부 없이 링크 중심으로 먼저 공유드립니다.` 문장은 삭제했다.
  - Progress: 동부외국인주민센터, 성북구 가족센터, 라파엘클리닉, 시립서대문농아인복지관 본문도 같은 기준으로 정리하고, 빠져 있던 3·5·7·8번 링크 블록을 추가했다.
  - Result: 사용자 승인에 따라 2026-05-22 13:16 KST 기준 `csj3814@gmail.com` 발신으로 서울외국인주민센터, 서울글로벌센터, 영등포구 가족센터, 요셉의원 4통을 모두 실제 발송했다.
  - Result: 승인 대기 큐 문서를 `발송 완료` 상태로 갱신하고, 후속 확인 날짜를 서울외국인주민센터·서울글로벌센터·영등포구 가족센터는 `2026-05-26`, 요셉의원은 `2026-05-25`로 적어두었다.

- [x] Stage 116 한국어 홈페이지 상단 다국어 진입 CTA 교체 (2026-05-22)
  - 한국어 홈페이지 상단의 `카카오 채널 보기` 버튼을 제거하고, 같은 위치에 영어·다국어 홈페이지로 이동하는 CTA를 넣는다.
  - 기존 카카오 상담 시작 흐름과 하단 CTA는 유지하고, 상단 유틸리티 영역만 바꿔 다국어 진입성을 높인다.
  - Verification: `frontend/homepage npm run verify:ci`, 한국어 홈페이지 렌더에서 상단 CTA 텍스트와 링크 확인.
  - Result: `frontend/homepage/components/HomepageClient.tsx` 상단 네비게이션의 `카카오 채널 보기` 링크를 `영어·다국어 홈페이지` CTA로 교체하고, `next/link`로 `/en` 진입을 연결했다.
  - Result: 로컬 `http://127.0.0.1:3101/ko` 렌더에서 새 상단 CTA가 보이고, 기존 `카카오 채널 보기` 문구는 사라졌으며, 클릭 시 `http://127.0.0.1:3101/en`으로 이동하는 것을 브라우저로 확인했다.
  - Result: Vercel 프로덕션 배포 `dpl_8xwt3Zto69jEUR4UZdKxmvjBGsee`가 완료되었고, 라이브 `https://happydoctor.kr/ko`에서도 새 상단 CTA가 보이며 클릭 시 `https://happydoctor.kr/en`으로 이동하는 것을 재확인했다.

- [x] Stage 117 의료진 지원 메일 수신 경로 확인 (2026-05-23)
  - 홈페이지/포털에서 의료진 지원 또는 참여 진입점이 어떤 경로를 타는지 찾는다.
  - 메일 발송인지, 포털 접근 요청인지, 또는 다른 승인 흐름인지 백엔드와 설정을 기준으로 확인한다.
  - 현재 실제로 어디로 수신되거나 저장되는지 확인 근거와 함께 정리한다.
  - Verification: 관련 프런트 진입점, 백엔드 라우트, 수신 주소/저장 경로 코드 확인.
  - Result: 한국어 홈페이지의 `의료진 참여 문의` CTA는 메일 전송이 아니라 `https://open.kakao.com/me/happydoctors` 오픈카카오 링크로 연결되어 있고, 코드상 별도 `mailto:` 또는 메일 발송 라우트는 없다.
  - Result: 포털 로그인 기반 의료진 지원 흐름은 `/api/portal/auth/status`에서 승인되지 않은 의사 계정을 `upsertDoctorAccessRequest()`로 Firestore `doctor_access_requests` 컬렉션에 `pending` 상태로 저장하는 구조이며, 메일 수신함으로 보내지지 않는다.
  - Result: 승인 대기 의료진 목록은 포털 관리자 화면의 `ApprovalQueueCard`에서 보이며, 관리자는 `PORTAL_ADMIN_EMAILS` 또는 단일 `ALLOWED_DOCTOR_EMAILS` 기준으로 결정된다. 프로젝트 문서상 현재 대표 관리자 기준 이메일은 `csj3814@gmail.com`으로 기록되어 있다.

- [x] Stage 118 의료진 알람 누락 복구 (2026-06-04)
  - 의료진 알림 큐, 알림방 등록 문서, MessengerBotR 폴링 구조를 함께 점검해 실제 누락 원인을 찾는다.
  - 레거시 `doctor_room` 문서가 현재 검증 로직에서 미등록으로 처리되는지 확인하고, 필요하면 호환 복구 로직을 추가한다.
  - 회귀 테스트와 실데이터 점검으로 이후 알람이 다시 흐를 수 있는 상태인지 검증한다.
  - Verification: `backend npm test`, `backend npm run check:syntax`, Firestore 알림방/큐 상태 재점검.
## 2026-06-04 review
- Stage 118 result: doctor alert room compatibility restored.
  - Root cause: the live `delivery_rooms/doctor_room` document only had `roomName`, while the newer backend required `kind === doctor_group` and `isGroupChat === true`, so `/api/messengerbot/poll` treated the doctor room as unregistered.
  - Fix: `backend/services/notifyService.js` now accepts legacy doctor-room documents, validates them, and backfills the missing metadata automatically.
  - Verification: `backend npm run verify:ci` passed, the live Firestore doctor-room document was migrated in place, and Render `/api/version` advanced to `bb511f83d3a7330b46d62d397c86d9280e620683`.
## 2026-06-04 review (continued)
- [x] Stage 119 대표 개인 미답변 상담 알림 추가
  - Goal: 의료진 단체방 알림과 별도로, 일정 시간 동안 답변이 없는 상담이 생기면 대표 개인 카카오 방에도 한 번 더 알려주는 경로를 추가했다.
  - Fix: `backend/services/notifyService.js`에 `operator_unanswered_doctor_alert` 큐와 중복 방지 키를 추가하고, 의사 답변 완료나 상담 종료 시 개인 알림 큐도 함께 정리하도록 `public`, `portal`, `kakaoWebhook` 라우트를 보강했다.
  - Fix: `backend/routes/messengerBot.js`에 `~개인알림등록`, `~개인알림확인` 명령을 추가해 개인 알림방을 조회하고 다시 등록할 수 있게 했다.
  - Fix: Firestore 예약 ID 충돌을 피하기 위해 개인 알림 수신자 키를 `operator_alerts`로 바꾸고, 운영 `messenger_rooms/operator_alerts` 문서를 대표 개인 방 `행복한의사`로 등록했다.
  - Verification: `backend npm run verify:ci` passed.
  - Verification: 운영 Firestore에서 `messenger_rooms/operator_alerts.roomName === 행복한의사`를 확인했다.
  - Verification: 설정 확인용 테스트 알림이 `patient_channel_pushes`에서 `delivered` 상태로 전환되었고, 실제 대상 방도 `행복한의사`로 기록된 것을 확인했다.
