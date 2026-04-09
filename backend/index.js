require('dotenv').config();

const axios = require('axios');

const { createApp } = require('./app');
const followUpService = require('./services/followUpService');
const patientSmsService = require('./services/patientSmsService');
const {
  isKeepAliveDisabled,
  port,
  renderExternalUrl,
  validateStartupConfig,
} = require('./config');

const PING_INTERVAL_MS = 14 * 60 * 1000;

function startKeepAlive() {
  return setInterval(async () => {
    try {
      await axios.get(renderExternalUrl);
      console.log(`[Keep-Alive] Pinged ${renderExternalUrl} successfully to prevent sleeping.`);
    } catch (error) {
      console.error('[Keep-Alive Error] Failed to ping:', error.message);
    }
  }, PING_INTERVAL_MS);
}

async function startServer() {
  validateStartupConfig();

  const app = createApp();
  const server = app.listen(Number(port), async () => {
    console.log(`Happy Doctor Chatbot Server listening on port ${port}`);
    try {
      await followUpService.initialize();
    } catch (error) {
      console.error('[FollowUp Init Error]', error);
    }
    try {
      await patientSmsService.initialize();
    } catch (error) {
      console.error('[Patient SMS Init Error]', error);
    }
  });

  const keepAliveTimer = isKeepAliveDisabled()
    ? null
    : startKeepAlive();

  return { app, server, keepAliveTimer };
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('[Startup Error]', error);
    process.exitCode = 1;
  });
}

module.exports = {
  startServer,
};
