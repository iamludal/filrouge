import { createEntity, createRelation } from '@/domain/factories'
import {
  activeCriteriaCount,
  computeGraphView,
  EMPTY_FILTERS,
  entityHaystack,
  normalizeText,
  searchTerms,
  tagOptions,
  typeOptions,
  type GraphFilters,
} from '@/domain/graph-view'
import type { Confidence, Entity, Relation } from '@/domain/schemas'

const inv = crypto.randomUUID()

function entity(label: string, patch: Partial<Entity> = {}, x = 0, y = 0): Entity {
  return { ...createEntity(inv, 'person', { x, y }, label), ...patch }
}

function view(entities: Entity[], terms: string[], relations: Relation[] = []) {
  return computeGraphView(
    Object.fromEntries(entities.map((e) => [e.id, e])),
    Object.fromEntries(relations.map((r) => [r.id, r])),
    terms,
  )
}

const resultIds = (entities: Entity[], query: string, relations: Relation[] = []) =>
  view(entities, searchTerms(query), relations).results.map((ref) => ref.id)

describe('normalizeText / searchTerms', () => {
  it('ignores case and accents', () => {
    expect(normalizeText('Société GÉNÉRALE')).toBe('societe generale')
  })

  it('splits on whitespace and treats a blank query as no search', () => {
    expect(searchTerms('  Dupont   CIBLE ')).toEqual(['dupont', 'cible'])
    expect(searchTerms('   ')).toEqual([])
    expect(searchTerms('')).toEqual([])
  })
})

describe('searched fields', () => {
  it('searches property values, including numbers and booleans', () => {
    const jean = entity('Jean', {
      properties: { email: 'jdupont@example.org', age: 42, actif: true, vide: null },
    })
    expect(resultIds([jean], 'jdupont')).toEqual([jean.id])
    expect(resultIds([jean], '42')).toEqual([jean.id])
    expect(resultIds([jean], 'true')).toEqual([jean.id])
    expect(resultIds([jean], 'null')).toEqual([])
  })

  it('searches property keys, notes and tags', () => {
    const e = entity('X', { properties: { plateforme: 'x' }, notes: 'vu à Lyon en 2021', tags: ['suspect'] })
    expect(resultIds([e], 'plateforme')).toEqual([e.id])
    expect(resultIds([e], 'lyon')).toEqual([e.id])
    expect(resultIds([e], 'susp')).toEqual([e.id])
  })

  it('searches relation labels', () => {
    const a = entity('A')
    const b = entity('B')
    const rel = createRelation(inv, a.id, b.id, 'travaille pour')
    const v = view([a, b], searchTerms('travaille'), [rel])
    expect(v.results).toEqual([{ type: 'relation', id: rel.id }])
    expect(v.dimmedEntityIds).toEqual(new Set([a.id, b.id]))
  })

  it('does not search the type name', () => {
    expect(resultIds([entity('')], 'personne')).toEqual([])
  })
})

describe('matching rules', () => {
  it('ignores case and accents', () => {
    const e = entity('Société Générale')
    expect(resultIds([e], 'societe GENERALE')).toEqual([e.id])
  })

  it('matches words found in different fields, but not a missing word', () => {
    const e = entity('Dupont', { tags: ['cible'] })
    expect(resultIds([e], 'dupont cible')).toEqual([e.id])
    expect(resultIds([e], 'dupont martin')).toEqual([])
  })

  it('does not match across two fields', () => {
    const e = entity('ab', { tags: ['cd'] })
    expect(resultIds([e], 'bc')).toEqual([])
  })

  it('has no search and dims nothing for a blank query', () => {
    const v = view([entity('A')], searchTerms('   '))
    expect(v.searching).toBe(false)
    expect(v.results).toEqual([])
    expect(v.dimmedEntityIds.size).toBe(0)
  })

  it('dims everything but the results', () => {
    const alice = entity('Alice')
    const bob = entity('Bob')
    const rel = createRelation(inv, alice.id, bob.id, 'connaît')
    const v = view([alice, bob], searchTerms('alice'), [rel])
    expect(v.results).toEqual([{ type: 'entity', id: alice.id }])
    expect(v.dimmedEntityIds).toEqual(new Set([bob.id]))
    expect(v.dimmedRelationIds).toEqual(new Set([rel.id]))
  })
})

