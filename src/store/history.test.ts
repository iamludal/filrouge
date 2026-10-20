import { createEntity, createInvestigation, createSource } from '@/domain/factories'
import type { Attachment } from '@/domain/schemas'
import { useGraphStore } from '@/store/graph-store'
import { createGrouping, diffRecords, pickRecords, sameRecords, type RecordMaps } from '@/store/history'

const INVESTIGATION = crypto.randomUUID()
const entity = (label: string) => createEntity(INVESTIGATION, 'person', { x: 0, y: 0 }, label)

function maps(partial: Partial<RecordMaps> = {}): RecordMaps {
  return { entities: {}, relations: {}, sources: {}, ...partial }
}

describe('diffRecords', () => {
  it('reports added, changed and removed records, and ignores untouched ones', () => {
    const kept = entity('kept')
    const changed = entity('changed')
    const removed = entity('removed')
    const added = entity('added')
    const before = maps({ entities: { [kept.id]: kept, [changed.id]: changed, [removed.id]: removed } })
    const edited = { ...changed, label: 'edited' }
    const after = maps({ entities: { [kept.id]: kept, [changed.id]: edited, [added.id]: added } })

    const diff = diffRecords(before, after)
    expect(diff.entities.upserted.sort()).toEqual([changed.id, added.id].sort())
    expect(diff.entities.removed).toEqual([removed.id])
    expect(diff.relations).toEqual({ upserted: [], removed: [] })
  })

  it('compares by identity, not by content', () => {
    const a = entity('a')
    const before = maps({ entities: { [a.id]: a } })
    const after = maps({ entities: { [a.id]: { ...a } } })
    expect(diffRecords(before, after).entities.upserted).toEqual([a.id])
  })

  it('covers sources too', () => {
    const source = createSource(INVESTIGATION, { title: 'S' })
    const diff = diffRecords(maps(), maps({ sources: { [source.id]: source } }))
    expect(diff.sources.upserted).toEqual([source.id])
    expect(diff.sources.removed).toEqual([])
  })
})

describe('sameRecords', () => {
  it('is true only when the three maps are the same references', () => {
    const a = maps()
    expect(sameRecords(a, pickRecords({ ...a }))).toBe(true)
    expect(sameRecords(a, { ...a, entities: {} })).toBe(false)
  })
})

describe('createGrouping', () => {
  function setup(windowMs = 1000) {
    let now = 0
    const grouping = createGrouping(windowMs, () => now)
    const recorded: string[] = []
    const handle = grouping.handleSet((past: string) => void recorded.push(past))
    return {
      grouping,
      recorded,
      advance: (ms: number) => (now += ms),
      record: (past: string, key?: string) => (key ? grouping.group(key, () => handle(past)) : handle(past)),
    }
  }

  it('merges consecutive edits of the same key within the window', () => {
    const { record, recorded, advance } = setup()
    record('s0', 'label')
    advance(300)
    record('s1', 'label')
    advance(900)
    record('s2', 'label')
    expect(recorded).toEqual(['s0'])
  })

  it('starts a new step once the window has elapsed since the last edit', () => {
    const { record, recorded, advance } = setup()
    record('s0', 'label')
    advance(1000)
    record('s1', 'label')
    expect(recorded).toEqual(['s0', 's1'])
  })

  it('starts a new step for another key or an ungrouped change', () => {
    const { record, recorded, advance } = setup()
    record('s0', 'label')
    advance(100)
    record('s1', 'notes')
    advance(100)
    record('s2')
    advance(100)
    record('s3', 'notes')
    expect(recorded).toEqual(['s0', 's1', 's2', 's3'])
  })

  it('ends the group on reset', () => {
    const { record, recorded, grouping, advance } = setup()
    record('s0', 'label')
    grouping.reset()
    advance(100)
    record('s1', 'label')
    expect(recorded).toEqual(['s0', 's1'])
  })

  it('does not leak a declared key into later changes, even when the callback throws', () => {
    const { grouping, record, recorded } = setup()
    expect(() =>
      grouping.group('label', () => {
        throw new Error('boom')
      }),
    ).toThrow('boom')
    record('s0')
    record('s1')
    expect(recorded).toEqual(['s0', 's1'])
  })
})

