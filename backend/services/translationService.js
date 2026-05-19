const axios = require('axios');
const crypto = require('crypto');

const { getFirebaseServiceAccount, getGoogleTranslateApiKey } = require('../config');

const GOOGLE_TRANSLATE_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';
const GOOGLE_TRANSLATE_DETECT_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2/detect';
const GOOGLE_OAUTH_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const TRANSLATION_PROVIDER = 'google-cloud-translation';
const GOOGLE_CLOUD_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

let cachedServiceAccountToken = null;
let cachedServiceAccountTokenExpiresAt = 0;

function createTranslationError(code, message, cause) {
  const error = new Error(message);
  error.code = code;
  if (cause) {
    error.cause = cause;
  }
  return error;
}

function getConfiguredApiKey() {
  const apiKey = getGoogleTranslateApiKey();
  return apiKey || '';
}

function getConfiguredServiceAccount() {
  const serviceAccount = getFirebaseServiceAccount();
  if (!serviceAccount?.client_email || !serviceAccount?.private_key || !serviceAccount?.project_id) {
    return null;
  }

  return serviceAccount;
}

function resolveAuthStrategy() {
  const apiKey = getConfiguredApiKey();
  if (apiKey) {
    return {
      mode: 'api_key',
      apiKey,
    };
  }

  const serviceAccount = getConfiguredServiceAccount();
  if (serviceAccount) {
    return {
      mode: 'service_account',
      serviceAccount,
    };
  }

  throw createTranslationError(
    'TRANSLATION_NOT_CONFIGURED',
    'Google Cloud Translation credentials are not configured.',
  );
}

function toBase64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function createServiceAccountJwt(serviceAccount) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 3600;

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iss: serviceAccount.client_email,
    scope: GOOGLE_CLOUD_SCOPE,
    aud: GOOGLE_OAUTH_TOKEN_ENDPOINT,
    exp: expiresAt,
    iat: issuedAt,
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  signer.end();

  const signature = signer.sign(serviceAccount.private_key, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  return {
    assertion: `${unsignedToken}.${signature}`,
    expiresAtMs: expiresAt * 1000,
  };
}

async function getServiceAccountAccessToken() {
  if (cachedServiceAccountToken && Date.now() < cachedServiceAccountTokenExpiresAt - 60 * 1000) {
    return cachedServiceAccountToken;
  }

  const serviceAccount = getConfiguredServiceAccount();
  if (!serviceAccount) {
    throw createTranslationError(
      'TRANSLATION_NOT_CONFIGURED',
      'Google Cloud Translation service account is not configured.',
    );
  }

  const jwt = createServiceAccountJwt(serviceAccount);

  try {
    const payload = new URLSearchParams();
    payload.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    payload.append('assertion', jwt.assertion);

    const response = await axios.post(GOOGLE_OAUTH_TOKEN_ENDPOINT, payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 15000,
    });

    const accessToken = response.data?.access_token;
    const expiresIn = Number(response.data?.expires_in || 3600);
    if (!accessToken) {
      throw new Error('No access token returned.');
    }

    cachedServiceAccountToken = accessToken;
    cachedServiceAccountTokenExpiresAt = Date.now() + (expiresIn * 1000);
    return accessToken;
  } catch (error) {
    throw createTranslationError(
      'TRANSLATION_AUTH_FAILED',
      'Failed to authenticate Google Cloud Translation service account.',
      error,
    );
  }
}

async function buildGoogleRequestConfig() {
  const strategy = resolveAuthStrategy();
  if (strategy.mode === 'api_key') {
    return {
      urlSuffix: `?key=${encodeURIComponent(strategy.apiKey)}`,
      headers: {},
    };
  }

  const accessToken = await getServiceAccountAccessToken();
  return {
    urlSuffix: '',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'x-goog-user-project': strategy.serviceAccount.project_id,
    },
  };
}

