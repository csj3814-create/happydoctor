/* eslint-disable @next/next/no-img-element */
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import ConsultationImageUploader from '@/components/ConsultationImageUploader'
import StatusCloseActions from '@/components/StatusCloseActions'
import {
  getActiveConsultationSession,
  saveActiveConsultationSession,
} from '@/lib/consultation-session'
import {
  PublicConsultationStatus,
  fetchConsultationStatus,
  normalizeStatusLookup,
} from '@/lib/status'

const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Seoul',
})

const LIVE_STATUS_POLL_INTERVAL_MS = 15 * 1000
const STATUS_LOADING_NOTICE_MIN_INTERVAL_MS = 60 * 1000
const STATUS_LOADING_NOTICE_VISIBLE_MS = 4 * 1000

function formatDateTime(value: string | null) {
  if (!value) return '아직 기록이 없습니다.'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '시간 정보를 불러올 수 없습니다.'
  }

  return timeFormatter.format(parsed)
}

function getStatusCopy(status: PublicConsultationStatus) {
  switch (status.status) {
    case 'doctor_replied':
      return {
        badge: '답변 도착',
        title: '의료진 답변이 도착했습니다',
        body: '아래 최신 답변을 확인한 뒤 상담을 이어가거나 종료할 수 있습니다.',
      }
    case 'waiting_doctor':
      return {
        badge: '확인 대기',
        title: '의료진이 확인 중입니다',
        body: '보듬이가 정리한 내용을 바탕으로 순서대로 확인하고 있습니다.',
      }
    case 'closed':
      return {
        badge: '상담 종료',
        title: '이 상담은 종료되었습니다',
        body: '필요하면 새 상담을 다시 시작해 주세요.',
      }
    default:
      return {
        badge: '상담 진행 중',
        title: '상담 안내가 먼저 전달된 상태입니다',
        body: '기본 안내가 먼저 전달되었고, 필요하면 같은 흐름 안에서 추가 답변이 이어질 수 있습니다.',
      }
    }
}

function getLatestUpdate(status: PublicConsultationStatus) {
  if (status.doctorRepliedAt) return formatDateTime(status.doctorRepliedAt)
  if (status.latestFollowUpAt) return formatDateTime(status.latestFollowUpAt)
  if (status.requiresDoctorReview) return '의료진 확인 대기 중'
  return '기본 안내 전달'
}

