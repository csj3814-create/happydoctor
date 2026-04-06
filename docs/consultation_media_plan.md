# 상담 미디어 업로드 계획

## 결론

- **웹앱에서는 가능**합니다.
  - 사진 업로드: 바로 구현 가능
  - 3분 이내 동영상 업로드: 구현 가능하지만, **웹 요청 안에서 바로 압축하지 말고 비동기 처리**로 가는 것이 안전합니다.
- **카카오에서는 사진은 가능**합니다.
  - 현재 해피닥터 코드에도 `symptom_image` 경로가 이미 남아 있고, `sys.image.url` 사용 경험이 있습니다.
- **카카오에서 동영상까지 직접 받는 것은 현재 설계 기준으로 권장하지 않습니다.**
  - 공식 문서에서 사진 입력 엔티티는 확인되지만, 동영상 입력을 같은 수준으로 안정적으로 받는 공식 경로는 이번 조사에서 확인하지 못했습니다.
  - 따라서 **카카오에서는 사진만 직접 받고, 동영상은 웹앱 업로드 링크로 넘기는 방식**이 가장 현실적입니다.

## 현재 코드 기준 관찰

### 1. 카카오 사진 입력 흔적은 이미 있음

- [kakaoWebhook.js](/C:/SJ/antigravity/happydoctor/backend/routes/kakaoWebhook.js) 에서 `merged.symptom_image`를 `patientData.symptomImage`로 받고 있습니다.
- [llmService.js](/C:/SJ/antigravity/happydoctor/backend/services/llmService.js) 에서도 `symptomImage`가 있으면 프롬프트에 `증상 사진`으로 포함합니다.
- 즉, **카카오 사진 입력은 기존 흐름을 확장하는 방식**으로 붙일 수 있습니다.

### 2. 웹앱 업로드는 아직 없음

- [public.js](/C:/SJ/antigravity/happydoctor/backend/routes/public.js) 는 현재 JSON 기반 문진만 받습니다.
- [app.js](/C:/SJ/antigravity/happydoctor/backend/app.js) 는 `express.json()`만 적용되어 있어, 현재 상태로는 multipart 업로드를 받지 못합니다.
- [route.ts](/C:/SJ/antigravity/happydoctor/frontend/app/app/api/public/consultations/route.ts) 도 JSON 프록시만 합니다.

### 3. 저장소는 Firebase 계열이 가장 자연스럽다

- [dbService.js](/C:/SJ/antigravity/happydoctor/backend/services/dbService.js) 에서 이미 `firebase-admin` 기반 Firestore를 쓰고 있습니다.
- 백엔드 lockfile에는 `@google-cloud/storage`가 포함되어 있어, **Firebase Storage / Google Cloud Storage 계열로 확장하는 방향이 가장 자연스럽습니다.**
- 현재는 `storageBucket` 초기화가 없으므로, **`FIREBASE_STORAGE_BUCKET` 환경변수와 버킷 설정이 추가로 필요**합니다.

## 권장 방향

## A. 카카오 채널

### 사진

- 카카오 상담 블록에서 **사진 1~3장 업로드**를 받을 수 있게 확장
- 저장 방식:
  1. 사용자가 사진 업로드
  2. OpenBuilder가 URL을 넘김
  3. 서버가 해당 URL을 읽어 Firebase Storage로 복사 저장
  4. Firestore 상담 문서에 메타데이터만 저장

### 동영상

- 카카오에서는 직접 수집을 기본 경로로 두지 않음
- 대신 아래처럼 안내:
  - `상처/움직임/호흡 소리처럼 영상이 더 도움이 된다면 아래 링크에서 3분 이내 영상을 첨부해 주세요.`
  - 링크는 `app.happydoctor.kr/upload?code=XXXXXX` 형태

이렇게 하면 카카오의 입력 제약과 대용량 업로드 문제를 모두 피할 수 있습니다.

## B. 웹앱

### 사진

- 상담 시작 폼 또는 상담 생성 직후 상태 화면에서 사진 업로드 지원
- 권장 제한:
  - 최대 3장
  - 장당 10MB 이하
  - JPEG / PNG / WEBP

### 동영상

- 상태 화면 또는 업로드 전용 화면에서 **3분 이내 영상 1개** 허용
- 권장 제한:
  - 원본 업로드 최대 200MB
  - MP4 / MOV 우선 허용

## 저장 및 압축 전략

## 원칙

- **원본은 오래 보관하지 않음**
- **압축본만 최종 보관**
- **메타데이터는 Firestore, 파일은 Firebase Storage**

## 추천 파이프라인

1. 사용자가 사진/동영상 업로드
2. 백엔드는 파일을 바로 로컬 디스크에 오래 두지 않고 **버킷의 임시 경로**에 저장
   - 예: `consultations/{consultationId}/raw/...`
3. Firestore에 `media_jobs` 문서 생성
4. **백그라운드 워커**가 작업 수행
   - 사진: 리사이즈 + 품질 조정
   - 동영상: ffmpeg로 720p/H.264/AAC 기준 압축
5. 압축본 저장
   - 예: `consultations/{consultationId}/processed/...`
