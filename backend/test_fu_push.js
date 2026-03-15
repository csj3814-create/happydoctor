require('dotenv').config();
const axios = require('axios');

const BASE = 'http://localhost:3000';
const API_KEY = process.env.MESSENGER_API_KEY;
const headers = { 'x-api-key': API_KEY };

async function testMessengerBotFUPush() {
    const userId = 'patient_push_test';
    const roomName = '환자_홍길동';

    // Step 1: 방 등록 (MessengerBotR이 환자 1:1 채팅방을 인지했을 때)
    console.log('--- [Step 1] 방 등록 (userId ↔ roomName 매핑) ---');
    const res1 = await axios.post(`${BASE}/api/messengerbot/register-room`, {
        userId, roomName
    }, { headers });
    console.log('결과:', res1.data);

    // Step 2: 환자 접수 (경증 → 자율 해결 + F/U 15분 예약)
    console.log('\n--- [Step 2] 환자 접수 ---');
    await axios.post(`${BASE}/api/kakao/triage-complete`, {
        userRequest: { user: { id: userId } },
        action: {
            params: {
                age: '40대', gender: '여성',
                chief_complaint: '목이 아파요',
                onset: '오늘 아침부터', symptom_detail: '삼키면 따끔거림',
                nrs: '3', associated_symptom: '미열 37.5도',
                past_medical_history: '없음'
            }
        }
    });
    console.log('✅ 접수 완료 (F/U 15분 예약)\n');

    // Step 3: F/U 타이머 수동 트리거
    console.log('--- [Step 3] F/U 타이머 수동 트리거 ---');
    await axios.post(`${BASE}/api/kakao/test-trigger-fu`, { userId });
    console.log('✅ F/U push 트리거됨\n');

    // Step 4: F/U 푸시 큐 폴링 (MessengerBotR이 하는 동작 시뮬레이션)
    console.log('--- [Step 4] F/U 푸시 큐 폴링 (fu-push-poll) ---');
    const res4 = await axios.get(`${BASE}/api/messengerbot/fu-push-poll`, { headers });
    console.log('폴링 결과:', JSON.stringify(res4.data, null, 2));

    if (res4.data.hasNew) {
        console.log(`\n✅ 성공! MessengerBotR이 이 데이터를 받아서:`);
        console.log(`   Api.replyRoom("${res4.data.roomName}", "${res4.data.message.substring(0, 50)}...")`);
        console.log(`   → 환자 카톡방에 직접 F/U 메시지 전송!`);
    } else {
        console.log('\n❌ 큐에 F/U 메시지 없음');
    }

    // Step 5: 큐가 비었는지 확인
    console.log('\n--- [Step 5] 큐 비었는지 재확인 ---');
    const res5 = await axios.get(`${BASE}/api/messengerbot/fu-push-poll`, { headers });
    console.log('재폴링:', res5.data.hasNew ? '❌ 아직 있음' : '✅ 큐 비었음');

    // Step 6: 의료진 큐에는 안 쌓였는지 확인 (roomName 매핑 있으므로 폴백 안됨)
    console.log('\n--- [Step 6] 의료진 큐 확인 (매핑 있으므로 비어야 정상) ---');
    const res6 = await axios.post(`${BASE}/api/messengerbot`, {
        room: '의료진방', msg: '!차트확인', sender: '봉사자', isGroupChat: true
    }, { headers });
    console.log('의료진 큐:', res6.data.reply);
}

testMessengerBotFUPush().catch(e => console.error('Error:', e.response?.data || e.message));
