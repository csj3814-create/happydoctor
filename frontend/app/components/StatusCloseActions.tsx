'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { UiLanguage } from '@/lib/ui-language'

type StatusCloseActionsProps = {
  lookup: string
  canClose: boolean
  isClosed: boolean
  uiLanguage: UiLanguage
  // Rendered inside the conversation card, under the message box, so it drops
  // the card chrome and the explanation that would repeat what is on screen.
  compact?: boolean
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
    followUpSubmit: '전송',
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
    followUpSending: 'Sending...',
    followUpSubmit: 'Send',
    closeSending: 'Closing the consultation...',
    closeSubmit: 'Close consultation',
    closeSuccess: 'This consultation is now closed. Please start a new one if you need more help.',
    closeError: 'We could not close the consultation right now. Please try again shortly.',
    followUpSuccess:
      'Your follow-up question was sent to the doctors. You can check this page again when a reply is ready.',
    followUpError: 'We could not send your follow-up question right now. Please try again shortly.',
  },
} as const

type StatusFollowUpComposerProps = {
  lookup: string
  uiLanguage: UiLanguage
  onUpdated?: () => void
}

// Sits at the bottom of the conversation, where the place to write a message
// is in every messenger the patient already uses. It used to live in a
// separate card beside the thread, which read as a form rather than a reply.
export function StatusFollowUpComposer({
  lookup,
  uiLanguage,
  onUpdated,
}: StatusFollowUpComposerProps) {
  const router = useRouter()
  const copy = copyByLanguage[uiLanguage]
  const [question, setQuestion] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!question.trim()) return

    setSending(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/public/consultations/status/follow-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Consultation-Lookup': lookup,
        },
        body: JSON.stringify({ question: question.trim(), uiLanguage }),
      })

      if (!response.ok) {
        setError(copy.followUpError)
        return
      }

      setQuestion('')
      setMessage(copy.followUpSuccess)
      router.refresh()
      onUpdated?.()
    } catch {
      setError(copy.followUpError)
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      {/* Side by side at every width. The button carries a one-word label, so
          it stays narrow enough to leave the box usable on a phone. */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={copy.placeholder}
          rows={2}
          disabled={sending}
          className="min-h-[3.5rem] flex-1 resize-none rounded-[1.2rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm leading-6 text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white"
        />
        <button
          type="submit"
          disabled={sending || !question.trim()}
          className="shrink-0 rounded-[1.1rem] bg-[var(--navy)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#123c67] disabled:cursor-not-allowed disabled:bg-slate-400"
          style={{ color: '#ffffff' }}
        >
          {sending ? copy.followUpSending : copy.followUpSubmit}
        </button>
      </form>

      {message ? (
        <p className="mt-3 rounded-[1.2rem] bg-[var(--soft-blue)] px-4 py-3 text-sm leading-7 text-[var(--ink)]">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-[1.2rem] border border-[#ffd2c5] bg-[#fff6f2] px-4 py-3 text-sm leading-7 text-[#9b5031]">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default function StatusCloseActions({
  lookup,
  canClose,
  isClosed,
  uiLanguage,
  compact = false,
  onUpdated,
}: StatusCloseActionsProps) {
  const router = useRouter()
  const copy = copyByLanguage[uiLanguage]
  const [closing, setClosing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (isClosed) {
    if (compact) {
      return <p className="text-sm leading-7 text-[var(--muted)]">{copy.closedBody}</p>
    }

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

  if (!canClose) {
    return null
  }

  async function handleClose() {
    setClosing(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch(
        '/api/public/consultations/status/close',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Consultation-Lookup': lookup,
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

  const closeButton = (
    <button
      type="button"
      onClick={handleClose}
      disabled={closing}
      className="w-full rounded-[1.2rem] bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white visited:text-white transition hover:bg-[#123c67] disabled:cursor-not-allowed disabled:bg-slate-400"
      style={{ color: '#ffffff' }}
    >
      {closing ? copy.closeSending : copy.closeSubmit}
    </button>
  )

  if (compact) {
    return (
      <div>
        {canClose ? closeButton : null}

        {message ? (
          <p className="mt-3 rounded-[1.2rem] bg-[var(--soft-blue)] px-4 py-3 text-sm leading-7 text-[var(--ink)]">
            {message}
          </p>
        ) : null}

        {error ? (
          <p className="mt-3 rounded-[1.2rem] border border-[#ffd2c5] bg-[#fff6f2] px-4 py-3 text-sm leading-7 text-[#9b5031]">
            {error}
          </p>
        ) : null}
      </div>
    )
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

      {error ? (
        <p className="mt-4 rounded-[1.2rem] border border-[#ffd2c5] bg-[#fff6f2] px-4 py-3 text-sm leading-7 text-[#9b5031]">
          {error}
        </p>
      ) : null}
    </div>
  )
}
