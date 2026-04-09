const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const DB_SERVICE_PATH = path.resolve(__dirname, '../services/dbService.js');
const NOTIFY_SERVICE_PATH = path.resolve(__dirname, '../services/notifyService.js');

function clone(value) {
  return structuredClone(value);
}

function createSeededCollections(seed = {}) {
  const collections = new Map();
  Object.entries(seed).forEach(([collectionName, docs]) => {
    const map = new Map();
    Object.entries(docs).forEach(([id, data]) => {
      map.set(id, clone(data));
    });
    collections.set(collectionName, map);
  });
  return collections;
}

function createFirestoreMock(seed = {}) {
  const state = {
    collections: createSeededCollections(seed),
    nextId: 1,
    nextTimestampMs: Date.parse('2026-04-09T00:00:00.000Z'),
  };

  function ensureCollection(name) {
    if (!state.collections.has(name)) {
      state.collections.set(name, new Map());
    }
    return state.collections.get(name);
  }

  function resolveValue(value) {
    if (value && typeof value === 'object' && value.__serverTimestamp === true) {
      const date = new Date(state.nextTimestampMs);
      state.nextTimestampMs += 1;
      return date;
    }

    if (value instanceof Date) {
      return new Date(value.getTime());
    }

    if (Array.isArray(value)) {
      return value.map(resolveValue);
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, childValue]) => [key, resolveValue(childValue)]),
      );
    }

    return value;
  }

  function createDocRef(collectionName, id) {
    return {
      id,
      collectionName,
      async get() {
        return createDocSnapshot(collectionName, id);
      },
      async update(update) {
        applyUpdate({ id, collectionName }, update);
      },
    };
  }

  function createDocSnapshot(collectionName, id) {
    const collection = ensureCollection(collectionName);
    const data = collection.get(id);
    return {
      id,
      ref: createDocRef(collectionName, id),
      exists: data !== undefined,
      data() {
        return data === undefined ? undefined : clone(data);
      },
    };
  }

  function applyUpdate(docRef, update) {
    const collection = ensureCollection(docRef.collectionName);
    const current = collection.get(docRef.id);
    if (!current) {
      throw new Error(`Document ${docRef.id} does not exist`);
    }

    collection.set(docRef.id, {
      ...current,
      ...resolveValue(update),
    });
  }

  function createQuery(collectionName, predicates = [], limitCount = null) {
    return {
      where(field, op, value) {
        if (op !== '==') {
          throw new Error(`Unsupported operator: ${op}`);
        }
        return createQuery(collectionName, [...predicates, { field, value }], limitCount);
      },
      limit(value) {
        return createQuery(collectionName, predicates, value);
      },
      async get() {
        let docs = [...ensureCollection(collectionName).entries()].map(([id, data]) => ({
          id,
          ref: createDocRef(collectionName, id),
          exists: true,
          data() {
            return clone(data);
          },
        }));

        docs = docs.filter((doc) => predicates.every((predicate) => doc.data()?.[predicate.field] === predicate.value));
        if (typeof limitCount === 'number') {
          docs = docs.slice(0, limitCount);
        }

        return {
          empty: docs.length === 0,
          size: docs.length,
          docs,
        };
      },
    };
  }

  const db = {
    collection(collectionName) {
      return {
        doc(id) {
          const docRef = createDocRef(collectionName, id);
          docRef.collectionName = collectionName;
          return docRef;
        },
        async add(data) {
          const id = `doc-${state.nextId++}`;
          ensureCollection(collectionName).set(id, resolveValue(data));
          const docRef = createDocRef(collectionName, id);
          docRef.collectionName = collectionName;
          return docRef;
        },
        where(field, op, value) {
          return createQuery(collectionName, [{ field, value }]);
        },
        limit(value) {
          return createQuery(collectionName, [], value);
        },
        async get() {
          return createQuery(collectionName).get();
        },
      };
    },
    async runTransaction(handler) {
      return handler({
        async get(docRef) {
          return docRef.get();
        },
        update(docRef, update) {
          applyUpdate(docRef, update);
        },
      });
    },
    batch() {
      const operations = [];
      return {
        update(docRef, update) {
          operations.push(() => applyUpdate(docRef, update));
        },
        async commit() {
          operations.forEach((operation) => operation());
        },
      };
    },
  };

  return {
    db,
    getDoc(collectionName, id) {
      const collection = ensureCollection(collectionName);
      const data = collection.get(id);
      return data === undefined ? null : clone(data);
    },
    listDocs(collectionName) {
      return [...ensureCollection(collectionName).entries()].map(([id, data]) => ({
        id,
        data: clone(data),
      }));
    },
  };
}

