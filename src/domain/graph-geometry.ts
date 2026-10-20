import type { Position } from '@/domain/schemas'

/** Entity nodes are 144px wide; their 48px circle is centred horizontally at the top. */
export const NODE_WIDTH = 144
export const CIRCLE_RADIUS = 24
export const CIRCLE_CENTER_Y = 24
/** Links stop slightly outside the circle border. */
export const EDGE_ATTACH_RADIUS = 26
/** Extra gap left before the target circle so an arrow head stays visible. */
export const ARROW_GAP = 2

export interface Segment {
  from: Position
  to: Position
  middle: Position
}

/** Centre of the circle of a node whose top-left corner is `position`. */
export function circleCenter(position: Position): Position {
  return { x: position.x + NODE_WIDTH / 2, y: position.y + CIRCLE_CENTER_Y }
}

/** Straight link between two circle centres, shortened to stop outside both circles. */
export function edgeSegment(fromCenter: Position, toCenter: Position): Segment {
  const dx = toCenter.x - fromCenter.x
  const dy = toCenter.y - fromCenter.y
  const length = Math.hypot(dx, dy) || 1
  const ux = dx / length
  const uy = dy / length
  const from = { x: fromCenter.x + ux * EDGE_ATTACH_RADIUS, y: fromCenter.y + uy * EDGE_ATTACH_RADIUS }
  const to = {
    x: toCenter.x - ux * (EDGE_ATTACH_RADIUS + ARROW_GAP),
    y: toCenter.y - uy * (EDGE_ATTACH_RADIUS + ARROW_GAP),
  }
  return { from, to, middle: { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 } }
}
