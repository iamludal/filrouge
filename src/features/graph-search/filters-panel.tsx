import { ListFilter, RotateCcw, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { CREDIBILITY, RELIABILITY } from '@/domain/assessment'
import { ENTITY_TYPES, type EntityTypeId } from '@/domain/entity-types'
import { activeCriteriaCount, tagOptions, typeOptions, type GraphFilters } from '@/domain/graph-view'
import type { Status } from '@/domain/schemas'
import { EntityIcon } from '@/features/entities/entity-icon'
import { cn } from '@/lib/utils'
import { useGraphStore } from '@/store/graph-store'
import { useViewStore } from '@/store/view-store'

const ANY = 'all'

function toggled<T>(values: readonly T[], value: T, checked: boolean): T[] {
  return checked ? [...values.filter((v) => v !== value), value] : values.filter((v) => v !== value)
}

function Criterion({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-1.5">
      <legend className="mb-1 text-xs font-medium text-muted-foreground">{title}</legend>
      {children}
    </fieldset>
  )
}

function CheckboxRow({
  id,
  checked,
  onChange,
  children,
}: {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(state) => onChange(state === true)} />
      <Label htmlFor={id} className="min-w-0 flex-1 gap-1.5 font-normal">
        {children}
      </Label>
    </div>
  )
}

/** A tag the filter can be switched on for, with the number of entities carrying it. */
function TagChip({
  label,
  count,
  pressed,
  onChange,
}: {
  label: string
  count: number
  pressed: boolean
  onChange: (pressed: boolean) => void
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={`${label} (${count})`}
      onClick={() => onChange(!pressed)}
      className={cn(
        'inline-flex h-6 max-w-full min-w-0 items-center gap-1.5 rounded-full border pr-1 pl-2.5 text-xs font-medium transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        pressed
          ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
          : 'border-border bg-background text-foreground hover:bg-muted',
      )}
    >
      <span className="truncate">{label}</span>
      <span
        aria-hidden
        className={cn(
          'min-w-4 shrink-0 rounded-full px-1 text-center text-[0.625rem] leading-4 tabular-nums',
          pressed ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground',
        )}
      >
        {count}
      </span>
    </button>
  )
}

/** "Tous / Vérifiés / Hypothèses": a choice that can never be left empty. */
function StatusToggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: Status | null
  onChange: (value: Status | null) => void
}) {
  return (
    <Criterion title={label}>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        spacing={0}
        aria-label={label}
        value={value ?? ANY}
        onValueChange={(next) => next && onChange(next === ANY ? null : (next as Status))}
      >
        <ToggleGroupItem value={ANY}>Tous</ToggleGroupItem>
        <ToggleGroupItem value="verified">Vérifiés</ToggleGroupItem>
        <ToggleGroupItem value="hypothesis">Hypothèses</ToggleGroupItem>
      </ToggleGroup>
    </Criterion>
  )
}

