/**
 * MessengerBot R 스크립트 for 해피닥터 카카오 운영
 *
 * 이 스크립트를 공기계 MessengerBot R 앱에 등록합니다.
 *
 * 기능:
 * 1) 환자 안내: 환자 오픈채팅방에서 1:1 카카오 채널로 안내
 * 2) 의료진 알림: 신규 차트 자동 푸시 + 수동 확인 명령
 * 3) 환자 채널 푸시: follow-up / 의사 답변 알림 전달
 *
 * 설정 체크:
 * - SERVER_URL 은 실제 Render 배포 URL과 같아야 합니다.
 * - API_KEY 는 서버의 MESSENGER_API_KEY 와 같아야 합니다.
 * - 의료진 알림방은 반드시 의료진 단톡방에서 `~알림방등록`으로 등록하세요.
 * - 개인톡 fallback 은 사용하지 않습니다.
 */

// ===== 설정 =====
const SERVER_URL = "https://happydoctor.onrender.com";
const API_KEY = "happydoctor_bot_2026_secret";
const CHANNEL_LINK = "http://pf.kakao.com/_PxaTxhX/chat";

const PATIENT_ROOM = "행복한의사";
const PATIENT_PUSH_POLL_INTERVAL_MS = 20 * 1000;

function postJson(path, payload) {
    return org.jsoup.Jsoup.connect(SERVER_URL + path)
        .header("Content-Type", "application/json")
        .header("x-api-key", API_KEY)
        .requestBody(JSON.stringify(payload))
        .ignoreContentType(true)
        .ignoreHttpErrors(true)
        .method(org.jsoup.Connection.Method.POST)
        .execute();
}

function callMessengerEndpoint(room, msg, sender, isGroupChat, command) {
    return postJson("/api/messengerbot", {
        room: room,
        msg: msg,
        sender: sender,
        isGroupChat: isGroupChat,
        command: command || null
    });
}

function acknowledgeDoctorNotification(notificationId, delivered, errorMessage) {
    if (!notificationId) return;

    try {
        postJson("/api/messengerbot/poll/ack", {
            notificationId: notificationId,
            delivered: delivered !== false,
            error: errorMessage || null
        });
    } catch (e) {
        // ack 실패는 lease 만료 후 재시도 경로가 있으므로 무시
    }
}

function acknowledgePatientChannelPush(queueId, delivered, errorMessage) {
    if (!queueId) return;

    try {
        postJson("/api/messengerbot/patient-push-poll/ack", {
            queueId: queueId,
            delivered: delivered !== false,
            error: errorMessage || null
        });
    } catch (e) {
        // ack 실패는 lease 만료 후 재시도 경로가 있으므로 무시
    }
}

function registerPatientRoom(userId, roomName) {
    try {
        postJson("/api/messengerbot/register-room", {
            userId: userId,
            roomName: roomName
        });
    } catch (e) {
        // 방 등록 실패는 다음 메시지에서 다시 시도
    }
}

function isPatientConversation(room, isGroupChat) {
    if (isGroupChat) return false;
    return room === PATIENT_ROOM || room.indexOf("행복한 의사") !== -1 || room.indexOf("행복한의사") !== -1;
}

function buildDoctorHelp() {
    return (
        "🤖 해피닥터 봇 도움말 (의료진/운영)\n" +
        "━━━━━━━━━━━━━━━\n" +
        "[의료진]\n" +
        "~차트확인   대기 중인 신규/미전달 차트 수동 조회\n" +
        "~알림방등록 현재 방을 자동 알림방으로 등록\n" +
        "~알림방확인 현재 등록된 자동 알림방 확인\n" +
        "※ 신규 차트는 10초마다 자동으로도 전송됩니다.\n\n" +
        "[공통]\n" +
        "~도움말    이 도움말 표시\n" +
        "━━━━━━━━━━━━━━━\n" +
        "👉 1:1 상담: " + CHANNEL_LINK
    );
}

function buildPatientHelp() {
    return (
        "🤖 해피닥터 봇 도움말 (환자 안내)\n" +
        "━━━━━━━━━━━━━━━\n" +
        "아파요 / 통증 / 복통 같은 증상 키워드를 쓰면\n" +
        "1:1 카카오 채널로 먼저 안내해 드립니다.\n\n" +
        "~상담  ~진료  직접 채널 안내 받기\n" +
        "~도움말 도움말 다시 보기\n" +
        "━━━━━━━━━━━━━━━\n" +
        "👉 1:1 상담: " + CHANNEL_LINK
    );
}

