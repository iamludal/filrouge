import { relationLabelText, formatConfidence } from '@/domain/assessment'
import { circleCenter, CIRCLE_RADIUS, edgeSegment, type Segment } from '@/domain/graph-geometry'
import type { EntityTypeId } from '@/domain/entity-types'
import type { Entity, Position, Relation } from '@/domain/schemas'
import { EXPORT_FONT_FAMILY, type MeasureText } from '@/features/graph-export/measure-text'
import { truncate } from '@/lib/format'

export const MARGIN = 32
export const MAX_ENTITY_LABEL = 24
export const MAX_RELATION_LABEL = 28
export const ENTITY_LABEL_FONT = `500 12px ${EXPORT_FONT_FAMILY}`
export const BADGE_FONT = `600 10px ${EXPORT_FONT_FAMILY}`
export const EDGE_LABEL_FONT = `400 11px ${EXPORT_FONT_FAMILY}`

/**
 * Offsets from the circle, as drawn on the canvas (grade badge: -top-2 -right-4, h 16; important
 * flag: -top-3 -left-3, 24 square).
 */
const BADGE_HEIGHT = 16
export const FLAG_SIZE = 24
const BADGE_PADDING = 6
const LABEL_TOP = 54
const LABEL_CENTER_Y = 62
const LABEL_BOTTOM = 72
const EDGE_LABEL_HEIGHT = 20
const EDGE_LABEL_PADDING = 6

export interface Box {
  x: number
  y: number
  width: number
  height: number
}

export interface NodeLayout {
  entity: Entity
  center: Position
  label: string
  labelY: number
  unnamed: boolean
  badge?: { text: string; box: Box }
  /** Flag badge of an important entity. */
  flag?: Box
}

export interface EdgeLayout {
  relation: Relation
  segment: Segment
  label?: { text: string; box: Box }
}

export interface GraphLayout {
  /** Drawing bounds, margin included, in graph coordinates. */
  bounds: Box
  nodes: NodeLayout[]
  edges: EdgeLayout[]
}

/** Positions and sizes of everything drawn in the export, from the investigation data only. */
export function layoutGraph(
  entities: Record<string, Entity>,
  relations: Record<string, Relation>,
  measureText: MeasureText,
  unnamedLabel: (type: EntityTypeId) => string,
): GraphLayout {
  const boxes: Box[] = []
  const nodes: NodeLayout[] = Object.values(entities).map((entity) => {
    const center = circleCenter(entity.position)
    const unnamed = !entity.label
    const label = truncate(entity.label || unnamedLabel(entity.type), MAX_ENTITY_LABEL)
    const labelWidth = measureText(label, ENTITY_LABEL_FONT)
    const top = entity.position.y
    boxes.push(
      { x: center.x - CIRCLE_RADIUS, y: top, width: CIRCLE_RADIUS * 2, height: CIRCLE_RADIUS * 2 },
      {
        x: center.x - labelWidth / 2,
        y: top + LABEL_TOP,
        width: labelWidth,
        height: LABEL_BOTTOM - LABEL_TOP,
      },
    )
    const node: NodeLayout = { entity, center, label, labelY: top + LABEL_CENTER_Y, unnamed }
    if (entity.confidence) {
      const text = formatConfidence(entity.confidence)
      const width = measureText(text, BADGE_FONT) + BADGE_PADDING * 2
      const right = center.x + CIRCLE_RADIUS + 16
      node.badge = { text, box: { x: right - width, y: top - 8, width, height: BADGE_HEIGHT } }
      boxes.push(node.badge.box)
    }
    if (entity.important) {
      node.flag = { x: center.x - CIRCLE_RADIUS - 12, y: top - 12, width: FLAG_SIZE, height: FLAG_SIZE }
      boxes.push(node.flag)
    }
    return node
  })

  const edges: EdgeLayout[] = []
  for (const relation of Object.values(relations)) {
    const from = entities[relation.from]
    const to = entities[relation.to]
    if (!from || !to) continue
    const segment = edgeSegment(circleCenter(from.position), circleCenter(to.position))
    const edge: EdgeLayout = { relation, segment }
    const full = relationLabelText(relation.label, relation.confidence)
    if (full) {
      const text = truncate(full, MAX_RELATION_LABEL)
      const width = measureText(text, EDGE_LABEL_FONT) + EDGE_LABEL_PADDING * 2
      edge.label = {
        text,
        box: {
          x: segment.middle.x - width / 2,
          y: segment.middle.y - EDGE_LABEL_HEIGHT / 2,
          width,
          height: EDGE_LABEL_HEIGHT,
        },
      }
      boxes.push(edge.label.box)
    }
    boxes.push({
      x: Math.min(segment.from.x, segment.to.x),
      y: Math.min(segment.from.y, segment.to.y),
      width: Math.abs(segment.to.x - segment.from.x),
      height: Math.abs(segment.to.y - segment.from.y),
    })
    edges.push(edge)
  }

  const minX = Math.min(...boxes.map((b) => b.x))
  const minY = Math.min(...boxes.map((b) => b.y))
  const maxX = Math.max(...boxes.map((b) => b.x + b.width))
  const maxY = Math.max(...boxes.map((b) => b.y + b.height))
  const x = Math.floor(minX - MARGIN)
  const y = Math.floor(minY - MARGIN)
  return {
    bounds: { x, y, width: Math.ceil(maxX + MARGIN) - x, height: Math.ceil(maxY + MARGIN) - y },
    nodes,
    edges,
  }
}
