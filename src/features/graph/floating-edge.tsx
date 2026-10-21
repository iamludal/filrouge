import {
  BaseEdge,
  EdgeLabelRenderer,
  useInternalNode,
  type EdgeProps,
  type InternalNode,
} from '@xyflow/react'
import { describeConfidence, relationLabelText } from '@/domain/assessment'
import { CIRCLE_CENTER_Y, edgeSegment } from '@/domain/graph-geometry'
import { cn } from '@/lib/utils'
import type { RelationEdge as RelationEdgeType } from '@/features/graph/types'
import { useI18n } from '@/i18n/locale'
import { useDisplayStore } from '@/store/display-store'

/** React Flow nodes are as wide as their content, so the circle is centred on the measured width. */
function measuredCircleCenter(node: InternalNode) {
  const { x, y } = node.internals.positionAbsolute
  return { x: x + (node.measured.width ?? 0) / 2, y: y + CIRCLE_CENTER_Y }
}

/** Straight edge between the two entity circles, independent of handle positions. */
export function FloatingEdge({ id, source, target, markerEnd, selected, data }: EdgeProps<RelationEdgeType>) {
  const { t } = useI18n()
  const { relationLabels, ratings } = useDisplayStore((state) => state.options)
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)
  if (!sourceNode || !targetNode) return null

  const { from, to, middle } = edgeSegment(measuredCircleCenter(sourceNode), measuredCircleCenter(targetNode))
  const path = `M ${from.x},${from.y} L ${to.x},${to.y}`
  const relation = data?.relation
  const dimmed = data?.dimmed
  const highlighted = data?.highlighted
  const confidence = ratings ? relation?.confidence : undefined
  const label = relationLabels && relation ? relationLabelText(relation.label, confidence) : ''
  const description = confidence ? describeConfidence(confidence, t.assessment) : undefined

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        interactionWidth={16}
        className={cn(
          'stroke-muted-foreground!',
          relation?.status === 'hypothesis' && '[stroke-dasharray:6_4]',
          dimmed && 'opacity-25',
          highlighted && !selected && 'stroke-amber-500! stroke-2!',
          selected && 'stroke-primary! stroke-2!',
        )}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className={cn(
              'nodrag nopan pointer-events-none absolute max-w-40 truncate rounded-md border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground',
              dimmed && 'opacity-25',
              highlighted && !selected && 'border-amber-500 text-foreground',
              selected && 'border-primary text-foreground',
            )}
            style={{ transform: `translate(-50%, -50%) translate(${middle.x}px, ${middle.y}px)` }}
            title={description ? `${label} – ${description}` : label}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
