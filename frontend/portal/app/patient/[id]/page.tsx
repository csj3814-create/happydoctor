'use client'

import { useEffect, useState, useRef } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/firebase'
import { getConsultation, postReply, Consultation } from '@/lib/api'

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

function LabelValue({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-24 shrink-0 font-medium text-zinc-500">{label}</span>
      <span className="text-zinc-800">{value}</span>
    </div>
  )
}

interface PatientPageProps {
  params: Promise<{ id: string }>
}

export default function PatientPage({ params }: PatientPageProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [fetchLoading, setFetchLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [patientId, setPatientId] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Resolve params (Promise in Next.js 16+)
  useEffect(() => {
    params.then((p) => setPatientId(p.id))
  }, [params])

  useEffect(() => {
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
    setFetchLoading(true)
    setFetchError(null)
    getConsultation(patientId)
      .then((data) => setConsultation(data))
      .catch((err) => setFetchError(err instanceof Error ? err.message : '상담 정보를 불러오지 못했습니다.'))
      .finally(() => setFetchLoading(false))
  }, [user, patientId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!patientId || !replyText.trim()) return
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

        {consultation && (
          <>
            {/* Patient Data Card */}
            <section className="rounded-2xl bg-white border border-zinc-200 shadow-sm px-5 py-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-zinc-800">환자 정보</h2>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    ESCALATE
                  </span>
                  {consultation.doctorRepliedAt && (
                    <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      답변완료
                    </span>
                  )}
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
                {consultation.closedAt && (
                  <LabelValue label="종료 시각" value={formatDate(consultation.closedAt)} />
                )}
                {consultation.closeReason && (
                  <LabelValue label="종료 사유" value={consultation.closeReason} />
                )}
              </div>
            </section>

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
                          {reply.seen && (
                            <span className="text-xs text-zinc-400">읽음</span>
                          )}
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
              <h2 className="text-sm font-bold text-zinc-800 mb-4">답변 전송</h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <textarea
                  ref={textareaRef}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="환자에게 전달할 답변을 입력하세요..."
                  rows={5}
                  disabled={submitting}
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
                  disabled={submitting || !replyText.trim()}
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
