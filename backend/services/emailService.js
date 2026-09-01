const nodemailer = require('nodemailer');

const { getAlertEmailRecipients, getSmtpConfig } = require('../config');

const PORTAL_URL = 'https://portal.happydoctor.kr/open-browser?next=%2F';

// Alert mail travels over third-party infrastructure and lands in ordinary
// inboxes, so it never carries symptoms, charts, or any other health detail.
// It only says that something is waiting and points at the authenticated portal.
const PORTAL_GUIDE_LINES = Object.freeze([
  '',
  '건강정보와 상담 내용은 이 메일에 담기지 않습니다.',
  `인증된 의료진 포털에서 확인해 주세요: ${PORTAL_URL}`,
]);

// Mirrors the `type` values passed to enqueueDoctorNotification() from the
// Kakao webhook and the public consultation routes.
const DOCTOR_ALERT_TYPE_LABELS = Object.freeze({
  triage_initial: '새 상담',
  follow_up_doctor: '상담 후속 내용',
  patient_follow_up_question: '환자 추가 문의',
});

function describeDoctorAlertType(type) {
  return DOCTOR_ALERT_TYPE_LABELS[type] || '새 상담';
}

class EmailService {
  constructor() {
    this.cachedTransport = null;
    this.cachedConfigKey = null;
  }

  getConfig() {
    return getSmtpConfig();
  }

  isConfigured() {
    return Boolean(this.getConfig());
  }

  getTransport() {
    const smtpConfig = this.getConfig();
    if (!smtpConfig) {
      return null;
    }

    const configKey = `${smtpConfig.host}:${smtpConfig.port}:${smtpConfig.user}`;
    if (!this.cachedTransport || this.cachedConfigKey !== configKey) {
      this.cachedTransport = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass,
        },
      });
      this.cachedConfigKey = configKey;
    }

    return this.cachedTransport;
  }

  async sendMail({ to, subject, text }) {
    const transport = this.getTransport();
    const smtpConfig = this.getConfig();

    if (!transport || !smtpConfig) {
      throw new Error('email_not_configured');
    }

    const recipients = (Array.isArray(to) ? to : [to])
      .map((address) => String(address || '').trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      throw new Error('email_recipient_missing');
    }

    await transport.sendMail({
      from: smtpConfig.from,
      to: recipients.join(', '),
      subject,
      text,
    });

    return recipients.length;
  }

  // Every doctor alert also goes out by mail so a stopped MessengerBot phone
  // can no longer swallow the entire notification chain.
  async sendDoctorAlertEmail({ patientId, type, priority } = {}) {
    if (!this.isConfigured()) {
      return false;
    }

    const recipients = getAlertEmailRecipients();
    if (recipients.length === 0) {
      console.warn('[Email] No alert recipients configured, skipping doctor alert mail.');
      return false;
    }

    const label = describeDoctorAlertType(type);
    const urgent = priority === 'urgent';
    const subject = `[해피닥터] ${urgent ? '긴급 ' : ''}${label} 접수 - 의료진 확인 필요`;
    const text = [
      `${label}이(가) 접수되어 의료진 확인을 기다리고 있습니다.`,
      `분류: ${urgent ? '응급 확인 필요' : '의료진 확인 필요'}`,
      patientId ? `상담 식별자: ${patientId}` : '',
      ...PORTAL_GUIDE_LINES,
    ]
      .filter(Boolean)
      .join('\n');

    await this.sendMail({ to: recipients, subject, text });
    return true;
  }

  async sendUnansweredDigestEmail({ items = [], total = 0, generatedAt } = {}) {
    if (!this.isConfigured()) {
      return false;
    }

    const recipients = getAlertEmailRecipients();
    if (recipients.length === 0) {
      console.warn('[Email] No alert recipients configured, skipping unanswered digest.');
      return false;
    }

    const lines = items.map((item, index) => {
      const waited = Number.isFinite(item.waitingDays) ? `${item.waitingDays}일 대기` : '대기일 미상';
      return `${index + 1}. ${item.receivedAt || '접수시각 미상'} · ${waited} · ${item.channel || '경로 미상'}`;
    });

    const omitted = total - items.length;
    const text = [
      `현재 답변을 기다리는 상담이 ${total}건 있습니다.`,
      generatedAt ? `기준 시각: ${generatedAt}` : '',
      '',
      ...(lines.length > 0 ? lines : ['(목록 없음)']),
      omitted > 0 ? `... 외 ${omitted}건` : '',
      ...PORTAL_GUIDE_LINES,
    ]
      .filter(Boolean)
      .join('\n');

    await this.sendMail({
      to: recipients,
      subject: `[해피닥터] 미답변 상담 ${total}건 일일 요약`,
      text,
    });
    return true;
  }

  // Sent when a patient reply SMS is abandoned after repeated failures, so a
  // human knows one patient is unreachable. Carries no phone number and no
  // reply text - only the fact and the portal link.
  async sendPatientSmsFailureEmail({ userId, attemptCount, reason } = {}) {
    if (!this.isConfigured()) {
      return false;
    }

    const recipients = getAlertEmailRecipients();
    if (recipients.length === 0) {
      return false;
    }

    const text = [
      '환자에게 답변 도착 문자를 보내지 못해 재시도를 중단했습니다.',
      attemptCount ? `시도 횟수: ${attemptCount}회` : '',
      reason ? `마지막 실패 사유: ${String(reason).slice(0, 200)}` : '',
      userId ? `상담 식별자: ${userId}` : '',
      '',
      '해당 환자는 답변이 도착한 사실을 모르고 있을 수 있습니다.',
      '연락처가 올바른지 포털에서 확인하고 필요하면 직접 연락해 주세요.',
      ...PORTAL_GUIDE_LINES,
    ]
      .filter(Boolean)
      .join('\n');

    await this.sendMail({
      to: recipients,
      subject: '[해피닥터] 환자 답변 문자 발송 실패 - 확인 필요',
      text,
    });
    return true;
  }

  // Patient-facing fallback for when neither the Kakao channel nor SMS is
  // available. Carries the doctor's reply the patient is already waiting for.
  async sendPatientReplyEmail({ to, subject, text }) {
    if (!this.isConfigured()) {
      return false;
    }

    if (!to) {
      return false;
    }

    await this.sendMail({ to, subject, text });
    return true;
  }
}

module.exports = new EmailService();
module.exports.EmailService = EmailService;
