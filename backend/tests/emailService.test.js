const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');

const CONFIG_PATH = path.join(__dirname, '..', 'config.js');
const NODEMAILER_PATH = require.resolve('nodemailer');
const EMAIL_SERVICE_PATH = path.join(__dirname, '..', 'services', 'emailService.js');

function loadEmailServiceWithMocks({ smtpConfig, recipients, sentMails, resendConfig = null, fetchImpl = null }) {
  const originalLoad = Module._load;

  Module._load = function patchedLoad(request, parent, isMain) {
    const resolved = (() => {
      try {
        return Module._resolveFilename(request, parent, isMain);
      } catch (error) {
        return request;
      }
    })();

    if (resolved === CONFIG_PATH) {
      return {
        getSmtpConfig: () => smtpConfig,
        getResendConfig: () => resendConfig,
        getAlertEmailRecipients: () => recipients,
      };
    }

    if (resolved === NODEMAILER_PATH) {
      return {
        createTransport: (options) => ({
          options,
          sendMail: async (mail) => {
            sentMails.push({ ...mail, transportOptions: options });
            return { messageId: 'test' };
          },
        }),
      };
    }

    return originalLoad(request, parent, isMain);
  };

  delete require.cache[EMAIL_SERVICE_PATH];

  try {
    return require(EMAIL_SERVICE_PATH);
  } finally {
    Module._load = originalLoad;
    delete require.cache[EMAIL_SERVICE_PATH];
  }
}

const WORKING_SMTP = Object.freeze({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  user: 'alerts@happydoctor.kr',
  pass: 'secret',
  from: 'alerts@happydoctor.kr',
});

test('doctor alert mail is skipped entirely when SMTP is not configured', { concurrency: false }, async () => {
  const sentMails = [];
  const emailService = loadEmailServiceWithMocks({
    smtpConfig: null,
    recipients: ['doctor@happydoctor.kr'],
    sentMails,
  });

  assert.equal(emailService.isConfigured(), false);
  assert.equal(await emailService.sendDoctorAlertEmail({ patientId: 'public_1' }), false);
  assert.deepEqual(sentMails, []);
});

test('doctor alert mail is skipped when no recipient is configured', { concurrency: false }, async () => {
  const sentMails = [];
  const emailService = loadEmailServiceWithMocks({
    smtpConfig: WORKING_SMTP,
    recipients: [],
    sentMails,
  });

  assert.equal(await emailService.sendDoctorAlertEmail({ patientId: 'public_1' }), false);
  assert.deepEqual(sentMails, []);
});

test('doctor alert mail never carries health information', { concurrency: false }, async () => {
  const sentMails = [];
  const emailService = loadEmailServiceWithMocks({
    smtpConfig: WORKING_SMTP,
    recipients: ['doctor@happydoctor.kr', 'admin@happydoctor.kr'],
    sentMails,
  });

  const sent = await emailService.sendDoctorAlertEmail({
    patientId: 'public_abc',
    type: 'triage_initial',
    priority: 'urgent',
  });

  assert.equal(sent, true);
  assert.equal(sentMails.length, 1);

  const [mail] = sentMails;
  assert.equal(mail.from, 'alerts@happydoctor.kr');
  assert.equal(mail.to, 'doctor@happydoctor.kr, admin@happydoctor.kr');
  assert.match(mail.subject, /긴급/);
  assert.match(mail.text, /public_abc/);
  assert.match(mail.text, /portal\.happydoctor\.kr/);
  assert.match(mail.text, /건강정보와 상담 내용은 이 메일에 담기지 않습니다\./);
  assert.equal(mail.html, undefined);
});

test('unanswered digest lists waiting consultations without health information', { concurrency: false }, async () => {
  const sentMails = [];
  const emailService = loadEmailServiceWithMocks({
    smtpConfig: WORKING_SMTP,
    recipients: ['admin@happydoctor.kr'],
    sentMails,
  });

  const sent = await emailService.sendUnansweredDigestEmail({
    total: 12,
    generatedAt: '2026-09-01 09:00 KST',
    items: [
      { receivedAt: '2026-08-22 23:25 KST', waitingDays: 10, channel: 'kakao' },
      { receivedAt: '2026-08-31 19:11 KST', waitingDays: 1, channel: 'web' },
    ],
  });

  assert.equal(sent, true);
  const [mail] = sentMails;
  assert.match(mail.subject, /미답변 상담 12건/);
  assert.match(mail.text, /1\. 2026-08-22 23:25 KST · 10일 대기 · kakao/);
  assert.match(mail.text, /\.\.\. 외 10건/);
  assert.match(mail.text, /건강정보와 상담 내용은 이 메일에 담기지 않습니다\./);
});