function loadNotifyService(seed = {}) {
  const originalDbService = require.cache[DB_SERVICE_PATH];
  const originalNotifyService = require.cache[NOTIFY_SERVICE_PATH];
  const firestore = createFirestoreMock(seed);
  const fakeAdmin = {
    firestore: {
      FieldValue: {
        serverTimestamp: () => ({ __serverTimestamp: true }),
      },
    },
  };

  delete require.cache[NOTIFY_SERVICE_PATH];
  require.cache[DB_SERVICE_PATH] = {
    id: DB_SERVICE_PATH,
    filename: DB_SERVICE_PATH,
    loaded: true,
    exports: {
      getDb: () => firestore.db,
      getAdmin: () => fakeAdmin,
    },
  };

  const service = require(NOTIFY_SERVICE_PATH);

  return {
    service,
    getDoc: firestore.getDoc,
    listDocs: firestore.listDocs,
    restore() {
      delete require.cache[NOTIFY_SERVICE_PATH];
      if (originalNotifyService) {
        require.cache[NOTIFY_SERVICE_PATH] = originalNotifyService;
      }

      if (originalDbService) {
        require.cache[DB_SERVICE_PATH] = originalDbService;
      } else {
        delete require.cache[DB_SERVICE_PATH];
      }
    },
  };
}

test('claimPatientChannelPush leases the oldest pending push and delivered ack completes it', { concurrency: false }, async () => {
  const context = loadNotifyService({
    messenger_rooms: {
      patientA: { roomName: 'room-a' },
    },
  });

  try {
    const enqueued = await context.service.enqueuePatientChannelPush('patientA', 'follow-up message', 'follow_up');
    assert.equal(enqueued, true);

    const [{ id: queueId }] = context.listDocs('patient_channel_pushes');
    const claimed = await context.service.claimPatientChannelPush();

    assert.equal(claimed.queueId, queueId);
    assert.equal(claimed.userId, 'patientA');
    assert.equal(claimed.type, 'follow_up');

    const leasedDoc = context.getDoc('patient_channel_pushes', queueId);
    assert.equal(leasedDoc.status, 'leased');
    assert.equal(leasedDoc.attemptCount, 1);
    assert.ok(typeof leasedDoc.leaseId === 'string' && leasedDoc.leaseId.length > 0);
    assert.ok(leasedDoc.leaseExpiresAt instanceof Date);

    const acknowledged = await context.service.acknowledgePatientChannelPush(queueId, { delivered: true });
    assert.equal(acknowledged, true);

    const deliveredDoc = context.getDoc('patient_channel_pushes', queueId);
    assert.equal(deliveredDoc.status, 'delivered');
    assert.equal(deliveredDoc.leaseId, null);
    assert.equal(deliveredDoc.leaseExpiresAt, null);
    assert.equal(deliveredDoc.lastFailureReason, null);
    assert.ok(deliveredDoc.deliveredAt instanceof Date);
  } finally {
    context.restore();
  }
});

