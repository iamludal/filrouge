import { formatBytes, truncate } from '@/lib/format'

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
