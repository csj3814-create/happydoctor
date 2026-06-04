const express = require('express');
const { randomUUID } = require('crypto');
const multer = require('multer');

const router = express.Router();

const dbService = require('../services/dbService');
const followUpService = require('../services/followUpService');
const { analyzeAndRouteTriage } = require('../services/llmService');
const {
  TRANSLATION_PROVIDER,
  detectLanguage,
  isKoreanLanguage,
  translatePatientDataToKorean,
  translateText,
} = require('../services/translationService');
const { getLocalizedStartUiCopy } = require('../services/uiCopyService');
const notifyService = require('../services/notifyService');
const {
  enqueueDoctorNotification,
  clearDoctorNotifications,
  clearPatientChannelPushes,
  clearPatientSmsNotifications,
} = notifyService;
const clearOperatorUnansweredAlerts = notifyService.clearOperatorUnansweredAlerts || (async () => 0);
const { appSiteUrl } = require('../config');

const consultationImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 3,
    fileSize: 10 * 1024 * 1024,
  },
});
const LOOKUP_PATTERN = /^[A-Za-z0-9_-]{6,160}$/;

function createRequestValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseLookupParam(value) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) {
    throw createRequestValidationError('상담 상태를 찾을 수 없습니다.');
  }

  if (!LOOKUP_PATTERN.test(normalized)) {
    throw createRequestValidationError('상담 조회 코드 형식을 다시 확인해 주세요.');
  }

  return normalized;
}

function sanitizeSingleLine(value, maxLength = 120) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function sanitizeMultiline(value, maxLength = 1200) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\r\n/g, '\n').slice(0, maxLength);
}

function handleConsultationImageUpload(req, res, next) {
  const contentType = (req.headers['content-type'] || '').toString().toLowerCase();
  if (!contentType.includes('multipart/form-data')) {
    return next();
  }

  return consultationImageUpload.array('images', 3)(req, res, (uploadError) => {
    if (!uploadError) {
      return next();
    }

    console.error('[Public Consultation Upload Middleware Error]', uploadError);

    if (uploadError instanceof multer.MulterError) {
      if (uploadError.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: '사진은 한 장당 10MB 이하로 올려 주세요.' });
      }

      if (uploadError.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: '사진은 한 번에 최대 3장까지 올릴 수 있습니다.' });
      }
    }

    return res.status(400).json({ error: '사진 업로드를 다시 시도해 주세요.' });
  });
}

function sanitizeNrs(value) {
  const sanitized = sanitizeSingleLine(value, 8);
  if (!sanitized) return '';

  const numeric = Number(sanitized);
  if (!Number.isNaN(numeric)) {
    return String(Math.max(0, Math.min(10, Math.round(numeric))));
  }

  return sanitized;
}

function buildPublicPatientData(body) {
  return {
    age: sanitizeSingleLine(body.age, 40),
    gender: sanitizeSingleLine(body.gender, 20),
    cc: sanitizeSingleLine(body.chiefComplaint, 120),
    onset: sanitizeSingleLine(body.onset, 120),
    symptom: sanitizeMultiline(body.symptomDetail, 1200),
    nrs: sanitizeNrs(body.nrs),
    associated: sanitizeMultiline(body.associatedSymptom, 600),
    pmhx: sanitizeMultiline(body.pastMedicalHistory, 600),
  };
}

function validatePublicPatientData(patientData) {
  if (!patientData.cc || patientData.cc.length < 2) {
    return '가장 불편한 증상을 조금 더 구체적으로 적어 주세요.';
  }

  if (!patientData.symptom || patientData.symptom.length < 5) {
    return '증상의 자세한 설명을 조금만 더 적어 주세요.';
  }

  return null;
}

function parseConsentFlag(value) {
  return value === true || value === 'true' || value === '1' || value === 'on';
}

function normalizePhoneNumber(value) {
  if (typeof value !== 'string') return '';

  return value
    .trim()
    .replace(/[^\d+]/g, '')
    .replace(/(?!^)\+/g, '')
    .slice(0, 20);
}

