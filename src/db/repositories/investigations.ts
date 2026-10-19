import { createInvestigation } from '@/domain/factories'
import type { InvestigationExport } from '@/domain/export-format'
import {
  attachmentSchema,
  investigationSchema,
  type Attachment,
  type Investigation,
  type InvestigationSnapshot,
} from '@/domain/schemas'
import { db as defaultDb, type FilrougeDatabase } from '@/db/dexie'
import { nowIso } from '@/lib/ids'

export function investigationsRepository(db: FilrougeDatabase = defaultDb) {
  const graphTables = [db.investigations, db.entities, db.relations, db.sources, db.attachments]

  return {
    /** Most recently updated first. */
    async list(): Promise<Investigation[]> {
      return db.investigations.orderBy('updatedAt').reverse().toArray()
    },

    async get(id: string): Promise<Investigation | undefined> {
      return db.investigations.get(id)
    },

    async create(name: string, description?: string): Promise<Investigation> {
      const investigation = investigationSchema.parse(createInvestigation(name, description))
      await db.investigations.add(investigation)
      return investigation
    },

    async update(
      id: string,
      patch: Partial<Pick<Investigation, 'name' | 'description'>>,
    ): Promise<Investigation> {
      return db.transaction('rw', db.investigations, async () => {
        const current = await db.investigations.get(id)
        if (!current) throw new Error('Enquête introuvable')
        const next = investigationSchema.parse({ ...current, ...patch, updatedAt: nowIso() })
        await db.investigations.put(next)
        return next
      })
    },

    async touch(id: string): Promise<void> {
      await db.investigations.update(id, { updatedAt: nowIso() })
    },

    /** Deletes the investigation and everything attached to it. */
    async remove(id: string): Promise<void> {
      await db.transaction('rw', graphTables, async () => {
        await Promise.all([
          db.entities.where('investigationId').equals(id).delete(),
          db.relations.where('investigationId').equals(id).delete(),
          db.sources.where('investigationId').equals(id).delete(),
          db.attachments.where('investigationId').equals(id).delete(),
        ])
        await db.investigations.delete(id)
      })
    },

    async loadSnapshot(id: string): Promise<InvestigationSnapshot | undefined> {
      return db.transaction('r', [db.investigations, db.entities, db.relations, db.sources], async () => {
        const investigation = await db.investigations.get(id)
        if (!investigation) return undefined
        const [entities, relations, sources] = await Promise.all([
          db.entities.where('investigationId').equals(id).toArray(),
          db.relations.where('investigationId').equals(id).toArray(),
          db.sources.where('investigationId').equals(id).toArray(),
        ])
        return { investigation, entities, relations, sources }
      })
    },

    /** The snapshot together with its screenshots, for export. */
    async loadExport(id: string): Promise<InvestigationExport | undefined> {
      const snapshot = await this.loadSnapshot(id)
      if (!snapshot) return undefined
      const attachments = await db.attachments.where('investigationId').equals(id).toArray()
      return { snapshot, attachments }
    },

    /**
     * Stores an already validated snapshot and its screenshots in one transaction. Fails if the
     * investigation id is taken.
     */
    async importSnapshot(snapshot: InvestigationSnapshot, attachments: Attachment[] = []): Promise<void> {
      const validated = attachments.map((attachment) => attachmentSchema.parse(attachment))
      await db.transaction('rw', graphTables, async () => {
        await db.investigations.add(snapshot.investigation)
        await db.attachments.bulkAdd(validated)
        await db.sources.bulkAdd(snapshot.sources)
        await db.entities.bulkAdd(snapshot.entities)
        await db.relations.bulkAdd(snapshot.relations)
      })
    },
  }
}

export type InvestigationsRepository = ReturnType<typeof investigationsRepository>
export const investigations = investigationsRepository()
