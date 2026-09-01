const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const kakaoWebhookRoute = require('./routes/kakaoWebhook');
const messengerBotRoute = require('./routes/messengerBot');
const portalRoute = require('./routes/portal');
const publicRoute = require('./routes/public');
const dbService = require('./services/dbService');
const emailService = require('./services/emailService');
const notifyService = require('./services/notifyService');
const {
  ConfigurationError,
  DEFAULT_STATS,
  LEGACY_TOTAL,
  LEGACY_COMPLETED,
  getAlertEmailRecipients,
  getMessengerApiKey,
  getPortalOrigins,
  getRuntimeRevision,
  getSmtpConfigIssue,
  getSolapiSmsConfig,
  getSolapiSmsConfigIssue,
  getUnansweredDigestConfig,
} = require('./config');

function createStatsResponse(publicStats) {
  const consultationCount = publicStats?.consultationCount ?? 0;
  const completedCount = publicStats?.completedCount ?? 0;

  return {
    total: LEGACY_TOTAL + consultationCount,
    doctorReplied: LEGACY_COMPLETED + completedCount,
  };
}

// Deliberately synchronous and free of secrets: this is what an operator opens
// in a browser right after editing environment variables, to see whether the
// values actually landed. Every previous alerting outage was invisible because
// nothing reported channel state anywhere.
function createNotificationChannelSummary() {
  const smtpIssue = getSmtpConfigIssue();
  const solapiIssue = getSolapiSmsConfigIssue();
  const digestConfig = getUnansweredDigestConfig();
  const recipientCount = getAlertEmailRecipients().length;

  return {
    email: {
      configured: emailService.isConfigured(),
      issue: smtpIssue,
      recipientCount,
      // Configured senders with nobody to send to are silently useless.
      ready: emailService.isConfigured() && recipientCount > 0,
    },
    sms: {
      configured: Boolean(getSolapiSmsConfig()),
      issue: solapiIssue,
    },
    unansweredDigest: {
      enabled: digestConfig.enabled,
      hourKst: digestConfig.hourKst,
      ready: digestConfig.enabled && emailService.isConfigured() && recipientCount > 0,
    },
  };
}

function createRuntimeResponse() {
  const { revision, source } = getRuntimeRevision();

  return {
    ok: true,
    service: 'happydoctor-backend',
    revision,
    revisionSource: source,
    timestamp: new Date().toISOString(),
    dbConfigured: Boolean(dbService.getDb()),
    notifications: createNotificationChannelSummary(),
  };
}

function requireMessengerApiKey(req, res, next) {
  let validKey = '';

  try {
    validKey = getMessengerApiKey();
  } catch (error) {
    if (error instanceof ConfigurationError) {
      return res.status(503).json({ error: 'Service not configured' });
    }

    throw error;
  }

  if (req.headers['x-api-key'] !== validKey) {
    return res.status(401).json({ error: 'Invalid API Key' });
  }

  return next();
}

function getOldestPendingAgeMinutes(consultations, now) {
  const timestamps = consultations
    .map((consultation) => Date.parse(consultation.createdAt))
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) return null;

  return Math.floor((now - Math.min(...timestamps)) / 60000);
}

function createApp() {
  const app = express();
  // Render terminates TLS at one trusted proxy. This keeps rate-limit keys
  // bound to the originating client instead of the shared proxy address.
  app.set('trust proxy', 1);
  const portalOrigins = getPortalOrigins();

  const portalCors = cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (portalOrigins === '*') {
        return callback(null, true);
      }

      if (portalOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`[Portal CORS] Blocked origin: ${origin}`);
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use('/api/portal', portalCors);

  app.use('/api/', (req, res, next) => {
    if (req.path.startsWith('/portal')) return next();
    cors({ origin: false })(req, res, next);
  });

  app.use(express.json());

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      version: '2.0',
      template: {
        outputs: [{
          simpleText: {
            text: '처리 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
          },
        }],
      },
    },
  });

  app.use('/api/', apiLimiter);

  app.use('/api/kakao', kakaoWebhookRoute);
  app.use('/api/messengerbot', messengerBotRoute);
  app.use('/api/portal', portalRoute);
  app.use('/api/public', publicRoute);

  app.use('/api/stats', cors({ origin: '*', methods: ['GET', 'OPTIONS'] }));
  app.get('/api/stats', async (req, res) => {
    try {
      const db = dbService.getDb();
      if (!db) {
        return res.json(DEFAULT_STATS);
      }

      const publicStats = await dbService.getPublicStats();
      return res.json(createStatsResponse(publicStats));
    } catch (error) {
      console.error('[Stats Error]', error);
      return res.json(DEFAULT_STATS);
    }
  });

  app.get('/healthz', (req, res) => {
    res.set('Cache-Control', 'no-store');
    return res.status(200).json(createRuntimeResponse());
  });

  app.get('/api/version', (req, res) => {
    res.set('Cache-Control', 'no-store');
    return res.status(200).json(createRuntimeResponse());
  });

  // Queue depths and backlog age reach into Firestore and describe operational
  // state, so this one is key-protected while /api/version stays open.
  app.get('/api/notification-health', requireMessengerApiKey, async (req, res) => {
    res.set('Cache-Control', 'no-store');

    try {
      const db = dbService.getDb();
      if (!db) {
        return res.status(200).json({
          ok: false,
          reason: 'database_unavailable',
          notifications: createNotificationChannelSummary(),
        });
      }

      const [queueStatus, doctorRoomName, operatorRoomName, pending] = await Promise.all([
        notifyService.getQueueStatus(),
        notifyService.getDoctorRoomName(),
        notifyService.getOperatorAlertRoomName(),
        dbService.getActiveConsultations({ status: 'pending', limit: 100 }),
      ]);

      return res.status(200).json({
        ok: true,
        timestamp: new Date().toISOString(),
        notifications: createNotificationChannelSummary(),
        // Booleans only: room names identify people and stay out of this payload.
        kakao: {
          doctorRoomRegistered: Boolean(doctorRoomName),
          operatorAlertRoomRegistered: Boolean(operatorRoomName),
          registeredRooms: queueStatus.registeredRooms,
        },
        queues: {
          doctorNotificationsPending: queueStatus.pendingCount,
          patientPushPending: queueStatus.patientPushPending,
          patientSmsPending: queueStatus.patientSmsPending,
          patientSmsFailed: queueStatus.patientSmsFailed,
        },
        backlog: {
          unansweredConsultations: pending.total,
          oldestUnansweredAgeMinutes: getOldestPendingAgeMinutes(pending.consultations, Date.now()),
        },
      });
    } catch (error) {
      console.error('[Notification Health Error]', error);
      return res.status(500).json({ ok: false, error: 'notification_health_unavailable' });
    }
  });

  app.get('/', (req, res) => {
    res.send('<h1>Happy Doctor Chatbot Server is running.</h1>');
  });

  return app;
}

module.exports = {
  createApp,
};
