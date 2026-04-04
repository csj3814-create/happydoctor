import Link from 'next/link'
import Image from 'next/image'

const trustSignals = [
  {
    label: '의료 접근성 취약계층 중심',
    value: '이주민, 농어촌 주민, 고령층, 다문화가정처럼 의료가 더 멀게 느껴지는 분들과 함께합니다.',
  },
  {
    label: '무료 온라인 의료상담',
    value: '비용과 거리 때문에 망설이는 순간, 온라인으로 먼저 도움에 닿도록 돕습니다.',
  },
  {
    label: 'AI 인턴 보듬이 + 의료진',
    value: '보듬이가 내용을 정리하고 자원봉사 의료진이 직접 확인해 답변합니다.',
  },
]

const careGroups = [
  {
    title: '병원에 가기 전, 먼저 설명할 곳이 필요한 분',
    body: '갑자기 아픈데 어디로 가야 할지, 무엇을 먼저 말해야 할지 막막한 순간에 온라인으로 먼저 묻고 정리할 수 있습니다.',
  },
  {
    title: '언어, 거리, 경제적 이유로 의료가 더 멀게 느껴지는 분',
    body: '이주민, 외국인, 농어촌 주민, 고령층처럼 의료 접근에 장벽이 큰 분들에게 낮은 진입장벽을 만드는 것이 해피닥터의 목적입니다.',
  },
  {
    title: '혼자 견디기보다 누군가와 먼저 상의가 필요한 분',
    body: '당장 병원 방문이 어렵더라도 자원봉사 의료진과 연결된 온라인 상담 흐름 안에서 다음 방향을 함께 생각할 수 있습니다.',
  },
]

const processSteps = [
  {
    step: '01',
    title: '카카오톡으로 걱정과 증상을 편하게 보냅니다',
    body: '복통, 발열, 어지러움처럼 지금 불편한 점을 평소 말하듯 보내면 상담이 시작됩니다.',
  },
  {
    step: '02',
    title: 'AI 인턴 보듬이가 설명 부담을 줄이도록 정리합니다',
    body: '긴 설명을 한 번에 하지 못해도 괜찮습니다. 보듬이가 핵심을 정리해 의료진이 읽기 쉬운 흐름으로 돕습니다.',
  },
  {
    step: '03',
    title: '필요하면 자원봉사 의료진이 직접 답변합니다',
    body: '의료진 확인이 필요한 상담은 자원봉사 의료진이 직접 읽고 답변과 다음 행동 방향을 전합니다.',
  },
  {
    step: '04',
    title: '앱과 카카오톡에서 같은 상담 흐름을 이어 확인합니다',
    body: '상담은 카카오톡에서 이어지고, 앱에서는 같은 상담의 진행 상태와 답변 도착 여부를 다시 확인할 수 있습니다.',
  },
]

const availableNow = [
  '카카오톡 채널에서 무료 온라인 의료상담 시작',
  '의료 접근성 취약계층 중심 안내와 연결',
  'AI 인턴 보듬이와 자원봉사 의료진 협업',
  '상태 확인 링크로 같은 상담 흐름 다시 열기',
]

const availableNext = [
  '읽음 여부와 후속 안내 정리',
  '홈 화면 설치 후 더 가벼운 재방문 흐름',
  '다국어 안내와 앱 내부 도움말 확장',
]

const carePromises = [
  {
    label: '누구를 위한 서비스인가요',
    body: '의료 접근성 취약계층이 병원에 가기 전, 먼저 설명하고 도움을 청할 수 있는 온라인 의료상담 창구입니다.',
  },
  {
    label: '상담은 어떻게 이어지나요',
    body: '카카오톡에서 시작하고, AI 인턴 보듬이가 정리한 뒤 자원봉사 의료진이 필요한 상담을 직접 확인합니다.',
  },
  {
    label: '앱은 어떤 역할을 하나요',
    body: '같은 상담 흐름을 다시 열고, 진행 상태와 답변 도착 여부를 더 가깝게 확인하도록 돕습니다.',
  },
]

