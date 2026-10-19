import { FilrougeDatabase } from '@/db/dexie'
import { attachmentsRepository } from '@/db/repositories/attachments'
import { graphRepository } from '@/db/repositories/graph'
import { investigationsRepository } from '@/db/repositories/investigations'
import { createEntity, createRelation } from '@/domain/factories'
import type { Attachment, Source } from '@/domain/schemas'

function setup() {
  const db = new FilrougeDatabase(`test-${crypto.randomUUID()}`)
  return {
    db,
    investigations: investigationsRepository(db),
    graph: graphRepository(db),
    attachments: attachmentsRepository(db),
  }
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

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const sha = (char: string) => char.repeat(64)

function makeAttachment(investigationId: string, fill = 1): Attachment {
  const bytes = new Uint8Array([...PNG, fill, fill, fill])
  return {
    id: crypto.randomUUID(),
    investigationId,
    blob: new Blob([bytes], { type: 'image/png' }),
    mime: 'image/png',
    size: bytes.length,
    sha256: sha(String(fill)),
  }
}

function makeSource(investigationId: string, attachment?: Attachment): Source {
  return {
    id: crypto.randomUUID(),
    investigationId,
    title: 'Source',
    capturedAt: new Date().toISOString(),
    ...(attachment ? { attachmentId: attachment.id, sha256: attachment.sha256 } : {}),
  }
}

async function bytesOf(blob: Blob): Promise<number[]> {
  return Array.from(new Uint8Array(await blob.arrayBuffer()))
}

describe('graph repository: sources and attachments', () => {
  const base = (investigationId: string) => ({
    investigationId,
    upsertEntities: [],
    upsertRelations: [],
    deleteEntityIds: [],
    deleteRelationIds: [],
  })

  it('writes a source, its screenshot and the element referencing it together', async () => {
    const { investigations, graph, attachments } = setup()
    const investigation = await investigations.create('Sources')
    const attachment = makeAttachment(investigation.id)
    const source = makeSource(investigation.id, attachment)
    const entity = { ...createEntity(investigation.id, 'person', { x: 0, y: 0 }), sourceIds: [source.id] }

    await graph.applyChanges({
      ...base(investigation.id),
      upsertEntities: [entity],
      upsertSources: [source],
      upsertAttachments: [attachment],
    })

    expect(await graph.listSources(investigation.id)).toEqual([source])
    const stored = await attachments.get(attachment.id)
    expect(await bytesOf(stored!.blob)).toEqual([...PNG, 1, 1, 1])
    expect(await attachments.stats(investigation.id)).toEqual({ count: 1, totalSize: attachment.size })
  })

  it('refuses the whole batch when nothing valid can be written', async () => {
    const { investigations, graph, db } = setup()
    const investigation = await investigations.create('Atomique')
    const attachment = makeAttachment(investigation.id)
    const source = makeSource(investigation.id, attachment)
    const entity = createEntity(investigation.id, 'person', { x: 0, y: 0 })

    // Dangling source reference.
    await expect(
      graph.applyChanges({
        ...base(investigation.id),
        upsertEntities: [{ ...entity, sourceIds: [crypto.randomUUID()] }],
        upsertSources: [source],
        upsertAttachments: [attachment],
      }),
    ).rejects.toThrow()
    // Source pointing at a screenshot that is not written.
    await expect(graph.applyChanges({ ...base(investigation.id), upsertSources: [source] })).rejects.toThrow()
    // Screenshot of another investigation.
    await expect(
      graph.applyChanges({
        ...base(investigation.id),
        upsertSources: [source],
        upsertAttachments: [{ ...attachment, investigationId: crypto.randomUUID() }],
      }),
    ).rejects.toThrow()

    expect(await db.sources.count()).toBe(0)
    expect(await db.attachments.count()).toBe(0)
    expect(await db.entities.count()).toBe(0)
  })

  it('keeps the screenshot when its source is deleted, until it is purged', async () => {
    const { investigations, graph, db } = setup()
    const investigation = await investigations.create('Suppression')
    const attachment = makeAttachment(investigation.id)
    const source = makeSource(investigation.id, attachment)
    await graph.applyChanges({
      ...base(investigation.id),
      upsertSources: [source],
      upsertAttachments: [attachment],
    })

    await graph.applyChanges({ ...base(investigation.id), deleteSourceIds: [source.id] })
    expect(await db.sources.count()).toBe(0)
    expect(await db.attachments.count()).toBe(1)

    // Undo: the source comes back and its screenshot is still there.
    await graph.applyChanges({ ...base(investigation.id), upsertSources: [source] })
    expect(await db.sources.count()).toBe(1)
  })

  it('keeps the previous screenshot when a source is re-pointed or cleared', async () => {
    const { investigations, graph, db } = setup()
    const investigation = await investigations.create('Remplacement')
    const first = makeAttachment(investigation.id, 1)
    const source = makeSource(investigation.id, first)
    await graph.applyChanges({
      ...base(investigation.id),
      upsertSources: [source],
      upsertAttachments: [first],
    })

    const second = makeAttachment(investigation.id, 2)
    await graph.applyChanges({
      ...base(investigation.id),
      upsertSources: [{ ...source, attachmentId: second.id, sha256: second.sha256 }],
      upsertAttachments: [second],
    })
    expect(await db.attachments.count()).toBe(2)

    const { attachmentId: _a, sha256: _s, ...cleared } = source
    await graph.applyChanges({ ...base(investigation.id), upsertSources: [cleared] })
    expect(await db.attachments.count()).toBe(2)

    // Undo back to the first screenshot: the batch is accepted.
    await graph.applyChanges({ ...base(investigation.id), upsertSources: [source] })
    expect(await db.sources.get(source.id)).toMatchObject({ attachmentId: first.id })
  })

  it('still refuses a source pointing at a missing screenshot', async () => {
    const { investigations, graph, db } = setup()
    const investigation = await investigations.create('Capture manquante')
    const source = makeSource(investigation.id, makeAttachment(investigation.id))
    await expect(graph.applyChanges({ ...base(investigation.id), upsertSources: [source] })).rejects.toThrow(
      'Capture introuvable',
    )
    expect(await db.sources.count()).toBe(0)
  })

  it('purges only the screenshots no source of the investigation references', async () => {
    const { investigations, graph, db } = setup()
    const investigation = await investigations.create('Purge')
    const other = await investigations.create('Autre')
    const kept = makeAttachment(investigation.id, 1)
    const orphan = makeAttachment(investigation.id, 2)
    const otherOrphan = makeAttachment(other.id, 3)
    await graph.applyChanges({
      ...base(investigation.id),
      upsertSources: [makeSource(investigation.id, kept)],
      upsertAttachments: [kept, orphan],
    })
    await graph.applyChanges({ ...base(other.id), upsertAttachments: [otherOrphan] })

    await graph.purgeUnreferencedAttachments(investigation.id)
    expect((await db.attachments.toArray()).map((a) => a.id).sort()).toEqual([kept.id, otherOrphan.id].sort())
  })

  it('refuses to delete a source still referenced by a stored element', async () => {
    const { investigations, graph, db } = setup()
    const investigation = await investigations.create('Références')
    const source = makeSource(investigation.id)
    const entity = { ...createEntity(investigation.id, 'person', { x: 0, y: 0 }), sourceIds: [source.id] }
    await graph.applyChanges({ ...base(investigation.id), upsertEntities: [entity], upsertSources: [source] })

    await expect(
      graph.applyChanges({ ...base(investigation.id), deleteSourceIds: [source.id] }),
    ).rejects.toThrow()
    expect(await db.sources.count()).toBe(1)

    await graph.applyChanges({
      ...base(investigation.id),
      upsertEntities: [{ ...entity, sourceIds: [] }],
      deleteSourceIds: [source.id],
    })
    expect(await db.sources.count()).toBe(0)
  })

  it('keeps sources when the entity using them is deleted', async () => {
    const { investigations, graph, db } = setup()
    const investigation = await investigations.create('Orphelines')
    const source = makeSource(investigation.id)
    const entity = { ...createEntity(investigation.id, 'person', { x: 0, y: 0 }), sourceIds: [source.id] }
    await graph.applyChanges({ ...base(investigation.id), upsertEntities: [entity], upsertSources: [source] })
    await graph.applyChanges({ ...base(investigation.id), deleteEntityIds: [entity.id] })
    expect(await db.sources.count()).toBe(1)
  })
})

describe('investigations repository: attachments', () => {
  it('exports and imports screenshots with identical bytes, and deletes them with the investigation', async () => {
    const origin = setup()
    const investigation = await origin.investigations.create('Origine')
    const attachment = makeAttachment(investigation.id, 3)
    const source = makeSource(investigation.id, attachment)
    await origin.graph.applyChanges({
      investigationId: investigation.id,
      upsertEntities: [],
      upsertRelations: [],
      deleteEntityIds: [],
      deleteRelationIds: [],
      upsertSources: [source],
      upsertAttachments: [attachment],
    })

    const exported = (await origin.investigations.loadExport(investigation.id))!
    expect(exported.attachments).toHaveLength(1)

    const target = setup()
    await target.investigations.importSnapshot(exported.snapshot, exported.attachments)
    const imported = (await target.investigations.loadExport(investigation.id))!
    expect(imported.snapshot).toEqual(exported.snapshot)
    expect(await bytesOf(imported.attachments[0]!.blob)).toEqual([...PNG, 3, 3, 3])

    await target.investigations.remove(investigation.id)
    expect(await target.db.attachments.count()).toBe(0)
  })

  it('counts and exports only the screenshots a source references', async () => {
    const { investigations, graph, attachments } = setup()
    const investigation = await investigations.create('Orphelines')
    const kept = makeAttachment(investigation.id, 4)
    const orphan = makeAttachment(investigation.id, 5)
    await graph.applyChanges({
      investigationId: investigation.id,
      upsertEntities: [],
      upsertRelations: [],
      deleteEntityIds: [],
      deleteRelationIds: [],
      upsertSources: [makeSource(investigation.id, kept)],
      upsertAttachments: [kept, orphan],
    })

    expect(await attachments.stats(investigation.id)).toEqual({ count: 1, totalSize: kept.size })
    expect((await investigations.loadExport(investigation.id))!.attachments.map((a) => a.id)).toEqual([
      kept.id,
    ])
  })
})
