import {
  DEFAULT_DISPLAY,
  displayOptionsSchema,
  isDefaultDisplay,
  resetMenuOptions,
} from '@/domain/display-options'

describe('display options', () => {
  it('shows everything by default', () => {
    expect(displayOptionsSchema.parse({})).toEqual(DEFAULT_DISPLAY)
    expect(isDefaultDisplay(DEFAULT_DISPLAY)).toBe(true)
  })

  it('keeps the stored fields and defaults the missing ones', () => {
    expect(displayOptionsSchema.parse({ ratings: false })).toEqual({ ...DEFAULT_DISPLAY, ratings: false })
  })

  it('falls back to shown on an invalid field', () => {
    expect(displayOptionsSchema.parse({ ratings: 'no', minimap: false })).toEqual({
      ...DEFAULT_DISPLAY,
      minimap: false,
    })
  })

  it('rejects a value that is not an object', () => {
    expect(displayOptionsSchema.safeParse('x').success).toBe(false)
    expect(displayOptionsSchema.safeParse(null).success).toBe(false)
  })

  it('detects a changed display', () => {
    expect(isDefaultDisplay({ ...DEFAULT_DISPLAY, entityLabels: false })).toBe(false)
  })

  it('does not count the mini-map as a change, nor reset it', () => {
    const hidden = { ...DEFAULT_DISPLAY, minimap: false }
    expect(isDefaultDisplay(hidden)).toBe(true)
    expect(resetMenuOptions({ ...hidden, ratings: false })).toEqual(hidden)
  })
})
