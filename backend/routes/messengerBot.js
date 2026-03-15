const express = require('express');
const router = express.Router();
const { dequeueDoctorNotification, dequeueFUPush, registerRoom } = require('../services/notifyService');

// API Key 검사 미들웨어
function checkApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const validKey = process.env.MESSENGER_API_KEY;

    if (!validKey) {
        console.warn('[MessengerBotR Auth] MESSENGER_API_KEY 환경변수가 설정되지 않았습니다.');
        return next();
    }

    if (apiKey !== validKey) {
        return res.status(401).json({ error: "Invalid API Key" });
    }
    next();
}

/**
 * MessengerBot R Endpoint
 * 앱에서 메세지 수신 시 HTTP POST를 날려 이리로 옵니다.
 */
router.post('/', checkApiKey, (req, res) => {
    const { room, msg, sender, isGroupChat } = req.body;

    if (!msg) {
        return res.status(400).json({ error: "No message provided" });
    }

    console.log(`[MessengerBot R] Room: ${room}, Sender: ${sender}, Message: ${msg}`);

    // ===== 환자용 오픈채팅방 안내 (1:1 채널 유도) =====
    // 예시: 특정 방 이름이 "행복한 의사 (환자 소통방)" 일 때 작동하도록 거를 수 있습니다.
    const guideKeywords = ['!상담', '!진료', '아파요'];
    if (guideKeywords.some(kw => msg.includes(kw))) {
        const replyMsg = `안녕하세요, ${sender}님! 🩺\n'행복한 의사'는 의료 취약계층 환자분들을 위해 의사들이 자원봉사로 운영하는 비영리 단체입니다. 누구든지 편하게 상담하실 수 있습니다.\n\n구체적인 의료 상담이나 증상 문의는 개인정보 보호를 위해 '행복한 의사 상담 챗봇'을 통해 1:1로 질문해 주셔야 합니다.\n\n아래 링크를 눌러 1:1 채팅을 시작해주세요!\n👉 http://pf.kakao.com/_PxaTxhX/chat`;
        return res.status(200).json({ reply: replyMsg });
    }

    // ===== 의료진 카톡 단체방 알림 푸시 (Polling 응답) =====
    // 메신저봇이 "!확인" 과 같은 메세지를 보내거나 정기적으로 ping을 시도하면
    // 쌓여있는 차트를 응답으로 내려보냄.
    if (msg.trim() === '!차트확인' || msg.trim() === '!당직확인') {
        const latestChart = dequeueDoctorNotification();
        if (latestChart) {
            return res.status(200).json({ reply: latestChart.message });
        } else {
            return res.status(200).json({ reply: "✅ 대기 중인 신규 예진 차트가 없습니다." });
        }
    }

    // 그 외 일반 톡은 챗봇이 무응답
    res.status(200).json({});
});

/**
 * Polling Endpoint (의료진 차트)
 * 공기계(메신저봇R)가 특정 초(예: 3초)마다 백그라운드로 이 주소를 찔러서
 * 신규 알림이 있으면 리턴 받아 카톡방에 자동으로 쏘기 위한 용도로 제공.
 */
router.get('/poll', checkApiKey, (req, res) => {
    const latestChart = dequeueDoctorNotification();
    if (latestChart) {
        return res.status(200).json({ 
            hasNew: true, 
            reply: latestChart.message 
        });
    }
    res.status(200).json({ hasNew: false });
});

/**
 * F/U 푸시 폴링 엔드포인트
 * MessengerBotR이 주기적으로 호출하여 F/U 메시지가 있으면
 * 해당 roomName으로 Api.replyRoom()을 통해 환자에게 직접 전송.
 */
router.get('/fu-push-poll', checkApiKey, (req, res) => {
    const fuItem = dequeueFUPush();
    if (fuItem) {
        return res.status(200).json({
            hasNew: true,
            roomName: fuItem.roomName,
            message: fuItem.message,
            userId: fuItem.userId
        });
    }
    res.status(200).json({ hasNew: false });
});

/**
 * 방 등록 엔드포인트
 * MessengerBotR이 카카오 채널 1:1 채팅방에서 메시지를 수신하면
 * userId(sender)와 roomName을 서버에 등록하여 F/U 푸시 시 사용.
 */
router.post('/register-room', checkApiKey, (req, res) => {
    const { userId, roomName } = req.body;
    if (!userId || !roomName) {
        return res.status(400).json({ error: 'userId and roomName required' });
    }
    registerRoom(userId, roomName);
    res.status(200).json({ ok: true });
});

module.exports = router;
