const dns = require('node:dns').promises;
const net = require('node:net');
const nodemailer = require('nodemailer');

const {
  getAlertEmailRecipients,
  getResendConfig,
  getSmtpConfig,
} = require('../config');

const PORTAL_URL = 'https://portal.happydoctor.kr/open-browser?next=%2F';
const SMTP_TIMEOUT_MS = 8000;

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

  // HTTPS wins when both are present: SMTP does not survive hosts that block
  // the ports, and this one is verified to.
  getProvider() {
    if (getResendConfig()) return 'resend';
    if (getSmtpConfig()) return 'smtp';
    return null;
  }

  isConfigured() {
    return Boolean(this.getProvider());
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
        // A host that drops SMTP packets rather than refusing them makes the
        // socket hang for nodemailer's two-minute default while a patient
        // waits on their submission.
        connectionTimeout: SMTP_TIMEOUT_MS,
        greetingTimeout: SMTP_TIMEOUT_MS,
        socketTimeout: SMTP_TIMEOUT_MS,
      });
      this.cachedConfigKey = configKey;
    }

    return this.cachedTransport;
  }

  async sendViaResend({ recipients, subject, text }) {
    const config = getResendConfig();

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.from,
        to: recipients,
        subject,
        text,
      }),
      signal: AbortSignal.timeout(config.timeoutMs),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`resend_${response.status}: ${detail.slice(0, 200)}`);
    }

    return recipients.length;
  }

  async sendViaSmtp({ recipients, subject, text }) {
    const transport = this.getTransport();
    const smtpConfig = this.getConfig();

    if (!transport || !smtpConfig) {
      throw new Error('email_not_configured');
    }

    await transport.sendMail({
      from: smtpConfig.from,
      to: recipients.join(', '),
      subject,
      text,
    });

    return recipients.length;
  }

  async sendMail({ to, subject, text }) {
    const provider = this.getProvider();
    if (!provider) {
      throw new Error('email_not_configured');
    }

    const recipients = (Array.isArray(to) ? to : [to])
      .map((address) => String(address || '').trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      throw new Error('email_recipient_missing');
    }

    return provider === 'resend'
      ? this.sendViaResend({ recipients, subject, text })
      : this.sendViaSmtp({ recipients, subject, text });
  }

  // Reports, per resolved address, whether a TCP connection is even possible.
  // The nodemailer error names only the last address it tried, which is not
  // enough to tell a blocked port from an unusable route.
  async diagnoseConnectivity() {
    const smtpConfig = this.getConfig();
    if (!smtpConfig) {
      return { error: 'email_not_configured' };
    }

    const resolveFamily = async (resolver) => {
      try {
        return await resolver(smtpConfig.host);
      } catch (error) {
        return [];
      }
    };

    const [ipv4, ipv6] = await Promise.all([
      resolveFamily(dns.resolve4),
      resolveFamily(dns.resolve6),
    ]);

    const probe = (address, family) => new Promise((resolve) => {
      const socket = net.connect({ host: address, port: smtpConfig.port, family });
      const finish = (ok, error) => {
        socket.destroy();
        resolve({ address, family, ok, error: error ? String(error).slice(0, 120) : null });
      };

      socket.setTimeout(SMTP_TIMEOUT_MS);
      socket.once('connect', () => finish(true, null));
      socket.once('timeout', () => finish(false, 'timeout'));
      socket.once('error', (error) => finish(false, error?.message || 'connect_failed'));
    });

    const attempts = await Promise.all([
      ...ipv4.slice(0, 2).map((address) => probe(address, 4)),
      ...ipv6.slice(0, 2).map((address) => probe(address, 6)),
    ]);

    return {
      host: smtpConfig.host,
      port: smtpConfig.port,
      ipv4Count: ipv4.length,
      ipv6Count: ipv6.length,
      attempts,
    };
  }

  // Proves the credentials actually authenticate, which `isConfigured()` cannot:
  // that only says the variables are present. Performs an SMTP handshake and
  // AUTH exchange, then disconnects. No message is sent.
  async verifyTransport() {
    const provider = this.getProvider();
    if (!provider) {
      return { provider: null, verified: false, error: 'email_not_configured' };
    }

    if (provider === 'resend') {
      const config = getResendConfig();
      try {
        // Read-only: validates the key without sending anything.
        const response = await fetch('https://api.resend.com/domains', {
          headers: { Authorization: `Bearer ${config.apiKey}` },
          signal: AbortSignal.timeout(config.timeoutMs),
        });

        return response.ok
          ? { provider, verified: true, error: null }
          : { provider, verified: false, error: `resend_${response.status}` };
      } catch (error) {
        return {
          provider,
          verified: false,
          error: String(error?.message || 'resend_verify_failed').slice(0, 300),
        };
      }
    }

    try {
      await this.getTransport().verify();
      return { provider, verified: true, error: null };
    } catch (error) {
      return {
        provider,
        verified: false,
        error: String(error?.message || 'smtp_verify_failed').slice(0, 300),
      };
    }
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

  // The MessengerBot phone is the only thing that turns queued Kakao alerts
  // into delivered ones. This says whether it is still polling.
  async sendBotHeartbeatAlertEmail({ minutesSinceLastPoll, lastPolledAt, recovered = false } = {}) {
    if (!this.isConfigured()) {
      return false;
    }

    const recipients = getAlertEmailRecipients();
    if (recipients.length === 0) {
      return false;
    }

    const text = recovered
      ? [
        '카카오 알림 봇이 다시 정상 동작합니다.',
        lastPolledAt ? `최근 확인 시각: ${lastPolledAt}` : '',
        '',
        '중단 동안 쌓인 알림은 순차적으로 전달됩니다.',
        ...PORTAL_GUIDE_LINES,
      ]
      : [
        '카카오 알림 봇이 서버에 연결되지 않고 있습니다.',
        Number.isFinite(minutesSinceLastPoll) ? `마지막 접속 이후 ${minutesSinceLastPoll}분 경과` : '',
        lastPolledAt ? `마지막 접속 시각: ${lastPolledAt}` : '',
        '',
        '이 상태에서는 카카오톡으로 의료진 알림이 전달되지 않습니다.',
        '알림 봇이 설치된 휴대폰의 전원, 네트워크, 앱 실행 상태를 확인해 주세요.',
        '메일 알림은 계속 발송되므로 상담 확인은 포털에서 가능합니다.',
        ...PORTAL_GUIDE_LINES,
      ];

    await this.sendMail({
      to: recipients,
      subject: recovered
        ? '[해피닥터] 카카오 알림 봇 복구됨'
        : '[해피닥터] 카카오 알림 봇 중단 - 확인 필요',
      text: text.filter(Boolean).join('\n'),
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
