const { randomUUID, createHash } = require('crypto');
const { getDb, getAdmin } = require('./dbService');
const { getPatientSmsRuntimeConfig, getSolapiSmsConfig } = require('../config');

const DOCTOR_NOTIFICATIONS = 'doctor_notifications';
const FOLLOW_UP_PUSHES = 'follow_up_pushes';
const PATIENT_CHANNEL_PUSHES = 'patient_channel_pushes';
const PATIENT_SMS_NOTIFICATIONS = 'patient_sms_notifications';
const MESSENGER_ROOMS = 'messenger_rooms';
const DELIVERY_ROOMS = 'delivery_rooms';
const DOCTOR_ROOM_DOC_ID = 'doctor_room';
const DOCTOR_ROOM_KIND = 'doctor_group';
const DOCTOR_NOTIFICATION_LEASE_MS = 60 * 1000;
const PATIENT_PUSH_LEASE_MS = 60 * 1000;
const PATIENT_SMS_LEASE_MS = getPatientSmsRuntimeConfig().leaseMs || 60 * 1000;
const DEFAULT_DOCTOR_REMINDER_DELAYS_MINUTES = Object.freeze([0, 5, 15]);
const DEFAULT_DOCTOR_REPLY_REMINDER_DELAYS_MINUTES = Object.freeze([0, 5, 15]);
const DEFAULT_DOCTOR_REPLY_SMS_REMINDER_DELAYS_MINUTES = Object.freeze([0, 5, 15]);
const DOCTOR_NOTIFICATION_DUPLICATE_WINDOW_MS = 20 * 60 * 1000;
const DOCTOR_NOTIFICATION_CATCHUP_GAP_MS = 5 * 60 * 1000;
const DOCTOR_ROOM_BLOCKED_PATTERNS = Object.freeze([
  /운영위/,
  /운영위원/,
  /운영위원회/,
]);

function getCollection(name) {
  const db = getDb();
  return db ? db.collection(name) : null;
}

function normalizeRoomName(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, 120);
}

