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
import { CREDIBILITY_VALUES, RELIABILITY_VALUES } from '@/domain/assessment'
import { ENTITY_TYPES, type EntityTypeId } from '@/domain/entity-types'
import { activeCriteriaCount, tagOptions, typeOptions, type GraphFilters } from '@/domain/graph-view'
import type { Status } from '@/domain/schemas'
import { EntityIcon } from '@/features/entities/entity-icon'
import { useI18n } from '@/i18n/locale'
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
  const { t } = useI18n()
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
        <ToggleGroupItem value={ANY}>{t.filters.all}</ToggleGroupItem>
        <ToggleGroupItem value="verified">{t.filters.verified}</ToggleGroupItem>
        <ToggleGroupItem value="hypothesis">{t.filters.hypotheses}</ToggleGroupItem>
      </ToggleGroup>
    </Criterion>
  )
}

/** `withReset` adds a reset button, for the dialog: the popover has its own next to the toolbar button. */
function FiltersForm({ filters, withReset = false }: { filters: GraphFilters; withReset?: boolean }) {
  const { locale, t } = useI18n()
  const entities = useGraphStore((state) => state.entities)
  const { setFilters, resetFilters } = useViewStore.getState()
  const types = typeOptions(entities, filters.types)
  const tags = tagOptions(entities, filters.tags, locale)
  const active = activeCriteriaCount(filters)

  return (
    <div className="grid max-h-[min(32rem,70vh)] gap-4 overflow-y-auto p-1">
      {withReset && (
        <Button variant="outline" size="sm" disabled={active === 0} onClick={resetFilters}>
          <RotateCcw /> {t.filters.reset}
        </Button>
      )}

      <Criterion title={t.filters.type}>
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
            <span>{`${t.entityTypes[type].label} (${count})`}</span>
          </CheckboxRow>
        ))}
      </Criterion>

      <Criterion title={t.filters.tag}>
        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.filters.noTags}</p>
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
        label={t.filters.entityStatus}
        value={filters.entityStatus}
        onChange={(entityStatus) => setFilters({ entityStatus })}
      />
      <StatusToggle
        label={t.filters.relationStatus}
        value={filters.relationStatus}
        onChange={(relationStatus) => setFilters({ relationStatus })}
      />

      <Criterion title={t.filters.confidence}>
        <Label htmlFor="filter-reliability" className="font-normal">
          {t.filters.minReliability}
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
            <SelectItem value={ANY}>{t.filters.any}</SelectItem>
            {RELIABILITY_VALUES.filter((value) => value !== 'F').map((value) => (
              <SelectItem key={value} value={value}>
                {value} — {t.assessment.reliability[value].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Label htmlFor="filter-credibility" className="font-normal">
          {t.filters.minCredibility}
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
            <SelectItem value={ANY}>{t.filters.any}</SelectItem>
            {CREDIBILITY_VALUES.filter((value) => value !== 6).map((value) => (
              <SelectItem key={value} value={String(value)}>
                {value} — {t.assessment.credibility[value].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <CheckboxRow
          id="filter-ungraded"
          checked={filters.includeUngraded}
          onChange={(includeUngraded) => setFilters({ includeUngraded })}
        >
          {t.filters.includeUngraded}
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
  const { t } = useI18n()
  const filters = useViewStore((state) => state.filters)
  const active = activeCriteriaCount(filters)

  return (
    <div className="flex">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn(active > 0 && 'rounded-r-none')}>
            <ListFilter /> {t.graph.toolbar.filters}
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
          aria-label={t.filters.resetAll}
          title={t.filters.resetAll}
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
  const { t } = useI18n()
  const filters = useViewStore((state) => state.filters)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.graph.toolbar.filters}</DialogTitle>
          <DialogDescription>{t.filters.dialogDescription}</DialogDescription>
        </DialogHeader>
        <FiltersForm filters={filters} withReset />
      </DialogContent>
    </Dialog>
  )
}
