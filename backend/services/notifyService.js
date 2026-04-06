const { randomUUID } = require('crypto');
const { getDb, getAdmin } = require('./dbService');

const DOCTOR_NOTIFICATIONS = 'doctor_notifications';
const FOLLOW_UP_PUSHES = 'follow_up_pushes';
const PATIENT_CHANNEL_PUSHES = 'patient_channel_pushes';
const MESSENGER_ROOMS = 'messenger_rooms';
const DELIVERY_ROOMS = 'delivery_rooms';
const DOCTOR_ROOM_DOC_ID = 'doctor_room';
const DOCTOR_NOTIFICATION_LEASE_MS = 60 * 1000;
const DEFAULT_DOCTOR_REMINDER_DELAYS_MINUTES = Object.freeze([0, 5, 15]);

function getCollection(name) {
  const db = getDb();
  return db ? db.collection(name) : null;
}

async function countDocuments(query) {
  const snapshot = await query.get();
  return snapshot.size;
}

function normalizeReminderDelaysMinutes(delays = DEFAULT_DOCTOR_REMINDER_DELAYS_MINUTES) {
  const values = Array.isArray(delays) ? delays : [delays];
  const normalized = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value >= 0)
    .map((value) => Math.round(value));

  if (normalized.length === 0) {
    return [...DEFAULT_DOCTOR_REMINDER_DELAYS_MINUTES];
  }

  return [...new Set(normalized)].sort((a, b) => a - b);
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDoctorNotificationPriorityWeight(priority) {
  if (priority === 'urgent') return 2;
  if (priority === 'high') return 1;
  return 0;
}

function getDoctorNotificationInfo(doc) {
  const data = typeof doc.data === 'function' ? (doc.data() || {}) : (doc.data || {});
  return {
    id: doc.id || data.id || '',
    patientId: data.patientId || '',
    priorityWeight: getDoctorNotificationPriorityWeight(data.priority),
    availableAtMs: toDate(data.availableAt)?.getTime() || 0,
    reminderStage: Number(data.reminderStage) || 0,
    createdAtMs: toDate(data.createdAt)?.getTime() || 0,
  };
}

function compareDoctorNotificationFreshness(left, right) {
  const leftInfo = getDoctorNotificationInfo(left);
  const rightInfo = getDoctorNotificationInfo(right);

  if (leftInfo.priorityWeight !== rightInfo.priorityWeight) {
    return leftInfo.priorityWeight - rightInfo.priorityWeight;
  }

  if (leftInfo.availableAtMs !== rightInfo.availableAtMs) {
    return leftInfo.availableAtMs - rightInfo.availableAtMs;
  }

  if (leftInfo.reminderStage !== rightInfo.reminderStage) {
    return leftInfo.reminderStage - rightInfo.reminderStage;
  }

  if (leftInfo.createdAtMs !== rightInfo.createdAtMs) {
    return leftInfo.createdAtMs - rightInfo.createdAtMs;
  }

  return String(leftInfo.id).localeCompare(String(rightInfo.id));
}

function compareDoctorNotificationDueOrder(left, right) {
  const leftInfo = getDoctorNotificationInfo(left);
  const rightInfo = getDoctorNotificationInfo(right);

  if (leftInfo.availableAtMs !== rightInfo.availableAtMs) {
    return leftInfo.availableAtMs - rightInfo.availableAtMs;
  }

  if (leftInfo.priorityWeight !== rightInfo.priorityWeight) {
    return rightInfo.priorityWeight - leftInfo.priorityWeight;
  }

  return compareDoctorNotificationFreshness(left, right);
}

function selectLatestDueDoctorNotifications(docs) {
  const grouped = new Map();
  docs.forEach((doc) => {
    const { patientId, id } = getDoctorNotificationInfo(doc);
    const key = patientId || id;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(doc);
  });

  const kept = [];
  const superseded = [];

  grouped.forEach((groupDocs) => {
    if (groupDocs.length === 1) {
      kept.push(groupDocs[0]);
      return;
    }

    const sorted = [...groupDocs].sort(compareDoctorNotificationFreshness);
    const keepDoc = sorted[sorted.length - 1];
    kept.push(keepDoc);

    sorted.slice(0, -1).forEach((doc) => {
      superseded.push({
        doc,
        supersededById: keepDoc.id,
      });
    });
  });

  kept.sort(compareDoctorNotificationDueOrder);
  return { kept, superseded };
}

