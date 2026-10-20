import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createInvestigation } from '@/domain/factories'
import { fr } from '@/i18n/messages/fr'
import { SourcesLibrary } from '@/features/sources/sources-library-dialog'
import { useGraphStore } from '@/store/graph-store'

function setupGraph() {
  useGraphStore
    .getState()
    .load({ investigation: createInvestigation('Test'), entities: [], relations: [], sources: [] })
  const store = useGraphStore.getState()
  const a = store.addEntity('person', { x: 0, y: 0 })
  const b = store.addEntity('email', { x: 0, y: 0 })
  const relation = store.addRelation(a.id, b.id, 'utilise')!
  return { a, b, relation }
}

describe('sources.usage', () => {
  it('handles none, one and many', () => {
    expect(fr.sources.usage(0)).toBe('Non utilisée')
    expect(fr.sources.usage(1)).toBe('1 utilisation')
    expect(fr.sources.usage(3)).toBe('3 utilisations')
  })
})

describe('SourcesLibrary', () => {
  afterEach(() => useGraphStore.getState().close())

  it('shows the source count on the toolbar button', () => {
    setupGraph()
    useGraphStore.getState().createSource({ title: 'A' })
    useGraphStore.getState().createSource({ title: 'B' })
    render(<SourcesLibrary />)
    expect(screen.getByRole('button', { name: 'Sources (2)' })).toBeInTheDocument()
  })

  it('counts the uses of a source across entities and relations, and flags unused ones', async () => {
    const { a, b, relation } = setupGraph()
    const store = useGraphStore.getState()
    const used = store.createSource({ title: 'Utilisée' }, undefined, { type: 'entity', id: a.id })!
    store.attachSource({ type: 'entity', id: b.id }, used.id)
    store.attachSource({ type: 'relation', id: relation.id }, used.id)
    store.createSource({ title: 'Orpheline' })

    render(<SourcesLibrary />)
    await userEvent.click(screen.getByRole('button', { name: 'Sources (2)' }))
    const list = await screen.findByRole('list', { name: `Sources de l'enquête` })
    const items = within(list).getAllByRole('listitem')
    expect(within(items[0]!).getByText('3 utilisations')).toBeInTheDocument()
    expect(within(items[1]!).getByText('Non utilisée')).toBeInTheDocument()
  })

  it('deletes a used source after confirmation, detaching it everywhere', async () => {
    const { a, b } = setupGraph()
    const store = useGraphStore.getState()
    const source = store.createSource({ title: 'Partagée' }, undefined, { type: 'entity', id: a.id })!
    store.attachSource({ type: 'entity', id: b.id }, source.id)

    render(<SourcesLibrary />)
    await userEvent.click(screen.getByRole('button', { name: 'Sources (1)' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Supprimer Partagée' }))
    const confirm = await screen.findByRole('alertdialog')
    expect(within(confirm).getByText(/Elle sera retirée de 2 éléments/)).toBeInTheDocument()
    await userEvent.click(within(confirm).getByRole('button', { name: 'Supprimer' }))

    const state = useGraphStore.getState()
    expect(state.sources[source.id]).toBeUndefined()
    expect(state.entities[a.id]?.sourceIds).toEqual([])
    expect(state.entities[b.id]?.sourceIds).toEqual([])
  })

  it('keeps the source when the deletion is cancelled', async () => {
    setupGraph()
    const source = useGraphStore.getState().createSource({ title: 'Gardée' })!
    render(<SourcesLibrary />)
    await userEvent.click(screen.getByRole('button', { name: 'Sources (1)' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Supprimer Gardée' }))
    await userEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Annuler' }),
    )
    expect(useGraphStore.getState().sources[source.id]).toBeDefined()
  })

  it('edits a source from the list', async () => {
    setupGraph()
    const source = useGraphStore.getState().createSource({ title: 'Avant' })!
    render(<SourcesLibrary />)
    await userEvent.click(screen.getByRole('button', { name: 'Sources (1)' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Modifier Avant' }))
    const title = await screen.findByLabelText('Titre')
    await userEvent.clear(title)
    await userEvent.type(title, 'Après')
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(useGraphStore.getState().sources[source.id]?.title).toBe('Après')
  })
})
