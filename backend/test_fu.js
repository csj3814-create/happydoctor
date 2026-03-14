const axios = require('axios');

async function testFollowUpWebhook() {
    const urlInitial = 'http://localhost:3000/api/kakao/triage-complete';
    const urlFU = 'http://localhost:3000/api/kakao/fu-reply';
    const botUrl = 'http://localhost:3000/api/messengerbot';
    
    const userId = 'patient_fu_001';

    console.log('--- [Step 1] 초기 흉통 환자 유입 (협진 및 F/U 스케줄링 예약 테스트) ---');
    const initialPatient = {
        userRequest: { user: { id: userId } },
        action: {
            params: {
                age: '50대', gender: '여성',
                chief_complaint: '가슴이 답답해요',
                onset: '1시간 전', symptom_detail: '뻐근함',
                nrs: '5', associated_symptom: '식은땀 약간',
                past_medical_history: '고혈압'
            }
        }
    };
    
    try {
        await axios.post(urlInitial, initialPatient);
        console.log('✅ 초기 접수 완료 (의사 큐에 적재 및 F/U 15분 예약 됨)');
    } catch (e) {
        console.error('Error 1:', e.response?.data || e.message);
    }

    // 큐 비우기 (테스트 목적)
    try {
        await axios.post(botUrl, { room: 'test', msg:'!차트확인', sender:'test', isGroupChat:true }, { headers: { 'x-api-key': process.env.MESSENGER_API_KEY || 'your_custom_secret_key_for_messengerbot' } });
    } catch(e) {}

    console.log('\n--- [Step 2] 15분 뒤 F/U 알림을 받은 환자가 "악화"되었다고 응답한 상황 ---');
    const fuPatientReply = {
        userRequest: { user: { id: userId } },
        action: {
            params: {
                nrs: '9', // 통증 악화
                additional_symptom: '이제는 숨쉬기도 힘들고 쓰러질 것 같아요'
            }
        }
    };

    try {
        const res2 = await axios.post(urlFU, fuPatientReply);
        console.log('✅ F/U 악화 응답 결과 (환자에게 가는 메세지):');
        console.log(JSON.stringify(res2.data, null, 2));
    } catch (e) {
        console.error('Error 2:', e.response?.data || e.message);
    }

    console.log('\n--- [Step 3] 전문의 단톡방 큐(Queue) 확인 (ESCALATE_FU 작동 확인) ---');
    try {
        const res3 = await axios.post(botUrl, {
            room: '의료진 소통방', msg: '!차트확인', sender: '봉사자', isGroupChat: true
        }, { headers: { 'x-api-key': process.env.MESSENGER_API_KEY || 'your_custom_secret_key_for_messengerbot' } });
        console.log('✅ 방금 쌓인 큐 확인 결과 (추가 악화 차트):');
        console.log(res3.data.reply);
    } catch (e) {
        console.error('Error 3:', e.response?.data || e.message);
    }
}

testFollowUpWebhook();
