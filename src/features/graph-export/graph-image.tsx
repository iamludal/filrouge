import { CIRCLE_RADIUS } from '@/domain/graph-geometry'
import { ENTITY_TYPES } from '@/domain/entity-types'
import { ENTITY_ICONS } from '@/features/entities/entity-icons'
import { EXPORT_FONT_FAMILY } from '@/features/graph-export/measure-text'
import type { GraphLayout } from '@/features/graph-export/graph-layout'

/** Light palette, mirroring the light theme: the export never follows the active theme. */
const PALETTE = {
  background: '#ffffff',
  text: '#0a0a0a',
  muted: '#737373',
  border: '#e5e5e5',
}
const ICON_SIZE = 20

/** Standalone drawing of an investigation graph: shapes and text only, no external reference. */
export function GraphImage({ title, layout }: { title: string; layout: GraphLayout }) {
  const { bounds, nodes, edges } = layout
  return (
    <svg
      width={bounds.width}
      height={bounds.height}
      viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`}
      fontFamily={EXPORT_FONT_FAMILY}
    >
      <title>{title}</title>
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="12"
          markerHeight="12"
          markerUnits="userSpaceOnUse"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={PALETTE.muted} />
        </marker>
      </defs>
      <rect x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height} fill={PALETTE.background} />

      <g data-layer="edges">
        {edges.map(({ relation, segment, label }) => (
          <g key={relation.id} data-relation={relation.id}>
            <line
              x1={segment.from.x}
              y1={segment.from.y}
              x2={segment.to.x}
              y2={segment.to.y}
              stroke={PALETTE.muted}
              strokeWidth={1}
              strokeDasharray={relation.status === 'hypothesis' ? '6 4' : undefined}
              markerEnd={relation.directed ? 'url(#arrow)' : undefined}
            />
            {label && (
              <>
                <rect
                  x={label.box.x}
                  y={label.box.y}
                  width={label.box.width}
                  height={label.box.height}
                  rx={6}
                  fill={PALETTE.background}
                  stroke={PALETTE.border}
                />
                <text
                  x={label.box.x + label.box.width / 2}
                  y={label.box.y + label.box.height / 2}
                  dy="0.35em"
                  textAnchor="middle"
                  fontSize={11}
                  fill={PALETTE.muted}
                >
                  {label.text}
                </text>
              </>
            )}
          </g>
        ))}
      </g>

      <g data-layer="nodes">
        {nodes.map(({ entity, center, label, labelY, unnamed, badge }) => {
          const type = ENTITY_TYPES[entity.type]
          const Icon = ENTITY_ICONS[entity.type]
          return (
            <g key={entity.id} data-entity={entity.id}>
              <circle
                cx={center.x}
                cy={center.y}
                r={CIRCLE_RADIUS - 1}
                fill={PALETTE.background}
                stroke={type.color}
                strokeWidth={2}
                strokeDasharray={entity.status === 'hypothesis' ? '4 3' : undefined}
              />
              <Icon
                x={center.x - ICON_SIZE / 2}
                y={center.y - ICON_SIZE / 2}
                width={ICON_SIZE}
                height={ICON_SIZE}
                color={type.color}
              />
              <text
                x={center.x}
                y={labelY}
                dy="0.35em"
                textAnchor="middle"
                fontSize={12}
                fontWeight={500}
                fontStyle={unnamed ? 'italic' : undefined}
                fill={unnamed ? PALETTE.muted : PALETTE.text}
              >
                {label}
              </text>
              {badge && (
                <>
                  <rect
                    x={badge.box.x}
                    y={badge.box.y}
                    width={badge.box.width}
                    height={badge.box.height}
                    rx={badge.box.height / 2}
                    fill={PALETTE.background}
                    stroke={PALETTE.border}
                  />
                  <text
                    x={badge.box.x + badge.box.width / 2}
                    y={badge.box.y + badge.box.height / 2}
                    dy="0.35em"
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={600}
                    fill={PALETTE.text}
                  >
                    {badge.text}
                  </text>
                </>
              )}
            </g>
          )
        })}
      </g>
    </svg>
  )
}
