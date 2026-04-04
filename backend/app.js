const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const kakaoWebhookRoute = require('./routes/kakaoWebhook');
const messengerBotRoute = require('./routes/messengerBot');
const portalRoute = require('./routes/portal');
const publicRoute = require('./routes/public');
const dbService = require('./services/dbService');
const { DEFAULT_STATS, LEGACY_TOTAL, LEGACY_COMPLETED, getPortalOrigins, getRuntimeRevision } = require('./config');

function createStatsResponse(publicStats) {
  const consultationCount = publicStats?.consultationCount ?? 0;
  const completedCount = publicStats?.completedCount ?? 0;

  return {
    total: LEGACY_TOTAL + consultationCount,
    doctorReplied: LEGACY_COMPLETED + completedCount,
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
  };
}

function createApp() {
  const app = express();
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

  app.get('/', (req, res) => {
    res.send('<h1>Happy Doctor Chatbot Server is running.</h1>');
  });

  return app;
}

module.exports = {
  createApp,
};
