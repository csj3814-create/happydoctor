'use client'

import { useDeferredValue, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth'
import Link from 'next/link'

import { auth, googleProvider } from '@/lib/firebase'
import {
  Consultation,
  ConsultationStatus,
  ConsultationSummary,
  DoctorStats,
  getConsultationPage,
  getConsultationSummary,
  getLeaderboard,
  getMyHDT,
} from '@/lib/api'

type Tab = 'pending' | 'replied' | 'closed' | 'leaderboard'
type InboxTab = Exclude<Tab, 'leaderboard'>

const PAGE_SIZE = 12

const EMPTY_SUMMARY: ConsultationSummary = {
  pending: 0,
  replied: 0,
  closed: 0,
  followUp: 0,
}

const TAB_TO_STATUS: Record<InboxTab, ConsultationStatus> = {
  pending: 'active',
  replied: 'replied',
  closed: 'closed',
}

function formatElapsed(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}분 전`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`

  return `${Math.floor(hours / 24)}일 전`
}

function formatDateTime(value?: string): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function genderLabel(gender: string): string {
  if (gender === 'male' || gender === 'M' || gender === '남성') return '남성'
  if (gender === 'female' || gender === 'F' || gender === '여성') return '여성'
  return gender
}

function categorize(consultation: Consultation): InboxTab {
  if (consultation.status === 'COMPLETED' || consultation.closedAt) return 'closed'
  if (consultation.doctorRepliedAt) return 'replied'
  return 'pending'
}

function followUpCount(consultation: Consultation): number {
  return consultation.followUpLogs?.length ?? 0
}

function cardTone(consultation: Consultation): string {
  const category = categorize(consultation)

  if (category === 'closed') {
    return 'border-zinc-200 hover:border-zinc-300'
  }

  if (category === 'replied') {
    return 'border-green-200 bg-green-50/40 hover:border-green-300'
  }

  if (followUpCount(consultation) > 0) {
    return 'border-amber-300 bg-amber-50/50 hover:border-amber-400'
  }

  return 'border-zinc-200 hover:border-zinc-300'
}

