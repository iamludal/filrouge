import { ENTITY_COLORS, typeAppearance } from '@/domain/entity-appearance'
import { fr } from '@/i18n/messages/fr'
import { circleCenter, edgeSegment } from '@/domain/graph-geometry'
import { createEntity, createRelation } from '@/domain/factories'
import type { Confidence, Entity, Relation, Status } from '@/domain/schemas'
import { estimateTextWidth } from '@/features/graph-export/measure-text'
import { renderGraphSvg } from '@/features/graph-export/render-graph-svg'

const INV = 'inv'

function entity(
  label: string,
  x: number,
  y: number,
  extra: {
    type?: Entity['type']
    status?: Status
    confidence?: Confidence
    color?: Entity['color']
    icon?: Entity['icon']
    important?: boolean
  } = {},
): Entity {
  return {
    ...createEntity(INV, extra.type ?? 'person', { x, y }, label),
    status: extra.status ?? 'verified',
    confidence: extra.confidence,
    ...(extra.color ? { color: extra.color } : {}),
    ...(extra.icon ? { icon: extra.icon } : {}),
    ...(extra.important ? { important: true } : {}),
  }
}

function relation(
  from: Entity,
  to: Entity,
  label: string,
  extra: { directed?: boolean; status?: Status; confidence?: Confidence } = {},
): Relation {
  return {
    ...createRelation(INV, from.id, to.id, label, extra.directed ?? false, extra.status ?? 'verified'),
    confidence: extra.confidence,
  }
}

const byId = <T extends { id: string }>(items: T[]) => Object.fromEntries(items.map((i) => [i.id, i]))

function draw(entities: Entity[], relations: Relation[] = []) {
  const out = renderGraphSvg({
    name: 'Test',
    entities: byId(entities),
    relations: byId(relations),
    measureText: estimateTextWidth,
    unnamedLabel: (type) => `${fr.entityTypes[type].label} sans nom`,
  })
  const doc = new DOMParser().parseFromString(out.svg, 'image/svg+xml')
  expect(doc.querySelector('parsererror')).toBeNull()
  return { ...out, doc }
}

const texts = (doc: Document) => Array.from(doc.querySelectorAll('text')).map((t) => t.textContent)