describe('graph store history', () => {
  const store = () => useGraphStore.getState()
  const temporal = () => useGraphStore.temporal.getState()

  function openEmpty() {
    const investigation = createInvestigation('Historique')
    store().load({ investigation, entities: [], relations: [], sources: [] })
    return investigation
  }

  function fakeAttachment(investigationId: string): Attachment {
    return {
      id: crypto.randomUUID(),
      investigationId,
      blob: new Blob(['x']),
      mime: 'image/png',
      size: 1,
      sha256: '1'.repeat(64),
    }
  }

  const advance = (ms: number) => vi.setSystemTime(Date.now() + ms)

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    store().close()
  })
  afterEach(() => vi.useRealTimers())

  it('undoes and redoes a creation, pruning the selection', () => {
    openEmpty()
    const a = store().addEntity('person', { x: 0, y: 0 }, 'A')
    expect(temporal().pastStates).toHaveLength(1)

    store().undo()
    expect(store().entities[a.id]).toBeUndefined()
    expect(store().selection.entityIds).toEqual([])

    store().redo()
    expect(store().entities[a.id]).toBe(a)
  })

  it('queues what an undo changed for the next save', () => {
    openEmpty()
    const a = store().addEntity('person', { x: 0, y: 0 }, 'A')

    // Created and not yet saved: undoing leaves nothing to write but a harmless delete.
    store().undo()
    expect(store().saveStatus).toBe('pending')
    expect(store().dirty.entities.has(a.id)).toBe(false)
    expect(store().dirty.deletedEntities.has(a.id)).toBe(true)

    // Saved, then undone: the entity is written again.
    store().redo()
    store().takeChanges()
    store().undo()
    store().takeChanges()
    store().redo()
    const changes = store().takeChanges()!
    expect(changes.upsertEntities.map((e) => e.id)).toEqual([a.id])
    expect(changes.deleteEntityIds).toEqual([])
  })

  it('restores an entity and its relations removed in one cascade, as one step', () => {
    openEmpty()
    const a = store().addEntity('person', { x: 0, y: 0 }, 'A')
    const b = store().addEntity('email', { x: 100, y: 0 }, 'B')
    const c = store().addEntity('email', { x: 200, y: 0 }, 'C')
    const r1 = store().addRelation(a.id, b.id, 'x')!
    const r2 = store().addRelation(c.id, a.id, 'y')!
    store().takeChanges()
    const steps = temporal().pastStates.length

    store().removeElements([a.id], [])
    expect(temporal().pastStates).toHaveLength(steps + 1)
    store().takeChanges()

    store().undo()
    expect(store().entities[a.id]).toBe(a)
    expect(store().relations[r1.id]).toBe(r1)
    expect(store().relations[r2.id]).toBe(r2)
    const changes = store().takeChanges()!
    expect(changes.upsertEntities.map((e) => e.id)).toEqual([a.id])
    expect(changes.upsertRelations.map((r) => r.id).sort()).toEqual([r1.id, r2.id].sort())
    expect(changes.deleteEntityIds).toEqual([])

    store().redo()
    expect(store().entities[a.id]).toBeUndefined()
    expect(Object.keys(store().relations)).toEqual([])
    expect(store().takeChanges()!.deleteEntityIds).toEqual([a.id])
  })

  it('undoes a move, a multi-node move being one step', () => {
    openEmpty()
    const a = store().addEntity('person', { x: 0, y: 0 })
    const b = store().addEntity('person', { x: 100, y: 0 })
    advance(2000)

    store().moveEntities({ [a.id]: { x: 40, y: 40 }, [b.id]: { x: 140, y: 40 } })
    store().undo()
    expect(store().entities[a.id]!.position).toEqual({ x: 0, y: 0 })
    expect(store().entities[b.id]!.position).toEqual({ x: 100, y: 0 })
  })

  it('merges typing in one field into one step, and separates fields and pauses', () => {
    openEmpty()
    const a = store().addEntity('person', { x: 0, y: 0 }, '')
    advance(2000)

    for (const label of ['J', 'Je', 'Jean']) {
      store().updateEntity(a.id, { label })
      advance(200)
    }
    store().updateEntity(a.id, { notes: 'note' })
    expect(temporal().pastStates).toHaveLength(3)

    store().undo()
    expect(store().entities[a.id]!.label).toBe('Jean')
    expect(store().entities[a.id]!.notes).toBeUndefined()
    store().undo()
    expect(store().entities[a.id]!.label).toBe('')

    advance(5000)
    store().redo()
    store().redo()
    store().updateEntity(a.id, { notes: 'plus tard' })
    advance(1500)
    store().updateEntity(a.id, { notes: 'encore plus tard' })
    store().undo()
    expect(store().entities[a.id]!.notes).toBe('plus tard')
  })

  it('does not record selection, save status or saving', () => {
    openEmpty()
    const a = store().addEntity('person', { x: 0, y: 0 })
    const steps = temporal().pastStates.length

    store().setSelection({ entityIds: [], relationIds: [] })
    store().setSaveStatus('saving')
    store().takeChanges()
    store().setInvestigation({ ...store().investigation!, name: 'Renommée' })
    expect(temporal().pastStates).toHaveLength(steps)

    store().undo()
    expect(store().entities[a.id]).toBeUndefined()
    expect(store().investigation!.name).toBe('Renommée')
  })

  it('discards the redoable steps on a new edit', () => {
    openEmpty()
    const a = store().addEntity('person', { x: 0, y: 0 })
    store().undo()
    expect(temporal().futureStates).toHaveLength(1)

    const b = store().addEntity('person', { x: 0, y: 0 })
    expect(temporal().futureStates).toHaveLength(0)
    store().redo()
    expect(store().entities[a.id]).toBeUndefined()
    expect(store().entities[b.id]).toBeDefined()
  })

  it('restores a deleted source, its references and its screenshot', () => {
    const investigation = openEmpty()
    const a = store().addEntity('person', { x: 0, y: 0 })
    const attachment = fakeAttachment(investigation.id)
    const source = store().createSource({ title: 'S' }, attachment, { type: 'entity', id: a.id })!
    store().takeChanges()

    store().removeSource(source.id)
    expect(store().entities[a.id]!.sourceIds).toEqual([])
    store().takeChanges()

    store().undo()
    expect(store().sources[source.id]).toBe(source)
    expect(store().entities[a.id]!.sourceIds).toEqual([source.id])
    expect(store().attachments[attachment.id]).toBe(attachment)
    const changes = store().takeChanges()!
    expect(changes.upsertSources).toEqual([source])
    expect(changes.deleteSourceIds).toEqual([])
  })

  it('undoes creating a source attached to an element in one step', () => {
    openEmpty()
    const a = store().addEntity('person', { x: 0, y: 0 })
    const steps = temporal().pastStates.length
    const source = store().createSource({ title: 'S' }, undefined, { type: 'entity', id: a.id })!
    expect(temporal().pastStates).toHaveLength(steps + 1)

    store().undo()
    expect(store().sources[source.id]).toBeUndefined()
    expect(store().entities[a.id]!.sourceIds).toEqual([])
  })

  it('undoes attaching and detaching a source, and detaching with deletion as one step', () => {
    openEmpty()
    const a = store().addEntity('person', { x: 0, y: 0 })
    const source = store().createSource({ title: 'S' })!
    const ref = { type: 'entity', id: a.id } as const

    store().attachSource(ref, source.id)
    store().undo()
    expect(store().entities[a.id]!.sourceIds).toEqual([])
    expect(store().sources[source.id]).toBeDefined()

    store().redo()
    const steps = temporal().pastStates.length
    store().detachSource(ref, source.id, true)
    expect(temporal().pastStates).toHaveLength(steps + 1)
    expect(store().sources[source.id]).toBeUndefined()

    store().undo()
    expect(store().sources[source.id]).toBe(source)
    expect(store().entities[a.id]!.sourceIds).toEqual([source.id])
  })

  it('undoes replacing a screenshot', () => {
    const investigation = openEmpty()
    const first = fakeAttachment(investigation.id)
    const second = fakeAttachment(investigation.id)
    const source = store().createSource({ title: 'S' }, first)!
    store().setSourceAttachment(source.id, second)
    store().takeChanges()

    store().undo()
    expect(store().sources[source.id]!.attachmentId).toBe(first.id)
    expect(store().attachments[first.id]).toBe(first)
    expect(store().takeChanges()!.upsertSources?.[0]?.attachmentId).toBe(first.id)
  })

  it('keeps only the 100 most recent steps', () => {
    openEmpty()
    const first = store().addEntity('person', { x: 0, y: 0 }, 'première')
    for (let index = 0; index < 100; index += 1) store().addEntity('person', { x: 0, y: 0 })
    expect(temporal().pastStates).toHaveLength(100)

    while (temporal().pastStates.length > 0) store().undo()
    expect(store().entities[first.id]).toBe(first)
    expect(Object.keys(store().entities)).toHaveLength(1)
  })

  it('starts empty after a load and after a close', () => {
    openEmpty()
    store().addEntity('person', { x: 0, y: 0 })
    expect(temporal().pastStates).toHaveLength(1)

    openEmpty()
    expect(temporal().pastStates).toHaveLength(0)
    expect(temporal().futureStates).toHaveLength(0)

    store().addEntity('person', { x: 0, y: 0 })
    store().close()
    expect(temporal().pastStates).toHaveLength(0)
  })

  it('undoes the unchecking of a tool, restoring its date', () => {
    openEmpty()
    const a = store().addEntity('domain', { x: 0, y: 0 }, 'exemple.fr')
    advance(86_400_000)
    store().setToolCheck(a.id, 'crtsh', true)
    const checkedAt = store().entities[a.id]?.toolChecks?.[0]?.checkedAt
    advance(86_400_000)
    store().setToolCheck(a.id, 'crtsh', false)
    expect(store().entities[a.id]?.toolChecks).toBeUndefined()

    store().undo()
    expect(store().entities[a.id]?.toolChecks).toEqual([{ toolId: 'crtsh', checkedAt }])
  })

  it('records two checks made within a second as two steps', () => {
    openEmpty()
    const a = store().addEntity('domain', { x: 0, y: 0 }, 'exemple.fr')
    advance(5_000)
    store().setToolCheck(a.id, 'crtsh', true)
    advance(200)
    store().setToolCheck(a.id, 'shodan', true)

    store().undo()
    expect(store().entities[a.id]?.toolChecks?.map((check) => check.toolId)).toEqual(['crtsh'])
    store().undo()
    expect(store().entities[a.id]?.toolChecks).toBeUndefined()
  })

  it('undoes a colour change, restoring the previous value and date', () => {
    openEmpty()
    const a = store().addEntity('person', { x: 0, y: 0 }, 'Alice')
    const before = store().entities[a.id]
    advance(5_000)
    store().updateEntity(a.id, { color: 'red' })
    expect(store().entities[a.id]?.color).toBe('red')

    store().undo()
    expect(store().entities[a.id]).toEqual(before)
    expect(store().entities[a.id]).not.toHaveProperty('color')
  })

  it('undoes the important mark', () => {
    openEmpty()
    const a = store().addEntity('person', { x: 0, y: 0 }, 'Alice')
    advance(5_000)
    store().updateEntity(a.id, { important: true })
    advance(5_000)
    store().updateEntity(a.id, { important: undefined })
    expect(store().entities[a.id]).not.toHaveProperty('important')

    store().undo()
    expect(store().entities[a.id]?.important).toBe(true)
    store().undo()
    expect(store().entities[a.id]).not.toHaveProperty('important')
  })
})
