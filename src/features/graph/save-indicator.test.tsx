import { act, render, screen } from '@testing-library/react'
import { SaveIndicator } from '@/features/graph/save-indicator'
import { useGraphStore } from '@/store/graph-store'

const STATUSES = [
  ['saved', 'Enregistré'],
  ['saving', 'Enregistrement…'],
  ['error', 'Échec de l’enregistrement'],
] as const

describe('SaveIndicator', () => {
  afterEach(() => act(() => useGraphStore.setState({ saveStatus: 'saved' })))

  it.each(STATUSES)('shows the %s status as text', (status, text) => {
    act(() => useGraphStore.setState({ saveStatus: status }))
    render(<SaveIndicator />)
    expect(screen.getByRole('status')).toHaveTextContent(text)
  })

  it.each(STATUSES)('names the %s status without showing text when icon-only', (status, text) => {
    act(() => useGraphStore.setState({ saveStatus: status }))
    render(<SaveIndicator iconOnly />)
    const indicator = screen.getByRole('status', { name: text })
    expect(indicator).toHaveTextContent('')
    expect(indicator.querySelector('svg')).not.toBeNull()
  })
})
