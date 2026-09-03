# 해피닥터 프로젝트 - 작업 교훈

*사용자 교정이 있거나 새 패턴이 생기면 이 파일을 갱신한다.*

## 페르소나와 톤
- **교훈**: 한국 사용자에게 낯선 표현보다 자연스럽고 익숙한 한국어 표현을 우선한다.
- **교훈**: 공개 문서나 일반 시나리오에서 특정 의사의 실명을 앞세우지 말고 `해당 분야 전문의` 같은 일반 표현을 사용한다.
- **교훈**: 페르소나 이름은 한국어 화자에게 따뜻하고 친근하게 들려야 한다. 외래어 느낌보다 `보듬`처럼 정서가 전달되는 이름을 우선한다.

## 아키텍처 결정
- **교훈**: 의사에게 Telegram 같은 새 앱 설치를 강요하지 않는다. Habit Coach에서 검증된 Kakao Openchat + MessengerBot R 구조를 우선 재사용한다.
- **교훈**: SOAP 요약에는 `@google/generative-ai` 기반 Gemini API를 우선 사용한다. 비용과 품질의 균형이 좋고 기존 레퍼런스와도 맞는다.

## 미션과 브랜딩
- **교훈**: 모든 대외 메시지는 해피닥터가 의료 접근성 취약계층을 위한 서비스라는 점을 먼저 드러낸다.
- **교훈**: 『응급의학과 1막 22장, 개척자들』은 실제 공저다. 일부 서점의 `최석재 저` 표시는 등록자가 한 명이어서 생긴 서지 표시이므로, 공개 프로필의 공저 표기를 단독 저서로 바꾸지 않는다.
- **교훈**: 해피닥터는 정식 병원이 아니라 의료 접근성 취약계층을 위해 자원봉사 의료진이 운영하는 비영리적 성격의 서비스로 표현한다.
- **교훈**: 일반 이용자에게 죄책감을 주는 방식이 아니라, 기다려 준 이용자에게 자연스럽게 감사와 취지를 전하는 방향으로 메시지를 쓴다.
- **교훈**: 후원 안내는 강요가 아니라 선택 권유의 톤으로 쓴다.
- **교훈**: 실제 후원 링크가 준비되기 전에는 `[DONATION_LINK]` 같은 placeholder를 문서나 UI에 남기지 않는다.
- **교훈**: 미션 문구는 `의료`, `입구` 같은 제도적 표현보다 `도움`, `손`처럼 더 따뜻하고 직접적인 표현을 우선한다.

## 카카오 오픈빌더
- **교훈**: 증상 시작 시점처럼 자연어가 섞인 입력은 `sys.date`보다 `sys.text`를 우선 고려한다.
- **교훈**: `sys.image.url` 엔티티는 블록 설정이 맞지 않으면 이미지 업로드 자체가 막힐 수 있으므로 입력 설계를 단순하게 유지한다.
- **교훈**: 블록을 과도하게 분리하지 말고, 필요한 경우 하나의 블록/컨텍스트 흐름으로 통합해 파라미터 전달을 안정화한다.
- **교훈**: 바로연결 버튼에서 파라미터가 안 채워지면 `블록 연결` 대신 `메시지` 액션으로 바꿔 실제 발화처럼 인식되게 한다.
- **교훈**: callback을 쓰는 플로우는 OpenBuilder에서 callback 설정이 켜져 있는지 항상 먼저 확인한다.
- **교훈**: 서버 타임아웃이나 `1001` 오류는 Render 콜드스타트나 외부 API 지연일 수 있으니, 봇 스크립트 문제로 단정하지 말고 인프라 지연도 함께 본다.
- **교훈**: 상담 종료 버튼 텍스트와 서버의 `close_reason` 매핑 문자열은 정확히 일치시킨다.

## Gemini API
- **교훈**: SOAP 차트까지 담는 JSON 응답에는 `maxOutputTokens: 1024`가 부족할 수 있으니 최소 `2048` 이상을 고려한다.
- **교훈**: `responseMimeType: 'application/json'`을 지정해 Markdown fence 없이 순수 JSON을 받는다.
- **교훈**: JSON 파싱이 실패하면 환자에게는 기본 안내 fallback을 주고, 서버에서는 파싱 실패를 명확히 기록한다.
- **교훈**: 운영 환경에서는 무료 티어 한도를 전제로 하지 않는다. 모델 품질은 2.5 계열을 유지한다.
- **교훈**: `sys.*` 엔티티 이름이 값으로 그대로 들어오는 경우를 대비해 서버에서 sanitize한다.

## Render 배포
- **교훈**: Render 무료 티어는 비활성 시 콜드스타트가 있으므로 keep-alive만으로 완전 해결된다고 가정하지 않는다.
- **교훈**: 모노레포 구조에서는 Render root directory를 `backend`로 명시한다.
- **교훈**: Render 자동 배포 브랜치는 임시 작업 브랜치가 아니라 기본 브랜치 `main` 하나로 유지하는 편이 운영과 배포 추적이 가장 단순하다.
- **교훈**: Render `/api/version`이 예전 커밋을 가리킬 때 원인을 곧바로 브랜치 설정으로 단정하지 말고, 현재 `Branch` 설정 화면과 최신 deploy 이벤트가 실제로 어떤 커밋에서 실패했는지 먼저 확인한다.
- **교훈**: Windows/PowerShell에서 JSON 테스트 시 인코딩 문제가 있으면 `\uXXXX` 이스케이프나 `--data-binary @-` 방식을 쓴다.
- **교훈**: 배포 확인은 루트 응답만 보지 말고 `/healthz`, `/api/version`처럼 버전이 보이는 경로로 확인한다.

