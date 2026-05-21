import Link from 'next/link'

import WebConsultationStartForm from '@/components/WebConsultationStartForm'
import { UiLanguage, normalizeUiLanguage, withUiLanguage } from '@/lib/ui-language'

type StartPageProps = {
  searchParams: Promise<{
    source?: string
    lang?: string
    inputLanguage?: string
  }>
}

const consultationLanguageOptions = [
  { code: 'es', label: 'Español' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'ja', label: '日本語' },
  { code: 'mn', label: 'Монгол' },
  { code: 'ru', label: 'Русский' },
  { code: 'th', label: 'ไทย' },
  { code: 'tl', label: 'Filipino' },
  { code: 'ne', label: 'नेपाली' },
  { code: 'km', label: 'ខ្មែរ' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'uz', label: 'O‘zbek' },
  { code: 'ar', label: 'العربية' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'it', label: 'Italiano' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'tr', label: 'Türkçe' },
] as const

function getInputLanguageLabel(value?: string) {
  const trimmed = value?.trim()
  if (!trimmed) return null

  const matched = consultationLanguageOptions.find((option) => option.code.toLowerCase() === trimmed.toLowerCase())
  return matched?.label || null
}

function normalizeEntrySurface(value?: string) {
  const trimmed = value?.trim()
  if (!trimmed) return 'app'
  return trimmed.slice(0, 40)
}

const copyByLanguage: Record<UiLanguage, {
  eyebrow: string
  title: string
  description: string
  homeLabel: string
  statusLabel: string
  homeHref: string
  heroEyebrow: string
  heroTitle: string
  heroBody: string
  infoTitle: string
  infoItems: string[]
  supportEyebrow: string
  supportTitle: string
  supportItems: string[]
}> = {
  ko: {
    eyebrow: 'Happy Doctor Start',
    title: '웹에서 바로 상담 시작',
    description: '필요한 정보만 적어 주시면 상담을 접수하고 상태 확인 코드도 함께 드립니다.',
    homeLabel: '홈페이지 보기',
    statusLabel: '상태 확인',
    homeHref: 'https://happydoctor.kr/ko',
    heroEyebrow: 'Care Access',
    heroTitle: '의료가 멀게 느껴질 때\n먼저 설명할 수 있는 곳',
    heroBody: '이 화면은 어디서부터 도움을 구해야 할지 막막한 순간에 먼저 설명하고 연결되는 온라인 의료상담 창구입니다.',
    infoTitle: '이런 내용을 적어 주세요',
    infoItems: [
      '가장 불편한 증상',
      '언제부터 시작됐는지',
      '기저질환이나 복용 중인 약이 있는지',
    ],
    supportEyebrow: '진행 방식',
    supportTitle: '천천히 적어도 괜찮습니다',
    supportItems: [
      '증상이 급하면 119나 가까운 응급실이 우선입니다.',
      '화면은 한국어 중심이지만 영어 입력도 가능합니다.',
      '영어 외 다른 언어도 입력할 수 있고, 가능한 범위에서 자동 번역을 시도합니다.',
    ],
  },
  en: {
    eyebrow: 'Happy Doctor Start',
    title: 'Start a consultation on the web',
    description: 'Share only the essentials and we will open your consultation with a status link and lookup code.',
    homeLabel: 'English homepage',
    statusLabel: 'Check status',
    homeHref: 'https://happydoctor.kr/en',
    heroEyebrow: 'Care Access',
    heroTitle: 'A place to explain first\nwhen healthcare feels far away',
    heroBody: 'This page is an online medical support entry point for people who need to explain what is happening before they know where to ask for help.',
    infoTitle: 'Please tell us',
    infoItems: [
      'what feels most uncomfortable right now',
      'when it started',
      'whether you have chronic conditions or medicines',
    ],
    supportEyebrow: 'How this works',
    supportTitle: 'Korean and English UI are supported',
    supportItems: [
      'If your symptoms feel urgent, please use emergency services first.',
      'You can write in Korean or English in this form.',
      'You may also type in another language. We will try to translate it for our doctors automatically.',
    ],
  },
}

export default async function StartPage({ searchParams }: StartPageProps) {
  const resolvedSearchParams = await searchParams
  const entrySurface = normalizeEntrySurface(resolvedSearchParams.source)
  const uiLanguage = normalizeUiLanguage(resolvedSearchParams.lang)
  const inputLanguageLabel = getInputLanguageLabel(resolvedSearchParams.inputLanguage)
  const copy = copyByLanguage[uiLanguage]

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef8ff_0%,#ffffff_28%,#f7fbff_100%)]">
      <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8 sm:py-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="display-face text-xs font-semibold uppercase tracking-[0.24em] text-[var(--blue)]">
              {copy.eyebrow}
            </p>
            <h1 className="mt-3 whitespace-pre-line text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-4xl">
              {copy.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              {copy.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={copy.homeHref}
              className="rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-[0_10px_24px_rgba(8,34,55,0.06)] transition hover:bg-[var(--soft-blue)]"
            >
              {copy.homeLabel}
            </a>
            <Link
              href={withUiLanguage('/status', uiLanguage)}
              className="rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-[0_10px_24px_rgba(8,34,55,0.06)] transition hover:bg-[var(--soft-blue)]"
            >
              {copy.statusLabel}
            </Link>
          </div>
        </header>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="rounded-[2rem] bg-[var(--navy)] p-6 text-white shadow-[0_24px_60px_rgba(7,28,49,0.18)] sm:p-7">
            <p className="display-face text-xs font-semibold uppercase tracking-[0.24em] text-white/64">
              {copy.heroEyebrow}
            </p>
            <h2 className="mt-4 whitespace-pre-line text-3xl font-semibold tracking-[-0.04em]">
              {copy.heroTitle}
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-white/82">
              <p>{copy.heroBody}</p>
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-white/10 p-4 text-sm leading-7 text-white/82">
              <p className="font-semibold text-white">{copy.infoTitle}</p>
              <ul className="mt-3 space-y-2">
                {copy.infoItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--line)] bg-white/80 p-6 shadow-[0_24px_60px_rgba(8,34,55,0.08)] sm:p-7">
            <p className="display-face text-xs font-semibold uppercase tracking-[0.2em] text-[var(--blue)]">
              {copy.supportEyebrow}
            </p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--muted)]">
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                {copy.supportTitle}
              </h2>
              <ul className="space-y-3">
                {copy.supportItems.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[var(--blue)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <WebConsultationStartForm
            entrySurface={entrySurface}
            uiLanguage={uiLanguage}
            inputLanguageLabel={inputLanguageLabel}
          />
        </section>
      </div>
    </main>
  )
}
