# 해피닥터 정식 오픈 최종 체크리스트

작성일: 2026-04-06  
기준 환경: 운영 라이브

## 1. 현재 판단

- [x] 홈페이지 [https://happydoctor.kr/ko](https://happydoctor.kr/ko) 접속 가능
- [x] 환자 앱 [https://app.happydoctor.kr](https://app.happydoctor.kr) 접속 가능
- [x] 의료진 포털 [https://portal.happydoctor.kr](https://portal.happydoctor.kr) 접속 가능
- [x] Render 백엔드 `/api/version` 확인 가능
- [x] 웹 상담 시작, 상태 확인, 상담 종료 흐름은 동작
- [x] 환자 F/U는 `15분`, `3시간`, `1일` 세 번만 가도록 제한
- [x] 의료진 단톡방 알림은 `즉시`, `5분`, `15분` 세 번만 가도록 제한

현재 상태 판단:
- 소프트 오픈 가능
- 대외 홍보를 붙인 정식 오픈은 운영 리허설 2개를 추가 통과한 뒤 진행 권장

## 2. 정식 오픈 전 필수 확인

### A. 기본 접속 확인

- [ ] 홈페이지 첫 화면이 모바일에서 정상 표시된다
- [ ] 환자 앱 첫 화면에서 `웹으로 상담 시작`, `카카오톡으로 상담하기`, `상태 확인하기` 버튼이 모두 정상 동작한다
- [ ] 포털 링크를 카카오톡 안에서 열 때 `open-browser` 유도 화면이 정상 보인다
- [ ] 포털은 기본 브라우저에서 Google 로그인 후 접근 가능하다

### B. 상담 흐름 확인

- [ ] 웹 상담 1건 생성
- [ ] 6자리 상태 코드가 발급된다
- [ ] 상태 확인 화면에서 접수 시각이 한국 시간으로 보인다
- [ ] 환자가 상태 화면에서 상담 종료를 직접 선택할 수 있다

### C. 의료진 알림 확인

- [ ] 공기계 MessengerBotR에 최신 [messengerbot_script.js](C:/SJ/antigravity/happydoctor/backend/messengerbot_script.js)가 반영되어 있다
- [ ] `2기 행복한 의사 의료봉사방`에서 `~알림방확인` 시 현재 방이 정상 표시된다
- [ ] 응급 또는 의사 확인 필요 상담 1건 생성 시 의료진 단톡방에 즉시 알림이 도착한다
- [ ] 의료진이 답변하지 않으면 5분 뒤, 15분 뒤까지만 재알림이 온다
- [ ] 개인톡으로 잘못 가는 fallback 이 발생하지 않는다

### D. 환자 답변 전달 확인

- [ ] 의료진 포털에서 답변 전송
- [ ] 환자 카카오 채널에 답변 안내가 전달된다
- [ ] 상태 확인 링크 또는 6자리 코드로 같은 상담을 다시 확인할 수 있다
- [ ] 환자가 답변 확인 후 상담 종료를 선택할 수 있다

### E. 경증 자동 해결 흐름 확인

- [ ] 자동 해결 경증 상담 1건 생성
- [ ] 의료진 단톡방에 불필요한 알림이 오지 않는다
- [ ] 환자 F/U 질문은 `15분`, `3시간`, `1일` 세 번까지만 간다
- [ ] 네 번째 추가 F/U 질문이 생기지 않는다

## 3. 소프트 오픈 시작 조건

아래가 모두 맞으면 소프트 오픈 시작 가능:

- [ ] 홈페이지, 환자 앱, 포털 모두 접속 가능
- [ ] 응급/의사확인 필요 상담 알림이 단톡방에 정상 도착
- [ ] 의료진 답변이 환자 채널로 정상 전달
- [ ] 경증 상담에서 의료진방 스팸 알림이 발생하지 않음
- [ ] 운영자 1명 이상이 첫 2~3일 동안 단톡방 알림을 모니터링 가능

## 4. 대외 홍보 포함 정식 오픈 조건

아래를 추가로 만족하면 대외 홍보 포함 정식 오픈 가능:

- [ ] 운영 리허설 2회 이상 연속 성공
- [ ] 공기계 MessengerBotR이 하루 이상 안정적으로 살아 있음
- [ ] 의료진 포털 응답/로그인 이슈가 반복되지 않음
- [ ] 카카오 인앱 브라우저에서 포털 진입 실패 시 외부 브라우저 유도 경로가 실제 단말에서 안정적임
- [ ] 운영팀이 장애 대응 연락 경로를 공유받음

## 5. 오픈 보류 조건

아래 중 하나라도 있으면 정식 홍보 오픈 보류:

- [ ] 의료진 알림이 단톡방으로 가지 않음
- [ ] 환자 답변 전달이 카카오 채널에서 확인되지 않음
- [ ] 포털 로그인 또는 답변 전송이 막힘
- [ ] 동일 상담에서 알림이 무한 반복됨
- [ ] 상태 확인 코드 또는 링크가 정상 조회되지 않음

## 6. 장애 발생 시 바로 볼 곳

### 라이브 표면

- 홈페이지: [https://happydoctor.kr/ko](https://happydoctor.kr/ko)
- 환자 앱: [https://app.happydoctor.kr](https://app.happydoctor.kr)
- 포털: [https://portal.happydoctor.kr](https://portal.happydoctor.kr)
- 포털 외부 브라우저 유도: [https://portal.happydoctor.kr/open-browser?next=%2F](https://portal.happydoctor.kr/open-browser?next=%2F)

### 백엔드 상태

- 버전: [https://happydoctor.onrender.com/api/version](https://happydoctor.onrender.com/api/version)
- 헬스체크: [https://happydoctor.onrender.com/healthz](https://happydoctor.onrender.com/healthz)

### 로컬에서 바로 확인할 파일

- [C:\SJ\antigravity\happydoctor\backend\routes\kakaoWebhook.js](C:\SJ\antigravity\happydoctor\backend\routes\kakaoWebhook.js)
- [C:\SJ\antigravity\happydoctor\backend\routes\messengerBot.js](C:\SJ\antigravity\happydoctor\backend\routes\messengerBot.js)
- [C:\SJ\antigravity\happydoctor\backend\services\notifyService.js](C:\SJ\antigravity\happydoctor\backend\services\notifyService.js)
- [C:\SJ\antigravity\happydoctor\backend\services\followUpService.js](C:\SJ\antigravity\happydoctor\backend\services\followUpService.js)
- [C:\SJ\antigravity\happydoctor\backend\messengerbot_script.js](C:\SJ\antigravity\happydoctor\backend\messengerbot_script.js)

## 7. 오픈 당일 추천 순서

1. 홈페이지, 앱, 포털 접속 확인
2. Render `/api/version` 리비전 확인
3. 의료진 단톡방 `~알림방확인`
4. 응급/의사확인 필요 테스트 상담 1건
5. 의료진 단톡방 즉시 알림 확인
6. 포털에서 답변 전송
7. 환자 카카오 채널 답변 전달 확인
8. 상태 화면에서 상담 종료 확인
9. 경증 상담 1건으로 의료진방 무알림 확인
10. 이상 없으면 소프트 오픈 시작

## 8. 결론

현재 해피닥터는 기능 개발보다 운영 안정화 단계에 가깝다.  
즉, 서비스는 이미 시작 가능한 수준이지만, 정식 홍보 전에는 `의료진 단톡방 자동 알림`과 `환자 답변 전달` 두 흐름을 실제 단말 기준으로 끝까지 통과시키는 것이 마지막 관문이다.
