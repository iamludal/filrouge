import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { z } from 'zod'
import { createFormatters, type Formatters } from '@/lib/format'
import { detectLocale, storeLocale } from './detect'
import { en } from './messages/en'
import { fr } from './messages/fr'
import type { Locale, Messages } from './types'

interface I18nContextValue {
  locale: Locale
  t: Messages
  format: Formatters
  setLocale: (locale: Locale) => void
}

const DICTIONARIES: Record<Locale, Messages> = { fr, en }

function build(locale: Locale, setLocale: (locale: Locale) => void): I18nContextValue {
  const t = DICTIONARIES[locale]
  return { locale, t, format: createFormatters(locale, t.common.units), setLocale }
}

// French is the default so a component rendered on its own (tests) needs no provider.
const I18nContext = createContext<I18nContextValue>(build('fr', () => {}))

/** Words the validator's own messages (used in import errors) in the active language. */
function applyZodLocale(locale: Locale) {
  z.config(locale === 'fr' ? z.locales.fr() : z.locales.en())
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    storeLocale(next)
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
    applyZodLocale(locale)
  }, [locale])

  const value = useMemo(() => build(locale, setLocale), [locale, setLocale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): I18nContextValue {
  return useContext(I18nContext)
}
