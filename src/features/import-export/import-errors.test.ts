import { fr } from '@/i18n/messages/fr'
import { formatImportError } from '@/features/import-export/import-errors'

describe('formatImportError', () => {
  it('words a coded error and prefixes its path', () => {
    expect(formatImportError(fr, { code: 'duplicateId', path: 'entities.3.id' })).toBe(
      'entities.3.id : Identifiant dupliqué',
    )
    expect(formatImportError(fr, { code: 'invalidJson' })).toBe(`Le fichier n'est pas un JSON valide`)
  })

  it('fills in the version and the count', () => {
    expect(formatImportError(fr, { code: 'newerVersion', value: 9 })).toBe(
      'Format v9 produit par une version plus récente de filrouge',
    )
    expect(formatImportError(fr, { code: 'more', value: 4 })).toBe('… et 4 autre(s) erreur(s)')
  })

  it('words the properties limit', () => {
    expect(formatImportError(fr, { code: 'tooManyProperties', value: 200 })).toBe('Au plus 200 propriétés')
  })

  it('keeps the validator message of a schema error', () => {
    expect(formatImportError(fr, { code: 'schema', path: 'format', value: 'Invalid input' })).toBe(
      'format : Invalid input',
    )
  })
})
