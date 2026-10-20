import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { entityAppearance } from '@/domain/entity-appearance'
import { EntityIcon } from '@/features/entities/entity-icon'
import { EntityPanel } from '@/features/entities/entity-panel'
import { RelationPanel } from '@/features/relations/relation-panel'
import { useGraphStore } from '@/store/graph-store'
import { useI18n } from '@/i18n/locale'

/**
 * What the detail panel shows for the current selection, in the side panel and in the drawer.
 * `hideHeading` drops the entity type title when the caller already shows it (the drawer bar).
 */
export function DetailContent({ hideHeading = false }: { hideHeading?: boolean }) {
  const { t } = useI18n()
  const selection = useGraphStore((state) => state.selection)
  const entity = useGraphStore((state) =>
    state.selection.entityIds.length === 1 ? state.entities[state.selection.entityIds[0]!] : undefined,
  )
  const relation = useGraphStore((state) =>
    state.selection.entityIds.length === 0 && state.selection.relationIds.length === 1
      ? state.relations[state.selection.relationIds[0]!]
      : undefined,
  )
  const count = selection.entityIds.length + selection.relationIds.length

  if (entity) {
    const appearance = entityAppearance(entity)
    return (
      <>
        {!hideHeading && (
          <h2 className="mb-4 flex items-center gap-2 font-semibold" style={{ color: appearance.color }}>
            <EntityIcon icon={appearance.icon} className="size-4" />
            <span className="min-w-0 wrap-anywhere">{t.entityTypes[entity.type].label}</span>
          </h2>
        )}
        <EntityPanel key={entity.id} entity={entity} />
      </>
    )
  }

  if (relation) {
    return (
      <>
        <h2 className="mb-4 font-semibold">{t.detail.relation}</h2>
        <RelationPanel key={relation.id} relation={relation} />
      </>
    )
  }

  if (count > 1) {
    return (
      <div className="grid grid-cols-1 gap-3">
        <p className="text-sm text-muted-foreground">{t.detail.selectedHint(count)}</p>
        <Button
          variant="destructive"
          onClick={() => useGraphStore.getState().removeElements(selection.entityIds, selection.relationIds)}
        >
          <Trash2 /> {t.detail.deleteSelection}
        </Button>
      </div>
    )
  }

  return <p className="text-sm text-muted-foreground">{t.detail.empty}</p>
}
