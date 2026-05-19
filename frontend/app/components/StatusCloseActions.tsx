'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { UiLanguage } from '@/lib/ui-language'

type StatusCloseActionsProps = {
  lookup: string
  canClose: boolean
  isClosed: boolean
  uiLanguage: UiLanguage
  allowFollowUp?: boolean
  onUpdated?: () => void
}

const copyByLanguage = {
  ko: {
    closedTitle: '상담 상태',
    closedBody: '이 상담은 이미 종료되었습니다. 다시 도움이 필요하면 새 상담을 시작해 주세요.',
    title: '다음 행동',
    body: '의료진 답변 뒤에 더 궁금한 점이 있으면 같은 상담 안에서 추가 질문을 남길 수 있습니다.',
    closeBodySuffix: '답변을 충분히 확인했다면 상담 종료도 바로 진행할 수 있습니다.',
    placeholder:
      '예: 약은 어떻게 먹으면 되는지, 언제 다시 병원에 가야 하는지처럼 이어서 궁금한 점을 적어 주세요.',
    followUpSending: '추가 질문을 보내고 있습니다...',
    followUpSubmit: '추가 질문 보내기',
    closeSending: '상담을 종료하고 있습니다...',
    closeSubmit: '답변 확인 후 상담 종료',
    closeSuccess: '상담이 종료되었습니다. 다시 도움이 필요하면 새 상담을 시작해 주세요.',
    closeError: '상담을 종료하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    followUpSuccess:
      '추가 질문이 의료진에게 전달되었습니다. 답변이 준비되면 이 화면에서 바로 확인할 수 있습니다.',
    followUpError: '추가 질문을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.',
  },
  en: {
    closedTitle: 'Consultation status',
    closedBody: 'This consultation is already closed. Please start a new one if you still need help.',
    title: 'Next steps',
    body: 'If you still have questions after the doctor reply, you can leave a follow-up message in this consultation.',
    closeBodySuffix: 'If the reply was enough, you can also close the consultation here.',
    placeholder:
      'Example: when should I visit a clinic again, or what should I watch for next?',
    followUpSending: 'Sending your follow-up question...',
    followUpSubmit: 'Send follow-up question',
    closeSending: 'Closing the consultation...',
    closeSubmit: 'Close consultation',
    closeSuccess: 'This consultation is now closed. Please start a new one if you need more help.',
    closeError: 'We could not close the consultation right now. Please try again shortly.',
    followUpSuccess:
      'Your follow-up question was sent to the doctors. You can check this page again when a reply is ready.',
    followUpError: 'We could not send your follow-up question right now. Please try again shortly.',
  },
} as const

export default function StatusCloseActions({
  lookup,
  canClose,
  isClosed,
  uiLanguage,
  allowFollowUp = false,
  onUpdated,
}: StatusCloseActionsProps) {
  const router = useRouter()
  const copy = copyByLanguage[uiLanguage]
  const [closing, setClosing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [followUpQuestion, setFollowUpQuestion] = useState('')
  const [sendingFollowUp, setSendingFollowUp] = useState(false)
  const [followUpMessage, setFollowUpMessage] = useState<string | null>(null)
  const [followUpError, setFollowUpError] = useState<string | null>(null)

  if (isClosed) {
    return (
      <div className="rounded-[1.8rem] border border-[var(--line)] bg-white p-5 shadow-[0_18px_50px_rgba(8,34,55,0.06)]">
        <p className="display-face text-xs font-semibold uppercase tracking-[0.2em] text-[var(--blue)]">
          {copy.closedTitle}
        </p>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          {copy.closedBody}
        </p>
      </div>
    )
  }

  if (!canClose && !allowFollowUp) {
    return null
  }

  async function handleClose() {
    setClosing(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch(
        `/api/public/consultations/status/${encodeURIComponent(lookup)}/close`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        },
      )

      if (!response.ok) {
        setError(copy.closeError)
        return
      }

      setMessage(copy.closeSuccess)
      router.refresh()
      onUpdated?.()
    } catch {
      setError(copy.closeError)
    } finally {
      setClosing(false)
    }
  }

  async function handleFollowUpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!followUpQuestion.trim()) return

    setSendingFollowUp(true)
    setFollowUpError(null)
    setFollowUpMessage(null)

    try {
      const response = await fetch(
        `/api/public/consultations/status/${encodeURIComponent(lookup)}/follow-up`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: followUpQuestion.trim(),
            uiLanguage,
          }),
        },
      )

      if (!response.ok) {
        setFollowUpError(copy.followUpError)
        return
      }

      setFollowUpQuestion('')
      setFollowUpMessage(copy.followUpSuccess)
      router.refresh()
      onUpdated?.()
    } catch {
      setFollowUpError(copy.followUpError)
    } finally {
      setSendingFollowUp(false)
    }
  }

  return (
    <div className="rounded-[1.8rem] border border-[var(--line)] bg-white p-5 shadow-[0_18px_50px_rgba(8,34,55,0.06)]">
      <p className="display-face text-xs font-semibold uppercase tracking-[0.2em] text-[var(--blue)]">
        {copy.title}
      </p>
      <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
        {copy.body}
        {canClose ? ` ${copy.closeBodySuffix}` : ''}
      </p>

      {allowFollowUp ? (
        <form onSubmit={handleFollowUpSubmit} className="mt-4 space-y-3">
          <textarea
            value={followUpQuestion}
            onChange={(event) => setFollowUpQuestion(event.target.value)}
            placeholder={copy.placeholder}
            rows={4}
            disabled={sendingFollowUp}
            className="w-full rounded-[1.2rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm leading-7 text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white"
          />

          <button
            type="submit"
            disabled={sendingFollowUp || !followUpQuestion.trim()}
            className="w-full rounded-[1.2rem] border border-[var(--navy)] bg-white px-5 py-3 text-sm font-semibold text-[var(--navy)] transition hover:bg-[var(--soft-blue)] disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
          >
            {sendingFollowUp ? copy.followUpSending : copy.followUpSubmit}
          </button>
        </form>
      ) : null}

      {canClose ? (
        <button
          type="button"
          onClick={handleClose}
          disabled={closing}
          className="mt-4 w-full rounded-[1.2rem] bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white visited:text-white transition hover:bg-[#123c67] disabled:cursor-not-allowed disabled:bg-slate-400"
          style={{ color: '#ffffff' }}
        >
          {closing ? copy.closeSending : copy.closeSubmit}
        </button>
      ) : null}

      {message ? (
        <p className="mt-4 rounded-[1.2rem] bg-[var(--soft-blue)] px-4 py-3 text-sm leading-7 text-[var(--ink)]">
          {message}
        </p>
      ) : null}

      {followUpMessage ? (
        <p className="mt-4 rounded-[1.2rem] bg-[var(--soft-blue)] px-4 py-3 text-sm leading-7 text-[var(--ink)]">
          {followUpMessage}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-[1.2rem] border border-[#ffd2c5] bg-[#fff6f2] px-4 py-3 text-sm leading-7 text-[#9b5031]">
          {error}
        </p>
      ) : null}

      {followUpError ? (
        <p className="mt-4 rounded-[1.2rem] border border-[#ffd2c5] bg-[#fff6f2] px-4 py-3 text-sm leading-7 text-[#9b5031]">
          {followUpError}
        </p>
      ) : null}
    </div>
  )
}
