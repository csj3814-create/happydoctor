import Image from 'next/image'
import Link from 'next/link'

const KAKAO_CHAT_URL = 'https://pf.kakao.com/_PxaTxhX/chat'
const WEB_START_URL = '/start?source=app'

const heroPoints = [
  '의료 접근성 취약계층을 위한 무료 온라인 의료상담',
  '웹과 카카오톡 중 편한 곳에서 바로 시작',
  '답변이 오면 상태 확인 화면과 카카오 채널에서 다시 확인',
]

const supportPoints = [
  '병원에 바로 가기 어렵거나 어디서부터 설명해야 할지 막막한 분',
  '이주민, 농어촌 주민, 고령층, 다문화가정처럼 의료가 더 멀게 느껴지는 분',
  '혼자 견디기보다 먼저 상황을 설명하고 방향을 잡고 싶은 분',
]

const processSteps = [
  {
    step: '01',
    title: '증상과 걱정을 보냅니다',
    body: '웹이나 카카오톡에서 지금 가장 불편한 점을 적습니다.',
  },
  {
    step: '02',
    title: '보듬이가 먼저 정리합니다',
    body: '설명이 길지 않아도 핵심 흐름을 읽기 좋게 정리합니다.',
  },
  {
    step: '03',
    title: '필요하면 의료진이 답변합니다',
    body: '자원봉사 의료진이 직접 읽고 답변과 다음 행동 방향을 전합니다.',
  },
  {
    step: '04',
    title: '링크나 6자리 코드로 다시 확인합니다',
    body: '상태 확인 화면에서 현재 단계와 최근 답변을 다시 볼 수 있습니다.',
  },
]

const installTips = [
  'Android Chrome에서는 메뉴에서 홈 화면 추가를 누르면 앱처럼 둘 수 있습니다.',
  'iPhone Safari에서는 공유 메뉴의 홈 화면에 추가로 바로가기 설치가 가능합니다.',
  '설치하지 않아도 상담 시작과 상태 확인은 그대로 이용할 수 있습니다.',
]

