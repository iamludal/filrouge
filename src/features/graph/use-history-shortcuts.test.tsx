import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createInvestigation } from '@/domain/factories'
import { useHistoryShortcuts } from '@/features/graph/use-history-shortcuts'
import { useGraphStore } from '@/store/graph-store'

function Harness({ dialog = false }: { dialog?: boolean }) {
  useHistoryShortcuts()
  return (
    <div>
      <button>Canevas</button>
      <textarea aria-label="Notes" />
      {dialog && <div role="dialog" aria-label="Ajouter une entité" />}
    </div>
  )
}

function setup() {
  useGraphStore
    .getState()
    .load({ investigation: createInvestigation('Test'), entities: [], relations: [], sources: [] })
  return useGraphStore.getState().addEntity('person', { x: 0, y: 0 }, 'A')
}

const entityCount = () => Object.keys(useGraphStore.getState().entities).length

describe('useHistoryShortcuts', () => {
  afterEach(() => useGraphStore.getState().close())

  it.each([
    ['Ctrl', '{Control>}z{/Control}', '{Control>}{Shift>}z{/Shift}{/Control}'],
    ['Cmd', '{Meta>}z{/Meta}', '{Meta>}{Shift>}z{/Shift}{/Meta}'],
  ])('undoes with %s+Z and redoes with %s+Shift+Z', async (_modifier, undo, redo) => {
    setup()
    render(<Harness />)
    const user = userEvent.setup()

    await user.keyboard(undo)
    expect(entityCount()).toBe(0)
    await user.keyboard(redo)
    expect(entityCount()).toBe(1)
  })

  it('redoes with Ctrl+Y', async () => {
    setup()
    render(<Harness />)
    const user = userEvent.setup()

    await user.keyboard('{Control>}z{/Control}')
    expect(entityCount()).toBe(0)
    await user.keyboard('{Control>}y{/Control}')
    expect(entityCount()).toBe(1)
  })

  it('leaves the graph alone while typing in a text field', async () => {
    setup()
    render(<Harness />)
    const user = userEvent.setup()

    await user.click(screen.getByLabelText('Notes'))
    await user.keyboard('{Control>}z{/Control}')
    expect(entityCount()).toBe(1)
  })

  it('does nothing while a dialog is open', async () => {
    setup()
    render(<Harness dialog />)
    const user = userEvent.setup()

    await user.keyboard('{Control>}z{/Control}')
    expect(entityCount()).toBe(1)
  })

  it('works with the focus on a button', async () => {
    setup()
    render(<Harness />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Canevas' }))
    await user.keyboard('{Meta>}z{/Meta}')
    expect(entityCount()).toBe(0)
  })

  it('ignores other keys and stops listening on unmount', async () => {
    setup()
    const { unmount } = render(<Harness />)
    const user = userEvent.setup()

    await user.keyboard('z')
    await user.keyboard('{Control>}a{/Control}')
    expect(entityCount()).toBe(1)

    unmount()
    await user.keyboard('{Control>}z{/Control}')
    expect(entityCount()).toBe(1)
  })
})
