const admin = require('firebase-admin');
const crypto = require('crypto');

const PUBLIC_STATS_PATH = ['system', 'public_stats'];
const FOLLOW_UP_SESSIONS = 'follow_up_sessions';
const DOCTOR_ACCESS_REQUESTS = 'doctor_access_requests';
const SHORT_TRACKING_CODE_LENGTH = 6;
const LEGACY_TRACKING_CODE_LENGTH = 8;
const SHORT_TRACKING_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const CONSULTATION_MEDIA_LIMIT = 3;
const CONSULTATION_IMAGE_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);
const CONSULTATION_IMAGE_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

let db = null;
let storageBucketName = '';
let resolvedStorageBucketName = '';
let storageBucketCandidates = [];

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    storageBucketCandidates = Array.from(
      new Set(
        [
          process.env.FIREBASE_STORAGE_BUCKET,
          serviceAccount.storageBucket,
          serviceAccount.project_id && `${serviceAccount.project_id}.firebasestorage.app`,
          serviceAccount.project_id && `${serviceAccount.project_id}.appspot.com`,
        ]
          .map((value) => (typeof value === 'string' ? value.trim() : ''))
          .filter(Boolean),
      ),
    );
    storageBucketName = storageBucketCandidates[0] || '';
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      ...(storageBucketName ? { storageBucket: storageBucketName } : {}),
    });
    db = admin.firestore();
    console.log('[Firebase] Firestore initialized successfully.');
  } else {
    console.warn('[Firebase] FIREBASE_SERVICE_ACCOUNT is missing. DB logging is disabled.');
  }
} catch (error) {
  console.error('[Firebase Init Error]', error);
}

function getPublicStatsRef() {
  if (!db) return null;
  return db.collection(PUBLIC_STATS_PATH[0]).doc(PUBLIC_STATS_PATH[1]);
}

function getStorageBucketCandidateList(preferredBucketName = '') {
  return Array.from(
    new Set(
      [
        preferredBucketName,
        resolvedStorageBucketName,
        ...storageBucketCandidates,
      ].filter(Boolean),
    ),
  );
}

async function resolveStorageBucketName(preferredBucketName = '') {
  const candidates = getStorageBucketCandidateList(preferredBucketName);
  if (candidates.length === 0) return '';

  for (const candidate of candidates) {
    try {
      const bucket = admin.storage().bucket(candidate);
      const [exists] = await bucket.exists();
      if (exists) {
        resolvedStorageBucketName = candidate;
        return candidate;
      }
    } catch (error) {
      console.error(`[Firebase Storage Bucket Probe Error] ${candidate}`, error);
    }
  }

  return '';
}

async function getStorageBucket(preferredBucketName = '') {
  const bucketName = await resolveStorageBucketName(preferredBucketName);
  if (!bucketName) return null;

  try {
    return admin.storage().bucket(bucketName);
  } catch (error) {
    console.error('[Firebase Storage Bucket Error]', error);
    return null;
  }
}

function sanitizeFilename(value, fallback = 'image') {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || fallback;
}

function createConsultationMediaId() {
  return `media_${crypto.randomBytes(8).toString('hex')}`;
}

function normalizeConsultationMediaItems(items) {
  return Array.isArray(items) ? items.filter(Boolean) : [];
}

function normalizeExternalMediaUrl(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

async function createSignedMediaUrl(storagePath, bucketName = '', expiresMinutes = 60) {
  const bucket = await getStorageBucket(bucketName);
  if (!bucket || !storagePath) return null;

  try {
    const [url] = await bucket.file(storagePath).getSignedUrl({
      action: 'read',
      expires: Date.now() + (expiresMinutes * 60 * 1000),
    });
    return url;
  } catch (error) {
    console.error('[Firebase Signed URL Error]', error);
    return null;
  }
}

async function mapConsultationMediaItem(item) {
  if (!item) return null;

  return {
    id: item.id || null,
    kind: item.kind || 'image',
    source: item.source || 'web',
    status: item.status || 'ready',
    contentType: item.contentType || null,
    originalName: item.originalName || null,
    size: typeof item.size === 'number' ? item.size : null,
    storagePath: item.storagePath || null,
    createdAt: toIsoString(item.createdAt),
    url:
      normalizeExternalMediaUrl(item.externalUrl)
      || await createSignedMediaUrl(item.storagePath, item.bucketName || ''),
  };
}

async function mapConsultationMediaItems(items) {
  const normalized = normalizeConsultationMediaItems(items);
  const mapped = await Promise.all(normalized.map(mapConsultationMediaItem));
  return mapped.filter(Boolean);
}

function createTrackingToken() {
  return crypto.randomBytes(24).toString('hex');
}

function createTrackingCode(length = SHORT_TRACKING_CODE_LENGTH) {
  let result = '';
  for (let index = 0; index < length; index += 1) {
    const randomIndex = crypto.randomInt(0, SHORT_TRACKING_ALPHABET.length);
    result += SHORT_TRACKING_ALPHABET[randomIndex];
  }
  return result;
}

function normalizeTrackingCode(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]+$/.test(normalized)) {
    return null;
  }
  if (![SHORT_TRACKING_CODE_LENGTH, LEGACY_TRACKING_CODE_LENGTH].includes(normalized.length)) {
    return null;
  }
  return normalized;
}

async function createUniqueTrackingCode() {
  if (!db) {
    return createTrackingCode();
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = createTrackingCode();
    const snapshot = await db.collection('consultations')
      .where('publicTrackingCode', '==', candidate)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return candidate;
    }
  }

  return createTrackingCode();
}

async function createTrackingIdentifiers() {
  return {
    trackingToken: createTrackingToken(),
    trackingCode: await createUniqueTrackingCode(),
  };
}

