import type { Attachment } from '@/domain/schemas'
import { db as defaultDb, type FilrougeDatabase } from '@/db/dexie'

export interface AttachmentStats {
  count: number
  /** Sum of the stored sizes, in bytes. Read from the rows, never from the Blob contents. */
  totalSize: number
}

export function attachmentsRepository(db: FilrougeDatabase = defaultDb) {
  return {
    async get(id: string): Promise<Attachment | undefined> {
      return db.attachments.get(id)
    },

    async list(investigationId: string): Promise<Attachment[]> {
      return db.attachments.where('investigationId').equals(investigationId).toArray()
    },

    /** Counts the screenshots a source references; ones released by a deleted source are ignored. */
    async stats(investigationId: string): Promise<AttachmentStats> {
      const sources = await db.sources.where('investigationId').equals(investigationId).toArray()
      const referenced = new Set(
        sources.flatMap((source) => (source.attachmentId ? [source.attachmentId] : [])),
      )
      const stats: AttachmentStats = { count: 0, totalSize: 0 }
      await db.attachments
        .where('investigationId')
        .equals(investigationId)
        .each((attachment) => {
          if (!referenced.has(attachment.id)) return
          stats.count += 1
          stats.totalSize += attachment.size
        })
      return stats
    },
  }
}

export type AttachmentsRepository = ReturnType<typeof attachmentsRepository>
export const attachments = attachmentsRepository()
