const axios = require('axios');

async function testTriageWebhook() {
    const url = 'http://localhost:3000/api/kakao/triage-complete';

    console.log('--- [Test 1] 가벼운 소화불량 케이스 전송 (자율 해결 기대) ---');
    const mildPatient = {
        userRequest: { user: { id: 'patient_001' } },
        action: {
            params: {
                age: '20대',
                gender: '여성',
                chief_complaint: '속이 더부룩해요',
                onset: '어제 저녁부터',
                symptom_detail: '명치 쪽이 답답하고 꽉 막힌 느낌',
                nrs: '2',
                associated_symptom: '가스 차는 느낌, 트림 남',
                past_medical_history: '없음'
            }
        }
    };
    
    try {
        const res1 = await axios.post(url, mildPatient);
        console.log('✅ 응답 1 결과:');
        console.log(JSON.stringify(res1.data, null, 2));
    } catch (e) {
        console.error('Error 1:', e.response?.data || e.message);
    }

    console.log('\n--- [Test 2] 응급 흉통 케이스 전송 (전문의 협진 기대) ---');
    const severePatient = {
        userRequest: { user: { id: 'patient_002' } },
        action: {
            params: {
                age: '60대',
                gender: '남성',
                chief_complaint: '가슴이 쥐어짜듯 아파요',
                onset: '30분 전부터 갑자기',
                symptom_detail: '왼쪽 가슴 전체가 눌리는 듯 진땀이 나고 식은땀이 흐름',
                nrs: '9',
                associated_symptom: '호흡곤란, 어지러움',
                past_medical_history: '고혈압, 당뇨 약 복용 중, 5년 전 협심증 시술'
            }
        }
    };

    try {
        const res2 = await axios.post(url, severePatient);
        console.log('✅ 응답 2 결과:');
        console.log(JSON.stringify(res2.data, null, 2));
    } catch (e) {
        console.error('Error 2:', e.response?.data || e.message);
    }

    console.log('\n--- [Test 3] 전문의 단톡방 큐(Queue) 확인 차 메신저봇 통신 ---');
    try {
        const urlBot = 'http://localhost:3000/api/messengerbot';
        const botPayload = {
            room: '의료진 소통방',
            msg: '!차트확인',
            sender: '봉사자',
            isGroupChat: true
        };
        const res3 = await axios.post(urlBot, botPayload, { headers: { 'x-api-key': process.env.MESSENGER_API_KEY || 'your_custom_secret_key_for_messengerbot' } });
        console.log('✅ 방금 쌓인 큐 확인 결과:');
        console.log(res3.data.reply);
    } catch (e) {
        console.error('Error 3:', e.response?.data || e.message);
    }
}

testTriageWebhook();
