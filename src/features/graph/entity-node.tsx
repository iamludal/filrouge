import { Handle, Position, useConnection, type NodeProps } from '@xyflow/react'
import { memo } from 'react'
import { ENTITY_TYPES } from '@/domain/entity-types'
import { EntityIcon } from '@/features/entities/entity-icon'
import type { EntityNode as EntityNodeType } from '@/features/graph/types'
import { cn } from '@/lib/utils'

/**
 * Drag the node body to move it, drag the small dot to create a relation. While a connection is
 * in progress, the whole node becomes a drop target.
 */
export const EntityNode = memo(function EntityNode({ id, data, selected }: NodeProps<EntityNodeType>) {
  const { entity } = data
  const type = ENTITY_TYPES[entity.type]
  const connection = useConnection()
  const isDropTarget = connection.inProgress && connection.fromNode.id !== id
  const label = entity.label || `${type.label} sans nom`

  return (
    <div className="group relative flex w-36 flex-col items-center gap-1.5" title={label}>
      <div
        className={cn(
          'relative flex size-12 items-center justify-center rounded-full border-2 bg-card shadow-sm transition-shadow',
          selected && 'ring-4 ring-ring/40',
          isDropTarget && 'ring-4 ring-primary/30',
        )}
        style={{ borderColor: type.color, color: type.color }}
      >
        <EntityIcon type={entity.type} className="size-5" />
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
