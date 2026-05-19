const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const Module = require('node:module');

async function withEnv(overrides, fn) {
  const previousValues = new Map();

  for (const [name, value] of Object.entries(overrides)) {
    if (Object.prototype.hasOwnProperty.call(process.env, name)) {
      previousValues.set(name, process.env[name]);
    } else {
      previousValues.set(name, undefined);
    }

    if (typeof value === 'undefined') {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }

  try {
    await fn();
  } finally {
    for (const [name, value] of previousValues.entries()) {
      if (typeof value === 'undefined') {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  }
}

async function withModuleMocks(mocks, fn) {
  const originalLoad = Module._load;

  Module._load = function patchedModuleLoad(request, parent, isMain) {
    if (Object.prototype.hasOwnProperty.call(mocks, request)) {
      return mocks[request];
    }

    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    await fn();
  } finally {
    Module._load = originalLoad;
  }
}

function clearTranslationModules() {
  delete require.cache[require.resolve('../services/translationService')];
  delete require.cache[require.resolve('../config')];
}

function createFakeServiceAccount() {
  const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });

  return {
    project_id: 'happydoctor0',
    client_email: 'translator@test.invalid',
    private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }),
  };
}

test('detectLanguage prefers the Google Translate API key when present', { concurrency: false }, async () => {
  const calls = [];

  await withEnv({
    GOOGLE_TRANSLATE_API_KEY: 'web-api-key',
    FIREBASE_SERVICE_ACCOUNT: undefined,
  }, async () => {
    await withModuleMocks({
      axios: {
        post: async (url, payload, options) => {
          calls.push({ url, payload: payload.toString(), options });
          return {
            data: {
              data: {
                detections: [[{ language: 'en' }]],
              },
            },
          };
        },
      },
    }, async () => {
      clearTranslationModules();
      const service = require('../services/translationService');

      const language = await service.detectLanguage('Hello, I have a fever');

      assert.equal(language, 'en');
      assert.equal(calls.length, 1);
      assert.match(calls[0].url, /\?key=web-api-key$/);
      assert.equal(calls[0].options.headers.Authorization, undefined);
      assert.equal(calls[0].options.headers['x-goog-user-project'], undefined);
    });
  });

  clearTranslationModules();
});

test('detectLanguage falls back to the Firebase service account when no API key is configured', { concurrency: false }, async () => {
  const serviceAccount = createFakeServiceAccount();
  const calls = [];

  await withEnv({
    GOOGLE_TRANSLATE_API_KEY: undefined,
    FIREBASE_SERVICE_ACCOUNT: JSON.stringify(serviceAccount),
  }, async () => {
    await withModuleMocks({
      axios: {
        post: async (url, payload, options) => {
          calls.push({ url, payload: payload.toString(), options });

          if (url === 'https://oauth2.googleapis.com/token') {
            return {
              data: {
                access_token: 'service-account-access-token',
                expires_in: 3600,
              },
            };
          }

          if (url === 'https://translation.googleapis.com/language/translate/v2/detect') {
            return {
              data: {
                data: {
                  detections: [[{ language: 'vi' }]],
                },
              },
            };
          }

          throw new Error(`Unexpected URL: ${url}`);
        },
      },
    }, async () => {
      clearTranslationModules();
      const service = require('../services/translationService');

      const language = await service.detectLanguage('Xin chao, toi bi sot');

      assert.equal(language, 'vi');
      assert.equal(calls.length, 2);
      assert.equal(calls[0].url, 'https://oauth2.googleapis.com/token');
      assert.equal(calls[1].url, 'https://translation.googleapis.com/language/translate/v2/detect');
      assert.equal(calls[1].options.headers.Authorization, 'Bearer service-account-access-token');
      assert.equal(calls[1].options.headers['x-goog-user-project'], serviceAccount.project_id);
    });
  });

  clearTranslationModules();
});

test('detectLanguage fails fast when no translation credential is configured', { concurrency: false }, async () => {
  await withEnv({
    GOOGLE_TRANSLATE_API_KEY: undefined,
    FIREBASE_SERVICE_ACCOUNT: undefined,
  }, async () => {
    clearTranslationModules();
    const service = require('../services/translationService');

    await assert.rejects(
      () => service.detectLanguage('Hola'),
      (error) => {
        assert.equal(error.code, 'TRANSLATION_NOT_CONFIGURED');
        assert.match(error.message, /credentials are not configured/i);
        return true;
      },
    );
  });

  clearTranslationModules();
});
