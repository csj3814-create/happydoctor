'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  type PublicConsultationCreateResponse,
  extractStatusLookupFromUrl,
  localizeAndProtectStatusUrl,
} from '@/lib/status'
import type { StartFormCopy } from '@/lib/start-copy'
import {
  ActiveConsultationSession,
  WebConsultationDraft,
  clearWebConsultationDraft,
  getActiveConsultationSession,
  getWebConsultationDraft,
  saveActiveConsultationSession,
  saveWebConsultationDraft,
} from '@/lib/consultation-session'
import { UiLanguage, isEnglishUiLanguage, saveUiLanguage } from '@/lib/ui-language'
import LocalizedFilePicker from '@/components/LocalizedFilePicker'

type WebConsultationStartFormProps = {
  entrySurface: string
  uiLanguage: UiLanguage
  inputLanguageLabel?: string | null
  copyOverride?: StartFormCopy | null
}

type ConsultationFormState = WebConsultationDraft

const INITIAL_FORM_STATE: ConsultationFormState = {
  age: '',
  gender: '',
  chiefComplaint: '',
  onset: '',
  symptomDetail: '',
  nrs: '',
  associatedSymptom: '',
  pastMedicalHistory: '',
  privacyConsent: false,
  sensitiveInfoConsent: false,
  adultConfirmed: false,
  replyNotificationConsent: false,
  replyNotificationPhone: '',
  replyNotificationEmail: '',
}

const REPLY_NOTIFICATION_EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

