import type { LayoutEdge } from '@/domain/layout/types'

/** Entities linked to each other, directly or not, with the relations between them. */
export interface LayoutGroup {
  nodeIds: string[]
  edges: LayoutEdge[]
}

export interface Components {
  /** Groups of at least two entities, largest first, then by their oldest entity. */
  groups: LayoutGroup[]
  /** Entities without any relation, in the input order. */
  orphans: string[]
}

/**
 * Splits the entities into connected groups. `nodeIds` give the stable order (oldest first), kept
 * inside each group. Relations to unknown entities and relations from an entity to itself are
 * ignored.
 */
export function connectedComponents(nodeIds: string[], edges: LayoutEdge[]): Components {
  const index = new Map(nodeIds.map((id, i) => [id, i]))
  const parent = nodeIds.map((_, i) => i)
  const find = (i: number): number => {
    let root = i
    while (parent[root] !== root) root = parent[root] ?? root
    while (parent[i] !== root) {
      const next = parent[i] ?? root
      parent[i] = root
      i = next
    }
    return root
  }

  const linked = new Set<string>()
  const kept: { edge: LayoutEdge; from: number }[] = []
  for (const edge of edges) {
    const from = index.get(edge.from)
    const to = index.get(edge.to)
    if (from === undefined || to === undefined || from === to) continue
    kept.push({ edge, from })
    linked.add(edge.from).add(edge.to)
    const [a, b] = [find(from), find(to)]
    // The oldest entity stays the root, so groups come out ordered by their oldest entity.
    if (a !== b) parent[Math.max(a, b)] = Math.min(a, b)
  }

  const byRoot = new Map<number, LayoutGroup>()
  const orphans: string[] = []
  nodeIds.forEach((id, i) => {
    if (!linked.has(id)) {
      orphans.push(id)
      return
    }
    const root = find(i)
    const group = byRoot.get(root) ?? { nodeIds: [], edges: [] }
    byRoot.set(root, group)
    group.nodeIds.push(id)
  })
  for (const { edge, from } of kept) byRoot.get(find(from))?.edges.push(edge)

  // Array.prototype.sort is stable: equal sizes keep the order of their oldest entity.
  const groups = [...byRoot.values()].sort((a, b) => b.nodeIds.length - a.nodeIds.length)
  return { groups, orphans }
}
