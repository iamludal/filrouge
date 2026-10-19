import {
  BaseEdge,
  EdgeLabelRenderer,
  useInternalNode,
  type EdgeProps,
  type InternalNode,
} from '@xyflow/react'
import { cn } from '@/lib/utils'
import type { RelationEdge as RelationEdgeType } from '@/features/graph/types'

// Entity nodes draw a 48px circle at the top of the node; edges attach to that circle.
const CIRCLE_RADIUS = 26
const CIRCLE_CENTER_Y = 24

function circleCenter(node: InternalNode) {
  const width = node.measured.width ?? 0
  return {
    x: node.internals.positionAbsolute.x + width / 2,
    y: node.internals.positionAbsolute.y + CIRCLE_CENTER_Y,
  }
}

/** Straight edge between the two entity circles, independent of handle positions. */
export function FloatingEdge({ id, source, target, markerEnd, selected, data }: EdgeProps<RelationEdgeType>) {
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)
  if (!sourceNode || !targetNode) return null

  const from = circleCenter(sourceNode)
  const to = circleCenter(targetNode)
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy) || 1
  const ux = dx / length
  const uy = dy / length
  const sx = from.x + ux * CIRCLE_RADIUS
  const sy = from.y + uy * CIRCLE_RADIUS
  const tx = to.x - ux * (CIRCLE_RADIUS + 2)
  const ty = to.y - uy * (CIRCLE_RADIUS + 2)
  const path = `M ${sx},${sy} L ${tx},${ty}`
  const label = data?.relation.label

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        interactionWidth={16}
        className={cn('stroke-muted-foreground!', selected && 'stroke-primary! stroke-2!')}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className={cn(
              'nodrag nopan pointer-events-none absolute max-w-40 truncate rounded-md border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground',
              selected && 'border-primary text-foreground',
            )}
            style={{ transform: `translate(-50%, -50%) translate(${(sx + tx) / 2}px, ${(sy + ty) / 2}px)` }}
            title={label}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
