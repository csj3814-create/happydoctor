// 추적 관찰(F/U) 일정을 관리하는 클래스 기반 서비스 모의 구현
// 실제 운영 환경에서는 Node-Cron, Redis, RabbitMQ 등으로 내구성을 보장해야 합니다.

const { enqueueDoctorNotification, enqueueFUPush } = require('./notifyService');

class FollowUpService {
    constructor() {
        this.timers = new Map();
        this.patientDataStore = new Map(); // F/U 비교를 위해 환자의 1차 차트를 임시 보관
        this.pendingFollowUps = new Map(); // 환자가 재접속 시 F/U 질문을 전달하기 위한 대기 플래그
    }

    /**
     * 1차 상담이 완료된 후, 설정된 시간 뒤에 카카오 알림톡(Event API 대체)으로 연락하도록 스케줄링.
     */
    scheduleFollowUp(userId, originalSoapChart, delayMinutes = 15) {
        if (this.timers.has(userId)) {
            clearTimeout(this.timers.get(userId));
        }

        // 1차 차트 보관
        this.patientDataStore.set(userId, originalSoapChart);

        const delayMs = delayMinutes * 60 * 1000;
        console.log(`[Follow-Up Scheduled] ${userId} 회원님, ${delayMinutes}분 뒤 상태 체크 예약 완료.`);

        const timerId = setTimeout(() => {
            this.executeFollowUpPush(userId);
        }, delayMs);

        this.timers.set(userId, timerId);
    }

    /**
     * 지정된 시간이 지나면:
     * 1) 의료진 큐에 "F/U 점검 시간 도래" 알림 발송 (의료진 인지용)
     * 2) pending F/U 플래그 저장 (환자 재접속 시 상태 질문 자동 표시)
     * 
     * 카카오 알림톡(유료) 또는 Event API(비즈 채널 전용)로
     * 환자에게 직접 Push하려면 아래 주석 부분을 활성화하세요.
     */
    executeFollowUpPush(userId) {
        console.log(`[F/U Timer Fired] ${userId} — 추적 관찰 시간 도래`);

        const originalChart = this.getOriginalChart(userId);
        const fuMessage = '보듬입니다! 상담하신 지 시간이 좀 지났네요. 현재 통증 점수(NRS 1~10)는 아까보다 어떠신지 알려주시겠어요? 다른 새로운 증상이 있다면 함께 적어주세요.';

        // 1) MessengerBotR을 통해 환자 카톡방에 직접 F/U 메시지 전송 시도
        const pushed = enqueueFUPush(userId, `⏰ ${fuMessage}`);

        if (!pushed) {
            // roomName 매핑이 없으면 의료진 큐에 F/U 점검 알림 발송 (폴백)
            enqueueDoctorNotification(
                `⏰ **[F/U 점검 알림]**\n환자 ${userId}의 추적 관찰 시간이 도래했습니다.\n\n${originalChart}\n\n📋 환자 방 매핑이 없어 직접 푸시가 불가합니다. 확인이 필요할 수 있습니다.`,
                userId
            );
        }

        // 2) 환자 재접속 시 F/U 질문을 보여주기 위한 대기 플래그 저장 (이중 안전장치)
        this.pendingFollowUps.set(userId, {
            message: fuMessage,
            createdAt: new Date()
        });

        this.timers.delete(userId);
    }

    getOriginalChart(userId) {
        return this.patientDataStore.get(userId) || "이전 차트 기록 없음";
    }

    /**
     * 환자 재접속 시 대기 중인 F/U 질문이 있으면 반환하고 플래그 제거.
     */
    consumePendingFollowUp(userId) {
        const pending = this.pendingFollowUps.get(userId);
        if (pending) {
            this.pendingFollowUps.delete(userId);
            return pending.message;
        }
        return null;
    }

    /**
     * 상담 종결 시 F/U 타이머 및 모든 대기 데이터를 삭제합니다.
     */
    cancelFollowUp(userId) {
        if (this.timers.has(userId)) {
            clearTimeout(this.timers.get(userId));
            this.timers.delete(userId);
        }
        this.pendingFollowUps.delete(userId);
        this.patientDataStore.delete(userId);
        console.log(`[F/U Cancelled] ${userId} — 상담종결로 추적관찰 취소`);
    }
}

const followUpService = new FollowUpService();
module.exports = followUpService;
