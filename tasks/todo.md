# Happy Doctor Project - Tasks

## Phase 1: Planning (Current)
- [x] Project overview and goal definition
- [x] Chatbot MVP scenario and architecture design
- [x] Persona refinement (Intern Doctor / Bodeum)
- [x] Integrate CLAUDE.md principles

## Phase 2: Technical Setup & Backend
## Phase 2: Technical Setup & Backend
- [x] Analyze reference project (Habitchatbot)
- [x] Create backend implementation plan
- [ ] Set up Kakao i OpenBuilder account and channel
- [x] Initialize backend project repository (Node.js)
- [x] Set up API integrations (Gemini, Telegram)
- [x] Create basic endpoints (kakaoWebhook, messengerBot)
- [ ] Connect Kakao Webhook to real backend (ngrok or cloud)

## Phase 3: Notification & Follow-Up System
- [x] Set up Kakao MessengerBotR for medical team group chat
- [x] Implement AI conditional routing logic (Autonomous vs Escalate)
- [ ] Implement F/U Scheduler & Chart comparison logic APIs
- [ ] Test F/U Scenario changes with test cases

## Phase 4: Deployment & Testing
- [x] Initialize Git repository & Push to GitHub
- [x] Connect repository to Render (Web Service)
- [x] Set up Environment Variables on Render (.env keys)
- [x] Acquire Render external URL and link to Kakao OpenBuilder
- [ ] End-to-end scenario testing in KakaoTalk
- [ ] Finalize disclaimer and user consent flowop

## Phase 5: Donation & Mission Branding
- [ ] Secure donation link (KakaoPay / Toss / bank account)
- [ ] Replace [DONATION_LINK] placeholder in llmService.js system prompt
- [ ] Replace [후원 링크 추가 필요] in kakaoWebhook.js and messengerBot.js
- [ ] Add donation button to Kakao OpenBuilder post-consultation block
- [ ] Verify donation message tone (warm invitation, not pressure)
