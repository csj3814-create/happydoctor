'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'

import type { PublicConsultationStatus } from '@/lib/status'
import type { UiLanguage } from '@/lib/ui-language'
import { getUiLocale } from '@/lib/ui-language'

// The status page showed only the newest doctor reply, so a patient who had
// asked a follow-up could not see what they had asked or what came before it.
// This is the same exchange the clinician sees, from the patient's side.
type ThreadItem = {
  kind: 'patient' | 'doctor'
  at: number
  label: string
  text: string
}

type StatusConversationCopy = {
  conversationTitle: string
  conversationEmpty: string
  submissionLabel: string
  followUpLabel: string
  patientLabel: string
  timeMissing: string
}

function timestampMs(value?: string | null): number {
  if (!value) return 0
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

function formatTime(at: number, uiLanguage: UiLanguage, copy: StatusConversationCopy): string {
  if (!at) return copy.timeMissing
  return new Intl.DateTimeFormat(getUiLocale(uiLanguage), {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  }).format(new Date(at))
}

export function buildStatusThread(
  consultation: PublicConsultationStatus,
  copy: StatusConversationCopy,
): ThreadItem[] {
  const items: ThreadItem[] = []

  const chiefComplaint = (consultation.chiefComplaint || '').trim()
  if (chiefComplaint) {
    items.push({
      kind: 'patient',
      at: timestampMs(consultation.createdAt),
      label: copy.submissionLabel,
      text: chiefComplaint,
    })
  }

  ;(consultation.patientQuestions ?? []).forEach((entry) => {
    const text = (entry.question || '').trim()
    if (!text) return
    items.push({ kind: 'patient', at: timestampMs(entry.createdAt), label: copy.followUpLabel, text })
  })

  ;(consultation.doctorReplies ?? []).forEach((reply) => {
    items.push({
      kind: 'doctor',
      at: timestampMs(reply.createdAt),
      label: reply.doctorName,
      text: reply.message,
    })
  })

  return items.sort((a, b) => a.at - b.at)
}

export default function StatusConversation({
  consultation,
  uiLanguage,
  copy,
  composer,
}: {
  consultation: PublicConsultationStatus
  uiLanguage: UiLanguage
  copy: StatusConversationCopy
  // Rendered under the thread, where a messenger keeps the place to write.
  composer?: ReactNode
}) {
  const items = buildStatusThread(consultation, copy)
  const listRef = useRef<HTMLOListElement | null>(null)

  // A messenger opens on the newest message, not the oldest.
  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [items.length])

  return (
    <div className="rounded-[1.8rem] border border-[var(--line)] bg-white p-5 shadow-[0_18px_50px_rgba(8,34,55,0.06)]">
      <p className="display-face text-xs font-semibold uppercase tracking-[0.2em] text-[var(--blue)]">
        {copy.conversationTitle}
      </p>

      {items.length === 0 ? (
        <p className="mt-4 rounded-[1.4rem] bg-[var(--surface)] p-4 text-sm leading-7 text-[var(--muted)]">
          {copy.conversationEmpty}
        </p>
      ) : (
        <ol ref={listRef} className="mt-4 flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1">
          {items.map((item, index) => (
            <li
              key={`${item.kind}-${index}`}
              className={`flex flex-col ${item.kind === 'patient' ? 'items-end' : 'items-start'}`}
            >
              <div className="mb-1 flex items-center gap-2 text-[11px] text-[var(--muted)]">
                <span className="font-semibold">
                  {item.kind === 'patient' ? copy.patientLabel : item.label}
                </span>
                {item.kind === 'patient' ? <span>{item.label}</span> : null}
                <span>{formatTime(item.at, uiLanguage, copy)}</span>
              </div>
              <div
                className={`max-w-[88%] px-4 py-3 text-sm leading-7 ${
                  item.kind === 'patient'
                    ? 'rounded-[1.4rem] rounded-tr-sm bg-[var(--sky)] text-[var(--ink)]'
                    : 'rounded-[1.4rem] rounded-tl-sm bg-[var(--surface)] text-[var(--ink)]'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {composer ? <div className="mt-4 border-t border-[var(--line)] pt-4">{composer}</div> : null}
    </div>
  )
}