6. Firestore의 상담 문서에 최종 미디어 메타데이터 반영
7. 원본 삭제

## 왜 비동기 워커가 필요한가

- Render는 기본적으로 **ephemeral filesystem** 환경입니다.
- Render 공식 문서도 로컬 파일 저장은 재배포/재시작 시 사라진다고 설명합니다.
- Render 공식 문서는 또한 **미디어 처리 같은 작업은 background worker로 분리**하는 방식을 권장합니다.
- 따라서 동영상 압축을 현재 웹 요청 처리 흐름 안에서 바로 수행하면:
  - 요청 시간 초과
  - CPU 과다 사용
  - 재시작/배포 시 중간 파일 유실
  위험이 큽니다.

즉, **동영상은 웹 서비스 즉시 처리보다 워커 처리**가 맞습니다.

## 데이터 모델 초안

상담 문서(`consultations`)에 아래 형태 추가:

```json
{
  "mediaItems": [
    {
      "id": "media_01",
      "kind": "image",
      "source": "web",
      "status": "ready",
      "contentType": "image/jpeg",
      "storagePath": "consultations/abc/processed/image-01.jpg",
      "downloadUrl": "https://...",
      "thumbnailUrl": "https://...",
      "createdAt": "..."
    },
    {
      "id": "media_02",
      "kind": "video",
      "source": "web",
      "status": "processing",
      "durationSec": 92,
      "storagePath": null,
      "createdAt": "..."
    }
  ]
}
```

## 구현 순서 제안

### 1단계: 웹앱 사진 업로드

- `FIREBASE_STORAGE_BUCKET` 추가
- Firebase Storage 업로드 유틸 추가
- 웹앱 상담 생성 후 사진 업로드 API 추가
- 포털/상태 화면에서 사진 썸네일 표시

### 2단계: 카카오 사진 업로드 연결

- OpenBuilder 사진 슬롯 정리
- 서버에서 URL → Storage 복사 저장
- 상담 문서에 사진 메타데이터 연결

### 3단계: 웹앱 동영상 업로드

- 업로드 전용 경로 추가
- `media_jobs` 큐 추가
- background worker에서 ffmpeg 압축
- 압축본만 유지, 원본 삭제

### 4단계: 카카오에서 동영상 웹 업로드 링크 연결

- 카카오 상담 중 `영상 첨부가 필요하면 웹 링크 열기` 버튼 추가
- 같은 상담 코드/추적 토큰으로 업로드 연결

## 바로 구현하지 말아야 할 방식

- Render 웹 요청 안에서 3분 영상을 바로 ffmpeg로 압축하는 방식
- 원본 동영상을 Render 로컬 디스크에만 저장하는 방식
- 카카오에서 동영상 입력 지원 여부를 확정하지 않은 채 설계에 넣는 방식

## 추천 최종안

- **카카오**: 사진 직접 업로드 + 동영상은 웹앱 링크로 유도
- **웹앱**: 사진/동영상 모두 지원
- **저장소**: Firebase Storage
- **메타데이터**: Firestore
- **동영상 처리**: Render background worker 또는 별도 비동기 워커

이 방식이 현재 해피닥터 인프라와 가장 잘 맞고, 의료 상담 흐름에도 무리가 적습니다.

## 참고 자료

- Firebase Storage 업로드: [Upload files with Cloud Storage on Web](https://firebase.google.com/docs/storage/web/upload-files)
- Firebase Storage 삭제: [Delete files with Cloud Storage on Web](https://firebase.google.com/docs/storage/web/delete-files)
- Firebase Admin Storage: [firebase-admin.storage package](https://firebase.google.com/docs/reference/admin/node/firebase-admin.storage)
- Firebase Admin bucket 참조: [Storage class](https://firebase.google.com/docs/reference/admin/node/firebase-admin.storage.storage)
- Render 파일시스템: [Persistent Disks – Render Docs](https://render.com/docs/disks)
- Render ephemeral filesystem: [Deploying on Render – Render Docs](https://render.com/docs/deploys/)
- Render background worker: [Background Workers – Render Docs](https://render.com/docs/background-workers)
- 카카오 챗봇 관리자센터 응답 포맷 레퍼런스: [skill-response-format](https://chatbot.kakao.com/docs/skill-response-format#intent)
- 카카오 오픈빌더 엔티티 레퍼런스: [key-concepts-entity](https://i.kakao.com/docs/key-concepts-entity)

## 확인 메모

- 카카오 공식 문서 공개 접근은 이번 조사에서 일부 페이지가 타임아웃되어 직접 본문까지 안정적으로 열리지는 않았습니다.
- 다만 현재 해피닥터 코드에 이미 `symptom_image` 경로가 있고, 기존 운영 교훈에도 `sys.image.url` 사용 경험이 있어 **카카오 사진 입력은 가능한 전제로 설계**해도 됩니다.
- 반대로 **카카오 동영상 입력은 공식 근거를 확보하지 못했으므로, 현재 설계에서는 미지원으로 보고 웹앱 업로드로 우회**하는 것이 안전합니다.
