import type { LayoutGroup } from '@/domain/layout/components'
import { GRID_SIZE } from '@/domain/graph-geometry'
import type { Positions } from '@/domain/layout/types'

/**
 * Smallest distance between two box centres on the rings. Two 144 × 80 boxes whose centres are
 * this far apart keep a gap of at least 32px, even after both are snapped to the grid.
 */
export const RING_SPACING = 15 * GRID_SIZE

/**
 * Lays out a group around `centreId`: one ring per number of relations from the centre. Each
 * entity gets an angular sector proportional to the number of leaves below it in the breadth-first
 * tree, so a branch stays together. Ring radii grow by at least `RING_SPACING` and enough for the
 * closest two entities of the ring to be `RING_SPACING` apart. Returns box centres, the centre
 * entity at the origin. Neighbours are visited in the group's order, so the result is stable.
 */
export function radialLayout(centreId: string, group: LayoutGroup): Positions {
  const order = new Map(group.nodeIds.map((id, i) => [id, i]))
  const neighbours = new Map<string, Set<string>>(group.nodeIds.map((id) => [id, new Set()]))
  for (const { from, to } of group.edges) {
    if (from === to || !order.has(from) || !order.has(to)) continue
    neighbours.get(from)?.add(to)
    neighbours.get(to)?.add(from)
  }
  const sorted = (id: string) =>
    [...(neighbours.get(id) ?? [])].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0))

  // Breadth-first tree from the centre.
  const depth = new Map([[centreId, 0]])
  const children = new Map<string, string[]>()
  const visit = [centreId]
  for (let i = 0; i < visit.length; i++) {
    const id = visit[i] as string
    const own: string[] = []
    for (const next of sorted(id)) {
      if (depth.has(next)) continue
      depth.set(next, (depth.get(id) ?? 0) + 1)
      own.push(next)
      visit.push(next)
    }
    children.set(id, own)
  }

  const leaves = new Map<string, number>()
  for (let i = visit.length - 1; i >= 0; i--) {
    const id = visit[i] as string
    const own = children.get(id) ?? []
    leaves.set(id, own.length === 0 ? 1 : own.reduce((sum, child) => sum + (leaves.get(child) ?? 1), 0))
  }

  // Sectors, from the top of the circle clockwise.
  const angle = new Map<string, number>()
  const sector = new Map([[centreId, { start: -Math.PI / 2, width: 2 * Math.PI }]])
  for (const id of visit) {
    const { start, width } = sector.get(id) ?? { start: 0, width: 0 }
    angle.set(id, start + width / 2)
    const total = leaves.get(id) ?? 1
    let cursor = start
    for (const child of children.get(id) ?? []) {
      const share = (width * (leaves.get(child) ?? 1)) / total
      sector.set(child, { start: cursor, width: share })
      cursor += share
    }
  }

  const rings: string[][] = []
  for (const id of visit) {
    const d = depth.get(id) ?? 0
    ;(rings[d] ??= []).push(id)
  }
  const radius = [0]
  for (let d = 1; d < rings.length; d++) {
    const angles = (rings[d] ?? []).map((id) => angle.get(id) ?? 0).sort((a, b) => a - b)
    let gap = 2 * Math.PI
    for (let i = 1; i < angles.length; i++) gap = Math.min(gap, (angles[i] ?? 0) - (angles[i - 1] ?? 0))
    if (angles.length > 1) gap = Math.min(gap, 2 * Math.PI - ((angles.at(-1) ?? 0) - (angles[0] ?? 0)))
    // Chord between the two closest entities of the ring: 2 r sin(gap / 2) >= RING_SPACING.
    const fit = angles.length > 1 ? RING_SPACING / (2 * Math.sin(Math.min(gap, Math.PI) / 2)) : 0
    radius.push(Math.max((radius[d - 1] ?? 0) + RING_SPACING, fit))
  }

  const positions: Positions = {}
  for (const id of visit) {
    const r = radius[depth.get(id) ?? 0] ?? 0
    const a = angle.get(id) ?? 0
    positions[id] = r === 0 ? { x: 0, y: 0 } : { x: r * Math.cos(a), y: r * Math.sin(a) }
  }
  return positions
}
