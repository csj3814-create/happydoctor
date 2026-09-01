# 알림 채널 점검 결과와 이메일 알림 설정 (2026-09-01)

## 1. 무엇이 잘못돼 있었나

프로덕션 Firestore를 직접 조회해 확인한 사실입니다.

| 항목 | 상태 |
|---|---|
| `delivery_rooms/doctor_room` | **문서 없음 (미등록)** |
| `messenger_rooms/operator_alerts` | `가족-최석재` (개인방) |
| `doctor_notifications` | delivered 80 / cancelled 62 / notified 1 |
| `patient_channel_pushes` | delivered 20 / cancelled 5 |
| `patient_sms_notifications` | **pending 24 (attempts=0)** / cancelled 6 |
| 포털 미답변 | 67건 |

### 1-1. 의료진 알림이 단톡방에 가지 않았다
`resolveDoctorAlertDeliveryRoom()`은 개인 알림방을 먼저 확인하고, 없을 때만 의료진 단톡방을 씁니다.
개인 알림방(`가족-최석재`)만 등록돼 있고 단톡방은 등록된 적이 없어서, 모든 의료진 알림이
개인 카톡방 한 곳으로만 배달됐습니다. 배달 자체는 성공했기 때문에 큐에는 실패 흔적이 남지 않았습니다.

### 1-2. 알림이 최대 24시간 뒤 영구히 멈춘다
신규 상담 리마인더는 0/5/15분, 후속 푸시는 15분/3시간/24시간이 전부입니다.
그 창을 놓치면 미답변 상담은 다시 알림을 만들지 않습니다.

### 1-3. 환자 답변 SMS가 한 번도 발송되지 않았다
`SOLAPI_API_KEY` / `SOLAPI_API_SECRET` / `SOLAPI_SENDER`가 Render에 없어
`patientSmsService`의 발송 루프가 비활성 상태입니다. 24건이 claim조차 되지 않은 채 쌓였습니다.

### 1-4. 전체 발송이 안드로이드 폰 한 대에 걸려 있다
서버는 Firestore 큐에 적재만 하고, 실제 발송은 MessengerBot 폰이 `/api/messengerbot/poll`을
호출할 때만 일어납니다. 폰이 꺼지면 알림이 0건이 되고, 그 사실을 알릴 경로도 없었습니다.

### 1-5. 보듬이 AI는 고장이 아니다
`services/llmService.js`의 `analyzeAndRouteTriage()`는 LLM을 호출하지 않고 고정 문구만 반환합니다.
Play 출시 보안 강화 커밋 `d78e4e9`에서 AI 임상 응답 경로를 의도적으로 제거한 결과입니다.

## 2. 이번에 추가한 것

카톡 봇과 **독립적인** 이메일 경로를 붙였습니다. 폰이 꺼져 있어도 메일은 도착합니다.

- 새 상담·후속 접수 시 의료진 알림 메일 즉시 발송 (`services/emailService.js`)
- 미답변 상담 일일 요약 메일 (`services/unansweredDigestService.js`, 기본 매일 09:00 KST)
- 환자 답변 알림의 3단 폴백: 카카오 채널 → SMS → **이메일**
- 환자 상담 시작 폼에 답변 알림용 이메일 입력 추가

### 개인정보 원칙
의료진 알림 메일과 일일 요약 메일에는 **증상·차트·사진 등 건강정보를 담지 않습니다.**
"확인이 필요한 상담이 있다"는 사실과 접수 시각·대기일수·유입 경로, 그리고 포털 링크만 보냅니다.
기존 카카오 운영 알림과 동일한 원칙이며 테스트로 강제하고 있습니다.

## 3. Render 환경변수 설정

### 3-1. Gmail 앱 비밀번호 발급 (사용자 직접 작업)
1. Google 계정 → 보안 → 2단계 인증을 켭니다 (앱 비밀번호의 전제 조건).
2. 보안 → 앱 비밀번호 → 이름을 `happydoctor-alerts` 등으로 만들고 16자리를 받습니다.
3. 이 값은 저장소나 문서에 남기지 말고 Render 환경변수에만 붙여넣습니다.

### 3-2. Render → happydoctor 백엔드 → Environment

