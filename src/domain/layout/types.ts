import { GRID_SIZE, NODE_WIDTH } from '@/domain/graph-geometry'
import type { Position } from '@/domain/schemas'

export const LAYOUT_ALGORITHMS = ['organic', 'hierarchical', 'radial'] as const
export type LayoutAlgorithm = (typeof LAYOUT_ALGORITHMS)[number]

/**
 * Box reserved for an entity while laying out: its 144px slot, the circle and two lines of label.
 * Layouts work on box centres; `placeAndSnap` turns them back into stored slot corners.
 */
export const LAYOUT_BOX = { width: NODE_WIDTH, height: 5 * GRID_SIZE }
/** Smallest gap left between two boxes by every layout, before snapping to the grid. */
export const LAYOUT_GAP = 2 * GRID_SIZE

export interface LayoutNode {
  id: string
  important: boolean
  createdAt: string
}

export interface LayoutEdge {
  id: string
  from: string
  to: string
}

/** Positions by entity id. */
export type Positions = Record<string, Position>

export interface LayoutInput {
  algorithm: LayoutAlgorithm
  /** Entities to lay out, oldest first. */
  nodes: LayoutNode[]
  /** Relations whose two ends are laid out. */
  edges: LayoutEdge[]
  /** Centre of the radial layout. */
  centerId: string | undefined
  /** Centre of the box around the laid-out entities before the layout; the result is centred there. */
  anchor: Position
}

export interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/** Box around layout boxes given by their centres. */
export function boundsOfCentres(centres: Position[]): Bounds {
  const halfWidth = LAYOUT_BOX.width / 2
  const halfHeight = LAYOUT_BOX.height / 2
  return {
    minX: Math.min(...centres.map((c) => c.x)) - halfWidth,
    minY: Math.min(...centres.map((c) => c.y)) - halfHeight,
    maxX: Math.max(...centres.map((c) => c.x)) + halfWidth,
    maxY: Math.max(...centres.map((c) => c.y)) + halfHeight,
  }
}
