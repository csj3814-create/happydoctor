import Link from 'next/link'
import Image from 'next/image'

const trustSignals = [
  {
    label: '무료 온라인 상담',
    value: '비용보다 방향이 먼저 필요한 분들을 위한 진입면',
  },
  {
    label: '카카오톡에서 바로 시작',
    value: '새로운 가입 절차 없이 지금 익숙한 채널로 연결',
  },
  {
    label: 'AI 인턴 보듬이 + 의료진',
    value: '보듬이가 먼저 정리하고 필요하면 의료진이 이어서 확인',
  },
]

const careGroups = [
  {
    title: '병원에 가기 전, 먼저 물어볼 곳이 필요한 분',
    body: '증상이 심한지, 어디부터 가야 하는지, 어떤 말을 먼저 정리해야 하는지 막막한 순간의 첫 질문 창구를 만듭니다.',
  },
  {
    title: '설명과 접수 과정이 부담스러운 분',
    body: '긴 문장을 한 번에 잘 말하지 못해도 괜찮습니다. 보듬이가 핵심을 다시 정리해 의료진이 읽기 쉬운 형태로 이어 줍니다.',
  },
  {
    title: '의료 접근이 더 어려운 분',
    body: '이주민, 외국인, 농어촌 주민, 고령층처럼 설명 창구가 더 멀게 느껴지는 분들에게 낮은 진입장벽을 목표로 합니다.',
  },
]

const processSteps = [
  {
    step: '01',
    title: '카카오톡으로 지금 불편한 점을 보냅니다',
    body: '복통, 발열, 어지러움처럼 현재 증상과 걱정을 평소 말하듯 적어도 됩니다.',
  },
  {
    step: '02',
    title: 'AI 인턴 보듬이가 먼저 핵심을 정리합니다',
    body: '길게 적은 내용에서 주호소와 흐름을 정리해 다음 단계가 더 가볍게 이어지도록 돕습니다.',
  },
  {
    step: '03',
    title: '필요하면 자원봉사 의료진이 이어서 봅니다',
    body: '즉시 안내가 필요한 경우에는 의료진이 내용을 직접 읽고 답변과 다음 행동 방향을 전합니다.',
  },
  {
    step: '04',
    title: '답변과 다음 안내를 같은 흐름 안에서 받습니다',
    body: '카카오톡 상담이 중심이지만, 이제 이 앱에서도 상담 진행 상태와 답변 도착 여부를 다시 확인할 수 있습니다.',
  },
]

const availableNow = [
  '카카오톡 채널로 즉시 상담 시작',
  'AI 인턴 보듬이 기반 질문 정리 흐름',
  '필요 시 의료진 직접 검토 연결',
  '상태 확인 링크로 진행 상태 다시 열기',
]

const availableNext = [
  '읽음 여부와 후속 안내 정리',
  '홈 화면 설치 후 더 가벼운 재방문 흐름',
  '다국어 안내와 앱 내부 도움말 확장',
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
      '아니요. 현재 해피닥터 앱은 상담 시작을 더 쉽게 안내하는 모바일 진입면입니다. 실제 상담은 카카오톡 채널에서 바로 시작할 수 있습니다.',
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
                아픈 순간,
                <br />
                어디로 물어봐야 할지
                <br />
                막막할 때
              </h2>
              <p className="reveal-2 mt-6 max-w-lg text-lg leading-8 text-[var(--muted)]">
                해피닥터 앱은 병원과 응급실 사이에서 방향이 필요한 분들을 위한 모바일 상담 진입면입니다.
                카카오톡 상담으로 바로 이어지고, 상담 후에는 이 앱에서 진행 상태와 답변 도착 여부를 다시 확인할 수
                있습니다.
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
                응급 증상은 이 앱보다 119 또는 응급실이 우선입니다. 해피닥터는 응급실 앞 단계에서 방향을 묻고
                정리하는 데 초점을 둡니다.
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
                            상담 흐름이 더 가볍게 이어지도록
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

                <div className="mt-6 grid gap-3 border-t border-white/18 pt-5 text-white/82 sm:grid-cols-2">
                  <div>
                    <p className="display-face text-xs font-semibold uppercase tracking-[0.22em] text-white/58">
                      Now
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">카카오톡 채널로 즉시 진입</p>
                    <p className="mt-2 text-sm leading-6">
                      지금은 가장 익숙한 채널에서 상담을 시작하고, 앱은 흐름을 더 명확하게 안내하는 역할을 합니다.
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
                상담 후에도
                <br />
                진행 상태를 다시 확인하세요
              </h3>
              <p className="mt-4 max-w-md text-sm leading-7 text-[var(--muted)]">
                카카오톡에서 받은 상태 확인 링크를 다시 열거나, 코드만 붙여넣어도 현재 단계와 답변 도착 여부를 볼 수
                있습니다.
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
                <p>상담 직후 받은 링크를 그대로 열면 가장 빠르게 확인할 수 있습니다.</p>
                <p>앱이 설치되어 있지 않아도 괜찮고, 카카오톡 상담 흐름과 같은 상담을 다시 여는 용도입니다.</p>
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
                이 앱은
                <br />
                누구를 향해 있나요
              </h3>
              <p className="mt-4 text-base leading-7 text-[var(--muted)]">
                해피닥터 앱은 병원 앱을 하나 더 만드는 것이 아니라, 설명 창구가 멀게 느껴지는 분들에게 첫 질문의
                문턱을 낮추는 데 목적이 있습니다.
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
                    앱은 조용한 첫 화면이어야 하지만, 해피닥터가 왜 존재하는지는 분명해야 합니다. 이 화면은 빠른
                    진입과 신뢰 형성 두 가지를 함께 담당합니다.
                  </p>
                </div>

                <div className="overflow-hidden rounded-[1.6rem] border border-white/14 bg-white/10">
                  <Image
                    src="/brand-banner.png"
                    alt="해피닥터 브랜드 배너"
                    width={1600}
                    height={900}
                    className="h-auto w-full object-cover"
                  />
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
                  해피닥터 앱은 아직 첫 번째 공개 단계입니다. 하지만 필요한 분들이 더 빨리 질문에 닿도록 만드는
                  핵심 흐름은 이미 시작되어 있습니다.
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
