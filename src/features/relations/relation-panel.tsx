import { ArrowRight, Minus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ENTITY_TYPES } from '@/domain/entity-types'
import { RELATION_SUGGESTIONS } from '@/domain/relations'
import { LIMITS, type Relation } from '@/domain/schemas'
import { Field } from '@/features/entities/entity-panel'
import { SourcesSection } from '@/features/sources/sources-section'
import { useGraphStore } from '@/store/graph-store'

export function RelationPanel({ relation }: { relation: Relation }) {
  const updateRelation = useGraphStore((state) => state.updateRelation)
  const removeElements = useGraphStore((state) => state.removeElements)
  const setSelection = useGraphStore((state) => state.setSelection)
  const from = useGraphStore((state) => state.entities[relation.from])
  const to = useGraphStore((state) => state.entities[relation.to])
  const name = (entity: typeof from) => (entity ? entity.label || ENTITY_TYPES[entity.type].label : '?')

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          className="min-w-0 truncate font-medium hover:underline"
          onClick={() => setSelection({ entityIds: [relation.from], relationIds: [] })}
        >
          {name(from)}
        </button>
        {relation.directed ? (
          <ArrowRight className="size-4 shrink-0" />
        ) : (
          <Minus className="size-4 shrink-0" />
        )}
        <button
          type="button"
          className="min-w-0 truncate font-medium hover:underline"
          onClick={() => setSelection({ entityIds: [relation.to], relationIds: [] })}
        >
          {name(to)}
        </button>
      </div>
      <Field label="Libellé" htmlFor="panel-relation-label">
        <Input
          id="panel-relation-label"
          value={relation.label}
          maxLength={LIMITS.label}
          list="panel-relation-suggestions"
          onChange={(event) => updateRelation(relation.id, { label: event.target.value })}
        />
        <datalist id="panel-relation-suggestions">
          {RELATION_SUGGESTIONS.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      </Field>
      <div className="flex items-center gap-2">
        <Switch
          id="panel-relation-directed"
          checked={relation.directed}
          onCheckedChange={(directed) => updateRelation(relation.id, { directed })}
        />
        <Label htmlFor="panel-relation-directed">Orientée</Label>
      </div>
      <Field label="Sources">
        <SourcesSection element={{ type: 'relation', id: relation.id }} />
      </Field>
      <Button variant="destructive" onClick={() => removeElements([], [relation.id])}>
        <Trash2 /> Supprimer la relation
      </Button>
    </div>
  )
}
