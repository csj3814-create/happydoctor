# Happy Doctor Project - Lessons Learned

*Update this file whenever a correction happens or a new pattern is established.*

## Persona and Tone
- **Lesson**: Do not use "수련의" as it is less common; use "인턴 닥터" instead.
- **Lesson**: Avoid naming specific doctors (like "최석재 교수님") in the public-facing or general scenario to encourage broader participation from other specialists. Use "해당 분야 전문의 선생님" instead.
- **Lesson**: Ensure the persona name is warm and approachable for Koreans (e.g., "보듬" rather than foreign-sounding "헵/Hepp").

## Architecture Decisions
- **Lesson**: Do not force doctors to install new apps (like Telegram) for notifications. Use Kakao Openchat combined with MessengerBot R, replicating the successful Habit Coach architecture.
- **Lesson**: Reuse Google Gemini API (`@google/generative-ai`) as it is both cost-effective and sufficient for SOAP note summarization, matching the reference project's success.

## Mission & Branding
- **Lesson**: 단체의 사회적 역할은 **의료 취약계층**(노숙자, 다문화 가정, 외국인 노동자, 주민등록 말소자, 의료보험 체불자 등)을 위한 봉사 활동임을 모든 대외 메시지에 명확히 한다.
- **Lesson**: 요셉의원은 '형식적 영감'일 뿐, 별개의 단체이므로 요셉의원을 앞세우거나 대놓고 연결짓지 않는다. 단체 정체성은 '의료 취약계층을 위한 자원봉사 의사들의 비영리 단체'로 독립적으로 표현한다.
- **Lesson**: 일반인 이용자를 거부하지 않되, 도움을 받은 이용자에게 소액 기부를 자연스럽게 안내하여 단체 지속성을 확보한다.
- **Lesson**: 기부 안내는 강요가 아닌 따뜻한 권유 톤으로. 의료 취약계층에게는 기부 안내 대신 "주변에 도움이 필요한 분이 계시면 이 채널을 알려주세요"로 대체한다.
- **Lesson**: Donation link는 아직 없음. 홈페이지 제작 시 함께 만들 예정. 그때까지 [DONATION_LINK] placeholder 사용하지 않기.

## Kakao OpenBuilder
- **Lesson**: 슬롯필링(되물음)에서 `sys.date` 엔티티는 "어제부터", "3일 전" 같은 자연어를 인식 못함. onset 같은 자유 텍스트 입력은 `sys.text`를 사용할 것.
- **Lesson**: `sys.image.url` 엔티티는 슬롯필링에 넣으면 이미지를 안 보내면 영원히 진행 불가. 선택적 입력은 슬롯필링에서 빼야 함.
- **Lesson**: 8개 블록 분리 → 단일 블록 슬롯필링으로 통합해야 파라미터 전달 문제 없음. 블록 간 context 전달은 비-스킬 블록에서 불가.
- **Lesson**: 바로연결 버튼의 타입이 "블록 연결"이면 슬롯필링 파라미터를 채우지 않음. "메시지" 타입으로 설정하여 사용자 발화로 인식되게 해야 함.
- **Lesson**: 콜백 사용(callback) 토글이 OFF면 callbackUrl이 안 와서 동기 모드로 빠짐 → 5초 타임아웃 발생. 반드시 ON 확인.
- **Lesson**: 스킬 서버 타임아웃 (1001) 에러는 대부분 Render 콜드스타트(50초+) 또는 API 할당량 초과가 원인.
- **Lesson**: 상담종료 블록의 되묻기 버튼(바로연결 응답) 텍스트가 그대로 `close_reason` 파라미터 값으로 전달된다. 서버 closeMessages 키를 버튼 텍스트와 정확히 일치시켜야 함. (예: "호전" ❌ → "증상 호전" ✅)

## Gemini API
- **Lesson**: `maxOutputTokens: 1024`는 한국어 JSON 응답에 너무 작음. SOAP 차트 포함 시 잘려서 JSON 파싱 실패 → 최소 2048 사용.
- **Lesson**: `responseMimeType: 'application/json'` 설정하면 Gemini가 순수 JSON만 반환 (```json 마크다운 불필요).
- **Lesson**: JSON 파싱 실패 시 fallback 응답 반환하여 환자에게 에러 대신 기본 안내 제공.
- **Lesson**: gemini-2.5-flash 무료 티어는 하루 20회 제한. 프로덕션에는 유료 전환 필수. 모델은 2.5 유지 (2.0으로 다운그레이드하지 말 것 - 사용자 지시).
- **Lesson**: `sys.*` 엔티티 이름이 그대로 파라미터 값으로 들어올 수 있음. 서버에서 sanitize 처리 필요.

## Render Deployment
- **Lesson**: Render 무료 티어는 비활성 시 서버가 꺼짐. 14분 keep-alive ping으로 완화하지만 완전 방지는 불가.
- **Lesson**: Root directory를 `backend`로 설정해야 함 (모노레포 구조).
- **Lesson**: Render 자동 배포 브랜치는 대시보드에서만 설정 가능. 이 프로젝트는 `claude/upbeat-tharp` 브랜치를 배포 중 → main 변경 시 양쪽 동시 push 필요: `git push origin main && git push origin main:claude/upbeat-tharp`
- **Lesson**: curl로 한국어 JSON 테스트 시 인코딩 문제 발생 가능. `\uXXXX` 유니코드 이스케이프 사용 또는 `--data-binary @-` + echo 파이프 방식 사용.
- **Lesson**: Render 배포 완료 확인은 헬스체크(/) 응답 변경 여부로 판단 (버전 스탬프 임시 추가 방법 유효).

## Domain & Canonical URL
- **Lesson**: Public homepage canonical should use the agreed primary brand domain (currently `happydoctor.kr`), not temporary Vercel deployment URLs like `*.vercel.app`.
- **Lesson**: If the product strategy separates Korean-first branding from future global expansion, use `happydoctor.kr` as the Korean primary domain now and reserve `happydoctors.net` for a later international site, but do not run duplicate public homepages on both domains at the same time.
- **Lesson**: For the current Happy Doctor strategy, prefer one multilingual public site under the primary domain instead of operating separate Korean and international homepages too early.
- **Lesson**: Reserve subdomains by product surface early: homepage on the root domain, future web app on `app.*`, and doctor portal on `portal.*`.

## Homepage UI
- **Lesson**: Keep browser tab branding consistent by removing default template favicon files and explicitly wiring Happy Doctor icon assets in Next metadata/app icon files.
- **Lesson**: In public Q&A lists, expose only a short question preview (about 50 characters) while keeping professional answers visible, to balance readability and privacy tone.