const brandPrinciples = [
  '해피닥터는 의료가 더 멀게 느껴지는 사람에게 먼저 닿습니다.',
  '무료 온라인 의료상담으로 설명 부담과 거리 장벽을 낮춥니다.',
  'AI 인턴 보듬이와 자원봉사 의료진이 함께 움직입니다.',
]

const installTips = [
  'Android Chrome에서는 메뉴에서 홈 화면 추가를 누르면 앱처럼 둘 수 있습니다.',
  'iPhone Safari에서는 공유 메뉴의 홈 화면에 추가로 바로가기 설치가 가능합니다.',
  '설치하지 않아도 괜찮습니다. 지금은 카카오톡 상담 진입이 가장 빠른 경로입니다.',
]

const faqItems = [
  {
    question: '앱을 꼭 설치해야 하나요?',
    answer:
      '아니요. 해피닥터 앱은 무료 온라인 의료상담을 더 쉽게 이어주는 웹앱입니다. 지금 상담 시작은 카카오톡에서, 상태 확인은 앱에서 다시 열 수 있습니다.',
  },
  {
    question: '비용이 드나요?',
    answer:
      '해피닥터는 의료 취약계층을 위한 무료 온라인 의료상담 서비스입니다. 비용보다 먼저 방향을 찾을 수 있게 돕는 데 초점을 둡니다.',
  },
  {
    question: '응급 상황도 여기서 상담하면 되나요?',
    answer:
      '아니요. 호흡곤란, 의식 저하, 심한 흉통, 심한 출혈처럼 응급이 의심되면 119 또는 가까운 응급실을 먼저 이용해야 합니다.',
  },
  {
    question: '답변은 누가 보나요?',
    answer:
      'AI 인턴 보듬이가 먼저 내용을 정리하고, 필요한 경우 자원봉사 의료진이 직접 검토해 답변을 이어갑니다.',
  },
]