## 도메인과 Canonical URL
- **교훈**: 공개 홈페이지 canonical은 임시 Vercel URL이 아니라 합의된 대표 도메인 `happydoctor.kr`를 사용한다.
- **교훈**: `happydoctors.net`은 국제 확장용으로 예약하되, 같은 시기에 중복 public homepage를 운영하지 않는다.
- **교훈**: 현재 전략에서는 별도 사이트를 늘리기보다 대표 도메인 아래 다국어 구조를 우선한다.
- **교훈**: 제품 표면별 서브도메인은 일찍 정한다. 루트는 홈페이지, `app.*`는 환자 앱, `portal.*`는 의료진 포털이다.

## 홈페이지 UI
- **교훈**: 행복한 의사 홈페이지는 최석재 개인 브랜드 사이트가 아니라 무료 의료상담 서비스의 공식 표면이다. 개인 네임밸류 전략을 반영할 때도 서비스 구조를 개인 홍보 허브로 바꾸지 말고, 대표 소개의 사실·링크 표기만 최소한으로 최신화한다.
- **교훈**: 브라우저 탭 브랜딩은 기본 template favicon을 제거하고 해피닥터 아이콘 파일을 명시적으로 연결해 맞춘다.
- **교훈**: 공개 Q&A에서는 질문 전문을 다 노출하지 말고 약 50자 미리보기만 보여주고, 전문의 답변은 노출 가능한 범위로 유지한다.
- **교훈**: 파비콘은 파일 크기보다 시각적 점유율이 중요하므로, 여백을 줄인 전용 아이콘을 쓴다.
- **교훈**: 모바일 홈페이지 첫 화면은 텍스트보다 비주얼이 먼저 들어오게 설계한다. 긴 설명과 카드가 이미지를 아래로 밀어내지 않게 한다.
- **교훈**: 공개 홈페이지에서 `카카오톡으로 상담하기` CTA는 카카오 노랑을 우선 사용하고, 웹 상담 CTA와 역할을 색으로도 구분한다.
- **교훈**: 포털과 앱처럼 분리된 웹 표면도 브라우저 탭 아이콘은 홈페이지와 같은 해피닥터 브랜드 아이콘 체계를 써서 기본 템플릿 아이콘이나 작은 favicon으로 보이지 않게 맞춘다.
- **교훈**: Next.js App Router 표면에 기존 `app/favicon.ico`가 남아 있으면 `metadata.icons`로 `icon.png`를 추가해도 브라우저가 `.ico`를 먼저 쓸 수 있다. 브랜드 아이콘을 바꿀 때는 `favicon.ico`까지 제거하거나 같이 교체해야 한다.
- **교훈**: 파비콘 태그가 이미 바뀌었는데도 브라우저 탭 아이콘이 그대로면, 파일 경로까지 새 이름으로 바꿔 캐시를 끊는다. 같은 `/icon.png` 경로를 계속 쓰면 시크릿 창에서도 옛 아이콘이 남을 수 있다.

## Firestore API 직렬화
- **교훈**: Firestore 문서 직렬화 시 `...doc.data()` 후에 `id: doc.id`를 마지막에 쓴다. 저장된 `id` 필드가 실제 문서 id를 덮어쓰지 않게 한다.
- **교훈**: 레거시 호환을 위해 오래된 식별자가 노출됐을 가능성이 있으면 상세 조회에 한 번 정도 fallback을 둔다.
- **교훈**: 목록은 열리는데 상세만 404인 경우, 단일 원인으로 단정하지 말고 `doc.id`, 저장된 `id`, `userId`까지 확인한다.
- **교훈**: Firestore 쿼리 오류를 `null`로 삼키지 않는다. 복합 인덱스 누락도 404처럼 보일 수 있으므로 예상 밖 DB 실패는 500으로 드러내는 편이 낫다.
- **교훈**: 상담별 회신 수가 작으면 복합 인덱스가 필요한 `where + orderBy`보다 동등 필터 후 메모리 정렬을 우선한다.

## 크로스 오리진 배포
- **교훈**: 새 프런트 도메인으로 옮긴 뒤에는 상태 코드만 보지 말고 `Access-Control-Allow-Origin` 헤더까지 확인한다.
- **교훈**: 포털 CORS는 단일 `PORTAL_ORIGIN` 문자열보다 허용 도메인 목록으로 관리한다.
- **교훈**: 포털처럼 항상 하나의 백엔드와만 통신하는 경우에는 브라우저 직접 호출보다 same-origin rewrite/proxy가 안전하다.
- **교훈**: 카카오 인앱 브라우저에서 Google 로그인처럼 보안 브라우저가 필요한 흐름은 직접 URL을 던지지 말고, 외부 브라우저 유도 전용 경유 페이지를 둔다.
- **교훈**: 로컬 빌드 통과만으로 “상태 조회가 해결됐다”고 판단하지 않는다. 실제 앱 도메인에서 프록시 API가 `404`가 아닌 `200`으로 뜨는지까지 확인해야 진짜 해결이다.
- **교훈**: 모노레포에서 Vercel 프로젝트가 여러 개인 경우, 저장소 루트와 하위 앱 디렉터리가 서로 다른 프로젝트에 링크돼 있을 수 있다. 배포 전 현재 링크가 어느 프로젝트를 가리키는지 먼저 확인한다.

