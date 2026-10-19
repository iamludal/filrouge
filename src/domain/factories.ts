import type { EntityTypeId } from '@/domain/entity-types'
import {
  SCHEMA_VERSION,
  type Entity,
  type Investigation,
  type Position,
  type Relation,
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
    status: 'verified',
    createdAt: now,
    updatedAt: now,
  }
}
