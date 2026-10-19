import { safeFilename } from '@/lib/download'

describe('safeFilename', () => {
  it('strips path separators and odd characters', () => {
    expect(safeFilename('../../etc/passwd', 'json')).toBe('etc-passwd.json')
    expect(safeFilename('Opération été 2026', 'json')).toBe('Opération-été-2026.json')
    expect(safeFilename('   ', 'json')).toBe('enquete.json')
  })
})