const copyByLanguage = {
  ko: {
    recentEyebrow: '최근 상담',
    recentBody: '최근 시작한 상담은 1시간 동안 유지됩니다.\n코드 {code} 로 바로 이어서 확인할 수 있습니다.',
    recentLink: '최근 상담 이어보기',
    restoredDraft: '방금 입력하던 내용을 다시 불러왔습니다. 이어서 작성한 뒤 상담을 시작할 수 있습니다.',
    languageHintEyebrow: '언어 안내',
    languageHintTitle: '{language} 로 적어도 괜찮습니다.',
    languageHintBody: '{language} 로 입력한 내용은 의료진 검토를 돕기 위해 번역될 수 있으며, 모든 상담과 답변은 의료진이 직접 검토합니다.',
    phoneConsentRequired: '답변 알림을 받으려면 휴대폰 번호나 이메일 중 하나를 입력해 주세요.',
    phoneConsentMismatch: '답변 알림 연락처는 동의한 경우에만 저장할 수 있습니다.',
    submitError: '상담을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    ageLabel: '나이 또는 연령대',
    agePlaceholder: '예: 40대, 27세',
    genderLabel: '성별',
    genderPlaceholder: '선택 안 함',
    genderOptions: [
      { value: 'female', label: '여성' },
      { value: 'male', label: '남성' },
      { value: 'other', label: '기타' },
      { value: 'prefer_not_to_say', label: '밝히지 않음' },
    ],
    chiefComplaintLabel: '가장 불편한 증상',
    chiefComplaintPlaceholder: '예: 복통, 기침, 발열',
    onsetLabel: '언제부터 있었나요',
    onsetPlaceholder: '예: 오늘 아침부터, 3일 전부터',
    nrsLabel: '증상 점수',
    nrsUnknown: '모르겠음',
    symptomDetailLabel: '자세한 설명',
    symptomDetailPlaceholder: '어디가 어떻게 불편한지, 지금 가장 걱정되는 점이 무엇인지 적어 주세요.',
    associatedLabel: '함께 있는 증상',
    associatedPlaceholder: '예: 구토, 발열, 설사, 기침',
    historyLabel: '기저질환 또는 복용약',
    historyPlaceholder: '앓고 있는 질환, 복용 중인 약이 있으면 적어 주세요.',
    imageLabel: '사진 첨부',
    imageDescription: '상처, 발진, 복용 중인 약 포장처럼 사진이 있으면 처음 상담을 더 정확하게 이어갈 수 있습니다.\n최대 3장, 장당 10MB 이하 사진을 올릴 수 있습니다.',
    imageChooseLabel: '파일 선택',
    imageEmptyLabel: '선택된 파일 없음',
    imageSelectedLabel: '{count}개 파일 선택됨',
    notificationTitle: '의료진 답변 알림 연락처 남기기',
    notificationDescription: '선택 사항입니다. 동의한 경우에만 의료진 답변 알림 연락처로 사용됩니다.',
    phoneLabel: '휴대폰 번호',
    phonePlaceholder: '예: 010-1234-5678',
    emailLabel: '이메일 (선택)',
    emailPlaceholder: '예: name@example.com',
    contactChoiceHint: '휴대폰 번호와 이메일 중 하나만 입력해도 됩니다.',
    emailInvalid: '이메일 주소를 다시 확인해 주세요.',
    policyNote: '응급 상황이라고 느껴지면 신고나 119 또는 가까운 응급실 이용이 우선입니다. 해피닥터는 응급실을 대신하는 서비스가 아니라 의료가 멀게 느껴지는 분들이 온라인으로 먼저 도움을 청할 수 있게 돕는 상담 서비스입니다.',
    submitLoading: '상담 내용을 안전하게 접수하고 있습니다...',
    submitIdle: '웹으로 상담 시작',
    englishSupportNote: '한국어와 영어 UI를 지원합니다. 번역이 필요한 경우에도 모든 상담은 의료진이 직접 검토합니다.',
  },
  en: {
    recentEyebrow: 'Recent consultation',
    recentBody: 'Your most recent consultation stays available for one hour.\nYou can continue with code {code}.',
    recentLink: 'Continue recent consultation',
    restoredDraft: 'We restored the details you were typing so you can continue and submit the consultation.',
    languageHintEyebrow: 'Language support',
    languageHintTitle: 'You can write in {language}.',
    languageHintBody: 'Your {language} message may be translated to support review. Every consultation and reply is directly reviewed by a doctor.',
    phoneConsentRequired: 'Please enter a phone number or an email address if you want reply notifications.',
    phoneConsentMismatch: 'We only save a reply notification contact when you opt in.',
    submitError: 'We could not start the consultation right now. Please try again shortly.',
    ageLabel: 'Age or age range',
    agePlaceholder: 'Example: 40s, 27 years old',
    genderLabel: 'Gender',
    genderPlaceholder: 'Prefer not to say',
    genderOptions: [
      { value: 'female', label: 'Female' },
      { value: 'male', label: 'Male' },
      { value: 'other', label: 'Other' },
      { value: 'prefer_not_to_say', label: 'Prefer not to say' },
    ],
    chiefComplaintLabel: 'Main symptom',
    chiefComplaintPlaceholder: 'Example: stomach pain, cough, fever',
    onsetLabel: 'When did it start?',
    onsetPlaceholder: 'Example: this morning, 3 days ago',
    nrsLabel: 'Pain or symptom score',
    nrsUnknown: 'Not sure',
    symptomDetailLabel: 'Tell us more',
    symptomDetailPlaceholder: 'Please describe what feels uncomfortable and what worries you most right now.',
    associatedLabel: 'Other symptoms',
    associatedPlaceholder: 'Example: vomiting, fever, diarrhea, cough',
    historyLabel: 'Medical history or medicines',
    historyPlaceholder: 'Please tell us about chronic conditions or medicines you take.',
    imageLabel: 'Add photos',
    imageDescription: 'If you have photos such as a rash, wound, or medicine package, they can help us understand your situation better.\nYou can upload up to 3 images, up to 10MB each.',
    imageChooseLabel: 'Choose files',
    imageEmptyLabel: 'No file selected',
    imageSelectedLabel: '{count} files selected',
    notificationTitle: 'Leave a contact for reply alerts',
    notificationDescription: 'Optional. We only use this contact if you opt in to receive a reply alert.',
    phoneLabel: 'Phone number',
    phonePlaceholder: 'Example: +82 10-1234-5678',
    emailLabel: 'Email (optional)',
    emailPlaceholder: 'Example: name@example.com',
    contactChoiceHint: 'Either a phone number or an email address is enough.',
    emailInvalid: 'Please check the email address.',
    policyNote: 'If this feels urgent, please use emergency services first. Happy Doctor does not replace emergency care. It is an online support service for people who need to ask for help before healthcare becomes harder to reach.',
    submitLoading: 'Submitting your consultation securely...',
    submitIdle: 'Start consultation on the web',
    englishSupportNote: 'Korean and English UI are supported. When translation is needed, every consultation is still directly reviewed by a doctor.',
  },
} as const

