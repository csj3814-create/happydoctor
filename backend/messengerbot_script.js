/**
 * MessengerBot R 스크립트 — '해피닥터 행복한 의사' 채널용
 *
 * 이 스크립트를 공기계의 MessengerBot R 앱에 등록합니다.
 *
 * 기능 2가지:
 * 1) 오픈채팅방 안내: "~상담", "아파요" 등 키워드 → 1:1 채널 안내
 * 2) 의료진 단톡방 차트: "~차트확인" → 서버에서 SOAP 차트 가져와서 방에 전송
 *
 * ※ 명령어 접두사를 "!"가 아닌 "~"로 사용합니다.
 *    같은 기기에서 구동 중인 해빛스쿨 봇과 충돌 방지용입니다.
 *
 * [설정 방법]
 * 1. MessengerBot R 앱에서 새 봇 생성
 * 2. 아래 스크립트를 복붙
 * 3. SERVER_URL과 API_KEY를 실제 값으로 변경
 * 4. 컴파일 → 활성화
 */

// ===== 설정 =====
const SERVER_URL = "https://happydoctor.onrender.com"; // Render 배포 URL
const API_KEY = "happydoctor_bot_2026_secret"; // .env의 MESSENGER_API_KEY와 동일하게
const CHANNEL_LINK = "http://pf.kakao.com/_PxaTxhX/chat"; // 카카오 채널 1:1 채팅 링크

// 의료진 단톡방 이름 (정확히 일치해야 함)
const DOCTOR_ROOM = "2기 행복한 의사 의료봉사방";
// 환자 오픈채팅방 이름
const PATIENT_ROOM = "행복한 의사의 응급상담방";
// 실험방 이름
const EXPERIMENT_ROOM = "해피닥터 AI 인턴 보듬 실험방";

// ===== 메시지 수신 핸들러 =====
function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {

    // [1] 환자 오픈채팅방 또는 실험방: 의료 키워드 → 1:1 채널 안내
    if (room === PATIENT_ROOM || room === EXPERIMENT_ROOM) {
        var guideKeywords = [
            "~상담", "~진료", "아파요", "아픈데", "아프다", "아픕니다",
            "통증", "두통", "복통", "열이", "기침", "설사", "구토",
            "다쳤", "다쳐", "피가", "출혈", "어지러", "숨이",
            "도와주세요", "도와줘"
        ];
        for (var i = 0; i < guideKeywords.length; i++) {
            if (msg.indexOf(guideKeywords[i]) !== -1) {
                replier.reply(
                    "🩺 " + sender + "님, 안녕하세요!\n\n" +
                    "증상 상담은 개인정보 보호를 위해\n" +
                    "아래 1:1 채팅에서 진행됩니다.\n\n" +
                    "👉 " + CHANNEL_LINK + "\n\n" +
                    "링크를 누르시면 AI 상담사 '보듬'이가\n" +
                    "증상을 여쭤보고, 필요하면 전문의\n" +
                    "선생님께 바로 연결해 드립니다. 😊"
                );
                return;
            }
        }
    }

    // [2] 의료진 단톡방 또는 실험방: 차트 확인
    if ((room === DOCTOR_ROOM || room === EXPERIMENT_ROOM) && (msg.trim() === "~차트확인" || msg.trim() === "~당직확인")) {
        try {
            var chartRes = org.jsoup.Jsoup.connect(SERVER_URL + "/api/messengerbot")
                .header("Content-Type", "application/json")
                .header("x-api-key", API_KEY)
                .requestBody(JSON.stringify({
                    room: room,
                    msg: msg.trim(),
                    sender: sender,
                    isGroupChat: isGroupChat
                }))
                .ignoreContentType(true)
                .method(org.jsoup.Connection.Method.POST)
                .execute()
                .body();

            var data = JSON.parse(chartRes);
            if (data.reply) {
                replier.reply(data.reply);
            }
        } catch (e) {
            replier.reply("⚠️ 서버 연결 오류: " + e.message);
        }
        return;
    }
}

// ===== 의료진 차트 폴링 (10초마다) =====
var doctorPollTimer = null;

function startDoctorPolling() {
    if (doctorPollTimer) return;

    doctorPollTimer = java.lang.Thread(new java.lang.Runnable({
        run: function() {
            while (true) {
                try {
                    var pollRes = org.jsoup.Jsoup.connect(SERVER_URL + "/api/messengerbot/poll")
                        .header("x-api-key", API_KEY)
                        .ignoreContentType(true)
                        .method(org.jsoup.Connection.Method.GET)
                        .execute()
                        .body();

                    var data = JSON.parse(pollRes);
                    if (data.hasNew && data.reply) {
                        // 의료진 단톡방에 차트 전송
                        Api.replyRoom(DOCTOR_ROOM, data.reply);
                    }
                } catch (e) {
                    // 폴링 실패는 무시
                }

                java.lang.Thread.sleep(10000); // 10초 대기
            }
        }
    }));
    doctorPollTimer.setDaemon(true);
    doctorPollTimer.start();
}

// 봇 시작 시 폴링 시작
startDoctorPolling();
