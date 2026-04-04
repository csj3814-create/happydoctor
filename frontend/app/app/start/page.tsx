import Link from 'next/link'
import WebConsultationStartForm from '@/components/WebConsultationStartForm'

type StartPageProps = {
  searchParams: Promise<{
    source?: string
  }>
}

function normalizeEntrySurface(value?: string) {
  const trimmed = value?.trim()
  if (!trimmed) return 'app'
  return trimmed.slice(0, 40)
}

export default async function StartPage({ searchParams }: StartPageProps) {
  const resolvedSearchParams = await searchParams
  const entrySurface = normalizeEntrySurface(resolvedSearchParams.source)

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef8ff_0%,#ffffff_28%,#f7fbff_100%)]">
      <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8 sm:py-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="display-face text-xs font-semibold uppercase tracking-[0.24em] text-[var(--blue)]">
              Happy Doctor Start
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-4xl">
              웹에서 바로 상담 시작
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              필요한 정보만 적어 주시면 상담을 접수하고 상태 확인 코드도 함께 드립니다.
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
              href="/status"
              className="rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-[0_10px_24px_rgba(8,34,55,0.06)] transition hover:bg-[var(--soft-blue)]"
            >
              상태 확인
            </Link>
          </div>
        </header>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="rounded-[2rem] bg-[var(--navy)] p-6 text-white shadow-[0_24px_60px_rgba(7,28,49,0.18)] sm:p-7">
            <p className="display-face text-xs font-semibold uppercase tracking-[0.24em] text-white/64">
              Care Access
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
              의료가 멀게 느껴질 때
              <br />
              먼저 설명할 수 있는 곳
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-white/82">
              <p>
                이 화면은 어디서부터 도움을 구해야 할지 막막한 순간에 먼저 설명하고 연결되는 온라인 의료상담 창구입니다.
              </p>
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-white/10 p-4 text-sm leading-7 text-white/82">
              <p className="font-semibold text-white">이런 내용을 적어 주세요</p>
              <ul className="mt-3 space-y-2">
                <li>가장 불편한 증상</li>
                <li>언제부터 시작됐는지</li>
                <li>기저질환이나 복용 중인 약이 있는지</li>
              </ul>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--line)] bg-white/80 p-6 shadow-[0_24px_60px_rgba(8,34,55,0.08)] sm:p-7">
            <p className="display-face text-xs font-semibold uppercase tracking-[0.2em] text-[var(--blue)]">
              진행 방식
            </p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--muted)]">
              <p>
                1. 증상과 상황을 적습니다.
                <br />
                2. 보듬이가 먼저 정리합니다.
                <br />
                3. 필요하면 의료진 답변이 이어집니다.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <WebConsultationStartForm entrySurface={entrySurface} />
        </section>
      </div>
    </main>
  )
}
