'use client'

import { useEffect, useState, useCallback } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth'
import Link from 'next/link'
import { auth, googleProvider } from '@/lib/firebase'
import { getConsultations, Consultation, getMyHDT, getLeaderboard, DoctorStats } from '@/lib/api'

type Tab = 'pending' | 'replied' | 'closed' | 'leaderboard'

function formatElapsed(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

function genderLabel(gender: string): string {
  if (gender === 'male' || gender === 'M' || gender === '남') return '남'
  if (gender === 'female' || gender === 'F' || gender === '여') return '여'
  return gender
}

function categorize(c: Consultation): 'pending' | 'replied' | 'closed' {
  if (c.status === 'COMPLETED' || c.closedAt) return 'closed'
  if (c.doctorRepliedAt) return 'replied'
  return 'pending'
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('pending')
  const [myStats, setMyStats] = useState<DoctorStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<DoctorStats[]>([])
  const [boardLoading, setBoardLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthLoading(false)
    })
    return unsubscribe
  }, [])

  const fetchConsultations = useCallback(async () => {
    setListLoading(true)
    setError(null)
    try {
      const [data, stats] = await Promise.all([getConsultations(), getMyHDT()])
      setConsultations(data)
      setMyStats(stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : '상담 목록을 불러오지 못했습니다.')
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) fetchConsultations()
  }, [user, fetchConsultations])

  useEffect(() => {
    if (tab !== 'leaderboard' || leaderboard.length > 0) return
    setBoardLoading(true)
    getLeaderboard()
      .then(setLeaderboard)
      .catch(() => {})
      .finally(() => setBoardLoading(false))
  }, [tab, leaderboard.length])

  async function handleLogin() {
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
    }
  }

  async function handleLogout() {
    await signOut(auth)
    setConsultations([])
    setMyStats(null)
    setLeaderboard([])
  }

  if (authLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-zinc-50">
        <p className="text-zinc-500 text-sm">불러오는 중...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-zinc-50">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-900">해피닥터</h1>
            <p className="text-sm text-zinc-500">의료진 전용 포털</p>
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 w-full text-center">
              {error}
            </p>
          )}
          <button
            onClick={handleLogin}
            className="flex items-center justify-center gap-3 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 active:scale-[0.98]"
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

  const consultTabs: { key: Tab; label: string }[] = [
    { key: 'pending', label: '미답변' },
    { key: 'replied', label: '답변 완료' },
    { key: 'closed', label: '상담 종료' },
    { key: 'leaderboard', label: '🏆 리더보드' },
  ]

  const counts = {
    pending: consultations.filter((c) => categorize(c) === 'pending').length,
    replied: consultations.filter((c) => categorize(c) === 'replied').length,
    closed: consultations.filter((c) => categorize(c) === 'closed').length,
  }

  const filtered = tab !== 'leaderboard' ? consultations.filter((c) => categorize(c) === tab) : []

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-zinc-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <h1 className="text-base font-bold text-zinc-900">해피닥터 포털</h1>
          <div className="flex items-center gap-2 min-w-0">
            {myStats !== null && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700">
                🪙 {myStats.hdt.toLocaleString()} HDT
              </span>
            )}
            <span className="text-xs text-zinc-500 truncate max-w-[120px] hidden sm:block">{user.email}</span>
            <button
              onClick={fetchConsultations}
              disabled={listLoading}
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

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-5 border-b border-zinc-200 overflow-x-auto">
          {consultTabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`shrink-0 px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
                tab === key
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {label}
              {key !== 'leaderboard' && !listLoading && (
                <span className={`ml-1.5 text-xs ${tab === key ? 'text-blue-500' : 'text-zinc-400'}`}>
                  {counts[key as keyof typeof counts]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        {tab === 'leaderboard' && (
          boardLoading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-zinc-400">불러오는 중...</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white border border-zinc-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100">
                <p className="text-xs text-zinc-500">답변 1건당 100 HDT 적립 · 환자 확인 시 +50 HDT 추가</p>
              </div>
              {leaderboard.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <p className="text-sm text-zinc-400">아직 적립 내역이 없습니다.</p>
                </div>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {leaderboard.map((doc, i) => (
                    <li key={doc.email} className={`flex items-center gap-4 px-5 py-3.5 ${doc.email === user.email ? 'bg-amber-50' : ''}`}>
                      <span className={`w-7 text-center text-sm font-bold ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-zinc-400' : i === 2 ? 'text-orange-400' : 'text-zinc-400'}`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-800 truncate">
                          {doc.name || doc.email}
                          {doc.email === user.email && <span className="ml-1.5 text-xs text-amber-600">(나)</span>}
                        </p>
                        <p className="text-xs text-zinc-400">답변 {doc.totalReplies}건</p>
                      </div>
                      <span className="text-sm font-bold text-amber-600">
                        {doc.hdt.toLocaleString()} HDT
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        )}

        {/* Consultation List */}
        {tab !== 'leaderboard' && (
          listLoading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-zinc-400">불러오는 중...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-zinc-400">해당 상담이 없습니다.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {filtered.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/patient/${c.id}`}
                    className="block rounded-2xl bg-white border border-zinc-200 px-5 py-4 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-zinc-800">
                            {c.patientData.age}세 {genderLabel(c.patientData.gender)}
                          </span>
                          {tab === 'pending' && (
                            <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">미답변</span>
                          )}
                          {tab === 'replied' && (
                            <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">답변완료</span>
                          )}
                          {tab === 'closed' && (
                            <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">종료</span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-700 truncate">
                          <span className="font-medium text-zinc-500">주訴 </span>
                          {c.patientData.cc}
                        </p>
                        {c.patientData.nrs && (
                          <p className="text-xs text-zinc-400">통증 NRS {c.patientData.nrs}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-zinc-400 mt-0.5">
                        {formatElapsed(c.createdAt)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )
        )}
      </main>
    </div>
  )
}