export default function StatusPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const rawLookup = useMemo(() => {
    return (
      searchParams.get('lookup')
      || searchParams.get('code')
      || searchParams.get('token')
      || ''
    )
  }, [searchParams])

  const [lookupValue, setLookupValue] = useState(rawLookup)
  const [resolvedLookup, setResolvedLookup] = useState<string | null>(null)
  const [consultation, setConsultation] = useState<PublicConsultationStatus | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [restoredRecentSession, setRestoredRecentSession] = useState(false)
  const [checkingStoredSession, setCheckingStoredSession] = useState(true)
  const [liveUpdateMessage, setLiveUpdateMessage] = useState<string | null>(null)
  const [sessionChatbotReply, setSessionChatbotReply] = useState<string | null>(null)
  const [showBackgroundLoadingNotice, setShowBackgroundLoadingNotice] = useState(false)
  const latestReplyIdRef = useRef<string | null>(null)
  const replyBaselineReadyRef = useRef(false)
  const latestConsultationRef = useRef<PublicConsultationStatus | null>(null)
  const lastLoadingNoticeAtRef = useRef(0)
  const loadingNoticeTimeoutRef = useRef<number | null>(null)

  function queueBackgroundLoadingNotice() {
    if (typeof window === 'undefined') return

    const now = Date.now()
    if (now - lastLoadingNoticeAtRef.current < STATUS_LOADING_NOTICE_MIN_INTERVAL_MS) {
      return
    }

    lastLoadingNoticeAtRef.current = now
    setShowBackgroundLoadingNotice(true)

    if (loadingNoticeTimeoutRef.current) {
      window.clearTimeout(loadingNoticeTimeoutRef.current)
    }

    loadingNoticeTimeoutRef.current = window.setTimeout(() => {
      setShowBackgroundLoadingNotice(false)
      loadingNoticeTimeoutRef.current = null
    }, STATUS_LOADING_NOTICE_VISIBLE_MS)
  }

  useEffect(() => {
    setLookupValue(rawLookup)
  }, [rawLookup])

  useEffect(() => {
    latestConsultationRef.current = consultation
  }, [consultation])

  useEffect(() => {
    return () => {
      if (loadingNoticeTimeoutRef.current && typeof window !== 'undefined') {
        window.clearTimeout(loadingNoticeTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const normalizedLookup = normalizeStatusLookup(rawLookup)
    const recentSession = getActiveConsultationSession()
    const matchedSessionReply =
      recentSession && normalizedLookup && recentSession.lookup === normalizedLookup
        ? recentSession.chatbotReply || null
        : null

    setLiveUpdateMessage(null)
    setSessionChatbotReply(matchedSessionReply)

    if (rawLookup && !normalizedLookup) {
      setResolvedLookup(null)
      setConsultation(null)
      setFetchError('받은 링크 또는 코드를 다시 확인해 주세요.')
      setCheckingStoredSession(false)
      return
    }

    if (normalizedLookup) {
      setResolvedLookup(normalizedLookup)
      setRestoredRecentSession(false)
      setCheckingStoredSession(false)
      return
    }

    if (recentSession?.lookup) {
      setRestoredRecentSession(true)
      setSessionChatbotReply(recentSession.chatbotReply || null)
      setCheckingStoredSession(false)
      router.replace(`/status?lookup=${encodeURIComponent(recentSession.lookup)}`)
      return
    }

    setResolvedLookup(null)
    setConsultation(null)
    setFetchError(null)
    setSessionChatbotReply(null)
    setCheckingStoredSession(false)
  }, [rawLookup, router])

  useEffect(() => {
    if (!resolvedLookup) return

    let cancelled = false
    const activeLookup = resolvedLookup

    async function loadConsultation() {
      const hasVisibleConsultation = Boolean(latestConsultationRef.current)
      if (hasVisibleConsultation) {
        queueBackgroundLoadingNotice()
      } else {
        setLoading(true)
      }
      setFetchError(null)

      try {
        const status = await fetchConsultationStatus(activeLookup)
        if (cancelled) return

        if (!status) {
          if (!hasVisibleConsultation) {
            setConsultation(null)
          setFetchError('상담 상태를 찾지 못했습니다. 받은 링크 또는 코드를 다시 확인해 주세요.')
          }
          return
        }

        setConsultation(status)
        setSessionChatbotReply(status.chatbotReply || null)
        saveActiveConsultationSession({
          consultationId: status.consultationId,
          lookup: activeLookup,
          trackingCode: status.trackingCode,
          statusUrl:
            typeof window !== 'undefined'
              ? `${window.location.origin}/status?lookup=${encodeURIComponent(activeLookup)}`
              : `/status?lookup=${encodeURIComponent(activeLookup)}`,
          chatbotReply: status.chatbotReply,
        })
      } catch {
        if (cancelled) return
        if (!hasVisibleConsultation) {
          setConsultation(null)
        setFetchError('지금은 상태를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
        }
      } finally {
        if (!cancelled && !hasVisibleConsultation) {
          setLoading(false)
        }
      }
    }

    loadConsultation()

    return () => {
      cancelled = true
    }
  }, [resolvedLookup, refreshKey])

  useEffect(() => {
    if (!consultation) {
      latestReplyIdRef.current = null
      replyBaselineReadyRef.current = false
      return
    }

    const latestReplyId =
      consultation.doctorReplies.length > 0
        ? consultation.doctorReplies[consultation.doctorReplies.length - 1]?.id || null
        : null

    if (
      replyBaselineReadyRef.current
      && latestReplyId
      && latestReplyIdRef.current !== latestReplyId
    ) {
      setLiveUpdateMessage('새로운 의료진 답변이 도착했습니다. 아래 최신 답변을 확인해 주세요.')
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }

    latestReplyIdRef.current = latestReplyId
    replyBaselineReadyRef.current = true
  }, [consultation])

  useEffect(() => {
    const consultationStatus = consultation?.status
    if (!resolvedLookup) return
    if (!consultationStatus || consultationStatus === 'closed') return

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        setRefreshKey((current) => current + 1)
      }
    }, LIVE_STATUS_POLL_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [resolvedLookup, consultation?.status])

  useEffect(() => {
    if (!resolvedLookup) return

    function refreshStatus() {
      setRefreshKey((current) => current + 1)
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        refreshStatus()
      }
    }

    window.addEventListener('focus', refreshStatus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', refreshStatus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [resolvedLookup])

  const statusCopy = consultation ? getStatusCopy(consultation) : null
  const mediaItems = consultation?.mediaItems ?? []
  const latestReply =
    consultation && consultation.doctorReplies.length > 0
      ? consultation.doctorReplies[consultation.doctorReplies.length - 1]
      : null
  const chatbotReply = consultation?.chatbotReply || sessionChatbotReply
  const hasDoctorReply = Boolean(latestReply)
  const canCloseConsultation = consultation
    ? consultation.status === 'doctor_replied' && !consultation.closedAt
    : false

  const doctorReplyCard = (
    <div className="rounded-[1.8rem] border border-[var(--line)] bg-white p-5 shadow-[0_18px_50px_rgba(8,34,55,0.06)]">
      <p className="display-face text-xs font-semibold uppercase tracking-[0.2em] text-[var(--blue)]">
        의료진 답변
      </p>
      {latestReply ? (
        <article className="mt-4 rounded-[1.4rem] bg-[var(--surface)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--ink)]">
              {latestReply.doctorName}
              {consultation && consultation.doctorReplies.length > 1
                ? ` · 총 ${consultation.doctorReplies.length}건`
                : ''}
            </p>
            <p className="text-xs text-[var(--muted)]">{formatDateTime(latestReply.createdAt)}</p>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--ink)]">
            {latestReply.message}
          </p>
        </article>
      ) : (
        <p className="mt-4 rounded-[1.4rem] bg-[var(--surface)] p-4 text-sm leading-7 text-[var(--muted)]">
          아직 의료진 답변이 없습니다.
        </p>
      )}
    </div>
  )

  const nextActionCard = resolvedLookup ? (
    <StatusCloseActions
      lookup={resolvedLookup}
      canClose={canCloseConsultation}
      isClosed={consultation?.status === 'closed'}
      allowFollowUp={Boolean(latestReply) && consultation?.status !== 'closed'}
      onUpdated={() => setRefreshKey((current) => current + 1)}
    />
  ) : null

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef8ff_0%,#ffffff_32%,#f7fbff_100%)]">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-5 py-6 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="display-face text-xs font-semibold uppercase tracking-[0.24em] text-[var(--blue)]">
              Happy Doctor Status
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-4xl">
              상담 상태 확인
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              받은 링크나 코드를 입력하면 현재 상태와 최신 답변을 다시 볼 수 있습니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-[0_10px_24px_rgba(8,34,55,0.06)] transition hover:bg-[var(--soft-blue)]"
            >
              앱 홈으로
            </Link>
            <Link
              href="/start"
              className="rounded-full bg-[var(--navy)] px-5 py-2.5 text-sm font-semibold text-white visited:text-white shadow-[0_14px_24px_rgba(18,60,103,0.22)] transition hover:translate-y-[-1px]"
              style={{ color: '#ffffff' }}
            >
              새 상담 시작
            </Link>
          </div>
        </header>

        <section className="mt-8 rounded-[2rem] border border-[var(--line)] bg-white/88 p-5 shadow-[0_24px_60px_rgba(8,34,55,0.08)] sm:p-7">
          <form action="/status" className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="display-face text-xs font-semibold uppercase tracking-[0.2em] text-[var(--blue)]">
                Lookup
              </span>
              <input
                type="text"
                name="lookup"
                value={lookupValue}
                onChange={(event) => setLookupValue(event.target.value)}
                placeholder="받은 링크 또는 코드"
                className="mt-3 w-full rounded-[1.2rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white"
              />
            </label>
            <button
              type="submit"
              className="self-end rounded-[1.2rem] bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123c67]"
            >
              상태 확인
            </button>
          </form>
        </section>

        {restoredRecentSession && (
          <section className="mt-6 rounded-[1.8rem] border border-blue-200 bg-blue-50 px-5 py-4 text-sm leading-7 text-blue-800">
            최근 상담을 다시 불러오고 있습니다.
          </section>
        )}

        {fetchError ? (
          <section className="mt-6 rounded-[1.8rem] border border-[#ffd2c5] bg-[#fff6f2] p-5 text-sm leading-7 text-[#9b5031]">
            {fetchError}
          </section>
        ) : null}

        {!consultation && !fetchError && !loading && !checkingStoredSession ? (
          <section className="mt-6 rounded-[2rem] border border-dashed border-[var(--line)] bg-white/72 p-6 text-sm leading-7 text-[var(--muted)]">
            상담을 시작하면 상태 확인 링크와 코드를 바로 안내해 드립니다. 최근 1시간 안에 시작한 상담이 있으면 이 화면에서 자동으로 다시 불러옵니다.
          </section>
        ) : null}

        {chatbotReply && !consultation ? (
          <section className="mt-6">
            <div className="rounded-[2rem] border border-[#cfe0ff] bg-[#f5f9ff] p-6 shadow-[0_18px_50px_rgba(8,34,55,0.06)]">
              <p className="display-face text-xs font-semibold uppercase tracking-[0.24em] text-[var(--blue)]">
                Bodeum First Reply
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                보듬이의 1차 상담 결과
              </h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--ink)]">
                {chatbotReply}
              </p>
            </div>
          </section>
        ) : null}

        {consultation && statusCopy ? (
          <section className="mt-6 space-y-5">
            {liveUpdateMessage ? (
              <div className="rounded-[1.8rem] border border-[#d4eadb] bg-[#f4fbf6] px-5 py-4 text-sm leading-7 text-[#2f6b45]">
                {liveUpdateMessage}
              </div>
            ) : null}

            {chatbotReply && !hasDoctorReply ? (
              <div className="rounded-[2rem] border border-[#cfe0ff] bg-[#f5f9ff] p-6 shadow-[0_18px_50px_rgba(8,34,55,0.06)]">
                <p className="display-face text-xs font-semibold uppercase tracking-[0.24em] text-[var(--blue)]">
                  Bodeum First Reply
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                  보듬이의 1차 상담 결과
                </h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--ink)]">
                  {chatbotReply}
                </p>
              </div>
            ) : null}

            <div className="rounded-[2rem] bg-[var(--navy)] p-6 text-white shadow-[0_24px_60px_rgba(7,28,49,0.18)]">
              <p className="display-face text-xs font-semibold uppercase tracking-[0.24em] text-white/66">
                {statusCopy.badge}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{statusCopy.title}</h2>
              <p className="mt-4 text-sm leading-7 text-white/82">{statusCopy.body}</p>
            </div>

            {hasDoctorReply ? (
              <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                {doctorReplyCard}
                <div className="space-y-5">
                  {nextActionCard}
                </div>
              </div>
            ) : null}

            {chatbotReply && hasDoctorReply ? (
              <div className="rounded-[2rem] border border-[#cfe0ff] bg-[#f5f9ff] p-6 shadow-[0_18px_50px_rgba(8,34,55,0.06)]">
                <p className="display-face text-xs font-semibold uppercase tracking-[0.24em] text-[var(--blue)]">
                  Bodeum First Reply
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                  보듬이의 1차 상담 결과
                </h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--ink)]">
                  {chatbotReply}
                </p>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1.8rem] border border-[var(--line)] bg-white p-5 shadow-[0_18px_50px_rgba(8,34,55,0.06)]">
                <p className="text-sm font-semibold text-[var(--ink)]">접수 시각</p>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  {formatDateTime(consultation.createdAt)}
                </p>
              </div>
              <div className="rounded-[1.8rem] border border-[var(--line)] bg-white p-5 shadow-[0_18px_50px_rgba(8,34,55,0.06)]">
                <p className="text-sm font-semibold text-[var(--ink)]">주요 증상</p>
                <p className="mt-3 text-base font-semibold text-[var(--navy)]">
                  {consultation.chiefComplaint || '기록 없음'}
                </p>
              </div>
              <div className="rounded-[1.8rem] border border-[var(--line)] bg-white p-5 shadow-[0_18px_50px_rgba(8,34,55,0.06)]">
                <p className="text-sm font-semibold text-[var(--ink)]">직접 입력 코드</p>
                <p className="mt-3 text-3xl font-semibold tracking-[0.14em] text-[var(--navy)]">
                  {consultation.trackingCode || '생성 중'}
                </p>
              </div>
              <div className="rounded-[1.8rem] border border-[var(--line)] bg-white p-5 shadow-[0_18px_50px_rgba(8,34,55,0.06)]">
                <p className="text-sm font-semibold text-[var(--ink)]">최근 업데이트</p>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{getLatestUpdate(consultation)}</p>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[1.8rem] border border-[var(--line)] bg-white p-5 shadow-[0_18px_50px_rgba(8,34,55,0.06)]">
                <p className="display-face text-xs font-semibold uppercase tracking-[0.2em] text-[var(--blue)]">
                  첨부 사진
                </p>
                {mediaItems.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {mediaItems
                      .filter((item) => item.kind === 'image' && item.url)
                      .map((item) => (
                        <a
                          key={item.id || item.url}
                          href={item.url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="overflow-hidden rounded-[1.4rem] border border-[var(--line)] bg-[var(--surface)]"
                        >
                          <img
                            src={item.url || ''}
                            alt={item.originalName || '상담 첨부 사진'}
                            className="h-44 w-full object-cover"
                          />
                          <div className="px-4 py-3 text-xs leading-6 text-[var(--muted)]">
                            {item.createdAt ? formatDateTime(item.createdAt) : '등록 시각 없음'}
                          </div>
                        </a>
                      ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-[1.4rem] bg-[var(--surface)] p-4 text-sm leading-7 text-[var(--muted)]">
                    아직 첨부된 사진이 없습니다.
                  </p>
                )}
              </div>

              {resolvedLookup ? (
                <ConsultationImageUploader
                  lookup={resolvedLookup}
                  disabled={consultation.status === 'closed'}
                  existingCount={mediaItems.filter((item) => item.kind === 'image').length}
                  onUploaded={() => setRefreshKey((current) => current + 1)}
                />
              ) : null}
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              {!hasDoctorReply ? (
                <div className="rounded-[1.8rem] border border-[var(--line)] bg-white p-5 shadow-[0_18px_50px_rgba(8,34,55,0.06)]">
                <p className="display-face text-xs font-semibold uppercase tracking-[0.2em] text-[var(--blue)]">
                  의료진 답변
                </p>
                {latestReply ? (
                  <article className="mt-4 rounded-[1.4rem] bg-[var(--surface)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        {latestReply.doctorName}
                        {consultation.doctorReplies.length > 1 ? ` · 총 ${consultation.doctorReplies.length}건` : ''}
                      </p>
                      <p className="text-xs text-[var(--muted)]">{formatDateTime(latestReply.createdAt)}</p>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--ink)]">
                      {latestReply.message}
                    </p>
                  </article>
                ) : (
                  <p className="mt-4 rounded-[1.4rem] bg-[var(--surface)] p-4 text-sm leading-7 text-[var(--muted)]">
                    아직 의료진 답변이 없습니다.
                  </p>
                )}
                </div>
              ) : null}

              <div className="space-y-5">
                {!hasDoctorReply && resolvedLookup ? (
                  <StatusCloseActions
                    lookup={resolvedLookup}
                    canClose={canCloseConsultation}
                    isClosed={consultation.status === 'closed'}
                    allowFollowUp={Boolean(latestReply) && consultation.status !== 'closed'}
                    onUpdated={() => setRefreshKey((current) => current + 1)}
                  />
                ) : null}

                {(consultation.closedAt || consultation.closeReason) && (
                  <div className="rounded-[1.8rem] border border-[var(--line)] bg-white p-5 shadow-[0_18px_50px_rgba(8,34,55,0.06)]">
                    <p className="display-face text-xs font-semibold uppercase tracking-[0.2em] text-[var(--blue)]">
                      종료 정보
                    </p>
                    <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
                      <p>
                        <span className="font-semibold text-[var(--ink)]">종료 시각</span>
                        <br />
                        {consultation.closedAt ? formatDateTime(consultation.closedAt) : '아직 종료되지 않았습니다.'}
                      </p>
                      {consultation.closeReason ? (
                        <p>
                          <span className="font-semibold text-[var(--ink)]">종료 사유</span>
                          <br />
                          {consultation.closeReason}
                        </p>
                      ) : null}
                    </div>
                  </div>
                )}

                <div className="rounded-[1.8rem] border border-[var(--line)] bg-white p-5 shadow-[0_18px_50px_rgba(8,34,55,0.06)]">
                  <p className="display-face text-xs font-semibold uppercase tracking-[0.2em] text-[var(--blue)]">
                    안내
                  </p>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
                    <li className="flex gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[var(--blue)]" />
                      <span>응급이 의심되면 119 또는 가까운 응급실 이용이 우선입니다.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[var(--blue)]" />
                      <span>상태가 달라지면 기존 상담을 기다리기보다 새 상담을 다시 시작해 주세요.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {(loading || showBackgroundLoadingNotice) ? (
          <section className="mt-6 rounded-[2rem] border border-[var(--line)] bg-white p-6 text-sm leading-7 text-[var(--muted)] shadow-[0_18px_50px_rgba(8,34,55,0.06)]">
            상담 상태를 불러오고 있습니다...
          </section>
        ) : null}
      </div>
    </main>
  )
}
