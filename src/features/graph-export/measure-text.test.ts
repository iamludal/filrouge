import { estimateTextWidth, measureText } from '@/features/graph-export/measure-text'

describe('measureText', () => {
  it('falls back to the estimate when there is no canvas (jsdom)', () => {
    const font = '500 12px sans-serif'
    expect(measureText('abcd', font)).toBe(estimateTextWidth('abcd', font))
    expect(estimateTextWidth('abcd', font)).toBeCloseTo(4 * 12 * 0.6)
  })

  it('counts code points, not UTF-16 units', () => {
    expect(estimateTextWidth('😀', '10px x')).toBeCloseTo(6)
  })
})
