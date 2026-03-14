require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

const kakaoWebhookRoute = require('./routes/kakaoWebhook');
const messengerBotRoute = require('./routes/messengerBot');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
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

// Health check (루트 경로)
app.get('/', (req, res) => {
    res.send('<h1>Happy Doctor Chatbot Server is running.</h1>');
});

// Render 무료 서버 슬립 방지 (14분 간격 Ping)
const PING_INTERVAL = 14 * 60 * 1000; // 14분
setInterval(async () => {
    try {
        // 실제 배포 시에는 Render에서 제공하는 외부 URL(환경변수)을 우선 세팅하여 호출
        const pingUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;
        await axios.get(pingUrl);
        console.log(`[Keep-Alive] Pinged ${pingUrl} successfully to prevent sleeping.`);
    } catch (error) {
        console.error(`[Keep-Alive Error] Failed to ping:`, error.message);
    }
}, PING_INTERVAL);

app.listen(port, () => {
    console.log(`Happy Doctor Chatbot Server listening on port ${port}`);
});
