'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

const FALLBACK_STATS = { total: 373, doctorReplied: 321 }
const KAKAO_CHAT_URL = 'https://pf.kakao.com/_PxaTxhX/chat'
const KAKAO_CHANNEL_URL = 'https://pf.kakao.com/_PxaTxhX'
const VOLUNTEER_URL = 'https://open.kakao.com/me/csj3814'

interface Stats {
  total: number
  doctorReplied: number
}

interface QAItem {
  idx: number
  q: string
  a: string
  date: string
}

const QUESTION_PREVIEW_LIMIT = 50

const HERO_BADGES = ['무료 의료상담', '다국어 지원', '전문의 직접 검토']

const HERO_POINTS = [
  {
    title: '의료 취약계층 중심',
    desc: '노숙인, 이주민, 농아인, 다문화가정까지 손이 잘 닿지 않는 곳부터 돕습니다.',
  },
  {
    title: '카카오톡으로 간편하게',
    desc: '별도 앱 설치 없이 익숙한 채널에서 상담을 시작하고 답변을 받을 수 있습니다.',
  },
  {
    title: 'AI 인턴 + 의료진 협업',
    desc: 'AI가 먼저 정리하고, 필요하면 각 과 의료진이 직접 확인해 더 빠르게 연결합니다.',
  },
  {
    title: '봉사와 기술의 결합',
    desc: '의료봉사 경험과 디지털 접근성을 함께 살려 지속 가능한 구조를 만들어갑니다.',
  },
]

const FEATURE_CARDS = [
  {
    icon: '🩺',
    title: '완전 무료',
    desc: '건강보험 유무와 상관없이 누구나 상담을 받을 수 있도록 문턱을 낮췄습니다.',
  },
  {
    icon: '👨‍⚕️',
    title: '전문의 직접 답변',
    desc: '자원봉사 의료진이 실제 상황을 읽고 직접 검토해 더 신뢰할 수 있는 답변을 드립니다.',
  },
  {
    icon: '🌍',
    title: '언어 장벽 완화',
    desc: '한국어가 익숙하지 않아도 괜찮습니다. 이해하기 쉬운 방식으로 도움을 드립니다.',
  },
  {
    icon: '⏱️',
    title: '빠른 연결을 목표',
    desc: '긴급하지 않은 상담도 오래 기다리지 않도록 AI와 의료진이 함께 흐름을 관리합니다.',
  },
]

const STEPS = [
  {
    number: '01',
    title: '카카오 채널 접속',
    desc: '카카오톡에서 행복한 의사를 검색하거나 아래 버튼으로 바로 들어옵니다.',
  },
  {
    number: '02',
    title: '증상과 상황 입력',
    desc: '나이, 성별, 주요 증상과 경과를 안내에 따라 입력하면 됩니다.',
  },
  {
    number: '03',
    title: 'AI 예진과 의료진 검토',
    desc: 'AI가 먼저 정리하고, 필요한 경우 의료진이 내용을 직접 확인합니다.',
  },
  {
    number: '04',
    title: '카카오톡으로 답변 수신',
    desc: '채널 안에서 그대로 답변과 추가 안내를 받아볼 수 있습니다.',
  },
]

const PARTNERS = [
  { name: '대한응급의학의사회', desc: '전국 응급의학과 의사 네트워크', icon: '🏥' },
  { name: '부평구다문화가족센터', desc: '다문화가족 약 7,700명 대상 협력', icon: '🌏' },
  { name: '서울특별시농아인협회', desc: '농아인 및 관계자 약 60,000명 연결', icon: '🤝' },
  { name: '서울시립서대문농아인복지관', desc: '청각장애인 복지 서비스 협력', icon: '💙' },
  { name: '요셉의원', desc: '국내외 외국인과 취약 환자 지원', icon: '✝️' },
  { name: '다가치', desc: '이주민 의료지원 체계 구축 협력', icon: '🌱' },
]

