import Link from 'next/link'
import { fetchConsultationStatus, normalizeStatusLookup, type PublicConsultationStatus } from '@/lib/status'

export const dynamic = 'force-dynamic'

type StatusPageProps = {
  searchParams: Promise<{
    lookup?: string
    code?: string
    token?: string
  }>
}

const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Seoul',
})

function formatDateTime(value: string | null) {
  if (!value) return '아직 기록 없음'

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
        body: '아래 최신 답변을 확인해 주세요.',
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
        title: '상담이 접수되었습니다',
        body: '기본 안내가 먼저 전달된 상태입니다.',
      }
  }
}

function getLatestUpdate(status: PublicConsultationStatus) {
  if (status.doctorRepliedAt) {
    return formatDateTime(status.doctorRepliedAt)
  }

  if (status.latestFollowUpAt) {
    return formatDateTime(status.latestFollowUpAt)
  }

  if (status.requiresDoctorReview) {
    return '의료진 확인 대기 중'
  }

  return '기본 안내 전달됨'
}

export default async function StatusPage({ searchParams }: StatusPageProps) {
  const resolvedSearchParams = await searchParams
  const rawLookup =
    resolvedSearchParams.lookup || resolvedSearchParams.code || resolvedSearchParams.token || ''
  const normalizedLookup = normalizeStatusLookup(rawLookup)

  let consultation: PublicConsultationStatus | null = null
  let fetchError: string | null = null

  if (rawLookup && !normalizedLookup) {
    fetchError = '받은 링크 또는 코드를 다시 확인해 주세요.'
  } else if (normalizedLookup) {
    try {
      consultation = await fetchConsultationStatus(normalizedLookup)
      if (!consultation) {
        fetchError = '상담 상태를 찾지 못했습니다. 받은 링크 또는 코드를 다시 확인해 주세요.'
      }
    } catch {
      fetchError = '지금은 상태를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
    }
  }

  const statusCopy = consultation ? getStatusCopy(consultation) : null
  const latestReply =
    consultation && consultation.doctorReplies.length > 0
      ? consultation.doctorReplies[consultation.doctorReplies.length - 1]
      : null

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
              받은 링크나 코드를 넣으면 현재 상태와 최근 답변을 확인할 수 있습니다.
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
              className="rounded-full bg-[var(--navy)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_24px_rgba(18,60,103,0.22)] transition hover:translate-y-[-1px]"
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
                defaultValue={rawLookup}
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

        {fetchError ? (
          <section className="mt-6 rounded-[1.8rem] border border-[#ffd2c5] bg-[#fff6f2] p-5 text-sm leading-7 text-[#9b5031]">
            {fetchError}
          </section>
        ) : null}

        {!consultation && !fetchError ? (
          <section className="mt-6 rounded-[2rem] border border-dashed border-[var(--line)] bg-white/72 p-6 text-sm leading-7 text-[var(--muted)]">
            상담을 시작하면 상태 확인 링크와 코드가 함께 제공됩니다.
          </section>
        ) : null}

        {consultation && statusCopy ? (
          <section className="mt-6 space-y-5">
            <div className="rounded-[2rem] bg-[var(--navy)] p-6 text-white shadow-[0_24px_60px_rgba(7,28,49,0.18)]">
              <p className="display-face text-xs font-semibold uppercase tracking-[0.24em] text-white/66">
                {statusCopy.badge}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{statusCopy.title}</h2>
              <p className="mt-4 text-sm leading-7 text-white/82">{statusCopy.body}</p>
            </div>

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

            <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
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

              <div className="space-y-5">
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
                      <span>상태가 달라졌다면 기존 상담을 기다리기보다 새 상담을 다시 시작해 주세요.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}
