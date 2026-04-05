const { randomUUID } = require('crypto');
const { getDb, getAdmin } = require('./dbService');

const DOCTOR_NOTIFICATIONS = 'doctor_notifications';
const FOLLOW_UP_PUSHES = 'follow_up_pushes';
const PATIENT_CHANNEL_PUSHES = 'patient_channel_pushes';
const MESSENGER_ROOMS = 'messenger_rooms';
const DELIVERY_ROOMS = 'delivery_rooms';
const DOCTOR_ROOM_DOC_ID = 'doctor_room';

function getCollection(name) {
  const db = getDb();
  return db ? db.collection(name) : null;
}

async function countDocuments(query) {
  const snapshot = await query.get();
  return snapshot.size;
}

async function enqueueDoctorNotification(message, patientId, options = {}) {
  const collection = getCollection(DOCTOR_NOTIFICATIONS);
  if (!collection) {
    console.warn('[Notification] Firestore unavailable, skipping doctor notification enqueue.');
    return false;
  }

  await collection.add({
    id: randomUUID(),
    message,
    patientId,
    type: options.type || 'triage',
    priority: options.priority || 'normal',
    status: 'pending',
    createdAt: getAdmin().firestore.FieldValue.serverTimestamp(),
  });

  console.log(`[Notification Enqueued] Patient: ${patientId}`);
  return true;
}

async function peekDoctorNotification() {
  const collection = getCollection(DOCTOR_NOTIFICATIONS);
  if (!collection) return null;

  const snapshot = await collection
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  await doc.ref.update({
    status: 'notified',
    notifiedAt: getAdmin().firestore.FieldValue.serverTimestamp(),
  });

  const data = doc.data();
  return {
    message: data.message,
    patientId: data.patientId,
    type: data.type || 'triage',
    priority: data.priority || 'normal',
  };
}

async function confirmDoctorNotifications() {
  const collection = getCollection(DOCTOR_NOTIFICATIONS);
  if (!collection) return [];

  const pendingSnap = await collection.where('status', '==', 'pending').get();
  const docs = pendingSnap.docs;
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
    };
  });
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
  peekDoctorNotification,
  confirmDoctorNotifications,
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
};