| 변수 | 값 | 필수 |
|---|---|---|
| `SMTP_USER` | 발송에 쓸 Gmail 주소 | 예 |
| `SMTP_PASS` | 위에서 만든 16자리 앱 비밀번호 | 예 |
| `SMTP_HOST` | 기본 `smtp.gmail.com` | 아니오 |
| `SMTP_PORT` | 기본 `465` (465=암시적 TLS, 그 외=STARTTLS) | 아니오 |
| `SMTP_FROM` | 표시용 발신자. 미설정 시 `SMTP_USER` | 아니오 |
| `ALERT_EMAIL_RECIPIENTS` | 알림 받을 주소 쉼표 구분. 미설정 시 `PORTAL_ADMIN_EMAILS` | 아니오 |
| `UNANSWERED_DIGEST_HOUR_KST` | 요약 발송 시각(KST). 기본 `9` | 아니오 |
| `UNANSWERED_DIGEST_ENABLED` | `false`로 요약만 끌 수 있음 | 아니오 |

`SMTP_USER`와 `SMTP_PASS`는 둘 다 있어야 메일이 켜집니다.
하나만 넣어도 **서버는 정상 기동하고 메일 채널만 비활성화**됩니다(2026-09-01 수정).
이유는 `/api/version`에 문자열로 표시되므로, 저장 후 아래 4절로 바로 확인하세요.

### 3-3. 함께 확인할 것
- `SOLAPI_API_KEY` / `SOLAPI_API_SECRET` / `SOLAPI_SENDER`: 세 개를 모두 넣어야 환자 SMS가 살아납니다.
  현재 pending 24건은 설정 직후 순차 발송됩니다. 오래된 건까지 한꺼번에 나가는 것이 곤란하면
  발송 전에 오래된 pending 문서를 정리해야 합니다.

## 4. 설정이 제대로 들어갔는지 확인하기

환경변수를 저장하고 재배포가 끝나면 브라우저에서 엽니다:

```
https://happydoctor.onrender.com/api/version
```

`notifications.email` 블록을 봅니다.

| 나온 값 | 뜻 | 할 일 |
|---|---|---|
| `"ready": true` | 정상. 메일이 실제로 나갑니다 | 없음 |
| `"configured": false, "issue": null` | 변수를 아예 안 넣었거나 재배포 전 | 변수 확인 후 재배포 |
| `"issue": "SMTP_USER and SMTP_PASS..."` | 한쪽만 저장됨 | 빠진 쪽 추가 |
| `"configured": true, "recipientCount": 0` | 보낼 곳이 없음 | `ALERT_EMAIL_RECIPIENTS` 추가 |

큐 적체와 미답변 경과 시간까지 보려면 (API 키 필요, 개인 식별 정보는 포함되지 않음):

```bash
curl -H "x-api-key: <MESSENGER_API_KEY>" https://happydoctor.onrender.com/api/notification-health
```

## 5. 카카오 알림 목적지에 대하여 (2026-09-01 정정)

**개인 알림방 `가족-최석재`는 사고가 아니라 의도적으로 선택된 목적지입니다.**
커밋 `ea01485`에서 개인방 우선으로 바꿨고, 이유는 `tasks/lessons.md`에 있습니다 —
의료봉사 단톡방 별칭이 개인·가족방과 공유돼서, 단톡방을 신뢰 목적지로 두면
상담 알림이 가족방으로 샐 수 있었습니다.

이 문서의 이전 판에는 "개인 알림방 등록을 해제하고 단톡방으로 돌린다"는 선택지가 있었으나
**철회합니다.** 그 안전 결정을 되돌리는 조치이고, 애초에 개인 알림방 해제 명령도 없습니다
(봇 명령은 `~알림방등록` / `~알림방확인` / `~차트확인` / `~개인알림등록` / `~개인알림확인` 뿐).

카톡 알림이 한 사람 한 채팅방에 몰리는 구조적 한계는 단톡방 복구가 아니라
**이메일 채널로 해소하는 것이 맞습니다.** 메일은 수신자 목록을 받고, 봇 폰과 무관하게 도착합니다.

## 6. 남은 권고 사항

- MessengerBot 폰의 마지막 폴링 시각(`lastPolledAt`)을 기록하는 코드가 아직 없습니다.
  `/api/notification-health`에 붙일 자리는 마련돼 있으나, 기록과 경고 발송은 다음 과제입니다.
- 미답변 리마인더가 24시간에서 끊기는 구조는 그대로입니다. 일일 요약이 이를 보완합니다.
- 답변 알림 이메일 입력 문구는 한국어·영어만 번역돼 있고, 나머지 16개 언어 번들은
  영어 문구로 대체 표시됩니다. 번역이 준비되면 `lib/start-copy-localized.ts`에 채우면 됩니다.
