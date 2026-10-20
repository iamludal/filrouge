import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ENTITY_TYPE_IDS, ENTITY_TYPES, type EntityTypeId } from '@/domain/entity-types'
import { EntityIcon } from '@/features/entities/entity-icon'
import { useI18n } from '@/i18n/locale'

interface EntityTypeSelectProps {
  id?: string
  value: EntityTypeId
  onChange: (type: EntityTypeId) => void
}

export function EntityTypeSelect({ id, value, onChange }: EntityTypeSelectProps) {
  const { t } = useI18n()
  return (
    <Select value={value} onValueChange={(next) => onChange(next as EntityTypeId)}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ENTITY_TYPE_IDS.map((type) => (
          <SelectItem key={type} value={type}>
            <EntityIcon icon={ENTITY_TYPES[type].icon} className="size-4" />
            {t.entityTypes[type].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
