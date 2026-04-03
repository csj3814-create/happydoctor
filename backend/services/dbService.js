const admin = require('firebase-admin');

const PUBLIC_STATS_PATH = ['system', 'public_stats'];
const FOLLOW_UP_SESSIONS = 'follow_up_sessions';

let db = null;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
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

async function logConsultation(userId, patientData, analysisResult) {
  if (!db) return null;

  try {
    const docRef = db.collection('consultations').doc();

    await docRef.set({
      userId,
      patientData,
      aiAction: analysisResult.action,
      chatbotReply: analysisResult.replyToPatient,
      doctorChart: analysisResult.soapChartForDoctor || 'None',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'ACTIVE',
      followUpLogs: [],
    });

    await updatePublicStats({ consultationCount: 1 });

    console.log(`[DB Logged] Consultation saved. Doc ID: ${docRef.id}`);
    return docRef.id;
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
    filtered = filtered.filter((doc) => doc.status === 'ACTIVE' && !doc.doctorRepliedAt);
  } else if (status === 'replied') {
    filtered = filtered.filter((doc) => doc.status === 'ACTIVE' && !!doc.doctorRepliedAt);
  } else if (status === 'closed') {
    filtered = filtered.filter((doc) => doc.status === 'COMPLETED' || !!doc.closedAt);
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
    const ta = a.createdAt?.toMillis?.() ?? 0;
    const tb = b.createdAt?.toMillis?.() ?? 0;
    return tb - ta;
  });

  const offset = Math.max(0, Number(options.offset) || 0);
  const limit = Math.max(1, Math.min(100, Number(options.limit) || 50));

  return {
    total: filtered.length,
    consultations: filtered.slice(offset, offset + limit),
  };
}

async function getActiveConsultations(options = {}) {
  if (!db) return { consultations: [], total: 0 };

  try {
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

    const docs = [
      ...activeSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id })),
      ...completedSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id })),
    ];

    return applyConsultationViewOptions(docs, options);
  } catch (error) {
    console.error('[DB GetActive Error]', error);
    return { consultations: [], total: 0 };
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

      if (legacySnapshot.empty) return null;
      doc = legacySnapshot.docs[0];
    }

    const repliesSnap = await db.collection('doctor_replies')
      .where('consultationId', '==', doc.id)
      .orderBy('createdAt', 'asc')
      .get();

    const replies = repliesSnap.docs.map((reply) => ({ ...reply.data(), id: reply.id }));
    return { ...doc.data(), id: doc.id, doctorReplies: replies };
  } catch (error) {
    console.error('[DB GetById Error]', error);
    return null;
  }
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

module.exports = {
  logConsultation,
  logFollowUp,
  closeConsultation,
  saveDoctorReply,
  getPendingDoctorReply,
  markReplyAsSeen,
  getActiveConsultations,
  getConsultationById,
  awardHDT,
  getHDTLeaderboard,
  getDoctorStats,
  getPublicStats,
  rebuildPublicStats,
  saveFollowUpSession,
  getFollowUpSession,
  deleteFollowUpSession,
  getScheduledFollowUpSessions,
  HDT_REPLY,
  HDT_SEEN,
  getDb: () => db,
  getAdmin: () => admin,
};
