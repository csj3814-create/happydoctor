const { randomUUID } = require('crypto');

// 임시 메모리 기반 큐 (실제 프로덕션에서는 Redis나 DB를 권장)
const messageQueue = [];

// F/U 환자 푸시 전용 큐 (MessengerBotR이 폴링하여 환자에게 직접 전송)
const fuPushQueue = [];

// userId ↔ roomName 매핑 (MessengerBotR이 등록)
const roomMapping = new Map();

/**
 * 발생한 예진 차트를 큐에 넣습니다.
 * @param {string} message 전문의 방으로 전송할 차트 텍스트
 * @param {string} patientId 환자 식별자(오픈빌더의 user_id 등)
 */
function enqueueDoctorNotification(message, patientId) {
    messageQueue.push({
        id: randomUUID(),
        message: message,
        patientId: patientId,
        timestamp: new Date()
    });
    console.log(`[Notification Enqueued] Patient: ${patientId}`);
}

/**
 * 큐에 쌓인 메시지를 하나 꺼내옵니다.
 * 메신저봇R이 주기적으로 폴링(polling)할 때 이 함수를 호출합니다.
 */
function dequeueDoctorNotification() {
    if (messageQueue.length > 0) {
        return messageQueue.shift();
    }
    return null;
}

/**
 * F/U 푸시 메시지를 환자 전송용 큐에 적재합니다.
 * MessengerBotR이 폴링하여 Api.replyRoom()으로 환자 카톡방에 직접 전송.
 */
function enqueueFUPush(userId, message) {
    const roomName = roomMapping.get(userId);
    if (!roomName) {
        console.warn(`[F/U Push] ${userId}의 roomName 매핑 없음 — pending F/U로 대기`);
        return false;
    }
    fuPushQueue.push({
        id: randomUUID(),
        userId,
        roomName,
        message,
        timestamp: new Date()
    });
    console.log(`[F/U Push Enqueued] ${userId} → room: ${roomName}`);
    return true;
}

/**
 * F/U 푸시 큐에서 메시지를 하나 꺼냅니다.
 */
function dequeueFUPush() {
    if (fuPushQueue.length > 0) {
        return fuPushQueue.shift();
    }
    return null;
}

/**
 * userId ↔ roomName 매핑을 등록합니다.
 */
function registerRoom(userId, roomName) {
    roomMapping.set(userId, roomName);
    console.log(`[Room Registered] ${userId} → ${roomName}`);
}

/**
 * userId로 roomName 조회
 */
function getRoomName(userId) {
    return roomMapping.get(userId) || null;
}

/**
 * 디버깅용 큐 상태 확인
 */
function getQueueStatus() {
    return {
        pendingCount: messageQueue.length,
        fuPushPending: fuPushQueue.length,
        registeredRooms: roomMapping.size
    };
}

module.exports = {
    enqueueDoctorNotification,
    dequeueDoctorNotification,
    enqueueFUPush,
    dequeueFUPush,
    registerRoom,
    getRoomName,
    getQueueStatus
};
