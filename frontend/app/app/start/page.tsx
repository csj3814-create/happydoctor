import Link from 'next/link'

import WebConsultationStartForm from '@/components/WebConsultationStartForm'
import { normalizeUiLanguage, withUiLanguage } from '@/lib/ui-language'
import {
  fetchLocalizedStartCopy,
  startCopyByLanguage,
  type LocalizedStartCopyBundle,
} from '@/lib/start-copy'

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

export default async function StartPage({ searchParams }: StartPageProps) {
  const resolvedSearchParams = await searchParams
  const entrySurface = normalizeEntrySurface(resolvedSearchParams.source)
  const uiLanguage = normalizeUiLanguage(resolvedSearchParams.lang)
  const inputLanguageLabel = getInputLanguageLabel(resolvedSearchParams.inputLanguage)
  let localizedCopy: LocalizedStartCopyBundle = startCopyByLanguage[uiLanguage]

  if (resolvedSearchParams.inputLanguage?.trim()) {
    const fetchedCopy = await fetchLocalizedStartCopy(resolvedSearchParams.inputLanguage)
    if (fetchedCopy) {
      localizedCopy = fetchedCopy
    }
  }

  const pageCopy = localizedCopy.page
  const formCopy = localizedCopy.form

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef8ff_0%,#ffffff_28%,#f7fbff_100%)]">
      <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8 sm:py-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="display-face text-xs font-semibold uppercase tracking-[0.24em] text-[var(--blue)]">
              {pageCopy.eyebrow}
            </p>
            <h1 className="mt-3 whitespace-pre-line text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-4xl">
              {pageCopy.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              {pageCopy.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={pageCopy.homeHref}
              className="rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-[0_10px_24px_rgba(8,34,55,0.06)] transition hover:bg-[var(--soft-blue)]"
            >
              {pageCopy.homeLabel}
            </a>
            <Link
              href={withUiLanguage('/status', uiLanguage)}
              className="rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-[0_10px_24px_rgba(8,34,55,0.06)] transition hover:bg-[var(--soft-blue)]"
            >
              {pageCopy.statusLabel}
            </Link>
          </div>
        </header>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="rounded-[2rem] bg-[var(--navy)] p-6 text-white shadow-[0_24px_60px_rgba(7,28,49,0.18)] sm:p-7">
            <p className="display-face text-xs font-semibold uppercase tracking-[0.24em] text-white/64">
              {pageCopy.heroEyebrow}
            </p>
            <h2 className="mt-4 whitespace-pre-line text-3xl font-semibold tracking-[-0.04em]">
              {pageCopy.heroTitle}
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-white/82">
              <p>{pageCopy.heroBody}</p>
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-white/10 p-4 text-sm leading-7 text-white/82">
              <p className="font-semibold text-white">{pageCopy.infoTitle}</p>
              <ul className="mt-3 space-y-2">
                {pageCopy.infoItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--line)] bg-white/80 p-6 shadow-[0_24px_60px_rgba(8,34,55,0.08)] sm:p-7">
            <p className="display-face text-xs font-semibold uppercase tracking-[0.2em] text-[var(--blue)]">
              {pageCopy.supportEyebrow}
            </p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--muted)]">
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                {pageCopy.supportTitle}
              </h2>
              <ul className="space-y-3">
                {pageCopy.supportItems.map((item) => (
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
            copyOverride={formCopy}
          />
        </section>
      </div>
    </main>
  )
}
