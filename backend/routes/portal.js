const express = require('express');

const {
  getActiveConsultations,
  getConsultationSummary,
  getConsultationById,
  saveDoctorReply,
  awardHDT,
  getHDTLeaderboard,
  getDoctorStats,
  HDT_REPLY,
  getAdmin,
} = require('../services/dbService');
const { getAllowedDoctorEmails } = require('../config');

const router = express.Router();
const ALLOWED_LIST_STATUS = new Set(['all', 'active', 'replied', 'closed']);

function parseListQuery(query = {}) {
  const status = (query.status || 'all').toString().trim().toLowerCase();
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  const offset = Number.parseInt(query.offset, 10);
  const limit = Number.parseInt(query.limit, 10);

  return {
    status: ALLOWED_LIST_STATUS.has(status) ? status : 'all',
    search,
    offset: Number.isFinite(offset) ? Math.max(0, offset) : 0,
    limit: Number.isFinite(limit) ? Math.max(1, Math.min(100, limit)) : 50,
  };
}

async function requireDoctorAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증 토큰이 없습니다.' });
  }

  const admin = getAdmin();
  if (!admin) {
    return res.status(503).json({ error: '인증 서비스가 아직 준비되지 않았습니다.' });
  }

  const idToken = auth.slice(7);

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const email = (decoded.email || '').toLowerCase();
    const allowedEmails = getAllowedDoctorEmails();

    if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }

    req.doctor = {
      uid: decoded.uid,
      email,
      name: decoded.name || email,
    };

    return next();
  } catch (error) {
    console.error('[Portal Auth Error]', error.message);
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }
}

function serializeTimestamps(value) {
  if (!value || typeof value !== 'object') return value;
  if (value instanceof Date) return value.toISOString();

  if (typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeTimestamps);
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [key, serializeTimestamps(nestedValue)]),
  );
}

router.get('/consultations', requireDoctorAuth, async (req, res) => {
  try {
    const listQuery = parseListQuery(req.query);
    const { consultations, total } = await getActiveConsultations(listQuery);

    return res.json({
      consultations: consultations.map(serializeTimestamps),
      total,
    });
  } catch (error) {
    console.error('[Portal List Error]', error);
    return res.status(500).json({ error: '목록 조회 실패' });
  }
});

router.get('/consultations/summary', requireDoctorAuth, async (req, res) => {
  try {
    const summary = await getConsultationSummary();
    return res.json(summary);
  } catch (error) {
    console.error('[Portal Summary Error]', error);
    return res.status(500).json({ error: '요약 조회 실패' });
  }
});

router.get('/consultations/:id', requireDoctorAuth, async (req, res) => {
  try {
    const consultation = await getConsultationById(req.params.id);
    if (!consultation) {
      return res.status(404).json({ error: '상담을 찾을 수 없습니다.' });
    }

    return res.json(serializeTimestamps(consultation));
  } catch (error) {
    console.error('[Portal Detail Error]', error);
    return res.status(500).json({ error: '상세 조회 실패' });
  }
});

router.post('/consultations/:id/reply', requireDoctorAuth, async (req, res) => {
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!message) {
    return res.status(400).json({ error: '답변 내용을 입력해 주세요.' });
  }

  try {
    const consultation = await getConsultationById(req.params.id);
    if (!consultation) {
      return res.status(404).json({ error: '상담을 찾을 수 없습니다.' });
    }

    const replyId = await saveDoctorReply(
      consultation.id,
      consultation.userId,
      message,
      req.doctor.name,
      req.doctor.email,
    );

    await awardHDT(req.doctor.email, req.doctor.name, HDT_REPLY, 'reply');
    console.log(`[Portal] ${req.doctor.email} replied to ${consultation.userId} (${replyId})`);

    return res.json({ ok: true, replyId });
  } catch (error) {
    console.error('[Portal Reply Error]', error);
    return res.status(500).json({ error: '답변 전송 실패' });
  }
});

router.get('/hdt/me', requireDoctorAuth, async (req, res) => {
  try {
    const stats = await getDoctorStats(req.doctor.email);
    return res.json(stats || {
      email: req.doctor.email,
      name: req.doctor.name,
      hdt: 0,
      totalReplies: 0,
    });
  } catch (error) {
    return res.status(500).json({ error: 'HDT 조회 실패' });
  }
});

router.get('/hdt/leaderboard', requireDoctorAuth, async (req, res) => {
  try {
    const leaderboard = await getHDTLeaderboard();
    return res.json({ leaderboard });
  } catch (error) {
    return res.status(500).json({ error: '리더보드 조회 실패' });
  }
});

module.exports = router;