function isExplicitGroupChat(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function validateDoctorRoomCandidate(roomName, options = {}) {
  const normalizedRoomName = normalizeRoomName(roomName);
  const isGroupChat = isExplicitGroupChat(options.isGroupChat);

  if (!normalizedRoomName) {
    return {
      ok: false,
      code: 'ROOM_REQUIRED',
      roomName: '',
    };
  }

  if (!isGroupChat) {
    return {
      ok: false,
      code: 'GROUP_CHAT_REQUIRED',
      roomName: normalizedRoomName,
    };
  }

  if (DOCTOR_ROOM_BLOCKED_PATTERNS.some((pattern) => pattern.test(normalizedRoomName))) {
    return {
      ok: false,
      code: 'BLOCKED_ROOM',
      roomName: normalizedRoomName,
    };
  }

  return {
    ok: true,
    code: 'OK',
    roomName: normalizedRoomName,
  };
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

function normalizePatientPushReminderDelaysMinutes(delays = [0]) {
  const sourceDelays = typeof delays === 'undefined' ? [0] : delays;
  const fallback = [0];

  if (sourceDelays === 'doctor_reply_default') {
    return [...DEFAULT_DOCTOR_REPLY_REMINDER_DELAYS_MINUTES];
  }

  const values = Array.isArray(sourceDelays) ? sourceDelays : [sourceDelays];
  const normalized = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value >= 0)
    .map((value) => Math.round(value));

  if (normalized.length === 0) {
    return fallback;
  }

  return [...new Set(normalized)].sort((a, b) => a - b);
}

function normalizePatientSmsReminderDelaysMinutes(delays = [0]) {
  const sourceDelays = typeof delays === 'undefined' ? [0] : delays;
  const fallback = [0];

  if (sourceDelays === 'doctor_reply_default') {
    return [...DEFAULT_DOCTOR_REPLY_SMS_REMINDER_DELAYS_MINUTES];
  }

  const values = Array.isArray(sourceDelays) ? sourceDelays : [sourceDelays];
  const normalized = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value >= 0)
    .map((value) => Math.round(value));

  if (normalized.length === 0) {
    return fallback;
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

function getDoctorNotificationType(data = {}) {
  return data.type || 'triage';
}

function buildDoctorNotificationGroupKey(patientId, type = 'triage') {
  return `${patientId || 'unknown'}:${type}`;
}

function createDoctorNotificationFingerprint(message) {
  return createHash('sha1').update(String(message || '')).digest('hex').slice(0, 16);
}

function getDoctorNotificationGroupKey(data = {}, fallbackId = '') {
  return data.groupKey || buildDoctorNotificationGroupKey(data.patientId, getDoctorNotificationType(data)) || fallbackId;
}

function getDoctorNotificationInfo(doc) {
  const data = typeof doc.data === 'function' ? (doc.data() || {}) : (doc.data || {});
  const createdAtMs = toDate(data.createdAt)?.getTime() || 0;
  const groupKey = getDoctorNotificationGroupKey(data, doc.id || data.id || '');
  return {
    id: doc.id || data.id || '',
    patientId: data.patientId || '',
    type: getDoctorNotificationType(data),
    groupKey,
    scheduleKey: data.scheduleKey || `${groupKey}:${createdAtMs || 'legacy'}`,
    messageFingerprint: data.messageFingerprint || '',
    priorityWeight: getDoctorNotificationPriorityWeight(data.priority),
    availableAtMs: toDate(data.availableAt)?.getTime() || 0,
    reminderStage: Number(data.reminderStage) || 0,
    createdAtMs,
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

function compareDoctorNotificationCurrentStage(left, right) {
  const leftInfo = getDoctorNotificationInfo(left);
  const rightInfo = getDoctorNotificationInfo(right);

  if (leftInfo.availableAtMs !== rightInfo.availableAtMs) {
    return leftInfo.availableAtMs - rightInfo.availableAtMs;
  }

  if (leftInfo.reminderStage !== rightInfo.reminderStage) {
    return leftInfo.reminderStage - rightInfo.reminderStage;
  }

  return compareDoctorNotificationFreshness(left, right);
}

function splitDueDoctorNotifications(docs) {
  const groupedByNotification = new Map();

  docs.forEach((doc) => {
    const info = getDoctorNotificationInfo(doc);
    const groupKey = info.groupKey || info.id;
    if (!groupedByNotification.has(groupKey)) {
      groupedByNotification.set(groupKey, new Map());
    }

    const schedules = groupedByNotification.get(groupKey);
    const scheduleKey = info.scheduleKey || info.id;
    if (!schedules.has(scheduleKey)) {
      schedules.set(scheduleKey, []);
    }
    schedules.get(scheduleKey).push(doc);
  });

  const keep = [];
  const supersede = [];
  const defer = [];
  const now = Date.now();

  groupedByNotification.forEach((schedules) => {
    const orderedSchedules = [...schedules.values()].sort((leftGroup, rightGroup) => {
      const leftNewest = [...leftGroup].sort(compareDoctorNotificationFreshness).at(-1);
      const rightNewest = [...rightGroup].sort(compareDoctorNotificationFreshness).at(-1);
      return compareDoctorNotificationFreshness(leftNewest, rightNewest);
    });

    const activeSchedule = orderedSchedules.at(-1) || [];
    orderedSchedules.slice(0, -1).forEach((staleGroup) => {
      staleGroup.forEach((doc) => {
        supersede.push({ doc, supersededById: getDoctorNotificationInfo(activeSchedule[0]).id || null });
      });
    });

    const orderedDueDocs = [...activeSchedule].sort(compareDoctorNotificationCurrentStage);
    if (orderedDueDocs.length === 0) {
      return;
    }

    const keepDoc = orderedDueDocs[0];
    keep.push(keepDoc);

    orderedDueDocs.slice(1).forEach((doc, index) => {
      const info = getDoctorNotificationInfo(doc);
      const sameStage = info.reminderStage === getDoctorNotificationInfo(keepDoc).reminderStage;
      if (sameStage) {
        supersede.push({ doc, supersededById: getDoctorNotificationInfo(keepDoc).id || null });
        return;
      }

      defer.push({
        doc,
        availableAt: new Date(now + DOCTOR_NOTIFICATION_CATCHUP_GAP_MS * (index + 1)),
      });
    });
  });

  keep.sort(compareDoctorNotificationDueOrder);
  return { keep, supersede, defer };
}

async function normalizeDueDoctorNotifications(collection, dueDocs) {
  if (!dueDocs || dueDocs.length === 0) {
    return [];
  }

  const { keep, supersede, defer } = splitDueDoctorNotifications(dueDocs);
  if (supersede.length === 0 && defer.length === 0) {
    return keep;
  }

  const batch = getDb().batch();
  const now = getAdmin().firestore.FieldValue.serverTimestamp();
  supersede.forEach(({ doc, supersededById }) => {
    batch.update(doc.ref, {
      status: 'superseded',
      supersededAt: now,
      supersededById,
      leaseId: null,
      leaseExpiresAt: null,
      lastFailureReason: null,
    });
  });

  defer.forEach(({ doc, availableAt }) => {
    batch.update(doc.ref, {
      status: 'pending',
      availableAt,
      deferredAt: now,
      leaseId: null,
      leaseExpiresAt: null,
      lastFailureReason: null,
    });
  });

  await batch.commit();
  return keep;
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

async function getDoctorNotificationDocsForPatient(collection, patientId) {
  if (!collection || !patientId) return [];
  const snapshot = await collection.where('patientId', '==', patientId).get();
  return snapshot.docs;
}

function isDoctorNotificationActiveStatus(status) {
  return status === 'pending' || status === 'leased';
}

async function findRecentDuplicateDoctorNotification(collection, patientId, groupKey, messageFingerprint) {
  const docs = await getDoctorNotificationDocsForPatient(collection, patientId);
  const threshold = Date.now() - DOCTOR_NOTIFICATION_DUPLICATE_WINDOW_MS;

  return docs.find((doc) => {
    const data = doc.data() || {};
    const status = data.status || 'pending';
    const info = getDoctorNotificationInfo(doc);
    if (status === 'cancelled') return false;
    if (info.groupKey !== groupKey) return false;
    if ((data.messageFingerprint || '') !== messageFingerprint) return false;
    return info.createdAtMs >= threshold;
  }) || null;
}

async function cancelActiveDoctorNotificationGroup(collection, patientId, groupKey) {
  const docs = await getDoctorNotificationDocsForPatient(collection, patientId);
  const activeDocs = docs.filter((doc) => {
    const data = doc.data() || {};
    return isDoctorNotificationActiveStatus(data.status) && getDoctorNotificationInfo(doc).groupKey === groupKey;
  });

  if (activeDocs.length === 0) return 0;

  const batch = getDb().batch();
  const now = getAdmin().firestore.FieldValue.serverTimestamp();
  activeDocs.forEach((doc) => {
    batch.update(doc.ref, {
      status: 'cancelled',
      cancelledAt: now,
      cancelReason: 'replaced_by_newer_schedule',
      leaseId: null,
      leaseExpiresAt: null,
      lastFailureReason: null,
    });
  });
  await batch.commit();
  return activeDocs.length;
}

async function enqueueDoctorNotification(message, patientId, options = {}) {
  const collection = getCollection(DOCTOR_NOTIFICATIONS);
  if (!collection) {
    console.warn('[Notification] Firestore unavailable, skipping doctor notification enqueue.');
    return false;
  }

  const reminderDelaysMinutes = normalizeReminderDelaysMinutes(options.reminderDelaysMinutes);
  const type = options.type || 'triage';
  const priority = options.priority || 'normal';
  const groupKey = options.groupKey || buildDoctorNotificationGroupKey(patientId, type);
  const messageFingerprint = createDoctorNotificationFingerprint(message);

  const recentDuplicate = await findRecentDuplicateDoctorNotification(
    collection,
    patientId,
    groupKey,
    messageFingerprint,
  );
  if (recentDuplicate) {
    console.log(`[Notification Skipped] Duplicate reminder set detected for ${groupKey}`);
    return false;
  }

  await cancelActiveDoctorNotificationGroup(collection, patientId, groupKey);

  const now = Date.now();
  const scheduleId = randomUUID();
  const batch = getDb().batch();

  reminderDelaysMinutes.forEach((delayMinutes, index) => {
    const docRef = collection.doc();
    batch.set(docRef, {
      id: randomUUID(),
      message,
      patientId,
      type,
      priority,
      groupKey,
      scheduleId,
      messageFingerprint,
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
  const coalescedDocs = await normalizeDueDoctorNotifications(collection, dueDocs);
  if (coalescedDocs.length === 0) return null;

  for (const doc of coalescedDocs) {
    const leaseId = randomUUID();
    const leaseExpiresAt = new Date(Date.now() + DOCTOR_NOTIFICATION_LEASE_MS);
    const claimed = await getDb().runTransaction(async (transaction) => {
      const snapshot = await transaction.get(doc.ref);
      if (!snapshot.exists) return null;

      const data = snapshot.data() || {};
      if (data.status !== 'pending') {
        return null;
      }

      const availableAt = toDate(data.availableAt);
      if (availableAt && availableAt.getTime() > Date.now()) {
        return null;
      }

      transaction.update(doc.ref, {
        status: 'leased',
        leaseId,
        leaseExpiresAt,
        leasedAt: getAdmin().firestore.FieldValue.serverTimestamp(),
        attemptCount: (data.attemptCount || 0) + 1,
      });

      return {
        notificationId: snapshot.id,
        leaseId,
        message: data.message,
        patientId: data.patientId,
        type: data.type || 'triage',
        priority: data.priority || 'normal',
        reminderDelayMinutes: data.reminderDelayMinutes || 0,
        reminderStage: data.reminderStage || 1,
      };
    });

    if (claimed) {
      return claimed;
    }
  }

  return null;
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
  const docs = await normalizeDueDoctorNotifications(collection, dueDocs);
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

async function enqueuePatientChannelPush(userId, message, type = 'general', options = {}) {
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

  const reminderDelaysMinutes = normalizePatientPushReminderDelaysMinutes(
    typeof options.reminderDelaysMinutes === 'undefined'
      ? (type === 'doctor_reply' ? 'doctor_reply_default' : [0])
      : options.reminderDelaysMinutes,
  );
  const now = Date.now();

  for (const [index, reminderDelayMinutes] of reminderDelaysMinutes.entries()) {
    await db.collection(PATIENT_CHANNEL_PUSHES).add({
      id: randomUUID(),
      userId,
      roomName,
      message,
      type,
      status: 'pending',
      attemptCount: 0,
      createdAt: getAdmin().firestore.FieldValue.serverTimestamp(),
      availableAt: new Date(now + reminderDelayMinutes * 60 * 1000),
      reminderDelayMinutes,
      reminderStage: index + 1,
    });
  }

  console.log(`[Patient Push Enqueued] ${userId} -> ${roomName} (${type})`);
  return true;
}

async function getDuePendingPatientPushDocs(collection, limit = 20) {
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
      const leftAvailableTime = toDate(left.data()?.availableAt)?.getTime() || 0;
      const rightAvailableTime = toDate(right.data()?.availableAt)?.getTime() || 0;
      if (leftAvailableTime !== rightAvailableTime) {
        return leftAvailableTime - rightAvailableTime;
      }

      const leftCreatedTime = toDate(left.data()?.createdAt)?.getTime() || 0;
      const rightCreatedTime = toDate(right.data()?.createdAt)?.getTime() || 0;
      return leftCreatedTime - rightCreatedTime;
    })
    .slice(0, limit);
}

async function reclaimExpiredPatientPushLeases() {
  const collection = getCollection(PATIENT_CHANNEL_PUSHES);
  if (!collection) return 0;

  const snapshot = await collection
    .where('status', '==', 'leased')
    .limit(50)
    .get();

  if (snapshot.empty) return 0;

  const now = Date.now();
  const expiredDocs = snapshot.docs.filter((doc) => {
    const data = doc.data() || {};
    const leaseExpiresAt = toDate(data.leaseExpiresAt);
    return leaseExpiresAt && leaseExpiresAt.getTime() <= now;
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

async function claimPatientChannelPush() {
  const collection = getCollection(PATIENT_CHANNEL_PUSHES);
  if (!collection) return null;

  await reclaimExpiredPatientPushLeases();
  const docs = await getDuePendingPatientPushDocs(collection, 20);
  if (docs.length === 0) return null;

  for (const doc of docs) {
    const leaseId = randomUUID();
    const leaseExpiresAt = new Date(Date.now() + PATIENT_PUSH_LEASE_MS);
    const claimed = await getDb().runTransaction(async (transaction) => {
      const current = await transaction.get(doc.ref);
      if (!current.exists) return null;

      const data = current.data() || {};
      if (data.status !== 'pending') {
        return null;
      }

      transaction.update(doc.ref, {
        status: 'leased',
        leaseId,
        leaseExpiresAt,
        leasedAt: getAdmin().firestore.FieldValue.serverTimestamp(),
        attemptCount: (data.attemptCount || 0) + 1,
      });

      return {
        ...data,
        queueId: current.id,
        leaseId,
      };
    });

    if (claimed) {
      return claimed;
    }
  }

  return null;
}

async function acknowledgePatientChannelPush(queueId, payload = {}) {
  const collection = getCollection(PATIENT_CHANNEL_PUSHES);
  if (!collection || !queueId) return false;

  const docRef = collection.doc(queueId);
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

async function dequeueFUPush() {
  return claimPatientChannelPush();
}

async function dequeuePatientChannelPush() {
  return claimPatientChannelPush();
}

async function clearPatientChannelPushes(userId, type = null) {
  const collection = getCollection(PATIENT_CHANNEL_PUSHES);
  if (!collection || !userId) return 0;

  const snapshot = await collection
    .where('userId', '==', userId)
    .get();

  const docs = snapshot.docs.filter((doc) => {
    const data = doc.data() || {};
    if (data.status !== 'pending' && data.status !== 'leased') return false;
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
      leaseId: null,
      leaseExpiresAt: null,
      lastFailureReason: null,
    });
  });
  await batch.commit();

  return docs.length;
}

async function enqueuePatientSmsNotification(userId, phoneNumber, message, type = 'general', options = {}) {
  const db = getDb();
  if (!db) {
    console.warn('[Patient SMS] Firestore unavailable, skipping enqueue.');
    return false;
  }

  if (!getSolapiSmsConfig()) {
    console.warn('[Patient SMS] SOLAPI config missing, skipping SMS enqueue.');
    return false;
  }

  const normalizedPhoneNumber = typeof phoneNumber === 'string'
    ? phoneNumber.trim().replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '')
    : '';
  if (!normalizedPhoneNumber) {
    console.warn(`[Patient SMS] No phone number found for ${userId}.`);
    return false;
  }

  const reminderDelaysMinutes = normalizePatientSmsReminderDelaysMinutes(
    typeof options.reminderDelaysMinutes === 'undefined'
      ? (type === 'doctor_reply' ? 'doctor_reply_default' : [0])
      : options.reminderDelaysMinutes,
  );
  const now = Date.now();

  for (const [index, reminderDelayMinutes] of reminderDelaysMinutes.entries()) {
    await db.collection(PATIENT_SMS_NOTIFICATIONS).add({
      id: randomUUID(),
      userId,
      phoneNumber: normalizedPhoneNumber,
      message,
      type,
      provider: 'solapi',
      status: 'pending',
      attemptCount: 0,
      createdAt: getAdmin().firestore.FieldValue.serverTimestamp(),
      availableAt: new Date(now + reminderDelayMinutes * 60 * 1000),
      reminderDelayMinutes,
      reminderStage: index + 1,
    });
  }

  console.log(`[Patient SMS Enqueued] ${userId} -> ${normalizedPhoneNumber} (${type})`);
  return true;
}

async function getDuePendingPatientSmsDocs(collection, limit = 20) {
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
      const leftAvailableTime = toDate(left.data()?.availableAt)?.getTime() || 0;
      const rightAvailableTime = toDate(right.data()?.availableAt)?.getTime() || 0;
      if (leftAvailableTime !== rightAvailableTime) {
        return leftAvailableTime - rightAvailableTime;
      }

      const leftCreatedTime = toDate(left.data()?.createdAt)?.getTime() || 0;
      const rightCreatedTime = toDate(right.data()?.createdAt)?.getTime() || 0;
      return leftCreatedTime - rightCreatedTime;
    })
    .slice(0, limit);
}

async function reclaimExpiredPatientSmsLeases() {
  const collection = getCollection(PATIENT_SMS_NOTIFICATIONS);
  if (!collection) return 0;

  const snapshot = await collection
    .where('status', '==', 'leased')
    .limit(50)
    .get();

  if (snapshot.empty) return 0;

  const now = Date.now();
  const expiredDocs = snapshot.docs.filter((doc) => {
    const data = doc.data() || {};
    const leaseExpiresAt = toDate(data.leaseExpiresAt);
    return leaseExpiresAt && leaseExpiresAt.getTime() <= now;
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

async function claimPatientSmsNotification() {
  const collection = getCollection(PATIENT_SMS_NOTIFICATIONS);
  if (!collection) return null;

  await reclaimExpiredPatientSmsLeases();
  const docs = await getDuePendingPatientSmsDocs(collection, 20);
  if (docs.length === 0) return null;

  for (const doc of docs) {
    const leaseId = randomUUID();
    const leaseExpiresAt = new Date(Date.now() + PATIENT_SMS_LEASE_MS);
    const claimed = await getDb().runTransaction(async (transaction) => {
      const current = await transaction.get(doc.ref);
      if (!current.exists) return null;

      const data = current.data() || {};
      if (data.status !== 'pending') {
        return null;
      }

      transaction.update(doc.ref, {
        status: 'leased',
        leaseId,
        leaseExpiresAt,
        leasedAt: getAdmin().firestore.FieldValue.serverTimestamp(),
        attemptCount: (data.attemptCount || 0) + 1,
      });

      return {
        ...data,
        notificationId: current.id,
        leaseId,
      };
    });

    if (claimed) {
      return claimed;
    }
  }

  return null;
}

async function acknowledgePatientSmsNotification(notificationId, payload = {}) {
  const collection = getCollection(PATIENT_SMS_NOTIFICATIONS);
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

async function clearPatientSmsNotifications(userId, type = null) {
  const collection = getCollection(PATIENT_SMS_NOTIFICATIONS);
  if (!collection || !userId) return 0;

  const snapshot = await collection
    .where('userId', '==', userId)
    .get();

  const docs = snapshot.docs.filter((doc) => {
    const data = doc.data() || {};
    if (data.status !== 'pending' && data.status !== 'leased') return false;
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
      leaseId: null,
      leaseExpiresAt: null,
      lastFailureReason: null,
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

async function registerDoctorRoom(roomName, options = {}) {
  const db = getDb();
  const validation = validateDoctorRoomCandidate(roomName, {
    isGroupChat: options.isGroupChat,
  });

  if (!db) {
    return {
      ok: false,
      code: 'DB_UNAVAILABLE',
      roomName: validation.roomName,
    };
  }

  if (!validation.ok) {
    return validation;
  }

  await db.collection(DELIVERY_ROOMS).doc(DOCTOR_ROOM_DOC_ID).set({
    roomName: validation.roomName,
    kind: DOCTOR_ROOM_KIND,
    isGroupChat: true,
    registeredBy: options.registeredBy || null,
    updatedAt: getAdmin().firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  console.log(`[Doctor Room Registered] ${validation.roomName}`);
  return {
    ok: true,
    code: 'OK',
    roomName: validation.roomName,
  };
}

async function getDoctorRoomName() {
  const db = getDb();
  if (!db) return null;

  const snapshot = await db.collection(DELIVERY_ROOMS).doc(DOCTOR_ROOM_DOC_ID).get();
  if (!snapshot.exists) return null;

  const data = snapshot.data() || {};
  if (data.kind !== DOCTOR_ROOM_KIND) {
    return null;
  }

  const validation = validateDoctorRoomCandidate(data.roomName, {
    isGroupChat: data.isGroupChat,
  });
  return validation.ok ? validation.roomName : null;
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
  const patientSmsCollection = db.collection(PATIENT_SMS_NOTIFICATIONS);
  const roomsCollection = db.collection(MESSENGER_ROOMS);

  const [pendingCount, patientPushPending, patientSmsPending, registeredRooms] = await Promise.all([
    countDocuments(doctorCollection.where('status', '==', 'pending')),
    countDocuments(patientPushCollection.where('status', '==', 'pending')),
    countDocuments(patientSmsCollection.where('status', '==', 'pending')),
    countDocuments(roomsCollection),
  ]);

  return {
    pendingCount,
    fuPushPending: patientPushPending,
    patientPushPending,
    patientSmsPending,
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
  claimPatientChannelPush,
  acknowledgePatientChannelPush,
  dequeuePatientChannelPush,
  clearPatientChannelPushes,
  enqueuePatientSmsNotification,
  claimPatientSmsNotification,
  acknowledgePatientSmsNotification,
  clearPatientSmsNotifications,
  reclaimExpiredPatientSmsLeases,
  registerRoom,
  registerDoctorRoom,
  getRoomName,
  getDoctorRoomName,
  getQueueStatus,
  validateDoctorRoomCandidate,
  __test__: {
    splitDueDoctorNotifications,
    buildDoctorNotificationGroupKey,
    validateDoctorRoomCandidate,
  },
};
