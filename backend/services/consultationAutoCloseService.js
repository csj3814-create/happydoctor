const dbService = require('./dbService');
const { getConsultationAutoCloseConfig } = require('../config');

const DAY_MS = 24 * 60 * 60 * 1000;

function toMillis(value) {
  if (!value) return 0;
  if (value?.toMillis) return value.toMillis();
  if (value?._seconds) return value._seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getLatestPatientQuestionAt(consultation) {
  const logs = Array.isArray(consultation?.followUpLogs) ? consultation.followUpLogs : [];
  return logs
    .filter((log) => log?.action === 'PATIENT_FOLLOW_UP_QUESTION')
    .map((log) => toMillis(log.timestamp))
    .reduce((max, current) => Math.max(max, current), 0);
}

// Closes consultations that have quietly ended: answered, and nothing from the
// patient since. A patient who is satisfied rarely writes back to say so, so
// without this the portal fills with consultations that look like a clinician
// still owes someone an answer.
//
// What it will not touch is the point of it. A consultation nobody has
// answered, and a consultation where the patient has asked something since the
// last reply, are both someone waiting - one patient already waited 19 hours
// on a second question, wrote "왜 아무도 내 질문에 답해주지 않는 거죠?" and
// closed the consultation themselves. Closing those would file the evidence
// away instead of answering it, so this job only ever sees the other kind:
// listRepliedConsultationsBefore() returns consultations that carry a reply and
// are still open, and the patient-question check below drops the rest.
class ConsultationAutoCloseService {
  constructor() {
    const config = getConsultationAutoCloseConfig();
    this.enabled = config.enabled;
    this.afterDays = config.afterDays;
    this.checkIntervalMs = config.checkIntervalMs;
    this.maxPerRun = config.maxPerRun;
    this.processorHandle = null;
    this.isProcessing = false;
  }

  isOperational() {
    return this.enabled;
  }

  buildReason() {
    return `마지막 답변 후 ${this.afterDays}일 동안 추가 질문이 없어 자동으로 종료되었습니다.`;
  }

  async initialize() {
    if (!this.isOperational()) {
      console.log('[Auto Close] Disabled.');
      return;
    }

    await this.runOnce();
    this.startProcessorLoop();
  }

  startProcessorLoop() {
    if (this.processorHandle || !this.isOperational()) return;

    this.processorHandle = setInterval(() => {
      this.runOnce().catch((error) => {
        console.error('[Auto Close Error]', error);
      });
    }, this.checkIntervalMs);
  }

  stopProcessorLoop() {
    if (!this.processorHandle) return;
    clearInterval(this.processorHandle);
    this.processorHandle = null;
  }

  async runOnce(now = new Date()) {
    if (this.isProcessing || !this.isOperational()) return 0;
    this.isProcessing = true;

    try {
      const cutoffMs = now.getTime() - this.afterDays * DAY_MS;
      // Asks for more than it will close: some candidates are dropped below,
      // and a run that closes nothing should still look past them next time.
      const candidates = await dbService.listRepliedConsultationsBefore(cutoffMs, this.maxPerRun * 4);

      let closed = 0;
      for (const consultation of candidates) {
        if (closed >= this.maxPerRun) break;

        const repliedAt = toMillis(consultation.doctorRepliedAt);
        if (!repliedAt || repliedAt > cutoffMs) continue;
        // The patient came back. They are waiting for an answer, not finished.
        if (getLatestPatientQuestionAt(consultation) > repliedAt) continue;

        // eslint-disable-next-line no-await-in-loop
        const result = await dbService.closeConsultationById(consultation.id, this.buildReason(), {
          action: 'AUTO_CLOSE',
        });
        if (result && !result.alreadyClosed) closed += 1;
      }

      if (closed > 0) {
        console.log(`[Auto Close] Closed ${closed} consultation(s) quiet for ${this.afterDays} day(s).`);
      }

      return closed;
    } finally {
      this.isProcessing = false;
    }
  }
}

module.exports = new ConsultationAutoCloseService();
module.exports.ConsultationAutoCloseService = ConsultationAutoCloseService;
module.exports.getLatestPatientQuestionAt = getLatestPatientQuestionAt;
