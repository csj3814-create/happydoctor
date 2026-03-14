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

## Phase 5: Notification & Follow-Up System
- [x] Set up Kakao MessengerBotR for medical team group chat
- [x] Implement AI conditional routing logic (Autonomous vs Escalate)
- [ ] Test F/U scenario (15-min follow-up trigger → patient response → re-analysis)
- [ ] Verify ESCALATE flow: doctor notification delivery via MessengerBotR

## Phase 6: Deployment & Polish
- [x] Initialize Git repository & Push to GitHub (csj3814-create/happydoctor)
- [x] Connect repository to Render (auto-deploy from main branch)
- [x] Set up Environment Variables on Render (GEMINI_API_KEY, MESSENGER_API_KEY)
- [ ] Gemini API: upgrade from free tier (20 req/day) to paid plan for production
- [ ] Firebase Firestore: set up FIREBASE_SERVICE_ACCOUNT for persistent logging
- [ ] E2E testing of ESCALATE scenario (doctor receives SOAP chart)

## Phase 7: Donation & Website (Future)
- [ ] Build Happy Doctor website with donation page
- [ ] Add donation link back to Gemini system prompt & bot responses
- [ ] Add donation button to Kakao OpenBuilder post-consultation block
- [ ] Verify donation message tone (warm invitation, not pressure)

## Current Status
- **Last updated**: 2026.03.14
- **MVP Status**: Core triage flow working end-to-end ✅
- **Deployed at**: https://happydoctor.onrender.com (Render free tier)
- **GitHub**: https://github.com/csj3814-create/happydoctor
- **Model**: gemini-2.5-flash (free tier, 20 req/day limit)
- **Kakao Channel**: 해피닥터 행복한 의사