describe('result order', () => {
  it('goes top to bottom, then left to right, placing a relation between its entities', () => {
    const left = entity('t', {}, 0, 100)
    const right = entity('t', {}, 300, 100)
    const top = entity('t', {}, 500, 0)
    const rel = createRelation(inv, left.id, right.id, 't')
    const refs = view([left, right, top], ['t'], [rel]).results
    expect(refs.map((ref) => ref.id)).toEqual([top.id, left.id, rel.id, right.id])
  })
})

describe('haystack cache', () => {
  it('follows an edit, which creates a new object', () => {
    const before = entity('Bob')
    expect(entityHaystack(before)).toBe(entityHaystack(before))
    const after = { ...before, label: 'Alice B.' }
    expect(entityHaystack(after)).toContain('alice')
    expect(entityHaystack(before)).not.toContain('alice')
  })
})

const graded = (reliability: Confidence['reliability'], credibility: Confidence['credibility']) => ({
  reliability,
  credibility,
})

function filtered(
  entities: Entity[],
  filters: Partial<GraphFilters>,
  relations: Relation[] = [],
  query = '',
) {
  return computeGraphView(
    Object.fromEntries(entities.map((e) => [e.id, e])),
    Object.fromEntries(relations.map((r) => [r.id, r])),
    searchTerms(query),
    { ...EMPTY_FILTERS, ...filters },
  )
}

const dimmedEntities = (entities: Entity[], filters: Partial<GraphFilters>, relations: Relation[] = []) =>
  [...filtered(entities, filters, relations).dimmedEntityIds].sort()
const ids = (...items: { id: string }[]) => items.map((item) => item.id).sort()

describe('type and tag criteria', () => {
  it('keeps only the checked types', () => {
    const person = entity('P')
    const email = { ...entity('E'), type: 'email' as const }
    const domain = { ...entity('D'), type: 'domain' as const }
    expect(dimmedEntities([person, email, domain], { types: ['email'] })).toEqual(ids(person, domain))
    expect(dimmedEntities([person, email, domain], { types: ['email', 'domain'] })).toEqual(ids(person))
  })

  it('keeps entities carrying a checked tag, ignoring case', () => {
    const a = entity('A', { tags: ['Cible'] })
    const b = entity('B', { tags: ['cible'] })
    const c = entity('C')
    expect(dimmedEntities([a, b, c], { tags: ['cible'] })).toEqual(ids(c))
  })

  it('lists the used types with their counts, plus checked ones nobody uses', () => {
    const emails = [entity('1'), entity('2')].map((e) => ({ ...e, type: 'email' as const }))
    const person = entity('P')
    const byId = Object.fromEntries([...emails, person].map((e) => [e.id, e]))
    expect(typeOptions(byId, [])).toEqual([
      { type: 'person', count: 1 },
      { type: 'email', count: 2 },
    ])
    expect(typeOptions(byId, ['vehicle'])).toContainEqual({ type: 'vehicle', count: 0 })
  })

  it('merges tags ignoring case, keeps the first spelling, sorts in French, keeps unused checked ones', () => {
    const entities = [entity('A', { tags: ['Zèbre', 'cible'] }), entity('B', { tags: ['Cible', 'élan'] })]
    const byId = Object.fromEntries(entities.map((e) => [e.id, e]))
    expect(tagOptions(byId, []).map(({ label, count }) => [label, count])).toEqual([
      ['cible', 2],
      ['élan', 1],
      ['Zèbre', 1],
    ])
    expect(tagOptions(byId, ['oublié'])).toContainEqual({ key: 'oublié', label: 'oublié', count: 0 })
  })
})

describe('status criteria', () => {
  it('keeps only verified relations without dimming any entity', () => {
    const a = entity('A')
    const b = entity('B', { status: 'hypothesis' })
    const verified = { ...createRelation(inv, a.id, b.id, 'x'), status: 'verified' as const }
    const guessed = createRelation(inv, b.id, a.id, 'y')
    const v = filtered([a, b], { relationStatus: 'verified' }, [verified, guessed])
    expect(v.dimmedEntityIds.size).toBe(0)
    expect([...v.dimmedRelationIds]).toEqual([guessed.id])
  })

  it('keeps only hypothetical entities and dims the relations attached to the others', () => {
    const guess = entity('G', { status: 'hypothesis' })
    const solid = entity('S')
    const other = entity('O', { status: 'hypothesis' })
    const toSolid = createRelation(inv, guess.id, solid.id, 'a')
    const between = createRelation(inv, guess.id, other.id, 'b')
    const v = filtered([guess, solid, other], { entityStatus: 'hypothesis' }, [toSolid, between])
    expect([...v.dimmedEntityIds]).toEqual([solid.id])
    expect([...v.dimmedRelationIds]).toEqual([toSolid.id])
  })

  it('has no status criterion once back to all', () => {
    expect(activeCriteriaCount({ ...EMPTY_FILTERS, relationStatus: 'verified' })).toBe(1)
    expect(activeCriteriaCount({ ...EMPTY_FILTERS, relationStatus: null })).toBe(0)
  })
})

