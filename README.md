# 🏥 행복한 의사 (Happy Doctor)

**의료 취약계층을 위한 AI 예진 챗봇**

병원에 가기 어려운 의료 취약계층 환자분들을 온라인에서 돌보기 위해, 자원봉사 의사들이 운영하는 비영리 봉사 단체입니다.

## 대상
- 노숙자, 다문화 가정, 외국인 노동자, 주민등록 말소자, 의료보험 체불자 등 **의료 취약계층**
- 누구든지 상담을 받을 수 있으며, 도움을 받으신 일반 이용자분들께는 소액 기부 참여를 안내합니다.

## 주요 기능
- **AI 예진 (인턴 닥터 보듬)**: 카카오톡 1:1 채널에서 증상 청취 → Gemini AI가 경증/응급 분류(Triage)
- **자율 해결**: 경증은 AI가 홈케어 안내로 즉시 상담 종결
- **전문의 협진**: 위험 증상 감지 시 SOAP 차트 요약 → 의료진 단톡방 알림
- **추적 관찰 (F/U)**: 상담 후 자동 상태 점검, 악화 시 긴급 재알림
- **상담 기록**: Firebase Firestore에 모든 상담 내역 영구 보관

## 기술 스택
| 구성 | 기술 |
|---|---|
| Backend | Node.js, Express.js |
| AI/LLM | Google Gemini 2.5 Flash |
| Database | Firebase Firestore |
| Frontend | 카카오 i 오픈빌더 (Webhook) |
| 오픈톡방 봇 | 메신저봇R (MessengerBot R) |
| Hosting | Render (Free Tier) |

## 프로젝트 구조
```
happydoctor/
├── backend/
│   ├── index.js                 # Express 서버 (Keep-Alive 포함)
│   ├── routes/
│   │   ├── kakaoWebhook.js      # 카카오 오픈빌더 Webhook
│   │   └── messengerBot.js      # 메신저봇R 연동
│   ├── services/
│   │   ├── llmService.js        # Gemini AI 분석 (Triage + F/U)
│   │   ├── notifyService.js     # 의료진 알림 큐
│   │   ├── followUpService.js   # 추적 관찰 스케줄러
│   │   └── dbService.js         # Firebase Firestore 연동
│   └── package.json
├── docs/                        # 기획 문서
└── tasks/                       # 작업 관리
```

## 환경 변수 (.env)
```
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
MESSENGER_API_KEY=your_custom_secret_key
PORT=3000
RENDER_EXTERNAL_URL=https://your-app.onrender.com
```

## 실행
```bash
cd backend
npm install
npm start
```

## ⚠️ 면책 조항
본 상담은 대면 진료를 대신할 수 없습니다. 제공되는 정보는 일반적인 의학적 조언 및 정보 제공의 목적이며, 정확한 진단과 처방은 반드시 가까운 병원 또는 119를 통해 대면 진료를 받으셔야 합니다.

## 💛 후원
이 활동이 계속될 수 있도록 작은 응원을 보내주세요.
- [후원 링크 추가 예정]

---
*행복한 의사 — 의료 사각지대를 없애는 따뜻한 기술*
