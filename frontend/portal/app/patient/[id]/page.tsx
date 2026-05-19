/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

import { auth, firebaseConfigError } from '@/lib/firebase'
import {
  Consultation,
  FollowUpLog,
  PatientData,
  getConsultation,
  getConsultations,
  postReply,
} from '@/lib/api'

function formatDate(iso: string): string {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  })
}

function genderLabel(gender: string): string {
  switch (gender) {
    case 'male':
    case 'M':
    case '남':
    case '남성':
      return '남성'
    case 'female':
    case 'F':
    case '여':
    case '여성':
      return '여성'
    case 'other':
      return '기타'
    case 'prefer_not_to_say':
      return '밝히지 않음'
    default:
      return gender || '미상'
  }
}

function languageLabel(language?: string | null): string {
  switch ((language || '').trim().toLowerCase()) {
    case 'ko':
      return '한국어'
    case 'en':
      return '영어'
    case 'vi':
      return '베트남어'
    case 'zh-cn':
    case 'zh':
      return '중국어 간체'
    case 'zh-tw':
      return '중국어 번체'
    case 'ja':
      return '일본어'
    case 'mn':
      return '몽골어'
    case 'ru':
      return '러시아어'
    case 'th':
      return '태국어'
    case 'tl':
    case 'fil':
      return '타갈로그어'
    default:
      return language?.trim() || '미상'
  }
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

function LabelValue({
  label,
  value,
  multiline = false,
}: {
  label: string
  value?: string | null
  multiline?: boolean
}) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-sm leading-6">
      <span className="w-28 shrink-0 font-medium text-zinc-500">{label}</span>
      <span className={multiline ? 'whitespace-pre-wrap text-zinc-800' : 'text-zinc-800'}>{value}</span>
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
    case 'PATIENT_FOLLOW_UP_QUESTION':
      return '환자 추가 질문'
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
      {log.alertMessage ? (
        <pre className="mt-3 whitespace-pre-wrap break-words rounded-xl border border-zinc-200 bg-white p-3 text-sm leading-relaxed text-zinc-700">
          {log.alertMessage}
        </pre>
      ) : null}
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

function getDoctorFacingPatientData(consultation: Consultation): PatientData {
  return consultation.translatedPatientDataKo || consultation.patientData
}

function hasDeliveredTranslation(replyMessage?: string | null, deliveredMessage?: string | null) {
  return Boolean(deliveredMessage && deliveredMessage !== replyMessage)
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

  useEffect(() => {
    params.then((resolved) => setPatientId(resolved.id))
  }, [params])

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false)
      setFetchError(firebaseConfigError)
      router.replace('/')
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setAuthLoading(false)
      if (!nextUser) {
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
        } catch (error) {
          const message = error instanceof Error ? error.message : '상담 정보를 불러오지 못했습니다.'
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
      } catch (error) {
        if (cancelled) return
        setFetchError(error instanceof Error ? error.message : '상담 정보를 불러오지 못했습니다.')
        setFetchLoading(false)
      }
    }

    loadConsultation()

    return () => {
      cancelled = true
    }
  }, [patientId, searchParams, user])

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
  const sourceLanguage = consultation?.sourceLanguage || null
  const patientReplyLanguage = consultation?.patientReplyLanguage || sourceLanguage || 'ko'
  const hasTranslatedPatientData = Boolean(
    consultation?.translatedPatientDataKo
    && sourceLanguage
    && sourceLanguage.toLowerCase() !== 'ko',
  )
  const doctorFacingPatientData = consultation ? getDoctorFacingPatientData(consultation) : null

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!patientId || !replyText.trim() || derivedState.closed || fallbackNotice) return

    setSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)
    try {
      await postReply(patientId, replyText.trim())
      setReplyText('')
      setSubmitSuccess(true)
      const updated = await getConsultation(patientId)
      setConsultation(updated)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '전송에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">인증 확인 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
          <Link
            href="/"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
          >
            &larr; 목록으로
          </Link>
          <h1 className="text-sm font-semibold text-zinc-800">환자 상세</h1>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6">
        {fetchLoading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-zinc-400">불러오는 중...</p>
          </div>
        ) : null}

        {fetchError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {fetchError}
          </div>
        ) : null}

        {fallbackNotice ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {fallbackNotice}
          </div>
        ) : null}

        {consultation ? (
          <>
            <section className={`rounded-2xl border px-5 py-5 shadow-sm ${derivedState.status.cardClass}`}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">상담 요약</p>
                    <h2 className="mt-2 text-lg font-semibold text-zinc-900">
                      {consultation.patientData.age || '나이 미상'} / {genderLabel(consultation.patientData.gender)} 환자
                    </h2>
                    <p className="mt-1 text-sm text-zinc-600">{derivedState.status.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${derivedState.status.badgeClass}`}>
                      {derivedState.status.label}
                    </span>
                    {sourceLanguage ? (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        원문 {languageLabel(sourceLanguage)}
                      </span>
                    ) : null}
                    {patientReplyLanguage ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        환자 전달 {languageLabel(patientReplyLanguage)}
                      </span>
                    ) : null}
                  </div>
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

            <section className="rounded-2xl border border-zinc-200 bg-white px-5 py-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-zinc-800">환자 입력 원문</h2>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    {consultation.aiAction}
                  </span>
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${derivedState.status.badgeClass}`}>
                    {derivedState.status.label}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <LabelValue label="원문 언어" value={languageLabel(sourceLanguage)} />
                <LabelValue label="나이 / 성별" value={`${consultation.patientData.age || '미상'} / ${genderLabel(consultation.patientData.gender)}`} />
                <LabelValue label="주호소 (CC)" value={consultation.patientData.cc} />
                <LabelValue label="발생 시기" value={consultation.patientData.onset} />
                <LabelValue label="통증 NRS" value={consultation.patientData.nrs} />
                <LabelValue label="증상 양상" value={consultation.patientData.symptom} multiline />
                <LabelValue label="동반 증상" value={consultation.patientData.associated} multiline />
                <LabelValue label="과거력 / 복용약" value={consultation.patientData.pmhx} multiline />
                <LabelValue label="접수 시각" value={formatDate(consultation.createdAt)} />
                {consultation.patientNotificationContact?.consented ? (
                  <LabelValue label="알림 동의 연락처" value={consultation.patientNotificationContact.phone} />
                ) : null}
                {consultation.patientNotificationContact?.consentedAt ? (
                  <LabelValue label="알림 동의 시각" value={formatDate(consultation.patientNotificationContact.consentedAt)} />
                ) : null}
                {consultation.closedAt ? (
                  <LabelValue label="종료 시각" value={formatDate(consultation.closedAt)} />
                ) : null}
                {consultation.closeReason ? (
                  <LabelValue label="종료 사유" value={consultation.closeReason} multiline />
                ) : null}
              </div>
            </section>

            {hasTranslatedPatientData && doctorFacingPatientData ? (
              <section className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-5 shadow-sm">
                <h2 className="mb-4 text-sm font-bold text-zinc-800">의사용 한국어 번역본</h2>
                <div className="flex flex-col gap-2">
                  <LabelValue label="나이 / 성별" value={`${doctorFacingPatientData.age || '미상'} / ${doctorFacingPatientData.gender || '미상'}`} />
                  <LabelValue label="주호소 (CC)" value={doctorFacingPatientData.cc} />
                  <LabelValue label="발생 시기" value={doctorFacingPatientData.onset} />
                  <LabelValue label="통증 NRS" value={doctorFacingPatientData.nrs} />
                  <LabelValue label="증상 양상" value={doctorFacingPatientData.symptom} multiline />
                  <LabelValue label="동반 증상" value={doctorFacingPatientData.associated} multiline />
                  <LabelValue label="과거력 / 복용약" value={doctorFacingPatientData.pmhx} multiline />
                </div>
              </section>
            ) : null}

            {mediaItems.length > 0 ? (
              <section className="rounded-2xl border border-zinc-200 bg-white px-5 py-5 shadow-sm">
                <h2 className="mb-3 text-sm font-bold text-zinc-800">첨부 사진</h2>
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
            ) : null}

            {consultation.doctorChart ? (
              <section className="rounded-2xl border border-zinc-200 bg-white px-5 py-5 shadow-sm">
                <h2 className="mb-3 text-sm font-bold text-zinc-800">SOAP 차트</h2>
                <pre className="whitespace-pre-wrap break-words rounded-xl border border-zinc-100 bg-zinc-50 p-4 font-mono text-sm leading-relaxed text-zinc-700">
                  {consultation.doctorChart}
                </pre>
              </section>
            ) : null}

            {consultation.chatbotReply ? (
              <section className="rounded-2xl border border-zinc-200 bg-white px-5 py-5 shadow-sm">
                <h2 className="mb-3 text-sm font-bold text-zinc-800">초기 답변 기록</h2>
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">내부 한국어 초안</p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                      {consultation.chatbotReply}
                    </p>
                  </div>
                  {consultation.patientDeliveredChatbotReply
                  && consultation.patientDeliveredChatbotReply !== consultation.chatbotReply ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                        환자에게 전달된 번역본 ({languageLabel(patientReplyLanguage)})
                      </p>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                        {consultation.patientDeliveredChatbotReply}
                      </p>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            <section className="rounded-2xl border border-zinc-200 bg-white px-5 py-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
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

            <section className="rounded-2xl border border-zinc-200 bg-white px-5 py-5 shadow-sm">
              <h2 className="mb-4 text-sm font-bold text-zinc-800">
                답변 내역
                {consultation.doctorReplies && consultation.doctorReplies.length > 0 ? (
                  <span className="ml-2 text-xs font-normal text-zinc-400">
                    {consultation.doctorReplies.length}건
                  </span>
                ) : null}
              </h2>

              {!consultation.doctorReplies || consultation.doctorReplies.length === 0 ? (
                <p className="text-sm text-zinc-400">아직 답변이 없습니다.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {consultation.doctorReplies.map((reply) => (
                    <li
                      key={reply.id}
                      className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3"
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2">
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
                      <div className="space-y-3">
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">의사 작성 원문</p>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                            {reply.message}
                          </p>
                        </div>
                        {hasDeliveredTranslation(reply.message, reply.patientDeliveredMessage) ? (
                          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3">
                            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                              환자에게 전달된 번역본 ({languageLabel(reply.patientDeliveredLanguage)})
                            </p>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                              {reply.patientDeliveredMessage}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white px-5 py-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-1">
                <h2 className="text-sm font-bold text-zinc-800">답변 전송</h2>
                {patientReplyLanguage && patientReplyLanguage.toLowerCase() !== 'ko' ? (
                  <p className="text-xs text-zinc-500">
                    한국어로 작성하면 환자에게는 {languageLabel(patientReplyLanguage)}로 자동 번역되어 전달됩니다.
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500">
                    한국어로 바로 작성해 전달할 수 있습니다.
                  </p>
                )}
                {derivedState.closed ? (
                  <p className="text-xs text-zinc-500">종료된 상담은 추가 회신을 보낼 수 없습니다.</p>
                ) : null}
                {!derivedState.closed && fallbackNotice ? (
                  <p className="text-xs text-zinc-500">
                    상세 데이터 동기화가 완료되면 답변 전송을 다시 사용할 수 있습니다.
                  </p>
                ) : null}
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <textarea
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder={
                    derivedState.closed
                      ? '종료된 상담입니다.'
                      : fallbackNotice
                        ? '상세 데이터 동기화 후 답변 전송을 사용할 수 있습니다.'
                        : '환자에게 전달할 답변을 한국어로 입력하세요...'
                  }
                  rows={5}
                  disabled={submitting || derivedState.closed || Boolean(fallbackNotice)}
                  className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 transition focus:border-blue-400 focus:bg-white focus:outline-none disabled:opacity-50"
                />

                {submitError ? (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                    {submitError}
                  </p>
                ) : null}

                {submitSuccess ? (
                  <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                    답변이 전송되었습니다.
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting || !replyText.trim() || derivedState.closed || Boolean(fallbackNotice)}
                  className="self-end rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? '전송 중...' : '환자에게 전송'}
                </button>
              </form>
            </section>
          </>
        ) : null}
      </main>
    </div>
  )
}
