/**
 * MessengerBot R 스크립트 — '행복한 의사' 채널용
 * 
 * 이 스크립트를 공기계의 MessengerBot R 앱에 등록합니다.
 * 
 * 기능 3가지:
 * 1) 오픈채팅방 안내: "!상담", "아파요" 등 키워드 → 1:1 채널 안내
 * 2) 의료진 단톡방 차트: "!차트확인" → 서버에서 SOAP 차트 가져와서 방에 전송
 * 3) F/U 환자 푸시: 30초마다 F/U 큐 폴링 → 해당 환자 카톡방에 직접 전송
 * 
 * [설정 방법]
 * 1. MessengerBot R 앱에서 새 봇 생성
 * 2. 아래 스크립트를 복붙
 * 3. SERVER_URL과 API_KEY를 실제 값으로 변경
 * 4. 컴파일 → 활성화
 */

// ===== 설정 =====
const SERVER_URL = "https://happydoctor.onrender.com"; // Render 배포 URL
const API_KEY = "YOUR_MESSENGER_API_KEY_HERE"; // .env의 MESSENGER_API_KEY와 동일하게
const CHANNEL_LINK = "http://pf.kakao.com/_PxaTxhX/chat"; // 카카오 채널 1:1 채팅 링크

// 의료진 단톡방 이름 (정확히 일치해야 함)
const DOCTOR_ROOM = "2기 행복한 의사 의료봉사방";
// 환자 오픈채팅방 이름
const PATIENT_ROOM = "행복한 의사의 응급상담방";

// ===== 메시지 수신 핸들러 =====
function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {
    
    // [1] 환자 오픈채팅방에서만: 의료 키워드 → 1:1 채널 안내
    if (room === PATIENT_ROOM) {
        var guideKeywords = [
            "!상담", "!진료", "아파요", "아픈데", "아프다", "아픕니다",
            "통증", "두통", "복통", "열이", "기침", "설사", "구토",
            "다쳤", "다쳐", "피가", "출혈", "어지러", "숨이",
            "상담", "진료", "병원", "응급", "도와주세요", "도와줘"
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

    // [2] 의료진 단톡방: 차트 확인
    if (msg.trim() === "!차트확인" || msg.trim() === "!당직확인") {
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

    // [3] 1:1 채널 채팅방에서 메시지 수신 시 → 서버에 방 이름 등록 (F/U 푸시용)
    //     카카오 채널 1:1 채팅은 isGroupChat = false
    if (!isGroupChat && room !== DOCTOR_ROOM) {
        try {
            // sender 이름을 userId처럼 사용 (카카오 오픈빌더 userId와는 다름)
            // 실제로는 카카오 채널 관리자 화면의 방 이름(room)으로 매핑
            org.jsoup.Jsoup.connect(SERVER_URL + "/api/messengerbot/register-room")
                .header("Content-Type", "application/json")
                .header("x-api-key", API_KEY)
                .requestBody(JSON.stringify({
                    userId: sender, // 참고: 오픈빌더 userId와 다를 수 있음
                    roomName: room
                }))
                .ignoreContentType(true)
                .method(org.jsoup.Connection.Method.POST)
                .execute();
        } catch (e) {
            // 등록 실패해도 메시지 흐름에 영향 없도록 무시
        }
    }
}

// ===== F/U 환자 푸시 폴링 (30초마다) =====
// MessengerBot R의 타이머 기능 사용
var fuPollTimer = null;

function startFUPolling() {
    if (fuPollTimer) return;
    
    fuPollTimer = java.lang.Thread(new java.lang.Runnable({
        run: function() {
            while (true) {
                try {
                    var fuRes = org.jsoup.Jsoup.connect(SERVER_URL + "/api/messengerbot/fu-push-poll")
                        .header("x-api-key", API_KEY)
                        .ignoreContentType(true)
                        .method(org.jsoup.Connection.Method.GET)
                        .execute()
                        .body();
                    
                    var data = JSON.parse(fuRes);
                    if (data.hasNew && data.roomName && data.message) {
                        // 환자 카톡방에 F/U 메시지 직접 전송
                        Api.replyRoom(data.roomName, data.message);
                    }
                } catch (e) {
                    // 폴링 실패는 무시 (네트워크 오류 등)
                }
                
                java.lang.Thread.sleep(30000); // 30초 대기
            }
        }
    }));
    fuPollTimer.setDaemon(true);
    fuPollTimer.start();
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
startFUPolling();
startDoctorPolling();
