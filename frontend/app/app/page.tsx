import Image from 'next/image'

const readinessItems = [
  {
    label: '상담 시작',
    title: '카카오톡에서 바로 진입',
    body: '지금 가장 익숙한 채널은 카카오톡입니다. 앱 셸은 그 흐름을 더 또렷하게 이어주는 역할부터 시작합니다.',
  },
  {
    label: '진행 확인',
    title: '상담 상태를 앱처럼 정리',
    body: '보듬이 정리, 의료진 검토, 답변 도착 여부를 나중에는 한 화면에서 확인할 수 있게 확장할 준비를 합니다.',
  },
  {
    label: '설치 경험',
    title: '가볍게 추가하는 웹앱',
    body: '무거운 앱 설치 대신 홈 화면에 추가할 수 있는 PWA 방향으로 먼저 설계해 접근 장벽을 낮춥니다.',
  },
]

const flowSteps = [
  {
    step: '01',
    title: '증상을 천천히 적습니다',
    copy: '복통, 발열, 어지러움처럼 지금 가장 불편한 내용을 카카오톡에서 편하게 적습니다.',
  },
  {
    step: '02',
    title: 'AI 인턴 보듬이가 정리합니다',
    copy: '보듬이는 주호소와 경과를 먼저 정리하고, 의료진이 이어보기 쉬운 형태로 묶어줍니다.',
  },
  {
    step: '03',
    title: '필요하면 의료진에게 바로 연결됩니다',
    copy: '긴급 판단이 필요한 경우 자원봉사 의료진이 직접 검토하고 더 신뢰할 수 있는 회신을 보냅니다.',
  },
]

const installNotes = [
  '안드로이드: Chrome 메뉴에서 “홈 화면에 추가”',
  'iPhone: Safari 공유 메뉴에서 “홈 화면에 추가”',
  '초기 버전은 상담 시작과 안내에 집중하고, 이후 상태 확인 기능을 확장합니다.',
]

