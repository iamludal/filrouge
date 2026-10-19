import { createInvestigation } from '@/domain/factories'
import { useGraphStore } from '@/store/graph-store'

function openEmpty() {
  const investigation = createInvestigation('Test')
  useGraphStore.getState().load({ investigation, entities: [], relations: [], sources: [] })
  return investigation
}

describe('graph store', () => {
  beforeEach(() => useGraphStore.getState().close())

  it('adds entities and relations, selecting the new element', () => {
    openEmpty()
    const store = useGraphStore.getState()
    const a = store.addEntity('person', { x: 0, y: 0 }, 'Alice')
    const b = store.addEntity('email', { x: 100, y: 0 })
    expect(useGraphStore.getState().selection.entityIds).toEqual([b.id])
    const relation = store.addRelation(a.id, b.id, 'utilise')
    expect(relation).not.toBeNull()
    expect(useGraphStore.getState().selection.relationIds).toEqual([relation!.id])
    expect(useGraphStore.getState().saveStatus).toBe('pending')
  })

  it('refuses self-loops and unknown endpoints', () => {
    openEmpty()
    const a = useGraphStore.getState().addEntity('person', { x: 0, y: 0 })
    expect(useGraphStore.getState().addRelation(a.id, a.id, 'x')).toBeNull()
    expect(useGraphStore.getState().addRelation(a.id, crypto.randomUUID(), 'x')).toBeNull()
  })

  it('cascades relation removal when an entity is removed', () => {
    openEmpty()
    const store = useGraphStore.getState()
    const a = store.addEntity('person', { x: 0, y: 0 })
    const b = store.addEntity('email', { x: 0, y: 0 })
    const c = store.addEntity('phone', { x: 0, y: 0 })
    const ab = store.addRelation(a.id, b.id, 'x')!
    const bc = store.addRelation(b.id, c.id, 'y')!
    store.takeChanges()

    useGraphStore.getState().removeElements([a.id], [])
    const state = useGraphStore.getState()
    expect(Object.keys(state.relations)).toEqual([bc.id])
    expect(state.takeChanges()).toMatchObject({ deleteEntityIds: [a.id], deleteRelationIds: [ab.id] })
  })

  it('tracks moves and patches as upserts, and clears them once taken', () => {
    const investigation = openEmpty()
    const a = useGraphStore.getState().addEntity('person', { x: 0, y: 0 })
    useGraphStore.getState().takeChanges()
    useGraphStore.getState().moveEntities({ [a.id]: { x: 0, y: 0 } })
    expect(useGraphStore.getState().takeChanges()).toBeNull()

    useGraphStore.getState().moveEntities({ [a.id]: { x: 32, y: 16 } })
    useGraphStore.getState().updateEntity(a.id, { label: 'Alice', tags: ['cible'] })
    const changes = useGraphStore.getState().takeChanges()
    expect(changes?.investigationId).toBe(investigation.id)
    expect(changes?.upsertEntities).toEqual([
      expect.objectContaining({ label: 'Alice', tags: ['cible'], position: { x: 32, y: 16 } }),
    ])
    expect(useGraphStore.getState().takeChanges()).toBeNull()
  })

  it('restores failed changes without resurrecting deleted records', () => {
    openEmpty()
    const a = useGraphStore.getState().addEntity('person', { x: 0, y: 0 })
    const b = useGraphStore.getState().addEntity('person', { x: 0, y: 0 })
    const changes = useGraphStore.getState().takeChanges()!
    useGraphStore.getState().removeElements([b.id], [])
    useGraphStore.getState().restoreChanges(changes)
    const retry = useGraphStore.getState().takeChanges()!
    expect(retry.upsertEntities.map((e) => e.id)).toEqual([a.id])
    expect(retry.deleteEntityIds).toEqual([b.id])
  })
})
