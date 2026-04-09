/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { auth, firebaseConfigError } from '@/lib/firebase'
import { Consultation, FollowUpLog, getConsultation, getConsultations, postReply } from '@/lib/api'

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function genderLabel(gender: string): string {
  if (gender === 'male' || gender === 'M' || gender === '남') return '남성'
  if (gender === 'female' || gender === 'F' || gender === '여') return '여성'
  return gender
}

function timestampMs(value?: string | null): number {
  if (!value) return 0
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

function latestFollowUpTimestampMs(logs: FollowUpLog[] = []): number {
  return logs
    .map((log) => timestampMs(log.timestamp))
    .reduce((latest, current) => Math.max(latest, current), 0)
}

function hasPendingFollowUp(consultation: Consultation): boolean {
  const latestFollowUp = latestFollowUpTimestampMs(consultation.followUpLogs ?? [])
  if (!latestFollowUp) return false
  return latestFollowUp > timestampMs(consultation.doctorRepliedAt)
}

function LabelValue({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-sm leading-6">
      <span className="w-24 shrink-0 font-medium text-zinc-500">{label}</span>
      <span className="text-zinc-800">{value}</span>
    </div>
  )
}

function statusMeta(consultation: Consultation) {
  if (consultation.status === 'COMPLETED' || consultation.closedAt) {
    return {
      label: '상담 종료',
      badgeClass: 'bg-zinc-100 text-zinc-600',
      cardClass: 'border-zinc-200 bg-zinc-50',
      description: consultation.closeReason || '상담이 종료된 상태입니다.',
    }
  }

  if (hasPendingFollowUp(consultation)) {
    return {
      label: 'Follow-up',
      badgeClass: 'bg-amber-100 text-amber-800',
      cardClass: 'border-amber-200 bg-amber-50',
      description: '최근 follow-up 이후 아직 새 의료진 답변이 없는 상태입니다.',
    }
  }

  if (consultation.doctorRepliedAt) {
    return {
      label: '답변 완료',
      badgeClass: 'bg-green-100 text-green-700',
      cardClass: 'border-green-200 bg-green-50',
      description: '의료진 답변이 환자에게 전달된 상태입니다.',
    }
  }

  return {
    label: '답변 대기',
    badgeClass: 'bg-amber-100 text-amber-700',
    cardClass: 'border-amber-200 bg-amber-50',
    description: '의료진 직접 회신이 필요한 상태입니다.',
  }
}

function followUpActionLabel(action?: string): string {
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

function FollowUpItem({ log, index }: { log: FollowUpLog; index: number }) {
  return (
    <li className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-semibold text-white">
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-zinc-800">
            {followUpActionLabel(log.action)}
          </span>
        </div>
        <span className="text-xs text-zinc-400">
          {log.timestamp ? formatDate(log.timestamp) : '시각 정보 없음'}
        </span>
      </div>
      {log.alertMessage && (
        <pre className="mt-3 whitespace-pre-wrap break-words rounded-xl border border-zinc-200 bg-white p-3 text-sm leading-relaxed text-zinc-700">
          {log.alertMessage}
        </pre>
      )}
    </li>
  )
}

function SummaryCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: string
  hint: string
  tone?: 'default' | 'accent'
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-4 ${
        tone === 'accent'
          ? 'border-blue-200 bg-blue-50'
          : 'border-zinc-200 bg-white'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">{label}</p>
      <p className="mt-2 text-base font-semibold text-zinc-900">{value}</p>
      <p className="mt-1 text-sm text-zinc-500">{hint}</p>
    </div>
  )
}

interface PatientPageProps {
  params: Promise<{ id: string }>
}

export default function PatientPage({ params }: PatientPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [fetchLoading, setFetchLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [patientId, setPatientId] = useState<string | null>(null)

  // Resolve params (Promise in Next.js 16+)
  useEffect(() => {
    params.then((p) => setPatientId(p.id))
  }, [params])

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false)
      setFetchError(firebaseConfigError)
      router.replace('/')
      return
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthLoading(false)
      if (!u) {
        router.replace('/')
      }
    })
    return unsubscribe
  }, [router])

  useEffect(() => {
    if (!user || !patientId) return
    let cancelled = false
    const fallbackUserId = searchParams.get('userId')

    async function loadConsultation() {
      setFetchLoading(true)
      setFetchError(null)
      setFallbackNotice(null)

      const candidateIds = Array.from(new Set([patientId, fallbackUserId].filter(Boolean))) as string[]

      for (const candidateId of candidateIds) {
        try {
          const data = await getConsultation(candidateId)
          if (cancelled) return
          setConsultation(data)
          setFetchLoading(false)
          return
        } catch (err) {
          const message = err instanceof Error ? err.message : '상담 정보를 불러오지 못했습니다.'
          if (message !== '상담을 찾을 수 없습니다.') {
            if (cancelled) return
            setFetchError(message)
            setFetchLoading(false)
            return
          }
        }
      }

      try {
        const consultationList = await getConsultations()
        if (cancelled) return

        const fallback = consultationList.find((item) => item.id === patientId)
          || (fallbackUserId ? consultationList.find((item) => item.userId === fallbackUserId) : undefined)
          || consultationList.find((item) => item.userId === patientId)

        if (!fallback) {
          setFetchError('상담을 찾을 수 없습니다.')
          setFetchLoading(false)
          return
        }

        setConsultation(fallback)
        setFallbackNotice('상세 회신 이력은 아직 불러오지 못했지만, 기본 상담 정보는 먼저 표시하고 있습니다.')
        setFetchLoading(false)
      } catch (err) {
        if (cancelled) return
        setFetchError(err instanceof Error ? err.message : '상담 정보를 불러오지 못했습니다.')
        setFetchLoading(false)
      }
    }

    loadConsultation()

    return () => {
      cancelled = true
    }
  }, [user, patientId, searchParams])

  const derivedState = useMemo(() => {
    if (!consultation) {
      return {
        followUpLogs: [] as FollowUpLog[],
        doctorReplies: [],
        seenReplies: 0,
        unseenReplies: 0,
        closed: false,
        status: statusMeta({
          id: '',
          userId: '',
          patientData: { age: '', gender: '', cc: '', nrs: '', symptom: '', associated: '', pmhx: '' },
          aiAction: '',
          doctorChart: '',
          chatbotReply: '',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        }),
      }
    }

    const doctorReplies = consultation.doctorReplies ?? []
    const followUpLogs = consultation.followUpLogs ?? []
    const seenReplies = doctorReplies.filter((reply) => reply.seen).length

    return {
      followUpLogs,
      doctorReplies,
      seenReplies,
      unseenReplies: doctorReplies.length - seenReplies,
      closed: consultation.status === 'COMPLETED' || Boolean(consultation.closedAt),
      status: statusMeta(consultation),
    }
  }, [consultation])
  const mediaItems = consultation?.mediaItems ?? []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!patientId || !replyText.trim() || derivedState.closed || fallbackNotice) return
    setSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)
    try {
      await postReply(patientId, replyText.trim())
      setReplyText('')
      setSubmitSuccess(true)
      // Refresh consultation to show new reply
      const updated = await getConsultation(patientId)
      setConsultation(updated)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '전송에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-zinc-50">
        <p className="text-zinc-500 text-sm">인증 확인 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-zinc-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
          >
            &larr; 목록으로
          </Link>
          <h1 className="text-sm font-semibold text-zinc-800">환자 상세</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">
        {fetchLoading && (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-zinc-400">불러오는 중...</p>
          </div>
        )}

        {fetchError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {fetchError}
          </div>
        )}

        {fallbackNotice && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {fallbackNotice}
          </div>
        )}

        {consultation && (
          <>
            {/* Patient Data Card */}
            <section className={`rounded-2xl border shadow-sm px-5 py-5 ${derivedState.status.cardClass}`}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">상담 요약</p>
                    <h2 className="mt-2 text-lg font-semibold text-zinc-900">
                      {consultation.patientData.age}세 / {genderLabel(consultation.patientData.gender)} 환자
                    </h2>
                    <p className="mt-1 text-sm text-zinc-600">{derivedState.status.description}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${derivedState.status.badgeClass}`}>
                    {derivedState.status.label}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <SummaryCard
                    label="접수 시각"
                    value={formatDate(consultation.createdAt)}
                    hint="포털에서 확인 중인 접수 기준입니다."
                    tone="accent"
                  />
                  <SummaryCard
                    label="마지막 의사 답변"
                    value={consultation.doctorRepliedAt ? formatDate(consultation.doctorRepliedAt) : '아직 없음'}
                    hint={consultation.doctorRepliedAt ? '가장 최근 의료진 회신 시각입니다.' : '의료진 직접 답변이 아직 없습니다.'}
                  />
                  <SummaryCard
                    label="환자 확인 상태"
                    value={
                      derivedState.doctorReplies.length === 0
                        ? '답변 없음'
                        : derivedState.unseenReplies > 0
                          ? `미확인 ${derivedState.unseenReplies}건`
                          : '모든 답변 확인'
                    }
                    hint={
                      derivedState.doctorReplies.length === 0
                        ? '회신 후 읽음 여부가 누적됩니다.'
                        : `읽음 ${derivedState.seenReplies}건 / 전체 ${derivedState.doctorReplies.length}건`
                    }
                  />
                  <SummaryCard
                    label="Follow-up 기록"
                    value={derivedState.followUpLogs.length > 0 ? `${derivedState.followUpLogs.length}건` : '없음'}
                    hint={derivedState.followUpLogs.length > 0 ? '추가 문진 및 재분석 로그입니다.' : '추가 문진 로그가 아직 없습니다.'}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-white border border-zinc-200 shadow-sm px-5 py-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-zinc-800">환자 정보</h2>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    ESCALATE
                  </span>
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${derivedState.status.badgeClass}`}>
                    {derivedState.status.label}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <LabelValue label="나이 / 성별" value={`${consultation.patientData.age}세 / ${genderLabel(consultation.patientData.gender)}`} />
                <LabelValue label="주소 (CC)" value={consultation.patientData.cc} />
                <LabelValue label="통증 NRS" value={consultation.patientData.nrs} />
                <LabelValue label="증상 양상" value={consultation.patientData.symptom} />
                <LabelValue label="동반 증상" value={consultation.patientData.associated} />
                <LabelValue label="과거력" value={consultation.patientData.pmhx} />
                <LabelValue label="접수 시각" value={formatDate(consultation.createdAt)} />
                {consultation.patientNotificationContact?.consented && (
                  <LabelValue
                    label="알림 동의 연락처"
                    value={consultation.patientNotificationContact.phone}
                  />
                )}
                {consultation.patientNotificationContact?.consentedAt && (
                  <LabelValue
                    label="알림 동의 시각"
                    value={formatDate(consultation.patientNotificationContact.consentedAt)}
                  />
                )}
                {consultation.closedAt && (
                  <LabelValue label="종료 시각" value={formatDate(consultation.closedAt)} />
                )}
                {consultation.closeReason && (
                  <LabelValue label="종료 사유" value={consultation.closeReason} />
                )}
              </div>
            </section>

            {mediaItems.length > 0 && (
              <section className="rounded-2xl bg-white border border-zinc-200 shadow-sm px-5 py-5">
                <h2 className="text-sm font-bold text-zinc-800 mb-3">첨부 사진</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {mediaItems
                    .filter((item) => item.kind === 'image' && item.url)
                    .map((item) => (
                      <a
                        key={item.id || item.url}
                        href={item.url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50"
                      >
                        <img
                          src={item.url || ''}
                          alt={item.originalName || '상담 첨부 사진'}
                          className="h-56 w-full object-cover"
                        />
                        <div className="px-4 py-3 text-xs text-zinc-500">
                          {item.createdAt ? formatDate(item.createdAt) : '등록 시각 없음'}
                        </div>
                      </a>
                    ))}
                </div>
              </section>
            )}

            {/* SOAP Chart Card */}
            {consultation.doctorChart && (
              <section className="rounded-2xl bg-white border border-zinc-200 shadow-sm px-5 py-5">
                <h2 className="text-sm font-bold text-zinc-800 mb-3">SOAP 차트</h2>
                <pre className="whitespace-pre-wrap break-words text-sm text-zinc-700 font-mono leading-relaxed bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                  {consultation.doctorChart}
                </pre>
              </section>
            )}

            {/* Chatbot Reply */}
            {consultation.chatbotReply && (
              <section className="rounded-2xl bg-white border border-zinc-200 shadow-sm px-5 py-5">
                <h2 className="text-sm font-bold text-zinc-800 mb-3">챗봇 응답</h2>
                <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
                  {consultation.chatbotReply}
                </p>
              </section>
            )}

            {/* Follow-up History */}
            <section className="rounded-2xl bg-white border border-zinc-200 shadow-sm px-5 py-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-zinc-800">Follow-up 기록</h2>
                  <p className="mt-1 text-xs text-zinc-400">추가 문진, 재분석, 알림 메시지 흐름을 한 번에 확인할 수 있습니다.</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500">
                  {derivedState.followUpLogs.length}건
                </span>
              </div>

              {derivedState.followUpLogs.length === 0 ? (
                <p className="text-sm text-zinc-400">추가 follow-up 기록이 없습니다.</p>
              ) : (
                <ol className="flex flex-col gap-3">
                  {derivedState.followUpLogs.map((log, index) => (
                    <FollowUpItem
                      key={`${log.timestamp || 'follow-up'}-${index}`}
                      log={log}
                      index={index}
                    />
                  ))}
                </ol>
              )}
            </section>

            {/* Doctor Reply History */}
            <section className="rounded-2xl bg-white border border-zinc-200 shadow-sm px-5 py-5">
              <h2 className="text-sm font-bold text-zinc-800 mb-4">
                답변 내역
                {consultation.doctorReplies && consultation.doctorReplies.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-zinc-400">
                    {consultation.doctorReplies.length}건
                  </span>
                )}
              </h2>

              {!consultation.doctorReplies || consultation.doctorReplies.length === 0 ? (
                <p className="text-sm text-zinc-400">아직 답변이 없습니다.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {consultation.doctorReplies.map((reply) => (
                    <li
                      key={reply.id}
                      className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-blue-700">
                          {reply.doctorName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              reply.seen
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {reply.seen
                              ? reply.seenAt
                                ? `읽음 ${formatDate(reply.seenAt)}`
                                : '읽음'
                              : '미확인'}
                          </span>
                          <span className="text-xs text-zinc-400">
                            {formatDate(reply.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
                        {reply.message}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Reply Form */}
            <section className="rounded-2xl bg-white border border-zinc-200 shadow-sm px-5 py-5">
              <div className="mb-4 flex flex-col gap-1">
                <h2 className="text-sm font-bold text-zinc-800">답변 전송</h2>
                {derivedState.closed && (
                  <p className="text-xs text-zinc-500">
                    종료된 상담은 추가 회신을 보낼 수 없습니다.
                  </p>
                )}
                {!derivedState.closed && fallbackNotice && (
                  <p className="text-xs text-zinc-500">
                    상세 데이터 동기화가 완료되면 답변 전송을 다시 사용할 수 있습니다.
                  </p>
                )}
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    derivedState.closed
                      ? '종료된 상담입니다.'
                      : fallbackNotice
                        ? '상세 데이터 동기화 후 답변 전송을 사용할 수 있습니다.'
                      : '환자에게 전달할 답변을 입력하세요...'
                  }
                  rows={5}
                  disabled={submitting || derivedState.closed || Boolean(fallbackNotice)}
                  className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:outline-none transition disabled:opacity-50"
                />

                {submitError && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                    {submitError}
                  </p>
                )}

                {submitSuccess && (
                  <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                    답변이 전송되었습니다.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !replyText.trim() || derivedState.closed || Boolean(fallbackNotice)}
                  className="self-end rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '전송 중...' : '환자에게 전송'}
                </button>
              </form>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
