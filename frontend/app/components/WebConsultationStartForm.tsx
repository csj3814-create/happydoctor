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

type WebConsultationStartFormProps = {
  entrySurface: string
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
}

function isEmptyFormState(formState: ConsultationFormState) {
  return Object.values(formState).every((value) => !value.trim())
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  return `${Math.max(1, Math.round(bytes / 1024))}KB`
}

export default function WebConsultationStartForm({
  entrySurface,
}: WebConsultationStartFormProps) {
  const [formState, setFormState] = useState(INITIAL_FORM_STATE)
  const [draftReady, setDraftReady] = useState(false)
  const [restoredDraft, setRestoredDraft] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSession, setActiveSession] = useState<ActiveConsultationSession | null>(null)
  const [files, setFiles] = useState<File[]>([])

  useEffect(() => {
    const draft = getWebConsultationDraft()
    if (draft) {
      setFormState({
        ...INITIAL_FORM_STATE,
        ...draft,
      })
      setRestoredDraft(true)
    }

    setActiveSession(getActiveConsultationSession())
    setDraftReady(true)
  }, [])

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
      formData.append('entrySurface', entrySurface)
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
        setError(errorMessage || '상담을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }

      const consultation = responsePayload as PublicConsultationCreateResponse
      saveActiveConsultationSession({
        consultationId: consultation.consultationId,
        lookup: consultation.trackingCode || '',
        trackingCode: consultation.trackingCode || null,
        statusUrl: consultation.statusUrl,
        chatbotReply: consultation.replyToPatient,
      })
      clearWebConsultationDraft()
      setFormState(INITIAL_FORM_STATE)
      setFiles([])
      window.location.assign(consultation.statusUrl)
    } catch {
      setError('상담을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {activeSession && (
        <section className="rounded-[1.6rem] border border-[var(--line)] bg-white px-5 py-4 shadow-[0_18px_40px_rgba(8,34,55,0.06)]">
          <p className="display-face text-xs font-semibold uppercase tracking-[0.2em] text-[var(--blue)]">
            최근 상담
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm leading-7 text-[var(--muted)]">
              최근 시작한 상담이 1시간 동안 유지됩니다.
              <br />
              코드 <span className="font-semibold text-[var(--navy)]">{activeSession.trackingCode || activeSession.lookup}</span> 로
              바로 이어서 확인할 수 있습니다.
            </div>
            <a
              href={activeSession.statusUrl}
              className="rounded-[1.1rem] bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white visited:text-white transition hover:bg-[#123c67]"
              style={{ color: '#ffffff' }}
            >
              최근 상담 이어보기
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
            방금 입력하던 내용을 다시 불러왔습니다. 이어서 작성한 뒤 상담을 시작할 수 있습니다.
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-[var(--ink)]">나이 또는 연령대</span>
            <input
              type="text"
              value={formState.age}
              onChange={(event) => setFormState((current) => ({ ...current, age: event.target.value }))}
              placeholder="예: 40대, 27세"
              className="mt-3 w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[var(--ink)]">성별</span>
            <select
              value={formState.gender}
              onChange={(event) => setFormState((current) => ({ ...current, gender: event.target.value }))}
              className="mt-3 w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white"
            >
              <option value="">선택 안 함</option>
              <option value="여성">여성</option>
              <option value="남성">남성</option>
              <option value="기타">기타</option>
            </select>
          </label>
        </div>

        <div className="mt-5 space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-[var(--ink)]">가장 불편한 증상</span>
            <input
              type="text"
              required
              value={formState.chiefComplaint}
              onChange={(event) =>
                setFormState((current) => ({ ...current, chiefComplaint: event.target.value }))
              }
              placeholder="예: 복통, 어지러움, 발열"
              className="mt-3 w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white"
            />
          </label>

          <div className="grid gap-5 md:grid-cols-[1fr_160px]">
            <label className="block">
              <span className="text-sm font-semibold text-[var(--ink)]">언제부터 있었나요</span>
              <input
                type="text"
                value={formState.onset}
                onChange={(event) => setFormState((current) => ({ ...current, onset: event.target.value }))}
                placeholder="예: 오늘 아침부터, 3일 전부터"
                className="mt-3 w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[var(--ink)]">증상 점수</span>
              <select
                value={formState.nrs}
                onChange={(event) => setFormState((current) => ({ ...current, nrs: event.target.value }))}
                className="mt-3 w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white"
              >
                <option value="">모르겠음</option>
                {Array.from({ length: 11 }, (_, index) => (
                  <option key={index} value={index}>
                    {index}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-[var(--ink)]">자세한 설명</span>
            <textarea
              required
              value={formState.symptomDetail}
              onChange={(event) =>
                setFormState((current) => ({ ...current, symptomDetail: event.target.value }))
              }
              placeholder="어디가 어떻게 불편한지, 지금 가장 걱정되는 점이 무엇인지 적어 주세요."
              rows={5}
              className="mt-3 w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm leading-7 text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[var(--ink)]">함께 있는 증상</span>
            <input
              type="text"
              value={formState.associatedSymptom}
              onChange={(event) =>
                setFormState((current) => ({ ...current, associatedSymptom: event.target.value }))
              }
              placeholder="예: 구토, 발열, 설사, 기침"
              className="mt-3 w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[var(--ink)]">기저질환 또는 복용약</span>
            <textarea
              value={formState.pastMedicalHistory}
              onChange={(event) =>
                setFormState((current) => ({ ...current, pastMedicalHistory: event.target.value }))
              }
              placeholder="앓고 있는 질환, 복용 중인 약이 있으면 적어 주세요."
              rows={3}
              className="mt-3 w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm leading-7 text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[var(--ink)]">사진 첨부</span>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              상처, 피부, 복용 중인 약 포장처럼 사진이 있으면 처음 상담을 더 정확하게 이어갈 수 있습니다.
              <br />
              최대 3장, 장당 10MB 이하 사진을 함께 올릴 수 있습니다.
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              multiple
              disabled={submitting}
              onChange={(event) => {
                const nextFiles = Array.from(event.target.files || []).slice(0, 3)
                setFiles(nextFiles)
                setError(null)
              }}
              className="mt-3 block w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--navy)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
          </label>

          {selectedSummary.length > 0 ? (
            <ul className="rounded-[1.4rem] bg-[var(--surface)] px-4 py-4 text-sm leading-7 text-[var(--ink)]">
              {selectedSummary.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="mt-6 rounded-[1.4rem] bg-[var(--soft-blue)] px-4 py-4 text-xs leading-6 text-[var(--muted)]">
          응급 상황이 의심되면 앱보다 119 또는 가까운 응급실 이용이 우선입니다. 해피닥터는 응급실을 대신하는 서비스가 아니라,
          의료가 멀게 느껴지는 분들이 온라인으로 먼저 도움을 청할 수 있게 돕는 상담 서비스입니다.
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
          {submitting ? '보듬이가 내용을 정리하고 있습니다...' : '웹으로 상담 시작'}
        </button>
      </form>
    </div>
  )
}
