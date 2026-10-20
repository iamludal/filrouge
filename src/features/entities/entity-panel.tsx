import { Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { LIMITS, type Entity } from '@/domain/schemas'
import { AssessmentFields } from '@/features/assessment/assessment-fields'
import { ElementTimestamps } from '@/features/entities/element-timestamps'
import { EntityTypeSelect } from '@/features/entities/entity-type-select'
import { NotesEditor } from '@/features/entities/notes-editor'
import { PropertiesEditor } from '@/features/entities/properties-editor'
import { SourcesSection } from '@/features/sources/sources-section'
import { TagsEditor } from '@/features/entities/tags-editor'
import { useGraphStore } from '@/store/graph-store'
import { useI18n } from '@/i18n/locale'

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="grid grid-cols-1 gap-1.5">
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground uppercase">
        {label}
      </Label>
      {children}
    </div>
  )
}

export function EntityPanel({ entity }: { entity: Entity }) {
  const { t } = useI18n()
  const updateEntity = useGraphStore((state) => state.updateEntity)
  const removeElements = useGraphStore((state) => state.removeElements)
  const relationCount = useGraphStore(
    (state) =>
      Object.values(state.relations).filter((r) => r.from === entity.id || r.to === entity.id).length,
  )

  return (
    <div className="grid grid-cols-1 gap-4">
      <ElementTimestamps createdAt={entity.createdAt} updatedAt={entity.updatedAt} />
      <Field label={t.entities.type} htmlFor="panel-entity-type">
        <EntityTypeSelect
          id="panel-entity-type"
          value={entity.type}
          onChange={(type) => updateEntity(entity.id, { type })}
        />
      </Field>
      <Field label={t.entities.label} htmlFor="panel-entity-label">
        <Input
          id="panel-entity-label"
          value={entity.label}
          maxLength={LIMITS.label}
          placeholder={t.entities.unnamed(t.entityTypes[entity.type].label)}
          onChange={(event) => updateEntity(entity.id, { label: event.target.value })}
        />
      </Field>
      <AssessmentFields
        idPrefix="panel-entity"
        status={entity.status}
        confidence={entity.confidence}
        onChange={(patch) => updateEntity(entity.id, patch)}
      />
      <Separator />
      <Field label={t.entities.properties}>
        <PropertiesEditor
          properties={entity.properties}
          suggestions={t.entityTypes[entity.type].properties}
          onChange={(properties) => updateEntity(entity.id, { properties })}
        />
      </Field>
      <Field label={t.entities.tags}>
        <TagsEditor tags={entity.tags} onChange={(tags) => updateEntity(entity.id, { tags })} />
      </Field>
      <Field label={t.entities.notes}>
        <NotesEditor
          key={entity.id}
          value={entity.notes ?? ''}
          onChange={(notes) => updateEntity(entity.id, { notes: notes || undefined })}
        />
      </Field>
      <Field label={t.entities.sources}>
        <SourcesSection element={{ type: 'entity', id: entity.id }} />
      </Field>
      <Separator />
      <Button
        variant="destructive"
        className="h-auto min-h-8 py-1.5 whitespace-normal"
        onClick={() => removeElements([entity.id], [])}
      >
        <Trash2 /> {t.entities.delete(relationCount)}
      </Button>
    </div>
  )
}
