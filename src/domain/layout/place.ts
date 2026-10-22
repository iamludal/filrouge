import { GRID_SIZE } from '@/domain/graph-geometry'
import { boundsOfCentres, LAYOUT_BOX, type Positions } from '@/domain/layout/types'
import type { Position } from '@/domain/schemas'

// `|| 0` turns -0 into 0.
const snap = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE || 0

/**
 * Turns laid-out box centres into stored positions (top-left corner of the slot), moved so the
 * centre of the box around them is `anchor`, and snapped to the grid.
 */
export function placeAndSnap(centres: Positions, anchor: Position): Positions {
  const entries = Object.entries(centres)
  if (entries.length === 0) return {}
  const bounds = boundsOfCentres(entries.map(([, centre]) => centre))
  const dx = anchor.x - (bounds.minX + bounds.maxX) / 2 - LAYOUT_BOX.width / 2
  const dy = anchor.y - (bounds.minY + bounds.maxY) / 2 - LAYOUT_BOX.height / 2
  return Object.fromEntries(entries.map(([id, { x, y }]) => [id, { x: snap(x + dx), y: snap(y + dy) }]))
}