export default function AppHomePage() {
  return (
    <main className="overflow-hidden bg-[var(--surface)]">
      <section className="app-hero relative isolate min-h-screen overflow-hidden bg-[var(--surface)]">
        <div className="hero-orb left-[-4rem] top-[4rem] h-56 w-56 bg-[#d0ecff]" />
        <div className="hero-orb bottom-[-1rem] right-[-3rem] h-72 w-72 bg-[#d9fff2]" />

        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 pb-10 pt-5 sm:px-8">
          <header className="flex flex-col gap-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="rounded-2xl bg-white/90 p-2 shadow-[0_14px_26px_rgba(6,30,48,0.12)]">
                <Image
                  src="/app-icon.png"
                  alt="해피닥터 앱 아이콘"
                  width={40}
                  height={40}
                  className="rounded-xl"
                />
              </div>
              <div className="min-w-0">
                <p className="display-face whitespace-nowrap text-[10px] font-semibold tracking-[0.18em] text-[var(--blue)] sm:text-[11px] sm:tracking-[0.24em]">
                  HAPPY DOCTOR APP
                </p>
                <h1 className="text-sm font-semibold text-[var(--ink)]">해피닥터 앱</h1>
              </div>
            </div>

            <a
              href="https://happydoctor.kr/ko"
              className="inline-flex min-h-[3rem] min-w-[9.5rem] items-center justify-center self-start whitespace-nowrap rounded-full border border-[var(--line)] bg-white/75 px-5 py-3 text-[15px] font-semibold text-[var(--ink)] transition hover:bg-white sm:min-h-0 sm:min-w-0 sm:self-auto sm:px-4 sm:py-2 sm:text-sm"
            >
              홈페이지 보기
            </a>
          </header>

          <div className="hero-grid flex-1 py-8 md:py-12">
            <div className="max-w-xl lg:pb-8">
              <div className="reveal-0 flex flex-wrap gap-2 sm:gap-3">
                <span className="whitespace-nowrap rounded-full border border-[var(--line)] bg-white/80 px-4 py-1.5 text-[13px] font-semibold text-[var(--blue)] sm:px-3 sm:py-1 sm:text-xs">
                  Mobile-first
                </span>
                <span className="whitespace-nowrap rounded-full border border-[var(--line)] bg-white/80 px-4 py-1.5 text-[13px] font-semibold text-[var(--blue)] sm:px-3 sm:py-1 sm:text-xs">
                  Web + Kakao
                </span>
              </div>

              <p className="reveal-0 mt-6 display-face text-sm font-semibold uppercase tracking-[0.28em] text-[var(--blue)]">
                온라인 의료상담
              </p>
              <h2 className="reveal-1 mt-4 text-[clamp(2.55rem,10vw,4.75rem)] font-semibold leading-[0.94] tracking-[-0.06em] text-[var(--ink)] md:text-7xl md:leading-[1.02]">
                의료가 멀게 느껴질 때,
                <br />
                먼저 닿는
                <br />
                온라인 의료상담
              </h2>
              <p className="reveal-2 mt-6 max-w-lg text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
                병원에 가기 전 먼저 설명하고 도움을 청할 수 있도록, 해피닥터가 웹과 카카오톡에서 상담을 이어 줍니다.
              </p>

              <div className="reveal-2 mt-8 flex max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap">
                <Link
                  href={WEB_START_URL}
                  className="inline-flex min-h-[3.5rem] w-full items-center justify-center whitespace-nowrap rounded-full bg-[var(--navy)] px-6 py-3 text-base font-semibold text-white visited:text-white shadow-[0_16px_26px_rgba(12,68,124,0.28)] transition hover:translate-y-[-1px] sm:min-h-0 sm:w-auto sm:text-sm"
                  style={{ color: '#ffffff' }}
                >
                  웹으로 상담 시작
                </Link>
                <a
                  href={KAKAO_CHAT_URL}
                  className="signal-pulse inline-flex min-h-[3.5rem] w-full items-center justify-center whitespace-nowrap rounded-full bg-[var(--signal)] px-6 py-3 text-base font-semibold text-[var(--ink)] visited:text-[var(--ink)] shadow-[0_16px_26px_rgba(255,223,87,0.32)] transition hover:translate-y-[-1px] sm:min-h-0 sm:w-auto sm:text-sm"
                  style={{ color: 'var(--ink)' }}
                >
                  카카오톡으로 상담하기
                </a>
                <Link
                  href="/status"
                  className="inline-flex min-h-[3.5rem] w-full items-center justify-center whitespace-nowrap rounded-full border border-[var(--line)] bg-white/82 px-6 py-3 text-base font-semibold text-[var(--ink)] transition hover:bg-white sm:min-h-0 sm:w-auto sm:text-sm"
                >
                  상태 확인하기
                </Link>
              </div>

              <p className="reveal-2 mt-6 text-xs leading-6 text-[var(--muted)]">
                응급 증상은 119 또는 응급실이 우선입니다. 해피닥터는 응급을 대신하는 서비스가 아니라, 의료가 더 멀게
                느껴지는 분들이 온라인으로 먼저 도움을 청할 수 있게 돕는 상담 서비스입니다.
              </p>

              <div className="reveal-2 mt-10 space-y-3 border-t border-[var(--line)] pt-6">
                {heroPoints.map((item) => (
                  <div key={item} className="flex gap-3 text-sm leading-7 text-[var(--muted)]">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[var(--blue)]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="reveal-2 relative lg:pl-10">
              <div className="hero-stage">
                <div className="relative mx-auto flex max-w-[22rem] justify-center md:max-w-[24rem]">
                  <div className="phone-shell">
                    <div className="rounded-[2rem] bg-[#edf6fb] p-4">
                      <div className="flex items-center justify-between rounded-[1.4rem] bg-white px-4 py-3 shadow-[0_14px_24px_rgba(11,38,62,0.08)]">
                        <div>
                          <p className="display-face text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--blue)]">
                            Happy Doctor
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[var(--ink)]">
                            필요한 곳에 먼저 닿는 상담 창구
                          </p>
                        </div>
                        <Image
                          src="/chatbot-character.png"
                          alt="AI 인턴 보듬이 캐릭터"
                          width={54}
                          height={54}
                          className="h-14 w-14 object-contain"
                        />
                      </div>

                      <div className="phone-screen mt-4">
                        <div className="rounded-[1.35rem] bg-[linear-gradient(180deg,#e9f6ff_0%,#f8fcff_100%)] p-4">
                          <div className="rounded-[1.3rem] bg-white p-4 shadow-[0_14px_24px_rgba(11,38,62,0.07)]">
                            <p className="display-face text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--blue)]">
                              상담 흐름
                            </p>
                            <div className="mt-4 space-y-3">
                              <div className="rounded-[1rem] bg-[var(--surface)] px-3 py-3 text-sm leading-6 text-[var(--ink)]">
                                증상과 걱정을 먼저 보냅니다.
                              </div>
                              <div className="rounded-[1rem] bg-[var(--sky)] px-3 py-3 text-sm leading-6 text-[var(--ink)]">
                                보듬이가 정리하고 필요하면 의료진이 답변합니다.
                              </div>
                              <div className="rounded-[1rem] bg-[var(--navy)] px-3 py-3 text-sm leading-6 text-white">
                                링크나 6자리 코드로 상태를 다시 확인합니다.
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 rounded-[1.3rem] bg-white px-4 py-3 shadow-[0_12px_20px_rgba(11,38,62,0.06)]">
                            <p className="text-sm font-semibold text-[var(--ink)]">무료 온라인 의료상담</p>
                            <p className="mt-2 text-[13px] leading-6 text-[var(--muted)]">
                              웹과 카카오톡 중 편한 곳에서 시작하고, 같은 흐름을 다시 확인할 수 있습니다.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="soft-panel px-6 py-7">
              <p className="display-face text-sm font-semibold uppercase tracking-[0.24em] text-[var(--blue)]">
                누구를 위한 상담인가요
              </p>
              <h3 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                의료가 더 멀게
                <br />
                느껴지는 분들을 위한 창구입니다
              </h3>
              <ul className="mt-6 space-y-3 text-sm leading-7 text-[var(--muted)]">
                {supportPoints.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[var(--blue)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[2rem] border border-[var(--line)] bg-[linear-gradient(145deg,#f8fbff_0%,#edf6fb_100%)] p-6 shadow-[0_24px_60px_rgba(8,34,55,0.08)] lg:p-8">
              <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr]">
                <div>
                  <p className="display-face text-sm font-semibold uppercase tracking-[0.24em] text-[var(--blue)]">
                    이용 흐름
                  </p>
                  <div className="timeline-list mt-6 space-y-5">
                    {processSteps.map((item) => (
                      <div key={item.step} className="timeline-row pl-8">
                        <span className="timeline-dot display-face">{item.step}</span>
                        <h4 className="text-lg font-semibold text-[var(--ink)]">{item.title}</h4>
                        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item.body}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.7rem] bg-white p-5 shadow-[0_18px_40px_rgba(8,34,55,0.08)]">
                  <p className="display-face text-sm font-semibold uppercase tracking-[0.24em] text-[var(--blue)]">
                    상태 확인
                  </p>
                  <h4 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                    링크나 코드로
                    <br />
                    다시 확인하세요
                  </h4>
                  <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                    받은 링크를 그대로 열거나 6자리 코드를 직접 입력하면 현재 상태와 최근 답변을 다시 볼 수 있습니다.
                  </p>

                  <form action="/status" className="mt-5 grid gap-3">
                    <input
                      type="text"
                      name="lookup"
                      placeholder="받은 링크 또는 코드"
                      className="w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white"
                    />
                    <button
                      type="submit"
                      className="rounded-[1.1rem] bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white visited:text-white transition hover:bg-[#123c67]"
                      style={{ color: '#ffffff' }}
                    >
                      상태 확인
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#f5fbff_0%,#eef5fa_100%)]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
            <div className="soft-panel px-6 py-7">
              <p className="display-face text-sm font-semibold uppercase tracking-[0.24em] text-[var(--blue)]">
                설치 안내
              </p>
              <h3 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                필요하다면
                <br />
                홈 화면으로 더 가깝게
              </h3>
              <ul className="mt-6 space-y-3 text-sm leading-7 text-[var(--muted)]">
                {installTips.map((tip) => (
                  <li key={tip} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[var(--blue)]" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[2rem] bg-[var(--navy)] px-6 py-7 text-white shadow-[0_24px_55px_rgba(7,28,49,0.18)]">
              <p className="display-face text-sm font-semibold uppercase tracking-[0.24em] text-white/68">
                시작하기
              </p>
              <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                지금 필요한 행동만
                <br />
                바로 고르세요
              </h3>
              <p className="mt-4 text-sm leading-7 text-white/78">
                새 상담을 시작하거나, 익숙한 카카오톡 채널로 들어가거나, 이미 받은 코드로 상태를 다시 확인하면 됩니다.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={WEB_START_URL}
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--ink)] visited:text-[var(--ink)] transition hover:translate-y-[-1px]"
                  style={{ color: 'var(--ink)' }}
                >
                  웹으로 상담 시작
                </Link>
                <a
                  href={KAKAO_CHAT_URL}
                  className="rounded-full bg-[var(--signal)] px-6 py-3 text-sm font-semibold text-[var(--ink)] visited:text-[var(--ink)] transition hover:translate-y-[-1px]"
                  style={{ color: 'var(--ink)' }}
                >
                  카카오톡 채널 열기
                </a>
                <Link
                  href="/status"
                  className="rounded-full border border-white/18 px-6 py-3 text-sm font-semibold text-white visited:text-white transition hover:bg-white/8"
                  style={{ color: '#ffffff' }}
                >
                  상태 확인
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
