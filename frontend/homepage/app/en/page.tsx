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

        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">Mission</p>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl md:leading-[1.06]">
              Healthcare that reaches people who need it most
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-white/78 md:text-lg">
              Happy Doctor is a volunteer-driven medical support initiative for underserved communities.
              We provide free online guidance with AI-assisted triage and doctor-reviewed responses.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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

            <div className="mt-8 rounded-[1.75rem] border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/64">
                Language support
              </p>
              <h2 className="mt-3 text-xl font-semibold">Start in your language</h2>
              <p className="mt-3 text-sm leading-7 text-white/76">
                Some Google webpage translation routes are unavailable in certain regions. Instead of sending you to
                a broken translation page, we can take you straight to the consultation form where you may type in
                your own language.
              </p>
              <p className="mt-2 text-xs leading-6 text-white/56">
                The consultation UI will stay in English, but our system will try to translate your message for our
                doctors and return a translated reply when possible.
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
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
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/14 bg-white/10 p-3 shadow-[0_40px_90px_rgba(3,15,30,0.35)]">
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
        </div>
      </section>
    </main>
  )
}
