import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createEntity, createInvestigation } from '@/domain/factories'
import { SearchField } from '@/features/graph-search/search-field'
import { useGraphStore } from '@/store/graph-store'
import { useViewStore } from '@/store/view-store'

const setCenter = vi.fn()
vi.mock('@xyflow/react', () => ({ useReactFlow: () => ({ setCenter, getZoom: () => 1.5 }) }))

const field = () => screen.getByRole('textbox', { name: 'Rechercher dans le graphe' })

/** Three "Cible" entities, one below the other, and an unrelated one. */
function loadGraph() {
  const investigation = createInvestigation('Test')
  const at = (label: string, y: number) => createEntity(investigation.id, 'person', { x: 0, y }, label)
  const entities = [at('Cible C', 200), at('Cible A', 0), at('Cible B', 100), at('Autre', 300)]
  useGraphStore.getState().load({ investigation, entities, relations: [], sources: [] })
  return entities
}

async function search(query: string) {
  const user = userEvent.setup()
  render(<SearchField />)
  await user.click(field())
  if (query) await user.keyboard(query)
  return user
}

describe('SearchField', () => {
  beforeEach(() => {
    setCenter.mockClear()
    useViewStore.getState().reset()
  })
  afterEach(() => useGraphStore.getState().close())

  it('shows no counter without a search', () => {
    loadGraph()
    render(<SearchField />)
    expect(field()).toHaveValue('')
    expect(screen.queryByText(/résultat/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Effacer la recherche' })).not.toBeInTheDocument()
  })

  it('counts the results, none and one included', async () => {
    loadGraph()
    const user = await search('cible')
    expect(await screen.findByText('3 résultats')).toBeInTheDocument()
    await user.clear(field())
    await user.keyboard('cible a')
    expect(await screen.findByText('1 résultat')).toBeInTheDocument()
    await user.clear(field())
    await user.keyboard('zzz')
    expect(await screen.findByText('Aucun résultat')).toBeInTheDocument()
  })

  it('treats a blank query as no search', async () => {
    loadGraph()
    await search('   ')
    expect(screen.queryByText(/résultat/)).not.toBeInTheDocument()
  })

  it('walks the results with Enter, selecting and centring each, and wraps around', async () => {
    const [, a, b] = loadGraph()
    const user = await search('cible')
    await screen.findByText('3 résultats')

    await user.keyboard('{Enter}')
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    expect(useGraphStore.getState().selection).toEqual({ entityIds: [a!.id], relationIds: [] })
    // The anchor is the circle centre: the slot is 144px wide and the circle's centre is 24px down.
    expect(setCenter).toHaveBeenLastCalledWith(72, 24, { zoom: 1.5, duration: expect.any(Number) })

    await user.keyboard('{Enter}')
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    expect(useGraphStore.getState().selection.entityIds).toEqual([b!.id])

    await user.keyboard('{Enter}{Enter}')
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })

  it('goes back with Shift+Enter, from the start to the last result', async () => {
    const entities = loadGraph()
    const user = await search('cible')
    await screen.findByText('3 résultats')

    await user.keyboard('{Shift>}{Enter}{/Shift}')
    expect(screen.getByText('3 / 3')).toBeInTheDocument()
    expect(useGraphStore.getState().selection.entityIds).toEqual([entities[0]!.id])

    await user.keyboard('{Shift>}{Enter}{/Shift}')
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('has next and previous buttons', async () => {
    loadGraph()
    const user = await search('cible')
    await screen.findByText('3 résultats')
    await user.click(screen.getByRole('button', { name: 'Résultat suivant' }))
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Résultat précédent' }))
    expect(screen.getByText('3 / 3')).toBeInTheDocument()
  })

  it('resets the position when the query changes', async () => {
    loadGraph()
    const user = await search('cible')
    await user.keyboard('{Enter}')
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    await user.keyboard(' a')
    expect(await screen.findByText('1 résultat')).toBeInTheDocument()
  })

  it('clears with Escape and with the clear button', async () => {
    loadGraph()
    const user = await search('cible')
    await user.keyboard('{Escape}')
    expect(field()).toHaveValue('')
    expect(screen.queryByText(/résultat/)).not.toBeInTheDocument()

    await user.keyboard('cible')
    await user.click(screen.getByRole('button', { name: 'Effacer la recherche' }))
    expect(field()).toHaveValue('')
    expect(field()).toHaveFocus()
  })

  it('takes the focus with Ctrl+F, selecting its text, and ignores it while a dialog is open', async () => {
    loadGraph()
    const user = await search('cible')
    await user.click(document.body)
    expect(field()).not.toHaveFocus()

    await user.keyboard('{Control>}f{/Control}')
    expect(field()).toHaveFocus()
    expect(field()).toHaveProperty('selectionStart', 0)
    expect(field()).toHaveProperty('selectionEnd', 'cible'.length)

    await user.click(document.body)
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    document.body.append(dialog)
    await user.keyboard('{Control>}f{/Control}')
    expect(field()).not.toHaveFocus()
    dialog.remove()
    act(() => {})
  })
})
