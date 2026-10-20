import { ChevronUp, X } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useId, useRef, useState, type PointerEvent } from 'react'
import { Button } from '@/components/ui/button'
import { entityAppearance } from '@/domain/entity-appearance'
import { type EntityTypeId } from '@/domain/entity-types'
import { EntityIcon } from '@/features/entities/entity-icon'
import { DetailContent } from '@/features/graph/detail-content'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n/locale'
import { entityName } from '@/i18n/names'
import { useGraphStore } from '@/store/graph-store'

/** A vertical drag longer than this expands, collapses or closes the drawer. */
const DRAG_THRESHOLD = 80
/** Below this, a pointer gesture on the handle is a tap. */
const TAP_SLOP = 10

function useSelectionSummary() {
  return useGraphStore(
    useShallow((state) => {
      const { entityIds, relationIds } = state.selection
      const count = entityIds.length + relationIds.length
      if (count === 0) return null
      const entity = entityIds.length === 1 && count === 1 ? state.entities[entityIds[0]!] : undefined
      if (entity) {
        return {
          kind: 'entity' as const,
          typeId: entity.type,
          label: entity.label,
          ...entityAppearance(entity),
        }
      }
      const relation = relationIds.length === 1 && count === 1 ? state.relations[relationIds[0]!] : undefined
      if (relation) {
        const from = state.entities[relation.from]
        const to = state.entities[relation.to]
        return {
          kind: 'relation' as const,
          label: relation.label,
          fromType: from?.type,
          fromLabel: from?.label ?? '',
          toType: to?.type,
          toLabel: to?.label ?? '',
        }
      }
      return { kind: 'many' as const, count }
    }),
  )
}

/**
 * The detail panel on narrow screens: a drawer at the bottom of the graph area. It does not trap
 * the focus nor dim the canvas, so the graph stays usable above it. Absent without a selection.
 */
export function DetailDrawer() {
  const hasSelection = useGraphStore(
    (state) => state.selection.entityIds.length + state.selection.relationIds.length > 0,
  )
  // Unmounting on an empty selection also resets the drawer to collapsed for the next one.
  return hasSelection ? <DrawerShell /> : null
}

function DrawerShell() {
  const { t } = useI18n()
  const summary = useSelectionSummary()
  const endName = (type: EntityTypeId | undefined, label: string) =>
    type ? entityName(t, { type, label }) : ''
  const bodyId = useId()
  const [expanded, setExpanded] = useState(false)
  const [offset, setOffset] = useState<number | null>(null)
  const drag = useRef<{ startY: number; dy: number } | null>(null)
  const dragged = useRef(false)

  const close = () => useGraphStore.getState().setSelection({ entityIds: [], relationIds: [] })

  const onPointerDown = (event: PointerEvent) => {
    drag.current = { startY: event.clientY, dy: 0 }
    dragged.current = false
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent) => {
    if (!drag.current) return
    const dy = event.clientY - drag.current.startY
    drag.current.dy = dy
    // The drawer follows a downward drag; an upward one is decided on release.
    if (Math.abs(dy) > TAP_SLOP) setOffset(Math.max(dy, 0))
  }

  const onPointerEnd = (event: PointerEvent) => {
    const current = drag.current
    drag.current = null
    setOffset(null)
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    if (!current || Math.abs(current.dy) <= TAP_SLOP) return
    dragged.current = true
    if (current.dy < -DRAG_THRESHOLD) setExpanded(true)
    else if (current.dy > DRAG_THRESHOLD) {
      if (expanded) setExpanded(false)
      else close()
    }
  }

  // The click that follows a drag is not a tap.
  const onClick = () => {
    if (dragged.current) {
      dragged.current = false
      return
    }
    setExpanded((value) => !value)
  }

  if (!summary) return null

  return (
    <section
      aria-label={t.detail.panelLabel}
      style={offset ? { transform: `translateY(${offset}px)` } : undefined}
      className={cn(
        'absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-xl border-t bg-background shadow-[0_-4px_12px_rgb(0_0_0/0.12)]',
        expanded && 'max-h-[85dvh]',
        offset === null && 'transition-transform motion-reduce:transition-none',
      )}
    >
      <div className="flex shrink-0 items-center">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={bodyId}
          aria-label={expanded ? t.detail.collapse : t.detail.expand}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onClick={onClick}
          className="flex min-h-14 min-w-0 flex-1 touch-none items-center gap-2 rounded-tl-xl px-4 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronUp
            aria-hidden
            className={cn('size-4 shrink-0 transition-transform', expanded && 'rotate-180')}
          />
          <span className="flex min-w-0 flex-1 items-center gap-2 text-sm">
            {summary.kind === 'entity' && (
              <>
                <span
                  className="flex shrink-0 items-center gap-1.5 font-semibold"
                  style={{ color: summary.color }}
                >
                  <EntityIcon icon={summary.icon} className="size-4" />
                  {t.entityTypes[summary.typeId].label}
                </span>
                <span className="truncate">
                  {entityName(t, { type: summary.typeId, label: summary.label })}
                </span>
              </>
            )}
            {summary.kind === 'relation' && (
              <>
                <span className="shrink-0 font-semibold">{summary.label || t.detail.relation}</span>
                <span className="truncate text-muted-foreground">{`${endName(summary.fromType, summary.fromLabel)} → ${endName(summary.toType, summary.toLabel)}`}</span>
              </>
            )}
            {summary.kind === 'many' && <span>{t.detail.selectedCount(summary.count)}</span>}
          </span>
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 shrink-0"
          aria-label={t.detail.close}
          onClick={close}
        >
          <X />
        </Button>
      </div>
      <div
        id={bodyId}
        hidden={!expanded}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pt-0"
      >
        <DetailContent hideHeading />
      </div>
    </section>
  )
}