## Vercel 프로젝트 설정
- **교훈**: Vercel이 `Framework Preset: Other`로 잡히면 Next.js도 `NOT_FOUND`를 낼 수 있으니 기본값을 믿지 않는다.
- **교훈**: `frontend/app` 같은 독립 Next.js 표면은 `vercel.json`에 `"framework": "nextjs"`를 명시해 둔다.
- **교훈**: 수동 생성 프로젝트를 나중에 Git 자동 배포로 바꿔야 하면, 대개는 새 Git-connected 프로젝트를 만들고 도메인을 넘기는 편이 더 깔끔하다.

## 환자 앱 메시징
- **교훈**: 환자 앱은 사전 문진 앱이나 증상 분류 도구처럼 보이면 안 된다. `의료 접근성 취약계층을 위한 무료 온라인 의료상담` 정체성을 먼저 드러낸다.
- **교훈**: AI, 상태 확인, 흐름 설명은 정체성을 보조하는 요소로만 배치한다.
- **교훈**: 공개 상태 화면과 환자용 웹앱은 같은 설명을 여러 번 반복하지 말고, 현재 상태·최근 답변·다음 행동처럼 꼭 필요한 정보만 남긴다.
- **교훈**: 새로 발급하는 상태 코드는 6자리로 단순화하되, 이미 발급된 8자리 코드와 기존 링크는 계속 열리도록 호환성을 유지한다.
- **교훈**: 한글 표면에서 날짜/시간을 보여줄 때는 로케일만 `ko-KR`로 맞추지 말고 시간대도 `Asia/Seoul`로 명시한다.
- **교훈**: 웹 상담 시작 화면에서는 다른 진입 채널을 다시 권하는 문구보다 현재 행동에 집중하게 하는 문구를 우선한다.
- **교훈**: 진한 배경 위 주요 CTA는 방문 상태나 웹뷰 기본 스타일과 무관하게 텍스트 색을 명시적으로 고정한다.

## 문서화
- **교훈**: 프로젝트 문서는 기본적으로 한글로 저장한다.
- **교훈**: handoff, todo, lessons 같은 운영 문서도 영어 제목이나 영어 위주 본문으로 남기지 않는다.
- **교훈**: 로컬 문서 경로를 안내할 때는 클릭용 파일 링크만 주지 말고, 원본 Windows 절대경로도 함께 적는다. Codex 앱에서 링크가 바로 반응하지 않아도 설치 문제로 오해하지 않게 한다.

## 이미지 문구
- **교훈**: 이미지 위에 직접 넣는 문구는 기본적으로 한글을 사용한다.
- **교훈**: 영어 문구는 영어 홈페이지나 영어 전용 표면에서만 사용한다.
- **교훈**: 한국어 중심 표면에서 쓰는 공유 이미지, 배너, 스크린샷 오버레이에 영어 문구를 임시로 넣지 않는다.
- **교훈**: 한국어 이미지 자산은 생성 직후 실제 렌더 결과를 열어 한글 줄간격, 박스 높이, 하단 안전 여백까지 확인한 뒤 완료 처리한다.
- **교훈**: 사용자가 원본 사진 파일 경로를 명시적으로 주고 민감정보 삭제가 필요 없다고 확인하면, 임의로 마스킹하지 말고 원본 사진을 그대로 사용한다.
- **교훈**: 사용자가 특정 직책·위촉·내부 역할이 비공개라고 정정하면, 공개 문서에서는 그 사실 자체를 전면에서 다루지 말고 공개 가능한 협력 사실 중심으로 서술을 다시 짠다.
- **교훈**: 공개용 사진에서 비공개 문서나 증빙이 보이면 단독 이미지는 제외하고, 현장 사진 안의 노출 부분만 블러 처리한 공개용 자산으로 다시 만든다.