// ===== 메시지 수신 핸들러 =====
function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {
    var trimmedMsg = (msg || "").trim();

    if (isPatientConversation(room, isGroupChat) && sender) {
        registerPatientRoom(sender, room);
    }

    if (trimmedMsg === "~방이름") {
        replier.reply("📍 room: " + room);
        return;
    }

    if (trimmedMsg === "~도움말") {
        if (room === PATIENT_ROOM || isPatientConversation(room, isGroupChat)) {
            replier.reply(buildPatientHelp());
        } else if (isGroupChat) {
            replier.reply(buildDoctorHelp());
        } else {
            replier.reply("🤖 이 방에서는 해피닥터 봇 명령이 제한적으로 동작합니다.\n\n" + buildPatientHelp());
        }
        return;
    }

    if (room === PATIENT_ROOM) {
        var guideKeywords = [
            "~상담", "~진료", "아파요", "아픈데", "아프다", "아픕니다",
            "두통", "요통", "복통", "배아파", "기침", "설사", "구토",
            "가려", "가래", "열나", "출혈", "어지러", "호흡이",
            "진료주세요", "진료좀"
        ];
        for (var i = 0; i < guideKeywords.length; i++) {
            if (msg.indexOf(guideKeywords[i]) !== -1) {
                replier.reply(
                    "🙂 " + sender + "님 안녕하세요.\n\n" +
                    "증상 상담은 개인정보 보호를 위해\n" +
                    "아래 1:1 채널에서 진행합니다.\n\n" +
                    "👉 " + CHANNEL_LINK + "\n\n" +
                    "링크를 누르면 AI 인턴 보듬이가 먼저 도와드리고,\n" +
                    "필요하면 의료진 확인으로 이어집니다."
                );
                return;
            }
        }
    }

    if (trimmedMsg === "~알림방등록") {
        if (isPatientConversation(room, isGroupChat)) {
            replier.reply("⚠️ 환자 안내 채널에서는 알림방 등록을 사용할 수 없습니다.");
            return;
        }

        try {
            var registerConn = callMessengerEndpoint(room, trimmedMsg, sender, isGroupChat, "register_doctor_room");
            var registerData = JSON.parse(registerConn.body());
            if (registerData.reply) {
                replier.reply(registerData.reply);
            }
        } catch (e) {
            replier.reply("⚠️ 알림방 등록 중 오류: " + e.message);
        }
        return;
    }

    if (trimmedMsg === "~알림방확인") {
        if (isPatientConversation(room, isGroupChat)) {
            replier.reply("⚠️ 환자 안내 채널에서는 알림방 확인을 사용할 수 없습니다.");
            return;
        }

        try {
            var roomInfoConn = callMessengerEndpoint(room, trimmedMsg, sender, isGroupChat, "show_doctor_room");
            var roomInfoData = JSON.parse(roomInfoConn.body());
            if (roomInfoData.reply) {
                replier.reply(roomInfoData.reply);
            }
        } catch (e) {
            replier.reply("⚠️ 알림방 확인 중 오류: " + e.message);
        }
        return;
    }

    if (trimmedMsg === "~차트확인") {
        if (isPatientConversation(room, isGroupChat)) {
            replier.reply("⚠️ 환자 안내 채널에서는 차트 확인을 사용할 수 없습니다.");
            return;
        }

        try {
            var conn = callMessengerEndpoint(room, trimmedMsg, sender, isGroupChat, "confirm_doctor_notifications");
            var status = conn.statusCode();
            var chartRes = conn.body();

            if (status !== 200) {
                replier.reply("⚠️ 서버 응답 오류 (HTTP " + status + ")\n" + chartRes);
                return;
            }

            var data = JSON.parse(chartRes);
            if (data.reply) {
                replier.reply(data.reply);
            }
        } catch (e) {
            replier.reply("⚠️ 연결 오류: " + e.message);
        }
        return;
    }
}

// ===== 의료진 차트 폴링 (10초) =====
var doctorPollTimer = null;
var patientPushPollTimer = null;

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
                        try {
                            var targetRoom = data.roomName;
                            if (!targetRoom) {
                                java.lang.Thread.sleep(1000);
                                continue;
                            }

                            Api.replyRoom(targetRoom, data.reply);
                            acknowledgeDoctorNotification(data.notificationId, true, null);
                        } catch (deliveryError) {
                            acknowledgeDoctorNotification(
                                data.notificationId,
                                false,
                                deliveryError && deliveryError.message ? String(deliveryError.message) : "reply_room_failed"
                            );
                        }
                    }
                } catch (e) {
                    // 폴링 실패는 무시하고 다음 주기로 재시도
                }

                java.lang.Thread.sleep(10000);
            }
        }
    }));
    doctorPollTimer.setDaemon(true);
    doctorPollTimer.start();
}

function startPatientPushPolling() {
    if (patientPushPollTimer) return;

    patientPushPollTimer = java.lang.Thread(new java.lang.Runnable({
        run: function() {
            while (true) {
                try {
                    var pollRes = org.jsoup.Jsoup.connect(SERVER_URL + "/api/messengerbot/patient-push-poll")
                        .header("x-api-key", API_KEY)
                        .ignoreContentType(true)
                        .method(org.jsoup.Connection.Method.GET)
                        .execute()
                        .body();

                    var data = JSON.parse(pollRes);
                    if (data.hasNew) {
                        if (!data.queueId || !data.roomName || !data.message) {
                            acknowledgePatientChannelPush(data.queueId, false, "invalid_payload");
                            java.lang.Thread.sleep(PATIENT_PUSH_POLL_INTERVAL_MS);
                            continue;
                        }

                        try {
                            Api.replyRoom(data.roomName, data.message);
                            acknowledgePatientChannelPush(data.queueId, true, null);
                        } catch (deliveryError) {
                            acknowledgePatientChannelPush(
                                data.queueId,
                                false,
                                deliveryError && deliveryError.message ? String(deliveryError.message) : "reply_room_failed"
                            );
                        }
                    }
                } catch (e) {
                    // 폴링 실패는 무시하고 다음 주기로 재시도
                }

                java.lang.Thread.sleep(PATIENT_PUSH_POLL_INTERVAL_MS);
            }
        }
    }));
    patientPushPollTimer.setDaemon(true);
    patientPushPollTimer.start();
}

startDoctorPolling();
startPatientPushPolling();
