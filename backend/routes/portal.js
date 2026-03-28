const express = require('express');
const router = express.Router();
const {
    getActiveConsultations, getConsultationById, saveDoctorReply,
    awardHDT, getHDTLeaderboard, getDoctorStats, HDT_REPLY,
    getAdmin
} = require('../services/dbService');

// 허용된 의사 이메일 목록 (Render 환경변수 ALLOWED_DOCTOR_EMAILS에 콤마 구분으로 입력)
function getAllowedEmails() {
    const raw = process.env.ALLOWED_DOCTOR_EMAILS || '';
    return raw.split(',').map(e => e.trim()).filter(Boolean);
}

/**
 * Google OAuth 토큰 검증 미들웨어
 * 프론트엔드에서 Firebase Auth로 로그인 후 ID 토큰을 Authorization: Bearer <token> 헤더로 전달
 */
async function requireDoctorAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: '인증 토큰이 없습니다.' });
    }

    const idToken = auth.slice(7);
    try {
        const decoded = await getAdmin().auth().verifyIdToken(idToken);
        const email = decoded.email || '';
        const allowed = getAllowedEmails();

        if (allowed.length > 0 && !allowed.includes(email)) {
            return res.status(403).json({ error: '접근 권한이 없습니다.' });
        }

        req.doctor = { uid: decoded.uid, email, name: decoded.name || email };
        next();
    } catch (e) {
        console.error('[Portal Auth Error]', e.message);
        return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }
}

/**
 * GET /api/portal/consultations
 * ESCALATE + ACTIVE 상태 환자 목록
 */
router.get('/consultations', requireDoctorAuth, async (req, res) => {
    try {
        const list = await getActiveConsultations();
        // createdAt Timestamp → ISO string 변환
        const result = list.map(c => ({
            ...c,
            createdAt: c.createdAt?.toDate?.()?.toISOString() || null,
            doctorRepliedAt: c.doctorRepliedAt?.toDate?.()?.toISOString() || null
        }));
        res.json({ consultations: result });
    } catch (e) {
        console.error('[Portal List Error]', e);
        res.status(500).json({ error: '목록 조회 실패' });
    }
});

/**
 * GET /api/portal/consultations/:id
 * 상담 상세 (SOAP 차트 + 답변 히스토리)
 */
router.get('/consultations/:id', requireDoctorAuth, async (req, res) => {
    try {
        const doc = await getConsultationById(req.params.id);
        if (!doc) return res.status(404).json({ error: '상담을 찾을 수 없습니다.' });

        // Timestamp 직렬화
        const serialize = (obj) => {
            if (!obj) return obj;
            const result = { ...obj };
            for (const key of Object.keys(result)) {
                if (result[key]?.toDate) result[key] = result[key].toDate().toISOString();
            }
            return result;
        };

        res.json({
            ...serialize(doc),
            doctorReplies: (doc.doctorReplies || []).map(serialize)
        });
    } catch (e) {
        console.error('[Portal Detail Error]', e);
        res.status(500).json({ error: '상세 조회 실패' });
    }
});

/**
 * POST /api/portal/consultations/:id/reply
 * 의사 답변 저장 (환자가 다음 메시지 보낼 때 전달됨)
 */
router.post('/consultations/:id/reply', requireDoctorAuth, async (req, res) => {
    const { message } = req.body;
    if (!message || !message.trim()) {
        return res.status(400).json({ error: '답변 내용을 입력해주세요.' });
    }

    try {
        const doc = await getConsultationById(req.params.id);
        if (!doc) return res.status(404).json({ error: '상담을 찾을 수 없습니다.' });

        const replyId = await saveDoctorReply(
            req.params.id,
            doc.userId,
            message.trim(),
            req.doctor.name,
            req.doctor.email
        );

        await awardHDT(req.doctor.email, req.doctor.name, HDT_REPLY, 'reply');
        console.log(`[Portal] ${req.doctor.email} → 환자 ${doc.userId} 답변 저장 (replyId: ${replyId})`);
        res.json({ ok: true, replyId });
    } catch (e) {
        console.error('[Portal Reply Error]', e);
        res.status(500).json({ error: '답변 저장 실패' });
    }
});

/**
 * GET /api/portal/hdt/me
 * 내 HDT 잔액 조회
 */
router.get('/hdt/me', requireDoctorAuth, async (req, res) => {
    try {
        const stats = await getDoctorStats(req.doctor.email);
        res.json(stats || { email: req.doctor.email, name: req.doctor.name, hdt: 0, totalReplies: 0 });
    } catch (e) {
        res.status(500).json({ error: 'HDT 조회 실패' });
    }
});

/**
 * GET /api/portal/hdt/leaderboard
 * 리더보드 (상위 20명)
 */
router.get('/hdt/leaderboard', requireDoctorAuth, async (req, res) => {
    try {
        const board = await getHDTLeaderboard();
        res.json({ leaderboard: board });
    } catch (e) {
        res.status(500).json({ error: '리더보드 조회 실패' });
    }
});

module.exports = router;
