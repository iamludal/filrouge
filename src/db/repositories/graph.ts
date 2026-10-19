import { entitySchema, relationSchema, type Entity, type Relation } from '@/domain/schemas'
import { db as defaultDb, type FilrougeDatabase } from '@/db/dexie'
import { nowIso } from '@/lib/ids'

export interface GraphChanges {
  investigationId: string
  upsertEntities: Entity[]
  deleteEntityIds: string[]
  upsertRelations: Relation[]
  deleteRelationIds: string[]
}

export function graphRepository(db: FilrougeDatabase = defaultDb) {
  return {
    async listEntities(investigationId: string): Promise<Entity[]> {
      return db.entities.where('investigationId').equals(investigationId).toArray()
    },

    async listRelations(investigationId: string): Promise<Relation[]> {
      return db.relations.where('investigationId').equals(investigationId).toArray()
    },

    /**
     * Applies a batch of graph edits atomically. Every record is re-validated so that a bug in
     * the UI layer can never persist malformed data. Deleting an entity also deletes the
     * relations attached to it, even ones not listed in `deleteRelationIds`.
     */
    async applyChanges(changes: GraphChanges): Promise<void> {
      const { investigationId } = changes
      const belongs = <T extends { investigationId: string }>(record: T) => {
        if (record.investigationId !== investigationId) throw new Error('Enregistrement d’une autre enquête')
        return record
      }
      const entities = changes.upsertEntities.map((entity) => belongs(entitySchema.parse(entity)))
      const relations = changes.upsertRelations.map((relation) => belongs(relationSchema.parse(relation)))

      await db.transaction('rw', [db.investigations, db.entities, db.relations], async () => {
        if (changes.deleteEntityIds.length > 0) {
          await db.entities.bulkDelete(changes.deleteEntityIds)
          const removed = changes.deleteEntityIds
          await db.relations.where('from').anyOf(removed).or('to').anyOf(removed).delete()
        }
        if (changes.deleteRelationIds.length > 0) await db.relations.bulkDelete(changes.deleteRelationIds)
        if (entities.length > 0) await db.entities.bulkPut(entities)
        if (relations.length > 0) await db.relations.bulkPut(relations)
        await db.investigations.update(investigationId, { updatedAt: nowIso() })
      })
    },
  }
}

export type GraphRepository = ReturnType<typeof graphRepository>
export const graph = graphRepository()
