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

  it('links to the source repository in a new tab', () => {
    render(
      <Providers>
        <App />
      </Providers>,
    )
    const link = screen.getByRole('link', { name: 'Code source sur GitHub' })
    expect(link).toHaveAttribute('href', 'https://github.com/iamludal/filrouge')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('links to a new GitHub issue to report a bug', () => {
    render(
      <Providers>
        <App />
      </Providers>,
    )
    const link = screen.getByRole('link', { name: 'Signaler un bug' })
    expect(link).toHaveAttribute('href', 'https://github.com/iamludal/filrouge/issues/new')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
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
