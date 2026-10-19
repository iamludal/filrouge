import { createRelation } from '@/domain/factories'
import { findDuplicateSource, normalizeTags, orphanedRelationIds } from '@/domain/graph'

describe('orphanedRelationIds', () => {
  it('returns relations touching a removed entity, on either end', () => {
    const inv = crypto.randomUUID()
    const [a, b, c] = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()]
    const ab = createRelation(inv, a, b, 'x')
    const bc = createRelation(inv, b, c, 'y')
    const ca = createRelation(inv, c, a, 'z')
    expect(orphanedRelationIds([ab, bc, ca], [a]).sort()).toEqual([ab.id, ca.id].sort())
    expect(orphanedRelationIds([ab, bc, ca], [])).toEqual([])
  })
})

describe('normalizeTags', () => {
  it('trims, drops empties and de-duplicates case-insensitively', () => {
    expect(normalizeTags([' suspect ', '', 'Suspect', 'paris', '  '])).toEqual(['suspect', 'paris'])
  })
})

describe('findDuplicateSource', () => {
  const base = { investigationId: crypto.randomUUID(), capturedAt: new Date().toISOString() }
  const stored = { ...base, id: crypto.randomUUID(), title: 'Profil LinkedIn', sha256: 'a'.repeat(64) }
  const optimized = {
    ...base,
    id: crypto.randomUUID(),
    sha256: 'b'.repeat(64),
    originalSha256: 'c'.repeat(64),
  }

  it('finds the same file, or the original of an optimized one', () => {
    expect(findDuplicateSource([stored, optimized], 'a'.repeat(64))).toBe(stored)
    expect(findDuplicateSource([stored, optimized], 'c'.repeat(64))).toBe(optimized)
  })

  it('ignores the source being edited and files differing by a single byte', () => {
    expect(findDuplicateSource([stored], 'a'.repeat(64), stored.id)).toBeUndefined()
    expect(findDuplicateSource([stored, optimized], 'd'.repeat(64))).toBeUndefined()
  })
})
