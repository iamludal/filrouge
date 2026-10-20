import type { EntityIconId } from '@/domain/entity-appearance'
import { ENTITY_ICONS } from '@/features/entities/entity-icons'

export function EntityIcon({ icon, className }: { icon: EntityIconId; className?: string }) {
  const Icon = ENTITY_ICONS[icon]
  return <Icon className={className} aria-hidden />
}
