import { createEntity, createRelation } from '@/domain/factories'
import { buildLayoutInput } from '@/domain/layout/layout-scope'
import type { Entity } from '@/domain/schemas'

const inv = crypto.randomUUID()

/** Entities created one second apart, in the given order. */
function entities(...labels: string[]): Record<string, Entity> {
  return Object.fromEntries(
    labels.map((label, i) => {
      const entity = createEntity(inv, 'person', { x: i * 160, y: 0 }, label)
      return [label, { ...entity, createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, i)).toISOString() }]
    }),
  )
}

const link = (from: Entity, to: Entity) => createRelation(inv, from.id, to.id, '')

describe('buildLayoutInput scope', () => {
  const e = entities('a', 'b', 'c', 'd')
  const [a, b, c, d] = [e.a!, e.b!, e.c!, e.d!]
  const relations = [link(a, b), link(b, c), link(c, d)]
  const all = Object.values(e)

  it('lays out the whole graph with nothing selected', () => {
    const input = buildLayoutInput(all, relations, [], 'organic')
    expect(input.nodes.map((n) => n.id)).toEqual([a.id, b.id, c.id, d.id])
    expect(input.edges).toHaveLength(3)
  })

  it('lays out the whole graph with one entity selected', () => {
    expect(buildLayoutInput(all, relations, [b.id], 'hierarchical').nodes).toHaveLength(4)
  })

  it('lays out only the selection and the relations between selected entities', () => {
    const input = buildLayoutInput(all, relations, [a.id, b.id, c.id], 'organic')
    expect(input.nodes.map((n) => n.id)).toEqual([a.id, b.id, c.id])
    expect(input.edges.map((r) => r.id)).toEqual([relations[0]!.id, relations[1]!.id])
  })

  it('ignores unknown selected ids', () => {
    expect(buildLayoutInput(all, relations, [a.id, 'gone'], 'organic').nodes).toHaveLength(4)
  })

  it('anchors the result on the centre of the box around the laid-out entities', () => {
    // a at x 0, b at x 160: box from 0 to 160 + 144, from 0 to 80.
    expect(buildLayoutInput(all, relations, [a.id, b.id], 'organic').anchor).toEqual({ x: 152, y: 40 })
  })
})

describe('buildLayoutInput radial centre', () => {
  it('is the selected entity when exactly one is selected', () => {
    const e = entities('a', 'b', 'c')
    const input = buildLayoutInput(Object.values(e), [link(e.a!, e.b!)], [e.c!.id], 'radial')
    expect(input.centerId).toBe(e.c!.id)
  })

  it('is the important entity with the most relations, even with fewer than another', () => {
    const e = entities('h', 'i', 'x', 'y', 'z', 'w')
    const [h, i] = [{ ...e.h! }, { ...e.i!, important: true }]
    const relations = [link(h, e.x!), link(h, e.y!), link(h, e.z!), link(h, e.w!), link(i, e.x!)]
    const input = buildLayoutInput([h, i, e.x!, e.y!, e.z!, e.w!], relations, [], 'radial')
    expect(input.centerId).toBe(i.id)
  })

  it('is the entity with the most relations when none is important', () => {
    const e = entities('a', 'h', 'x', 'y')
    const relations = [link(e.h!, e.x!), link(e.h!, e.y!), link(e.a!, e.x!)]
    expect(buildLayoutInput(Object.values(e), relations, [], 'radial').centerId).toBe(e.h!.id)
  })

  it('goes to the oldest entity on a tie', () => {
    const e = entities('a', 'b')
    const input = buildLayoutInput([e.b!, e.a!], [link(e.a!, e.b!)], [], 'radial')
    expect(input.centerId).toBe(e.a!.id)
  })

  it('counts only relations between selected entities for a selection', () => {
    const e = entities('a', 'b', 'c', 'x', 'y')
    const relations = [link(e.a!, e.x!), link(e.a!, e.y!), link(e.b!, e.a!), link(e.b!, e.c!)]
    const input = buildLayoutInput(Object.values(e), relations, [e.a!.id, e.b!.id, e.c!.id], 'radial')
    expect(input.centerId).toBe(e.b!.id)
  })
})
