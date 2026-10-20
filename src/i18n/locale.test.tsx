import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { LocaleProvider, useI18n } from './locale'

function Probe() {
  const { locale, t } = useI18n()
  return (
    <p>
      {locale} {t.common.brand} {t.common.cancel}
    </p>
  )
}

describe('useI18n', () => {
  it('gives the active locale and its dictionary to consumers', () => {
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    )
    expect(screen.getByText('fr Filrouge Annuler')).toBeInTheDocument()
  })

  it('falls back to French outside the provider', () => {
    render(<Probe />)
    expect(screen.getByText('fr Filrouge Annuler')).toBeInTheDocument()
  })
})

describe('LocaleProvider', () => {
  afterEach(() => localStorage.clear())

  it('switches language, keeps the choice and sets the document language', async () => {
    const user = userEvent.setup()
    localStorage.setItem('filrouge:locale', 'fr')
    function Switch() {
      const { t, setLocale } = useI18n()
      return <button onClick={() => setLocale('en')}>{t.common.cancel}</button>
    }
    render(
      <LocaleProvider>
        <Switch />
      </LocaleProvider>,
    )
    expect(document.documentElement.lang).toBe('fr')
    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
    expect(localStorage.getItem('filrouge:locale')).toBe('en')
  })

  it('still switches for the session when storage throws', async () => {
    const user = userEvent.setup()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    function Switch() {
      const { t, setLocale } = useI18n()
      return <button onClick={() => setLocale('en')}>{t.common.cancel}</button>
    }
    render(
      <LocaleProvider>
        <Switch />
      </LocaleProvider>,
    )
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    vi.restoreAllMocks()
  })
})
