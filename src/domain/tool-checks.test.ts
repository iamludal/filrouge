import { withToolCheck } from '@/domain/tool-checks'

const yesterday = '2026-10-19T10:00:00.000Z'
const today = '2026-10-20T10:00:00.000Z'

describe('withToolCheck', () => {
  it('adds a check to an entity that has none', () => {
    expect(withToolCheck(undefined, 'crtsh', true, today)).toEqual([{ toolId: 'crtsh', checkedAt: today }])
  })

  it('keeps the other checks, in order', () => {
    const checks = [
      { toolId: 'shodan', checkedAt: yesterday },
      { toolId: 'holehe', checkedAt: yesterday },
    ]
    expect(withToolCheck(checks, 'crtsh', true, today)).toEqual([
      ...checks,
      { toolId: 'crtsh', checkedAt: today },
    ])
  })

  it('replaces the date of a tool checked again, without duplicating it', () => {
    const checks = [
      { toolId: 'crtsh', checkedAt: yesterday },
      { toolId: 'shodan', checkedAt: yesterday },
    ]
    expect(withToolCheck(checks, 'crtsh', true, today)).toEqual([
      { toolId: 'crtsh', checkedAt: today },
      { toolId: 'shodan', checkedAt: yesterday },
    ])
  })

  it('removes a check and leaves the others untouched', () => {
    const checks = [
      { toolId: 'crtsh', checkedAt: yesterday },
      { toolId: 'shodan', checkedAt: yesterday },
    ]
    expect(withToolCheck(checks, 'crtsh', false, today)).toEqual([{ toolId: 'shodan', checkedAt: yesterday }])
  })

  it('returns undefined when the last check is removed', () => {
    expect(withToolCheck([{ toolId: 'crtsh', checkedAt: yesterday }], 'crtsh', false, today)).toBeUndefined()
  })

  it('returns undefined when unchecking a tool that was never checked', () => {
    expect(withToolCheck(undefined, 'crtsh', false, today)).toBeUndefined()
  })

  it('does not mutate its input', () => {
    const checks = [{ toolId: 'crtsh', checkedAt: yesterday }]
    withToolCheck(checks, 'crtsh', true, today)
    withToolCheck(checks, 'crtsh', false, today)
    expect(checks).toEqual([{ toolId: 'crtsh', checkedAt: yesterday }])
  })
})
