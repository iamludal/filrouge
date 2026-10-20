import { Handle, Position, useConnection, type NodeProps } from '@xyflow/react'
import { memo } from 'react'
import { describeConfidence, formatConfidence } from '@/domain/assessment'
import { ENTITY_TYPES } from '@/domain/entity-types'
import { EntityIcon } from '@/features/entities/entity-icon'
import type { EntityNode as EntityNodeType } from '@/features/graph/types'
import { cn } from '@/lib/utils'

/**
 * Drag the node body to move it, drag the small dot to create a relation. While a connection is
 * in progress, the whole node becomes a drop target.
 *
 * The node's box hugs its circle and label: React Flow measures it for box selection, so it must
 * match what the user sees as the entity.
 */
export const EntityNode = memo(function EntityNode({ id, data, selected }: NodeProps<EntityNodeType>) {
  const { entity, dimmed, highlighted } = data
  const type = ENTITY_TYPES[entity.type]
  const connection = useConnection()
  const isDropTarget = connection.inProgress && connection.fromNode.id !== id
  const label = entity.label || `${type.label} sans nom`

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
        style={{ borderColor: type.color, color: type.color }}
      >
        <EntityIcon type={entity.type} className="size-5" />
        {entity.confidence && (
          <span
            role="img"
            title={describeConfidence(entity.confidence)}
            aria-label={describeConfidence(entity.confidence)}
            className="absolute -top-2 -right-4 rounded-full border bg-background px-1.5 text-[10px] leading-4 font-semibold text-foreground shadow-sm"
          >
            {formatConfidence(entity.confidence)}
          </span>
        )}
        <Handle
          type="source"
          position={Position.Right}
          aria-label={`Créer une relation depuis ${label}`}
          className={cn(
            'size-3! border-2! border-background! bg-primary! opacity-0 transition-opacity group-hover:opacity-100',
            selected && 'opacity-100',
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
