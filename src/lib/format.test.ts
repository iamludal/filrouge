import { formatBytes, formatDate, formatDateTime, formatDateTimeFull, truncate } from '@/lib/format'

describe('formatBytes', () => {
  it('uses French units', () => {
    expect(formatBytes(512)).toBe('512 o')
    expect(formatBytes(2048)).toBe('2 Ko')
    expect(formatBytes(8 * 1024 * 1024)).toBe('8 Mo')
    expect(formatBytes(3.4 * 1024 * 1024)).toBe('3,4 Mo')
  })
})

describe('truncate', () => {
  it('keeps text up to the limit', () => {
    expect(truncate('abc', 5)).toBe('abc')
    expect(truncate('abcde', 5)).toBe('abcde')
  })

  it('cuts longer text to max characters including the ellipsis', () => {
    expect(truncate('abcdef', 5)).toBe('abcd…')
  })

  it('never splits an emoji', () => {
    expect(truncate('ab😀cd', 4)).toBe('ab😀…')
    expect(truncate('😀😀😀😀', 3)).toBe('😀😀…')
  })

  it('keeps accented letters whole', () => {
    expect(truncate('Société anonyme', 8)).toBe('Société…')
  })
})

describe('date formats', () => {
  const iso = '2026-10-20T12:32:05.000Z'
  const date = new Date(iso)

  it('formats a short French date', () => {
    const expected = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date)
    expect(formatDate(iso)).toBe(expected)
  })

  it('formats a short French date and time', () => {
    const expected = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(
      date,
    )
    expect(formatDateTime(iso)).toBe(expected)
  })

  it('formats the full date with seconds', () => {
    const expected = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'medium' }).format(date)
    expect(formatDateTimeFull(iso)).toBe(expected)
    expect(formatDateTimeFull(iso)).toMatch(/octobre 2026/)
    expect(formatDateTimeFull(iso)).toMatch(/:05$/)
  })
})
