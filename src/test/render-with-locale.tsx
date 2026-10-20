import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { LocaleProvider } from '@/i18n/locale'
import type { Locale } from '@/i18n/types'

/** Renders `ui` as a user whose chosen language is `locale` (the suites default to French). */
export function renderWithLocale(ui: ReactElement, locale: Locale) {
  localStorage.setItem('filrouge:locale', locale)
  return render(<LocaleProvider>{ui}</LocaleProvider>)
}
