export type UiLanguage = 'ko' | 'en'

const UI_LANGUAGE_STORAGE_KEY = 'happydoctor-ui-language'

export function normalizeUiLanguage(value?: string | null): UiLanguage {
  return value?.trim().toLowerCase() === 'en' ? 'en' : 'ko'
}

export function isEnglishUiLanguage(language: UiLanguage) {
  return language === 'en'
}

export function getUiLocale(language: UiLanguage) {
  return isEnglishUiLanguage(language) ? 'en-US' : 'ko-KR'
}

export function readStoredUiLanguage(): UiLanguage | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = window.localStorage.getItem(UI_LANGUAGE_STORAGE_KEY)
    return stored ? normalizeUiLanguage(stored) : null
  } catch {
    return null
  }
}

export function saveUiLanguage(language: UiLanguage) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, language)
  } catch {
    // Ignore storage write failures on restricted browsers.
  }
}

export function withUiLanguage(path: string, language: UiLanguage) {
  if (language !== 'en') return path

  const isAbsolute = /^https?:\/\//i.test(path)
  const url = new URL(path, 'https://app.happydoctor.kr')
  url.searchParams.set('lang', 'en')
  return isAbsolute ? url.toString() : `${url.pathname}${url.search}`
}
