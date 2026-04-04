'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type StatusCloseActionsProps = {
  lookup: string
  canClose: boolean
  isClosed: boolean
}

export default function StatusCloseActions({
  lookup,
  canClose,
  isClosed,
}: StatusCloseActionsProps) {
  const router = useRouter()
  const [closing, setClosing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (isClosed) {
    return (
      <div className="rounded-[1.8rem] border border-[var(--line)] bg-white p-5 shadow-[0_18px_50px_rgba(8,34,55,0.06)]">
        <p className="display-face text-xs font-semibold uppercase tracking-[0.2em] text-[var(--blue)]">
          상담 상태
        </p>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          이 상담은 이미 종료되었습니다. 다시 도움이 필요하면 새 상담을 시작해 주세요.
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
        `/api/public/consultations/status/${encodeURIComponent(lookup)}/close`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason: '답변 확인 후 종료',
          }),
        },
      )

      const payload = (await response.json()) as { error?: string }
      if (!response.ok) {
        setError(payload.error || '상담을 종료하지 못했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }

      setMessage('상담을 종료했습니다. 다시 도움이 필요하면 새 상담을 시작해 주세요.')
      router.refresh()
    } catch {
      setError('상담을 종료하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setClosing(false)
    }
  }

  return (
    <div className="rounded-[1.8rem] border border-[var(--line)] bg-white p-5 shadow-[0_18px_50px_rgba(8,34,55,0.06)]">
      <p className="display-face text-xs font-semibold uppercase tracking-[0.2em] text-[var(--blue)]">
        다음 행동
      </p>
      <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
        의료진 답변을 확인하셨다면 여기서 상담을 마무리할 수 있습니다.
      </p>

      <button
        type="button"
        onClick={handleClose}
        disabled={closing}
        className="mt-4 w-full rounded-[1.2rem] bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white visited:text-white transition hover:bg-[#123c67] disabled:cursor-not-allowed disabled:bg-slate-400"
        style={{ color: '#ffffff' }}
      >
        {closing ? '상담을 종료하고 있습니다...' : '답변 확인 후 상담 종료'}
      </button>

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
