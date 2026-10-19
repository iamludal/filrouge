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

    async stats(investigationId: string): Promise<AttachmentStats> {
      const stats: AttachmentStats = { count: 0, totalSize: 0 }
      await db.attachments
        .where('investigationId')
        .equals(investigationId)
        .each((attachment) => {
          stats.count += 1
          stats.totalSize += attachment.size
        })
      return stats
    },
  }
}

export type AttachmentsRepository = ReturnType<typeof attachmentsRepository>
export const attachments = attachmentsRepository()
