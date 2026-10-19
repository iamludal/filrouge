import { createEntity, createInvestigation, createRelation } from '@/domain/factories'
import { entitySchema, investigationSchema, relationSchema, sourceSchema, LIMITS } from '@/domain/schemas'

describe('schemas', () => {
  const investigation = createInvestigation('  Opération Alpha  ', 'desc')

  it('accepts factory-made records', () => {
    expect(investigationSchema.parse(investigation).name).toBe('Opération Alpha')
    const a = createEntity(investigation.id, 'person', { x: 0, y: 0 }, 'Alice')
    const b = createEntity(investigation.id, 'email', { x: 10, y: 10 })
    expect(entitySchema.safeParse(a).success).toBe(true)
    expect(relationSchema.safeParse(createRelation(investigation.id, a.id, b.id, 'utilise')).success).toBe(
      true,
    )
  })

  it('rejects an empty investigation name', () => {
    expect(investigationSchema.safeParse({ ...investigation, name: '   ' }).success).toBe(false)
  })

  it('rejects unknown entity types and non-finite positions', () => {
    const entity = createEntity(investigation.id, 'ip', { x: 0, y: 0 })
    expect(entitySchema.safeParse({ ...entity, type: 'spaceship' }).success).toBe(false)
    expect(entitySchema.safeParse({ ...entity, position: { x: Infinity, y: 0 } }).success).toBe(false)
  })

  it('rejects nested property values and oversized labels', () => {
    const entity = createEntity(investigation.id, 'ip', { x: 0, y: 0 })
    expect(entitySchema.safeParse({ ...entity, properties: { asn: 1234, ok: true } }).success).toBe(true)
    expect(entitySchema.safeParse({ ...entity, properties: { evil: { nested: 1 } } }).success).toBe(false)
    expect(entitySchema.safeParse({ ...entity, label: 'x'.repeat(LIMITS.label + 1) }).success).toBe(false)
  })

  it('validates the Admiralty confidence code', () => {
    const entity = createEntity(investigation.id, 'person', { x: 0, y: 0 })
    expect(
      entitySchema.safeParse({ ...entity, confidence: { reliability: 'B', credibility: 2 } }).success,
    ).toBe(true)
    expect(
      entitySchema.safeParse({ ...entity, confidence: { reliability: 'G', credibility: 2 } }).success,
    ).toBe(false)
    expect(
      entitySchema.safeParse({ ...entity, confidence: { reliability: 'A', credibility: 7 } }).success,
    ).toBe(false)
  })

  it('only accepts http(s) source URLs', () => {
    const base = {
      id: crypto.randomUUID(),
      investigationId: investigation.id,
      capturedAt: new Date().toISOString(),
    }
    expect(sourceSchema.safeParse({ ...base, url: 'https://example.org/a' }).success).toBe(true)
    expect(sourceSchema.safeParse({ ...base, url: 'javascript:alert(1)' }).success).toBe(false)
  })

  it('rejects non-UTC or malformed dates', () => {
    expect(investigationSchema.safeParse({ ...investigation, createdAt: '2026-01-01' }).success).toBe(false)
    expect(
      investigationSchema.safeParse({ ...investigation, createdAt: '2026-01-01T00:00:00+02:00' }).success,
    ).toBe(false)
  })
})
