import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createEntity, createInvestigation } from '@/domain/factories'
import { EMPTY_FILTERS } from '@/domain/graph-view'
import type { Entity } from '@/domain/schemas'
import { FiltersButton } from '@/features/graph-search/filters-panel'
import { useGraphStore } from '@/store/graph-store'
import { useViewStore } from '@/store/view-store'

function load(entities: (investigationId: string) => Entity[]) {
  const investigation = createInvestigation('Test')
  useGraphStore
    .getState()
    .load({ investigation, entities: entities(investigation.id), relations: [], sources: [] })
}

const at = (id: string, type: Entity['type'], tags: string[] = []): Entity => ({
  ...createEntity(id, type, { x: 0, y: 0 }, type),
  tags,
})

async function openPanel() {
  const user = userEvent.setup()
  render(<FiltersButton />)
  await user.click(screen.getByRole('button', { name: /Filtres/ }))
  return user
}

describe('FiltersButton', () => {
  beforeEach(() => useViewStore.getState().reset())
  afterEach(() => useGraphStore.getState().close())

  it('lists the used types with their counts, and no other', async () => {
    load((id) => [at(id, 'person'), at(id, 'person'), at(id, 'person'), at(id, 'email'), at(id, 'email')])
    await openPanel()

    expect(screen.getByRole('checkbox', { name: 'Personne (3)' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Email (2)' })).not.toBeChecked()
    expect(screen.queryByRole('checkbox', { name: /Domaine/ })).not.toBeInTheDocument()
  })

  it('lists tags once whatever their case, or says there is none', async () => {
    load((id) => [at(id, 'person', ['Cible']), at(id, 'email', ['cible', 'suspect'])])
    const user = await openPanel()

    expect(screen.getByRole('button', { name: 'Cible (2)' })).toHaveAttribute('aria-pressed', 'false')
    const suspect = screen.getByRole('button', { name: 'suspect (1)' })
    await user.click(suspect)
    expect(useViewStore.getState().filters.tags).toEqual(['suspect'])
    expect(suspect).toHaveAttribute('aria-pressed', 'true')
  })

  it('reads "Aucun tag dans cette enquête" without tags', async () => {
    load((id) => [at(id, 'person')])
    await openPanel()
    expect(screen.getByText('Aucun tag dans cette enquête')).toBeInTheDocument()
  })

  it('counts the active criteria on the button and resets them', async () => {
    load((id) => [at(id, 'person'), at(id, 'email'), at(id, 'domain')])
    const user = await openPanel()
    expect(screen.queryByRole('button', { name: 'Réinitialiser les filtres' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'Email (1)' }))
    await user.click(screen.getByRole('checkbox', { name: 'Domaine (1)' }))
    expect(screen.getByRole('button', { name: /Filtres/ })).toHaveTextContent('1')

    const relations = screen.getByRole('group', { name: 'Statut des relations' })
    await user.click(within(relations).getByRole('radio', { name: 'Vérifiés' }))
    expect(screen.getByRole('button', { name: /Filtres/ })).toHaveTextContent('2')
    expect(useViewStore.getState().filters).toMatchObject({
      types: ['email', 'domain'],
      relationStatus: 'verified',
      entityStatus: null,
    })

    await user.click(screen.getByRole('button', { name: 'Réinitialiser les filtres' }))
    expect(useViewStore.getState().filters).toBe(EMPTY_FILTERS)
    expect(screen.getByRole('button', { name: /Filtres/ })).not.toHaveTextContent(/\d/)
    expect(screen.queryByRole('button', { name: 'Réinitialiser les filtres' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Filtres/ }))
    expect(screen.getByRole('checkbox', { name: 'Email (1)' })).not.toBeChecked()
  })

  it('sets each status independently and falls back to "Tous" when deselected', async () => {
    load((id) => [at(id, 'person')])
    const user = await openPanel()
    const entities = screen.getByRole('group', { name: 'Statut des entités' })
    const relations = screen.getByRole('group', { name: 'Statut des relations' })
    expect(within(entities).getByRole('radio', { name: 'Tous' })).toBeChecked()

    await user.click(within(entities).getByRole('radio', { name: 'Hypothèses' }))
    expect(useViewStore.getState().filters).toMatchObject({
      entityStatus: 'hypothesis',
      relationStatus: null,
    })
    expect(within(relations).getByRole('radio', { name: 'Tous' })).toBeChecked()

    await user.click(within(entities).getByRole('radio', { name: 'Hypothèses' }))
    expect(useViewStore.getState().filters.entityStatus).toBe('hypothesis')
    await user.click(within(entities).getByRole('radio', { name: 'Tous' }))
    expect(useViewStore.getState().filters.entityStatus).toBeNull()
  })

  it('sets the confidence thresholds and the ungraded option', async () => {
    load((id) => [at(id, 'person')])
    const user = await openPanel()
    expect(screen.getByRole('checkbox', { name: 'Inclure les éléments non cotés' })).toBeChecked()

    await user.click(screen.getByRole('combobox', { name: 'Fiabilité au moins' }))
    await user.click(await screen.findByRole('option', { name: 'B – Habituellement fiable' }))
    await user.click(screen.getByRole('combobox', { name: 'Crédibilité au moins' }))
    await user.click(await screen.findByRole('option', { name: '2 – Probablement vraie' }))
    await user.click(screen.getByRole('checkbox', { name: 'Inclure les éléments non cotés' }))

    expect(useViewStore.getState().filters).toMatchObject({
      minReliability: 'B',
      minCredibility: 2,
      includeUngraded: false,
    })
    expect(screen.getByRole('button', { name: /Filtres/ })).toHaveTextContent('1')
  })

  it('keeps a checked type listed once no entity uses it', async () => {
    load((id) => [at(id, 'person'), at(id, 'email')])
    const user = await openPanel()
    await user.click(screen.getByRole('checkbox', { name: 'Email (1)' }))

    const email = Object.values(useGraphStore.getState().entities).find((entity) => entity.type === 'email')!
    useGraphStore.getState().removeElements([email.id], [])

    expect(await screen.findByRole('checkbox', { name: 'Email (0)' })).toBeChecked()
  })
})