export default function AppHomePage() {
  return (
    <main className="overflow-hidden">
      <section className="relative min-h-screen bg-[var(--surface)]">
        <div className="poster-orb left-[-4rem] top-8 h-56 w-56 bg-[#c6ecff]" />
        <div className="poster-orb bottom-20 right-[-3rem] h-64 w-64 bg-[#d9fff1]" />

        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-8">
          <header className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/90 p-2 shadow-[0_14px_26px_rgba(6,30,48,0.12)]">
                <Image src="/app-icon.png" alt="해피닥터 앱 아이콘" width={40} height={40} className="rounded-xl" />
              </div>
              <div>
                <p className="display-face text-sm font-semibold tracking-[0.2em] text-[var(--blue)]">APP</p>
                <h1 className="text-sm font-semibold text-[var(--ink)]">해피닥터 앱</h1>
              </div>
            </div>

            <a
              href="https://happydoctor.kr/ko"
              className="rounded-full border border-[var(--line)] bg-white/75 px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-white"
            >
              홈페이지 보기
            </a>
          </header>

          <div className="hero-grid flex-1 py-8 md:py-14">
            <div className="max-w-xl">
              <p className="display-face text-sm font-semibold uppercase tracking-[0.28em] text-[var(--blue)]">
                Mobile-first Consultation Shell
              </p>
              <h2 className="mt-5 text-5xl font-semibold leading-[1.04] tracking-[-0.04em] text-[var(--ink)] md:text-7xl">
                카카오에서 시작하고,
                <br />
                앱처럼 이어지는 상담
              </h2>
              <p className="mt-6 max-w-lg text-lg leading-8 text-[var(--muted)]">
                해피닥터 앱은 무거운 설치보다 더 빠른 진입을 먼저 선택합니다. 지금은 카카오 상담을 중심에 두고,
                이후에는 진행 상태와 회신 확인을 앱처럼 정돈해 보여줄 준비를 합니다.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="https://pf.kakao.com/_PxaTxhX"
                  className="signal-pulse rounded-full bg-[var(--signal)] px-6 py-3 text-sm font-semibold text-[#493500] shadow-[0_16px_26px_rgba(255,223,87,0.32)] transition hover:translate-y-[-1px]"
                >
                  카카오로 상담 시작
                </a>
                <a
                  href="#install"
                  className="rounded-full border border-[var(--line)] bg-white/82 px-6 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-white"
                >
                  설치 안내 보기
                </a>
              </div>

              <div className="mt-10 flex flex-wrap gap-6 text-sm text-[var(--muted)]">
                <div>
                  <p className="display-face text-3xl font-semibold text-[var(--navy)]">PWA</p>
                  <p className="mt-1">앱처럼 추가 가능한 웹앱 방향</p>
                </div>
                <div>
                  <p className="display-face text-3xl font-semibold text-[var(--navy)]">Kakao</p>
                  <p className="mt-1">바로 시작하는 현재 상담 채널</p>
                </div>
                <div>
                  <p className="display-face text-3xl font-semibold text-[var(--navy)]">AI + MD</p>
                  <p className="mt-1">보듬이 정리 후 의료진 연결</p>
                </div>
              </div>
            </div>

            <div className="poster-shell px-5 pb-6 pt-16 sm:px-8 sm:pb-8">
              <div className="chip-float absolute right-6 top-6 rounded-full bg-white/18 px-4 py-2 text-xs font-medium text-white backdrop-blur">
                APP READY · 상담 흐름 설계 중
              </div>
              <div className="chip-float absolute left-6 top-28 rounded-2xl bg-white/14 px-4 py-3 text-sm text-white backdrop-blur [animation-delay:0.8s]">
                보듬이가 먼저 정리하고
                <br />
                필요한 경우 의료진이 이어봅니다.
              </div>

              <div className="relative mx-auto flex max-w-sm justify-center">
                <div className="device-float relative w-full max-w-[21rem] rounded-[2.4rem] border border-white/20 bg-[#072846] p-3 shadow-[0_32px_60px_rgba(2,13,24,0.35)]">
                  <div className="rounded-[2rem] bg-[#edf6fb] p-4">
                    <div className="flex items-center justify-between rounded-[1.5rem] bg-white px-4 py-3 shadow-[0_14px_24px_rgba(11,38,62,0.08)]">
                      <div>
                        <p className="display-face text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--blue)]">
                          Happy Doctor
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[var(--ink)]">앱처럼 이어지는 상담 셸</p>
                      </div>
                      <Image src="/chatbot-character.png" alt="AI 인턴 보듬이 캐릭터" width={54} height={54} className="h-14 w-14 object-contain" />
                    </div>

                    <div className="mt-4 overflow-hidden rounded-[1.6rem] border border-[#d8eaf5] bg-white shadow-[0_16px_28px_rgba(11,38,62,0.06)]">
                      <Image
                        src="/app-screenshot.png"
                        alt="해피닥터 앱 화면 미리보기"
                        width={1179}
                        height={2556}
                        className="h-auto w-full"
                        priority
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/12 px-4 py-4 text-white backdrop-blur">
                  <p className="display-face text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Now</p>
                  <p className="mt-2 text-lg font-semibold">카카오 채널로 즉시 진입</p>
                  <p className="mt-2 text-sm leading-6 text-white/76">가장 익숙한 채널에서 상담을 시작하고, 앱 셸은 그 흐름을 더 정돈합니다.</p>
                </div>
                <div className="rounded-2xl bg-[#ffef95] px-4 py-4 text-[#514100] shadow-[0_16px_32px_rgba(255,223,87,0.25)]">
                  <p className="display-face text-xs font-semibold uppercase tracking-[0.22em] text-[#7b6600]">Next</p>
                  <p className="mt-2 text-lg font-semibold">상담 상태 확인 기능 확장</p>
                  <p className="mt-2 text-sm leading-6 text-[#5f5200]">답변 도착, 진행 현황, 알림 확인까지 앱처럼 이어지는 다음 단계를 준비합니다.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-divider bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="max-w-sm">
              <p className="display-face text-sm font-semibold uppercase tracking-[0.24em] text-[var(--blue)]">Readiness</p>
              <h3 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
                첫 버전은
                <br />
                무엇을 해야 하는지
              </h3>
              <p className="mt-4 text-base leading-7 text-[var(--muted)]">
                지금 필요한 것은 화려한 기능보다, 의료 취약계층이 망설이지 않고 상담을 시작하도록 돕는 안정적인 진입점입니다.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {readinessItems.map((item) => (
                <article key={item.title} className="soft-panel px-5 py-6">
                  <p className="display-face text-xs font-semibold uppercase tracking-[0.24em] text-[var(--blue)]">{item.label}</p>
                  <h4 className="mt-3 text-xl font-semibold text-[var(--ink)]">{item.title}</h4>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#f5fbff_0%,#eff6fb_100%)]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.92fr]">
            <div>
              <p className="display-face text-sm font-semibold uppercase tracking-[0.24em] text-[var(--blue)]">Flow</p>
              <h3 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
                상담은 이렇게
                <br />
                더 단순해집니다
              </h3>
              <div className="mt-8 space-y-4">
                {flowSteps.map((item) => (
                  <div key={item.step} className="soft-panel px-5 py-5">
                    <div className="flex items-start gap-4">
                      <span className="display-face rounded-full bg-[var(--navy)] px-3 py-1 text-xs font-semibold text-white">
                        {item.step}
                      </span>
                      <div>
                        <h4 className="text-lg font-semibold text-[var(--ink)]">{item.title}</h4>
                        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item.copy}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="soft-panel overflow-hidden px-5 py-5">
              <div className="rounded-[1.8rem] bg-[linear-gradient(180deg,#0d4f87_0%,#0d6296_100%)] p-5 text-white">
                <Image
                  src="/brand-banner.png"
                  alt="해피닥터 브랜드 배너"
                  width={1600}
                  height={900}
                  className="h-auto w-full rounded-[1.2rem] border border-white/10 object-cover"
                />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/10 px-4 py-4">
                    <p className="display-face text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Support</p>
                    <p className="mt-2 text-base font-semibold">한국어가 익숙하지 않아도</p>
                    <p className="mt-2 text-sm leading-6 text-white/78">문장을 정리하고 질문 순서를 잡아주어 더 쉽게 도움에 닿도록 돕습니다.</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-4">
                    <p className="display-face text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Trust</p>
                    <p className="mt-2 text-base font-semibold">무료 상담의 문턱을 낮추는 구조</p>
                    <p className="mt-2 text-sm leading-6 text-white/78">보듬이와 자원봉사 의료진이 함께 움직이며 필요한 판단은 사람에게 연결합니다.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="install" className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="soft-panel px-6 py-7">
              <p className="display-face text-sm font-semibold uppercase tracking-[0.24em] text-[var(--blue)]">Install</p>
              <h3 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
                필요할 때
                <br />
                홈 화면으로 더 가까이
              </h3>
              <ul className="mt-6 space-y-3 text-sm leading-7 text-[var(--muted)]">
                {installNotes.map((note) => (
                  <li key={note} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-[var(--blue)]" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="soft-panel px-6 py-7">
              <p className="display-face text-sm font-semibold uppercase tracking-[0.24em] text-[var(--blue)]">Next Surface</p>
              <h3 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
                앞으로 이 앱에서
                <br />
                보이게 될 것들
              </h3>
              <div className="mt-6 space-y-4 text-sm leading-7 text-[var(--muted)]">
                <div>
                  <p className="font-semibold text-[var(--ink)]">상담 진행 상태</p>
                  <p>보듬이 정리 중인지, 의료진이 확인 중인지, 답변이 도착했는지를 더 명확하게 보여주는 화면.</p>
                </div>
                <div>
                  <p className="font-semibold text-[var(--ink)]">답변 확인과 재진입</p>
                  <p>상담이 길어져도 같은 링크와 같은 홈 화면 아이콘으로 다시 들어올 수 있는 재진입 동선.</p>
                </div>
                <div>
                  <p className="font-semibold text-[var(--ink)]">다국어 안내 확장</p>
                  <p>한국어에 익숙하지 않은 분들을 위한 짧은 다국어 안내와 쉬운 표현 중심의 진입 화면.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-[2rem] bg-[var(--navy)] px-6 py-7 text-white shadow-[0_24px_55px_rgba(7,28,49,0.18)]">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <p className="display-face text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Start Now</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">지금 상담은 카카오톡에서 시작됩니다</h3>
                <p className="mt-3 text-sm leading-7 text-white/76">
                  해피닥터 앱은 아직 첫 번째 셸입니다. 하지만 필요한 도움에 더 빨리 닿게 하려는 흐름은 이미 시작되어 있습니다.
                </p>
              </div>
              <a
                href="https://pf.kakao.com/_PxaTxhX"
                className="rounded-full bg-[var(--signal)] px-6 py-3 text-sm font-semibold text-[#493500] transition hover:translate-y-[-1px]"
              >
                카카오 채널 열기
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
