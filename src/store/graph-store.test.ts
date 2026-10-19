import { createInvestigation } from '@/domain/factories'
import type { Attachment } from '@/domain/schemas'
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

  it('creates entities verified and relations as hypotheses unless told otherwise', () => {
    openEmpty()
    const store = useGraphStore.getState()
    const a = store.addEntity('person', { x: 0, y: 0 })
    const b = store.addEntity('email', { x: 100, y: 0 })
    expect(a.status).toBe('verified')
    expect(store.addRelation(a.id, b.id, 'utilise')?.status).toBe('hypothesis')
    expect(store.addRelation(a.id, b.id, 'utilise', true, 'verified')?.status).toBe('verified')
  })

  it('stores a cleared grade as absent and tracks status changes as edits', () => {
    openEmpty()
    const a = useGraphStore.getState().addEntity('person', { x: 0, y: 0 })
    useGraphStore.getState().updateEntity(a.id, { confidence: { reliability: 'B', credibility: 2 } })
    useGraphStore.getState().takeChanges()

    useGraphStore.getState().updateEntity(a.id, { status: 'hypothesis' })
    expect(useGraphStore.getState().takeChanges()?.upsertEntities).toMatchObject([
      { id: a.id, status: 'hypothesis', confidence: { reliability: 'B', credibility: 2 } },
    ])

    useGraphStore.getState().updateEntity(a.id, { confidence: undefined })
    const saved = useGraphStore.getState().takeChanges()?.upsertEntities[0]
    expect(saved?.confidence).toBeUndefined()
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

function fakeAttachment(investigationId: string, fill = '1'): Attachment {
  return {
    id: crypto.randomUUID(),
    investigationId,
    blob: new Blob(['x']),
    mime: 'image/png',
    size: 1,
    sha256: fill.repeat(64),
  }
}

describe('graph store: sources', () => {
  beforeEach(() => useGraphStore.getState().close())

  it('creates a source with its screenshot, attached to an entity', () => {
    const investigation = openEmpty()
    const entity = useGraphStore.getState().addEntity('person', { x: 0, y: 0 })
    useGraphStore.getState().takeChanges()
    const attachment = fakeAttachment(investigation.id)

    const source = useGraphStore
      .getState()
      .createSource({ title: 'Profil' }, attachment, { type: 'entity', id: entity.id })!
    const state = useGraphStore.getState()
    expect(state.entities[entity.id]!.sourceIds).toEqual([source.id])
    expect(source.attachmentId).toBe(attachment.id)
    expect(source.sha256).toBe(attachment.sha256)

    const changes = state.takeChanges()!
    expect(changes.upsertSources).toEqual([source])
    expect(changes.upsertAttachments).toEqual([attachment])
    expect(changes.upsertEntities.map((e) => e.id)).toEqual([entity.id])
    expect(useGraphStore.getState().takeChanges()).toBeNull()
  })

  it('shares one source between entities and relations', () => {
    openEmpty()
    const store = useGraphStore.getState()
    const a = store.addEntity('person', { x: 0, y: 0 })
    const b = store.addEntity('email', { x: 0, y: 0 })
    const relation = store.addRelation(a.id, b.id, 'utilise')!
    const source = store.createSource({ title: 'S' }, undefined, { type: 'entity', id: a.id })!
    store.attachSource({ type: 'entity', id: b.id }, source.id)
    store.attachSource({ type: 'relation', id: relation.id }, source.id)
    store.attachSource({ type: 'relation', id: relation.id }, source.id)

    const state = useGraphStore.getState()
    expect(Object.keys(state.sources)).toEqual([source.id])
    expect(state.entities[b.id]!.sourceIds).toEqual([source.id])
    expect(state.relations[relation.id]!.sourceIds).toEqual([source.id])
  })

  it('detaches from one element only, and keeps a shared source', () => {
    openEmpty()
    const store = useGraphStore.getState()
    const a = store.addEntity('person', { x: 0, y: 0 })
    const b = store.addEntity('email', { x: 0, y: 0 })
    const source = store.createSource({ title: 'S' }, undefined, { type: 'entity', id: a.id })!
    store.attachSource({ type: 'entity', id: b.id }, source.id)

    useGraphStore.getState().detachSource({ type: 'entity', id: a.id }, source.id, true)
    const state = useGraphStore.getState()
    expect(state.entities[a.id]!.sourceIds).toEqual([])
    expect(state.entities[b.id]!.sourceIds).toEqual([source.id])
    expect(state.sources[source.id]).toBeDefined()
  })

  it('detaches the last reference, keeping or deleting the source as asked', () => {
    const investigation = openEmpty()
    const store = useGraphStore.getState()
    const a = store.addEntity('person', { x: 0, y: 0 })
    const attachment = fakeAttachment(investigation.id)
    const kept = store.createSource({ title: 'Gardée' }, undefined, { type: 'entity', id: a.id })!
    const doomed = store.createSource({ title: 'Jetée' }, attachment, { type: 'entity', id: a.id })!
    useGraphStore.getState().takeChanges()

    useGraphStore.getState().detachSource({ type: 'entity', id: a.id }, kept.id, false)
    expect(useGraphStore.getState().sources[kept.id]).toBeDefined()

    useGraphStore.getState().detachSource({ type: 'entity', id: a.id }, doomed.id, true)
    const state = useGraphStore.getState()
    expect(state.sources[doomed.id]).toBeUndefined()
    expect(state.attachments[attachment.id]).toBeUndefined()
    const changes = state.takeChanges()!
    expect(changes.deleteSourceIds).toEqual([doomed.id])
    expect(changes.deleteAttachmentIds).toEqual([attachment.id])
  })

  it('removing a source strips every reference to it', () => {
    openEmpty()
    const store = useGraphStore.getState()
    const a = store.addEntity('person', { x: 0, y: 0 })
    const b = store.addEntity('email', { x: 0, y: 0 })
    const relation = store.addRelation(a.id, b.id, 'x')!
    const source = store.createSource({ title: 'S' }, undefined, { type: 'entity', id: a.id })!
    store.attachSource({ type: 'entity', id: b.id }, source.id)
    store.attachSource({ type: 'relation', id: relation.id }, source.id)
    useGraphStore.getState().takeChanges()

    useGraphStore.getState().removeSource(source.id)
    const state = useGraphStore.getState()
    expect(state.entities[a.id]!.sourceIds).toEqual([])
    expect(state.entities[b.id]!.sourceIds).toEqual([])
    expect(state.relations[relation.id]!.sourceIds).toEqual([])
    const changes = state.takeChanges()!
    expect(changes.deleteSourceIds).toEqual([source.id])
    expect(changes.upsertEntities).toHaveLength(2)
    expect(changes.upsertRelations).toHaveLength(1)
  })

  it('replaces and removes a screenshot, dropping one that was never saved', () => {
    const investigation = openEmpty()
    const store = useGraphStore.getState()
    const first = fakeAttachment(investigation.id, '1')
    const second = fakeAttachment(investigation.id, '2')
    const source = store.createSource({ title: 'S' }, first)!

    useGraphStore.getState().setSourceAttachment(source.id, second)
    let state = useGraphStore.getState()
    expect(state.sources[source.id]!.attachmentId).toBe(second.id)
    expect(state.sources[source.id]!.sha256).toBe(second.sha256)
    expect(state.attachments[first.id]).toBeUndefined()
    expect([...state.dirty.attachments]).toEqual([second.id])

    useGraphStore.getState().setSourceAttachment(source.id, null)
    state = useGraphStore.getState()
    expect(state.sources[source.id]!.attachmentId).toBeUndefined()
    expect(state.sources[source.id]!.sha256).toBeUndefined()
    expect(state.dirty.attachments.size).toBe(0)
  })

  it('keeps sources when the entity using them is deleted', () => {
    openEmpty()
    const a = useGraphStore.getState().addEntity('person', { x: 0, y: 0 })
    const source = useGraphStore
      .getState()
      .createSource({ title: 'S' }, undefined, { type: 'entity', id: a.id })!
    useGraphStore.getState().removeElements([a.id], [])
    expect(useGraphStore.getState().sources[source.id]).toBeDefined()
  })

  it('restores failed source changes without resurrecting deleted ones', () => {
    const investigation = openEmpty()
    const store = useGraphStore.getState()
    const attachment = fakeAttachment(investigation.id)
    const kept = store.createSource({ title: 'Gardée' }, attachment)!
    const gone = store.createSource({ title: 'Partie' })!
    const changes = useGraphStore.getState().takeChanges()!
    useGraphStore.getState().removeSource(gone.id)
    useGraphStore.getState().restoreChanges(changes)

    const retry = useGraphStore.getState().takeChanges()!
    expect(retry.upsertSources?.map((s) => s.id)).toEqual([kept.id])
    expect(retry.upsertAttachments).toEqual([attachment])
    expect(retry.deleteSourceIds).toEqual([gone.id])
  })
})
