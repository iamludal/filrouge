import { fr } from '@/i18n/messages/fr'
import { createFormatters, truncate } from '@/lib/format'

// The English byte units are supplied by the English dictionary, added with the language itself.
const EN_UNITS = { byte: 'B', kilobyte: 'KB', megabyte: 'MB' }
const french = createFormatters('fr', fr.common.units)
const english = createFormatters('en', EN_UNITS)

describe('formatBytes', () => {
  it('uses French units', () => {
    expect(french.formatBytes(512)).toBe('512 o')
    expect(french.formatBytes(2048)).toBe('2 Ko')
    expect(french.formatBytes(8 * 1024 * 1024)).toBe('8 Mo')
    expect(french.formatBytes(3.4 * 1024 * 1024)).toBe('3,4 Mo')
    expect(french.formatBytes(8.4 * 1024 * 1024)).toBe('8,4 Mo')
  })

  it('uses English units and separators', () => {
    expect(english.formatBytes(512)).toBe('512 B')
    expect(english.formatBytes(2048)).toBe('2 KB')
    expect(english.formatBytes(8.4 * 1024 * 1024)).toBe('8.4 MB')
    expect(english.formatBytes(40 * 1024 * 1024)).toBe('40 MB')
  })
})

describe('formatNumber', () => {
  it('groups digits per language', () => {
    expect(french.formatNumber(1234.5)).toBe(new Intl.NumberFormat('fr-FR').format(1234.5))
    expect(english.formatNumber(1234.5)).toBe('1,234.5')
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
    expect(french.formatDate(iso)).toBe(expected)
    expect(french.formatDate(iso)).toMatch(/oct\. 2026/)
  })

  it('formats a short French date and time', () => {
    const expected = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(
      date,
    )
    expect(french.formatDateTime(iso)).toBe(expected)
  })

  it('formats the full French date with seconds', () => {
    const expected = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'medium' }).format(date)
    expect(french.formatDateTimeFull(iso)).toBe(expected)
    expect(french.formatDateTimeFull(iso)).toMatch(/octobre 2026/)
    expect(french.formatDateTimeFull(iso)).toMatch(/:05$/)
  })

  it('formats English dates', () => {
    expect(english.formatDate(iso)).toMatch(/^Oct 20, 2026$/)
    expect(english.formatDateTime(iso)).toMatch(/^Oct 20, 2026, \d{1,2}:32\s[AP]M$/)
    expect(english.formatDateTimeFull(iso)).toMatch(/^October 20, 2026 at \d{1,2}:32:05\s[AP]M$/)
  })
})
