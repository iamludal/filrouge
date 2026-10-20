import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createInvestigation } from '@/domain/factories'
import { DetailPanel } from '@/features/graph/detail-panel'
import { useGraphStore } from '@/store/graph-store'

function setup() {
  const { load, addEntity, addRelation } = useGraphStore.getState()
  load({ investigation: createInvestigation('Test'), entities: [], relations: [], sources: [] })
  const a = addEntity('person', { x: 0, y: 0 }, 'A')
  const b = addEntity('person', { x: 100, y: 0 }, 'B')
  const c = addEntity('person', { x: 200, y: 0 }, 'C')
  const ac = addRelation(a.id, c.id, 'lié')!
  // Previous steps are history: only the deletion is under test.
  useGraphStore.temporal.getState().clear()
  render(
    <TooltipProvider>
      <DetailPanel />
    </TooltipProvider>,
  )
  return { a, b, c, ac }
}

describe('DetailPanel selection states', () => {
  afterEach(() => useGraphStore.getState().close())

  it('invites the user to select something when nothing is selected', () => {
    setup()
    act(() => useGraphStore.getState().setSelection({ entityIds: [], relationIds: [] }))
    expect(screen.getByText('Sélectionnez une entité ou une relation pour la modifier.')).toBeInTheDocument()
  })

  it('counts a multiple selection', () => {
    const { a, b, ac } = setup()
    act(() => useGraphStore.getState().setSelection({ entityIds: [a.id, b.id], relationIds: [ac.id] }))
    expect(screen.getByText('3 éléments sélectionnés. Suppr pour les supprimer.')).toBeInTheDocument()
  })

  it('deletes a multiple selection with its orphaned relations in one undoable step', async () => {
    const { a, b, c } = setup()
    act(() => useGraphStore.getState().setSelection({ entityIds: [a.id, b.id], relationIds: [] }))
    await userEvent.click(await screen.findByRole('button', { name: 'Supprimer la sélection' }))

    const after = useGraphStore.getState()
    expect(Object.keys(after.entities)).toEqual([c.id])
    expect(Object.keys(after.relations)).toHaveLength(0)

    useGraphStore.temporal.getState().undo()
    const restored = useGraphStore.getState()
    expect(Object.keys(restored.entities)).toHaveLength(3)
    expect(Object.keys(restored.relations)).toHaveLength(1)
  })
})
