import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from '@/components/ui/tooltip'
import { HistoryControls } from '@/features/graph/history-controls'
import { createInvestigation } from '@/domain/factories'
import { useGraphStore } from '@/store/graph-store'

function setup() {
  useGraphStore
    .getState()
    .load({ investigation: createInvestigation('Test'), entities: [], relations: [], sources: [] })
  render(
    <TooltipProvider>
      <HistoryControls />
    </TooltipProvider>,
  )
  return {
    undo: screen.getByRole('button', { name: 'Annuler' }),
    redo: screen.getByRole('button', { name: 'Rétablir' }),
  }
}

describe('HistoryControls', () => {
  afterEach(() => {
    useGraphStore.getState().close()
    vi.restoreAllMocks()
  })

  it('shows icon-only buttons named “Annuler” and “Rétablir”, both disabled on a fresh investigation', () => {
    const { undo, redo } = setup()
    expect(undo).toBeDisabled()
    expect(redo).toBeDisabled()
    expect(undo).toHaveTextContent('')
    expect(undo.querySelector('svg')).not.toBeNull()
    expect(redo.querySelector('svg')).not.toBeNull()
  })

  it('follows the history: undo enabled after an edit, redo enabled after an undo', async () => {
    const { undo, redo } = setup()
    const user = userEvent.setup()

    useGraphStore.getState().addEntity('person', { x: 0, y: 0 })
    expect(await screen.findByRole('button', { name: 'Annuler' })).toBeEnabled()
    expect(redo).toBeDisabled()

    await user.click(undo)
    expect(Object.keys(useGraphStore.getState().entities)).toHaveLength(0)
    expect(undo).toBeDisabled()
    expect(redo).toBeEnabled()

    await user.click(redo)
    expect(Object.keys(useGraphStore.getState().entities)).toHaveLength(1)
    expect(undo).toBeEnabled()
    expect(redo).toBeDisabled()
  })

  it('shows the action and its shortcut in a tooltip on hover, even on a disabled button', async () => {
    const { undo } = setup()
    await userEvent.setup().hover(undo)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Annuler (Ctrl+Z)')
  })

  it('shows the tooltip when the button gets keyboard focus', async () => {
    setup()
    useGraphStore.getState().addEntity('person', { x: 0, y: 0 })
    useGraphStore.getState().undo()
    const user = userEvent.setup()

    // “Annuler” is disabled and skipped by Tab: “Rétablir” is the only stop.
    await user.tab()
    expect(screen.getByRole('button', { name: 'Rétablir' })).toHaveFocus()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Rétablir (Ctrl+Shift+Z)')
  })

  it('writes the macOS shortcut with symbols', async () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel')
    const { undo } = setup()
    await userEvent.setup().hover(undo)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Annuler (⌘Z)')
  })
})