const consentCopyByLanguage = {
  ko: {
    title: '상담 접수 동의',
    requiredError: '필수 개인정보 수집·이용, 민감정보 처리 및 만 18세 이상 확인에 모두 동의해 주세요.',
    privacyTitle: '[필수] 개인정보 수집·이용 동의',
    privacyBody: '나이 또는 연령대, 성별, 상담 언어와 접속 정보를 상담 접수·진행·상태 확인 및 서비스 보안을 위해 처리합니다.',
    sensitiveTitle: '[필수] 민감정보(건강정보) 수집·이용 동의',
    sensitiveBody: '증상, 발생 시점, 증상 점수, 병력·복용약과 선택한 사진을 상담 내용 확인과 답변 제공을 위해 처리합니다.',
    adultTitle: '[필수] 만 18세 이상입니다',
    adultBody: '현재 이 상담 창구는 만 18세 이상만 이용할 수 있습니다.',
    policyPrefix: '자세한 내용은',
    policyLink: '개인정보처리방침',
    policySuffix: '에서 확인할 수 있습니다.',
  },
  en: {
    title: 'Consent for consultation intake',
    requiredError: 'Please agree to the required privacy, sensitive health data, and age confirmations.',
    privacyTitle: '[Required] Collection and use of personal information',
    privacyBody: 'We process your age or age range, gender, language, and connection data to receive and manage your consultation, show its status, and protect the service.',
    sensitiveTitle: '[Required] Collection and use of sensitive health information',
    sensitiveBody: 'We process symptoms, onset, symptom score, medical history, medicines, and any photos you choose to submit so the consultation can be reviewed and answered.',
    adultTitle: '[Required] I am at least 18 years old',
    adultBody: 'This consultation service is currently available only to adults aged 18 or older.',
    policyPrefix: 'Read the',
    policyLink: 'Privacy Policy',
    policySuffix: 'for more information.',
  },
} as const

const reviewFlowCopyByLanguage = {
  ko: {
    languageHintBody: '{language} 로 입력한 내용은 의료진 검토를 돕기 위해 번역될 수 있으며, 모든 상담과 답변은 의료진이 직접 검토합니다.',
    submitLoading: '상담 내용을 안전하게 접수하고 있습니다...',
  },
  en: {
    languageHintBody: 'Your {language} message may be translated to support review. Every consultation and reply is directly reviewed by a doctor.',
    submitLoading: 'Submitting your consultation securely...',
  },
} as const

const PRIVACY_POLICY_VERSION = '2026-07-28'

function isEmptyFormState(formState: ConsultationFormState) {
  return (
    !formState.age.trim()
    && !formState.gender.trim()
    && !formState.chiefComplaint.trim()
    && !formState.onset.trim()
    && !formState.symptomDetail.trim()
    && !formState.nrs.trim()
    && !formState.associatedSymptom.trim()
    && !formState.pastMedicalHistory.trim()
    && !formState.privacyConsent
    && !formState.sensitiveInfoConsent
    && !formState.adultConfirmed
    && !formState.replyNotificationConsent
    && !formState.replyNotificationPhone.trim()
    && !formState.replyNotificationEmail.trim()
  )
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  return `${Math.max(1, Math.round(bytes / 1024))}KB`
}

function normalizeDraftGender(value: string) {
  switch (value) {
    case '남성':
      return 'male'
    case '여성':
      return 'female'
    case '기타':
      return 'other'
    case '밝히지 않음':
      return 'prefer_not_to_say'
    default:
      return value
  }
}

