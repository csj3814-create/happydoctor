require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

const kakaoWebhookRoute = require('./routes/kakaoWebhook');
const messengerBotRoute = require('./routes/messengerBot');
const portalRoute = require('./routes/portal');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
// /api/portal/* 는 의사 포털(브라우저)에서 호출하므로 CORS 허용 필요
app.use('/api/portal', cors({
    origin: process.env.PORTAL_ORIGIN || '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// 그 외 /api/* 는 서버간 호출이므로 CORS 차단 (portal 제외)
app.use('/api/', (req, res, next) => {
    if (req.path.startsWith('/portal')) return next();
    cors({ origin: false })(req, res, next);
});
app.use(express.json());

// Rate Limiting (분당 30회)
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { version: "2.0", template: { outputs: [{ simpleText: { text: "처리량이 너무 많습니다. 잠시 후 시도해주세요." } }] } }
});
app.use('/api/', apiLimiter);

// Routes
app.use('/api/kakao', kakaoWebhookRoute);
app.use('/api/messengerbot', messengerBotRoute);
app.use('/api/portal', portalRoute);

// Public stats endpoint (홈페이지용 — 인증 불필요)
const dbService = require('./services/dbService');
app.use('/api/stats', cors({ origin: '*', methods: ['GET', 'OPTIONS'] }));
app.get('/api/stats', async (req, res) => {
    try {
        const db = dbService.getDb();
        if (!db) return res.json({ total: 0, escalated: 0, completed: 0 });
        const snap = await db.collection('consultations').get();
        const docs = snap.docs.map(d => d.data());
        res.json({
            total: docs.length,
            escalated: docs.filter(d => d.aiAction === 'ESCALATE').length,
            completed: docs.filter(d => d.status === 'COMPLETED').length
        });
    } catch (e) {
        console.error('[Stats Error]', e);
        res.status(500).json({ error: 'stats error' });
    }
});

// Health check (루트 경로)
app.get('/', (req, res) => {
    res.send('<h1>Happy Doctor Chatbot Server is running.</h1>');
});

// Render 무료 서버 슬립 방지 (14분 간격 Ping)
const PING_INTERVAL = 14 * 60 * 1000; // 14분
setInterval(async () => {
    try {
        // Render에서 제공하는 외부 URL을 환경변수 또는 기본값으로 사용
        const pingUrl = process.env.RENDER_EXTERNAL_URL || 'https://happydoctor.onrender.com';
        await axios.get(pingUrl);
        console.log(`[Keep-Alive] Pinged ${pingUrl} successfully to prevent sleeping.`);
    } catch (error) {
        console.error(`[Keep-Alive Error] Failed to ping:`, error.message);
    }
}, PING_INTERVAL);

app.listen(port, () => {
    console.log(`Happy Doctor Chatbot Server listening on port ${port}`);
});
