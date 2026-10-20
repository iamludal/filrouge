import type { EntityTypeId } from '@/domain/entity-types'
import { ENTITY_ICONS } from '@/features/entities/entity-icons'

export function EntityIcon({ type, className }: { type: EntityTypeId; className?: string }) {
  const Icon = ENTITY_ICONS[type]
  return <Icon className={className} aria-hidden />
}
