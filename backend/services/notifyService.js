const { randomUUID } = require('crypto');
const { getDb, getAdmin } = require('./dbService');

// F/U 환자 푸시 전용 큐 (메모리 — 서버 재시작 시 재등록됨)
const fuPushQueue = [];

// userId ↔ roomName 매핑 (메모리 — MessengerBotR이 메시지 올 때 재등록됨)
const roomMapping = new Map();

/**
 * 발생한 예진 차트를 Firestore 큐에 저장합니다.
 * (서버 재시작해도 데이터 유지)
 */
async function enqueueDoctorNotification(message, patientId) {
    const db = getDb();
    if (!db) {
        console.warn('[Notification] Firestore 없음 — 차트 저장 불가');
        return;
    }
    await db.collection('doctor_notifications').add({
        id: randomUUID(),
        message,
        patientId,
        status: 'pending',
        createdAt: getAdmin().firestore.FieldValue.serverTimestamp()
    });
    console.log(`[Notification Enqueued] Patient: ${patientId}`);
}

/**
 * Firestore 큐에서 가장 오래된 pending 차트를 꺼냅니다.
 * 꺼낸 즉시 'delivered'로 마킹하여 중복 전송을 방지합니다.
 */
async function dequeueDoctorNotification() {
    const db = getDb();
    if (!db) return null;

    const snapshot = await db.collection('doctor_notifications')
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'asc')
        .limit(1)
        .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    await doc.ref.update({
        status: 'delivered',
        deliveredAt: getAdmin().firestore.FieldValue.serverTimestamp()
    });
    return { message: doc.data().message, patientId: doc.data().patientId };
}

/**
 * F/U 푸시 메시지를 환자 전송용 큐에 적재합니다.
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
async function getQueueStatus() {
    const db = getDb();
    let pendingCount = 0;
    if (db) {
        const snapshot = await db.collection('doctor_notifications')
            .where('status', '==', 'pending')
            .get();
        pendingCount = snapshot.size;
    }
    return {
        pendingCount,
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
