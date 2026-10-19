import {
  SOURCE_ERRORS,
  fromLocalInput,
  isHttpUrl,
  sourceDisplayName,
  toLocalInput,
  validateSourceForm,
} from '@/domain/sources'

const valid = { title: 'T', url: '', archiveUrl: '', capturedAt: '2026-03-03T14:05', note: '' }

describe('sourceDisplayName', () => {
  it('prefers the title, then the URL host, then a placeholder', () => {
    expect(sourceDisplayName({ title: 'Profil', url: 'https://exemple.fr/p' })).toBe('Profil')
    expect(sourceDisplayName({ title: '  ', url: 'https://exemple.fr/page' })).toBe('exemple.fr')
    expect(sourceDisplayName({})).toBe('Source sans titre')
  })
})

describe('isHttpUrl', () => {
  it('accepts http(s) only, within the length limit', () => {
    expect(isHttpUrl('https://web.archive.org/web/2026/https://exemple.fr')).toBe(true)
    expect(isHttpUrl('http://exemple.fr')).toBe(true)
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpUrl('data:text/html,x')).toBe(false)
    expect(isHttpUrl('exemple.fr')).toBe(false)
    expect(isHttpUrl(`https://exemple.fr/${'a'.repeat(2048)}`)).toBe(false)
  })
})

describe('capture date', () => {
  it('converts local input to UTC and back, to the minute', () => {
    const iso = fromLocalInput('2026-03-03T14:05')!
    expect(iso).toBe(new Date(2026, 2, 3, 14, 5).toISOString())
    expect(toLocalInput(iso)).toBe('2026-03-03T14:05')
  })

  it('rejects malformed input', () => {
    expect(fromLocalInput('')).toBeNull()
    expect(fromLocalInput('03/03/2026')).toBeNull()
    expect(fromLocalInput('2026-13-45T99:99')).toBeNull()
  })
})

describe('validateSourceForm', () => {
  it('accepts a source with a title, a URL or a screenshot', () => {
    expect(validateSourceForm(valid, false)).toEqual({})
    expect(validateSourceForm({ ...valid, title: '', url: 'https://exemple.fr' }, false)).toEqual({})
    expect(validateSourceForm({ ...valid, title: '' }, true)).toEqual({})
  })

  it('refuses an empty source', () => {
    expect(validateSourceForm({ ...valid, title: '  ' }, false)).toEqual({ form: SOURCE_ERRORS.empty })
  })

  it('flags non-http URLs and archive links', () => {
    expect(validateSourceForm({ ...valid, url: 'javascript:alert(1)' }, false).url).toBe(
      'URL invalide (http ou https)',
    )
    expect(validateSourceForm({ ...valid, archiveUrl: 'ftp://x' }, false).archiveUrl).toBe(
      'URL invalide (http ou https)',
    )
  })

  it('flags an invalid capture date', () => {
    expect(validateSourceForm({ ...valid, capturedAt: '' }, false).capturedAt).toBe(SOURCE_ERRORS.date)
  })
})
