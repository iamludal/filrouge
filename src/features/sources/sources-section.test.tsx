import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createInvestigation } from '@/domain/factories'
import { SourcesSection } from '@/features/sources/sources-section'
import { useGraphStore, type ElementRef } from '@/store/graph-store'

function setupGraph() {
  useGraphStore
    .getState()
    .load({ investigation: createInvestigation('Test'), entities: [], relations: [], sources: [] })
  const store = useGraphStore.getState()
  const a = store.addEntity('person', { x: 0, y: 0 }, 'Alice')
  const b = store.addEntity('email', { x: 0, y: 0 }, 'alice@example.org')
  return {
    a,
    b,
    refA: { type: 'entity', id: a.id } as ElementRef,
    refB: { type: 'entity', id: b.id } as ElementRef,
  }
}

async function openMenu(item: 'Nouvelle source' | 'Source existante') {
  await userEvent.click(screen.getByRole('button', { name: 'Ajouter une source' }))
  await userEvent.click(await screen.findByRole('menuitem', { name: item }))
}

describe('SourcesSection', () => {
  afterEach(() => useGraphStore.getState().close())

  it('lists attached sources by display name, with a screenshot indicator', () => {
    const { refA } = setupGraph()
    const store = useGraphStore.getState()
    store.createSource({ title: 'Profil LinkedIn' }, undefined, refA)
    store.createSource({ url: 'https://exemple.fr/page' }, undefined, refA)
    store.createSource(
      {},
      {
        id: crypto.randomUUID(),
        investigationId: useGraphStore.getState().investigation!.id,
        blob: new Blob(['x']),
        mime: 'image/png',
        size: 1,
        sha256: 'a'.repeat(64),
      },
      refA,
    )
    render(<SourcesSection element={refA} />)
    const list = screen.getByRole('list', { name: 'Sources attachées' })
    expect(within(list).getByText('Profil LinkedIn')).toBeInTheDocument()
    expect(within(list).getByText('exemple.fr')).toBeInTheDocument()
    expect(within(list).getByText('Source sans titre')).toBeInTheDocument()
    expect(within(list).getAllByLabelText('Avec capture')).toHaveLength(1)
  })

  it('creates a new source attached to the element', async () => {
    const { a, refA } = setupGraph()
    render(<SourcesSection element={refA} />)
    await openMenu('Nouvelle source')
    await userEvent.type(await screen.findByLabelText('Titre'), 'Profil LinkedIn')
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByText('Profil LinkedIn')).toBeInTheDocument()
    expect(useGraphStore.getState().entities[a.id]?.sourceIds).toHaveLength(1)
  })

  it('attaches an existing source found with the keyboard, excluding attached ones', async () => {
    const { b, refA, refB } = setupGraph()
    const store = useGraphStore.getState()
    store.createSource({ title: 'Déjà là' }, undefined, refA)
    const other = store.createSource({ title: 'Capture Telegram' }, undefined, refB)!
    store.createSource({ title: 'Autre chose' })
    render(<SourcesSection element={refA} />)

    await openMenu('Source existante')
    const list = await screen.findByRole('listbox', { name: 'Sources' })
    expect(within(list).queryByText('Déjà là')).not.toBeInTheDocument()
    expect(within(list).getAllByRole('option')).toHaveLength(2)

    await userEvent.type(screen.getByLabelText('Filtrer les sources'), 'telegr')
    expect(within(screen.getByRole('listbox', { name: 'Sources' })).getAllByRole('option')).toHaveLength(1)
    await userEvent.keyboard('{Enter}')

    expect(await screen.findByText('Capture Telegram')).toBeInTheDocument()
    const state = useGraphStore.getState()
    expect(Object.keys(state.sources)).toHaveLength(3)
    expect(state.entities[b.id]?.sourceIds).toEqual([other.id])
  })

  it('detaches a shared source without confirmation', async () => {
    const { a, b, refA, refB } = setupGraph()
    const source = useGraphStore.getState().createSource({ title: 'Partagée' }, undefined, refA)!
    useGraphStore.getState().attachSource(refB, source.id)
    render(<SourcesSection element={refA} />)

    await userEvent.click(screen.getByRole('button', { name: 'Retirer Partagée' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    const state = useGraphStore.getState()
    expect(state.entities[a.id]?.sourceIds).toEqual([])
    expect(state.entities[b.id]?.sourceIds).toEqual([source.id])
  })

  it('asks what to do with the last reference: the box is unchecked by default', async () => {
    const { a, refA } = setupGraph()
    const source = useGraphStore.getState().createSource({ title: 'Seule' }, undefined, refA)!
    render(<SourcesSection element={refA} />)

    await userEvent.click(screen.getByRole('button', { name: 'Retirer Seule' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByLabelText('Supprimer aussi la source et sa capture')).not.toBeChecked()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Retirer' }))

    const state = useGraphStore.getState()
    expect(state.entities[a.id]?.sourceIds).toEqual([])
    expect(state.sources[source.id]).toBeDefined()
  })

  it('deletes the source too when the box is checked', async () => {
    const { refA } = setupGraph()
    const source = useGraphStore.getState().createSource({ title: 'Seule' }, undefined, refA)!
    render(<SourcesSection element={refA} />)

    await userEvent.click(screen.getByRole('button', { name: 'Retirer Seule' }))
    const dialog = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialog).getByLabelText('Supprimer aussi la source et sa capture'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Retirer' }))
    expect(useGraphStore.getState().sources[source.id]).toBeUndefined()
  })

  it('keeps everything when the confirmation is cancelled', async () => {
    const { a, refA } = setupGraph()
    const source = useGraphStore.getState().createSource({ title: 'Seule' }, undefined, refA)!
    render(<SourcesSection element={refA} />)

    await userEvent.click(screen.getByRole('button', { name: 'Retirer Seule' }))
    await userEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Annuler' }),
    )
    expect(useGraphStore.getState().entities[a.id]?.sourceIds).toEqual([source.id])
  })

  it('shows source edits on every element the source is attached to', async () => {
    const { refA, refB } = setupGraph()
    const source = useGraphStore.getState().createSource({ title: 'Avant' }, undefined, refA)!
    useGraphStore.getState().attachSource(refB, source.id)
    render(
      <>
        <SourcesSection element={refA} />
        <SourcesSection element={refB} />
      </>,
    )
    expect(screen.getAllByText('Avant')).toHaveLength(2)
    useGraphStore.getState().updateSource(source.id, { title: 'Capture Telegram' })
    expect(await screen.findAllByText('Capture Telegram')).toHaveLength(2)
  })
})