async function coalesceDueDoctorNotifications(collection, dueDocs) {
  if (!dueDocs || dueDocs.length <= 1) {
    return dueDocs || [];
  }

  const { kept, superseded } = selectLatestDueDoctorNotifications(dueDocs);
  if (superseded.length === 0) {
    return kept;
  }

  const batch = getDb().batch();
  const now = getAdmin().firestore.FieldValue.serverTimestamp();
  superseded.forEach(({ doc, supersededById }) => {
    batch.update(doc.ref, {
      status: 'superseded',
      supersededAt: now,
      supersededById,
      leaseId: null,
      leaseExpiresAt: null,
      lastFailureReason: null,
    });
  });

  await batch.commit();
  return kept;
}

async function getDuePendingDoctorNotificationDocs(collection, limit = 20) {
  const snapshot = await collection
    .where('status', '==', 'pending')
    .get();

  if (snapshot.empty) return [];

  const now = Date.now();
  return snapshot.docs
    .filter((doc) => {
      const data = doc.data() || {};
      const availableAt = toDate(data.availableAt);
      return !availableAt || availableAt.getTime() <= now;
    })
    .sort((left, right) => {
      const leftTime = toDate(left.data()?.availableAt)?.getTime() || 0;
      const rightTime = toDate(right.data()?.availableAt)?.getTime() || 0;
      return leftTime - rightTime;
    })
    .slice(0, limit);
}