function buildReplyNotificationContact(body = {}) {
  const consent = parseConsentFlag(body.replyNotificationConsent);
  const rawPhone = sanitizeSingleLine(body.replyNotificationPhone, 40);
  const normalizedPhone = normalizePhoneNumber(rawPhone);

  if (!consent && !normalizedPhone) {
    return null;
  }

  if (!consent && normalizedPhone) {
    throw createRequestValidationError('답변 알림 연락처는 동의한 경우에만 저장할 수 있습니다.');
  }

  if (consent && !normalizedPhone) {
    throw createRequestValidationError('답변 알림을 받으려면 휴대폰 번호를 입력해 주세요.');
  }

  if (!/^\+?\d{10,15}$/.test(normalizedPhone)) {
    throw createRequestValidationError('휴대폰 번호를 다시 확인해 주세요.');
  }

  return {
    consented: true,
    phone: rawPhone || normalizedPhone,
    normalizedPhone,
    source: 'web_start',
  };
}

function buildPublicStatusUrl(trackingCode, trackingToken) {
  const baseUrl = appSiteUrl.replace(/\/$/, '');
  if (trackingCode) {
    return `${baseUrl}/status?code=${encodeURIComponent(trackingCode)}`;
  }

  if (trackingToken) {
    return `${baseUrl}/status?token=${encodeURIComponent(trackingToken)}`;
  }

  return `${baseUrl}/status`;
}

function buildInitialReply(analysisResult) {
  if (analysisResult.action === 'ESCALATE') {
    return (
      `${analysisResult.replyToPatient}\n\n` +
      '보듬이가 내용을 정리해 자원봉사 의료진에게 전달했습니다.\n' +
      '답변이 준비되면 상태 확인 화면에서 바로 확인하실 수 있습니다.\n' +
      '증상이 많이 힘들어지면 지체 없이 119 또는 가까운 응급실을 이용해 주세요.'
    );
  }

  return analysisResult.replyToPatient;
}

function mapGenderForDoctor(value) {
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
      return sanitizeSingleLine(value, 20);
  }
}

function normalizeUiLanguage(value) {
  return sanitizeSingleLine(value, 8).toLowerCase() === 'en' ? 'en' : 'ko';
}

function getTranslationFailureMessage(uiLanguage) {
  if (uiLanguage === 'en') {
    return 'Automatic translation is unavailable right now. Please try again in English or Korean.';
  }

  return '자동 번역을 준비하지 못했습니다. 영어 또는 한국어로 다시 입력해 주세요.';
}

router.get('/ui-copy/start', async (req, res) => {
  const targetLanguage = sanitizeSingleLine(req.query?.lang, 16).toLowerCase();

  if (!targetLanguage) {
    return res.status(400).json({ error: 'Language is required.' });
  }

  try {
    const copy = await getLocalizedStartUiCopy(targetLanguage);
    return res.json({
      ok: true,
      lang: targetLanguage,
      copy,
    });
  } catch (error) {
    console.error('[Public Start UI Copy Translation Error]', error);
    return res.status(503).json({ error: 'Localized UI copy is unavailable right now.' });
  }
});

function buildDoctorFacingPatientData(patientData, translatedPatientDataKo = null) {
  const translated = translatedPatientDataKo || {};
  return {
    age: patientData.age || translated.age || '미상',
    gender: translated.gender || mapGenderForDoctor(patientData.gender) || '미상',
    cc: translated.cc || patientData.cc || '미상',
    onset: translated.onset || patientData.onset || '알 수 없음',
    symptom: translated.symptom || patientData.symptom || '설명 없음',
    nrs: patientData.nrs || translated.nrs || '미상',
    associated: translated.associated || patientData.associated || '없음',
    pmhx: translated.pmhx || patientData.pmhx || '특이사항 없음',
  };
}

function buildLanguageDetectionText(patientData) {
  return [
    patientData.cc,
    patientData.onset,
    patientData.symptom,
    patientData.associated,
    patientData.pmhx,
  ]
    .filter(Boolean)
    .join('\n')
    .trim();
}

function hasKoreanCharacters(value) {
  return /[가-힣]/.test(value || '');
}