function statusBadge(consultation: Consultation): { label: string; className: string } {
  const category = categorize(consultation)

  if (category === 'closed') {
    return { label: '상담 종료', className: 'bg-zinc-100 text-zinc-600' }
  }

  if (category === 'replied') {
    return { label: '답변 완료', className: 'bg-green-100 text-green-700' }
  }

  return { label: '답변 대기', className: 'bg-red-100 text-red-700' }
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [summary, setSummary] = useState<ConsultationSummary>(EMPTY_SUMMARY)
  const [totalConsultations, setTotalConsultations] = useState(0)
  const [listLoading, setListLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearch = useDeferredValue(searchQuery)
  const [currentPage, setCurrentPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [myStats, setMyStats] = useState<DoctorStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<DoctorStats[]>([])
  const [boardLoading, setBoardLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setAuthLoading(false)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!user) return

    let cancelled = false

    async function loadSummary() {
      try {
        const [summaryData, stats] = await Promise.all([
          getConsultationSummary(),
          getMyHDT(),
        ])

        if (cancelled) return
        setSummary(summaryData)
        setMyStats(stats)
      } catch (fetchError) {
        if (cancelled) return
        setError(fetchError instanceof Error ? fetchError.message : '포털 요약을 불러오지 못했습니다.')
      }
    }

    loadSummary()

    return () => {
      cancelled = true
    }
  }, [user, refreshKey])

  useEffect(() => {
    if (!user || tab === 'leaderboard') return

    let cancelled = false
    const currentTab = tab as InboxTab

    async function loadConsultationPage() {
      setListLoading(true)
      setError(null)

      try {
        const pageData = await getConsultationPage({
          status: TAB_TO_STATUS[currentTab],
          search: deferredSearch,
          offset: (currentPage - 1) * PAGE_SIZE,
          limit: PAGE_SIZE,
        })

        if (cancelled) return
        setConsultations(pageData.consultations)
        setTotalConsultations(pageData.total)
      } catch (fetchError) {
        if (cancelled) return
        setConsultations([])
        setTotalConsultations(0)
        setError(fetchError instanceof Error ? fetchError.message : '상담 목록을 불러오지 못했습니다.')
      } finally {
        if (!cancelled) {
          setListLoading(false)
        }
      }
    }

    loadConsultationPage()

    return () => {
      cancelled = true
    }
  }, [user, tab, deferredSearch, currentPage, refreshKey])

  useEffect(() => {
    if (!user || tab !== 'leaderboard') return

    let cancelled = false

    async function loadLeaderboard() {
      setBoardLoading(true)

      try {
        const board = await getLeaderboard()
        if (cancelled) return
        setLeaderboard(board)
      } catch (fetchError) {
        if (cancelled) return
        setError(fetchError instanceof Error ? fetchError.message : '리더보드를 불러오지 못했습니다.')
      } finally {
        if (!cancelled) {
          setBoardLoading(false)
        }
      }
    }

    loadLeaderboard()

    return () => {
      cancelled = true
    }
  }, [user, tab, refreshKey])

  useEffect(() => {
    setCurrentPage(1)
  }, [tab, deferredSearch])

  async function handleLogin() {
    setError(null)

    try {
      await signInWithPopup(auth, googleProvider)
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : '로그인에 실패했습니다.')
    }
  }

  async function handleLogout() {
    await signOut(auth)
    setConsultations([])
    setSummary(EMPTY_SUMMARY)
    setTotalConsultations(0)
    setMyStats(null)
    setLeaderboard([])
    setSearchQuery('')
  }

  const consultTabs: { key: Tab; label: string }[] = [
    { key: 'pending', label: '미답변' },
    { key: 'replied', label: '답변 완료' },
    { key: 'closed', label: '상담 종료' },
    { key: 'leaderboard', label: 'HDT 리더보드' },
  ]

  const counts = {
    pending: summary.pending,
    replied: summary.replied,
    closed: summary.closed,
  }

  const totalPages = Math.max(1, Math.ceil(totalConsultations / PAGE_SIZE))

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">불러오는 중...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-zinc-900">해피닥터 의사 포털</h1>
            <p className="text-sm text-zinc-500">인증된 의료진 계정으로만 접근할 수 있습니다.</p>
          </div>

          {error && (
            <p className="w-full rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            onClick={handleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 active:scale-[0.98]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google로 로그인
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <div>
            <h1 className="text-base font-semibold text-zinc-900">해피닥터 의사 포털</h1>
            <p className="text-xs text-zinc-500">응답 대기 환자를 빠르게 확인하고 회신하세요.</p>
          </div>

          <div className="flex items-center gap-2">
            {myStats && (
              <span className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                {myStats.hdt.toLocaleString()} HDT
              </span>
            )}
            <span className="hidden max-w-[160px] truncate text-xs text-zinc-500 sm:block">
              {user.email}
            </span>
            <button
              onClick={() => setRefreshKey((value) => value + 1)}
              disabled={listLoading || boardLoading}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
            >
              새로고침
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">미답변</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{summary.pending}</p>
            <p className="mt-1 text-sm text-zinc-500">직접 회신이 필요한 상담</p>
          </div>
          <div className="rounded-2xl border border-green-200 bg-green-50/60 px-4 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700">답변 완료</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{summary.replied}</p>
            <p className="mt-1 text-sm text-zinc-500">의료진 회신이 이미 전달된 상담</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Follow-up</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{summary.followUp}</p>
            <p className="mt-1 text-sm text-zinc-500">추가 문진 기록이 있는 상담</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">종료 상담</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{summary.closed}</p>
            <p className="mt-1 text-sm text-zinc-500">종료 사유까지 확인 가능한 상담</p>
          </div>
        </section>

        <div className="flex gap-1 overflow-x-auto border-b border-zinc-200">
          {consultTabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition ${
                tab === key
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {label}
              {key !== 'leaderboard' && (
                <span className={`ml-1.5 text-xs ${tab === key ? 'text-blue-500' : 'text-zinc-400'}`}>
                  {counts[key as keyof typeof counts]}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab !== 'leaderboard' && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-800">상담 검색</h2>
                <p className="text-xs text-zinc-400">주호소, 증상, 나이, 환자 ID로 빠르게 찾을 수 있습니다.</p>
              </div>
              <p className="text-xs text-zinc-400">검색 결과 {totalConsultations}건</p>
            </div>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="예: 복통, 발열, chest pain"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:outline-none"
            />
          </div>
        )}

        {tab === 'leaderboard' ? (
          boardLoading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-zinc-400">불러오는 중...</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="border-b border-zinc-100 px-5 py-4">
                <p className="text-xs text-zinc-500">답변 1건당 100 HDT, 환자 확인 시 추가 50 HDT가 지급됩니다.</p>
              </div>
              {leaderboard.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <p className="text-sm text-zinc-400">아직 집계된 활동이 없습니다.</p>
                </div>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {leaderboard.map((doctor, index) => (
                    <li
                      key={doctor.email}
                      className={`flex items-center gap-4 px-5 py-3.5 ${doctor.email === user.email ? 'bg-amber-50' : ''}`}
                    >
                      <span
                        className={`w-7 text-center text-sm font-bold ${
                          index === 0
                            ? 'text-amber-500'
                            : index === 1
                              ? 'text-zinc-400'
                              : index === 2
                                ? 'text-orange-400'
                                : 'text-zinc-400'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-800">
                          {doctor.name || doctor.email}
                          {doctor.email === user.email && (
                            <span className="ml-1.5 text-xs text-amber-600">(나)</span>
                          )}
                        </p>
                        <p className="text-xs text-zinc-400">답변 {doctor.totalReplies}건</p>
                      </div>
                      <span className="text-sm font-bold text-amber-600">
                        {doctor.hdt.toLocaleString()} HDT
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        ) : listLoading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-zinc-400">불러오는 중...</p>
          </div>
        ) : consultations.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-zinc-400">해당 조건의 상담이 없습니다.</p>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {consultations.map((consultation) => {
                const badge = statusBadge(consultation)
                const followUp = followUpCount(consultation)
                const category = categorize(consultation)
                const secondaryTimestamp =
                  category === 'replied'
                    ? consultation.doctorRepliedAt
                    : category === 'closed'
                      ? consultation.closedAt || consultation.doctorRepliedAt || consultation.createdAt
                      : consultation.createdAt

                const secondaryLabel =
                  category === 'replied'
                    ? '최근 회신'
                    : category === 'closed'
                      ? '종료 시각'
                      : '접수 시각'

                return (
                  <li key={consultation.id}>
                    <Link
                      href={{
                        pathname: `/patient/${consultation.id}`,
                        query: { userId: consultation.userId },
                      }}
                      className={`block rounded-2xl border bg-white px-5 py-4 shadow-sm transition hover:shadow-md ${cardTone(consultation)}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-zinc-800">
                              {consultation.patientData.age}세 / {genderLabel(consultation.patientData.gender)}
                            </span>
                            <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                              {badge.label}
                            </span>
                            {followUp > 0 && (
                              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                                Follow-up {followUp}건
                              </span>
                            )}
                            {consultation.aiAction === 'ESCALATE' && (
                              <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                의료진 검토
                              </span>
                            )}
                          </div>

                          <p className="truncate text-sm text-zinc-700">
                            <span className="mr-1 font-medium text-zinc-500">주호소</span>
                            {consultation.patientData.cc}
                          </p>

                          {consultation.patientData.symptom && (
                            <p className="line-clamp-2 text-sm text-zinc-500">
                              {consultation.patientData.symptom}
                            </p>
                          )}

                          {category === 'closed' && consultation.closeReason && (
                            <p className="line-clamp-2 text-sm text-zinc-500">
                              <span className="mr-1 font-medium text-zinc-500">종료 사유</span>
                              {consultation.closeReason}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                            {consultation.patientData.nrs && <span>NRS {consultation.patientData.nrs}</span>}
                            {consultation.patientData.associated && <span>{consultation.patientData.associated}</span>}
                            <span>{secondaryLabel} {formatDateTime(secondaryTimestamp)}</span>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="block text-xs text-zinc-400">
                            {formatElapsed(consultation.createdAt)}
                          </span>
                          <span className="mt-1 block text-[11px] text-zinc-400">
                            {consultation.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>

            {totalPages > 1 && (
              <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs text-zinc-400">
                  {currentPage} / {totalPages} 페이지
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-40"
                  >
                    이전
                  </button>
                  <button
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-40"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