/** `withReset` adds a reset button, for the dialog: the popover has its own next to the toolbar button. */
function FiltersForm({ filters, withReset = false }: { filters: GraphFilters; withReset?: boolean }) {
  const entities = useGraphStore((state) => state.entities)
  const { setFilters, resetFilters } = useViewStore.getState()
  const types = typeOptions(entities, filters.types)
  const tags = tagOptions(entities, filters.tags)
  const active = activeCriteriaCount(filters)

  return (
    <div className="grid max-h-[min(32rem,70vh)] gap-4 overflow-y-auto p-1">
      {withReset && (
        <Button variant="outline" size="sm" disabled={active === 0} onClick={resetFilters}>
          <RotateCcw /> Réinitialiser
        </Button>
      )}

      <Criterion title="Type">
        {types.map(({ type, count }) => (
          <CheckboxRow
            key={type}
            id={`filter-type-${type}`}
            checked={filters.types.includes(type)}
            onChange={(checked) => setFilters({ types: toggled<EntityTypeId>(filters.types, type, checked) })}
          >
            <span style={{ color: ENTITY_TYPES[type].color }}>
              <EntityIcon type={type} className="size-3.5" />
            </span>
            <span>{`${ENTITY_TYPES[type].label} (${count})`}</span>
          </CheckboxRow>
        ))}
      </Criterion>

      <Criterion title="Tag">
        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun tag dans cette enquête</p>
        ) : (
          <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto p-0.5">
            {tags.map(({ key, label, count }) => (
              <TagChip
                key={key}
                label={label}
                count={count}
                pressed={filters.tags.includes(key)}
                onChange={(pressed) => setFilters({ tags: toggled(filters.tags, key, pressed) })}
              />
            ))}
          </div>
        )}
      </Criterion>

      <StatusToggle
        label="Statut des entités"
        value={filters.entityStatus}
        onChange={(entityStatus) => setFilters({ entityStatus })}
      />
      <StatusToggle
        label="Statut des relations"
        value={filters.relationStatus}
        onChange={(relationStatus) => setFilters({ relationStatus })}
      />

      <Criterion title="Confiance">
        <Label htmlFor="filter-reliability" className="font-normal">
          Fiabilité au moins
        </Label>
        <Select
          value={filters.minReliability ?? ANY}
          onValueChange={(value) =>
            setFilters({ minReliability: value === ANY ? null : (value as GraphFilters['minReliability']) })
          }
        >
          <SelectTrigger id="filter-reliability" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Toutes</SelectItem>
            {RELIABILITY.filter((grade) => grade.value !== 'F').map((grade) => (
              <SelectItem key={grade.value} value={grade.value}>
                {grade.value} — {grade.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Label htmlFor="filter-credibility" className="font-normal">
          Crédibilité au moins
        </Label>
        <Select
          value={filters.minCredibility ? String(filters.minCredibility) : ANY}
          onValueChange={(value) =>
            setFilters({
              minCredibility: value === ANY ? null : (Number(value) as GraphFilters['minCredibility']),
            })
          }
        >
          <SelectTrigger id="filter-credibility" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Toutes</SelectItem>
            {CREDIBILITY.filter((grade) => grade.value !== 6).map((grade) => (
              <SelectItem key={grade.value} value={String(grade.value)}>
                {grade.value} — {grade.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <CheckboxRow
          id="filter-ungraded"
          checked={filters.includeUngraded}
          onChange={(includeUngraded) => setFilters({ includeUngraded })}
        >
          Inclure les éléments non cotés
        </CheckboxRow>
      </Criterion>
    </div>
  )
}

/**
 * The "Filtres" button of the graph toolbar, with the number of criteria in force and, while any is,
 * a cross to clear them all.
 */
export function FiltersButton() {
  const filters = useViewStore((state) => state.filters)
  const active = activeCriteriaCount(filters)

  return (
    <div className="flex">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn(active > 0 && 'rounded-r-none')}>
            <ListFilter /> Filtres
            {active > 0 && <Badge variant="secondary">{active}</Badge>}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80">
          <FiltersForm filters={filters} />
        </PopoverContent>
      </Popover>
      {active > 0 && (
        <Button
          variant="outline"
          size="icon-sm"
          className="rounded-l-none border-l-0"
          aria-label="Réinitialiser les filtres"
          title="Réinitialiser les filtres"
          onClick={useViewStore.getState().resetFilters}
        >
          <X />
        </Button>
      )}
    </div>
  )
}

/** The filters panel as a dialog, for narrow screens where the toolbar has no room for a popover. */
export function FiltersDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const filters = useViewStore((state) => state.filters)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filtres</DialogTitle>
          <DialogDescription>Les éléments qui ne correspondent pas sont estompés.</DialogDescription>
        </DialogHeader>
        <FiltersForm filters={filters} withReset />
      </DialogContent>
    </Dialog>
  )
}
