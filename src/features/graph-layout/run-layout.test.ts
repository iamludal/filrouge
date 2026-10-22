import ELK from 'elkjs/lib/elk.bundled.js'
import type { LayoutAlgorithm, LayoutInput, Positions } from '@/domain/layout/types'
import { LAYOUT_BOX } from '@/domain/layout/types'
import { runLayout } from '@/features/graph-layout/run-layout'

const elk = new ELK()

function input(
  algorithm: LayoutAlgorithm,
  ids: string[],
  links: [string, string][],
  centerId?: string,
): LayoutInput {
  return {
    algorithm,
    nodes: ids.map((id, i) => ({
      id,
      important: false,
      createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, i)).toISOString(),
    })),
    edges: links.map(([from, to]) => ({ id: `${from}-${to}`, from, to })),
    centerId,
    anchor: { x: 0, y: 0 },
  }
}

/** Pairs of entities whose circles (48px, centred at the top of the slot) overlap. */
function overlappingCircles(p: Positions): number {
  const ids = Object.keys(p)
  let count = 0
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++)
      if (Math.hypot(p[ids[i]!]!.x - p[ids[j]!]!.x, p[ids[i]!]!.y - p[ids[j]!]!.y) < 48) count++
  return count
}

/** Pairs of entities whose layout boxes overlap. */
function overlappingBoxes(p: Positions): number {
  const ids = Object.keys(p)
  let count = 0
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++) {
      const [a, b] = [p[ids[i]!]!, p[ids[j]!]!]
      if (Math.abs(a.x - b.x) < LAYOUT_BOX.width && Math.abs(a.y - b.y) < LAYOUT_BOX.height) count++
    }
  return count
}

const distance = (p: Positions, a: string, b: string) => Math.hypot(p[a]!.x - p[b]!.x, p[a]!.y - p[b]!.y)

// A star of 19 leaves around n0, and a chain of 10 hooked to one of the leaves.
const thirty = Array.from({ length: 30 }, (_, i) => `n${i}`)
const thirtyLinks: [string, string][] = [
  ...Array.from({ length: 19 }, (_, i): [string, string] => ['n0', `n${i + 1}`]),
  ...Array.from({ length: 9 }, (_, i): [string, string] => [`n${i + 20}`, `n${i + 21}`]),
  ['n5', 'n20'],
]

