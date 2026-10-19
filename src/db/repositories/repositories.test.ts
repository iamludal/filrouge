import { FilrougeDatabase } from '@/db/dexie'
import { graphRepository } from '@/db/repositories/graph'
import { investigationsRepository } from '@/db/repositories/investigations'
import { createEntity, createRelation } from '@/domain/factories'

function setup() {
  const db = new FilrougeDatabase(`test-${crypto.randomUUID()}`)
  return { db, investigations: investigationsRepository(db), graph: graphRepository(db) }
}

describe('investigations repository', () => {
  it('creates, lists (most recent first), renames and gets', async () => {
    const { investigations } = setup()
    const first = await investigations.create('Première')
    await new Promise((resolve) => setTimeout(resolve, 5))
    const second = await investigations.create('Seconde', 'desc')
    expect((await investigations.list()).map((i) => i.id)).toEqual([second.id, first.id])

    await new Promise((resolve) => setTimeout(resolve, 5))
    const renamed = await investigations.update(first.id, { name: 'Renommée' })
    expect(renamed.name).toBe('Renommée')
    expect(renamed.updatedAt > first.updatedAt).toBe(true)
    expect((await investigations.get(first.id))?.name).toBe('Renommée')
  })

  it('refuses invalid names', async () => {
    const { investigations } = setup()
    await expect(investigations.create('   ')).rejects.toThrow()
    const created = await investigations.create('Ok')
    await expect(investigations.update(created.id, { name: '' })).rejects.toThrow()
  })

  it('deletes an investigation with all its records, leaving others intact', async () => {
    const { investigations, graph, db } = setup()
    const kept = await investigations.create('Gardée')
    const doomed = await investigations.create('Supprimée')
    for (const investigation of [kept, doomed]) {
      const a = createEntity(investigation.id, 'person', { x: 0, y: 0 })
      const b = createEntity(investigation.id, 'email', { x: 1, y: 1 })
      await graph.applyChanges({
        investigationId: investigation.id,
        upsertEntities: [a, b],
        upsertRelations: [createRelation(investigation.id, a.id, b.id, 'x')],
        deleteEntityIds: [],
        deleteRelationIds: [],
      })
    }
    await investigations.remove(doomed.id)
    expect(await investigations.get(doomed.id)).toBeUndefined()
    expect(await db.entities.count()).toBe(2)
    expect(await db.relations.count()).toBe(1)
    expect((await investigations.loadSnapshot(kept.id))?.entities).toHaveLength(2)
  })

  it('imports a snapshot and refuses a duplicate id', async () => {
    const { investigations } = setup()
    const source = setup()
    const investigation = await source.investigations.create('Source')
    const entity = createEntity(investigation.id, 'domain', { x: 0, y: 0 }, 'example.org')
    await source.graph.applyChanges({
      investigationId: investigation.id,
      upsertEntities: [entity],
      upsertRelations: [],
      deleteEntityIds: [],
      deleteRelationIds: [],
    })
    const snapshot = (await source.investigations.loadSnapshot(investigation.id))!
    await investigations.importSnapshot(snapshot)
    expect(await investigations.loadSnapshot(investigation.id)).toEqual(snapshot)
    await expect(investigations.importSnapshot(snapshot)).rejects.toThrow()
  })
})

describe('graph repository', () => {
  it('upserts entities and relations, then cascades relation deletion', async () => {
    const { investigations, graph } = setup()
    const investigation = await investigations.create('Graphe')
    const [a, b, c] = (['person', 'email', 'phone'] as const).map((type) =>
      createEntity(investigation.id, type, { x: 0, y: 0 }),
    ) as [ReturnType<typeof createEntity>, ReturnType<typeof createEntity>, ReturnType<typeof createEntity>]
    const ab = createRelation(investigation.id, a.id, b.id, 'utilise')
    const bc = createRelation(investigation.id, b.id, c.id, 'lié à')
    const base = { investigationId: investigation.id, deleteEntityIds: [], deleteRelationIds: [] }

    await graph.applyChanges({ ...base, upsertEntities: [a, b, c], upsertRelations: [ab, bc] })
    await graph.applyChanges({ ...base, upsertEntities: [{ ...a, label: 'Alice' }], upsertRelations: [] })
    expect((await graph.listEntities(investigation.id)).find((e) => e.id === a.id)?.label).toBe('Alice')

    await graph.applyChanges({ ...base, deleteEntityIds: [a.id], upsertEntities: [], upsertRelations: [] })
    expect((await graph.listEntities(investigation.id)).map((e) => e.id).sort()).toEqual([b.id, c.id].sort())
    expect((await graph.listRelations(investigation.id)).map((r) => r.id)).toEqual([bc.id])
  })

  it('rejects invalid records and records from another investigation', async () => {
    const { investigations, graph } = setup()
    const investigation = await investigations.create('Graphe')
    const base = {
      investigationId: investigation.id,
      deleteEntityIds: [],
      deleteRelationIds: [],
      upsertRelations: [],
    }
    const entity = createEntity(investigation.id, 'person', { x: 0, y: 0 })
    await expect(
      graph.applyChanges({ ...base, upsertEntities: [{ ...entity, position: { x: NaN, y: 0 } }] }),
    ).rejects.toThrow()
    const foreign = createEntity(crypto.randomUUID(), 'person', { x: 0, y: 0 })
    await expect(graph.applyChanges({ ...base, upsertEntities: [foreign] })).rejects.toThrow()
    expect(await graph.listEntities(investigation.id)).toEqual([])
  })
})
