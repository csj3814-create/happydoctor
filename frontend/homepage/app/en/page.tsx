import type { Metadata } from 'next'
import Image from 'next/image'

const KAKAO_CHAT_URL = 'https://pf.kakao.com/_PxaTxhX/chat'
const WEB_START_URL = 'https://app.happydoctor.kr/start?source=homepage&lang=en'
const KO_HOME_URL = '/ko'

const consultationLanguages = [
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
]

function buildConsultationUrl(languageCode: string) {
  const url = new URL(WEB_START_URL)
  url.searchParams.set('inputLanguage', languageCode)
  return url.toString()
}

export const metadata: Metadata = {
  title: 'Happy Doctor | Free Online Medical Support',
  description:
    'Happy Doctor connects underserved communities with volunteer medical professionals through free online consultation.',
  alternates: {
    canonical: '/en',
    languages: {
      'ko-KR': '/ko',
      'en-US': '/en',
    },
  },
  openGraph: {
    locale: 'en_US',
    url: '/en',
    title: 'Happy Doctor | Free Online Medical Support',
    description:
      'Happy Doctor connects underserved communities with volunteer medical professionals through free online consultation.',
  },
}

export default function EnglishHomepage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(79,184,255,0.25),_transparent_35%),linear-gradient(145deg,_#082847_0%,_#0C447C_42%,_#185FA5_100%)] text-white">
      <section className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-16 pt-10 md:px-6 md:pb-24 md:pt-14">
        <div className="flex items-center justify-between rounded-full border border-white/15 bg-white/10 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-2xl bg-white/10">
              <Image src="/design/app-icon-square.png" alt="Happy Doctor icon" fill sizes="44px" className="object-cover" />
            </div>
            <div>
              <p className="text-sm font-semibold">Happy Doctor</p>
              <p className="text-xs text-white/60">Free Online Medical Support</p>
            </div>
          </div>

          <a href={KO_HOME_URL} className="rounded-full border border-white/25 px-4 py-2 text-xs font-semibold hover:bg-white/10">
            한국어 보기
          </a>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
          <div className="order-1 mx-auto flex max-w-2xl flex-col items-center text-center lg:mx-0 lg:items-start lg:text-left">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">Mission</p>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl md:leading-[1.06]">
              Healthcare that reaches people who need it most
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-white/78 md:text-lg">
              Happy Doctor is a volunteer-driven medical support initiative for underserved communities.
              We provide free online guidance with AI-assisted triage and doctor-reviewed responses.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:items-start lg:justify-start">
              <a
                href={WEB_START_URL}
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-[#0C447C] shadow-lg shadow-black/15 transition hover:-translate-y-0.5"
              >
                Start Consultation on Web
              </a>
              <a
                href={KAKAO_CHAT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-[#FEE500] px-6 py-3 text-sm font-bold text-[#2C1B00] shadow-lg shadow-black/15 transition hover:-translate-y-0.5"
              >
                Start Consultation on KakaoTalk
              </a>
              <a
                href="/ko"
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/8 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/14"
              >
                View Korean Homepage
              </a>
            </div>
          </div>

          <div className="order-2 relative mx-auto w-full max-w-[33rem] lg:mt-1">
            <div className="overflow-hidden rounded-[2rem] border border-white/14 bg-white/10 p-3 shadow-[0_40px_90px_rgba(3,15,30,0.35)]">
              <div className="relative aspect-[16/11] overflow-hidden rounded-[1.5rem]">
                <Image
                  src="/design/hero-header.png"
                  alt="Happy Doctor visual"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 48vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="absolute inset-x-4 -bottom-5 rounded-[1.6rem] bg-white p-4 text-slate-900 shadow-2xl shadow-slate-950/25 sm:left-6 sm:right-auto sm:w-[320px]">
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-sky-50">
                  <Image
                    src="/design/chatbot-badge.png"
                    alt="Bodeum assistant icon"
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Bodeum + volunteer doctors</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    AI-assisted triage first, doctor-reviewed replies when more support is needed.
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute right-3 top-6 hidden rounded-2xl border border-white/16 bg-white/12 px-4 py-3 text-white shadow-lg backdrop-blur md:block">
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/60">Access</p>
              <p className="mt-1 text-sm font-semibold">Web + KakaoTalk</p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.85rem] border border-white/15 bg-white/10 p-5 backdrop-blur sm:p-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/64">
              Language support
            </p>
            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold sm:text-2xl">Start in your language</h2>
                <p className="mt-3 text-sm leading-7 text-white/76">
                  Choose the language you are most comfortable with and we will open the consultation form in that
                  language first.
                </p>
                <p className="mt-2 text-xs leading-6 text-white/56">
                  Your message can still be translated for our doctors, and translated replies will be returned when
                  possible.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {consultationLanguages.map((language) => (
              <a
                key={language.code}
                href={buildConsultationUrl(language.code)}
                className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/14"
              >
                <span className="block">{language.label}</span>
                <span className="mt-1 block text-xs font-medium text-white/56">
                  Open consultation form
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
