import { ENTITY_TYPES } from '@/domain/entity-types'
import { EntityIcon } from '@/features/entities/entity-icon'
import { EntityPanel } from '@/features/entities/entity-panel'
import { RelationPanel } from '@/features/relations/relation-panel'
import { useGraphStore } from '@/store/graph-store'

export function DetailPanel() {
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

  return (
    <aside
      aria-label="Panneau de détail"
      className="flex w-80 shrink-0 flex-col overflow-y-auto border-l bg-background p-4"
    >
      {entity ? (
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
      ) : relation ? (
        <>
          <h2 className="mb-4 font-semibold">Relation</h2>
          <RelationPanel key={relation.id} relation={relation} />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          {count > 1
            ? `${count} éléments sélectionnés. Suppr pour les supprimer.`
            : 'Sélectionnez une entité ou une relation pour la modifier.'}
        </p>
      )}
    </aside>
  )
}
