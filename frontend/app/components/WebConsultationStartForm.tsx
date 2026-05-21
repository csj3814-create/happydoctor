'use client'

import { useEffect, useMemo, useState } from 'react'

import type { PublicConsultationCreateResponse } from '@/lib/status'
import {
  ActiveConsultationSession,
  WebConsultationDraft,
  clearWebConsultationDraft,
  getActiveConsultationSession,
  getWebConsultationDraft,
  saveActiveConsultationSession,
  saveWebConsultationDraft,
} from '@/lib/consultation-session'
import { UiLanguage, isEnglishUiLanguage, saveUiLanguage, withUiLanguage } from '@/lib/ui-language'
import LocalizedFilePicker from '@/components/LocalizedFilePicker'

type WebConsultationStartFormProps = {
  entrySurface: string
  uiLanguage: UiLanguage
  inputLanguageLabel?: string | null
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
  replyNotificationConsent: false,
  replyNotificationPhone: '',
}

const copyByLanguage = {
  ko: {
    recentEyebrow: '최근 상담',
    recentBody: '최근 시작한 상담은 1시간 동안 유지됩니다.\n코드 {code} 로 바로 이어서 확인할 수 있습니다.',
    recentLink: '최근 상담 이어보기',
    restoredDraft: '방금 입력하던 내용을 다시 불러왔습니다. 이어서 작성한 뒤 상담을 시작할 수 있습니다.',
    languageHintEyebrow: '언어 안내',
    languageHintTitle: (label: string) => `${label} 로 적어도 괜찮습니다.`,
    languageHintBody: (label: string) => `${label} 로 입력한 내용은 자동으로 감지되어 의료진에게는 한국어 번역으로 전달되고, 가능한 경우 같은 언어로 답변이 돌아갑니다.`,
    phoneConsentRequired: '답변 알림을 받으려면 휴대폰 번호를 입력해 주세요.',
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
    imageSelectedLabel: (count: number) => `${count}개 파일 선택됨`,
    notificationTitle: '의료진 답변 알림 연락처 남기기',
    notificationDescription: '선택 사항입니다. 동의한 경우에만 의료진 답변 알림 연락처로 사용됩니다.',
    phoneLabel: '휴대폰 번호',
    phonePlaceholder: '예: 010-1234-5678',
    policyNote: '응급 상황이라고 느껴지면 신고나 119 또는 가까운 응급실 이용이 우선입니다. 해피닥터는 응급실을 대신하는 서비스가 아니라 의료가 멀게 느껴지는 분들이 온라인으로 먼저 도움을 청할 수 있게 돕는 상담 서비스입니다.',
    submitLoading: '보듬이가 내용을 정리하고 있습니다...',
    submitIdle: '웹으로 상담 시작',
  },
  en: {
    recentEyebrow: 'Recent consultation',
    recentBody: 'Your most recent consultation stays available for one hour.\nYou can continue with code {code}.',
    recentLink: 'Continue recent consultation',
    restoredDraft: 'We restored the details you were typing so you can continue and submit the consultation.',
    languageHintEyebrow: 'Language support',
    languageHintTitle: (label: string) => `You can write in ${label}.`,
    languageHintBody: (label: string) => `We will try to detect ${label} input automatically, translate it into Korean for our doctors, and send a translated reply back in the same language when possible.`,
    phoneConsentRequired: 'Please enter a phone number if you want reply notifications.',
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
    imageSelectedLabel: (count: number) => `${count} file${count === 1 ? '' : 's'} selected`,
    notificationTitle: 'Leave a phone number for reply alerts',
    notificationDescription: 'Optional. We only use this contact if you opt in to receive a reply alert.',
    phoneLabel: 'Phone number',
    phonePlaceholder: 'Example: +82 10-1234-5678',
    policyNote: 'If this feels urgent, please use emergency services first. Happy Doctor does not replace emergency care. It is an online support service for people who need to ask for help before healthcare becomes harder to reach.',
    submitLoading: 'Bodeum is organizing your consultation...',
    submitIdle: 'Start consultation on the web',
  },
} as const

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
    && !formState.replyNotificationConsent
    && !formState.replyNotificationPhone.trim()
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
  return withUiLanguage(statusUrl, uiLanguage)
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

export default function WebConsultationStartForm({
  entrySurface,
  uiLanguage,
  inputLanguageLabel,
}: WebConsultationStartFormProps) {
  const copy = copyByLanguage[uiLanguage]
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
    if (formState.replyNotificationConsent && !trimmedReplyNotificationPhone) {
      setError(copy.phoneConsentRequired)
      setSubmitting(false)
      return
    }

    if (!formState.replyNotificationConsent && trimmedReplyNotificationPhone) {
      setError(copy.phoneConsentMismatch)
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
      formData.append('replyNotificationConsent', String(formState.replyNotificationConsent))
      formData.append('replyNotificationPhone', formState.replyNotificationPhone)
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
      saveActiveConsultationSession({
        consultationId: consultation.consultationId,
        lookup: consultation.trackingCode || '',
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
              {copy.languageHintTitle(inputLanguageLabel)}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              {copy.languageHintBody(inputLanguageLabel)}
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
              selectedLabel={getSelectionLabel(files, copy.imageEmptyLabel, copy.imageSelectedLabel)}
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
                      required={formState.replyNotificationConsent}
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
              </div>
            </div>
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
          {submitting ? copy.submitLoading : copy.submitIdle}
        </button>

        {isEnglishUiLanguage(uiLanguage) ? (
          <p className="mt-4 text-xs leading-6 text-[var(--muted)]">
            Korean and English UI are fully supported. Other languages are accepted on a best-effort
            basis and may be translated automatically for our doctors.
          </p>
        ) : null}
      </form>
    </div>
  )
}
