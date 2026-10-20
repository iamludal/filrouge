import { Handle, Position, useConnection, type NodeProps } from '@xyflow/react'
import { Flag } from 'lucide-react'
import { memo } from 'react'
import { describeConfidence, formatConfidence } from '@/domain/assessment'
import { entityAppearance, importantTint } from '@/domain/entity-appearance'
import { EntityIcon } from '@/features/entities/entity-icon'
import type { EntityNode as EntityNodeType } from '@/features/graph/types'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n/locale'
import { entityName } from '@/i18n/names'

/*
 * On touch screens the 12px dot is far too small for a finger: a selected node's handle gets an
 * invisible 44px hit area. An unselected node's handle is invisible, so it gets none and the node
 * stays easy to pan around and to drag.
 */
const TOUCH_HIT_AREA =
  "pointer-coarse:before:absolute pointer-coarse:before:top-1/2 pointer-coarse:before:left-1/2 pointer-coarse:before:size-11 pointer-coarse:before:-translate-1/2 pointer-coarse:before:content-['']"

/**
 * Drag the node body to move it, drag the small dot to create a relation. While a connection is
 * in progress, the whole node becomes a drop target.
 *
 * The node's box hugs its circle and label: React Flow measures it for box selection, so it must
 * match what the user sees as the entity.
 */
export const EntityNode = memo(function EntityNode({ id, data, selected }: NodeProps<EntityNodeType>) {
  const { entity, dimmed, highlighted } = data
  const { t } = useI18n()
  const appearance = entityAppearance(entity)
  const connection = useConnection()
  const isDropTarget = connection.inProgress && connection.fromNode.id !== id
  const label = entityName(t, entity)

  return (
    <div
      className={cn(
        'group relative flex w-max max-w-36 flex-col items-center gap-1.5 transition-opacity',
        dimmed && 'opacity-25',
      )}
      title={label}
    >
      <div
        className={cn(
          'relative flex size-12 items-center justify-center rounded-full border-2 bg-card shadow-sm transition-shadow',
          entity.status === 'hypothesis' && 'border-dashed',
          highlighted && !selected && 'ring-4 ring-amber-400/70',
          selected && 'ring-4 ring-ring/40',
          isDropTarget && 'ring-4 ring-primary/30',
        )}
        style={{
          borderColor: appearance.color,
          color: appearance.color,
          // An important entity stands out at a glance: its border grows outwards (an outline, so the
          // node keeps its size for edges and box selection) and its background takes its colour.
          ...(entity.important && {
            outline: `2px ${entity.status === 'hypothesis' ? 'dashed' : 'solid'} ${appearance.color}`,
            backgroundImage: importantTint(appearance.color),
          }),
        }}
      >
        <EntityIcon icon={appearance.icon} className="size-5" />
        {entity.important && (
          <span
            role="img"
            title={t.appearance.important}
            aria-label={t.appearance.important}
            className="absolute -top-3 -left-3 flex size-6 items-center justify-center rounded-full border bg-background text-red-600 shadow-sm"
          >
            <Flag aria-hidden className="size-3.5 fill-current" />
          </span>
        )}
        {entity.confidence && (
          <span
            role="img"
            title={describeConfidence(entity.confidence, t.assessment)}
            aria-label={describeConfidence(entity.confidence, t.assessment)}
            className="absolute -top-2 -right-4 rounded-full border bg-background px-1.5 text-[10px] leading-4 font-semibold text-foreground shadow-sm"
          >
            {formatConfidence(entity.confidence)}
          </span>
        )}
        <Handle
          type="source"
          position={Position.Right}
          aria-label={t.graph.createRelationFrom(label)}
          className={cn(
            'size-3! border-2! border-background! bg-primary! opacity-0 transition-opacity group-hover:opacity-100',
            selected && ['opacity-100', TOUCH_HIT_AREA],
            connection.inProgress && 'opacity-0!',
          )}
        />
      </div>
      <div
        className={cn(
          'max-w-full truncate rounded-md bg-background/80 px-1.5 text-center text-xs font-medium',
          !entity.label && 'text-muted-foreground italic',
        )}
      >
        {label}
      </div>
      {/* Invisible full-size target, only active while connecting. */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectableStart={false}
        className={cn(
          'absolute! inset-0! size-full! transform-none! rounded-none! border-0! bg-transparent! opacity-0!',
          !isDropTarget && 'pointer-events-none!',
        )}
      />
    </div>
  )
})
