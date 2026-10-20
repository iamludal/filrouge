import { ReactFlowProvider } from '@xyflow/react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createInvestigation } from '@/domain/factories'
import { CompactGraphToolbar } from '@/features/graph/compact-graph-toolbar'
import { useGraphStore } from '@/store/graph-store'
import { useViewStore } from '@/store/view-store'

function setup() {
  useGraphStore
    .getState()
    .load({ investigation: createInvestigation('Test'), entities: [], relations: [], sources: [] })
  useViewStore.getState().reset()
  const onExportJson = vi.fn()
  render(
    <ReactFlowProvider>
      <TooltipProvider>
        <CompactGraphToolbar name="Affaire test" onExportJson={onExportJson} />
      </TooltipProvider>
    </ReactFlowProvider>,
  )
  return { onExportJson, user: userEvent.setup() }
}

describe('CompactGraphToolbar', () => {
  afterEach(() => {
    useGraphStore.getState().close()
    useViewStore.getState().reset()
  })

  it('keeps only the essentials in the bar', () => {
    setup()
    expect(screen.getByRole('link', { name: 'Retour aux enquêtes' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Affaire test' })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Enregistré' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rechercher dans le graphe' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Plus d’actions' })).toBeInTheDocument()
    for (const name of [/Filtres/, /Sources/, 'Exporter', 'Rétablir'])
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument()
  })

  it('lists the other actions in the overflow menu', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Plus d’actions' }))
    for (const name of ['Rétablir', 'Filtres', 'Sources (0)', 'JSON', 'PNG', 'SVG'])
      expect(await screen.findByRole('menuitem', { name })).toBeInTheDocument()
  })

  it('exports JSON from the menu', async () => {
    const { user, onExportJson } = setup()
    await user.click(screen.getByRole('button', { name: 'Plus d’actions' }))
    await user.click(await screen.findByRole('menuitem', { name: 'JSON' }))
    expect(onExportJson).toHaveBeenCalledOnce()
  })

  it('redoes from the menu', async () => {
    const { user } = setup()
    act(() => {
      useGraphStore.getState().addEntity('person', { x: 0, y: 0 })
    })
    await user.click(await screen.findByRole('button', { name: 'Annuler' }))
    expect(Object.keys(useGraphStore.getState().entities)).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: 'Plus d’actions' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Rétablir' }))
    expect(Object.keys(useGraphStore.getState().entities)).toHaveLength(1)
  })

  it('reveals the search field with the focus, and closing it clears the query', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Rechercher dans le graphe' }))
    const field = screen.getByRole('textbox', { name: 'Rechercher dans le graphe' })
    expect(field).toHaveFocus()
    expect(screen.queryByRole('heading', { name: 'Affaire test' })).not.toBeInTheDocument()

    await user.type(field, 'jean')
    expect(useViewStore.getState().query).toBe('jean')

    await user.click(screen.getByRole('button', { name: 'Fermer la recherche' }))
    expect(useViewStore.getState().query).toBe('')
    expect(screen.getByRole('heading', { name: 'Affaire test' })).toBeInTheDocument()
  })

  it('opens the filters in a dialog', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Plus d’actions' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Filtres' }))
    expect(await screen.findByRole('dialog', { name: 'Filtres' })).toBeInTheDocument()
  })

  it('signals active filters with a dot and a count', async () => {
    const { user } = setup()
    expect(screen.queryByTestId('filters-dot')).not.toBeInTheDocument()
    act(() => useViewStore.getState().setFilters({ types: ['email'] }))
    expect(screen.getByTestId('filters-dot')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Plus d’actions' }))
    expect(await screen.findByRole('menuitem', { name: /^Filtres\s*1$/ })).toBeInTheDocument()
  })
})
