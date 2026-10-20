import type { EntityTypeId } from '@/domain/entity-types'
import type { Messages } from './types'

/** What an entity is called on screen: its label, else "<type> sans nom" in the active language. */
export function entityName(t: Messages, entity: { label: string; type: EntityTypeId }): string {
  return entity.label || t.entities.unnamed(t.entityTypes[entity.type].label)
}