test('enqueuePatientChannelPush stores due and future doctor-reply reminders and only the due reminder is claimable immediately', { concurrency: false }, async () => {
  const context = loadNotifyService({
    messenger_rooms: {
      patientA: { roomName: 'room-a' },
    },
  });

  try {
    const enqueued = await context.service.enqueuePatientChannelPush(
      'patientA',
      'doctor reply message',
      'doctor_reply',
      {
        reminderDelaysMinutes: [0, 5, 15],
      },
    );
    assert.equal(enqueued, true);

    const queuedPushes = context.listDocs('patient_channel_pushes');
    assert.equal(queuedPushes.length, 3);
    assert.deepEqual(
      queuedPushes.map((entry) => entry.data.reminderDelayMinutes),
      [0, 5, 15],
    );
    assert.deepEqual(
      queuedPushes.map((entry) => entry.data.reminderStage),
      [1, 2, 3],
    );

    const claimed = await context.service.claimPatientChannelPush();
    assert.equal(claimed.type, 'doctor_reply');

    const leasedCount = context
      .listDocs('patient_channel_pushes')
      .filter((entry) => entry.data.status === 'leased').length;
    const pendingDocs = context
      .listDocs('patient_channel_pushes')
      .filter((entry) => entry.data.status === 'pending');

    assert.equal(leasedCount, 1);
    assert.equal(pendingDocs.length, 2);
    assert(pendingDocs.every((entry) => entry.data.availableAt instanceof Date));
    assert(pendingDocs.every((entry) => entry.data.availableAt.getTime() > Date.now()));
  } finally {
    context.restore();
  }
});

test('failed patient push ack returns the queue to pending and allows a retry claim', { concurrency: false }, async () => {
  const context = loadNotifyService({
    messenger_rooms: {
      patientA: { roomName: 'room-a' },
    },
  });

  try {
    await context.service.enqueuePatientChannelPush('patientA', 'doctor reply', 'doctor_reply');
    const [{ id: queueId }] = context.listDocs('patient_channel_pushes');

    await context.service.claimPatientChannelPush();
    const failed = await context.service.acknowledgePatientChannelPush(queueId, {
      delivered: false,
      error: 'reply_room_failed',
    });

    assert.equal(failed, true);

    const pendingAgain = context.getDoc('patient_channel_pushes', queueId);
    assert.equal(pendingAgain.status, 'pending');
    assert.equal(pendingAgain.leaseId, null);
    assert.equal(pendingAgain.leaseExpiresAt, null);
    assert.equal(pendingAgain.lastFailureReason, 'reply_room_failed');
    assert.ok(pendingAgain.lastFailedAt instanceof Date);

    const claimedAgain = await context.service.claimPatientChannelPush();
    assert.equal(claimedAgain.queueId, queueId);

    const retriedDoc = context.getDoc('patient_channel_pushes', queueId);
    assert.equal(retriedDoc.status, 'leased');
    assert.equal(retriedDoc.attemptCount, 2);
  } finally {
    context.restore();
  }
});

test('claimPatientChannelPush reclaims expired leases before selecting the next push', { concurrency: false }, async () => {
  const expiredLeaseTime = new Date('2026-04-08T23:50:00.000Z');
  const newerPendingTime = new Date('2026-04-09T00:10:00.000Z');
  const context = loadNotifyService({
    patient_channel_pushes: {
      'expired-push': {
        userId: 'patientA',
        roomName: 'room-a',
        message: 'stale push',
        type: 'follow_up',
        status: 'leased',
        attemptCount: 1,
        createdAt: new Date('2026-04-08T23:40:00.000Z'),
        leaseId: 'expired-lease',
        leaseExpiresAt: expiredLeaseTime,
      },
      'newer-pending': {
        userId: 'patientB',
        roomName: 'room-b',
        message: 'new push',
        type: 'general',
        status: 'pending',
        attemptCount: 0,
        createdAt: newerPendingTime,
      },
    },
  });

  try {
    const claimed = await context.service.claimPatientChannelPush();

    assert.equal(claimed.queueId, 'expired-push');
    assert.equal(claimed.message, 'stale push');

    const reclaimedDoc = context.getDoc('patient_channel_pushes', 'expired-push');
    assert.equal(reclaimedDoc.status, 'leased');
    assert.equal(reclaimedDoc.attemptCount, 2);
    assert.equal(reclaimedDoc.lastFailureReason, 'lease_expired');
    assert.ok(reclaimedDoc.lastFailedAt instanceof Date);
  } finally {
    context.restore();
  }
});