test('patient reply mail requires a recipient and reuses the SMS wording', { concurrency: false }, async () => {
  const sentMails = [];
  const emailService = loadEmailServiceWithMocks({
    smtpConfig: WORKING_SMTP,
    recipients: ['admin@happydoctor.kr'],
    sentMails,
  });

  assert.equal(await emailService.sendPatientReplyEmail({ to: '', subject: 's', text: 't' }), false);
  assert.deepEqual(sentMails, []);

  assert.equal(
    await emailService.sendPatientReplyEmail({
      to: 'patient@example.com',
      subject: '의료진 답변이 도착했습니다',
      text: '답변 본문',
    }),
    true,
  );

  assert.equal(sentMails.length, 1);
  assert.equal(sentMails[0].to, 'patient@example.com');
  assert.equal(sentMails[0].text, '답변 본문');
});

test('the SMTP transport is built once and reused across sends', { concurrency: false }, async () => {
  const sentMails = [];
  const emailService = loadEmailServiceWithMocks({
    smtpConfig: WORKING_SMTP,
    recipients: ['admin@happydoctor.kr'],
    sentMails,
  });

  const first = emailService.getTransport();
  const second = emailService.getTransport();

  assert.equal(first, second);
  assert.equal(first.options.secure, true);
  assert.equal(first.options.auth.user, 'alerts@happydoctor.kr');
});

test('the SMTP transport bounds every timeout', { concurrency: false }, async () => {
  const emailService = loadEmailServiceWithMocks({
    smtpConfig: WORKING_SMTP,
    recipients: ['admin@happydoctor.kr'],
    sentMails: [],
  });

  const { options } = emailService.getTransport();

  // A host that drops SMTP packets rather than refusing them would otherwise
  // hang for nodemailer's two-minute default.
  assert.equal(options.connectionTimeout, 8000);
  assert.equal(options.greetingTimeout, 8000);
  assert.equal(options.socketTimeout, 8000);
});

test('doctor alert subjects name the real notification types', { concurrency: false }, async () => {
  const sentMails = [];
  const emailService = loadEmailServiceWithMocks({
    smtpConfig: WORKING_SMTP,
    recipients: ['doctor@happydoctor.kr'],
    sentMails,
  });

  await emailService.sendDoctorAlertEmail({ patientId: 'p1', type: 'triage_initial' });
  await emailService.sendDoctorAlertEmail({ patientId: 'p2', type: 'follow_up_doctor' });
  await emailService.sendDoctorAlertEmail({ patientId: 'p3', type: 'patient_follow_up_question' });
  await emailService.sendDoctorAlertEmail({ patientId: 'p4', type: 'something_new' });

  assert.deepEqual(sentMails.map((mail) => mail.subject), [
    '[해피닥터] 새 상담 접수 - 의료진 확인 필요',
    '[해피닥터] 상담 후속 내용 접수 - 의료진 확인 필요',
    '[해피닥터] 환자 추가 문의 접수 - 의료진 확인 필요',
    '[해피닥터] 새 상담 접수 - 의료진 확인 필요',
  ]);
});

const RESEND_CONFIG = Object.freeze({
  apiKey: 'test-resend-key',
  from: '해피닥터 <alerts@happydoctor.kr>',
  endpoint: 'https://api.resend.com/emails',
  timeoutMs: 10000,
});

test('mail goes over HTTPS when the API provider is configured', { concurrency: false }, async () => {
  const requests = [];
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    requests.push({ url, options });
    return { ok: true, status: 200, text: async () => '' };
  };

  try {
    const sentMails = [];
    const emailService = loadEmailServiceWithMocks({
      // Both configured: HTTPS must win, because SMTP does not survive a host
      // that blocks the ports.
      smtpConfig: WORKING_SMTP,
      resendConfig: RESEND_CONFIG,
      recipients: ['doctor@happydoctor.kr'],
      sentMails,
    });

    assert.equal(emailService.getProvider(), 'resend');

    await emailService.sendDoctorAlertEmail({ patientId: 'public_1', type: 'triage_initial' });

    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, 'https://api.resend.com/emails');
    assert.equal(requests[0].options.headers.Authorization, 'Bearer test-resend-key');

    const body = JSON.parse(requests[0].options.body);
    assert.deepEqual(body.to, ['doctor@happydoctor.kr']);
    assert.match(body.text, /portal\.happydoctor\.kr/);
    assert.match(body.text, /건강정보와 상담 내용은 이 메일에 담기지 않습니다\./);

    // Nothing went through the SMTP transport.
    assert.deepEqual(sentMails, []);
  } finally {
    global.fetch = originalFetch;
  }
});

test('an API rejection surfaces its status instead of failing silently', { concurrency: false }, async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({ ok: false, status: 422, text: async () => 'domain not verified' });

  try {
    const emailService = loadEmailServiceWithMocks({
      smtpConfig: null,
      resendConfig: RESEND_CONFIG,
      recipients: ['doctor@happydoctor.kr'],
      sentMails: [],
    });

    await assert.rejects(
      () => emailService.sendDoctorAlertEmail({ patientId: 'public_1' }),
      /resend_422: domain not verified/,
    );
  } finally {
    global.fetch = originalFetch;
  }
});
