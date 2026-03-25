// Firebase Admin SDK 초기화 및 DB 서비스 모듈
const admin = require('firebase-admin');

// 1. Firebase Admin 초기화 (클라우드 환경 변수에 구동)
// Render 등에 배포할 때, 서비스 계정 키 JSON 파일 내용을 FIREBASE_SERVICE_ACCOUNT 환경변수로 넣어야 합니다.
let db = null;
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        db = admin.firestore();
        console.log('[Firebase] Firestore initialized successfully.');
    } else {
        console.warn('[Firebase] FIREBASE_SERVICE_ACCOUNT is missing. DB logging is disabled.');
    }
} catch (error) {
    console.error('[Firebase Init Error]', error);
}

/**
 * 챗봇 상담 결과를 Firestore에 영구 기록합니다. (happydoctors.net 웹사이트 연동용)
 * 
 * @param {string} userId - 카카오톡 사용자 고유 ID
 * @param {object} patientData - 환자가 직접 입력한 예진 데이터 세트 
 * @param {object} analysisResult - Gemini가 판단한 결과 (action, replyToPatient, soapChartForDoctor)
 */
async function logConsultation(userId, patientData, analysisResult) {
    if (!db) return; // DB 안 켜져 있으면 패스 (로컬 테스트용)

    try {
        const docRef = db.collection('consultations').doc(); // 자동 ID 생성
        
        await docRef.set({
            userId: userId, // 비식별화 또는 그대로 사용 (정책에 따라 다름)
            patientData: patientData, // 예: { age, gender, cc, nrs, symptom ... }
            aiAction: analysisResult.action, // 'AUTONOMOUS_REPLY' or 'ESCALATE'
            chatbotReply: analysisResult.replyToPatient, // 환자에게 나간 따뜻한 말
            doctorChart: analysisResult.soapChartForDoctor || "None", // 의사에게 넘어간 요약본 (경증이면 None)
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: "ACTIVE", // 진행 중 상태 (closeConsultation 시 COMPLETED로 변경됨)
            followUpLogs: [] // 추후 추적 관찰 결과를 배열로 누적
        });

        console.log(`[DB Logged] Consultation saved. Doc ID: ${docRef.id}`);
    } catch (error) {
        console.error('[DB Logging Error]', error);
    }
}

/**
 * F/U(추적 관찰) 결과를 기존 상담 로그에 추가합니다.
 */
async function logFollowUp(userId, fuAnalysis) {
     if (!db) return;

     try {
         // 가장 최근 상담 내역 찾기
         const snapshot = await db.collection('consultations')
             .where('userId', '==', userId)
             .orderBy('createdAt', 'desc')
             .limit(1)
             .get();

         if (snapshot.empty) {
             console.log(`[DB Warning] No previous consultation found for user ${userId} to log F/U.`);
             return;
         }

         const docRef = snapshot.docs[0].ref;
         
         await docRef.update({
             followUpLogs: admin.firestore.FieldValue.arrayUnion({
                 action: fuAnalysis.action,
                 timestamp: admin.firestore.Timestamp.now(),
                 alertMessage: fuAnalysis.fuChartForDoctor || "None"
             })
         });

         console.log(`[DB Logged] F/U result appended to Doc ID: ${docRef.id}`);
     } catch (error) {
         console.error('[DB F/U Logging Error]', error);
     }
}

/**
 * 상담을 종결 처리합니다. (status 업데이트 + 종결 사유 기록)
 */
async function closeConsultation(userId, reason) {
    if (!db) return;

    try {
        const snapshot = await db.collection('consultations')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if (snapshot.empty) return;

        const docRef = snapshot.docs[0].ref;
        await docRef.update({
            status: 'COMPLETED',
            closedAt: admin.firestore.FieldValue.serverTimestamp(),
            closeReason: reason || '환자 종결'
        });

        console.log(`[DB] Consultation closed for ${userId}, reason: ${reason}`);
    } catch (error) {
        console.error('[DB Close Error]', error);
    }
}

/**
 * 의사 포털에서 환자에게 답변을 저장합니다.
 * doctor_replies 컬렉션에 별도 저장 (seen:false 쿼리를 위해 배열 대신 컬렉션 사용)
 */
async function saveDoctorReply(consultationId, userId, message, doctorName) {
    if (!db) return null;
    const { randomUUID } = require('crypto');
    try {
        const docRef = db.collection('doctor_replies').doc();
        await docRef.set({
            id: docRef.id,
            consultationId,
            userId,
            message,
            doctorName: doctorName || '담당 의사',
            seen: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // consultation에도 replies 카운트 업데이트
        await db.collection('consultations').doc(consultationId).update({
            doctorRepliedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`[DB] Doctor reply saved for userId: ${userId}`);
        return docRef.id;
    } catch (error) {
        console.error('[DB Doctor Reply Error]', error);
        return null;
    }
}

/**
 * 환자에게 전달 안 된(seen:false) 의사 답변 조회
 */
async function getPendingDoctorReply(userId) {
    if (!db) return null;
    try {
        const snapshot = await db.collection('doctor_replies')
            .where('userId', '==', userId)
            .where('seen', '==', false)
            .limit(1)
            .get();
        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    } catch (error) {
        console.error('[DB GetPendingReply Error]', error);
        return null;
    }
}

/**
 * 환자가 확인한 답변을 seen:true로 마킹
 */
async function markReplyAsSeen(replyId) {
    if (!db) return;
    try {
        await db.collection('doctor_replies').doc(replyId).update({
            seen: true,
            seenAt: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('[DB MarkSeen Error]', error);
    }
}

/**
 * 의사 포털: 대기 중인 ESCALATE 상담 목록 조회
 */
async function getActiveConsultations() {
    if (!db) return [];
    try {
        const snapshot = await db.collection('consultations')
            .where('aiAction', '==', 'ESCALATE')
            .where('status', '==', 'ACTIVE')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('[DB GetActive Error]', error);
        return [];
    }
}

/**
 * 의사 포털: 상담 단건 조회
 */
async function getConsultationById(consultationId) {
    if (!db) return null;
    try {
        const doc = await db.collection('consultations').doc(consultationId).get();
        if (!doc.exists) return null;
        // doctor_replies도 함께 조회
        const repliesSnap = await db.collection('doctor_replies')
            .where('consultationId', '==', consultationId)
            .get();
        const replies = repliesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        return { id: doc.id, ...doc.data(), doctorReplies: replies };
    } catch (error) {
        console.error('[DB GetById Error]', error);
        return null;
    }
}

module.exports = {
    logConsultation,
    logFollowUp,
    closeConsultation,
    saveDoctorReply,
    getPendingDoctorReply,
    markReplyAsSeen,
    getActiveConsultations,
    getConsultationById,
    getDb: () => db,
    getAdmin: () => admin
};
