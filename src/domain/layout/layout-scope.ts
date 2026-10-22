import type { Entity, Relation } from '@/domain/schemas'
import {
  LAYOUT_BOX,
  type LayoutAlgorithm,
  type LayoutEdge,
  type LayoutInput,
  type LayoutNode,
} from '@/domain/layout/types'

const byAge = (a: LayoutNode, b: LayoutNode) =>
  a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0

/**
 * Radial centre when none is chosen: the important entity with the most relations, otherwise the
 * entity with the most relations; ties go to the oldest. `nodes` must be sorted oldest first.
 */
export function pickCentre(nodes: LayoutNode[], edges: LayoutEdge[]): string | undefined {
  const degree = new Map<string, number>()
  for (const { from, to } of edges) {
    if (from === to) continue
    degree.set(from, (degree.get(from) ?? 0) + 1)
    degree.set(to, (degree.get(to) ?? 0) + 1)
  }
  let best: LayoutNode | undefined
  for (const node of nodes) {
    if (!best) {
      best = node
      continue
    }
    if (node.important !== best.important) {
      if (node.important) best = node
      continue
    }
    if ((degree.get(node.id) ?? 0) > (degree.get(best.id) ?? 0)) best = node
  }
  return best?.id
}

/**
 * What a layout applies to. With no entity or one entity selected: the whole graph, the selected
 * entity being the radial centre. With two or more: the selected entities and the relations between
 * them. Selected relations do not change the scope.
 */
export function buildLayoutInput(
  entities: Entity[],
  relations: Relation[],
  selectedEntityIds: string[],
  algorithm: LayoutAlgorithm,
): LayoutInput {
  const known = new Set(entities.map((entity) => entity.id))
  const selected = selectedEntityIds.filter((id) => known.has(id))
  const partial = selected.length >= 2
  const inScope = partial ? new Set(selected) : known
  const scoped = entities.filter((entity) => inScope.has(entity.id))

  const nodes = scoped
    .map((entity) => ({ id: entity.id, important: entity.important === true, createdAt: entity.createdAt }))
    .sort(byAge)
  const edges = relations
    .filter((relation) => inScope.has(relation.from) && inScope.has(relation.to))
    .map((relation) => ({ id: relation.id, from: relation.from, to: relation.to }))

  const centerId = !partial && selected.length === 1 ? selected[0] : pickCentre(nodes, edges)

  const xs = scoped.map((entity) => entity.position.x)
  const ys = scoped.map((entity) => entity.position.y)
  const anchor =
    scoped.length === 0
      ? { x: 0, y: 0 }
      : {
          x: (Math.min(...xs) + Math.max(...xs) + LAYOUT_BOX.width) / 2,
          y: (Math.min(...ys) + Math.max(...ys) + LAYOUT_BOX.height) / 2,
        }

  return { algorithm, nodes, edges, centerId, anchor }
}
