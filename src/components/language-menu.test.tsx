import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '@/app/app'
import { Providers } from '@/app/providers'

describe('LanguageMenu', () => {
  it('offers both languages, the active one checked', async () => {
    const user = userEvent.setup()
    render(
      <Providers>
        <App />
      </Providers>,
    )
    await user.click(screen.getByRole('button', { name: 'Changer de langue' }))
    expect(screen.getByRole('menuitemradio', { name: 'Français' })).toBeChecked()
    expect(screen.getByRole('menuitemradio', { name: 'English' })).not.toBeChecked()
  })

  it('switches the whole header to English and remembers it', async () => {
    const user = userEvent.setup()
    render(
      <Providers>
        <App />
      </Providers>,
    )
    await user.click(screen.getByRole('button', { name: 'Changer de langue' }))
    await user.click(screen.getByRole('menuitemradio', { name: 'English' }))
    expect(screen.getByRole('button', { name: 'Change language' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change theme' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Source code on GitHub' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
    expect(localStorage.getItem('filrouge:locale')).toBe('en')
  })

  it('shows the language chosen before', async () => {
    const user = userEvent.setup()
    localStorage.setItem('filrouge:locale', 'en')
    render(
      <Providers>
        <App />
      </Providers>,
    )
    await user.click(screen.getByRole('button', { name: 'Change language' }))
    expect(screen.getByRole('menuitemradio', { name: 'English' })).toBeChecked()
  })
})
