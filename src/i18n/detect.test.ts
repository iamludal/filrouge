import { afterEach, describe, expect, it, vi } from 'vitest'
import { detectLocale, LOCALE_STORAGE_KEY, resolveLocale, storeLocale } from './detect'

describe('resolveLocale', () => {
  it.each([
    [['fr-CA', 'en-US'], 'fr'],
    [['en-GB', 'fr-FR'], 'en'],
    [['de-DE', 'fr-FR'], 'fr'],
    [['es-ES'], 'en'],
    [[], 'en'],
    [['FR'], 'fr'],
  ])('picks from the browser languages %j -> %s', (languages, expected) => {
    expect(resolveLocale(null, languages)).toBe(expected)
  })

  it('lets a stored choice win over the browser', () => {
    expect(resolveLocale('en', ['fr-FR'])).toBe('en')
    expect(resolveLocale('fr', ['en-US'])).toBe('fr')
  })

  it('ignores an invalid stored value', () => {
    expect(resolveLocale('de', ['fr-FR'])).toBe('fr')
    expect(resolveLocale(42, [])).toBe('en')
  })
})

describe('detectLocale and storeLocale', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('reads the browser languages, then the stored choice', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-FR'])
    expect(detectLocale()).toBe('fr')
    storeLocale('en')
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en')
    expect(detectLocale()).toBe('en')
  })

  it('still detects the language when storage throws', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-FR'])
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(detectLocale()).toBe('fr')
    expect(() => storeLocale('en')).not.toThrow()
  })
})