async function resolveTranslationContext(patientData, uiLanguage) {
  const fallbackSourceLanguage = uiLanguage === 'en' ? 'en' : 'ko';
  const detectionText = buildLanguageDetectionText(patientData);
  const detectedSourceLanguage = !detectionText
    ? fallbackSourceLanguage
    : hasKoreanCharacters(detectionText)
      ? 'ko'
      : await detectLanguage(detectionText);
  const sourceLanguage = detectedSourceLanguage || fallbackSourceLanguage;
  const needsTranslation = !isKoreanLanguage(sourceLanguage);
  const patientReplyLanguage = needsTranslation ? sourceLanguage : 'ko';

  if (!needsTranslation) {
    return {
      sourceLanguage,
      patientReplyLanguage,
      translatedPatientDataKo: null,
      translationProvider: null,
      translationStatus: 'not_required',
    };
  }

  const translatedPatientDataKo = await translatePatientDataToKorean(patientData, sourceLanguage);

  return {
    sourceLanguage,
    patientReplyLanguage,
    translatedPatientDataKo,
    translationProvider: TRANSLATION_PROVIDER,
    translationStatus: 'translated',
  };
}

router.post('/consultations', handleConsultationImageUpload, async (req, res) => {
  try {
    if (!isPlainObject(req.body)) {
      return res.status(400).json({ error: '상담 정보를 다시 입력해 주세요.' });
    }

    const uiLanguage = normalizeUiLanguage(req.body.uiLanguage);
    const patientData = buildPublicPatientData(req.body);
    const patientNotificationContact = buildReplyNotificationContact(req.body);
    const validationError = validatePublicPatientData(patientData);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    let translationContext;
    try {
      translationContext = await resolveTranslationContext(patientData, uiLanguage);
    } catch (error) {
      console.error('[Public Consultation Translation Error]', error);
      return res.status(503).json({ error: getTranslationFailureMessage(uiLanguage) });
    }

    const triagePatientData = buildDoctorFacingPatientData(
      patientData,
      translationContext.translatedPatientDataKo,
    );

    const analysisResult = await analyzeAndRouteTriage(triagePatientData);
    if (!analysisResult?.action || !analysisResult?.replyToPatient) {
      throw new Error('Invalid triage analysis response');
    }

    const internalPatientReply = buildInitialReply(analysisResult);
    let patientDeliveredReply = internalPatientReply;

    if (!isKoreanLanguage(translationContext.patientReplyLanguage)) {
      try {
        patientDeliveredReply = await translateText(
          internalPatientReply,
          translationContext.patientReplyLanguage,
          { sourceLanguage: 'ko' },
        );
      } catch (error) {
        console.error('[Public Consultation Reply Translation Error]', error);
        return res.status(503).json({ error: getTranslationFailureMessage(uiLanguage) });
      }
    }

    const userId = `public_${randomUUID()}`;
    const saved = await dbService.logConsultation(userId, patientData, analysisResult, {
      entryChannel: 'web',
      entrySurface: sanitizeSingleLine(req.body.entrySurface, 40) || 'app',
      patientNotificationContact,
      uiLanguage,
      sourceLanguage: translationContext.sourceLanguage,
      patientReplyLanguage: translationContext.patientReplyLanguage,
      translatedPatientDataKo: translationContext.translatedPatientDataKo,
      translationProvider: translationContext.translationProvider,
      translationStatus: translationContext.translationStatus,
      patientDeliveredChatbotReply: patientDeliveredReply,
    });

    if (!saved?.consultationId) {
      throw new Error('Consultation was not persisted');
    }

    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length > 0) {
      await dbService.addConsultationImagesById(saved.consultationId, files, {
        source: 'web_start',
        uploadedBy: 'public',
      });
    }

    if (analysisResult.action === 'ESCALATE') {
      await enqueueDoctorNotification(analysisResult.soapChartForDoctor, userId, {
        type: 'triage_initial',
        priority: 'urgent',
        reminderDelaysMinutes: [0, 5, 15],
      });
      await followUpService.scheduleFollowUpWithOptions(userId, analysisResult.soapChartForDoctor, 15, {
        reminderDelaysMinutes: [15, 180, 1440],
      });
    } else {
      const fallbackChart = `[최초 자동 해결된 경증 환자]\n증상: ${patientData.cc}\n증상점수: ${patientData.nrs}`;
      await followUpService.scheduleFollowUpWithOptions(userId, fallbackChart, 15, {
        reminderDelaysMinutes: [15, 180, 1440],
      });
    }

    const statusUrl = buildPublicStatusUrl(saved.trackingCode, saved.trackingToken);
    res.set('Cache-Control', 'no-store');

    return res.status(201).json({
      ok: true,
      consultationId: saved.consultationId,
      trackingCode: saved.trackingCode || null,
      statusUrl,
      status: analysisResult.action === 'ESCALATE' ? 'waiting_doctor' : 'guidance_delivered',
      requiresDoctorReview: analysisResult.action === 'ESCALATE',
      uiLanguage,
      sourceLanguage: translationContext.sourceLanguage,
      patientReplyLanguage: translationContext.patientReplyLanguage,
      replyToPatient: patientDeliveredReply,
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('[Public Consultation Create Error]', error);
    return res.status(500).json({ error: '상담을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.' });
  }
});

router.get('/consultations/status/:lookup', async (req, res) => {
  try {
    const lookup = parseLookupParam(req.params.lookup);
    const consultationSnapshot = await dbService.getAcknowledgedPublicConsultationStatusByLookup(lookup);
    const consultation = consultationSnapshot?.consultation || null;
    if (!consultation) {
      return res.status(404).json({ error: '상담 상태를 찾을 수 없습니다.' });
    }

    if (
      consultationSnapshot?.userId
      && (
        consultation.status === 'doctor_replied'
        || (Array.isArray(consultation.doctorReplies) && consultation.doctorReplies.length > 0)
      )
    ) {
      try {
        await clearPatientChannelPushes(consultationSnapshot.userId, 'doctor_reply');
      } catch (clearError) {
        console.warn(
          `[Public Consultation Status] Failed to clear doctor-reply reminders for ${consultationSnapshot.userId}:`,
          clearError.message,
        );
      }
      try {
        await clearPatientSmsNotifications(consultationSnapshot.userId, 'doctor_reply');
      } catch (clearError) {
        console.warn(
          `[Public Consultation Status] Failed to clear doctor-reply SMS reminders for ${consultationSnapshot.userId}:`,
          clearError.message,
        );
      }
    }

    res.set('Cache-Control', 'no-store');
    return res.json(consultation);
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('[Public Consultation Status Error]', error);
    return res.status(500).json({ error: '상담 상태를 불러오지 못했습니다.' });
  }
});

router.post('/consultations/status/:lookup/images', (req, res) => {
  consultationImageUpload.array('images', 3)(req, res, async (uploadError) => {
    if (uploadError) {
      console.error('[Public Consultation Image Upload Middleware Error]', uploadError);

      if (uploadError instanceof multer.MulterError) {
        if (uploadError.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: '사진은 한 장당 10MB 이하로 올려 주세요.' });
        }

        if (uploadError.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ error: '사진은 한 번에 최대 3장까지 올릴 수 있습니다.' });
        }
      }

      return res.status(400).json({ error: '사진 업로드를 다시 시도해 주세요.' });
    }

    try {
      const lookup = parseLookupParam(req.params.lookup);

      const files = Array.isArray(req.files) ? req.files : [];
      if (files.length === 0) {
        return res.status(400).json({ error: '먼저 올릴 사진을 선택해 주세요.' });
      }

      const uploaded = await dbService.addPublicConsultationImagesByLookup(lookup, files, {
        source: 'web',
        uploadedBy: 'public',
      });

      res.set('Cache-Control', 'no-store');
      return res.json({
        ok: true,
        mediaItems: uploaded,
      });
    } catch (error) {
      if (error?.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('[Public Consultation Image Upload Error]', error);

      switch (error.message) {
        case 'STORAGE_NOT_CONFIGURED':
          return res.status(503).json({ error: '사진 업로드 준비가 아직 끝나지 않았습니다.' });
        case 'CONSULTATION_NOT_FOUND':
          return res.status(404).json({ error: '상담 상태를 찾을 수 없습니다.' });
        case 'CONSULTATION_CLOSED':
          return res.status(400).json({ error: '종료된 상담에는 사진을 추가할 수 없습니다.' });
        case 'MEDIA_LIMIT_EXCEEDED':
          return res.status(400).json({ error: '사진은 상담당 최대 3장까지 올릴 수 있습니다.' });
        case 'UNSUPPORTED_MEDIA_TYPE':
          return res.status(400).json({ error: 'JPG, PNG, WEBP 사진만 올릴 수 있습니다.' });
        case 'NO_FILES':
          return res.status(400).json({ error: '먼저 올릴 사진을 선택해 주세요.' });
        default:
          return res.status(500).json({ error: '사진을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' });
      }
    }
  });
});