describe('renderGraphSvg', () => {
  it('is a standalone SVG sized to its viewBox, on a white background', () => {
    const { svg, doc, width, height } = draw([entity('A', 0, 0)])
    const root = doc.documentElement
    expect(svg.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(root.getAttribute('width')).toBe(String(width))
    expect(root.getAttribute('height')).toBe(String(height))
    expect(doc.querySelector('rect')?.getAttribute('fill')).toBe('#ffffff')
    expect(doc.querySelector('title')?.textContent).toBe('Test')
  })

  it('names an unlabelled entity after its type', () => {
    const { doc } = draw([entity('', 0, 0, { type: 'person' })])
    expect(texts(doc)).toContain('Personne sans nom')
  })

  it('draws a hypothesis dashed and a verified entity solid, in the type colour', () => {
    const a = entity('A', 0, 0, { status: 'hypothesis', type: 'email' })
    const b = entity('B', 300, 0, { status: 'verified', type: 'domain' })
    const { doc } = draw([a, b])
    const circle = (id: string) => doc.querySelector(`[data-entity="${id}"] circle`)
    expect(circle(a.id)?.getAttribute('stroke-dasharray')).toBeTruthy()
    expect(circle(a.id)?.getAttribute('stroke')).toBe(typeAppearance('email').color)
    expect(circle(b.id)?.getAttribute('stroke-dasharray')).toBeNull()
    expect(circle(b.id)?.getAttribute('stroke')).toBe(typeAppearance('domain').color)
  })

  it('shows the grade badge of a graded entity only', () => {
    const graded = entity('A', 0, 0, { confidence: { reliability: 'B', credibility: 2 } })
    const plain = entity('B', 300, 0)
    const { doc } = draw([graded, plain])
    expect(texts(doc)).toContain('B2')
    expect(doc.querySelectorAll(`[data-entity="${plain.id}"] text`)).toHaveLength(1)
  })

  it("draws the entity's own colour and icon in place of the type's", () => {
    const styled = entity('A', 0, 0, { color: 'red', icon: 'skull' })
    const plain = entity('B', 300, 0)
    const { doc } = draw([styled, plain])
    const of = (e: Entity) => doc.querySelector(`[data-entity="${e.id}"]`)!
    expect(of(styled).querySelector('circle')?.getAttribute('stroke')).toBe(ENTITY_COLORS.red)
    const icon = of(styled).querySelector('svg')!
    expect(icon.getAttribute('class')).toContain('lucide-skull')
    expect(icon.getAttribute('stroke')).toBe(ENTITY_COLORS.red)
    expect(of(plain).querySelector('svg')?.getAttribute('class')).toContain('lucide-user')
    expect(of(plain).querySelector('circle')?.getAttribute('stroke')).toBe(typeAppearance('person').color)
  })

  it('draws a flag badge on an important entity only', () => {
    const important = entity('A', 0, 0, { important: true })
    const plain = entity('B', 300, 0)
    const { doc } = draw([important, plain])
    expect(doc.querySelectorAll(`[data-entity="${important.id}"] [data-flag]`)).toHaveLength(1)
    expect(doc.querySelectorAll(`[data-entity="${plain.id}"] [data-flag]`)).toHaveLength(0)
    expect(
      doc.querySelector(`[data-entity="${important.id}"] [data-flag] svg`)?.getAttribute('class'),
    ).toContain('lucide-flag')
  })

  it('keeps the flag of an entity alone at the top left inside the image bounds', () => {
    const { doc } = draw([entity('A', 0, 0, { important: true })])
    const [x, y, width, height] = doc.documentElement.getAttribute('viewBox')!.split(' ').map(Number)
    const flag = doc.querySelector('[data-flag] circle')!
    const cx = Number(flag.getAttribute('cx'))
    const cy = Number(flag.getAttribute('cy'))
    const r = Number(flag.getAttribute('r'))
    expect(cx - r).toBeGreaterThanOrEqual(x!)
    expect(cy - r).toBeGreaterThanOrEqual(y!)
    expect(cx + r).toBeLessThanOrEqual(x! + width!)
    expect(cy + r).toBeLessThanOrEqual(y! + height!)
  })

  it('widens the image so a flag never lies outside it', () => {
    const plain = draw([entity('A', 0, 0)])
    const flagged = draw([entity('A', 0, 0, { important: true })])
    expect(flagged.width).toBeGreaterThan(plain.width)
  })

  it('draws the grade and the flag badges of the same entity apart', () => {
    const both = entity('A', 0, 0, { important: true, confidence: { reliability: 'B', credibility: 2 } })
    const { doc } = draw([both])
    const flag = doc.querySelector('[data-flag] circle')!
    const grade = doc.querySelector(`[data-entity="${both.id}"] rect`)!
    expect(Number(grade.getAttribute('x'))).toBeGreaterThan(Number(flag.getAttribute('cx')) + 8)
  })

  it('cuts a long entity label to 23 characters and an ellipsis', () => {
    const { doc } = draw([entity('Société anonyme des transports réunis', 0, 0)])
    expect(texts(doc)).toContain('Société anonyme des tra…')
    expect(texts(doc)).not.toContain('Société anonyme des transports réunis')
  })

  it('draws a directed hypothetical relation dashed with an arrow', () => {
    const a = entity('A', 0, 0)
    const b = entity('B', 300, 0)
    const r = relation(a, b, 'connaît', { directed: true, status: 'hypothesis' })
    const { doc } = draw([a, b], [r])
    const line = doc.querySelector(`[data-relation="${r.id}"] line`)
    expect(line?.getAttribute('stroke-dasharray')).toBeTruthy()
    expect(line?.getAttribute('marker-end')).toBe('url(#arrow)')
  })

  it('draws an undirected verified relation solid and arrowless', () => {
    const a = entity('A', 0, 0)
    const b = entity('B', 300, 0)
    const r = relation(a, b, 'connaît')
    const { doc } = draw([a, b], [r])
    const line = doc.querySelector(`[data-relation="${r.id}"] line`)
    expect(line?.getAttribute('stroke-dasharray')).toBeNull()
    expect(line?.getAttribute('marker-end')).toBeNull()
  })

  it('writes the grade after the relation label, or alone', () => {
    const a = entity('A', 0, 0)
    const b = entity('B', 300, 0)
    const c = entity('C', 600, 0)
    const graded = relation(a, b, 'connaît', { confidence: { reliability: 'C', credibility: 3 } })
    const bare = relation(b, c, '', { confidence: { reliability: 'A', credibility: 1 } })
    const { doc } = draw([a, b, c], [graded, bare])
    expect(texts(doc)).toContain('connaît · C3')
    expect(texts(doc)).toContain('A1')
  })

  it('draws no label for a relation without label nor grade', () => {
    const a = entity('A', 0, 0)
    const b = entity('B', 300, 0)
    const r = relation(a, b, '')
    const { doc } = draw([a, b], [r])
    expect(doc.querySelectorAll(`[data-relation="${r.id}"] text`)).toHaveLength(0)
    expect(doc.querySelectorAll(`[data-relation="${r.id}"] rect`)).toHaveLength(0)
  })

  it('cuts a long relation label to 27 characters and an ellipsis', () => {
    const a = entity('A', 0, 0)
    const b = entity('B', 300, 0)
    const { doc } = draw([a, b], [relation(a, b, 'a'.repeat(40))])
    expect(texts(doc)).toContain(`${'a'.repeat(27)}…`)
  })

  it('keeps every entity inside the viewBox with a margin of at least 32px', () => {
    const entities = [
      entity('A', -500, -300),
      entity('B', 900, 700, { confidence: { reliability: 'A', credibility: 1 } }),
    ]
    const { doc, width, height } = draw(entities)
    const [x, y, w, h] = doc.documentElement.getAttribute('viewBox')!.split(' ').map(Number) as [
      number,
      number,
      number,
      number,
    ]
    expect([w, h]).toEqual([width, height])
    for (const circle of Array.from(doc.querySelectorAll('circle'))) {
      const cx = Number(circle.getAttribute('cx'))
      const cy = Number(circle.getAttribute('cy'))
      expect(cx - 24 - x).toBeGreaterThanOrEqual(32)
      expect(cy - 24 - y).toBeGreaterThanOrEqual(32)
      expect(x + w - (cx + 24)).toBeGreaterThanOrEqual(32)
      expect(y + h - (cy + 24)).toBeGreaterThanOrEqual(32)
    }
  })

  it('lays circles and links out with the same geometry as the canvas', () => {
    const a = entity('A', 0, 0)
    const b = entity('B', 320, 160)
    const r = relation(a, b, '')
    const { doc } = draw([a, b], [r])
    const centerA = circleCenter(a.position)
    const circle = doc.querySelector(`[data-entity="${a.id}"] circle`)
    expect([circle?.getAttribute('cx'), circle?.getAttribute('cy')]).toEqual([
      String(centerA.x),
      String(centerA.y),
    ])
    const { from, to } = edgeSegment(centerA, circleCenter(b.position))
    const line = doc.querySelector(`[data-relation="${r.id}"] line`)
    expect(Number(line?.getAttribute('x1'))).toBeCloseTo(from.x)
    expect(Number(line?.getAttribute('y2'))).toBeCloseTo(to.y)
  })

  it('ignores a relation whose entity is missing', () => {
    const a = entity('A', 0, 0)
    const ghost = entity('G', 300, 0)
    const { doc } = draw([a], [relation(a, ghost, 'x')])
    expect(doc.querySelectorAll('line')).toHaveLength(0)
  })

  describe('self-contained vector output', () => {
    it('escapes a hostile label as text', () => {
      const { svg, doc } = draw([entity('<script>x()</script>', 0, 0)])
      expect(doc.querySelector('script')).toBeNull()
      expect(texts(doc)).toContain('<script>x()</script>')
      expect(svg).not.toContain('<script')
    })

    it('has no embedded HTML, raster image, external reference or event handler', () => {
      const a = entity('A', 0, 0, { confidence: { reliability: 'A', credibility: 1 } })
      const b = entity('B', 300, 0)
      const { svg, doc } = draw([a, b], [relation(a, b, 'x', { directed: true })])
      expect(svg).not.toMatch(/foreignObject/i)
      expect(doc.querySelector('image')).toBeNull()
      expect(svg).not.toMatch(/\b(?:xlink:)?href\b/)
      expect(svg).not.toMatch(/\bsrc\s*=/)
      expect(svg.match(/url\([^)]*\)/g)?.every((ref) => ref.startsWith('url(#'))).toBe(true)
      const attributes = Array.from(doc.querySelectorAll('*')).flatMap((el) => el.getAttributeNames())
      expect(attributes.some((name) => /^on/i.test(name))).toBe(false)
    })
  })
})
