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
