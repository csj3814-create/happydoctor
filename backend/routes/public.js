const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');

router.get('/consultations/status/:token', async (req, res) => {
  try {
    const token = (req.params.token || '').toString().trim();

    if (!token) {
      return res.status(404).json({ error: '상담 상태를 찾을 수 없습니다.' });
    }

    const consultation = await dbService.getPublicConsultationStatusByToken(token);
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