test('clearPatientChannelPushes cancels both pending and leased pushes for the requested type only', { concurrency: false }, async () => {
  const context = loadNotifyService({
    patient_channel_pushes: {
      'reply-pending': {
        userId: 'patientA',
        roomName: 'room-a',
        message: 'reply pending',
        type: 'doctor_reply',
        status: 'pending',
        attemptCount: 0,
        createdAt: new Date('2026-04-09T00:00:00.000Z'),
      },
      'reply-leased': {
        userId: 'patientA',
        roomName: 'room-a',
        message: 'reply leased',
        type: 'doctor_reply',
        status: 'leased',
        attemptCount: 1,
        leaseId: 'lease-1',
        leaseExpiresAt: new Date('2026-04-09T00:05:00.000Z'),
        createdAt: new Date('2026-04-09T00:01:00.000Z'),
      },
      'follow-up-pending': {
        userId: 'patientA',
        roomName: 'room-a',
        message: 'follow up pending',
        type: 'follow_up',
        status: 'pending',
        attemptCount: 0,
        createdAt: new Date('2026-04-09T00:02:00.000Z'),
      },
    },
  });

  try {
    const clearedCount = await context.service.clearPatientChannelPushes('patientA', 'doctor_reply');
    assert.equal(clearedCount, 2);

    const pendingReply = context.getDoc('patient_channel_pushes', 'reply-pending');
    assert.equal(pendingReply.status, 'cancelled');
    assert.equal(pendingReply.leaseId, null);
    assert.equal(pendingReply.leaseExpiresAt, null);

    const leasedReply = context.getDoc('patient_channel_pushes', 'reply-leased');
    assert.equal(leasedReply.status, 'cancelled');
    assert.equal(leasedReply.leaseId, null);
    assert.equal(leasedReply.leaseExpiresAt, null);
    assert.equal(leasedReply.lastFailureReason, null);

    const untouchedFollowUp = context.getDoc('patient_channel_pushes', 'follow-up-pending');
    assert.equal(untouchedFollowUp.status, 'pending');
  } finally {
    context.restore();
  }
});

test('claimDoctorNotification leases a due notification and delivered ack completes it', { concurrency: false }, async () => {
  const context = loadNotifyService({
    doctor_notifications: {
      'doctor-1': {
        message: 'urgent triage',
        patientId: 'patientA',
        type: 'triage',
        priority: 'high',
        groupKey: 'patientA:triage',
        scheduleKey: 'patientA:triage:schedule-1',
        messageFingerprint: 'fingerprint-1',
        status: 'pending',
        reminderDelayMinutes: 0,
        reminderStage: 1,
        availableAt: new Date('2026-04-08T23:00:00.000Z'),
        attemptCount: 0,
        createdAt: new Date('2026-04-08T23:00:00.000Z'),
      },
    },
  });

  try {
    const claimed = await context.service.claimDoctorNotification();
    assert.equal(claimed.notificationId, 'doctor-1');
    assert.equal(claimed.patientId, 'patientA');
    assert.equal(claimed.priority, 'high');

    const leasedDoc = context.getDoc('doctor_notifications', 'doctor-1');
    assert.equal(leasedDoc.status, 'leased');
    assert.equal(leasedDoc.attemptCount, 1);
    assert.ok(typeof leasedDoc.leaseId === 'string' && leasedDoc.leaseId.length > 0);
    assert.ok(leasedDoc.leaseExpiresAt instanceof Date);

    const acknowledged = await context.service.acknowledgeDoctorNotification('doctor-1', {
      delivered: true,
    });
    assert.equal(acknowledged, true);

    const deliveredDoc = context.getDoc('doctor_notifications', 'doctor-1');
    assert.equal(deliveredDoc.status, 'delivered');
    assert.equal(deliveredDoc.leaseId, null);
    assert.equal(deliveredDoc.leaseExpiresAt, null);
    assert.equal(deliveredDoc.lastFailureReason, null);
    assert.ok(deliveredDoc.deliveredAt instanceof Date);
  } finally {
    context.restore();
  }
});

