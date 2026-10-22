import { radialLayout } from '@/domain/layout/radial'
import { LAYOUT_BOX, type Positions } from '@/domain/layout/types'

const edge = (from: string, to: string) => ({ id: `${from}-${to}`, from, to })
const distance = (p: Positions, a: string, b: string) => Math.hypot(p[a]!.x - p[b]!.x, p[a]!.y - p[b]!.y)

function overlapping(p: Positions): [string, string][] {
  const ids = Object.keys(p)
  const pairs: [string, string][] = []
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++) {
      const [a, b] = [p[ids[i]!]!, p[ids[j]!]!]
      if (Math.abs(a.x - b.x) < LAYOUT_BOX.width && Math.abs(a.y - b.y) < LAYOUT_BOX.height)
        pairs.push([ids[i]!, ids[j]!])
    }
  return pairs
}

describe('radialLayout', () => {
  it('puts entities on rings by number of hops from the centre', () => {
    const p = radialLayout('c', {
      nodeIds: ['c', 'a', 'b', 'd'],
      edges: [edge('c', 'a'), edge('c', 'b'), edge('a', 'd')],
    })
    expect(p.c).toEqual({ x: 0, y: 0 })
    expect(distance(p, 'c', 'a')).toBeCloseTo(distance(p, 'c', 'b'))
    expect(distance(p, 'c', 'd')).toBeGreaterThan(distance(p, 'c', 'a'))
  })

  it('keeps entities reached through the same entity next to each other', () => {
    const p = radialLayout('c', {
      nodeIds: ['c', 'a', 'b', 'a1', 'a2', 'b1', 'b2'],
      edges: [
        edge('c', 'a'),
        edge('c', 'b'),
        edge('a', 'a1'),
        edge('a', 'a2'),
        edge('b', 'b1'),
        edge('b', 'b2'),
      ],
    })
    const turn = (id: string) => (Math.atan2(p[id]!.y, p[id]!.x) + 2 * Math.PI) % (2 * Math.PI)
    const outer = ['a1', 'a2', 'b1', 'b2'].sort((x, y) => turn(x) - turn(y))
    const index = (id: string) => outer.indexOf(id)
    const adjacent = (x: string, y: string) => [1, 3].includes(Math.abs(index(x) - index(y)))
    expect(adjacent('a1', 'a2')).toBe(true)
    expect(adjacent('b1', 'b2')).toBe(true)
  })

  it('leaves no overlap on a crowded ring', () => {
    const leaves = Array.from({ length: 20 }, (_, i) => `n${i}`)
    const p = radialLayout('c', { nodeIds: ['c', ...leaves], edges: leaves.map((id) => edge('c', id)) })
    expect(overlapping(p)).toEqual([])
  })

  it('leaves no overlap with uneven branches', () => {
    const big = Array.from({ length: 15 }, (_, i) => `b${i}`)
    const p = radialLayout('c', {
      nodeIds: ['c', 'a', 'b', 'x', ...big],
      edges: [edge('c', 'a'), edge('c', 'b'), edge('c', 'x'), ...big.map((id) => edge('b', id))],
    })
    expect(overlapping(p)).toEqual([])
  })

  it('handles cycles through the breadth-first tree', () => {
    const p = radialLayout('a', {
      nodeIds: ['a', 'b', 'c'],
      edges: [edge('a', 'b'), edge('b', 'c'), edge('c', 'a')],
    })
    expect(Object.keys(p).sort()).toEqual(['a', 'b', 'c'])
    expect(overlapping(p)).toEqual([])
  })

  it('gives the same result for the same input', () => {
    const group = { nodeIds: ['c', 'a', 'b', 'd'], edges: [edge('c', 'a'), edge('b', 'c'), edge('a', 'd')] }
    expect(radialLayout('c', group)).toEqual(radialLayout('c', group))
  })
})