## 환자 상태/알림
- **교훈**: 상태 확인 화면은 현재 상태만 보여주는 데서 끝내지 말고, 답변 확인 후 종료처럼 환자가 바로 선택할 다음 행동을 함께 제공해야 한다.
- **교훈**: 의료진 답변은 환자가 상태 화면을 스스로 다시 열 때까지 기다리지 말고, 카카오 채널 등 기존 상담 맥락으로 먼저 전달하는 경로를 유지해야 한다.
- **교훈**: 환자 앱 첫 화면은 같은 정체성 설명을 여러 구역에서 반복하지 말고, 무엇인지·누구를 위한지·어떻게 시작하는지만 한 번씩 짧게 보여준다.
- **교훈**: CTA 텍스트 색은 배경색마다 명시적으로 고정한다. 특히 흰 바탕 버튼은 검정 계열, 남색 바탕 버튼은 흰색으로 직접 지정한다.
- **교훈**: 라이브 리허설은 운영 알림을 울리지 않는 일반 안내형 상담으로 먼저 검증하고, 의료진 알림이 필요한 흐름은 테스트 전용 채널이나 스테이징이 준비된 뒤 진행한다.
- **교훈**: 환자 카카오 전달 기능은 서버 배포만으로 끝나지 않는다. MessengerBotR 공기계 스크립트 최신 반영 여부까지 함께 확인해야 실제 5분 폴링 전달이 살아난다.
- **교훈**: `api/messengerbot/poll`은 확인용이 아니라 소비형 엔드포인트다. 호출하면 대기 중 의료진 알림을 가져가므로, 실제 방 도달 여부를 보는 리허설에서는 기기가 먼저 충분히 소비할 시간을 준 뒤 최소 횟수로만 진단한다.
- **교훈**: 실제 운영 리허설에서 `requiresDoctorReview: true` 상담이 생성됐는데도 10~20초 안에 방 알림이 없으면, 서버보다 공기계 MessengerBotR 활성화/권한/방 식별자 쪽을 먼저 의심한다.
- **교훈**: 의료진 알림방 지정은 `~차트확인` 같은 조회 명령에 묶지 말고 `~알림방등록`처럼 명시적인 등록 명령으로만 바꾼다.
- **교훈**: 한국어 테스트 상담 데이터를 PowerShell 인라인 JSON으로 만들면 문자 인코딩이 깨져 `??`처럼 저장될 수 있으니, 운영 리허설은 실제 웹 입력이나 UTF-8 안전 방식으로 만든다.
- **교훈**: 카카오 인앱 브라우저에서 인증이 필요한 포털 링크는 감지가 애매하면 내부 웹뷰로 바로 넘기지 말고, 외부 브라우저 유도 화면에 안전하게 머물게 해야 한다.
- **교훈**: MessengerBotR과 서버가 주고받는 운영 명령은 한국어 발화 문자열 비교에 기대지 말고, `register_doctor_room` 같은 ASCII command 키를 함께 보내 안정적으로 분기한다.
- **교훈**: 의료진 알림 큐는 공기계가 폴링하는 순간 바로 소비하면 안 된다. `가져오기 → 카카오 전송 시도 → ack` 구조로 두고, 실패 시 재시도 가능 상태로 돌려놔야 알림 유실을 막을 수 있다.
- **교훈**: 의료진 알림 fallback 방 식별자에 개인톡 값을 하드코딩하지 않는다. 기본값은 비워 두고, 운영 중에는 서버에 등록한 단톡방을 우선 사용한다.
- **교훈**: MessengerBotR의 `isGroupChat` 값만 믿고 알림방 등록 명령을 막지 않는다. 오픈채팅/단톡에서 판정이 다를 수 있으므로 `~알림방등록`은 현재 방 기준으로 처리하고, 환자 채널만 명시적으로 제외한다.
- **교훈**: 의료진 알림방은 `roomName` 하나만 저장해 두지 말고 `kind`, `isGroupChat` 같은 메타데이터까지 함께 저장하고 검증해야 운영위원회 방이나 개인톡 오등록을 안전하게 막을 수 있다.
- **교훈**: MessengerBotR처럼 여러 기기가 동시에 폴링할 수 있는 구조에서는 pending 알림을 단순 조회 후 update 하면 중복 발송이 난다. 최소한 transaction 기반 claim으로 한 번에 한 기기만 가져가게 만들어야 한다.

- **교훈**: 의료진 단톡방 알림은 단톡방 특성을 감안해 즉시, 5분, 15분 세 번만 보내고 그 이후에는 반복하지 않는다.

- **교훈**: 환자 follow-up 질문도 의료진 알림처럼 무한 반복하지 말고, 15분·3시간·1일 세 번으로 명확히 제한한다.
- **교훈**: 의료진 단톡방 알림은 스케줄 자체를 제한하는 것만으로는 부족하다. 기기 지연이나 lease 만료로 due 알림이 여러 개 쌓일 수 있으므로, 전송 직전에도 같은 환자 기준으로 최신 1건만 남기고 나머지는 superseded 처리해야 한다.
- **교훈**: 의료진 단톡방 미리보기에서 마크다운/특수문자를 정리할 때 숫자 범위를 나타내는 `-`까지 지우면 `40-59세`, `4-6점` 같은 핵심 정보가 망가진다. 범위 표기는 보존하고 `~`만 `-`로 통일한다.
- **교훈**: 포털 로그인 권한은 허용 이메일 목록만 보지 말고, 미승인 의료진을 `승인 대기`로 저장한 뒤 대표자가 포털 안에서 직접 승인할 수 있는 흐름까지 함께 설계한다.
- **교훈**: 로그인 없는 환자 웹앱은 성공 결과를 화면 상태에만 들고 있지 말고, 최근 상담 세션과 문진 초안을 짧게 저장해 새로고침 실수에도 1시간 안에서는 그대로 복구되게 만든다.
- **교훈**: 사용자가 직접 수정한 공개용 사진을 다시 주면, 이전에 내가 가공한 자산보다 그 수정본을 우선 사용하고 문서의 사진 처리 설명도 현재 기준에 맞게 함께 갱신한다.
- **교훈**: 사용자가 단체의 공식 명칭을 정정하면, 보도자료와 메일 같은 대외 문서에서는 약칭 대신 그 공식 명칭을 제목과 첫 문단부터 일관되게 사용한다.
## 2026-04-08 추가 교훈
- **교훈**: 웹 상담 첫 화면에 이미지 첨부를 붙일 때는 폼 UI만 바꾸지 말고 프런트 프록시, 백엔드 라우트, multer 처리까지 `multipart/form-data` 경로를 끝까지 같이 바꿔야 한다.
- **교훈**: 업로드 허용 포맷은 프런트 `accept`와 백엔드 MIME 검사 기준을 반드시 맞춘다. 프런트에서 HEIC를 고를 수 있게 열어 두고 백엔드가 막으면 사용자에게는 그냥 저장 실패처럼 보인다.
- **교훈**: 상태 화면 실시간 갱신은 단순 polling만으로 끝내지 말고 `최초 로드`와 `새 답변 도착` 전환을 구분해 배너나 다음 행동을 보여줘야 사용자가 변화를 바로 인지한다.
- **교훈**: 카카오 `symptom_image`는 LLM 프롬프트에만 쓰지 말고 상담 `mediaItems`에도 같이 저장해야 포털, 상태 화면, 추후 협진 흐름에서 같은 자료를 일관되게 볼 수 있다.
- **Lesson**: If the start response shows a user-facing AI summary, the public status API must also expose that same summary so the status page can reconstruct the full journey after redirects or refreshes.
- **Lesson**: Polling indicators on the patient status page should stay secondary to the main content and be throttled so they do not flash on every background refresh.
- **Lesson**: When a doctor reply exists on the public status page, the doctor reply and next-action UI should outrank the AI first-reply summary in visual order so the most actionable update is seen first.
- **Lesson**: Mobile landing screens need explicit no-wrap/min-width rules for short action labels and deliberate headline line breaks; leaving hero copy to auto-wrap creates awkward two-line breaks on real devices.
- **Lesson**: Decorative mobile mockups on landing pages need their own small-screen size budget; if the shell is allowed to keep desktop padding and secondary cards, it quickly becomes taller than the story it is supposed to support.
- **Lesson**: If a landing page promises home-screen installation, the install guidance card should include the actual PWA install action instead of making users hunt for it elsewhere.
- **Lesson**: Process-step microcopy on landing mockups should describe a concrete user action; abstract phrasing like `걱정을 보냅니다` reads awkwardly compared with clearer inputs such as `궁금한 점을 남깁니다`.
- **Lesson**: Patient-facing landing pages should avoid technical platform terms like `PWA`; installation copy should use familiar language such as `앱으로 설치` or `홈 화면에 추가`.
- **Lesson**: If a patient-facing status endpoint shows a doctor reply, it must also acknowledge that reply as seen and clear any pending reply reminders; otherwise the portal will keep showing stale `미확인` states after a real patient view.
- **Lesson**: Doctor-reply patient alerts should not be one-shot for Kakao-linked patients; a small durable reminder cadence such as immediate, 5 minutes, and 15 minutes is safer than assuming the first ping will always be noticed.
- **Lesson**: Web-only public consultations should not promise SMS-style reply notifications unless the product actually collects a patient contact channel and has a real delivery integration behind it.
- **Lesson**: Patient reply-notification contact capture must stay explicit opt-in; the intake flow should proceed normally when the patient skips it, and the backend should reject any phone/contact data that is sent without matching consent.
- **Lesson**: When extending patient reply alerts beyond the existing Kakao room flow, keep Kakao as the primary path and treat opt-in phone delivery as a fallback queue that is cleared on any real patient view, follow-up, or close action.
## 2026-04-11 추가 교훈
- **교훈**: 오늘 할 일을 정리할 때는 `todo.md`의 미체크 항목만 그대로 읽지 말고, 최근 배포 성공 여부와 사용자가 이미 끝낸 운영 검증이 있는지 먼저 확인한 뒤 미완료로 제안한다.