router.post('/consultations/status/:lookup/follow-up', async (req, res) => {
  try {
    const lookup = parseLookupParam(req.params.lookup);
    const question = sanitizeMultiline(req.body?.question, 1200);
    const uiLanguage = normalizeUiLanguage(req.body?.uiLanguage);

    if (!question || question.length < 2) {
      return res.status(400).json({ error: '추가 질문 내용을 조금 더 적어 주세요.' });
    }

    const followUp = await dbService.appendPublicFollowUpQuestionByLookup(lookup, question, {
      source: 'web_status',
    });

    await enqueueDoctorNotification(followUp.doctorNotificationMessage, followUp.userId, {
      type: 'patient_follow_up_question',
      priority: 'high',
      reminderDelaysMinutes: [0, 5, 15],
    });
    try {
      await clearPatientChannelPushes(followUp.userId, 'doctor_reply');
    } catch (clearError) {
      console.warn(
        `[Public Consultation Follow-Up] Failed to clear doctor-reply reminders for ${followUp.userId}:`,
        clearError.message,
      );
    }
    try {
      await clearPatientSmsNotifications(followUp.userId, 'doctor_reply');
    } catch (clearError) {
      console.warn(
        `[Public Consultation Follow-Up] Failed to clear doctor-reply SMS reminders for ${followUp.userId}:`,
        clearError.message,
      );
    }

    const consultation = await dbService.getPublicConsultationStatusByLookup(lookup);
    res.set('Cache-Control', 'no-store');
    return res.json({
      ok: true,
      consultation,
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('[Public Consultation Follow-Up Error]', error);

    switch (error.message) {
      case 'CONSULTATION_NOT_FOUND':
        return res.status(404).json({ error: '상담 상태를 찾을 수 없습니다.' });
      case 'CONSULTATION_CLOSED':
        return res.status(400).json({ error: '종료된 상담에는 추가 질문을 남길 수 없습니다.' });
      case 'FOLLOW_UP_REQUIRED':
        return res.status(400).json({ error: '추가 질문 내용을 조금 더 적어 주세요.' });
      case 'TRANSLATION_NOT_CONFIGURED':
      case 'TRANSLATION_DETECT_FAILED':
      case 'TRANSLATION_FAILED':
        return res.status(503).json({ error: getTranslationFailureMessage(uiLanguage) });
      default:
        return res.status(500).json({ error: '추가 질문을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.' });
    }
  }
});

router.post('/consultations/status/:lookup/close', async (req, res) => {
  try {
    const lookup = parseLookupParam(req.params.lookup);
    const reason = sanitizeSingleLine(req.body?.reason, 120) || '환자가 상태 화면에서 상담 종료를 선택함';

    const closed = await dbService.closePublicConsultationByLookup(lookup, reason);
    if (!closed) {
      return res.status(404).json({ error: '상담 상태를 찾을 수 없습니다.' });
    }

    if (closed.userId) {
      await followUpService.cancelFollowUp(closed.userId);
      await clearDoctorNotifications(closed.userId);
      await clearOperatorUnansweredAlerts(closed.userId);
      await clearPatientChannelPushes(closed.userId, 'doctor_reply');
      await clearPatientSmsNotifications(closed.userId, 'doctor_reply');
    }

    const consultation = await dbService.getPublicConsultationStatusByLookup(lookup);
    res.set('Cache-Control', 'no-store');
    return res.json({
      ok: true,
      consultation,
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('[Public Consultation Close Error]', error);
    return res.status(500).json({ error: '상담을 종료하지 못했습니다. 잠시 후 다시 시도해 주세요.' });
  }
});

module.exports = router;
