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

## Phase 4: Bug Fixes & Optimization (2026.03.14) ✅
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
- [x] CORS 미들웨어 순서 버그 수정 (/api/portal이 /api/ 전체차단에 덮어씌워지던 문제)
- [x] 차트 알림에 포털 사용 안내 추가 (카카오 단톡방 → 포털 URL + 사용법)
- [x] HDT (Happy Doctor Token) 시스템
  - [x] 답변 전송 시 +100 HDT 자동 적립
  - [x] 환자 확인(seen) 시 +50 HDT 추가
  - [x] doctor_stats 컬렉션 (Firestore)
  - [x] 리더보드 탭 (🏆 순위 + 내 HDT 헤더 표시)

## Phase 9: 잔여 과제
- [ ] 카카오 오픈빌더 폴백 블록에 /kakao/check-doctor-reply 연결 (환자 재접속 시 의사 답변 전달)
- [ ] 홈페이지(Phase 8-C) — 단체 소개 + 누적 상담 통계 + 기부 페이지
- [ ] HDT 환자 확인(seen) 시 +50 HDT 트리거 연결 (현재 저장만, 지급 미연결)
- [ ] MessengerBotR 공기계 스크립트 재컴파일 확인

## Current Status
- **Last updated**: 2026.03.26
- **MVP Status**: Full triage + F/U + close + ESCALATE + 의사 포털 working ✅
- **Deployed at**:
  - Backend: https://happydoctor.onrender.com (Render, main 브랜치)
  - Frontend Portal: https://happydoctor.vercel.app (Vercel)
- **GitHub**: https://github.com/csj3814-create/happydoctor
- **Model**: gemini-2.5-flash (paid plan via 해빛스쿨)
- **Kakao Channel**: http://pf.kakao.com/_PxaTxhX/chat
- **Firebase**: happydoctor0 (Firestore logging active)