## 2026-04-17 추가 교훈
- **교훈**: 외부 메일, 제휴 제안, 대외 연락처럼 실제 외부로 나가는 발송은 초안 작성과 발송 준비까지만 진행하고, 실제 전송은 반드시 사용자 승인 후에만 한다.

## 2026-05-19 추가 교훈
- **교훈**: `Forward Email` 무료 포워딩으로 대표 메일 수신은 빠르게 열 수 있지만, 답장 발신 주소까지 완전히 `@도메인`처럼 보이게 하려면 별도 `Send mail as` 또는 정식 메일 호스팅이 필요하다. 수신만 목적이면 무료 포워딩으로 충분하고, 발신 정체성까지 중요하면 처음부터 그 한계를 분명히 설명한다.

## 2026-05-21 추가 교훈
- **교훈**: 외부 번역 서비스의 웹페이지 번역 바로가기는 지역 제한이나 서비스 정책으로 깨질 수 있다. 환자 유입처럼 핵심 경로에는 제3자 웹 번역 링크를 의존하지 말고, 우리 제품 안에서 바로 동작하는 입력 흐름으로 연결해야 한다.
- **교훈**: 환자용 다국어 화면에서 브라우저 기본 `file` 입력을 그대로 노출하면 운영체제나 브라우저 로캘 문구가 섞여 번역이 깨져 보일 수 있다. 파일 업로드는 버튼과 빈 상태 문구를 우리가 제어하는 커스텀 UI로 감싸야 언어 일관성이 유지된다.
- **교훈**: 사용자가 상담 시작 전에 언어 카드를 고르면, 그 언어 선택은 입력 허용 힌트가 아니라 환자용 UI 전체 번역 신호로 다뤄야 한다. 다국어 진입에서 제목, 안내, 폼 라벨, 보조 문구가 영어에 남아 있으면 실제 지원 언어처럼 느껴지지 않는다.
- **교훈**: 홈페이지처럼 우리가 직접 언어 카드를 노출한 선택지는 런타임 번역 API나 메모리 캐시에만 기대지 않는다. 고정 UI 문구는 앱 내부의 안정적인 번역 사전을 우선 사용하고, 실시간 번역은 보조 경로로만 두어야 일본어처럼 특정 언어가 영어 fallback으로 떨어지지 않는다.
- **교훈**: 랜딩 히어로 첫 화면에서는 보조 카드가 본문 컬럼에 길게 붙어 우측 비주얼을 접히는 위치 아래로 밀지 않게 해야 한다. 데스크톱 균형이 깨지면 보조 정보는 히어로 아래 전폭 섹션으로 내리고, 우측은 주 비주얼 + 작은 오버레이 정보 조합으로 무게를 맞추는 편이 안정적이다.
- **교훈**: 히어로가 태블릿/모바일에서 세로 스택으로 바뀌면, 위쪽 텍스트 블록과 아래쪽 비주얼 카드의 기준축도 같이 맞춰야 한다. 비주얼은 가운데인데 미션 카피만 왼쪽에 남아 있으면 완성도가 떨어져 보이므로 스택 구간에서는 텍스트와 CTA도 같이 가운데 정렬하는 편이 자연스럽다.
## 2026-05-22 추가 교훈
- **교훈**: 대외 제휴 메일의 수신 호칭은 `사무국 또는 대외협력 담당자님`처럼 복수 선택지로 열어두지 말고, 실제로 읽는 사람이 바로 자기 메일로 느끼도록 단일 담당 호칭 하나로 정리한다.
- **교훈**: 대외 메일의 후속 CTA는 옵션을 여러 개 나열하기보다 `필요하시면 기관 내부 공유용 해피닥터 소개서를 보내드리겠습니다.`처럼 부담이 적고 한 번에 이해되는 한 문장으로 정리한다.
- **교훈**: 대외 메일 본문은 `공익적`, `출발한`, `보완 창구` 같은 선언형 표현을 길게 늘어놓기보다, 왜 이 기관에 연락했는지와 이용자가 실제로 어떻게 쓰는지를 짧고 구체적인 문장으로 먼저 보여줘야 사람이 직접 쓴 메일처럼 읽힌다.
- **교훈**: 메일 문장에 `같은 흐름에서`, `첫 연결 수단` 같은 추상적 제품 표현이 들어가면 바로 AI가 쓴 문장처럼 느껴진다. 대외 메일에서는 `1차 상담 후 추가 질문`, `응급실로 가야 할지, 외래를 가도 될지`처럼 실제 사람이 쓰는 구체적 상황 문장으로 바꿔야 한다.
- **교훈**: 1차 발송 후보 문구를 수정할 때는 지금 당장 보내는 4통만 보지 말고, 같은 묶음의 3·5·7·8번 템플릿과 링크 블록까지 함께 점검해야 다음 차수에서 같은 누락이 반복되지 않는다.
## 2026-06-04 Added Lesson
- **Lesson**: Delivery-room schemas can drift over time; if alert delivery depends on metadata like `kind` or `isGroupChat`, the read path must stay backward-compatible or auto-migrate legacy room documents before declaring the doctor alert room unregistered.
- **Lesson**: Firestore document IDs wrapped in double underscores such as `__operator_alerts__` are reserved in production. Use a normal ID like `operator_alerts` for operational room bindings, and when checking Korean room names from Windows scripts, verify the stored value rather than trusting console output alone.
- **Lesson**: When manually enqueueing Korean operational test messages from Windows PowerShell into Node stdin, do not type Korean literals directly in the here-string. Use a UTF-8 safe source such as existing Firestore data, Unicode escapes, or base64-decoded text, then verify stored code points before treating delivery as healthy.
- **Lesson**: Do not infer an operational alert destination from the most recently active MessengerBotR room. Medical volunteer group alerts and representative personal fallback alerts are separate destinations; each must be explicitly registered from the exact Kakao room that should receive that class of alert.
- **Lesson**: MessengerBotR can pass `isGroupChat=false` even from an actual Kakao group room. For high-trust operational rooms, validate the exact room-name pattern as a fallback while keeping public or patient rooms explicitly blocked.
- **Lesson**: Kakao room titles shown in the UI may not match the exact `room` string MessengerBotR sends to the backend; registration failures should show the received room name and trusted allowlists should cover narrow truncated title families when needed.
- **Lesson**: If the user confirms an odd MessengerBotR `room` value is actually the intended operational Kakao group, treat that value as the canonical delivery alias instead of assuming the user is in the wrong room; add only the exact alias to the trusted allowlist.
- **Lesson**: When a MessengerBotR group alias is shared with personal or family rooms, do not keep it as a trusted group destination. Route operational alerts to an explicitly registered personal alert room until a unique group room identifier is available.

