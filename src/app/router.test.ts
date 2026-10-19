import { parseRoute, routeHref } from '@/app/router'

describe('router', () => {
  it('parses investigation routes and falls back to home', () => {
    const id = crypto.randomUUID()
    expect(parseRoute(`#/i/${id}`)).toEqual({ name: 'investigation', id })
    expect(parseRoute('')).toEqual({ name: 'home' })
    expect(parseRoute('#/i/<script>')).toEqual({ name: 'home' })
    expect(routeHref({ name: 'investigation', id })).toBe(`#/i/${id}`)
  })
})
