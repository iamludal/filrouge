import { GRID_SIZE } from '@/domain/graph-geometry'
import { boundsOfCentres, LAYOUT_BOX, LAYOUT_GAP, type Positions } from '@/domain/layout/types'

/** Space between two packed groups. */
export const GROUP_GAP = 6 * GRID_SIZE
/** Grid cell of the entities without relations. */
const ORPHAN_CELL = {
  width: LAYOUT_BOX.width + (3 * LAYOUT_GAP) / 2,
  height: LAYOUT_BOX.height + (3 * LAYOUT_GAP) / 2,
}

/** Entities without relations in a square-ish grid, oldest first, row by row. */
export function orphanGrid(ids: string[]): Positions {
  const columns = Math.max(1, Math.ceil(Math.sqrt(ids.length)))
  const positions: Positions = {}
  ids.forEach((id, i) => {
    positions[id] = {
      x: (i % columns) * ORPHAN_CELL.width + LAYOUT_BOX.width / 2,
      y: Math.floor(i / columns) * ORPHAN_CELL.height + LAYOUT_BOX.height / 2,
    }
  })
  return positions
}

/**
 * Places laid-out groups side by side in rows, in the given order (largest first), then the
 * entities without relations as a grid after them. Each group keeps its own shape. Rows are about
 * as wide as the result is tall, and never narrower than the widest group. Works on box centres.
 */
export function packComponents(groups: Positions[], orphans: string[]): Positions {
  const blocks = [...groups, ...(orphans.length > 0 ? [orphanGrid(orphans)] : [])]
    .map((positions) => ({ positions, bounds: boundsOfCentres(Object.values(positions)) }))
    .filter(({ positions }) => Object.keys(positions).length > 0)

  const size = blocks.map(({ bounds }) => ({
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
  }))
  const area = size.reduce((sum, { width, height }) => sum + (width + GROUP_GAP) * (height + GROUP_GAP), 0)
  const rowWidth = Math.max(...size.map(({ width }) => width), Math.sqrt(area))

  const packed: Positions = {}
  let x = 0
  let y = 0
  let rowHeight = 0
  blocks.forEach(({ positions, bounds }, i) => {
    const { width, height } = size[i] ?? { width: 0, height: 0 }
    if (x > 0 && x + width > rowWidth) {
      x = 0
      y += rowHeight + GROUP_GAP
      rowHeight = 0
    }
    for (const [id, centre] of Object.entries(positions))
      packed[id] = { x: centre.x - bounds.minX + x, y: centre.y - bounds.minY + y }
    x += width + GROUP_GAP
    rowHeight = Math.max(rowHeight, height)
  })
  return packed
}