async function enqueueDoctorNotification(message, patientId, options = {}) {
  const collection = getCollection(DOCTOR_NOTIFICATIONS);
  if (!collection) {
    console.warn('[Notification] Firestore unavailable, skipping doctor notification enqueue.');
    return false;
  }

  const reminderDelaysMinutes = normalizeReminderDelaysMinutes(options.reminderDelaysMinutes);
  const now = Date.now();
  const batch = getDb().batch();

  reminderDelaysMinutes.forEach((delayMinutes, index) => {
    const docRef = collection.doc();
    batch.set(docRef, {
      id: randomUUID(),
      message,
      patientId,
      type: options.type || 'triage',
      priority: options.priority || 'normal',
      status: 'pending',
      reminderDelayMinutes: delayMinutes,
      reminderStage: index + 1,
      availableAt: new Date(now + delayMinutes * 60 * 1000),
      leaseId: null,
      leaseExpiresAt: null,
      attemptCount: 0,
      createdAt: getAdmin().firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();

  console.log(`[Notification Enqueued] Patient: ${patientId}, schedule: ${reminderDelaysMinutes.join('/')}`);
  return true;
}

async function reclaimExpiredDoctorNotificationLeases() {
  const collection = getCollection(DOCTOR_NOTIFICATIONS);
  if (!collection) return 0;

  const snapshot = await collection
    .where('status', '==', 'leased')
    .get();

  if (snapshot.empty) return 0;

  const now = Date.now();
  const expiredDocs = snapshot.docs.filter((doc) => {
    const data = doc.data() || {};
    const leaseExpiresAt = data.leaseExpiresAt;
    const expiry =
      leaseExpiresAt instanceof Date
        ? leaseExpiresAt
        : typeof leaseExpiresAt?.toDate === 'function'
          ? leaseExpiresAt.toDate()
          : leaseExpiresAt
            ? new Date(leaseExpiresAt)
            : null;

    return expiry && !Number.isNaN(expiry.getTime()) && expiry.getTime() <= now;
  });

  if (expiredDocs.length === 0) return 0;

  const batch = getDb().batch();
  const serverTimestamp = getAdmin().firestore.FieldValue.serverTimestamp();
  expiredDocs.forEach((doc) => {
    const data = doc.data() || {};
    batch.update(doc.ref, {
      status: 'pending',
      leaseId: null,
      leaseExpiresAt: null,
      lastFailedAt: serverTimestamp,
      lastFailureReason: data.lastFailureReason || 'lease_expired',
    });
  });
  await batch.commit();
  return expiredDocs.length;
}

async function claimDoctorNotification() {
  const collection = getCollection(DOCTOR_NOTIFICATIONS);
  if (!collection) return null;

  await reclaimExpiredDoctorNotificationLeases();
  const dueDocs = await getDuePendingDoctorNotificationDocs(collection, 20);
  const coalescedDocs = await coalesceDueDoctorNotifications(collection, dueDocs);
  if (coalescedDocs.length === 0) return null;

  const doc = coalescedDocs[0];
  const leaseId = randomUUID();
  const leaseExpiresAt = new Date(Date.now() + DOCTOR_NOTIFICATION_LEASE_MS);
  await doc.ref.update({
    status: 'leased',
    leaseId,
    leaseExpiresAt,
    leasedAt: getAdmin().firestore.FieldValue.serverTimestamp(),
    attemptCount: (doc.data()?.attemptCount || 0) + 1,
  });

  const data = doc.data();
  return {
    notificationId: doc.id,
    leaseId,
    message: data.message,
    patientId: data.patientId,
    type: data.type || 'triage',
    priority: data.priority || 'normal',
    reminderDelayMinutes: data.reminderDelayMinutes || 0,
    reminderStage: data.reminderStage || 1,
  };
}

async function acknowledgeDoctorNotification(notificationId, payload = {}) {
  const collection = getCollection(DOCTOR_NOTIFICATIONS);
  if (!collection || !notificationId) return false;

  const docRef = collection.doc(notificationId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) return false;

  const delivered = payload.delivered !== false;
  const update = delivered
    ? {
        status: 'delivered',
        deliveredAt: getAdmin().firestore.FieldValue.serverTimestamp(),
        leaseId: null,
        leaseExpiresAt: null,
        lastFailureReason: null,
      }
    : {
        status: 'pending',
        leaseId: null,
        leaseExpiresAt: null,
        lastFailedAt: getAdmin().firestore.FieldValue.serverTimestamp(),
        lastFailureReason: payload.error || 'delivery_failed',
      };

  await docRef.update(update);
  return true;
}

async function confirmDoctorNotifications() {
  const collection = getCollection(DOCTOR_NOTIFICATIONS);
  if (!collection) return [];

  await reclaimExpiredDoctorNotificationLeases();
  const dueDocs = await getDuePendingDoctorNotificationDocs(collection, 50);
  const docs = await coalesceDueDoctorNotifications(collection, dueDocs);
  if (docs.length === 0) return [];

  const batch = getDb().batch();
  const now = getAdmin().firestore.FieldValue.serverTimestamp();

  docs.forEach((doc) => {
    batch.update(doc.ref, { status: 'delivered', deliveredAt: now });
  });

  await batch.commit();

  return docs.map((doc) => {
    const data = doc.data();
    return {
      message: data.message,
      patientId: data.patientId,
      type: data.type || 'triage',
      priority: data.priority || 'normal',
      reminderDelayMinutes: data.reminderDelayMinutes || 0,
      reminderStage: data.reminderStage || 1,
    };
  });
}

async function clearDoctorNotifications(patientId) {
  const collection = getCollection(DOCTOR_NOTIFICATIONS);
  if (!collection || !patientId) return 0;

  const snapshot = await collection
    .where('patientId', '==', patientId)
    .get();

  const docs = snapshot.docs.filter((doc) => {
    const data = doc.data() || {};
    return data.status === 'pending' || data.status === 'leased';
  });

  if (docs.length === 0) return 0;

  const batch = getDb().batch();
  const now = getAdmin().firestore.FieldValue.serverTimestamp();
  docs.forEach((doc) => {
    batch.update(doc.ref, {
      status: 'cancelled',
      cancelledAt: now,
      leaseId: null,
      leaseExpiresAt: null,
      lastFailureReason: null,
    });
  });
  await batch.commit();

  return docs.length;
}

async function enqueueFUPush(userId, message) {
  return enqueuePatientChannelPush(userId, message, 'follow_up');
}

async function enqueuePatientChannelPush(userId, message, type = 'general') {
  const db = getDb();
  if (!db) {
    console.warn('[Patient Push] Firestore unavailable, skipping enqueue.');
    return false;
  }

  const roomSnapshot = await db.collection(MESSENGER_ROOMS).doc(userId).get();
  const roomName = roomSnapshot.exists ? roomSnapshot.data().roomName : null;

  if (!roomName) {
    console.warn(`[Patient Push] No registered room found for ${userId}.`);
    return false;
  }

  await db.collection(PATIENT_CHANNEL_PUSHES).add({
    id: randomUUID(),
    userId,
    roomName,
    message,
    type,
    status: 'pending',
    createdAt: getAdmin().firestore.FieldValue.serverTimestamp(),
  });

  console.log(`[Patient Push Enqueued] ${userId} -> ${roomName} (${type})`);
  return true;
}

async function dequeueFUPush() {
  return dequeuePatientChannelPush();
}

async function dequeuePatientChannelPush() {
  const collection = getCollection(PATIENT_CHANNEL_PUSHES);
  if (!collection) return null;

  const snapshot = await collection
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  await doc.ref.update({
    status: 'delivered',
    deliveredAt: getAdmin().firestore.FieldValue.serverTimestamp(),
  });

  return doc.data();
}

async function clearPatientChannelPushes(userId, type = null) {
  const collection = getCollection(PATIENT_CHANNEL_PUSHES);
  if (!collection || !userId) return 0;

  const snapshot = await collection
    .where('userId', '==', userId)
    .get();

  const docs = snapshot.docs.filter((doc) => {
    const data = doc.data() || {};
    if (data.status !== 'pending') return false;
    if (type && data.type !== type) return false;
    return true;
  });

  if (docs.length === 0) return 0;

  const batch = getDb().batch();
  const now = getAdmin().firestore.FieldValue.serverTimestamp();
  docs.forEach((doc) => {
    batch.update(doc.ref, {
      status: 'cancelled',
      cancelledAt: now,
    });
  });
  await batch.commit();

  return docs.length;
}

async function registerRoom(userId, roomName) {
  const db = getDb();
  if (!db) {
    console.warn('[Room Registered] Firestore unavailable, skipping room registration.');
    return false;
  }

  await db.collection(MESSENGER_ROOMS).doc(userId).set({
    userId,
    roomName,
    updatedAt: getAdmin().firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  console.log(`[Room Registered] ${userId} -> ${roomName}`);
  return true;
}

async function registerDoctorRoom(roomName) {
  const db = getDb();
  if (!db || !roomName) {
    return false;
  }

  await db.collection(DELIVERY_ROOMS).doc(DOCTOR_ROOM_DOC_ID).set({
    roomName,
    updatedAt: getAdmin().firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  console.log(`[Doctor Room Registered] ${roomName}`);
  return true;
}

async function getDoctorRoomName() {
  const db = getDb();
  if (!db) return null;

  const snapshot = await db.collection(DELIVERY_ROOMS).doc(DOCTOR_ROOM_DOC_ID).get();
  if (!snapshot.exists) return null;
  return snapshot.data()?.roomName || null;
}

async function getRoomName(userId) {
  const db = getDb();
  if (!db) return null;

  const snapshot = await db.collection(MESSENGER_ROOMS).doc(userId).get();
  return snapshot.exists ? snapshot.data().roomName || null : null;
}

async function getQueueStatus() {
  const db = getDb();
  if (!db) {
    return {
      pendingCount: 0,
      fuPushPending: 0,
      registeredRooms: 0,
    };
  }

  const doctorCollection = db.collection(DOCTOR_NOTIFICATIONS);
  const patientPushCollection = db.collection(PATIENT_CHANNEL_PUSHES);
  const roomsCollection = db.collection(MESSENGER_ROOMS);

  const [pendingCount, patientPushPending, registeredRooms] = await Promise.all([
    countDocuments(doctorCollection.where('status', '==', 'pending')),
    countDocuments(patientPushCollection.where('status', '==', 'pending')),
    countDocuments(roomsCollection),
  ]);

  return {
    pendingCount,
    fuPushPending: patientPushPending,
    patientPushPending,
    registeredRooms,
  };
}

module.exports = {
  enqueueDoctorNotification,
  claimDoctorNotification,
  acknowledgeDoctorNotification,
  confirmDoctorNotifications,
  clearDoctorNotifications,
  enqueueFUPush,
  dequeueFUPush,
  enqueuePatientChannelPush,
  dequeuePatientChannelPush,
  clearPatientChannelPushes,
  registerRoom,
  registerDoctorRoom,
  getRoomName,
  getDoctorRoomName,
  getQueueStatus,
  __test__: {
    selectLatestDueDoctorNotifications,
  },
};