describe('confidence criterion', () => {
  const a1 = entity('A1', { confidence: graded('A', 1) })
  const b2 = entity('B2', { confidence: graded('B', 2) })
  const b3 = entity('B3', { confidence: graded('B', 3) })
  const c1 = entity('C1', { confidence: graded('C', 1) })
  const none = entity('none')
  const all = [a1, b2, b3, c1, none]

  it('accepts a reliability at least as good as the minimum, and ungraded elements', () => {
    expect(dimmedEntities(all, { minReliability: 'B' })).toEqual(ids(c1))
  })

  it('combines both thresholds', () => {
    expect(dimmedEntities(all, { minReliability: 'B', minCredibility: 2 })).toEqual(ids(b3, c1))
  })

  it('dims ungraded elements, relations included, when asked to', () => {
    const rel = createRelation(inv, a1.id, b2.id, 'x')
    const v = filtered(all, { includeUngraded: false }, [rel])
    expect([...v.dimmedEntityIds]).toEqual(ids(none))
    expect([...v.dimmedRelationIds]).toEqual([rel.id])
  })

  it('applies to relations too', () => {
    const good = { ...createRelation(inv, a1.id, b2.id, 'x'), confidence: graded('A', 1) }
    const poor = { ...createRelation(inv, a1.id, b2.id, 'y'), confidence: graded('E', 5) }
    const v = filtered([a1, b2], { minReliability: 'B' }, [good, poor])
    expect([...v.dimmedRelationIds]).toEqual([poor.id])
  })
})

describe('combining criteria and relations', () => {
  it('requires every active criterion', () => {
    const verifiedEmail = { ...entity('V'), type: 'email' as const }
    const guessedEmail = { ...entity('G', { status: 'hypothesis' }), type: 'email' as const }
    const verifiedDomain = { ...entity('D'), type: 'domain' as const }
    const person = entity('P')
    const dimmed = dimmedEntities([verifiedEmail, guessedEmail, verifiedDomain, person], {
      types: ['email', 'domain'],
      entityStatus: 'verified',
    })
    expect(dimmed).toEqual(ids(guessedEmail, person))
  })

  it('dims a relation whose entity is filtered out, and keeps one between kept entities', () => {
    const e1 = { ...entity('E1'), type: 'email' as const }
    const e2 = { ...entity('E2'), type: 'email' as const }
    const p = entity('P')
    const kept = createRelation(inv, e1.id, e2.id, 'k')
    const lost = createRelation(inv, e1.id, p.id, 'l')
    const v = filtered([e1, e2, p], { types: ['email'] }, [kept, lost])
    expect([...v.dimmedEntityIds]).toEqual([p.id])
    expect([...v.dimmedRelationIds]).toEqual([lost.id])
  })

  it('flags a graph where every entity is filtered out', () => {
    const p = entity('P')
    expect(filtered([p], { types: ['email'] }).nothingMatchesFilters).toBe(true)
    expect(filtered([p], {}).nothingMatchesFilters).toBe(false)
    expect(filtered([], { types: ['email'] }).nothingMatchesFilters).toBe(false)
  })

  it('counts the active criteria', () => {
    expect(activeCriteriaCount(EMPTY_FILTERS)).toBe(0)
    expect(
      activeCriteriaCount({
        ...EMPTY_FILTERS,
        types: ['email', 'domain'],
        relationStatus: 'verified',
        includeUngraded: false,
      }),
    ).toBe(3)
  })
})

describe('filters and search combined', () => {
  it('takes results among the elements that pass the filters', () => {
    const alice = entity('Alice')
    const mail = { ...entity('alice@example.org'), type: 'email' as const }
    const v = filtered([alice, mail], { types: ['email'] }, [], 'alice')
    expect(v.results).toEqual([{ type: 'entity', id: mail.id }])
    expect([...v.dimmedEntityIds]).toEqual([alice.id])
  })

  it('dims by filters when there is no search', () => {
    const v = filtered([entity('A')], { types: ['email'] })
    expect(v.searching).toBe(false)
    expect(v.dimmedEntityIds.size).toBe(1)
  })
})