## 2026-07-26 추가 교훈
- **교훈**: Google Play의 앱별 SDK 경고를 다룰 때는 라이브러리 버전만 보고 업데이트 계획부터 세우지 말고, 먼저 개발자 계정이 활성 상태인지 확인해야 한다. 비활성 계정 해지 상태에서는 앱 업데이트·게시 중단·표준 이전이 모두 막히므로 계정 복구 가능 기한과 새 계정 재게시 경로가 선행 과제다.
- **교훈**: Google Play 지원처럼 한국어 접수가 가능한 공식 창구에는 사용자가 바로 제출할 수 있도록 문의 제목과 본문을 한국어로 먼저 제공한다.

## 2026-07-28 추가 교훈
- **교훈**: 지원팀의 `개발자 계정 복구 완료` 메일만으로 게시 기능까지 복구됐다고 판단하지 않는다. Play Console 홈에서 개발자 인증 제한, 연락처 확인, 앱 만들기 잠금 상태를 직접 확인해야 한다.
- **교훈**: Google Play의 USD 25는 계정에 남는 잔액이나 구독료가 아니라 일회성 등록비다. 같은 계정이 복구된 경우 재결제가 아니라 남은 계정 인증 문제를 먼저 확인한다.
- **교훈**: 소규모 비영리 프로젝트라고 해서 조직 계정이나 D-U-N-S가 자동으로 부적합하다고 판단하지 않는다. 조직 규모가 아니라 법적으로 확인 가능한 조직명·주소·등록 형태가 있는지를 먼저 확인하고, 건강 앱의 조직 계정 의무 시행일도 함께 검토한다.
- **교훈**: 사용자가 공식 홈페이지에 단체 정보가 있다고 알려주면 법적 기반이 없다고 가정하지 말고, 먼저 라이브 푸터와 저장소에서 고유번호·대표자·주소·연락처를 확인한다. 고유번호증이 있는 비법인 비영리단체는 D-U-N-S 신청 가능성을 문서 기준으로 평가해야 한다.
## 2026-07-28 감사 후 실행 전환
- **Lesson**: 감사 결과에서 이미 구체적인 권장 작업 목록을 제시했고 사용자가 진행을 승인했다면, 같은 목록을 다시 요청하지 말고 바로 실행 계획으로 전환한다. 외부 계정·불가역 식별자처럼 사용자 입력이 반드시 필요한 지점만 분리해 확인한다.