test('failed doctor notification ack returns it to pending and allows retry claim', { concurrency: false }, async () => {
  const context = loadNotifyService({
    doctor_notifications: {
      'doctor-2': {
        message: 'needs review',
        patientId: 'patientA',
        type: 'triage',
        priority: 'normal',
        groupKey: 'patientA:triage',
        scheduleKey: 'patientA:triage:schedule-2',
        messageFingerprint: 'fingerprint-2',
        status: 'pending',
        reminderDelayMinutes: 5,
        reminderStage: 1,
        availableAt: new Date('2026-04-08T23:05:00.000Z'),
        attemptCount: 0,
        createdAt: new Date('2026-04-08T23:05:00.000Z'),
      },
    },
  });

  try {
    await context.service.claimDoctorNotification();
    const failed = await context.service.acknowledgeDoctorNotification('doctor-2', {
      delivered: false,
      error: 'reply_room_failed',
    });

    assert.equal(failed, true);

    const pendingAgain = context.getDoc('doctor_notifications', 'doctor-2');
    assert.equal(pendingAgain.status, 'pending');
    assert.equal(pendingAgain.leaseId, null);
    assert.equal(pendingAgain.leaseExpiresAt, null);
    assert.equal(pendingAgain.lastFailureReason, 'reply_room_failed');
    assert.ok(pendingAgain.lastFailedAt instanceof Date);

    const claimedAgain = await context.service.claimDoctorNotification();
    assert.equal(claimedAgain.notificationId, 'doctor-2');

    const retriedDoc = context.getDoc('doctor_notifications', 'doctor-2');
    assert.equal(retriedDoc.status, 'leased');
    assert.equal(retriedDoc.attemptCount, 2);
  } finally {
    context.restore();
  }
});

test('claimDoctorNotification supersedes older due schedules for the same patient group', { concurrency: false }, async () => {
  const context = loadNotifyService({
    doctor_notifications: {
      'older-schedule': {
        message: 'older triage',
        patientId: 'patientA',
        type: 'triage',
        priority: 'normal',
        groupKey: 'patientA:triage',
        scheduleKey: 'patientA:triage:schedule-old',
        messageFingerprint: 'fingerprint-old',
        status: 'pending',
        reminderDelayMinutes: 0,
        reminderStage: 1,
        availableAt: new Date('2026-04-08T22:00:00.000Z'),
        attemptCount: 0,
        createdAt: new Date('2026-04-08T22:00:00.000Z'),
      },
      'newer-schedule': {
        message: 'newer triage',
        patientId: 'patientA',
        type: 'triage',
        priority: 'normal',
        groupKey: 'patientA:triage',
        scheduleKey: 'patientA:triage:schedule-new',
        messageFingerprint: 'fingerprint-new',
        status: 'pending',
        reminderDelayMinutes: 0,
        reminderStage: 1,
        availableAt: new Date('2026-04-08T22:05:00.000Z'),
        attemptCount: 0,
        createdAt: new Date('2026-04-08T22:05:00.000Z'),
      },
    },
  });

  try {
    const claimed = await context.service.claimDoctorNotification();

    assert.equal(claimed.notificationId, 'newer-schedule');

    const olderDoc = context.getDoc('doctor_notifications', 'older-schedule');
    assert.equal(olderDoc.status, 'superseded');
    assert.equal(olderDoc.supersededById, 'newer-schedule');

    const newerDoc = context.getDoc('doctor_notifications', 'newer-schedule');
    assert.equal(newerDoc.status, 'leased');
    assert.equal(newerDoc.attemptCount, 1);
  } finally {
    context.restore();
  }
});
