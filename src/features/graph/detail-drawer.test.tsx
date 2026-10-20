import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createInvestigation } from '@/domain/factories'
import { DetailDrawer } from '@/features/graph/detail-drawer'
import { useGraphStore } from '@/store/graph-store'

function setup() {
  const { load, addEntity, addRelation } = useGraphStore.getState()
  load({ investigation: createInvestigation('Test'), entities: [], relations: [], sources: [] })
  const jean = addEntity('person', { x: 0, y: 0 }, 'Jean')
  const marie = addEntity('person', { x: 100, y: 0 }, 'Marie')
  const blank = addEntity('person', { x: 200, y: 0 }, '')
  const relation = addRelation(jean.id, marie.id, 'connaît')!
  select({ entityIds: [], relationIds: [] })
  render(
    <TooltipProvider>
      <DetailDrawer />
    </TooltipProvider>,
  )
  return { jean, marie, blank, relation }
}

const select = (selection: { entityIds: string[]; relationIds: string[] }) =>
  act(() => useGraphStore.getState().setSelection(selection))

const handle = () => screen.getByRole('button', { name: /Déplier le panneau|Replier le panneau/ })

/** A finger dragging the handle by `dy` pixels. */
function drag(dy: number) {
  const element = handle()
  fireEvent.pointerDown(element, { clientY: 500, pointerId: 1 })
  fireEvent.pointerMove(element, { clientY: 500 + dy, pointerId: 1 })
  fireEvent.pointerUp(element, { clientY: 500 + dy, pointerId: 1 })
  // The browser follows a drag with a click on the same element.
  fireEvent.click(element)
}

describe('DetailDrawer', () => {
  afterEach(() => useGraphStore.getState().close())

  it('is absent while nothing is selected', () => {
    setup()
    expect(screen.queryByRole('region', { name: 'Panneau de détail' })).not.toBeInTheDocument()
  })

  it('summarises the selection when collapsed', () => {
    const { jean, marie, blank, relation } = setup()

    select({ entityIds: [jean.id], relationIds: [] })
    expect(within(handle()).getByText('Personne')).toBeInTheDocument()
    expect(within(handle()).getByText('Jean')).toBeInTheDocument()

    select({ entityIds: [blank.id], relationIds: [] })
    expect(within(handle()).getByText('Personne sans nom')).toBeInTheDocument()

    select({ entityIds: [], relationIds: [relation.id] })
    expect(within(handle()).getByText('connaît')).toBeInTheDocument()
    expect(within(handle()).getByText('Jean → Marie')).toBeInTheDocument()

    select({ entityIds: [jean.id, marie.id], relationIds: [relation.id] })
    expect(within(handle()).getByText('3 éléments sélectionnés')).toBeInTheDocument()
  })

  it('hides the editor while collapsed and shows it once expanded', async () => {
    const { jean } = setup()
    select({ entityIds: [jean.id], relationIds: [] })
    expect(screen.queryByLabelText('Libellé')).not.toBeVisible()
    expect(handle()).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(screen.getByRole('button', { name: 'Déplier le panneau' }))
    expect(screen.getByLabelText('Libellé')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Replier le panneau' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Replier le panneau' }))
    expect(screen.getByLabelText('Libellé')).not.toBeVisible()
  })

  it('expands on a long upward drag and ignores a short one', () => {
    const { jean } = setup()
    select({ entityIds: [jean.id], relationIds: [] })

    drag(-20)
    expect(handle()).toHaveAttribute('aria-expanded', 'false')

    drag(-100)
    expect(handle()).toHaveAttribute('aria-expanded', 'true')
  })

  it('collapses on a downward drag from expanded, keeping the selection', () => {
    const { jean } = setup()
    select({ entityIds: [jean.id], relationIds: [] })
    drag(-100)
    drag(100)
    expect(handle()).toHaveAttribute('aria-expanded', 'false')
    expect(useGraphStore.getState().selection.entityIds).toEqual([jean.id])
  })

  it('clears the selection on a downward drag from collapsed', () => {
    const { jean } = setup()
    select({ entityIds: [jean.id], relationIds: [] })
    drag(100)
    expect(useGraphStore.getState().selection).toEqual({ entityIds: [], relationIds: [] })
    expect(screen.queryByRole('region', { name: 'Panneau de détail' })).not.toBeInTheDocument()
  })

  it('closes with the “Fermer” button', async () => {
    const { jean } = setup()
    select({ entityIds: [jean.id], relationIds: [] })
    await userEvent.click(screen.getByRole('button', { name: 'Déplier le panneau' }))
    await userEvent.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(useGraphStore.getState().selection).toEqual({ entityIds: [], relationIds: [] })
  })

  it('starts collapsed again for the next selection', async () => {
    const { jean, marie } = setup()
    select({ entityIds: [jean.id], relationIds: [] })
    await userEvent.click(screen.getByRole('button', { name: 'Déplier le panneau' }))
    await userEvent.click(screen.getByRole('button', { name: 'Fermer' }))
    select({ entityIds: [marie.id], relationIds: [] })
    expect(handle()).toHaveAttribute('aria-expanded', 'false')
  })

  it('stays expanded and shows the new editor when the selection switches element', async () => {
    const { jean, relation } = setup()
    select({ entityIds: [jean.id], relationIds: [] })
    await userEvent.click(screen.getByRole('button', { name: 'Déplier le panneau' }))
    select({ entityIds: [], relationIds: [relation.id] })
    expect(handle()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('heading', { name: 'Relation' })).toBeVisible()
  })
})
