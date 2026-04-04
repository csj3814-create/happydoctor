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
              카카오톡이 익숙하지 않아도 괜찮습니다. 해피닥터는 의료 접근성 취약계층이 온라인으로 먼저 도움에 닿을 수
              있도록 웹에서도 무료 의료상담을 시작할 수 있게 열어 둡니다.
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
                이 화면은 정식 진료를 대신하는 곳이 아니라, 어디서부터 도움을 구해야 할지 막막한 순간에 먼저 상황을
                설명하고 연결되는 무료 온라인 의료상담 창구입니다.
              </p>
              <p>
                보듬이가 먼저 내용을 정리하고, 필요하면 자원봉사 의료진이 같은 상담 흐름 안에서 확인합니다. 상담이
                시작되면 짧은 상태 코드가 함께 발급되어 나중에 직접 입력해 상태를 다시 볼 수 있습니다.
              </p>
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-white/10 p-4 text-sm leading-7 text-white/82">
              <p className="font-semibold text-white">이런 경우에 먼저 열어 보세요</p>
              <ul className="mt-3 space-y-2">
                <li>병원에 바로 가기 어렵거나, 먼저 어디에 설명해야 할지 막막할 때</li>
                <li>카카오톡이 익숙하지 않거나, 외국인/이주민 등 웹이 더 쉬운 경우</li>
                <li>같은 상담 흐름을 링크와 짧은 코드로 다시 확인하고 싶을 때</li>
              </ul>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--line)] bg-white/80 p-6 shadow-[0_24px_60px_rgba(8,34,55,0.08)] sm:p-7">
            <p className="display-face text-xs font-semibold uppercase tracking-[0.2em] text-[var(--blue)]">
              How It Works
            </p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--muted)]">
              <p>
                1. 가장 불편한 증상과 자세한 설명을 남깁니다.
                <br />
                2. 보듬이가 먼저 온라인 상담 흐름에 맞게 정리합니다.
                <br />
                3. 필요하면 자원봉사 의료진이 확인하고, 상태 화면에 답변이 이어집니다.
              </p>
              <p>
                카카오톡이 더 익숙하다면 언제든 카카오 채널로 이동해 이어서 상담할 수 있습니다. 웹 시작과 카카오 시작은
                서로 경쟁하는 경로가 아니라, 접근성을 넓히기 위한 두 가지 진입 방식입니다.
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
