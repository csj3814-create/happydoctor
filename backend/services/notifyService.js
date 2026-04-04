const { randomUUID } = require('crypto');
const { getDb, getAdmin } = require('./dbService');

const DOCTOR_NOTIFICATIONS = 'doctor_notifications';
const FOLLOW_UP_PUSHES = 'follow_up_pushes';
const MESSENGER_ROOMS = 'messenger_rooms';

function getCollection(name) {
  const db = getDb();
  return db ? db.collection(name) : null;
}

async function countDocuments(query) {
  const snapshot = await query.get();
  return snapshot.size;
}

async function enqueueDoctorNotification(message, patientId) {
  const collection = getCollection(DOCTOR_NOTIFICATIONS);
  if (!collection) {
    console.warn('[Notification] Firestore unavailable, skipping doctor notification enqueue.');
    return false;
  }

  await collection.add({
    id: randomUUID(),
    message,
    patientId,
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
  return { message: data.message, patientId: data.patientId };
}

async function confirmDoctorNotifications() {
  const collection = getCollection(DOCTOR_NOTIFICATIONS);
  if (!collection) return [];

  const [pendingSnap, notifiedSnap] = await Promise.all([
    collection.where('status', '==', 'pending').get(),
    collection.where('status', '==', 'notified').get(),
  ]);

  const docs = [...pendingSnap.docs, ...notifiedSnap.docs];
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
    };
  });
}

async function enqueueFUPush(userId, message) {
  const db = getDb();
  if (!db) {
    console.warn('[F/U Push] Firestore unavailable, skipping enqueue.');
    return false;
  }

  const roomSnapshot = await db.collection(MESSENGER_ROOMS).doc(userId).get();
  const roomName = roomSnapshot.exists ? roomSnapshot.data().roomName : null;

  if (!roomName) {
    console.warn(`[F/U Push] No registered room found for ${userId}.`);
    return false;
  }

  await db.collection(FOLLOW_UP_PUSHES).add({
    id: randomUUID(),
    userId,
    roomName,
    message,
    status: 'pending',
    createdAt: getAdmin().firestore.FieldValue.serverTimestamp(),
  });

  console.log(`[F/U Push Enqueued] ${userId} -> ${roomName}`);
  return true;
}

async function dequeueFUPush() {
  const collection = getCollection(FOLLOW_UP_PUSHES);
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
  const followUpCollection = db.collection(FOLLOW_UP_PUSHES);
  const roomsCollection = db.collection(MESSENGER_ROOMS);

  const [pendingCount, fuPushPending, registeredRooms] = await Promise.all([
    countDocuments(doctorCollection.where('status', '==', 'pending')),
    countDocuments(followUpCollection.where('status', '==', 'pending')),
    countDocuments(roomsCollection),
  ]);

  return {
    pendingCount,
    fuPushPending,
    registeredRooms,
  };
}

module.exports = {
  enqueueDoctorNotification,
  peekDoctorNotification,
  confirmDoctorNotifications,
  enqueueFUPush,
  dequeueFUPush,
  registerRoom,
  getRoomName,
  getQueueStatus,
};