## 2026-07-28 노출 자격증명 대응
- **Lesson**: 비밀번호 변경을 요청할 때는 먼저 어느 서비스의 계정인지와 현재 서비스가 살아 있는지까지 확인해 정확한 접속 경로를 알려준다. 종료된 레거시 사이트라면 변경 화면이 없을 수 있으므로, 호스팅 계정 잔존 여부와 다른 곳에서의 비밀번호 재사용 여부를 구분해 안내한다.
- **Lesson**: 도메인이 새 사이트로 리디렉션되더라도 원래 호스팅 상품이 종료된 것은 아닐 수 있다. `happydoctors.net`의 구 Cafe24 호스팅은 2026-10-15까지 유지되므로, 웹 경로 리디렉션과 원본 호스팅·관리자 계정의 생존 여부를 별개로 관리한다.

## 2026-07-28 D-U-N-S 문의 문안
- **Lesson**: 사용자가 외부 제출 문안을 직접 수정해 확정하면 기존 초안을 고집하지 말고, 사용자가 준 최신 문안을 문자 그대로 반영한 뒤 전송 결과를 확인한다.
- **Lesson**: 사용자가 외부 제출을 직접 완료했다고 알리면 성공 여부를 재확인하려고 제출 버튼을 다시 누르지 말고, 중복 전송 방지를 최우선으로 즉시 중단한다.

## 2026-09-01 알림 미도달 진단
- **교훈**: "알림이 안 왔다"는 신고를 발송 실패로 가정하지 않는다. 큐가 전부 `delivered`인데도 사용자가 못 볼 수 있다. 이번 원인은 실패가 아니라 **잘못된 목적지**였고(`delivery_rooms/doctor_room` 미등록 → 개인방 폴백), 상태값만 봤으면 놓쳤을 문제다. 큐 상태와 **실제 배달 목적지**를 항상 함께 확인한다.
- **교훈**: 알림 파이프라인은 적재·발송·목적지·수신 확인을 각각 따로 검증한다. 적재 성공과 사용자 인지 사이에 폴백 라우팅, 폴링 클라이언트 생존, 방 등록 상태 같은 독립 실패 지점이 있다.
- **교훈**: 사용자가 "AI가 작동 안 하는 것 같다"고 해도 먼저 git 이력을 확인한다. 보듬이 트리아지는 고장이 아니라 보안 강화 커밋 `d78e4e9`에서 의도적으로 제거된 상태였다. 의도된 제거를 버그로 오인해 되살리면 보안 결정을 되돌리게 된다.
- **교훈**: `attempts=0`인 pending 큐가 쌓여 있으면 발송 실패가 아니라 **워커가 아예 돌지 않는 것**이다. 자격증명 미설정으로 루프가 조용히 비활성화되는 경로(`isConfigured()` 가드)를 우선 의심한다.
- **교훈**: 알림 채널을 추가할 때는 기존 채널의 개인정보 원칙을 그대로 승계한다. 카카오 운영 알림이 건강정보를 제외했다면 메일도 제외해야 하고, 이를 문서가 아니라 테스트로 고정한다.

## 2026-09-01 침묵하는 실패를 복제하지 않기
- **교훈**: 침묵으로 인한 장애를 고치면서 새 채널을 추가할 때, 기존 채널의 "설정 없으면 조용히 무력화" 패턴을 그대로 따라가면 같은 장애를 다시 만든다. 이번에 추가한 메일 채널이 정확히 그랬다. 채널을 늘릴 때는 발송 경로와 함께 **상태 보고 경로**를 반드시 같이 만든다.
- **교훈**: 선택적 부가 기능의 설정 오류로 핵심 서비스를 기동 실패시키지 않는다. 의료 상담 접수는 알림 채널이 잘못 설정돼도 계속 받아야 한다. 기존 SOLAPI 패턴을 관성적으로 복사했다가, 사용자가 대시보드에서 손으로 입력하는 맥락에서는 위험하다는 것을 뒤늦게 확인했다.
- **교훈**: 사용자가 대시보드 스크린샷을 보내면 값을 넣을 위치를 안내하기 전에 **서비스가 맞는지부터 확인한다.** 저장소 이름·배포 URL·필수 환경변수(`FIREBASE_SERVICE_ACCOUNT`) 존재 여부로 대조한다. 같은 계정에 비슷한 구조의 다른 서비스가 있어 변수 이름이 일부 겹칠 수 있다.
- **교훈**: 이전 세션에서 스스로 작성한 운영 안내라도 git 이력과 배치되면 철회한다. `ea01485`와 lessons.md를 확인하지 않고 "단톡방으로 되돌리기"를 권했는데, 이는 가족방 유출을 막기 위한 의도적 결정을 되돌리는 안내였다.