const TIMELINE = [
  { year: '2020.10', title: '행복한 의사 설립', desc: '코로나19 시기 의료 사각지대 해소를 위해 자원봉사 의사들이 시작했습니다.' },
  { year: '2021.09', title: '요셉의원 MOU', desc: '국내외 외국인과 빈민 지역 환자 의료상담 협력을 체결했습니다.' },
  { year: '2022.01', title: '부평구다문화가족센터 MOU', desc: '다문화가족 대상 무료 온라인 의료상담 서비스를 본격적으로 확대했습니다.' },
  { year: '2022.08', title: '서울특별시농아인협회 MOU', desc: '농아인 의료상담 지원 범위를 넓히는 협력을 시작했습니다.' },
  { year: '2022.10', title: '서대문농아인복지관 협력', desc: '교육과 상담이 함께 가는 형태로 활동을 정례화했습니다.' },
  { year: '2023.02', title: '사단법인 창립총회', desc: '임의단체를 넘어 비영리법인으로 전환하며 활동 기반을 다졌습니다.' },
  { year: '2023.04', title: '다가치 MOU', desc: '이주민 의료지원 체계 구축을 위한 협약을 체결했습니다.' },
  { year: '2024-2026', title: '카카오톡 채널 + AI 예진 도입', desc: '언제 어디서나 접근 가능한 AI 기반 의료상담 흐름을 만들었습니다.' },
]

const GALLERY = [
  { src: '/gallery/founding-ceremony.jpg', caption: '사단법인 창립총회 (2023.02)' },
  { src: '/gallery/founding-ceremony2.jpg', caption: '창립총회 현장 스케치' },
  { src: '/gallery/lecture-deaf.jpg', caption: '서울특별시농아인협회 의료 강의' },
  { src: '/gallery/mou-dagachi.jpg', caption: '다가치 MOU 체결 (2023.04)' },
  { src: '/gallery/mou-dagachi2.jpg', caption: '다가치 업무협약식' },
  { src: '/gallery/world-day1.jpg', caption: '인천 세계인의날 봉사 (2023.05)' },
  { src: '/gallery/world-day2.jpg', caption: '세계인의날 다문화가정 현장상담' },
  { src: '/gallery/world-day3.jpg', caption: '세계인의날 어린이 상담' },
  { src: '/stories/mou-emergency.jpg', caption: '대한응급의학의사회 MOU' },
  { src: '/stories/mou-deaf.jpg', caption: '서대문농아인복지관 MOU' },
  { src: '/gallery/lecture-multicultural.jpg', caption: '부평구다문화가족센터 의료 강의' },
  { src: '/stories/volunteer.jpg', caption: '행복한 의사 봉사활동' },
]

function useStats() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then((response) => response.json())
      .then((data) => setStats(data))
      .catch(() => setStats(FALLBACK_STATS))
  }, [])

  return stats
}

function useQA() {
  const [items, setItems] = useState<QAItem[]>([])

  useEffect(() => {
    fetch('/qna.json')
      .then((response) => response.json())
      .then((data) => setItems(data))
      .catch(() => setItems([]))
  }, [])

  return items
}

