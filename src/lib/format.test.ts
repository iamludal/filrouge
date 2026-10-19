import { formatBytes } from '@/lib/format'

describe('formatBytes', () => {
  it('uses French units', () => {
    expect(formatBytes(512)).toBe('512 o')
    expect(formatBytes(2048)).toBe('2 Ko')
    expect(formatBytes(8 * 1024 * 1024)).toBe('8 Mo')
    expect(formatBytes(3.4 * 1024 * 1024)).toBe('3,4 Mo')
  })
})
