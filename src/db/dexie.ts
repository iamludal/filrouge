import Dexie, { type EntityTable } from 'dexie'
import type { Attachment, Entity, Investigation, Relation, Source } from '@/domain/schemas'

export const DATABASE_NAME = 'filrouge'

export class FilrougeDatabase extends Dexie {
  investigations!: EntityTable<Investigation, 'id'>
  entities!: EntityTable<Entity, 'id'>
  relations!: EntityTable<Relation, 'id'>
  sources!: EntityTable<Source, 'id'>
  attachments!: EntityTable<Attachment, 'id'>

  constructor(name = DATABASE_NAME) {
    super(name)
    this.version(1).stores({
      investigations: 'id, updatedAt',
      entities: 'id, investigationId',
      relations: 'id, investigationId, from, to',
      sources: 'id, investigationId',
      attachments: 'id, investigationId, sha256',
    })
  }
}

export const db = new FilrougeDatabase()