function truncateQuestion(text: string, maxLength = QUESTION_PREVIEW_LIMIT) {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}…`
}

function SectionHeading({
  eyebrow,
  title,
  desc,
  light = false,
}: {
  eyebrow: string
  title: string
  desc: string
  light?: boolean
}) {
  return (
    <div className="max-w-2xl">
      <p className={`mb-4 text-xs font-semibold tracking-[0.28em] uppercase ${light ? 'text-white/70' : 'text-sky-700'}`}>
        {eyebrow}
      </p>
      <h2 className={`text-3xl font-bold leading-tight md:text-4xl ${light ? 'text-white' : 'text-slate-900'}`}>
        {title}
      </h2>
      <p className={`mt-4 text-sm leading-7 md:text-base ${light ? 'text-white/75' : 'text-slate-600'}`}>{desc}</p>
    </div>
  )
}

function CTAButton({
  href,
  children,
  variant = 'primary',
}: {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}) {
  const className =
    variant === 'primary'
      ? 'inline-flex items-center justify-center rounded-full bg-[#FEE500] px-6 py-3 text-sm font-bold text-[#2C1B00] shadow-lg shadow-black/15 transition hover:-translate-y-0.5'
      : 'inline-flex items-center justify-center rounded-full border border-white/25 bg-white/8 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/14'

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  )
}

function StatsValue({ value, suffix }: { value: number | null | undefined; suffix: string }) {
  return (
    <span>
      {value == null ? <span className="opacity-35">—</span> : value.toLocaleString()}
      <span className="ml-1 text-sm text-current/60">{suffix}</span>
    </span>
  )
}

function Hero({ stats }: { stats: Stats | null }) {
  return (
    <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(79,184,255,0.3),_transparent_35%),linear-gradient(145deg,_#082847_0%,_#0C447C_42%,_#185FA5_100%)] text-white">
      <div className="hero-orb left-[-120px] top-24 h-64 w-64 bg-cyan-300/18" />
      <div className="hero-orb right-[-80px] top-[-32px] h-72 w-72 bg-sky-200/18" />
      <div className="hero-orb bottom-[-80px] left-1/3 h-64 w-64 bg-teal-300/14" />

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-6 md:px-6 md:pb-24 md:pt-8">
        <div className="mb-10 flex items-center justify-between gap-4 rounded-full border border-white/12 bg-white/8 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white/10 shadow-lg shadow-black/15">
              <Image src="/design/app-icon-square.png" alt="행복한 의사 앱 아이콘" width={44} height={44} />
            </div>
            <div>
              <p className="text-sm font-semibold">행복한 의사</p>
              <p className="text-xs text-white/60">Happy Doctor</p>
            </div>
          </div>
          <a
            href={KAKAO_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/10"
          >
            카카오 채널 보기
          </a>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="max-w-2xl">
            <div className="mb-4 flex flex-wrap gap-2">
              {HERO_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-white/16 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur"
                >
                  {badge}
                </span>
              ))}
            </div>

            <h1 className="text-4xl font-bold leading-tight md:text-5xl md:leading-[1.08] xl:whitespace-nowrap">
              제비처럼, 필요한 곳에 닿는 의료
            </h1>
            <p className="mt-6 text-sm leading-7 text-white/78 md:text-base md:leading-8 xl:whitespace-nowrap">
              행복한 의사는 의료 취약계층을 위한 무료 온라인 의료상담 서비스입니다. AI 인턴 보듬이와 자원봉사 의료진이 함께 움직이며, 더 빨리 더 쉽게 도움에 닿도록 돕습니다.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CTAButton href={KAKAO_CHAT_URL}>카카오톡으로 상담하기</CTAButton>
              <CTAButton href={VOLUNTEER_URL} variant="secondary">
                의료진 참여 문의
              </CTAButton>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {HERO_POINTS.map((point) => (
                <div key={point.title} className="glass-card rounded-3xl p-5">
                  <p className="text-sm font-semibold text-white">{point.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/68">{point.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:translate-y-8">
            <div className="mesh-panel overflow-hidden rounded-[2rem] border border-white/14 p-3 shadow-[0_40px_90px_rgba(3,15,30,0.35)]">
              <div className="relative aspect-[16/11] overflow-hidden rounded-[1.5rem]">
                <Image
                  src="/design/hero-header.png"
                  alt="행복한 의사 메인 비주얼"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 48vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="lift-card absolute -bottom-6 left-3 right-14 rounded-[1.75rem] bg-white p-4 text-slate-900 shadow-2xl shadow-slate-950/25 md:left-8 md:right-auto md:w-[320px]">
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-sky-50">
                  <Image src="/design/chatbot-badge.png" alt="보듬이 챗봇 아이콘" fill sizes="56px" className="object-cover" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">AI 인턴 보듬이</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    상담 흐름을 먼저 정리하고 의료진이 이어서 확인할 수 있게 돕습니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="floating-chip absolute right-0 top-8 hidden rounded-2xl border border-white/16 bg-white/12 px-4 py-3 text-white shadow-lg backdrop-blur md:block">
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/60">Access</p>
              <p className="mt-1 text-sm font-semibold">카카오톡 채널로 바로 연결</p>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-4">
          <div className="stat-card md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">Impact</p>
            <div className="mt-3 flex items-end gap-3">
              <span className="text-4xl font-bold md:text-5xl">
                <StatsValue value={stats?.total ?? null} suffix="건" />
              </span>
            </div>
            <p className="mt-2 text-sm text-white/70">누적 상담 건수</p>
          </div>

          <div className="stat-card">
            <p className="text-3xl font-bold">
              <StatsValue value={stats?.doctorReplied ?? null} suffix="건" />
            </p>
            <p className="mt-2 text-sm text-white/70">전문의 직접 회신</p>
          </div>

          <div className="stat-card">
            <p className="text-3xl font-bold">
              <StatsValue value={67700} suffix="명+" />
            </p>
            <p className="mt-2 text-sm text-white/70">잠재 수혜 인구</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function StorySection() {
  return (
    <section className="section-shell bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHeading
            eyebrow="Mission"
            title="왜 행복한 의사인가요?"
            desc="동화 속 제비가 보석과 온기를 필요한 이웃에게 전했듯, 행복한 의사는 의료진의 손길이 필요한 곳에 닿도록 움직입니다."
          />
          <div className="mt-8 space-y-4 text-sm leading-7 text-slate-600 md:text-base">
            <p>
              코로나19 시기를 지나며 무의촌 거주자, 경제적으로 어려운 분들, 언어소통에 어려움을 겪는 농아인과
              다문화가정이 의료 혜택에서 쉽게 소외된다는 사실이 더 선명하게 드러났습니다.
            </p>
            <p>
              행복한 의사는 자원봉사 의료진의 재능기부와 디지털 접근성을 결합해,
              <strong className="text-slate-900"> 완전 무료</strong>로 전문 의료상담을 제공합니다.
            </p>
          </div>

          <div className="mt-8 rounded-[1.75rem] bg-slate-50 p-6 shadow-sm ring-1 ring-slate-200/70">
            <p className="text-sm leading-7 text-slate-700">
              &ldquo;기술은 차갑지 않아야 합니다. 누군가에게 의료가 더 가까워지는 방식이라면,
              그 기술은 결국 사람을 향한 도구가 됩니다.&rdquo;
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="mesh-panel overflow-hidden rounded-[2rem] border border-sky-100 bg-sky-50 p-3 shadow-[0_30px_70px_rgba(12,68,124,0.12)]">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem]">
              <Image
                src="/design/mission-banner.png"
                alt="행복한 의사 미션 배너 이미지"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>

          <div className="lift-card absolute -bottom-14 left-4 max-w-sm rounded-[1.5rem] bg-white p-5 shadow-xl shadow-slate-900/10 md:-bottom-16 md:left-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Since 2020.10</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">봉사와 AI가 만나는 새로운 의료 접근성</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              기존 의료 봉사의 진심을 유지하면서, 더 많은 사람이 쉽게 도움을 받을 수 있도록 흐름을 다시 설계했습니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureSection() {
  return (
    <section className="section-shell bg-[linear-gradient(180deg,#f4faff_0%,#edf6ff_100%)]">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="rounded-[2rem] bg-[#0D3966] p-8 text-white shadow-[0_30px_70px_rgba(8,40,71,0.28)]">
            <SectionHeading
              eyebrow="Service"
              title="행복한 의사는 이런 서비스입니다"
              desc="병원에 바로 가기 어렵거나, 설명할 창구가 마땅치 않거나, 언어와 거리 때문에 막히는 순간을 줄이기 위해 만들었습니다."
              light
            />
            <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/8 p-4 backdrop-blur">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem]">
                <Image src="/design/share-card.png" alt="행복한 의사 공유용 디자인" fill sizes="(max-width: 1024px) 100vw, 32vw" className="object-cover" />
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {FEATURE_CARDS.map((item) => (
              <div key={item.title} className="lift-card rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-2xl">
                  {item.icon}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          본 상담은 최종적인 의료행위를 대체하지 않습니다. 반드시 가까운 의료기관을 통한 진료를 권장합니다.
        </p>
      </div>
    </section>
  )
}

function HowToSection() {
  return (
    <section className="section-shell bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:px-6 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute inset-x-8 top-10 h-56 rounded-full bg-sky-200/60 blur-3xl" />
          <div className="relative mx-auto w-[280px] rounded-[2.5rem] bg-[linear-gradient(180deg,#0C447C_0%,#D9EDFF_100%)] p-3 shadow-[0_35px_80px_rgba(12,68,124,0.22)]">
            <div className="rounded-[2rem] bg-white/70 p-3 backdrop-blur">
              <div className="relative aspect-[3/4] overflow-hidden rounded-[1.6rem] border border-white/30 bg-white">
                <Image src="/design/chat-preview.png" alt="행복한 의사 채팅 화면 미리보기" fill sizes="280px" className="object-cover" />
              </div>
            </div>
          </div>
          <div className="floating-chip absolute -right-2 bottom-10 rounded-[1.4rem] bg-white px-4 py-3 text-slate-900 shadow-xl shadow-slate-900/10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Flow</p>
            <p className="mt-1 text-sm font-semibold">카카오톡에서 바로 이어집니다</p>
          </div>
        </div>

        <div>
          <SectionHeading
            eyebrow="How It Works"
            title="복잡한 설치 없이, 익숙한 채널에서 바로 시작합니다"
            desc="설명은 쉽고, 접근은 간단하고, 연결은 빠르게. 사용 흐름도 그 원칙에 맞춰 설계했습니다."
          />
          <div className="mt-10 grid gap-4">
            {STEPS.map((step) => (
              <div key={step.number} className="lift-card rounded-[1.75rem] border border-slate-200/70 bg-white p-5 shadow-sm">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <CTAButton href={KAKAO_CHAT_URL}>지금 바로 상담하기</CTAButton>
          </div>
        </div>
      </div>
    </section>
  )
}

function PartnersSection() {
  return (
    <section className="section-shell bg-[linear-gradient(180deg,#f4faff_0%,#eef7ff_100%)]">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Partners"
          title="함께하는 기관"
          desc="행복한 의사는 현장 단체와 협력기관을 통해 더 넓은 사각지대로 연결되고 있습니다."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PARTNERS.map((partner) => (
            <div key={partner.name} className="lift-card rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-2xl">
                  {partner.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{partner.name}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{partner.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TimelineSection() {
  return (
    <section className="section-shell bg-white">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <SectionHeading
          eyebrow="History"
          title="작은 봉사에서 지속 가능한 구조로"
          desc="행복한 의사는 현장 경험을 쌓아오며, 필요한 곳과 연결되는 방식을 조금씩 넓혀 왔습니다."
        />

        <div className="relative mt-12">
          <div className="absolute left-3 top-0 h-full w-px bg-sky-100 md:left-1/2 md:-ml-px" />
          <div className="space-y-5">
            {TIMELINE.map((item, index) => (
              <div key={item.year} className="relative grid gap-4 md:grid-cols-2 md:gap-10">
                <div className={`hidden md:block ${index % 2 === 0 ? '' : 'order-2'}`} />
                <div className={`relative ${index % 2 === 0 ? '' : 'md:order-1'}`}>
                  <div className="absolute left-0 top-7 h-3 w-3 rounded-full bg-sky-600 md:left-auto md:right-[-1.35rem]" />
                  <div
                    className={`lift-card ml-8 rounded-[1.5rem] bg-slate-50 p-5 shadow-sm ring-1 ring-slate-200/70 md:ml-0 ${
                      index % 2 === 0 ? 'md:mr-8' : 'md:ml-8'
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">{item.year}</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function GallerySection() {
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    if (selected === null) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelected(null)
      if (event.key === 'ArrowRight') setSelected((current) => (current === null ? current : Math.min(GALLERY.length - 1, current + 1)))
      if (event.key === 'ArrowLeft') setSelected((current) => (current === null ? current : Math.max(0, current - 1)))
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selected])

  return (
    <section className="section-shell bg-[linear-gradient(180deg,#072746_0%,#0C447C_100%)] text-white">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Story"
            title="현장에서 함께한 순간들"
            desc="공간과 상황은 달라도, 필요한 사람에게 의료가 더 가까워지는 장면들은 늘 비슷한 온도를 가집니다."
            light
          />

          <div className="relative h-28 w-full max-w-sm overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/10 shadow-lg shadow-black/20">
            <Image src="/design/brand-og.png" alt="행복한 의사 브랜드 카드" fill sizes="384px" className="object-cover" />
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {GALLERY.map((item, index) => (
            <button
              key={item.src}
              type="button"
              onClick={() => setSelected(index)}
              className={`group overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/8 text-left shadow-lg shadow-black/15 transition hover:-translate-y-1 hover:bg-white/10 ${
                index % 5 === 0 ? 'xl:col-span-2' : ''
              }`}
            >
              <div className={`relative overflow-hidden ${index % 5 === 0 ? 'aspect-[16/10]' : 'aspect-square'}`}>
                <Image
                  src={item.src}
                  alt={item.caption}
                  fill
                  sizes="(max-width: 1280px) 50vw, 25vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <p className="text-sm leading-6 text-white/82">{item.caption}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selected !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/88 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-4xl rounded-[2rem] border border-white/10 bg-slate-950/60 p-4 shadow-2xl backdrop-blur"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem]">
              <Image
                src={GALLERY[selected].src}
                alt={GALLERY[selected].caption}
                fill
                sizes="90vw"
                className="object-contain"
              />
            </div>
            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-white/80">{GALLERY[selected].caption}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(Math.max(0, selected - 1))}
                  disabled={selected === 0}
                  className="rounded-full border border-white/14 bg-white/10 px-4 py-2 text-sm text-white disabled:opacity-30"
                >
                  이전
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-full border border-white/14 bg-white/10 px-4 py-2 text-sm text-white"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(Math.min(GALLERY.length - 1, selected + 1))}
                  disabled={selected === GALLERY.length - 1}
                  className="rounded-full border border-white/14 bg-white/10 px-4 py-2 text-sm text-white disabled:opacity-30"
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function QASection() {
  const allQA = useQA()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<number | null>(null)

  const normalizedKeyword = search.trim().toLowerCase()
  const filtered = allQA.filter((item) => {
    if (!normalizedKeyword) return true
    return item.q.toLowerCase().includes(normalizedKeyword) || item.a.toLowerCase().includes(normalizedKeyword)
  })

  const pageSize = 8
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const start = (page - 1) * pageSize
  const paged = filtered.slice(start, start + pageSize)

  function handleSearch(value: string) {
    setSearch(value)
    setPage(1)
    setExpanded(null)
  }

  function handlePage(nextPage: number) {
    setPage(nextPage)
    setExpanded(null)
  }

  return (
    <section className="section-shell bg-white">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <div className="rounded-[2rem] bg-[linear-gradient(135deg,#F4FAFF_0%,#FFFFFF_45%,#ECF7FF_100%)] p-6 shadow-sm ring-1 ring-slate-200/70 md:p-8">
          <SectionHeading
            eyebrow="Q&A"
            title="이런 상담을 도와드리고 있어요"
            desc="실제 상담 사례를 바탕으로 자주 묻는 증상과 상황을 살펴볼 수 있습니다."
          />

          <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative">
              <input
                type="text"
                placeholder="증상이나 키워드로 검색해 보세요"
                value={search}
                onChange={(event) => handleSearch(event.target.value)}
                className="w-full rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white"
              />
              <svg
                className="absolute left-4 top-3.5 text-slate-400"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
              <span className="rounded-full bg-slate-100 px-3 py-1">실제 상담 사례 기반</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">증상 검색 가능</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">전문의 답변 공개</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {allQA.length === 0 && (
              <div className="rounded-[1.5rem] bg-slate-50 px-6 py-14 text-center text-sm text-slate-400">
                상담 사례를 불러오는 중입니다.
              </div>
            )}

            {allQA.length > 0 && paged.length === 0 && (
              <div className="rounded-[1.5rem] bg-slate-50 px-6 py-14 text-center text-sm text-slate-400">
                검색 결과가 없습니다.
              </div>
            )}

            {paged.map((item) => {
              const isExpanded = expanded === item.idx
              return (
                <div key={item.idx} className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setExpanded(isExpanded ? null : item.idx)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">
                      Q
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900 md:text-base">{truncateQuestion(item.q)}</p>
                      <p className="mt-1 text-xs text-slate-400">{item.date}</p>
                    </div>
                    <svg
                      className={`shrink-0 text-slate-400 transition ${isExpanded ? 'rotate-180' : ''}`}
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-sky-50/70 px-5 py-5">
                      <div className="flex gap-4">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                          A
                        </span>
                        <p className="whitespace-pre-line text-sm leading-7 text-slate-700 md:text-base">{item.a}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handlePage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 disabled:opacity-40"
              >
                이전
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, offset) => {
                const startPage = Math.max(1, Math.min(page - 2, totalPages - 4))
                const nextPage = startPage + offset
                return (
                  <button
                    key={nextPage}
                    type="button"
                    onClick={() => handlePage(nextPage)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      page === nextPage ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {nextPage}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => handlePage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 disabled:opacity-40"
              >
                다음
              </button>
            </div>
          )}

          <div className="mt-10 text-center">
            <CTAButton href={KAKAO_CHAT_URL}>나도 상담받기</CTAButton>
          </div>
        </div>
      </div>
    </section>
  )
}

function CEOSection() {
  const profiles = [
    {
      label: '현직',
      items: ['행복한 의사 Happy Doctor 대표', '습관학교 해빛스쿨 운영', '유튜브 건방진 닥터스 채널 운영', '베지닥터 상임이사'],
    },
    {
      label: '전직',
      items: ['대한응급의학의사회 홍보이사', '대한응급의학회 공보위원', '가천대학교 의과대학 졸업'],
    },
    {
      label: '저서',
      items: ['몸이 보내는 마지막 신호들 30 (2025)', '우리 아이 응급 주치의 (2020)', '응급실에 아는 의사가 생겼다 (2017)', '응급의학과 1막 22장, 개척자들 (공저)'],
    },
    {
      label: '방송 출연',
      items: ['MBC 기분좋은날, 명사특강 (2025)', 'SBS 빅퀘스천, 현대인과 암 (2024)', 'tvN 유퀴즈온더블록 (2020)', 'KBS 생명최전선, 요셉의원 (2014)'],
    },
  ]

  const links = [
    { label: '건방진 닥터스', href: 'https://www.youtube.com/@doctors0', color: '#FF0000' },
    { label: '블로그', href: 'https://blog.naver.com/csj3814', color: '#185FA5' },
    { label: '브런치', href: 'https://brunch.co.kr/@csj3814', color: '#7B6200' },
    { label: '인스타그램', href: 'https://www.instagram.com/csj3814/', color: '#E1306C' },
    { label: '쓰레드', href: 'https://www.threads.com/@csj3814', color: '#111827' },
    { label: '해빛스쿨', href: 'https://habitschool.web.app/', color: '#1D9E75' },
  ]

  return (
    <section className="section-shell bg-[linear-gradient(180deg,#f5fbff_0%,#ffffff_100%)]">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/70 md:p-8">
            <SectionHeading
              eyebrow="Leadership"
              title="대표 소개"
              desc="응급의학과 전문의 최석재 대표는 의료 현장의 경험을 바탕으로 행복한 의사의 방향을 이끌고 있습니다."
            />

            <div className="mt-8 flex flex-col items-center gap-5 text-center">
              <div className="relative h-40 w-40 overflow-hidden rounded-full ring-8 ring-sky-50">
                <Image src="/ceo.png" alt="최석재 대표" fill sizes="160px" className="object-cover" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">최석재</h3>
                <p className="mt-1 text-sm text-slate-500">응급의학과 전문의 · 행복한 의사 대표</p>
              </div>
            </div>

            <div className="mt-8 rounded-[1.5rem] bg-slate-900 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">Message</p>
              <p className="mt-3 text-sm leading-7 text-white/78">
                “의료가 정말 필요한 순간, 누군가에게 가장 먼저 닿는 입구가 되고 싶습니다.”
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/70 md:p-8">
            <div className="grid gap-5 md:grid-cols-2">
              {profiles.map((profile) => (
                <div key={profile.label} className="rounded-[1.5rem] bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">{profile.label}</p>
                  <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                    {profile.items.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
                  style={{ borderColor: link.color, color: link.color }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SupportSection() {
  return (
    <section className="section-shell bg-[linear-gradient(145deg,#082847_0%,#0C447C_48%,#1467A7_100%)] text-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 md:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/12 bg-white/8 p-7 backdrop-blur md:p-8">
          <SectionHeading
            eyebrow="Join Us"
            title="함께할 의사 선생님과 후원자를 찾고 있습니다"
            desc="더 많은 사람에게 의료가 닿게 하려면, 현장의 전문성과 지속 가능한 후원이 함께 필요합니다."
            light
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] bg-white/10 p-5">
              <p className="text-lg font-semibold">의료진 참여</p>
              <p className="mt-2 text-sm leading-7 text-white/72">
                재능기부 형태로 참여하는 자원봉사 의료진을 모집합니다. 전문성이 필요한 곳에 더 직접 닿게 됩니다.
              </p>
              <div className="mt-5">
                <CTAButton href={VOLUNTEER_URL} variant="secondary">
                  참여 문의하기
                </CTAButton>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-white p-5 text-slate-900">
              <p className="text-lg font-semibold">후원 안내</p>
              <div className="mt-4 rounded-[1.25rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">신한은행</p>
                <p className="mt-2 text-2xl font-bold">100-034-864699</p>
                <p className="mt-1 text-sm text-slate-500">예금주: 행복한의사</p>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                작은 후원이 의료 취약계층에게 실제 도움으로 이어집니다.
              </p>
            </div>
          </div>
        </div>

        <div className="mesh-panel overflow-hidden rounded-[2rem] border border-white/12 p-3 shadow-[0_30px_80px_rgba(2,10,20,0.28)]">
          <div className="relative h-full min-h-[320px] overflow-hidden rounded-[1.6rem]">
            <Image
              src="/design/mission-banner.png"
              alt="행복한 의사 후원 및 참여 배너"
              fill
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,40,71,0.05)_0%,rgba(8,40,71,0.55)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Happy Doctor</p>
              <p className="mt-2 text-2xl font-bold">기술이 아니라, 더 가까운 의료를 위한 디자인</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-slate-950 px-4 py-12 text-white md:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/6">
            <Image src="/design/app-icon-square.png" alt="행복한 의사 아이콘" width={52} height={52} />
          </div>
          <div>
            <p className="text-lg font-semibold">행복한 의사</p>
            <p className="text-sm text-white/50">Happy Doctor</p>
          </div>
        </div>

        <div className="space-y-1 text-sm text-white/58">
          <p>비영리법인 고유번호 111-82-67141</p>
          <p>대표 최석재 (응급의학과 전문의)</p>
          <p>서울특별시 영등포구 선유로9길 10, SK V1 616</p>
        </div>

        <a
          href={KAKAO_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full bg-[#FEE500] px-5 py-3 text-sm font-bold text-[#2C1B00]"
        >
          카카오 채널 바로가기
        </a>
      </div>

      <div className="mx-auto mt-8 max-w-6xl border-t border-white/10 pt-6 text-center text-xs text-white/35">
        © 2024-2026 행복한 의사 / Happy Doctor. All rights reserved.
      </div>
    </footer>
  )
}

export default function HomePage() {
  const stats = useStats()

  return (
    <main className="overflow-hidden bg-white">
      <Hero stats={stats} />
      <StorySection />
      <FeatureSection />
      <HowToSection />
      <PartnersSection />
      <TimelineSection />
      <GallerySection />
      <QASection />
      <CEOSection />
      <SupportSection />
      <Footer />
    </main>
  )
}