describe('runLayout', () => {
  it('lays out every entity on the grid', async () => {
    const p = await runLayout(
      input(
        'organic',
        ['a', 'b', 'c', 'd'],
        [
          ['a', 'b'],
          ['b', 'c'],
        ],
      ),
      elk,
    )
    expect(Object.keys(p).sort()).toEqual(['a', 'b', 'c', 'd'])
    for (const { x, y } of Object.values(p)) {
      expect(Math.abs(x % 16)).toBe(0)
      expect(Math.abs(y % 16)).toBe(0)
    }
  })

  it('organic: keeps linked entities close together', async () => {
    const p = await runLayout(
      input(
        'organic',
        ['a', 'b', 'c', 'd'],
        [
          ['a', 'b'],
          ['c', 'd'],
        ],
      ),
      elk,
    )
    expect(distance(p, 'a', 'b')).toBeLessThan(Math.min(distance(p, 'a', 'c'), distance(p, 'a', 'd')))
    expect(distance(p, 'c', 'd')).toBeLessThan(Math.min(distance(p, 'c', 'a'), distance(p, 'c', 'b')))
  })

  it('organic: leaves no overlap on 30 linked entities', async () => {
    const p = await runLayout(input('organic', thirty, thirtyLinks), elk)
    expect(overlappingBoxes(p)).toBe(0)
  })

  it('organic: leaves no overlap on 30 entities without relations', async () => {
    const p = await runLayout(input('organic', thirty, []), elk)
    expect(overlappingBoxes(p)).toBe(0)
  })

  it('hierarchical: a directed chain goes from top to bottom', async () => {
    const p = await runLayout(
      input(
        'hierarchical',
        ['a', 'b', 'c'],
        [
          ['a', 'b'],
          ['b', 'c'],
        ],
      ),
      elk,
    )
    expect(p.a!.y).toBeLessThan(p.b!.y)
    expect(p.b!.y).toBeLessThan(p.c!.y)
  })

  it('hierarchical: a relation goes from its first entity to its second', async () => {
    const p = await runLayout(input('hierarchical', ['a', 'b'], [['a', 'b']]), elk)
    expect(p.a!.y).toBeLessThan(p.b!.y)
  })

  it('hierarchical: lays out a cycle on several layers without overlap', async () => {
    const p = await runLayout(
      input(
        'hierarchical',
        ['a', 'b', 'c'],
        [
          ['a', 'b'],
          ['b', 'c'],
          ['c', 'a'],
        ],
      ),
      elk,
    )
    expect(new Set([p.a!.y, p.b!.y, p.c!.y]).size).toBeGreaterThanOrEqual(2)
    expect(overlappingBoxes(p)).toBe(0)
  })

  it('hierarchical: leaves no overlap on 30 entities', async () => {
    expect(overlappingBoxes(await runLayout(input('hierarchical', thirty, thirtyLinks), elk))).toBe(0)
  })

  it('radial: puts the centre in the middle of its rings', async () => {
    const p = await runLayout(
      input(
        'radial',
        ['a', 'c', 'b', 'd'],
        [
          ['c', 'a'],
          ['c', 'b'],
          ['a', 'd'],
        ],
        'c',
      ),
      elk,
    )
    expect(distance(p, 'c', 'a')).toBeCloseTo(distance(p, 'c', 'b'), -1)
    expect(distance(p, 'c', 'd')).toBeGreaterThan(distance(p, 'c', 'a'))
  })

  it('radial: places another group beside, not on the rings', async () => {
    const p = await runLayout(
      input(
        'radial',
        ['c', 'a', 'd', 'e'],
        [
          ['c', 'a'],
          ['d', 'e'],
        ],
        'c',
      ),
      elk,
    )
    const ring = distance(p, 'c', 'a')
    expect(Math.abs(distance(p, 'c', 'd') - ring) > 16 || Math.abs(distance(p, 'c', 'e') - ring) > 16).toBe(
      true,
    )
    expect(overlappingBoxes(p)).toBe(0)
  })

  it('places groups and orphans without overlapping circles', async () => {
    for (const algorithm of ['organic', 'hierarchical', 'radial'] as const) {
      const p = await runLayout(
        input(
          algorithm,
          ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
          [
            ['a', 'b'],
            ['b', 'c'],
            ['d', 'e'],
          ],
          'a',
        ),
        elk,
      )
      expect(overlappingCircles(p)).toBe(0)
      expect(overlappingBoxes(p)).toBe(0)
    }
  })

  it('gives the same result for the same input', async () => {
    for (const algorithm of ['organic', 'hierarchical', 'radial'] as const) {
      const run = () => runLayout(input(algorithm, thirty, thirtyLinks, 'n0'), elk)
      expect(await run()).toEqual(await run())
    }
  })

  it('centres the result on the anchor', async () => {
    const p = await runLayout(
      { ...input('organic', ['a', 'b'], [['a', 'b']]), anchor: { x: 1000, y: 1000 } },
      elk,
    )
    const xs = Object.values(p).map((c) => c.x)
    const ys = Object.values(p).map((c) => c.y)
    expect(Math.abs((Math.min(...xs) + Math.max(...xs) + LAYOUT_BOX.width) / 2 - 1000)).toBeLessThanOrEqual(
      16,
    )
    expect(Math.abs((Math.min(...ys) + Math.max(...ys) + LAYOUT_BOX.height) / 2 - 1000)).toBeLessThanOrEqual(
      16,
    )
  })
})
