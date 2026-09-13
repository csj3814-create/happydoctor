'use client'

import { useEffect, useState } from 'react'

import { AiDoctorSummary } from '@/lib/api'

function formatGeneratedAt(iso: string): string {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  })
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // The async API refuses outside a secure context or without permission.
    // Fall through to the legacy path rather than losing the copy entirely.
  }

  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(area)
    return copied
  } catch {
    return false
  }
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    if (state === 'idle') return undefined
    const timer = window.setTimeout(() => setState('idle'), 2000)
    return () => window.clearTimeout(timer)
  }, [state])

  return (
    <button
      type="button"
      onClick={async () => setState((await copyToClipboard(text)) ? 'copied' : 'failed')}
      className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 active:scale-[0.98]"
    >
      {state === 'copied' ? '복사됨' : state === 'failed' ? '복사 실패' : label}
    </button>
  )
}

// Doctor-facing draft output. Rendered only inside the authenticated portal and
// never sent anywhere on its own: the clinician has to put it in the reply form
// and press send, exactly as with text they wrote themselves.
export function AiDoctorSummarySection({
  summary,
  onUseDraft,
  canUseDraft,
}: {
  summary: AiDoctorSummary
  onUseDraft: (draft: string) => void
  canUseDraft: boolean
}) {
  const soap = summary.text?.trim() || ''
  const replyDraft = summary.replyDraft?.trim() || ''

  if (summary.status === 'failed' || (!soap && !replyDraft)) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white px-5 py-5 shadow-sm">
        <h2 className="mb-2 text-sm font-bold text-zinc-800">보듬이 정리</h2>
        <p className="text-sm text-zinc-500">
          이번 상담은 보듬이 정리를 만들지 못했습니다. 환자 입력과 SOAP 차트를 직접 확인해 주세요.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-zinc-800">보듬이 정리 (의료진 전용)</h2>
          <p className="mt-1 text-xs text-amber-800">
            {summary.disclaimer || 'AI가 환자 입력만으로 정리한 초안입니다. 진단·처방이 아니며 의료진 검토가 필요합니다.'}
          </p>
        </div>
        {summary.generatedAt ? (
          <p className="text-xs text-amber-700">
            {formatGeneratedAt(summary.generatedAt)}
            {summary.model ? ` · ${summary.model}` : ''}
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        {soap ? (
          <div className="rounded-xl border border-amber-200 bg-white px-4 py-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">SOAP 정리</p>
              <CopyButton text={soap} label="복사" />
            </div>
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-zinc-700">
              {soap}
            </pre>
          </div>
        ) : null}

        {replyDraft ? (
          <div className="rounded-xl border border-amber-200 bg-white px-4 py-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">환자 답변 초안</p>
              <div className="flex flex-wrap items-center gap-2">
                <CopyButton text={replyDraft} label="복사" />
                <button
                  type="button"
                  onClick={() => onUseDraft(replyDraft)}
                  disabled={!canUseDraft}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  답변란에 넣기
                </button>
              </div>
            </div>
            <p className="mb-3 text-xs text-amber-800">
              {summary.replyDraftDisclaimer || '의료진 검토 전에는 환자에게 전달되지 않습니다. 확인 후 수정하여 보내 주세요.'}
            </p>
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-zinc-700">
              {replyDraft}
            </pre>
          </div>
        ) : null}
      </div>
    </section>
  )
}