export default function AppHomePage() {
  return (
    <main className="overflow-hidden bg-[var(--surface)]">
      <section className="app-hero relative isolate min-h-screen overflow-hidden bg-[var(--surface)]">
        <div className="hero-orb left-[-4rem] top-[4rem] h-56 w-56 bg-[#d0ecff]" />
        <div className="hero-orb bottom-[-1rem] right-[-3rem] h-72 w-72 bg-[#d9fff2]" />

        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 pb-10 pt-5 sm:px-8">
          <header className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/90 p-2 shadow-[0_14px_26px_rgba(6,30,48,0.12)]">
                <Image
                  src="/app-icon.png"
                  alt="해피닥터 앱 아이콘"
                  width={40}
                  height={40}
                  className="rounded-xl"
                />
              </div>
              <div>
                <p className="display-face text-[11px] font-semibold tracking-[0.24em] text-[var(--blue)]">
                  HAPPY DOCTOR APP
                </p>
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

          <div className="hero-grid flex-1 py-8 md:py-12">
            <div className="max-w-xl lg:pb-8">
              <div className="reveal-0 flex flex-wrap gap-2">
                <span className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--blue)]">
                  Mobile-first
                </span>
                <span className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--blue)]">
                  Kakao Consultation
                </span>
              </div>

              <p className="reveal-0 mt-6 display-face text-sm font-semibold uppercase tracking-[0.28em] text-[var(--blue)]">
                Patient Web App
              </p>
              <h2 className="reveal-1 mt-4 text-5xl font-semibold leading-[1.02] tracking-[-0.05em] text-[var(--ink)] md:text-7xl">
                의료가 멀게 느껴질 때,
                <br />
                먼저 닿는
                <br />
                온라인 의료상담
              </h2>
              <p className="reveal-2 mt-6 max-w-lg text-lg leading-8 text-[var(--muted)]">
                해피닥터 앱은 의료 접근성 취약계층을 위한 무료 온라인 의료상담 서비스입니다. AI 인턴 보듬이와
                자원봉사 의료진이 함께 움직이며, 병원에 가기 전 막막한 순간 더 빨리 도움에 닿도록 돕습니다.
              </p>

              <div className="reveal-2 mt-8 flex flex-wrap gap-3">
                <a
                  href="https://pf.kakao.com/_PxaTxhX"
                  className="signal-pulse rounded-full bg-[var(--signal)] px-6 py-3 text-sm font-semibold text-[#493500] shadow-[0_16px_26px_rgba(255,223,87,0.32)] transition hover:translate-y-[-1px]"
                >
                  카카오톡으로 상담 시작
                </a>
                <Link
                  href="/status"
                  className="rounded-full border border-[var(--line)] bg-white/82 px-6 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-white"
                >
                  상태 확인하기
                </Link>
              </div>

              <p className="reveal-2 mt-6 text-xs leading-6 text-[var(--muted)]">
                응급 증상은 119 또는 응급실이 우선입니다. 해피닥터는 응급을 대신하는 서비스가 아니라, 의료가 더 멀게
                느껴지는 분들이 온라인으로 먼저 도움을 청할 수 있게 돕는 상담 서비스입니다.
              </p>

              <div className="reveal-2 mt-10 grid gap-4 border-y border-[var(--line)] py-6 sm:grid-cols-3">
                {trustSignals.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <p className="display-face text-sm font-semibold tracking-[0.12em] text-[var(--navy)]">
                      {item.label}
                    </p>
                    <p className="text-sm leading-6 text-[var(--muted)]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="reveal-2 relative lg:pl-10">
              <div className="hero-stage">
                <div className="floating-label right-5 top-5">
                  상담 시작은 카카오톡에서
                </div>
                <div className="floating-label left-5 top-24 [animation-delay:0.8s]">
                  보듬이가 먼저 읽기 좋게 정리합니다
                </div>

                <div className="relative mx-auto flex max-w-[22rem] justify-center md:max-w-[24rem]">
                  <div className="phone-shell">
                    <div className="rounded-[2rem] bg-[#edf6fb] p-4">
                      <div className="flex items-center justify-between rounded-[1.4rem] bg-white px-4 py-3 shadow-[0_14px_24px_rgba(11,38,62,0.08)]">
                        <div>
                          <p className="display-face text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--blue)]">
                            Happy Doctor
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[var(--ink)]">
                            도움이 필요한 곳에 먼저 닿도록
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
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[var(--navy)] px-3 py-1 text-[11px] font-semibold text-white">
                              무료 온라인 의료상담
                            </span>
                            <span className="rounded-full border border-[#c9deeb] bg-white/84 px-3 py-1 text-[11px] font-semibold text-[var(--blue)]">
                              AI 인턴 보듬이 + 의료진
                            </span>
                          </div>

                          <div className="mt-4 rounded-[1.3rem] bg-white p-4 shadow-[0_14px_24px_rgba(11,38,62,0.07)]">
                            <p className="display-face text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--blue)]">
                              First Contact
                            </p>
                            <p className="mt-2 text-lg font-semibold leading-7 text-[var(--ink)]">
                              병원에 바로 가기 어렵거나,
                              <br />
                              먼저 설명할 곳이 필요할 때
                            </p>
                            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                              해피닥터는 의료 접근성 취약계층이 온라인으로 먼저 도움에 닿도록 돕는 상담 서비스입니다.
                            </p>
                          </div>

                          <div className="mt-4 space-y-3">
                            {carePromises.map((item, index) => (
                              <div
                                key={item.label}
                                className="rounded-[1.2rem] border border-[#d4e6f2] bg-white/92 px-4 py-3 shadow-[0_12px_20px_rgba(11,38,62,0.05)]"
                              >
                                <div className="flex items-start gap-3">
                                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[var(--sky)] text-[11px] font-semibold text-[var(--navy)]">
                                    0{index + 1}
                                  </span>
                                  <div>
                                    <p className="text-sm font-semibold text-[var(--ink)]">{item.label}</p>
                                    <p className="mt-1 text-[13px] leading-6 text-[var(--muted)]">{item.body}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 rounded-[1.3rem] bg-[var(--navy)] px-4 py-3 text-white">
                            <p className="text-sm font-semibold">응급을 대신하지는 않지만, 먼저 도움을 청할 수는 있습니다.</p>
                            <p className="mt-2 text-[13px] leading-6 text-white/78">
                              상담은 카카오톡에서 시작되고, 앱은 같은 흐름을 다시 확인하는 연결면으로 작동합니다.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 border-t border-white/18 pt-5 text-white/82 sm:grid-cols-2">
                  <div>
                    <p className="display-face text-xs font-semibold uppercase tracking-[0.22em] text-white/58">
                      Now
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">무료 온라인 의료상담을 지금 시작</p>
                    <p className="mt-2 text-sm leading-6">
                      지금은 가장 익숙한 카카오톡 채널에서 상담을 시작하고, 앱은 같은 상담 흐름을 다시 확인하는 역할을 합니다.
                    </p>
                  </div>
                  <div>
                    <p className="display-face text-xs font-semibold uppercase tracking-[0.22em] text-white/58">
                      Next
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">재방문과 후속 안내 흐름 확장</p>
                    <p className="mt-2 text-sm leading-6">
                      지금은 상태 확인을 먼저 붙였고, 다음으로는 읽음 여부와 후속 안내를 더 자연스럽게 보강합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
          <div className="grid gap-6 rounded-[2rem] border border-[var(--line)] bg-[linear-gradient(145deg,#f8fbff_0%,#edf6fb_100%)] p-6 shadow-[0_24px_60px_rgba(8,34,55,0.08)] lg:grid-cols-[0.84fr_1.16fr] lg:p-8">
            <div>
              <p className="display-face text-sm font-semibold uppercase tracking-[0.24em] text-[var(--blue)]">
                Status Check
              </p>
              <h3 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                상담이 시작된 뒤에도
                <br />
                같은 흐름을 다시 확인하세요
              </h3>
              <p className="mt-4 max-w-md text-sm leading-7 text-[var(--muted)]">
                카카오톡에서 받은 상태 확인 링크를 다시 열거나 코드만 붙여넣어도, 현재 상담 단계와 의료진 답변 도착
                여부를 이어서 확인할 수 있습니다.
              </p>
            </div>

            <div className="rounded-[1.7rem] bg-white p-5 shadow-[0_18px_40px_rgba(8,34,55,0.08)]">
              <form action="/status" className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  type="text"
                  name="token"
                  placeholder="카카오톡에서 받은 상태 확인 링크 또는 코드"
                  className="w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white"
                />
                <button
                  type="submit"
                  className="rounded-[1.1rem] bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123c67]"
                >
                  상태 확인
                </button>
              </form>
              <div className="mt-4 grid gap-3 text-sm leading-7 text-[var(--muted)] sm:grid-cols-2">
                <p>상담 직후 받은 링크를 그대로 열면 가장 빠르게 같은 상담 기록으로 돌아올 수 있습니다.</p>
                <p>앱이 설치되어 있지 않아도 괜찮고, 카카오톡에서 이어진 무료 온라인 의료상담 흐름을 다시 여는 용도입니다.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-line bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr]">
            <div className="max-w-sm">
              <p className="display-face text-sm font-semibold uppercase tracking-[0.24em] text-[var(--blue)]">
                Who It Serves
              </p>
              <h3 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                해피닥터는
                <br />
                누구를 위해 움직이나요
              </h3>
              <p className="mt-4 text-base leading-7 text-[var(--muted)]">
                해피닥터는 의료를 더 쉽게 쓰는 사람보다, 의료가 멀게 느껴지는 사람에게 먼저 닿는 것을 기준으로 움직입니다.
              </p>
            </div>

            <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {careGroups.map((group, index) => (
                <div key={group.title} className="grid gap-3 py-6 md:grid-cols-[72px_1fr] md:gap-6">
                  <p className="display-face text-2xl font-semibold text-[var(--navy)]">
                    0{index + 1}
                  </p>
                  <div>
                    <h4 className="text-xl font-semibold text-[var(--ink)]">{group.title}</h4>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">{group.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#f5fbff_0%,#eef5fa_100%)]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr]">
            <div>
              <p className="display-face text-sm font-semibold uppercase tracking-[0.24em] text-[var(--blue)]">
                Consultation Flow
              </p>
              <h3 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                상담은 이렇게
                <br />
                차분하게 이어집니다
              </h3>
              <div className="timeline-list mt-8 space-y-6">
                {processSteps.map((item) => (
                  <div key={item.step} className="timeline-row pl-8">
                    <span className="timeline-dot display-face">{item.step}</span>
                    <h4 className="text-xl font-semibold text-[var(--ink)]">{item.title}</h4>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="editorial-band">
                <div className="space-y-4">
                  <p className="display-face text-sm font-semibold uppercase tracking-[0.24em] text-white/68">
                    Brand Surface
                  </p>
                  <h3 className="text-3xl font-semibold tracking-[-0.04em] text-white">
                    제비처럼, 필요한 곳에 닿는 의료
                  </h3>
                  <p className="max-w-md text-sm leading-7 text-white/78">
                    해피닥터는 질문을 분류하는 도구가 아니라, 의료가 더 멀게 느껴지는 사람에게 먼저 닿는 상담 창구여야
                    합니다. 이 화면은 그 정체성과 실제 진입 흐름을 함께 보여줍니다.
                  </p>
                </div>

                <div className="brand-mission-card">
                  <div className="space-y-4">
                    <div>
                      <p className="display-face text-xs font-semibold uppercase tracking-[0.22em] text-white/62">
                        Care Promise
                      </p>
                      <h4 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                        의료가 닿기 어려운 순간,
                        <br />
                        먼저 열려 있는 상담 창구
                      </h4>
                    </div>

                    <ul className="space-y-3 text-sm leading-7 text-white/82">
                      {brandPrinciples.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span className="mt-2 h-2 w-2 rounded-full bg-[var(--signal)]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="brand-character-wrap">
                    <div className="brand-character-ring" />
                    <Image
                      src="/chatbot-character.png"
                      alt="AI 인턴 보듬이 캐릭터"
                      width={220}
                      height={220}
                      className="brand-character"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="soft-panel px-5 py-6">
                  <p className="display-face text-xs font-semibold uppercase tracking-[0.22em] text-[var(--blue)]">
                    Available Now
                  </p>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
                    {availableNow.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 h-2 w-2 rounded-full bg-[var(--blue)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="soft-panel px-5 py-6">
                  <p className="display-face text-xs font-semibold uppercase tracking-[0.22em] text-[var(--blue)]">
                    Coming Next
                  </p>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
                    {availableNext.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 h-2 w-2 rounded-full bg-[var(--signal)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr]">
            <div>
              <p className="display-face text-sm font-semibold uppercase tracking-[0.24em] text-[var(--blue)]">
                FAQ
              </p>
              <h3 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                시작하기 전에
                <br />
                자주 묻는 안내
              </h3>
              <div className="mt-8 space-y-3">
                {faqItems.map((item) => (
                  <details key={item.question} className="faq-item group">
                    <summary className="faq-summary">
                      <span>{item.question}</span>
                      <span className="faq-plus">+</span>
                    </summary>
                    <p className="faq-answer">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="soft-panel px-6 py-7">
                <p className="display-face text-sm font-semibold uppercase tracking-[0.24em] text-[var(--blue)]">
                  Install
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
                  Start Now
                </p>
                <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                  상담은 지금
                  <br />
                  카카오톡에서 시작합니다
                </h3>
                <p className="mt-4 text-sm leading-7 text-white/78">
                  해피닥터 앱은 의료 접근성 취약계층을 위한 무료 온라인 의료상담을 더 쉽게 이어가기 위한 첫 공개
                  단계입니다. 상담은 지금 카카오톡에서 바로 시작할 수 있습니다.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="https://pf.kakao.com/_PxaTxhX"
                    className="rounded-full bg-[var(--signal)] px-6 py-3 text-sm font-semibold text-[#493500] transition hover:translate-y-[-1px]"
                  >
                    카카오톡 채널 열기
                  </a>
                  <a
                    href="https://happydoctor.kr/ko"
                    className="rounded-full border border-white/18 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/8"
                  >
                    공식 홈페이지 보기
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
