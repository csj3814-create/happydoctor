const express = require('express');
const { randomUUID } = require('crypto');
const multer = require('multer');

const router = express.Router();

const dbService = require('../services/dbService');
const followUpService = require('../services/followUpService');
const { analyzeAndRouteTriage } = require('../services/llmService');
const {
  enqueueDoctorNotification,
  clearDoctorNotifications,
  clearPatientChannelPushes,
} = require('../services/notifyService');
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
  if (!sanitized) return '미상';

  const numeric = Number(sanitized);
  if (!Number.isNaN(numeric)) {
    return String(Math.max(0, Math.min(10, Math.round(numeric))));
  }

  return sanitized;
}

function buildPublicPatientData(body) {
  return {
    age: sanitizeSingleLine(body.age, 40) || '미상',
    gender: sanitizeSingleLine(body.gender, 20) || '미상',
    cc: sanitizeSingleLine(body.chiefComplaint, 120),
    onset: sanitizeSingleLine(body.onset, 120) || '알 수 없음',
    symptom: sanitizeMultiline(body.symptomDetail, 1200),
    nrs: sanitizeNrs(body.nrs),
    associated: sanitizeMultiline(body.associatedSymptom, 600) || '없음',
    pmhx: sanitizeMultiline(body.pastMedicalHistory, 600) || '특이사항 없음',
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

router.post('/consultations', handleConsultationImageUpload, async (req, res) => {
  try {
    if (!isPlainObject(req.body)) {
      return res.status(400).json({ error: '상담 정보를 다시 입력해 주세요.' });
    }

    const patientData = buildPublicPatientData(req.body);
    const validationError = validatePublicPatientData(patientData);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const analysisResult = await analyzeAndRouteTriage(patientData);
    if (!analysisResult?.action || !analysisResult?.replyToPatient) {
      throw new Error('Invalid triage analysis response');
    }

    const userId = `public_${randomUUID()}`;
    const saved = await dbService.logConsultation(userId, patientData, analysisResult, {
      entryChannel: 'web',
      entrySurface: sanitizeSingleLine(req.body.entrySurface, 40) || 'app',
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
      replyToPatient: buildInitialReply(analysisResult),
    });
  } catch (error) {
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
      await clearPatientChannelPushes(closed.userId, 'doctor_reply');
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