function normalizeLanguageCode(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.toLowerCase() === 'zh-cn') return 'zh-CN';
  if (trimmed.toLowerCase() === 'zh-tw') return 'zh-TW';
  return trimmed.toLowerCase();
}

function isKoreanLanguage(languageCode) {
  return normalizeLanguageCode(languageCode) === 'ko';
}

async function detectLanguage(text) {
  const normalizedText = typeof text === 'string' ? text.trim() : '';
  if (!normalizedText) {
    return null;
  }

  const requestConfig = await buildGoogleRequestConfig();

  try {
    const payload = new URLSearchParams();
    payload.append('q', normalizedText);

    const response = await axios.post(
      `${GOOGLE_TRANSLATE_DETECT_ENDPOINT}${requestConfig.urlSuffix}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...requestConfig.headers,
        },
        timeout: 15000,
      },
    );

    const detection = response.data?.data?.detections?.[0]?.[0]?.language;
    return normalizeLanguageCode(detection);
  } catch (error) {
    throw createTranslationError('TRANSLATION_DETECT_FAILED', 'Failed to detect language.', error);
  }
}

async function translateTexts(texts, targetLanguage, options = {}) {
  const normalizedTexts = (Array.isArray(texts) ? texts : [texts])
    .map((value) => (typeof value === 'string' ? value : ''));

  if (normalizedTexts.every((value) => !value.trim())) {
    return normalizedTexts;
  }

  const requestConfig = await buildGoogleRequestConfig();
  const normalizedTarget = normalizeLanguageCode(targetLanguage);
  if (!normalizedTarget) {
    throw createTranslationError('TRANSLATION_TARGET_REQUIRED', 'Target language is required.');
  }

  try {
    const payload = new URLSearchParams();
    normalizedTexts.forEach((value) => payload.append('q', value));
    payload.append('target', normalizedTarget);
    payload.append('format', 'text');

    const normalizedSource = normalizeLanguageCode(options.sourceLanguage);
    if (normalizedSource) {
      payload.append('source', normalizedSource);
    }

    const response = await axios.post(
      `${GOOGLE_TRANSLATE_ENDPOINT}${requestConfig.urlSuffix}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...requestConfig.headers,
        },
        timeout: 20000,
      },
    );

    const translations = response.data?.data?.translations || [];
    return normalizedTexts.map((value, index) => {
      if (!value.trim()) return '';
      return translations[index]?.translatedText || '';
    });
  } catch (error) {
    throw createTranslationError('TRANSLATION_FAILED', 'Failed to translate text.', error);
  }
}

async function translateText(text, targetLanguage, options = {}) {
  const [translated] = await translateTexts([text], targetLanguage, options);
  return translated || '';
}

function mapGenderToKorean(value) {
  switch ((value || '').trim().toLowerCase()) {
    case 'male':
    case 'm':
      return '남성';
    case 'female':
    case 'f':
      return '여성';
    case 'other':
      return '기타';
    case 'prefer_not_to_say':
      return '밝히지 않음';
    default:
      return typeof value === 'string' ? value.trim() : '';
  }
}

async function translatePatientDataToKorean(patientData = {}, sourceLanguage) {
  const translatedValues = await translateTexts(
    [
      patientData.cc || '',
      patientData.onset || '',
      patientData.symptom || '',
      patientData.associated || '',
      patientData.pmhx || '',
    ],
    'ko',
    {
      sourceLanguage,
    },
  );

  return {
    age: patientData.age || '',
    gender: mapGenderToKorean(patientData.gender),
    cc: translatedValues[0] || '',
    onset: translatedValues[1] || '',
    symptom: translatedValues[2] || '',
    nrs: patientData.nrs || '',
    associated: translatedValues[3] || '',
    pmhx: translatedValues[4] || '',
  };
}

module.exports = {
  TRANSLATION_PROVIDER,
  detectLanguage,
  isKoreanLanguage,
  translateText,
  translateTexts,
  translatePatientDataToKorean,
};