## 2026-09-02 진단 스크립트 자체를 의심하기
- **교훈**: 진단 스크립트가 출력한 값을 근거로 결론 내리기 전에 **필드명이 실제로 존재하는지 확인한다.** `deliveryAttempts`라는 없는 필드를 읽어 전부 `0`이 나왔고, 그걸 "한 번도 시도되지 않음"으로 해석해 "설정 누락"이라는 정반대 결론에 도달했다. 실제로는 한 건이 854회 실패 중이었다. 낯선 컬렉션을 조회할 때는 먼저 `Object.keys()`로 스키마를 찍는다.
- **교훈**: 큐에서 특정 항목만 재시도 횟수가 높고 나머지가 전부 0이면 적체가 아니라 **head-of-line 차단**을 의심한다. 실패 시 `availableAt`을 뒤로 미루지 않고 상태만 되돌리면 그 항목이 영구히 큐 맨 앞을 점유한다.
- **교훈**: 재시도에는 반드시 상한과 죽은편지함이 있어야 한다. 무한 재시도는 실패를 감추는 것이 아니라 **다른 모든 작업까지 정지시킨다.**
- **교훈**: 초기화 단계의 예외가 백그라운드 루프 기동을 막지 않도록 분리한다. `initialize()`에서 첫 드레인이 실패해 `startProcessorLoop()`이 호출되지 않았고, 재시작마다 같은 건에서 실패해 3개월간 채널이 죽어 있었다.
- **교훈**: 밀린 알림을 재개할 때는 **경과 시간과 중복 단계를 함께 확인한다.** 리마인더가 단계별 문서로 큐잉되는 구조에서는 만료된 단계들이 한꺼번에 발송돼 동일 문자가 연속으로 간다.

## 2026-09-02 실패 사유를 버리지 않기
- **교훈**: 외부 API의 실패를 `error.message`만 저장하면 원인 규명이 불가능해진다. SOLAPI는 "failedMessageList를 확인하라"는 안내만 message에 담고 실제 사유는 별도 필드에 둔다. 벤더 오류를 저장할 때는 구조화된 상세 필드를 먼저 확인한다.
- **교훈**: 외부에서 온 문자열을 길이 제한 없이 저장하지 않는다. SDK 타입 검증 오류 하나가 Firestore 문서에 56KB로 들어갔다.
- **교훈**: 재시도로 해결될 수 없는 실패는 재시도 예산을 쓰지 않고 즉시 포기시킨다. 국내 문자 서비스로 해외 번호에 보내는 것은 5회를 시도해도 결과가 같다. 실패를 "일시적"과 "구조적"으로 나눠 다룬다.
- **교훈**: 채널을 선택할 때 수신자가 그 채널로 **도달 가능한지**를 큐잉 전에 판단한다. 그래야 폴백 체인이 다음 채널로 즉시 넘어간다. 큐에 넣고 실패시키면 폴백 기회를 잃는다.

## 2026-09-02 관측성 코드 자체를 검증하기
- **교훈**: 상태 보고 엔드포인트를 만들었으면 **실제 운영 데이터로 값이 맞는지 확인한다.** `oldestUnansweredAgeMinutes`가 미답변 67건에도 `null`을 반환했다. 목으로 만든 테스트는 ISO 문자열을 넣어 통과했지만, 실제로는 Firestore Timestamp가 와서 `Date.parse()`가 NaN을 냈다. 침묵을 없애려고 만든 코드가 조용히 틀린 값을 내고 있었다.
- **교훈**: 목 데이터의 타입을 실제 반환 타입과 일치시킨다. 원본 Firestore 문서를 반환하는 함수를 목으로 만들 때 직렬화된 형태를 쓰면 타입 불일치가 테스트를 통과한다.
- **교훈**: 재현 조건이 시간에 의존하면 진단 기회를 놓칠 수 있다. 재시도 예산이 새 진단 코드 배포 전에 소진돼 실패 사유를 못 잡았다. 진단용 계측을 배포할 때는 관측 대상이 아직 살아 있는지 확인하고, 필요하면 의도적으로 재현시킨다.

## 2026-09-04 증거 없이 결론을 바꾸지 않기
- **교훈**: 같은 장애를 두고 세 번 결론을 뒤집었다. 무한 대기 → "포트 차단" 단정 → IPv6 오류 보고 → "라우팅 문제, 한 줄이면 해결" 단정 → 주소별 실측 → 다시 포트 차단 확인. 첫 추정이 맞았지만 중간에 근거 없이 뒤집어 사용자를 혼란시키고 시간을 버렸다. **오류 메시지 하나는 마지막 시도만 알려줄 뿐 전체 그림이 아니다.**
- **교훈**: 벤더 라이브러리가 여러 대상을 순회 시도할 때, 노출되는 오류는 마지막 실패다. nodemailer는 IPv4를 먼저 시도하고 IPv6 오류를 보고했다. 원인을 특정하려면 **대상별로 개별 측정**해야 한다.
- **교훈**: 검증하지 않은 수정을 확정 표현으로 커밋하지 않는다. `family: 4`를 넣고 "makes mail leave at all"이라고 적었는데 실제로는 아무 효과가 없었다.
- **교훈**: 타임아웃과 연결 거부는 다른 신호다. **거부(ECONNREFUSED)는 도달했다는 뜻이고, 타임아웃은 패킷이 버려졌다는 뜻**이다. 방화벽 차단을 식별하는 기준으로 쓴다.
- **교훈**: PaaS에서 SMTP가 필요한 기능을 설계할 때는 아웃바운드 포트 정책을 먼저 확인한다. Render처럼 25/465/587을 막는 호스트에서는 HTTPS API 방식 발송이 유일한 경로다.
