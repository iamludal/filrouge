import { act, render, screen, waitFor } from '@testing-library/react'
import { App } from '@/app/app'
import { Providers } from '@/app/providers'
import { useGraphStore } from '@/store/graph-store'
import { createInvestigation } from '@/domain/factories'

describe('App shell', () => {
  it('renders the brand and the theme toggle', () => {
    render(
      <Providers>
        <App />
      </Providers>,
    )
    expect(screen.getByRole('link', { name: 'Filrouge' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Changer de thème' })).toBeInTheDocument()
  })

  it('shows only the brand in the document title on the home screen', () => {
    window.location.hash = '#/'
    render(
      <Providers>
        <App />
      </Providers>,
    )
    expect(document.title).toBe('Filrouge')
  })

  it('appends the open investigation name to the document title', async () => {
    const investigation = createInvestigation('Affaire Dupont')
    window.location.hash = `#/i/${investigation.id}`
    useGraphStore.setState({ investigation })
    render(
      <Providers>
        <App />
      </Providers>,
    )
    await waitFor(() => expect(document.title).toBe('Affaire Dupont – Filrouge'))
    act(() => useGraphStore.setState({ investigation: { ...investigation, name: 'Renommée' } }))
    await waitFor(() => expect(document.title).toBe('Renommée – Filrouge'))
  })
})
