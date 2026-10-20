import {
  attachmentSchema,
  entitySchema,
  relationSchema,
  sourceSchema,
  type Attachment,
  type Entity,
  type Relation,
  type Source,
} from '@/domain/schemas'
import { db as defaultDb, type FilrougeDatabase } from '@/db/dexie'
import { nowIso } from '@/lib/ids'

export interface GraphChanges {
  investigationId: string
  upsertEntities: Entity[]
  deleteEntityIds: string[]
  upsertRelations: Relation[]
  deleteRelationIds: string[]
  upsertSources?: Source[]
  deleteSourceIds?: string[]
  upsertAttachments?: Attachment[]
}

export function graphRepository(db: FilrougeDatabase = defaultDb) {
  return {
    async listEntities(investigationId: string): Promise<Entity[]> {
      return db.entities.where('investigationId').equals(investigationId).toArray()
    },

    async listRelations(investigationId: string): Promise<Relation[]> {
      return db.relations.where('investigationId').equals(investigationId).toArray()
    },

    async listSources(investigationId: string): Promise<Source[]> {
      return db.sources.where('investigationId').equals(investigationId).toArray()
    },

    /**
     * Applies a batch of graph edits atomically. Every record is re-validated so that a bug in
     * the UI layer can never persist malformed data. Deleting an entity also deletes the
     * relations attached to it, even ones not listed in `deleteRelationIds`. Screenshots released
     * by a deleted or re-pointed source stay stored (see `purgeUnreferencedAttachments`). A batch
     * that would leave an element pointing at a missing source, or a source at a missing
     * screenshot, is refused as a whole.
     */
    async applyChanges(changes: GraphChanges): Promise<void> {
      const { investigationId } = changes
      const belongs = <T extends { investigationId: string }>(record: T) => {
        if (record.investigationId !== investigationId) throw new Error(`Enregistrement d'une autre enquête`)
        return record
      }
      const entities = changes.upsertEntities.map((entity) => belongs(entitySchema.parse(entity)))
      const relations = changes.upsertRelations.map((relation) => belongs(relationSchema.parse(relation)))
      const sources = (changes.upsertSources ?? []).map((source) => belongs(sourceSchema.parse(source)))
      const attachments = (changes.upsertAttachments ?? []).map((attachment) =>
        belongs(attachmentSchema.parse(attachment)),
      )
      const deletedSourceIds = new Set(changes.deleteSourceIds ?? [])

      await db.transaction(
        'rw',
        [db.investigations, db.entities, db.relations, db.sources, db.attachments],
        async () => {
          const upsertedSourceIds = new Set(sources.map((source) => source.id))
          const upsertedAttachmentIds = new Set(attachments.map((attachment) => attachment.id))

          // Every source reference must resolve to a source that exists after this batch.
          const referenced = new Set<string>()
          for (const element of [...entities, ...relations]) {
            for (const sourceId of element.sourceIds) referenced.add(sourceId)
          }
          const toCheck = [...referenced].filter((id) => !upsertedSourceIds.has(id))
          const found = await db.sources.bulkGet(toCheck)
          toCheck.forEach((id, index) => {
            if (!found[index] || deletedSourceIds.has(id)) throw new Error('Source introuvable')
          })
          if (deletedSourceIds.size > 0) {
            const untouched = (record: { id: string; sourceIds: string[] }, touched: Set<string>) =>
              !touched.has(record.id) && record.sourceIds.some((id) => deletedSourceIds.has(id))
            const touchedEntities = new Set(entities.map((e) => e.id))
            const touchedRelations = new Set(relations.map((r) => r.id))
            const storedEntities = await db.entities
              .where('investigationId')
              .equals(investigationId)
              .toArray()
            const storedRelations = await db.relations
              .where('investigationId')
              .equals(investigationId)
              .toArray()
            const removedEntities = new Set(changes.deleteEntityIds)
            const removedRelations = new Set(changes.deleteRelationIds)
            const stillReferencing =
              storedEntities.some(
                (entity) => !removedEntities.has(entity.id) && untouched(entity, touchedEntities),
              ) ||
              storedRelations.some(
                (relation) => !removedRelations.has(relation.id) && untouched(relation, touchedRelations),
              )
            if (stillReferencing) throw new Error('Source encore utilisée')
          }

          // Every screenshot reference must resolve to a screenshot that exists after this batch.
          const wanted = sources.flatMap((source) =>
            source.attachmentId && !upsertedAttachmentIds.has(source.attachmentId)
              ? [source.attachmentId]
              : [],
          )
          const present = await db.attachments.bulkGet(wanted)
          if (present.some((attachment) => !attachment)) throw new Error('Capture introuvable')

          if (changes.deleteEntityIds.length > 0) {
            await db.entities.bulkDelete(changes.deleteEntityIds)
            const removed = changes.deleteEntityIds
            await db.relations.where('from').anyOf(removed).or('to').anyOf(removed).delete()
          }
          if (changes.deleteRelationIds.length > 0) await db.relations.bulkDelete(changes.deleteRelationIds)
          if (deletedSourceIds.size > 0) await db.sources.bulkDelete([...deletedSourceIds])
          if (attachments.length > 0) await db.attachments.bulkPut(attachments)
          if (sources.length > 0) await db.sources.bulkPut(sources)
          if (entities.length > 0) await db.entities.bulkPut(entities)
          if (relations.length > 0) await db.relations.bulkPut(relations)
          await db.investigations.update(investigationId, { updatedAt: nowIso() })
        },
      )
    },

    /**
     * Deletes the investigation's screenshots that no source references. Called when an
     * investigation is opened or left, so that a screenshot released during the session could
     * still be restored by an undo.
     */
    async purgeUnreferencedAttachments(investigationId: string): Promise<void> {
      await db.transaction('rw', [db.sources, db.attachments], async () => {
        const sources = await db.sources.where('investigationId').equals(investigationId).toArray()
        const referenced = new Set(
          sources.flatMap((source) => (source.attachmentId ? [source.attachmentId] : [])),
        )
        const stored = await db.attachments.where('investigationId').equals(investigationId).primaryKeys()
        const orphans = stored.filter((id) => !referenced.has(id))
        if (orphans.length > 0) await db.attachments.bulkDelete(orphans)
      })
    },
  }
}

export type GraphRepository = ReturnType<typeof graphRepository>
export const graph = graphRepository()
