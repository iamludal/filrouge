import { createRelation } from '@/domain/factories'
import { normalizeTags, orphanedRelationIds } from '@/domain/graph'

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
