import { createEntity, createInvestigation } from '@/domain/factories'
import { EMPTY_FILTERS } from '@/domain/graph-view'
import { useGraphStore } from '@/store/graph-store'
import { useViewStore } from '@/store/view-store'

beforeEach(() => useViewStore.getState().reset())

describe('view store', () => {
  it('clears the current result when the query changes', () => {
    const { setQuery, setCurrentResult } = useViewStore.getState()
    setQuery('alice')
    setCurrentResult({ type: 'entity', id: 'a' })
    expect(useViewStore.getState().currentResult).toEqual({ type: 'entity', id: 'a' })
    setQuery('alic')
    expect(useViewStore.getState().currentResult).toBeNull()
  })

  it('merges filter changes and resets them on their own', () => {
    const { setFilters, resetFilters, setQuery } = useViewStore.getState()
    setQuery('alice')
    setFilters({ types: ['email'] })
    setFilters({ relationStatus: 'verified' })
    expect(useViewStore.getState().filters).toMatchObject({ types: ['email'], relationStatus: 'verified' })
    resetFilters()
    expect(useViewStore.getState().filters).toBe(EMPTY_FILTERS)
    expect(useViewStore.getState().query).toBe('alice')
  })

  it('resets everything', () => {
    const { setQuery, setCurrentResult, setFilters, reset } = useViewStore.getState()
    setQuery('alice')
    setCurrentResult({ type: 'entity', id: 'a' })
    setFilters({ tags: ['cible'] })
    reset()
    expect(useViewStore.getState()).toMatchObject({ query: '', currentResult: null, filters: EMPTY_FILTERS })
  })

  it('leaves the edit history and the pending changes of the graph untouched', () => {
    const investigation = createInvestigation('Enquête')
    const entity = createEntity(investigation.id, 'person', { x: 0, y: 0 }, 'Alice')
    useGraphStore.getState().load({ investigation, entities: [entity], relations: [], sources: [] })
    const { dirty } = useGraphStore.getState()
    const past = useGraphStore.temporal.getState().pastStates.length

    useViewStore.getState().setQuery('alice')
    useViewStore.getState().setCurrentResult({ type: 'entity', id: entity.id })
    useViewStore.getState().setFilters({ types: ['person'] })

    expect(useGraphStore.getState().dirty).toBe(dirty)
    expect(useGraphStore.temporal.getState().pastStates).toHaveLength(past)
    useGraphStore.getState().close()
  })
})
