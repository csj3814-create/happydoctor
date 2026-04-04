const express = require('express');
const { randomUUID } = require('crypto');

const router = express.Router();

const dbService = require('../services/dbService');
const { analyzeAndRouteTriage } = require('../services/llmService');
const { enqueueDoctorNotification } = require('../services/notifyService');
const { appSiteUrl } = require('../config');

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeSingleLine(value, maxLength = 120) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function sanitizeMultiline(value, maxLength = 1200) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\r\n/g, '\n').slice(0, maxLength);
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

router.post('/consultations', async (req, res) => {
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

    if (analysisResult.action === 'ESCALATE') {
      await enqueueDoctorNotification(analysisResult.soapChartForDoctor, userId);
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
    const lookup = (req.params.lookup || '').toString().trim();

    if (!lookup) {
      return res.status(404).json({ error: '상담 상태를 찾을 수 없습니다.' });
    }

    const consultation = await dbService.getPublicConsultationStatusByLookup(lookup);
    if (!consultation) {
      return res.status(404).json({ error: '상담 상태를 찾을 수 없습니다.' });
    }

    res.set('Cache-Control', 'no-store');
    return res.json(consultation);
  } catch (error) {
    console.error('[Public Consultation Status Error]', error);
    return res.status(500).json({ error: '상담 상태를 불러오지 못했습니다.' });
  }
});

module.exports = router;
