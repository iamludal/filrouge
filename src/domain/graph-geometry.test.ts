import { circleCenter, edgeSegment, NODE_WIDTH } from '@/domain/graph-geometry'

describe('circleCenter', () => {
  it('centres the circle horizontally at the top of the node', () => {
    expect(circleCenter({ x: 100, y: 50 })).toEqual({ x: 100 + NODE_WIDTH / 2, y: 74 })
  })
})

describe('edgeSegment', () => {
  it('stops outside both circles on a horizontal link', () => {
    const { from, to, middle } = edgeSegment({ x: 0, y: 0 }, { x: 200, y: 0 })
    expect(from).toEqual({ x: 26, y: 0 })
    expect(to).toEqual({ x: 172, y: 0 })
    expect(middle).toEqual({ x: 99, y: 0 })
  })

  it('follows a diagonal link', () => {
    const { from, to } = edgeSegment({ x: 0, y: 0 }, { x: 300, y: 400 })
    expect(from.x).toBeCloseTo(26 * 0.6)
    expect(from.y).toBeCloseTo(26 * 0.8)
    expect(to.x).toBeCloseTo(300 - 28 * 0.6)
    expect(to.y).toBeCloseTo(400 - 28 * 0.8)
  })

  it('does not produce NaN for coincident centres', () => {
    const { from, to } = edgeSegment({ x: 5, y: 5 }, { x: 5, y: 5 })
    expect(Number.isFinite(from.x + from.y + to.x + to.y)).toBe(true)
  })
})
