import { Flag, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Toggle } from '@/components/ui/toggle'
import {
  ENTITY_COLOR_IDS,
  ENTITY_COLORS,
  ENTITY_ICON_IDS,
  entityAppearance,
  typeAppearance,
  type EntityColorId,
  type EntityIconId,
} from '@/domain/entity-appearance'
import type { Entity } from '@/domain/schemas'
import { EntityIcon } from '@/features/entities/entity-icon'
import { useI18n } from '@/i18n/locale'
import { cn } from '@/lib/utils'

const COLUMNS = 6

const CELL =
  'flex size-9 items-center justify-center rounded-md border border-transparent outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-checked:border-foreground aria-checked:bg-muted pointer-coarse:size-11'

/**
 * A grid of radio buttons where arrow keys move the focus and Enter or Space picks, so the picker
 * can close on a pick. Only the checked cell (the first one when none is) is a tab stop.
 */
function PickerGrid({ label, children }: { label: string; children: ReactNode }) {
  const grid = useRef<HTMLDivElement>(null)

  // The popover mounts its content when opened: start on the current choice.
  useEffect(() => {
    grid.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
  }, [])

  const onKeyDown = (event: React.KeyboardEvent) => {
    const cells = [...(grid.current?.querySelectorAll<HTMLElement>('[role="radio"]') ?? [])]
    const index = cells.indexOf(document.activeElement as HTMLElement)
    if (index < 0) return
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: COLUMNS, ArrowUp: -COLUMNS }[event.key]
    const target =
      event.key === 'Home' ? 0 : event.key === 'End' ? cells.length - 1 : step ? index + step : undefined
    if (target === undefined) return
    event.preventDefault()
    cells[Math.min(Math.max(target, 0), cells.length - 1)]?.focus()
  }

  return (
    <div
      ref={grid}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="grid max-h-[min(24rem,var(--radix-popover-content-available-height))] grid-cols-6 gap-1 overflow-y-auto"
    >
      {children}
    </div>
  )
}

function Cell({
  checked,
  tabStop,
  label,
  onPick,
  children,
}: {
  checked: boolean
  tabStop: boolean
  label: string
  onPick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-label={label}
      title={label}
      tabIndex={tabStop ? 0 : -1}
      className={CELL}
      onClick={onPick}
    >
      {children}
    </button>
  )
}

type Patch = Partial<Pick<Entity, 'color' | 'icon' | 'important'>>

function ColorPicker({
  entity,
  onChange,
}: {
  entity: Pick<Entity, 'type' | 'color' | 'icon'>
  onChange: (patch: Patch) => void
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const appearance = entityAppearance(entity)
  const name = entity.color ? t.appearance.colors[entity.color] : t.appearance.typeColor

  const pick = (color: EntityColorId | undefined) => {
    if (color !== entity.color) onChange({ color })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="justify-start max-md:h-11"
          aria-label={t.appearance.currentColor(name)}
        >
          <span
            aria-hidden
            className="size-3.5 shrink-0 rounded-full"
            style={{ backgroundColor: appearance.color }}
          />
          <span className="truncate">{t.appearance.color}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <PickerGrid label={t.appearance.color}>
          <Cell
            checked={!entity.color}
            tabStop={!entity.color}
            label={t.appearance.typeColor}
            onPick={() => pick(undefined)}
          >
            <RotateCcw aria-hidden className="size-4" style={{ color: typeAppearance(entity.type).color }} />
          </Cell>
          {ENTITY_COLOR_IDS.map((id) => (
            <Cell
              key={id}
              checked={entity.color === id}
              tabStop={entity.color === id}
              label={t.appearance.colors[id]}
              onPick={() => pick(id)}
            >
              <span
                aria-hidden
                className="size-5 rounded-full"
                style={{ backgroundColor: ENTITY_COLORS[id] }}
              />
            </Cell>
          ))}
        </PickerGrid>
      </PopoverContent>
    </Popover>
  )
}

function IconPicker({
  entity,
  onChange,
}: {
  entity: Pick<Entity, 'type' | 'color' | 'icon'>
  onChange: (patch: Patch) => void
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const appearance = entityAppearance(entity)
  const name = entity.icon ? t.appearance.icons[entity.icon] : t.appearance.typeIcon

  const pick = (icon: EntityIconId | undefined) => {
    if (icon !== entity.icon) onChange({ icon })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="justify-start max-md:h-11"
          aria-label={t.appearance.currentIcon(name)}
        >
          <EntityIcon icon={appearance.icon} className="size-4" />
          <span className="truncate">{t.appearance.icon}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <PickerGrid label={t.appearance.icon}>
          <Cell
            checked={!entity.icon}
            tabStop={!entity.icon}
            label={t.appearance.typeIcon}
            onPick={() => pick(undefined)}
          >
            <RotateCcw aria-hidden className="size-4" style={{ color: appearance.color }} />
          </Cell>
          {ENTITY_ICON_IDS.map((id) => (
            <Cell
              key={id}
              checked={entity.icon === id}
              tabStop={entity.icon === id}
              label={t.appearance.icons[id]}
              onPick={() => pick(id)}
            >
              <span style={{ color: appearance.color }}>
                <EntityIcon icon={id} className="size-5" />
              </span>
            </Cell>
          ))}
        </PickerGrid>
      </PopoverContent>
    </Popover>
  )
}

/** The colour and icon pickers and the "important" toggle of one entity. */
export function AppearanceField({
  entity,
  onChange,
}: {
  entity: Pick<Entity, 'type' | 'color' | 'icon' | 'important'>
  onChange: (patch: Patch) => void
}) {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap gap-2">
      <ColorPicker entity={entity} onChange={onChange} />
      <IconPicker entity={entity} onChange={onChange} />
      <Toggle
        variant="outline"
        pressed={entity.important === true}
        onPressedChange={(pressed) => onChange({ important: pressed ? true : undefined })}
        className={cn('max-md:h-11', entity.important && 'text-red-600')}
      >
        <Flag aria-hidden className={cn(entity.important && 'fill-current')} />
        {t.appearance.important}
      </Toggle>
    </div>
  )
}
