import type { ElkNode, LayoutOptions } from 'elkjs/lib/elk-api'
import { connectedComponents, type LayoutGroup } from '@/domain/layout/components'
import { packComponents } from '@/domain/layout/pack'
import { placeAndSnap } from '@/domain/layout/place'
import { radialLayout } from '@/domain/layout/radial'
import { LAYOUT_BOX, LAYOUT_GAP, type LayoutInput, type Positions } from '@/domain/layout/types'

/** The part of an ELK instance the pipeline uses, so tests can run ELK without a worker. */
export interface ElkEngine {
  layout(graph: ElkNode): Promise<ElkNode>
}

const STRESS: LayoutOptions = {
  'elk.algorithm': 'stress',
  'org.eclipse.elk.stress.desiredEdgeLength': String(LAYOUT_BOX.width + 2 * LAYOUT_GAP),
}
// Stress spreads the graph but lets boxes overlap; this pass pushes them apart, keeping the shape.
const REMOVE_OVERLAPS: LayoutOptions = {
  'elk.algorithm': 'sporeOverlap',
  'elk.spacing.nodeNode': String(LAYOUT_GAP),
}
const LAYERED: LayoutOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.spacing.nodeNode': String(LAYOUT_GAP * 1.5),
  'elk.layered.spacing.nodeNodeBetweenLayers': String(LAYOUT_GAP * 2),
}

function elkGraph(group: LayoutGroup, options: LayoutOptions, start?: Positions): ElkNode {
  return {
    id: 'root',
    layoutOptions: options,
    children: group.nodeIds.map((id) => ({
      id,
      width: LAYOUT_BOX.width,
      height: LAYOUT_BOX.height,
      ...(start?.[id] ? { x: start[id].x, y: start[id].y } : {}),
    })),
    edges: group.edges.map((edge) => ({ id: edge.id, sources: [edge.from], targets: [edge.to] })),
  }
}

/** ELK gives top-left corners; the pipeline works on box centres. */
function centres(result: ElkNode): Positions {
  const positions: Positions = {}
  for (const child of result.children ?? [])
    positions[child.id] = {
      x: (child.x ?? 0) + LAYOUT_BOX.width / 2,
      y: (child.y ?? 0) + LAYOUT_BOX.height / 2,
    }
  return positions
}

/** Raw ELK corners, fed back to the overlap removal as its starting point. */
function corners(result: ElkNode): Positions {
  const positions: Positions = {}
  for (const child of result.children ?? []) positions[child.id] = { x: child.x ?? 0, y: child.y ?? 0 }
  return positions
}

async function organic(group: LayoutGroup, elk: ElkEngine): Promise<Positions> {
  const spread = await elk.layout(elkGraph(group, STRESS))
  return centres(await elk.layout(elkGraph(group, REMOVE_OVERLAPS, corners(spread))))
}

async function layoutGroup(input: LayoutInput, group: LayoutGroup, elk: ElkEngine): Promise<Positions> {
  switch (input.algorithm) {
    case 'hierarchical':
      return centres(await elk.layout(elkGraph(group, LAYERED)))
    case 'radial': {
      // Only the centre's group goes on rings; the other groups get the organic layout.
      if (input.centerId && group.nodeIds.includes(input.centerId)) return radialLayout(input.centerId, group)
      return organic(group, elk)
    }
    case 'organic':
      return organic(group, elk)
  }
}

/**
 * Computes the stored positions of the entities of `input`: each linked group laid out with the
 * chosen algorithm, groups packed largest first with the entities without relations in a grid
 * after them, the whole centred on the anchor and snapped to the grid.
 */
export async function runLayout(input: LayoutInput, elk: ElkEngine): Promise<Positions> {
  const { groups, orphans } = connectedComponents(
    input.nodes.map((node) => node.id),
    input.edges,
  )
  const laidOut: Positions[] = []
  for (const group of groups) laidOut.push(await layoutGroup(input, group, elk))
  return placeAndSnap(packComponents(laidOut, orphans), input.anchor)
}
