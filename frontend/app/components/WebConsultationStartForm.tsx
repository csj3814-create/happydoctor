'use client'

import { useState } from 'react'
import type { PublicConsultationCreateResponse } from '@/lib/status'

type WebConsultationStartFormProps = {
  entrySurface: string
}

type ConsultationFormState = {
  age: string
  gender: string
  chiefComplaint: string
  onset: string
  symptomDetail: string
  nrs: string
  associatedSymptom: string
  pastMedicalHistory: string
}

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

export default function WebConsultationStartForm({
  entrySurface,
}: WebConsultationStartFormProps) {
  const [formState, setFormState] = useState(INITIAL_FORM_STATE)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PublicConsultationCreateResponse | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setCopied(false)

    try {
      const response = await fetch('/api/public/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formState,
          entrySurface,
        }),
      })

      const payload = (await response.json()) as
        | PublicConsultationCreateResponse
        | { error?: string }

      if (!response.ok) {
        const errorMessage = 'error' in payload ? payload.error : undefined
        setResult(null)
        setError(errorMessage || '상담을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }

      setResult(payload as PublicConsultationCreateResponse)
      setFormState(INITIAL_FORM_STATE)
    } catch {
      setResult(null)
      setError('상담을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCopyCode() {
    if (!result?.trackingCode) return

    try {
      await navigator.clipboard.writeText(result.trackingCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-[2rem] border border-[var(--line)] bg-white p-5 shadow-[0_24px_60px_rgba(8,34,55,0.08)] sm:p-7"
      >
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
            <span className="text-sm font-semibold text-[var(--ink)]">가장 불편한 점</span>
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
              placeholder="알고 있는 질환, 복용 중인 약이 있으면 적어 주세요."
              rows={3}
              className="mt-3 w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm leading-7 text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white"
            />
          </label>
        </div>

        <div className="mt-6 rounded-[1.4rem] bg-[var(--soft-blue)] px-4 py-4 text-xs leading-6 text-[var(--muted)]">
          응급 상황이 의심되면 이 폼보다 119 또는 가까운 응급실 이용이 우선입니다. 해피닥터는 응급실을 대신하는
          서비스가 아니라, 의료가 멀게 느껴질 때 먼저 연결되는 무료 온라인 의료상담입니다.
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

      {result ? (
        <section className="rounded-[2rem] border border-[var(--line)] bg-white p-5 shadow-[0_24px_60px_rgba(8,34,55,0.08)] sm:p-7">
          <p className="display-face text-xs font-semibold uppercase tracking-[0.2em] text-[var(--blue)]">
            Consultation Started
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
            상담이 시작되었습니다
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            아래 답변은 보듬이가 먼저 정리해 드린 첫 안내입니다. 의료진 확인이 필요한 상담이면 같은 상태 확인 화면에
            이후 답변이 이어집니다.
          </p>

          <div className="mt-6 rounded-[1.6rem] bg-[var(--surface)] p-5">
            <p className="text-sm font-semibold text-[var(--ink)]">보듬이 첫 답변</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--muted)]">
              {result.replyToPatient}
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="rounded-[1.6rem] border border-[var(--line)] p-5">
              <p className="text-sm font-semibold text-[var(--ink)]">직접 입력 코드</p>
              <p className="mt-3 text-3xl font-semibold tracking-[0.14em] text-[var(--navy)]">
                {result.trackingCode || '생성 중'}
              </p>
              <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
                링크가 길어도 괜찮습니다. 이 짧은 코드만 적어 두면 나중에 직접 입력해 같은 상담 상태를 다시 열 수 있습니다.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="rounded-[1.2rem] border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--soft-blue)]"
            >
              {copied ? '코드 복사됨' : '코드 복사'}
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={result.statusUrl}
              className="rounded-[1.2rem] bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123c67]"
            >
              상태 확인 화면 열기
            </a>
            <a
              href="https://pf.kakao.com/_PxaTxhX/chat"
              className="rounded-[1.2rem] border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--soft-blue)]"
            >
              카카오톡으로 이어서 상담하기
            </a>
          </div>
        </section>
      ) : null}
    </div>
  )
}
