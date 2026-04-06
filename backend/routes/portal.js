const express = require('express');

const {
  getActiveConsultations,
  getConsultationSummary,
  getConsultationById,
  saveDoctorReply,
  getConsultationTrackingById,
  awardHDT,
  getHDTLeaderboard,
  getDoctorStats,
  getDoctorAccessRecordByEmail,
  upsertDoctorAccessRequest,
  ensureApprovedDoctorAccess,
  approveDoctorAccessRequest,
  listPendingDoctorAccessRequests,
  HDT_REPLY,
  getAdmin,
} = require('../services/dbService');
const { enqueuePatientChannelPush, clearDoctorNotifications } = require('../services/notifyService');
const { appSiteUrl, getAllowedDoctorEmails, getPortalAdminEmails } = require('../config');
const followUpService = require('../services/followUpService');

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

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
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

function buildPatientStatusUrl(trackingInfo) {
  const trackingCode = trackingInfo?.trackingCode || '';
  const trackingToken = trackingInfo?.trackingToken || '';
  if (!trackingCode && !trackingToken) return '';

  const queryKey = trackingCode ? 'code' : 'token';
  const queryValue = trackingCode || trackingToken;
  return `${appSiteUrl.replace(/\/$/, '')}/status?${queryKey}=${encodeURIComponent(queryValue)}`;
}

function buildPatientReplyPushMessage({
  doctorName,
  message,
  statusUrl,
  trackingCode,
}) {
  return [
    '의료진 답변이 도착했습니다.',
    '',
    `${doctorName || '해피닥터 의료진'} 선생님의 답변`,
    '',
    message,
    '',
    statusUrl ? `상태 확인: ${statusUrl}` : null,
    trackingCode ? `직접 입력 코드: ${trackingCode}` : null,
    '',
    '답변을 충분히 확인하셨다면 카카오톡에서 상담종료라고 보내 상담을 마무리해 주세요.',
    '추가 설명이 필요하면 상태 확인 화면이나 채널에서 다시 이어서 문의하실 수 있습니다.',
  ]
    .filter(Boolean)
    .join('\n');
}

async function resolveDoctorAccessContext(decoded) {
  const doctor = {
    uid: decoded.uid,
    email: normalizeEmail(decoded.email),
    name: decoded.name || normalizeEmail(decoded.email),
  };

  const adminEmails = getPortalAdminEmails();
  const allowedEmails = getAllowedDoctorEmails();
  const isAdmin = adminEmails.includes(doctor.email);

  let accessRecord = await getDoctorAccessRecordByEmail(doctor.email);
  const isBootstrapApproved = allowedEmails.includes(doctor.email);
  const isApproved = isAdmin || isBootstrapApproved || accessRecord?.status === 'approved';

  if (isApproved) {
    accessRecord = await ensureApprovedDoctorAccess(doctor, isAdmin ? doctor : null) || accessRecord;
    return {
      doctor,
      isAdmin,
      accessStatus: 'approved',
      accessRecord,
    };
  }

  accessRecord = await upsertDoctorAccessRequest(doctor);
  return {
    doctor,
    isAdmin: false,
    accessStatus: 'pending',
    accessRecord,
  };
}

async function authenticateDoctor(req, res) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ error: '인증 토큰이 없습니다.' });
    return null;
  }

  const admin = getAdmin();
  if (!admin) {
    res.status(503).json({ error: '인증 서비스가 아직 준비되지 않았습니다.' });
    return null;
  }

  const idToken = auth.slice(7);

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return resolveDoctorAccessContext(decoded);
  } catch (error) {
    console.error('[Portal Auth Error]', error.message);
    res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    return null;
  }
}

async function requireDoctorAuth(req, res, next) {
  const context = await authenticateDoctor(req, res);
  if (!context) return;

  if (context.accessStatus !== 'approved') {
    return res.status(403).json({
      error: '의사 포털 접근은 대표자 승인 후 가능합니다.',
      code: 'approval_pending',
      request: serializeTimestamps(context.accessRecord),
    });
  }

  req.doctor = context.doctor;
  req.portalAccess = context;
  return next();
}

async function requireAdminAuth(req, res, next) {
  const context = await authenticateDoctor(req, res);
  if (!context) return;

  if (context.accessStatus !== 'approved') {
    return res.status(403).json({
      error: '대표자 승인 후에만 이 기능을 사용할 수 있습니다.',
      code: 'approval_pending',
      request: serializeTimestamps(context.accessRecord),
    });
  }

  if (!context.isAdmin) {
    return res.status(403).json({
      error: '대표자 권한이 필요합니다.',
      code: 'admin_only',
    });
  }

  req.doctor = context.doctor;
  req.portalAccess = context;
  return next();
}

router.get('/auth/status', async (req, res) => {
  const context = await authenticateDoctor(req, res);
  if (!context) return;

  const pendingRequests = context.isAdmin
    ? await listPendingDoctorAccessRequests()
    : [];

  return res.json({
    doctor: context.doctor,
    accessStatus: context.accessStatus,
    isAdmin: context.isAdmin,
    request: serializeTimestamps(context.accessRecord),
    pendingRequests: pendingRequests.map(serializeTimestamps),
  });
});

router.post('/admin/doctor-requests/:email/approve', requireAdminAuth, async (req, res) => {
  try {
    const email = normalizeEmail(req.params.email);
    if (!email) {
      return res.status(400).json({ error: '승인할 이메일을 다시 확인해 주세요.' });
    }

    const approved = await approveDoctorAccessRequest(email, req.doctor);
    if (!approved) {
      return res.status(404).json({ error: '승인 대기 중인 의료진을 찾지 못했습니다.' });
    }

    const pendingRequests = await listPendingDoctorAccessRequests();
    return res.json({
      ok: true,
      approved: serializeTimestamps(approved),
      pendingRequests: pendingRequests.map(serializeTimestamps),
    });
  } catch (error) {
    console.error('[Portal Approve Error]', error);
    return res.status(500).json({ error: '의료진 승인 처리에 실패했습니다.' });
  }
});

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

    const trackingInfo = await getConsultationTrackingById(consultation.id);
    const statusUrl = buildPatientStatusUrl(trackingInfo);
    await enqueuePatientChannelPush(
      consultation.userId,
      buildPatientReplyPushMessage({
        doctorName: req.doctor.name,
        message,
        statusUrl,
        trackingCode: trackingInfo?.trackingCode || null,
      }),
      'doctor_reply',
    );
    await followUpService.cancelFollowUp(consultation.userId);
    await clearDoctorNotifications(consultation.userId);

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
