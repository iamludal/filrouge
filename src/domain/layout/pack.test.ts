import { orphanGrid, packComponents } from '@/domain/layout/pack'
import { placeAndSnap } from '@/domain/layout/place'
import { boundsOfCentres, LAYOUT_BOX, type Bounds, type Positions } from '@/domain/layout/types'

const disjoint = (a: Bounds, b: Bounds) =>
  a.maxX <= b.minX || b.maxX <= a.minX || a.maxY <= b.minY || b.maxY <= a.minY
const boundsOf = (p: Positions, ids: string[]) => boundsOfCentres(ids.map((id) => p[id]!))

describe('packComponents', () => {
  const big = { a: { x: 0, y: 0 }, b: { x: 300, y: 0 }, c: { x: 600, y: 200 } }
  const small = { d: { x: -50, y: -50 }, e: { x: 150, y: -50 } }

  it('places groups and orphans without overlap', () => {
    const p = packComponents([big, small], ['f', 'g'])
    const boxes = [boundsOf(p, ['a', 'b', 'c']), boundsOf(p, ['d', 'e']), boundsOf(p, ['f', 'g'])]
    expect(disjoint(boxes[0]!, boxes[1]!)).toBe(true)
    expect(disjoint(boxes[0]!, boxes[2]!)).toBe(true)
    expect(disjoint(boxes[1]!, boxes[2]!)).toBe(true)
  })

  it('keeps the shape of each group', () => {
    const p = packComponents([big, small], [])
    expect(p.b!.x - p.a!.x).toBe(300)
    expect(p.c!.y - p.a!.y).toBe(200)
    expect(p.e!.x - p.d!.x).toBe(200)
  })

  it('puts the first group at the top left', () => {
    const p = packComponents([big, small], ['f'])
    const first = boundsOf(p, ['a', 'b', 'c'])
    expect(first.minX).toBe(0)
    expect(first.minY).toBe(0)
    for (const id of ['d', 'e', 'f']) {
      expect(p[id]!.x >= first.maxX || p[id]!.y >= first.maxY).toBe(true)
    }
  })

  it('wraps groups into rows', () => {
    const groups = Array.from({ length: 9 }, (_, i) => ({
      [`n${i}`]: { x: 0, y: 0 },
      [`m${i}`]: { x: 200, y: 0 },
    }))
    const p = packComponents(groups, [])
    const rows = new Set(Object.values(p).map((c) => c.y))
    expect(rows.size).toBeGreaterThan(1)
  })
})

describe('orphanGrid', () => {
  it('aligns entities on rows and columns without overlap', () => {
    const p = orphanGrid(['a', 'b', 'c', 'd', 'e'])
    expect(new Set(Object.values(p).map((c) => c.x)).size).toBe(3)
    expect(new Set(Object.values(p).map((c) => c.y)).size).toBe(2)
    expect(p.b!.x - p.a!.x).toBeGreaterThanOrEqual(LAYOUT_BOX.width)
    expect(p.d!.y - p.a!.y).toBeGreaterThanOrEqual(LAYOUT_BOX.height)
  })
})

describe('placeAndSnap', () => {
  it('centres the result on the anchor, within one grid step', () => {
    const p = placeAndSnap({ a: { x: 13, y: 7 }, b: { x: 513, y: 307 } }, { x: 1000, y: 500 })
    const corners = Object.values(p)
    const centre = {
      x: (Math.min(...corners.map((c) => c.x)) + Math.max(...corners.map((c) => c.x)) + LAYOUT_BOX.width) / 2,
      y:
        (Math.min(...corners.map((c) => c.y)) + Math.max(...corners.map((c) => c.y)) + LAYOUT_BOX.height) / 2,
    }
    expect(Math.abs(centre.x - 1000)).toBeLessThanOrEqual(16)
    expect(Math.abs(centre.y - 500)).toBeLessThanOrEqual(16)
  })

  it('returns slot corners on the 16px grid', () => {
    const p = placeAndSnap({ a: { x: 3.3, y: 9.9 }, b: { x: 251.7, y: -40.2 } }, { x: 77, y: 33 })
    for (const { x, y } of Object.values(p)) {
      expect(Math.abs(x % 16)).toBe(0)
      expect(Math.abs(y % 16)).toBe(0)
    }
  })

  it('turns box centres into slot corners', () => {
    // A single box centred on the anchor has its corner half a box up and left.
    expect(placeAndSnap({ a: { x: 0, y: 0 } }, { x: 72, y: 40 })).toEqual({ a: { x: 0, y: 0 } })
  })
})
