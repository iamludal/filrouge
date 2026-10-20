import { LOCALES, type Locale } from './types'

export const LOCALE_STORAGE_KEY = 'filrouge:locale'

const FALLBACK: Locale = 'en'

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/**
 * The language to use: the stored choice when valid, else the first browser language whose primary
 * subtag is supported (region and case ignored), else English.
 */
export function resolveLocale(stored: unknown, languages: readonly string[]): Locale {
  if (isLocale(stored)) return stored
  for (const language of languages) {
    const primary = language.toLowerCase().split('-')[0]
    if (isLocale(primary)) return primary
  }
  return FALLBACK
}

export function readStoredLocale(): string | null {
  try {
    return localStorage.getItem(LOCALE_STORAGE_KEY)
  } catch {
    return null // storage unavailable (private mode…)
  }
}

export function storeLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // ignore: the choice then only lasts for the session
  }
}

/** The preferred languages of the browser, which follow the operating system's by default. */
export function browserLanguages(): readonly string[] {
  return navigator.languages?.length ? navigator.languages : [navigator.language]
}

export function detectLocale(): Locale {
  return resolveLocale(readStoredLocale(), browserLanguages())
}
