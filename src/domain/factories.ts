import type { EntityTypeId } from '@/domain/entity-types'
import {
  SCHEMA_VERSION,
  type Attachment,
  type Entity,
  type Investigation,
  type Position,
  type Relation,
  type Source,
  type Status,
} from '@/domain/schemas'
import { newId, nowIso } from '@/lib/ids'

export function createInvestigation(name: string, description?: string): Investigation {
  const now = nowIso()
  return {
    id: newId(),
    name: name.trim(),
    ...(description?.trim() ? { description: description.trim() } : {}),
    createdAt: now,
    updatedAt: now,
    schemaVersion: SCHEMA_VERSION,
    encrypted: false,
  }
}

export function createEntity(
  investigationId: string,
  type: EntityTypeId,
  position: Position,
  label = '',
): Entity {
  const now = nowIso()
  return {
    id: newId(),
    investigationId,
    type,
    label: label.trim(),
    properties: {},
    tags: [],
    sourceIds: [],
    status: 'verified',
    position,
    createdAt: now,
    updatedAt: now,
  }
}

export function createRelation(
  investigationId: string,
  from: string,
  to: string,
  label: string,
  directed = true,
  status: Status = 'hypothesis',
): Relation {
  const now = nowIso()
  return {
    id: newId(),
    investigationId,
    from,
    to,
    label: label.trim(),
    directed,
    sourceIds: [],
    status,
    createdAt: now,
    updatedAt: now,
  }
}

/** The user-editable fields of a source. */
export type SourceFields = Partial<Pick<Source, 'title' | 'url' | 'archiveUrl' | 'note' | 'capturedAt'>>

/** A source, linked to its screenshot (and carrying its fingerprints) when there is one. */
export function createSource(
  investigationId: string,
  fields: SourceFields = {},
  attachment?: Attachment,
): Source {
  return {
    id: newId(),
    investigationId,
    ...fields,
    capturedAt: fields.capturedAt ?? nowIso(),
    ...attachmentLink(attachment),
  }
}

/** The source fields mirroring a screenshot; all absent when the source has none. */
export function attachmentLink(
  attachment?: Attachment,
): Pick<Source, 'attachmentId' | 'sha256' | 'originalSha256'> {
  if (!attachment) return {}
  return {
    attachmentId: attachment.id,
    sha256: attachment.sha256,
    ...(attachment.originalSha256 ? { originalSha256: attachment.originalSha256 } : {}),
  }
}
