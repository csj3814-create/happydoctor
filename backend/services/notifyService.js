// 임시 메모리 기반 큐 (실제 프로덕션에서는 Redis나 DB를 권장)
const messageQueue = [];

/**
 * 발생한 예진 차트를 큐에 넣습니다.
 * @param {string} message 전문의 방으로 전송할 차트 텍스트
 * @param {string} patientId 환자 식별자(오픈빌더의 user_id 등)
 */
function enqueueDoctorNotification(message, patientId) {
    messageQueue.push({
        id: Date.now().toString(),
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
 * 디버깅용 큐 상태 확인
 */
function getQueueStatus() {
    return {
        pendingCount: messageQueue.length
    };
}

module.exports = {
    enqueueDoctorNotification,
    dequeueDoctorNotification,
    getQueueStatus
};
