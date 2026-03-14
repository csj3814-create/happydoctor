// 추적 관찰(F/U) 일정을 관리하는 클래스 기반 서비스 모의 구현
// 실제 운영 환경에서는 Node-Cron, Redis, RabbitMQ 등으로 내구성을 보장해야 합니다.

class FollowUpService {
    constructor() {
        this.timers = new Map();
        this.patientDataStore = new Map(); // F/U 비교를 위해 환자의 1차 차트를 임시 보관
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
     * 지정된 시간이 지나면 환자의 카톡방으로 Push 알림(또는 알림톡)을 전송.
     * (현재는 콘솔 로그로 푸시 발송 대체 시뮬레이션)
     */
    executeFollowUpPush(userId) {
        console.log(`\n================================`);
        console.log(`⏰ [Kakao Push Notification Fired]`);
        console.log(`대상: ${userId}`);
        console.log(`메시지: "보듬입니다! 상담하신 지 시간이 좀 지났네요. 현재 통증 점수(NRS 1~10)는 아까보다 어떠신지 숫자만 눌러서 알려주시겠어요?"`);
        console.log(`================================\n`);
        
        // 실제 구현 시 카카오 Event API 또는 비즈메시지 전송 로직이 들어갑니다.
        // ex) axios.post('https://api.kakaowork.com/v1/...', {...});
        
        this.timers.delete(userId);
    }

    getOriginalChart(userId) {
        return this.patientDataStore.get(userId) || "이전 차트 기록 없음";
    }
}

const followUpService = new FollowUpService();
module.exports = followUpService;