async function ensurePublicTrackingIdentifiers(docRef, consultationData = {}) {
  if (!docRef) {
    return {
      trackingToken: null,
      trackingCode: null,
    };
  }

  let trackingToken = typeof consultationData.publicTrackingToken === 'string'
    ? consultationData.publicTrackingToken.trim()
    : '';
  let trackingCode = normalizeTrackingCode(consultationData.publicTrackingCode);
  const updates = {};

  if (!trackingToken) {
    trackingToken = createTrackingToken();
    updates.publicTrackingToken = trackingToken;
    updates.publicTrackingIssuedAt = admin.firestore.FieldValue.serverTimestamp();
  }

  if (!trackingCode) {
    trackingCode = await createUniqueTrackingCode();
    updates.publicTrackingCode = trackingCode;
    updates.publicTrackingCodeIssuedAt = admin.firestore.FieldValue.serverTimestamp();
  }

  if (Object.keys(updates).length > 0) {
    await docRef.set(updates, { merge: true });
  }

  return {
    trackingToken,
    trackingCode,
  };
}

function getTimestampMs(value) {
  if (value && typeof value.toDate === 'function') {
    return value.toDate().getTime();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'string') {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function toIsoString(value) {
  if (value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    return value;
  }

  return null;
}

function normalizeDoctorEmail(email) {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

function getDoctorAccessRequestRef(email) {
  if (!db) return null;
  const normalizedEmail = normalizeDoctorEmail(email);
  if (!normalizedEmail) return null;
  return db.collection(DOCTOR_ACCESS_REQUESTS).doc(normalizedEmail);
}

function mapDoctorAccessRecord(snapshot) {
  if (!snapshot || !snapshot.exists) return null;
  const data = snapshot.data() || {};
  return {
    id: snapshot.id,
    email: data.email || snapshot.id,
    name: data.name || data.email || snapshot.id,
    status: data.status || 'pending',
    requestedAt: toIsoString(data.requestedAt),
    approvedAt: toIsoString(data.approvedAt),
    lastLoginAt: toIsoString(data.lastLoginAt),
    updatedAt: toIsoString(data.updatedAt),
    approvedByEmail: data.approvedByEmail || null,
    approvedByName: data.approvedByName || null,
    latestUid: data.latestUid || null,
  };
}

async function getDoctorAccessRecordByEmail(email) {
  const ref = getDoctorAccessRequestRef(email);
  if (!ref) return null;

  try {
    const snapshot = await ref.get();
    return mapDoctorAccessRecord(snapshot);
  } catch (error) {
    console.error('[DB DoctorAccess Get Error]', error);
    return null;
  }
}

async function upsertDoctorAccessRequest(profile = {}) {
  const normalizedEmail = normalizeDoctorEmail(profile.email);
  if (!db || !normalizedEmail) return null;

  const ref = getDoctorAccessRequestRef(normalizedEmail);
  if (!ref) return null;

  try {
    const snapshot = await ref.get();
    const current = snapshot.exists ? snapshot.data() || {} : {};
    const alreadyApproved = current.status === 'approved';

    const payload = {
      email: normalizedEmail,
      name: profile.name || current.name || normalizedEmail,
      latestUid: profile.uid || current.latestUid || null,
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!snapshot.exists) {
      payload.status = 'pending';
      payload.requestedAt = admin.firestore.FieldValue.serverTimestamp();
    } else if (!alreadyApproved) {
      payload.status = 'pending';
    }

    await ref.set(payload, { merge: true });
    return getDoctorAccessRecordByEmail(normalizedEmail);
  } catch (error) {
    console.error('[DB DoctorAccess Upsert Error]', error);
    return null;
  }
}

async function ensureApprovedDoctorAccess(profile = {}, approver = null) {
  const normalizedEmail = normalizeDoctorEmail(profile.email);
  if (!db || !normalizedEmail) return null;

  const ref = getDoctorAccessRequestRef(normalizedEmail);
  if (!ref) return null;

  try {
    const snapshot = await ref.get();
    const current = snapshot.exists ? snapshot.data() || {} : {};
    const approvedByEmail = normalizeDoctorEmail(approver?.email) || current.approvedByEmail || 'system';
    const approvedByName = approver?.name || current.approvedByName || 'System';

    await ref.set({
      email: normalizedEmail,
      name: profile.name || current.name || normalizedEmail,
      latestUid: profile.uid || current.latestUid || null,
      status: 'approved',
      requestedAt: current.requestedAt || admin.firestore.FieldValue.serverTimestamp(),
      approvedAt: current.approvedAt || admin.firestore.FieldValue.serverTimestamp(),
      approvedByEmail,
      approvedByName,
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return getDoctorAccessRecordByEmail(normalizedEmail);
  } catch (error) {
    console.error('[DB DoctorAccess Approve Error]', error);
    return null;
  }
}

async function approveDoctorAccessRequest(email, approver = null) {
  const existing = await getDoctorAccessRecordByEmail(email);
  if (!existing || existing.status !== 'pending') {
    return null;
  }

  return ensureApprovedDoctorAccess({
    email,
    name: existing.name || email,
  }, approver);
}

async function listPendingDoctorAccessRequests() {
  if (!db) return [];

  try {
    const snapshot = await db.collection(DOCTOR_ACCESS_REQUESTS)
      .where('status', '==', 'pending')
      .get();

    return snapshot.docs
      .map(mapDoctorAccessRecord)
      .filter(Boolean)
      .sort((left, right) => getTimestampMs(right?.requestedAt) - getTimestampMs(left?.requestedAt));
  } catch (error) {
    console.error('[DB DoctorAccess Pending Error]', error);
    return [];
  }
}

function mapDoctorReplyForPatient(reply) {
  return {
    id: reply.id,
    doctorName: reply.doctorName || '해피닥터 의료진',
    message: reply.message || '',
    createdAt: toIsoString(reply.createdAt),
    seen: Boolean(reply.seen),
    seenAt: toIsoString(reply.seenAt),
  };
}

async function buildPublicConsultationStatus(consultation, replies) {
  const isClosed = consultation.status === 'COMPLETED' || Boolean(consultation.closedAt);
  const hasDoctorReply = replies.length > 0 || Boolean(consultation.doctorRepliedAt);
  const requiresDoctorReview = consultation.aiAction === 'ESCALATE';

  let stage = 'guidance_delivered';
  if (isClosed) {
    stage = 'closed';
  } else if (hasDoctorReply) {
    stage = 'doctor_replied';
  } else if (requiresDoctorReview) {
    stage = 'waiting_doctor';
  }

  const followUpLogs = Array.isArray(consultation.followUpLogs) ? consultation.followUpLogs : [];
  const latestFollowUp = followUpLogs
    .slice()
    .sort((a, b) => getTimestampMs(b.timestamp) - getTimestampMs(a.timestamp))[0];
  const mediaItems = await mapConsultationMediaItems(consultation.mediaItems);

  return {
    consultationId: consultation.id,
    trackingCode: consultation.publicTrackingCode || null,
    status: stage,
    chiefComplaint: consultation.patientData?.cc || null,
    chatbotReply: consultation.chatbotReply || null,
    createdAt: toIsoString(consultation.createdAt),
    doctorRepliedAt: toIsoString(consultation.doctorRepliedAt),
    closedAt: toIsoString(consultation.closedAt),
    closeReason: consultation.closeReason || null,
    requiresDoctorReview,
    followUpCount: followUpLogs.length,
    latestFollowUpAt: toIsoString(latestFollowUp?.timestamp),
    doctorReplies: replies.map(mapDoctorReplyForPatient),
    entryChannel: consultation.entryChannel || 'kakao',
    mediaItems,
  };
}

async function updatePublicStats(patch) {
  const ref = getPublicStatsRef();
  if (!ref) return;

  const updates = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (typeof patch.consultationCount === 'number' && patch.consultationCount !== 0) {
    updates.consultationCount = admin.firestore.FieldValue.increment(patch.consultationCount);
  }

  if (typeof patch.completedCount === 'number' && patch.completedCount !== 0) {
    updates.completedCount = admin.firestore.FieldValue.increment(patch.completedCount);
  }

  await ref.set(updates, { merge: true });
}

async function rebuildPublicStats() {
  if (!db) return null;

  const snapshot = await db.collection('consultations').get();
  const docs = snapshot.docs.map((doc) => doc.data());
  const publicStats = {
    consultationCount: docs.length,
    completedCount: docs.filter((doc) => doc.status === 'COMPLETED').length,
    rebuiltAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await getPublicStatsRef().set(publicStats, { merge: true });

  return {
    consultationCount: docs.length,
    completedCount: publicStats.completedCount,
  };
}

async function getPublicStats() {
  if (!db) return null;

  const snapshot = await getPublicStatsRef().get();
  if (!snapshot.exists) {
    return rebuildPublicStats();
  }

  const data = snapshot.data() || {};
  return {
    consultationCount: data.consultationCount || 0,
    completedCount: data.completedCount || 0,
  };
}

async function logConsultation(userId, patientData, analysisResult, options = {}) {
  if (!db) return null;

  try {
    const docRef = db.collection('consultations').doc();
    const { trackingToken, trackingCode } = await createTrackingIdentifiers();

    await docRef.set({
      userId,
      patientData,
      aiAction: analysisResult.action,
      chatbotReply: analysisResult.replyToPatient,
      doctorChart: analysisResult.soapChartForDoctor || 'None',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'ACTIVE',
      followUpLogs: [],
      mediaItems: [],
      publicTrackingToken: trackingToken,
      publicTrackingIssuedAt: admin.firestore.FieldValue.serverTimestamp(),
      publicTrackingCode: trackingCode,
      publicTrackingCodeIssuedAt: admin.firestore.FieldValue.serverTimestamp(),
      entryChannel: options.entryChannel || 'kakao',
      entrySurface: options.entrySurface || null,
    });

    await updatePublicStats({ consultationCount: 1 });

    console.log(`[DB Logged] Consultation saved. Doc ID: ${docRef.id}`);
    return {
      consultationId: docRef.id,
      trackingToken,
      trackingCode,
    };
  } catch (error) {
    console.error('[DB Logging Error]', error);
    return null;
  }
}

async function logFollowUp(userId, fuAnalysis) {
  if (!db) return;

  try {
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
        alertMessage: fuAnalysis.fuChartForDoctor || 'None',
      }),
    });

    console.log(`[DB Logged] F/U result appended to Doc ID: ${docRef.id}`);
  } catch (error) {
    console.error('[DB F/U Logging Error]', error);
  }
}

async function closeConsultation(userId, reason) {
  if (!db) return;

  try {
    const snapshot = await db.collection('consultations')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return;

    const doc = snapshot.docs[0];
    const docRef = doc.ref;
    const data = doc.data();
    const wasCompleted = data.status === 'COMPLETED';

    await docRef.update({
      status: 'COMPLETED',
      closedAt: admin.firestore.FieldValue.serverTimestamp(),
      closeReason: reason || 'Patient closed consultation',
    });

    if (!wasCompleted) {
      await updatePublicStats({ completedCount: 1 });
    }

    console.log(`[DB] Consultation closed for ${userId}, reason: ${reason}`);
  } catch (error) {
    console.error('[DB Close Error]', error);
  }
}

async function saveDoctorReply(consultationId, userId, message, doctorName, doctorEmail) {
  if (!db) return null;

  try {
    const docRef = db.collection('doctor_replies').doc();
    await docRef.set({
      id: docRef.id,
      consultationId,
      userId,
      message,
      doctorName: doctorName || '담당 의사',
      doctorEmail: doctorEmail || '',
      seen: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await db.collection('consultations').doc(consultationId).update({
      doctorRepliedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[DB] Doctor reply saved for userId: ${userId}`);
    return docRef.id;
  } catch (error) {
    console.error('[DB Doctor Reply Error]', error);
    return null;
  }
}

async function getPendingDoctorReply(userId) {
  if (!db) return null;

  try {
    const snapshot = await db.collection('doctor_replies')
      .where('userId', '==', userId)
      .where('seen', '==', false)
      .orderBy('createdAt', 'asc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  } catch (error) {
    console.error('[DB GetPendingReply Error]', error);
    return null;
  }
}

async function markReplyAsSeen(replyId) {
  if (!db) return;

  try {
    await db.collection('doctor_replies').doc(replyId).update({
      seen: true,
      seenAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('[DB MarkSeen Error]', error);
  }
}

function applyConsultationViewOptions(docs, options = {}) {
  const status = options.status || 'all';
  const normalizedSearch = (options.search || '').trim().toLowerCase();
  let filtered = docs;

  if (status === 'active') {
    filtered = filtered.filter((doc) => getPortalInboxStage(doc) === 'pending');
  } else if (status === 'followup') {
    filtered = filtered.filter((doc) => getPortalInboxStage(doc) === 'followup');
  } else if (status === 'replied') {
    filtered = filtered.filter((doc) => getPortalInboxStage(doc) === 'replied');
  } else if (status === 'closed') {
    filtered = filtered.filter((doc) => getPortalInboxStage(doc) === 'closed');
  }

  if (normalizedSearch) {
    filtered = filtered.filter((doc) => {
      const values = [
        doc.id,
        doc.userId,
        doc.patientData?.cc,
        doc.patientData?.symptom,
        doc.patientData?.associated,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return values.includes(normalizedSearch);
    });
  }

  filtered.sort((a, b) => {
    const ta = getConsultationSortTimestamp(a, status);
    const tb = getConsultationSortTimestamp(b, status);
    return tb - ta;
  });

  const offset = Math.max(0, Number(options.offset) || 0);
  const limit = Math.max(1, Math.min(100, Number(options.limit) || 50));

  return {
    total: filtered.length,
    consultations: filtered.slice(offset, offset + limit),
  };
}

function getCreatedAtTimestamp(doc) {
  if (doc?.createdAt?.toMillis) return doc.createdAt.toMillis();

  const parsed = doc?.createdAt ? new Date(doc.createdAt).getTime() : NaN;
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getDoctorReplyTimestamp(doc) {
  if (doc?.doctorRepliedAt?.toMillis) return doc.doctorRepliedAt.toMillis();

  const parsed = doc?.doctorRepliedAt ? new Date(doc.doctorRepliedAt).getTime() : NaN;
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getClosedTimestamp(doc) {
  if (doc?.closedAt?.toMillis) return doc.closedAt.toMillis();

  const parsed = doc?.closedAt ? new Date(doc.closedAt).getTime() : NaN;
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getLatestFollowUpTimestamp(doc) {
  const logs = Array.isArray(doc?.followUpLogs) ? doc.followUpLogs : [];
  return logs
    .map((log) => {
      if (log?.timestamp?.toMillis) return log.timestamp.toMillis();

      const parsed = log?.timestamp ? new Date(log.timestamp).getTime() : NaN;
      return Number.isNaN(parsed) ? 0 : parsed;
    })
    .reduce((max, current) => Math.max(max, current), 0);
}

function getFollowUpSortTimestamp(doc) {
  return getLatestFollowUpTimestamp(doc) || getCreatedAtTimestamp(doc);
}

function hasPendingConsultationFollowUp(doc) {
  const latestFollowUp = getLatestFollowUpTimestamp(doc);
  if (!latestFollowUp) return false;
  return latestFollowUp > getDoctorReplyTimestamp(doc);
}

function isConsultationClosed(doc) {
  return doc?.status === 'COMPLETED' || Boolean(doc?.closedAt);
}

function hasConsultationDoctorReply(doc) {
  return Boolean(doc?.doctorRepliedAt);
}

function getPortalInboxStage(doc) {
  if (isConsultationClosed(doc)) {
    return 'closed';
  }

  // Keep portal inbox tabs mutually exclusive:
  // only consultations with a newer follow-up than the last doctor reply
  // should stay in the follow-up tab.
  if (hasPendingConsultationFollowUp(doc)) {
    return 'followup';
  }

  if (hasConsultationDoctorReply(doc)) {
    return 'replied';
  }

  return 'pending';
}

function getConsultationSortTimestamp(doc, status) {
  if (status === 'followup') {
    return getFollowUpSortTimestamp(doc);
  }

  if (status === 'replied') {
    return getDoctorReplyTimestamp(doc) || getCreatedAtTimestamp(doc);
  }

  if (status === 'closed') {
    return getClosedTimestamp(doc) || getDoctorReplyTimestamp(doc) || getCreatedAtTimestamp(doc);
  }

  return getCreatedAtTimestamp(doc);
}

async function getActiveConsultations(options = {}) {
  if (!db) return { consultations: [], total: 0 };

  try {
    const docs = await getEscalatedConsultationDocs();

    return applyConsultationViewOptions(docs, options);
  } catch (error) {
    console.error('[DB GetActive Error]', error);
    return { consultations: [], total: 0 };
  }
}

async function getEscalatedConsultationDocs() {
  const [activeSnap, completedSnap] = await Promise.all([
    db.collection('consultations')
      .where('aiAction', '==', 'ESCALATE')
      .where('status', '==', 'ACTIVE')
      .get(),
    db.collection('consultations')
      .where('aiAction', '==', 'ESCALATE')
      .where('status', '==', 'COMPLETED')
      .get(),
  ]);

  return [
    ...activeSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id })),
    ...completedSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id })),
  ];
}

async function getConsultationSummary() {
  if (!db) {
    return {
      pending: 0,
      replied: 0,
      closed: 0,
      followUp: 0,
    };
  }

  try {
    const docs = await getEscalatedConsultationDocs();

    return docs.reduce((summary, doc) => {
      const stage = getPortalInboxStage(doc);

      if (stage === 'closed') {
        summary.closed += 1;
      } else if (stage === 'followup') {
        summary.followUp += 1;
      } else if (stage === 'replied') {
        summary.replied += 1;
      } else {
        summary.pending += 1;
      }

      return summary;
    }, {
      pending: 0,
      replied: 0,
      closed: 0,
      followUp: 0,
    });
  } catch (error) {
    console.error('[DB Consultation Summary Error]', error);
    return {
      pending: 0,
      replied: 0,
      closed: 0,
      followUp: 0,
    };
  }
}

async function getConsultationById(consultationId) {
  if (!db) return null;

  try {
    let doc = await db.collection('consultations').doc(consultationId).get();

    // Legacy compatibility: some historical records may have stored their own
    // `id` field, and older serialization paths could surface that instead of
    // the Firestore document id. Fall back once so old links still resolve.
    if (!doc.exists) {
      const legacySnapshot = await db.collection('consultations')
        .where('id', '==', consultationId)
        .limit(1)
        .get();

      if (!legacySnapshot.empty) {
        doc = legacySnapshot.docs[0];
      }
    }

    // Additional compatibility: if an older client surfaced a user-level
    // identifier instead of the consultation document id, resolve the most
    // recent matching consultation rather than failing with a 404.
    if (!doc.exists) {
      const userScopedSnapshot = await db.collection('consultations')
        .where('userId', '==', consultationId)
        .get();

      if (!userScopedSnapshot.empty) {
        const sortedDocs = userScopedSnapshot.docs.sort((a, b) => {
          const ta = a.data().createdAt?.toMillis?.() ?? 0;
          const tb = b.data().createdAt?.toMillis?.() ?? 0;
          return tb - ta;
        });

        doc = sortedDocs[0];
      }
    }

    if (!doc.exists) return null;

    const repliesSnap = await db.collection('doctor_replies')
      .where('consultationId', '==', doc.id)
      .get();

    const replies = repliesSnap.docs
      .map((reply) => ({ ...reply.data(), id: reply.id }))
      .sort((a, b) => {
        const ta = getTimestampMs(a.createdAt);
        const tb = getTimestampMs(b.createdAt);
        return ta - tb;
      });

    const data = doc.data() || {};
    const mediaItems = await mapConsultationMediaItems(data.mediaItems);

    return { ...data, id: doc.id, doctorReplies: replies, mediaItems };
  } catch (error) {
    console.error('[DB GetById Error]', error);
    throw error;
  }
}

async function getLatestConsultationTracking(userId) {
  if (!db || !userId) return null;

  try {
    const snapshot = await db.collection('consultations')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data() || {};
    const identifiers = await ensurePublicTrackingIdentifiers(doc.ref, data);

    return {
      consultationId: doc.id,
      trackingToken: identifiers.trackingToken,
      trackingCode: identifiers.trackingCode,
    };
  } catch (error) {
    console.error('[DB LatestTracking Error]', error);
    return null;
  }
}

async function getConsultationTrackingById(consultationId) {
  if (!db || !consultationId) return null;

  try {
    const snapshot = await db.collection('consultations').doc(consultationId).get();
    if (!snapshot.exists) return null;

    const data = snapshot.data() || {};
    const identifiers = await ensurePublicTrackingIdentifiers(snapshot.ref, data);
    return {
      consultationId: snapshot.id,
      trackingToken: identifiers.trackingToken,
      trackingCode: identifiers.trackingCode,
    };
  } catch (error) {
    console.error('[DB ConsultationTrackingById Error]', error);
    return null;
  }
}

async function resolvePublicConsultationDocByLookup(trackingLookup) {
  if (!db || !trackingLookup) return null;

  const normalizedLookup = trackingLookup.toString().trim();
  if (!normalizedLookup) return null;

  const candidateQueries = [];
  const trackingCode = normalizeTrackingCode(normalizedLookup);

  if (trackingCode) {
    candidateQueries.push(['publicTrackingCode', trackingCode]);
  }

  candidateQueries.push(['publicTrackingToken', normalizedLookup]);

  for (const [field, value] of candidateQueries) {
    const consultationSnapshot = await db.collection('consultations')
      .where(field, '==', value)
      .limit(1)
      .get();

    if (!consultationSnapshot.empty) {
      return consultationSnapshot.docs[0];
    }
  }

  return null;
}

async function getConsultationDocById(consultationId) {
  if (!db || !consultationId) return null;

  const snapshot = await db.collection('consultations').doc(consultationId).get();
  return snapshot.exists ? snapshot : null;
}

function ensureConsultationCanAcceptUpdates(consultationData = {}) {
  if (consultationData.status === 'COMPLETED' || consultationData.closedAt) {
    throw new Error('CONSULTATION_CLOSED');
  }
}

function sanitizeFollowUpQuestion(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\r\n/g, '\n').slice(0, 1200);
}

function buildDoctorFollowUpNotificationMessage(consultationData = {}, question = '') {
  const patientData = consultationData.patientData || {};

  return [
    '📩 환자 추가 질문이 도착했습니다.',
    '',
    `주요 증상: ${patientData.cc || '미상'}`,
    patientData.symptom ? `기존 설명: ${patientData.symptom}` : null,
    patientData.associated ? `동반 증상: ${patientData.associated}` : null,
    consultationData.doctorRepliedAt
      ? `직전 의료진 답변 시각: ${toIsoString(consultationData.doctorRepliedAt) || '기록 없음'}`
      : '직전 의료진 답변: 아직 없음',
    '',
    '[환자 메시지]',
    question,
    consultationData.doctorChart
      ? `\n[기존 차트]\n${consultationData.doctorChart}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');
}

async function appendConsultationMediaItems(consultationDoc, nextItems = []) {
  const consultationData = consultationDoc.data() || {};
  const existingMedia = normalizeConsultationMediaItems(consultationData.mediaItems);
  const existingImages = existingMedia.filter((item) => item.kind === 'image');

  if ((existingImages.length + nextItems.length) > CONSULTATION_MEDIA_LIMIT) {
    throw new Error('MEDIA_LIMIT_EXCEEDED');
  }

  await consultationDoc.ref.set({
    mediaItems: [...existingMedia, ...nextItems],
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return mapConsultationMediaItems(nextItems);
}

async function addConsultationImagesByDoc(consultationDoc, files = [], options = {}) {
  const bucket = await getStorageBucket();
  if (!bucket) {
    throw new Error('STORAGE_NOT_CONFIGURED');
  }

  const normalizedFiles = Array.isArray(files) ? files.filter(Boolean) : [];
  if (normalizedFiles.length === 0) {
    throw new Error('NO_FILES');
  }

  const consultationData = consultationDoc.data() || {};
  ensureConsultationCanAcceptUpdates(consultationData);

  const uploadedItems = [];

  for (const file of normalizedFiles) {
    if (!CONSULTATION_IMAGE_CONTENT_TYPES.has(file.mimetype)) {
      throw new Error('UNSUPPORTED_MEDIA_TYPE');
    }

    const extension = CONSULTATION_IMAGE_EXTENSIONS[file.mimetype] || 'jpg';
    const mediaId = createConsultationMediaId();
    const safeName = sanitizeFilename(file.originalname, mediaId);
    const storagePath = `consultations/${consultationDoc.id}/images/${mediaId}-${safeName}.${extension}`;

    await bucket.file(storagePath).save(file.buffer, {
      resumable: false,
      metadata: {
        contentType: file.mimetype,
        cacheControl: 'private, max-age=3600',
        metadata: {
          consultationId: consultationDoc.id,
          uploadedBy: options.uploadedBy || 'public',
          originalName: file.originalname || '',
        },
      },
    });

    uploadedItems.push({
      id: mediaId,
      kind: 'image',
      source: options.source || 'web',
      status: 'ready',
      contentType: file.mimetype,
      originalName: file.originalname || null,
      size: typeof file.size === 'number' ? file.size : null,
      storagePath,
      bucketName: bucket.name || resolvedStorageBucketName || storageBucketName || null,
      createdAt: admin.firestore.Timestamp.now(),
    });
  }

  return appendConsultationMediaItems(consultationDoc, uploadedItems);
}

async function addRemoteConsultationImagesByDoc(consultationDoc, urls = [], options = {}) {
  const normalizedUrls = Array.from(
    new Set(
      (Array.isArray(urls) ? urls : [urls])
        .map(normalizeExternalMediaUrl)
        .filter(Boolean),
    ),
  );

  if (normalizedUrls.length === 0) {
    throw new Error('NO_FILES');
  }

  const consultationData = consultationDoc.data() || {};
  ensureConsultationCanAcceptUpdates(consultationData);

  const remoteItems = normalizedUrls.map((url) => ({
    id: createConsultationMediaId(),
    kind: 'image',
    source: options.source || 'kakao',
    status: 'external',
    contentType: null,
    originalName: options.originalName || null,
    size: null,
    storagePath: null,
    externalUrl: url,
    createdAt: admin.firestore.Timestamp.now(),
  }));

  return appendConsultationMediaItems(consultationDoc, remoteItems);
}

async function markUnseenDoctorRepliesAsSeen(consultationId) {
  if (!db || !consultationId) return 0;

  const repliesSnapshot = await db.collection('doctor_replies')
    .where('consultationId', '==', consultationId)
    .get();

  const unseenReplies = repliesSnapshot.docs.filter((replyDoc) => !replyDoc.data().seen);
  if (unseenReplies.length === 0) return 0;

  const batch = db.batch();
  const seenAt = admin.firestore.FieldValue.serverTimestamp();

  unseenReplies.forEach((replyDoc) => {
    batch.update(replyDoc.ref, {
      seen: true,
      seenAt,
    });
  });

  await batch.commit();

  await Promise.all(
    unseenReplies.map(async (replyDoc) => {
      const reply = replyDoc.data() || {};
      if (!reply.doctorEmail) return;
      await awardHDT(reply.doctorEmail, reply.doctorName, HDT_SEEN, 'seen');
    }),
  );

  return unseenReplies.length;
}

async function getPublicConsultationStatusByLookup(trackingLookup) {
  if (!db || !trackingLookup) return null;

  try {
    const consultationDoc = await resolvePublicConsultationDocByLookup(trackingLookup);
    if (!consultationDoc) return null;

    const consultationData = consultationDoc.data() || {};
    const identifiers = await ensurePublicTrackingIdentifiers(consultationDoc.ref, consultationData);
    const consultation = {
      ...consultationData,
      id: consultationDoc.id,
      publicTrackingToken: identifiers.trackingToken,
      publicTrackingCode: identifiers.trackingCode,
    };

    const repliesSnapshot = await db.collection('doctor_replies')
      .where('consultationId', '==', consultationDoc.id)
      .get();

    const replies = repliesSnapshot.docs
      .map((reply) => ({ ...reply.data(), id: reply.id }))
      .sort((a, b) => getTimestampMs(a.createdAt) - getTimestampMs(b.createdAt));

    return await buildPublicConsultationStatus(consultation, replies);
  } catch (error) {
    console.error('[DB PublicStatus Error]', error);
    throw error;
  }
}

async function closePublicConsultationByLookup(trackingLookup, reason) {
  if (!db || !trackingLookup) return null;

  try {
    const consultationDoc = await resolvePublicConsultationDocByLookup(trackingLookup);
    if (!consultationDoc) return null;

    const consultationData = consultationDoc.data() || {};
    const wasCompleted =
      consultationData.status === 'COMPLETED' || Boolean(consultationData.closedAt);

    if (!wasCompleted) {
      await consultationDoc.ref.update({
        status: 'COMPLETED',
        closedAt: admin.firestore.FieldValue.serverTimestamp(),
        closeReason: reason || '환자가 상태 화면에서 상담 종료를 선택함',
      });
      await updatePublicStats({ completedCount: 1 });
    }

    await markUnseenDoctorRepliesAsSeen(consultationDoc.id);

    return {
      consultationId: consultationDoc.id,
      userId: consultationData.userId || null,
      alreadyClosed: wasCompleted,
    };
  } catch (error) {
    console.error('[DB PublicClose Error]', error);
    throw error;
  }
}

async function addConsultationImagesById(consultationId, files = [], options = {}) {
  const consultationDoc = await getConsultationDocById(consultationId);
  if (!consultationDoc) {
    throw new Error('CONSULTATION_NOT_FOUND');
  }

  return addConsultationImagesByDoc(consultationDoc, files, options);
}

async function addPublicConsultationImagesByLookup(trackingLookup, files = [], options = {}) {
  if (!db || !trackingLookup) {
    throw new Error('CONSULTATION_NOT_FOUND');
  }

  const consultationDoc = await resolvePublicConsultationDocByLookup(trackingLookup);
  if (!consultationDoc) {
    throw new Error('CONSULTATION_NOT_FOUND');
  }

  return addConsultationImagesByDoc(consultationDoc, files, options);
}

async function addConsultationRemoteImagesById(consultationId, urls = [], options = {}) {
  const consultationDoc = await getConsultationDocById(consultationId);
  if (!consultationDoc) {
    throw new Error('CONSULTATION_NOT_FOUND');
  }

  return addRemoteConsultationImagesByDoc(consultationDoc, urls, options);
}

async function appendPublicFollowUpQuestionByLookup(trackingLookup, question, options = {}) {
  if (!db || !trackingLookup) {
    throw new Error('CONSULTATION_NOT_FOUND');
  }

  const normalizedQuestion = sanitizeFollowUpQuestion(question);
  if (normalizedQuestion.length < 2) {
    throw new Error('FOLLOW_UP_REQUIRED');
  }

  const consultationDoc = await resolvePublicConsultationDocByLookup(trackingLookup);
  if (!consultationDoc) {
    throw new Error('CONSULTATION_NOT_FOUND');
  }

  const consultationData = consultationDoc.data() || {};
  ensureConsultationCanAcceptUpdates(consultationData);

  const logEntry = {
    action: 'PATIENT_FOLLOW_UP_QUESTION',
    timestamp: admin.firestore.Timestamp.now(),
    alertMessage: normalizedQuestion,
    source: options.source || 'web_status',
  };

  await consultationDoc.ref.set({
    followUpLogs: admin.firestore.FieldValue.arrayUnion(logEntry),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return {
    consultationId: consultationDoc.id,
    userId: consultationData.userId || null,
    question: normalizedQuestion,
    doctorNotificationMessage: buildDoctorFollowUpNotificationMessage(consultationData, normalizedQuestion),
  };
}

const HDT_REPLY = 100;
const HDT_SEEN = 50;

async function awardHDT(email, doctorName, amount, reason) {
  if (!db || !email) return;

  try {
    const ref = db.collection('doctor_stats').doc(email);
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (snapshot.exists) {
        const current = snapshot.data() || {};
        transaction.update(ref, {
          hdt: admin.firestore.FieldValue.increment(amount),
          totalReplies: reason === 'reply'
            ? admin.firestore.FieldValue.increment(1)
            : current.totalReplies || 0,
          lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        transaction.set(ref, {
          email,
          name: doctorName,
          hdt: amount,
          totalReplies: reason === 'reply' ? 1 : 0,
          lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    console.log(`[HDT] ${email} +${amount} HDT (${reason})`);
  } catch (error) {
    console.error('[HDT Award Error]', error);
  }
}

async function getHDTLeaderboard() {
  if (!db) return [];

  try {
    const snapshot = await db.collection('doctor_stats')
      .orderBy('hdt', 'desc')
      .limit(20)
      .get();

    return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    console.error('[HDT Leaderboard Error]', error);
    return [];
  }
}

async function getDoctorStats(email) {
  if (!db || !email) return null;

  try {
    const snapshot = await db.collection('doctor_stats').doc(email).get();
    return snapshot.exists ? { ...snapshot.data(), id: snapshot.id } : null;
  } catch (error) {
    console.error('[HDT Stats Error]', error);
    return null;
  }
}

function getFollowUpSessionRef(userId) {
  if (!db) return null;
  return db.collection(FOLLOW_UP_SESSIONS).doc(userId);
}

async function saveFollowUpSession(userId, payload) {
  const ref = getFollowUpSessionRef(userId);
  if (!ref) return null;

  await ref.set({
    userId,
    ...payload,
    updatedAt: new Date(),
  }, { merge: true });

  return true;
}

async function getFollowUpSession(userId) {
  const ref = getFollowUpSessionRef(userId);
  if (!ref) return null;

  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  return { ...snapshot.data(), id: snapshot.id };
}

async function deleteFollowUpSession(userId) {
  const ref = getFollowUpSessionRef(userId);
  if (!ref) return;
  await ref.delete();
}

async function getScheduledFollowUpSessions() {
  if (!db) return [];

  const snapshot = await db.collection(FOLLOW_UP_SESSIONS)
    .where('status', '==', 'scheduled')
    .get();

  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
}

async function getDueFollowUpSessionDocs(limit = 20) {
  if (!db) return [];

  const snapshot = await db.collection(FOLLOW_UP_SESSIONS)
    .where('status', '==', 'scheduled')
    .get();

  const now = Date.now();
  return snapshot.docs
    .filter((doc) => {
      const data = doc.data() || {};
      const dueAtMs = getTimestampMs(data.dueAt);
      return dueAtMs > 0 && dueAtMs <= now;
    })
    .sort((left, right) => {
      const leftDueAtMs = getTimestampMs(left.data()?.dueAt);
      const rightDueAtMs = getTimestampMs(right.data()?.dueAt);
      return leftDueAtMs - rightDueAtMs;
    })
    .slice(0, limit);
}

async function reclaimExpiredFollowUpLeases() {
  if (!db) return 0;

  const snapshot = await db.collection(FOLLOW_UP_SESSIONS)
    .where('status', '==', 'leased')
    .get();

  if (snapshot.empty) return 0;

  const now = Date.now();
  const expiredDocs = snapshot.docs.filter((doc) => {
    const data = doc.data() || {};
    const leaseExpiryMs = getTimestampMs(data.leaseExpiresAt);
    return leaseExpiryMs > 0 && leaseExpiryMs <= now;
  });

  if (expiredDocs.length === 0) return 0;

  const batch = db.batch();
  const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();
  expiredDocs.forEach((doc) => {
    const data = doc.data() || {};
    batch.update(doc.ref, {
      status: 'scheduled',
      leaseId: null,
      leaseExpiresAt: null,
      leasedAt: null,
      lastLeaseFailedAt: serverTimestamp,
      lastLeaseFailureReason: data.lastLeaseFailureReason || 'lease_expired',
    });
  });
  await batch.commit();

  return expiredDocs.length;
}

async function claimDueFollowUpSession(options = {}) {
  if (!db) return null;

  const limit = Number.isFinite(Number(options.limit)) ? Math.max(1, Number(options.limit)) : 20;
  const leaseMs = Number.isFinite(Number(options.leaseMs)) ? Math.max(1000, Number(options.leaseMs)) : 60 * 1000;

  await reclaimExpiredFollowUpLeases();
  const dueDocs = await getDueFollowUpSessionDocs(limit);
  if (dueDocs.length === 0) return null;

  for (const doc of dueDocs) {
    const leaseId = crypto.randomUUID();
    const leaseExpiresAt = new Date(Date.now() + leaseMs);

    const claimed = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(doc.ref);
      if (!snapshot.exists) return null;

      const data = snapshot.data() || {};
      if (data.status !== 'scheduled') {
        return null;
      }

      const dueAtMs = getTimestampMs(data.dueAt);
      if (!dueAtMs || dueAtMs > Date.now()) {
        return null;
      }

      transaction.update(doc.ref, {
        status: 'leased',
        leaseId,
        leaseExpiresAt,
        leasedAt: admin.firestore.FieldValue.serverTimestamp(),
        leaseAttemptCount: (Number(data.leaseAttemptCount) || 0) + 1,
        lastLeaseFailureReason: null,
      });

      return {
        ...data,
        id: snapshot.id,
        leaseId,
        leaseExpiresAt,
      };
    });

    if (claimed) {
      return claimed;
    }
  }

  return null;
}

async function releaseFollowUpLease(userId, reason = 'processing_failed') {
  const ref = getFollowUpSessionRef(userId);
  if (!ref) return false;

  const snapshot = await ref.get();
  if (!snapshot.exists) return false;

  const data = snapshot.data() || {};
  if (data.status !== 'leased') return false;

  await ref.update({
    status: 'scheduled',
    leaseId: null,
    leaseExpiresAt: null,
    leasedAt: null,
    lastLeaseFailedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastLeaseFailureReason: reason,
  });

  return true;
}

module.exports = {
  logConsultation,
  logFollowUp,
  closeConsultation,
  saveDoctorReply,
  getPendingDoctorReply,
  markReplyAsSeen,
  getActiveConsultations,
  getConsultationSummary,
  getConsultationById,
  getConsultationTrackingById,
  getLatestConsultationTracking,
  getPublicConsultationStatusByLookup,
  getPublicConsultationStatusByToken: getPublicConsultationStatusByLookup,
  closePublicConsultationByLookup,
  appendPublicFollowUpQuestionByLookup,
  addConsultationImagesById,
  addConsultationRemoteImagesById,
  addPublicConsultationImagesByLookup,
  awardHDT,
  getHDTLeaderboard,
  getDoctorStats,
  getDoctorAccessRecordByEmail,
  upsertDoctorAccessRequest,
  ensureApprovedDoctorAccess,
  approveDoctorAccessRequest,
  listPendingDoctorAccessRequests,
  getPublicStats,
  rebuildPublicStats,
  saveFollowUpSession,
  getFollowUpSession,
  deleteFollowUpSession,
  getScheduledFollowUpSessions,
  reclaimExpiredFollowUpLeases,
  claimDueFollowUpSession,
  releaseFollowUpLease,
  HDT_REPLY,
  HDT_SEEN,
  getDb: () => db,
  getAdmin: () => admin,
  getStorageBucketName: () => resolvedStorageBucketName || storageBucketName,
  getStorageBucketCandidates: () => [...storageBucketCandidates],
};
