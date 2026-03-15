require('dotenv').config();
const axios = require('axios');

const BASE = 'http://localhost:3000';
const API_KEY = process.env.MESSENGER_API_KEY;

async function testFUTimerFlow() {
    const userId = 'patient_timer_test';

    // Step 1: 경증 환자 접수 (자율 해결 → F/U 15분 예약)
    console.log('--- [Step 1] 경증 환자 접수 ---');
    await axios.post(`${BASE}/api/kakao/triage-complete`, {
        userRequest: { user: { id: userId } },
        action: {
            params: {
                age: '30대', gender: '남성',
                chief_complaint: '두통이 있어요',
                onset: '오늘 아침부터', symptom_detail: '관자놀이 쪽이 욱신욱신',
                nrs: '3', associated_symptom: '없음',
                past_medical_history: '없음'
            }
        }
    });
    console.log('✅ 접수 완료 (F/U 15분 예약됨)\n');

    // Step 2: 테스트용 엔드포인트로 F/U 타이머 즉시 실행
    console.log('--- [Step 2] F/U 타이머 수동 트리거 ---');
    await axios.post(`${BASE}/api/kakao/test-trigger-fu`, { userId });
    console.log('✅ F/U push 실행됨\n');

    // Step 3: 의료진 큐에 F/U 점검 알림이 들어왔는지 확인
    console.log('--- [Step 3] 의료진 큐 확인 (F/U 점검 알림) ---');
    const res3 = await axios.post(`${BASE}/api/messengerbot`, {
        room: '의료진 소통방', msg: '!차트확인', sender: '봉사자', isGroupChat: true
    }, { headers: { 'x-api-key': API_KEY } });
    console.log('큐 결과:', res3.data.reply, '\n');

    // Step 4: 환자가 다시 챗봇에 접속 — pending F/U 메시지가 표시되는지 확인
    console.log('--- [Step 4] 환자 재접속 시 pending F/U 확인 ---');
    const res4 = await axios.post(`${BASE}/api/kakao/triage-complete`, {
        userRequest: { user: { id: userId } },
        action: {
            params: {
                age: '30대', gender: '남성',
                chief_complaint: '아직 두통이 있어요',
                onset: '오늘 아침부터', symptom_detail: '좀 나아진 것 같기도',
                nrs: '2', associated_symptom: '없음',
                past_medical_history: '없음'
            }
        }
    });
    const responseText = res4.data.template?.outputs?.[0]?.simpleText?.text || '';
    if (responseText.includes('보듬입니다')) {
        console.log('✅ Pending F/U 메시지 정상 표시!');
        console.log('응답:', responseText);
    } else {
        console.log('❌ Pending F/U 없음 — 일반 상담으로 진행됨');
        console.log('응답:', responseText.substring(0, 100) + '...');
    }
}

testFUTimerFlow().catch(e => console.error('Test Error:', e.message));
