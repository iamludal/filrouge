import { createElement } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { DEFAULT_DISPLAY, type DisplayOptions } from '@/domain/display-options'
import type { EntityTypeId } from '@/domain/entity-types'
import type { Entity, Relation } from '@/domain/schemas'
import { GraphImage } from '@/features/graph-export/graph-image'
import { layoutGraph } from '@/features/graph-export/graph-layout'
import { measureText as browserMeasureText, type MeasureText } from '@/features/graph-export/measure-text'

export interface GraphSvg {
  svg: string
  width: number
  height: number
}

/**
 * Draws the graph with React into a detached element and serialises it. Going through the DOM
 * means every label and attribute is escaped by the platform: no investigation text is ever
 * concatenated into markup.
 */
export function renderGraphSvg({
  name,
  entities,
  relations,
  measureText = browserMeasureText,
  unnamedLabel,
  display = DEFAULT_DISPLAY,
}: {
  name: string
  entities: Record<string, Entity>
  relations: Record<string, Relation>
  measureText?: MeasureText
  /** Names an entity without label, e.g. "Personne sans nom". */
  unnamedLabel: (type: EntityTypeId) => string
  /** What the canvas shows: what it hides is not drawn. */
  display?: DisplayOptions
}): GraphSvg {
  const layout = layoutGraph(entities, relations, measureText, unnamedLabel, display)
  const host = document.createElement('div')
  const root = createRoot(host)
  try {
    flushSync(() => root.render(createElement(GraphImage, { title: name, layout })))
    const element = host.querySelector('svg')
    if (!element) throw new Error('SVG not rendered')
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(element)}`
    return { svg, width: layout.bounds.width, height: layout.bounds.height }
  } finally {
    root.unmount()
  }
}
