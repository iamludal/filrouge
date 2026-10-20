import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ENTITY_TYPES } from '@/domain/entity-types'
import { EntityIcon } from '@/features/entities/entity-icon'
import { EntityPanel } from '@/features/entities/entity-panel'
import { RelationPanel } from '@/features/relations/relation-panel'
import { useGraphStore } from '@/store/graph-store'

/** What the detail panel shows for the current selection, in the side panel and in the drawer. */
export function DetailContent() {
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
    return (
      <>
        <h2
          className="mb-4 flex items-center gap-2 font-semibold"
          style={{ color: ENTITY_TYPES[entity.type].color }}
        >
          <EntityIcon type={entity.type} className="size-4" />
          {ENTITY_TYPES[entity.type].label}
        </h2>
        <EntityPanel key={entity.id} entity={entity} />
      </>
    )
  }

  if (relation) {
    return (
      <>
        <h2 className="mb-4 font-semibold">Relation</h2>
        <RelationPanel key={relation.id} relation={relation} />
      </>
    )
  }

  if (count > 1) {
    return (
      <div className="grid gap-3">
        <p className="text-sm text-muted-foreground">
          {count} éléments sélectionnés. Suppr pour les supprimer.
        </p>
        <Button
          variant="destructive"
          onClick={() => useGraphStore.getState().removeElements(selection.entityIds, selection.relationIds)}
        >
          <Trash2 /> Supprimer la sélection
        </Button>
      </div>
    )
  }

  return (
    <p className="text-sm text-muted-foreground">Sélectionnez une entité ou une relation pour la modifier.</p>
  )
}
