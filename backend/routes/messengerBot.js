const express = require('express');
const router = express.Router();
const {
    claimDoctorNotification,
    acknowledgeDoctorNotification,
    confirmDoctorNotifications,
    dequeueFUPush,
    dequeuePatientChannelPush,
    registerRoom,
    registerDoctorRoom,
    getDoctorRoomName,
} = require('../services/notifyService');

const PORTAL_OPEN_IN_BROWSER_URL = 'https://portal.happydoctor.kr/open-browser?next=%2F';

function buildDoctorAlertPreview(message, priority = 'normal') {
    const headline = priority === 'urgent'
        ? '🚨 의료진 확인이 필요한 상담이 도착했습니다.'
        : '⏰ 의료진 답변이 아직 필요한 상담이 있습니다.';

    const preview = (message || '')
        .replace(/[~∼〜]/g, '-')
        .replace(/[*#`_>]/g, '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 6)
        .join('\n')
        .slice(0, 480);

    return preview ? `${headline}\n\n${preview}` : headline;
}

function buildPortalGuide() {
    return (
        "\n\n━━━━━━━━━━━━━━━\n" +
        "💻 해피닥터 포털에서 답변해 주세요!\n" +
        "👉 " + PORTAL_OPEN_IN_BROWSER_URL + "\n\n" +
        "[사용법]\n" +
        "1. 링크를 눌러 기본 브라우저에서 열기\n" +
        "2. Google 계정으로 로그인\n" +
        "3. 미답변 탭에서 환자 차트 확인\n" +
        "4. 답변 입력 → '환자에게 전송' 클릭\n" +
        "※ 카카오톡 안에서 안 열리면 우측 상단 메뉴의 브라우저 열기를 사용해 주세요."
    );
}

function normalizeDoctorRoomName(room) {
    return typeof room === 'string' ? room.trim().replace(/\s+/g, ' ').slice(0, 120) : '';
}

function buildDoctorRoomRegistrationErrorReply(validation) {
    switch (validation?.code) {
        case 'GROUP_CHAT_REQUIRED':
            return '개인톡은 의료진 자동 알림방으로 등록할 수 없습니다.\n의료진 단톡방에서 `~알림방등록`을 보내 주세요.';
        case 'BLOCKED_ROOM':
            return '운영위원회 방에는 상담 내용을 보내지 않습니다.\n의료진 단톡방에서 `~알림방등록`을 보내 다시 등록해 주세요.';
        default:
            return '알림방 이름을 다시 확인해 주세요.\n의료진 단톡방에서 `~알림방등록`을 다시 보내 주세요.';
    }
}

function checkApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const validKey = process.env.MESSENGER_API_KEY;

    if (!validKey) {
        console.error('[MessengerBotR Auth] MESSENGER_API_KEY 환경변수가 설정되지 않았습니다. 모든 요청을 거부합니다.');
        return res.status(503).json({ error: 'Service not configured' });
    }

    if (apiKey !== validKey) {
        return res.status(401).json({ error: 'Invalid API Key' });
    }

    next();
}

router.post('/', checkApiKey, async (req, res) => {
    const { room, msg, sender, isGroupChat, command } = req.body;
    const normalizedMsg = typeof msg === 'string' ? msg.trim() : '';
    const normalizedCommand = typeof command === 'string' ? command.trim().toLowerCase() : '';

    if (!normalizedMsg && !normalizedCommand) {
        return res.status(400).json({ error: 'No message provided' });
    }

    console.log(`[MessengerBot R] Room: ${room}, Sender: ${sender}, Message: ${normalizedMsg}, Command: ${normalizedCommand || '-'}`);

    const guideKeywords = ['~상담', '~진료', '아파요'];
    if (guideKeywords.some((kw) => normalizedMsg.includes(kw))) {
        const replyMsg =
            `안녕하세요 ${sender}님 🙂\n\n` +
            `'행복한 의사'는 의료 접근성 취약계층을 위해 의사들이 자원봉사로 운영하는 비영리 단체입니다.\n\n` +
            `증상 상담은 개인정보 보호를 위해 1:1 채널에서 진행합니다.\n\n` +
            `아래 링크로 상담을 시작해 주세요.\n👉 http://pf.kakao.com/_PxaTxhX/chat`;
        return res.status(200).json({ reply: replyMsg });
    }

    if (normalizedCommand === 'register_doctor_room' || normalizedMsg === '~알림방등록') {
        const registration = await registerDoctorRoom(room, {
            isGroupChat,
            registeredBy: sender,
        });

        if (!registration?.ok) {
            return res.status(200).json({
                reply: buildDoctorRoomRegistrationErrorReply(registration),
            });
        }

        return res.status(200).json({
            reply: `이 방을 해피닥터 의료진 알림방으로 등록했습니다.\n현재 등록 방: ${registration.roomName}\n이제 응급/협진 상담이 이 방으로 먼저 전달됩니다.`,
        });
    }

    if (normalizedCommand === 'show_doctor_room' || normalizedMsg === '~알림방확인') {
        const doctorRoomName = await getDoctorRoomName();
        if (!doctorRoomName) {
            return res.status(200).json({
                reply: '아직 등록된 의료진 자동 알림방이 없습니다.\n이 방에서 `~알림방등록`을 보내 등록해 주세요.',
            });
        }

        return res.status(200).json({
            reply: `현재 등록된 의료진 자동 알림방은 아래와 같습니다.\n📍 ${doctorRoomName}`,
        });
    }

    if (normalizedCommand === 'confirm_doctor_notifications' || normalizedMsg === '~차트확인') {
        try {
            const doctorRoomName = await getDoctorRoomName();
            if (!doctorRoomName) {
                return res.status(200).json({
                    reply: '아직 유효한 의료진 자동 알림방이 없습니다.\n의료진 단톡방에서 `~알림방등록`을 먼저 보내 주세요.',
                });
            }

            if (normalizeDoctorRoomName(room) !== doctorRoomName) {
                return res.status(200).json({
                    reply: `차트 확인은 등록된 의료진 알림방에서만 사용할 수 있습니다.\n현재 등록 방: ${doctorRoomName}`,
                });
            }

            const charts = await confirmDoctorNotifications();
            if (charts.length > 0) {
                return res.status(200).json({
                    reply: charts.map((c) => c.message).join('\n\n---\n\n') + buildPortalGuide(),
                });
            }

            return res.status(200).json({
                reply: '지금 수동 확인이 필요한 신규 차트는 없습니다.\n자동 알림방을 바꾸려면 해당 방에서 `~알림방등록`을 보내 주세요.',
            });
        } catch (e) {
            console.error('[차트확인 오류]', e);
            return res.status(200).json({
                reply: '차트 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
            });
        }
    }

    return res.status(200).json({});
});

router.get('/poll', checkApiKey, async (req, res) => {
    const roomName = await getDoctorRoomName();
    if (!roomName) {
        return res.status(200).json({ hasNew: false, reason: 'doctor_room_not_registered' });
    }

    const chart = await claimDoctorNotification();
    if (!chart) {
        return res.status(200).json({ hasNew: false });
    }

    return res.status(200).json({
        hasNew: true,
        notificationId: chart.notificationId,
        leaseId: chart.leaseId,
        roomName,
        reply: buildDoctorAlertPreview(chart.message, chart.priority) + buildPortalGuide(),
    });
});

router.post('/poll/ack', checkApiKey, async (req, res) => {
    const notificationId = (req.body?.notificationId || '').toString().trim();
    if (!notificationId) {
        return res.status(400).json({ error: 'notificationId required' });
    }

    await acknowledgeDoctorNotification(notificationId, {
        delivered: req.body?.delivered !== false,
        error: typeof req.body?.error === 'string' ? req.body.error.slice(0, 240) : null,
    });

    return res.status(200).json({ ok: true });
});

router.get('/fu-push-poll', checkApiKey, async (req, res) => {
    const fuItem = await dequeueFUPush();
    if (!fuItem) {
        return res.status(200).json({ hasNew: false });
    }

    return res.status(200).json({
        hasNew: true,
        roomName: fuItem.roomName,
        message: fuItem.message,
        userId: fuItem.userId,
        type: fuItem.type || 'follow_up',
    });
});

router.get('/patient-push-poll', checkApiKey, async (req, res) => {
    const item = await dequeuePatientChannelPush();
    if (!item) {
        return res.status(200).json({ hasNew: false });
    }

    return res.status(200).json({
        hasNew: true,
        roomName: item.roomName,
        message: item.message,
        userId: item.userId,
        type: item.type || 'general',
    });
});

router.post('/register-room', checkApiKey, async (req, res) => {
    const { userId, roomName } = req.body;
    if (!userId || !roomName) {
        return res.status(400).json({ error: 'userId and roomName required' });
    }

    await registerRoom(userId, roomName);
    return res.status(200).json({ ok: true });
});

module.exports = router;