function localizeStatusUrl(statusUrl: string, uiLanguage: UiLanguage) {
  return localizeAndProtectStatusUrl(statusUrl, uiLanguage)
}

function getSelectionLabel(
  files: File[],
  emptyLabel: string,
  selectedLabel: (count: number) => string,
) {
  if (files.length === 0) return emptyLabel
  if (files.length === 1) return files[0].name
  return selectedLabel(files.length)
}

function formatTemplate(template: string, replacements: Record<string, string | number | null | undefined>) {
  return Object.entries(replacements).reduce((current, [key, value]) => {
    return current.replaceAll(`{${key}}`, value == null ? '' : String(value))
  }, template)
}

export default function WebConsultationStartForm({
  entrySurface,
  uiLanguage,
  inputLanguageLabel,
  copyOverride = null,
}: WebConsultationStartFormProps) {
  // Locale bundles that predate the email contact field fall back to the
  // built-in copy for the keys they do not carry yet.
  const copy = copyOverride
    ? { ...copyByLanguage[uiLanguage], ...copyOverride }
    : copyByLanguage[uiLanguage]
  const consentCopy = consentCopyByLanguage[uiLanguage]
  const reviewFlowCopy = reviewFlowCopyByLanguage[uiLanguage]
  const [formState, setFormState] = useState(INITIAL_FORM_STATE)
  const [draftReady, setDraftReady] = useState(false)
  const [restoredDraft, setRestoredDraft] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSession, setActiveSession] = useState<ActiveConsultationSession | null>(null)
  const [files, setFiles] = useState<File[]>([])

  useEffect(() => {
    saveUiLanguage(uiLanguage)

    const draft = getWebConsultationDraft()
    if (draft) {
      // Restore a browser-only draft after hydration; no server snapshot contains this data.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormState({
        ...INITIAL_FORM_STATE,
        ...draft,
        gender: normalizeDraftGender(draft.gender),
      })
      setRestoredDraft(true)
    }

    setActiveSession(getActiveConsultationSession())
    setDraftReady(true)
  }, [uiLanguage])

  useEffect(() => {
    if (!draftReady) return

    if (isEmptyFormState(formState)) {
      clearWebConsultationDraft()
      return
    }

    saveWebConsultationDraft(formState)
  }, [draftReady, formState])

  const selectedSummary = useMemo(() => {
    return files.map((file) => `${file.name} (${formatFileSize(file.size)})`)
  }, [files])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const trimmedReplyNotificationPhone = formState.replyNotificationPhone.trim()
    const trimmedReplyNotificationEmail = formState.replyNotificationEmail.trim()
    if (
      !formState.privacyConsent
      || !formState.sensitiveInfoConsent
      || !formState.adultConfirmed
    ) {
      setError(consentCopy.requiredError)
      setSubmitting(false)
      return
    }

    if (
      formState.replyNotificationConsent
      && !trimmedReplyNotificationPhone
      && !trimmedReplyNotificationEmail
    ) {
      setError(copy.phoneConsentRequired)
      setSubmitting(false)
      return
    }

    if (
      !formState.replyNotificationConsent
      && (trimmedReplyNotificationPhone || trimmedReplyNotificationEmail)
    ) {
      setError(copy.phoneConsentMismatch)
      setSubmitting(false)
      return
    }

    if (trimmedReplyNotificationEmail && !REPLY_NOTIFICATION_EMAIL_PATTERN.test(trimmedReplyNotificationEmail)) {
      setError(copy.emailInvalid)
      setSubmitting(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('age', formState.age)
      formData.append('gender', formState.gender)
      formData.append('chiefComplaint', formState.chiefComplaint)
      formData.append('onset', formState.onset)
      formData.append('symptomDetail', formState.symptomDetail)
      formData.append('nrs', formState.nrs)
      formData.append('associatedSymptom', formState.associatedSymptom)
      formData.append('pastMedicalHistory', formState.pastMedicalHistory)
      formData.append('privacyConsent', String(formState.privacyConsent))
      formData.append('sensitiveInfoConsent', String(formState.sensitiveInfoConsent))
      formData.append('adultConfirmed', String(formState.adultConfirmed))
      formData.append('privacyPolicyVersion', PRIVACY_POLICY_VERSION)
      formData.append('replyNotificationConsent', String(formState.replyNotificationConsent))
      formData.append('replyNotificationPhone', formState.replyNotificationPhone)
      formData.append('replyNotificationEmail', formState.replyNotificationEmail)
      formData.append('entrySurface', entrySurface)
      formData.append('uiLanguage', uiLanguage)
      files.forEach((file) => formData.append('images', file))

      const response = await fetch('/api/public/consultations', {
        method: 'POST',
        body: formData,
      })

      const responsePayload = (await response.json()) as
        | PublicConsultationCreateResponse
        | { error?: string }

      if (!response.ok) {
        const errorMessage = 'error' in responsePayload ? responsePayload.error : undefined
        setError(errorMessage || copy.submitError)
        return
      }

      const consultation = responsePayload as PublicConsultationCreateResponse
      const localizedStatusUrl = localizeStatusUrl(consultation.statusUrl, uiLanguage)
      const longLookup = extractStatusLookupFromUrl(consultation.statusUrl)
      saveActiveConsultationSession({
        consultationId: consultation.consultationId,
        lookup: longLookup || consultation.trackingCode || '',
        trackingCode: consultation.trackingCode || null,
        statusUrl: localizedStatusUrl,
        uiLanguage,
        chatbotReply: consultation.replyToPatient,
      })
      clearWebConsultationDraft()
      setFormState(INITIAL_FORM_STATE)
      setFiles([])
      window.location.assign(localizedStatusUrl)
    } catch {
      setError(copy.submitError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {activeSession && (
        <section className="rounded-[1.6rem] border border-[var(--line)] bg-white px-5 py-4 shadow-[0_18px_40px_rgba(8,34,55,0.06)]">
          <p className="display-face text-xs font-semibold uppercase tracking-[0.2em] text-[var(--blue)]">
            {copy.recentEyebrow}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="whitespace-pre-line text-sm leading-7 text-[var(--muted)]">
              {copy.recentBody.replace('{code}', activeSession.trackingCode || activeSession.lookup)}
            </div>
            <a
              href={localizeStatusUrl(activeSession.statusUrl, uiLanguage)}
              className="rounded-[1.1rem] bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white visited:text-white transition hover:bg-[#123c67]"
              style={{ color: '#ffffff' }}
            >
              {copy.recentLink}
            </a>
          </div>
        </section>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-[2rem] border border-[var(--line)] bg-white p-5 shadow-[0_24px_60px_rgba(8,34,55,0.08)] sm:p-7"
      >
        {restoredDraft && (
          <div className="mb-5 rounded-[1.4rem] bg-[var(--soft-blue)] px-4 py-4 text-sm leading-7 text-[var(--ink)]">
            {copy.restoredDraft}
          </div>
        )}

        {inputLanguageLabel ? (
          <div className="mb-5 rounded-[1.4rem] border border-[#c9dcff] bg-[#f4f8ff] px-4 py-4 text-[var(--ink)]">
            <p className="display-face text-xs font-semibold uppercase tracking-[0.18em] text-[var(--blue)]">
              {copy.languageHintEyebrow}
            </p>
            <p className="mt-2 text-sm font-semibold leading-7">
              {formatTemplate(copy.languageHintTitle, { language: inputLanguageLabel })}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              {formatTemplate(reviewFlowCopy.languageHintBody, { language: inputLanguageLabel })}
            </p>
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-[var(--ink)]">{copy.ageLabel}</span>
            <input
              type="text"
              value={formState.age}
              onChange={(event) => setFormState((current) => ({ ...current, age: event.target.value }))}
              placeholder={copy.agePlaceholder}
              className="mt-3 w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[var(--ink)]">{copy.genderLabel}</span>
            <select
              value={formState.gender}
              onChange={(event) => setFormState((current) => ({ ...current, gender: event.target.value }))}
              className="mt-3 w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white"
            >
              <option value="">{copy.genderPlaceholder}</option>
              {copy.genderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-[var(--ink)]">{copy.chiefComplaintLabel}</span>
            <input
              type="text"
              required
              value={formState.chiefComplaint}
              onChange={(event) =>
                setFormState((current) => ({ ...current, chiefComplaint: event.target.value }))
              }
              placeholder={copy.chiefComplaintPlaceholder}
              className="mt-3 w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white"
            />
          </label>

          <div className="grid gap-5 md:grid-cols-[1fr_160px]">
            <label className="block">
              <span className="text-sm font-semibold text-[var(--ink)]">{copy.onsetLabel}</span>
              <input
                type="text"
                value={formState.onset}
                onChange={(event) => setFormState((current) => ({ ...current, onset: event.target.value }))}
                placeholder={copy.onsetPlaceholder}
                className="mt-3 w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[var(--ink)]">{copy.nrsLabel}</span>
              <select
                value={formState.nrs}
                onChange={(event) => setFormState((current) => ({ ...current, nrs: event.target.value }))}
                className="mt-3 w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white"
              >
                <option value="">{copy.nrsUnknown}</option>
                {Array.from({ length: 11 }, (_, index) => (
                  <option key={index} value={index}>
                    {index}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-[var(--ink)]">{copy.symptomDetailLabel}</span>
            <textarea
              required
              value={formState.symptomDetail}
              onChange={(event) =>
                setFormState((current) => ({ ...current, symptomDetail: event.target.value }))
              }
              placeholder={copy.symptomDetailPlaceholder}
              rows={5}
              className="mt-3 w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm leading-7 text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[var(--ink)]">{copy.associatedLabel}</span>
            <input
              type="text"
              value={formState.associatedSymptom}
              onChange={(event) =>
                setFormState((current) => ({ ...current, associatedSymptom: event.target.value }))
              }
              placeholder={copy.associatedPlaceholder}
              className="mt-3 w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[var(--ink)]">{copy.historyLabel}</span>
            <textarea
              value={formState.pastMedicalHistory}
              onChange={(event) =>
                setFormState((current) => ({ ...current, pastMedicalHistory: event.target.value }))
              }
              placeholder={copy.historyPlaceholder}
              rows={3}
              className="mt-3 w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm leading-7 text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[var(--ink)]">{copy.imageLabel}</span>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[var(--muted)]">
              {copy.imageDescription}
            </p>
            <LocalizedFilePicker
              buttonLabel={copy.imageChooseLabel}
              emptyLabel={copy.imageEmptyLabel}
              selectedLabel={getSelectionLabel(
                files,
                copy.imageEmptyLabel,
                (count) => formatTemplate(copy.imageSelectedLabel, { count }),
              )}
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              multiple
              disabled={submitting}
              onChange={(nextFiles) => {
                setFiles(nextFiles.slice(0, 3))
                setError(null)
              }}
            />
          </label>

          <section className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
            <div className="flex items-start gap-3">
              <input
                id="replyNotificationConsent"
                type="checkbox"
                checked={formState.replyNotificationConsent}
                onChange={(event) => {
                  const checked = event.target.checked
                  setError(null)
                  setFormState((current) => ({
                    ...current,
                    replyNotificationConsent: checked,
                    replyNotificationPhone: checked ? current.replyNotificationPhone : '',
                    replyNotificationEmail: checked ? current.replyNotificationEmail : '',
                  }))
                }}
                className="mt-1 h-4 w-4 rounded border-[var(--line)] text-[var(--navy)] focus:ring-[var(--blue)]"
              />
              <div className="flex-1">
                <label
                  htmlFor="replyNotificationConsent"
                  className="text-sm font-semibold text-[var(--ink)]"
                >
                  {copy.notificationTitle}
                </label>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  {copy.notificationDescription}
                </p>
                {formState.replyNotificationConsent ? (
                  <label className="mt-3 block">
                    <span className="text-sm font-medium text-[var(--ink)]">{copy.phoneLabel}</span>
                    <input
                      type="tel"
                      value={formState.replyNotificationPhone}
                      onChange={(event) => {
                        setError(null)
                        setFormState((current) => ({
                          ...current,
                          replyNotificationPhone: event.target.value,
                        }))
                      }}
                      placeholder={copy.phonePlaceholder}
                      className="mt-3 w-full rounded-[1.1rem] border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--blue)]"
                    />
                  </label>
                ) : null}
                {formState.replyNotificationConsent ? (
                  <label className="mt-3 block">
                    <span className="text-sm font-medium text-[var(--ink)]">{copy.emailLabel}</span>
                    <input
                      type="email"
                      value={formState.replyNotificationEmail}
                      onChange={(event) => {
                        setError(null)
                        setFormState((current) => ({
                          ...current,
                          replyNotificationEmail: event.target.value,
                        }))
                      }}
                      placeholder={copy.emailPlaceholder}
                      className="mt-3 w-full rounded-[1.1rem] border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--blue)]"
                    />
                    <p className="mt-2 text-xs leading-6 text-[var(--muted)]">{copy.contactChoiceHint}</p>
                  </label>
                ) : null}
              </div>
            </div>
          </section>

          <section className="rounded-[1.4rem] border border-[#bfd6f2] bg-[#f6faff] px-4 py-4">
            <h3 className="text-sm font-semibold text-[var(--ink)]">{consentCopy.title}</h3>
            <div className="mt-4 space-y-4">
              {([
                {
                  id: 'privacyConsent',
                  checked: formState.privacyConsent,
                  title: consentCopy.privacyTitle,
                  body: consentCopy.privacyBody,
                  key: 'privacyConsent',
                },
                {
                  id: 'sensitiveInfoConsent',
                  checked: formState.sensitiveInfoConsent,
                  title: consentCopy.sensitiveTitle,
                  body: consentCopy.sensitiveBody,
                  key: 'sensitiveInfoConsent',
                },
                {
                  id: 'adultConfirmed',
                  checked: formState.adultConfirmed,
                  title: consentCopy.adultTitle,
                  body: consentCopy.adultBody,
                  key: 'adultConfirmed',
                },
              ] as const).map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <input
                    id={item.id}
                    type="checkbox"
                    required
                    checked={item.checked}
                    onChange={(event) => {
                      setError(null)
                      setFormState((current) => ({
                        ...current,
                        [item.key]: event.target.checked,
                      }))
                    }}
                    className="mt-1 h-4 w-4 rounded border-[var(--line)] text-[var(--navy)] focus:ring-[var(--blue)]"
                  />
                  <div>
                    <label htmlFor={item.id} className="text-sm font-semibold text-[var(--ink)]">
                      {item.title}
                    </label>
                    <p className="mt-1 text-xs leading-6 text-[var(--muted)]">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-6 text-[var(--muted)]">
              {consentCopy.policyPrefix}{' '}
              <a href="/privacy" target="_blank" rel="noreferrer" className="font-semibold text-[var(--blue)] underline underline-offset-2">
                {consentCopy.policyLink}
              </a>{' '}
              {consentCopy.policySuffix}
            </p>
          </section>

          {selectedSummary.length > 0 ? (
            <ul className="rounded-[1.4rem] bg-[var(--surface)] px-4 py-4 text-sm leading-7 text-[var(--ink)]">
              {selectedSummary.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="mt-6 rounded-[1.4rem] bg-[var(--soft-blue)] px-4 py-4 text-xs leading-6 text-[var(--muted)]">
          {copy.policyNote}
        </div>

        {error ? (
          <div className="mt-5 rounded-[1.4rem] border border-[#ffd2c5] bg-[#fff6f2] px-4 py-4 text-sm leading-7 text-[#9b5031]">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-[1.2rem] bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123c67] disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {submitting ? reviewFlowCopy.submitLoading : copy.submitIdle}
        </button>

        {isEnglishUiLanguage(uiLanguage) ? (
          <p className="mt-4 text-xs leading-6 text-[var(--muted)]">
            {copy.englishSupportNote}
          </p>
        ) : null}
      </form>
    </div>
  )
}
