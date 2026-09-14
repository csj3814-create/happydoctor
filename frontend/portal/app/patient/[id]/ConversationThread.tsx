'use client'

import type { Consultation, FollowUpLog } from '@/lib/api'

// The patient's questions and the doctor's replies were two separate lists on
// this page, so reading the exchange meant jumping between them and matching
// timestamps by eye. They are one conversation; this shows them as one.
type ThreadItem =
  | { kind: 'patient'; at: number; label: string; text: string }
  | {
      kind: 'doctor'
      at: number
      text: string
      doctorName: string
      seen: boolean
      seenAt?: string | null
      delivered?: string | null
      deliveredLanguage?: string | null
    }
  | { kind: 'system'; at: number; label: string; text?: string }

function timestampMs(value?: string | null): number {
  if (!value) return 0
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

function formatDateTime(value: number): string {
  if (!value) return '시각 정보 없음'
  return new Date(value).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  })
}

function systemLabel(action?: string): string {
  switch (action) {
    case 'ESCALATE':
      return '의료진 검토 유지'
    case 'FOLLOW_UP':
      return '추가 문진 진행'
    case 'AUTO_CLOSE':
      return '자동 종료'
    case 'COMPLETE':
      return '상담 정리'
    default:
      return action || '기록'
  }
}

export function buildThread(consultation: Consultation): ThreadItem[] {
  const items: ThreadItem[] = []

  const chiefComplaint = (
    consultation.translatedPatientDataKo?.cc || consultation.patientData?.cc || ''
  ).trim()
  if (chiefComplaint) {
    items.push({
      kind: 'patient',
      at: timestampMs(consultation.createdAt),
      label: '상담 접수',
      text: chiefComplaint,
    })
  }

  const logs: FollowUpLog[] = consultation.followUpLogs ?? []
  logs.forEach((log) => {
    const at = timestampMs(log.timestamp)
    if (log.action === 'PATIENT_FOLLOW_UP_QUESTION') {
      const text = (log.alertMessage || '').trim()
      if (text) items.push({ kind: 'patient', at, label: '추가 질문', text })
      return
    }

    // Kept rather than dropped: an auto-close or a re-analysis explains a gap
    // in the conversation that would otherwise look like silence.
    items.push({ kind: 'system', at, label: systemLabel(log.action), text: (log.alertMessage || '').trim() })
  })

  ;(consultation.doctorReplies ?? []).forEach((reply) => {
    items.push({
      kind: 'doctor',
      at: timestampMs(reply.createdAt),
      text: reply.message,
      doctorName: reply.doctorName,
      seen: reply.seen,
      seenAt: reply.seenAt,
      delivered: reply.patientDeliveredMessage,
      deliveredLanguage: reply.patientDeliveredLanguage,
    })
  })

  return items.sort((a, b) => a.at - b.at)
}

function languageLabel(language?: string | null): string {
  switch ((language || '').trim().toLowerCase()) {
    case 'ko': return '한국어'
    case 'en': return '영어'
    case 'vi': return '베트남어'
    case 'zh-cn': case 'zh': return '중국어 간체'
    case 'zh-tw': return '중국어 번체'
    case 'ja': return '일본어'
    case 'mn': return '몽골어'
    case 'ru': return '러시아어'
    case 'th': return '태국어'
    case 'tl': case 'fil': return '타갈로그어'
    default: return language?.trim() || '미상'
  }
}

export default function ConversationThread({ consultation }: { consultation: Consultation }) {
  const items = buildThread(consultation)

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white px-5 py-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-zinc-800">대화 내역</h2>
          <p className="mt-1 text-xs text-zinc-400">환자 질문과 의료진 답변을 시간 순서대로 보여줍니다.</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500">
          {items.length}건
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-400">아직 주고받은 내용이 없습니다.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {items.map((item, index) => {
            if (item.kind === 'system') {
              return (
                <li key={`system-${index}`} className="flex justify-center">
                  <div className="max-w-[85%] rounded-full bg-zinc-100 px-3 py-1 text-center text-[11px] text-zinc-500">
                    {item.label}
                    {item.text ? ` · ${item.text.slice(0, 60)}` : ''}
                    {` · ${formatDateTime(item.at)}`}
                  </div>
                </li>
              )
            }

            if (item.kind === 'patient') {
              return (
                <li key={`patient-${index}`} className="flex flex-col items-start">
                  <div className="mb-1 flex items-center gap-2 text-[11px] text-zinc-400">
                    <span className="font-semibold text-zinc-500">환자</span>
                    <span>{item.label}</span>
                    <span>{formatDateTime(item.at)}</span>
                  </div>
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-zinc-200 bg-zinc-50 px-4 py-3">
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-800">
                      {item.text}
                    </p>
                  </div>
                </li>
              )
            }

            return (
              <li key={`doctor-${index}`} className="flex flex-col items-end">
                <div className="mb-1 flex items-center gap-2 text-[11px] text-zinc-400">
                  <span className="font-semibold text-blue-700">{item.doctorName}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium ${
                      item.seen ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {item.seen ? (item.seenAt ? `읽음 ${formatDateTime(timestampMs(item.seenAt))}` : '읽음') : '미확인'}
                  </span>
                  <span>{formatDateTime(item.at)}</span>
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm border border-blue-100 bg-blue-50 px-4 py-3">
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-800">
                    {item.text}
                  </p>
                  {item.delivered && item.delivered !== item.text ? (
                    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                        환자에게 전달된 번역본 ({languageLabel(item.deliveredLanguage)})
                      </p>
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-700">
                        {item.delivered}
                      </p>
                    </div>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
