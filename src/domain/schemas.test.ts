import { createEntity, createInvestigation, createRelation } from '@/domain/factories'
import {
  attachmentSchema,
  entitySchema,
  investigationSchema,
  relationSchema,
  sourceSchema,
  LIMITS,
} from '@/domain/schemas'

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

  it('rejects confidence grades outside the Admiralty scale', () => {
    const entity = createEntity(investigation.id, 'ip', { x: 0, y: 0 })
    const grade = (reliability: string, credibility: number) =>
      entitySchema.safeParse({ ...entity, confidence: { reliability, credibility } }).success
    expect(grade('B', 2)).toBe(true)
    expect(grade('G', 2)).toBe(false)
    expect(grade('B', 7)).toBe(false)
  })

  it('accepts entities without appearance fields and with valid ones', () => {
    const entity = createEntity(investigation.id, 'person', { x: 0, y: 0 })
    expect(entitySchema.safeParse(entity).success).toBe(true)
    expect(entitySchema.safeParse({ ...entity, color: 'red', icon: 'skull', important: true }).success).toBe(
      true,
    )
    expect(entitySchema.safeParse({ ...entity, important: false }).success).toBe(true)
  })

  it('rejects unknown colours, unknown icons and a non-boolean importance', () => {
    const entity = createEntity(investigation.id, 'person', { x: 0, y: 0 })
    expect(entitySchema.safeParse({ ...entity, color: '#ff0000' }).success).toBe(false)
    expect(entitySchema.safeParse({ ...entity, color: 'chartreuse' }).success).toBe(false)
    expect(entitySchema.safeParse({ ...entity, icon: 'flag' }).success).toBe(false)
    expect(entitySchema.safeParse({ ...entity, icon: '<script>' }).success).toBe(false)
    expect(entitySchema.safeParse({ ...entity, important: 'yes' }).success).toBe(false)
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

  describe('attachments', () => {
    const attachment = {
      id: crypto.randomUUID(),
      investigationId: investigation.id,
      blob: new Blob(['x'], { type: 'image/png' }),
      mime: 'image/png',
      size: 1,
      sha256: 'a'.repeat(64),
    }

    it('accepts a valid attachment, optimized or not', () => {
      expect(attachmentSchema.safeParse(attachment).success).toBe(true)
      expect(
        attachmentSchema.safeParse({ ...attachment, originalSha256: 'b'.repeat(64), originalSize: 10 })
          .success,
      ).toBe(true)
    })

    it('rejects SVG, oversized and malformed attachments', () => {
      expect(attachmentSchema.safeParse({ ...attachment, mime: 'image/svg+xml' }).success).toBe(false)
      expect(attachmentSchema.safeParse({ ...attachment, size: LIMITS.attachmentBytes + 1 }).success).toBe(
        false,
      )
      expect(attachmentSchema.safeParse({ ...attachment, originalSha256: 'XYZ' }).success).toBe(false)
    })

    it('rejects a malformed original hash on a source', () => {
      const source = {
        id: crypto.randomUUID(),
        investigationId: investigation.id,
        capturedAt: new Date().toISOString(),
        originalSha256: 'nope',
      }
      expect(sourceSchema.safeParse(source).success).toBe(false)
      expect(sourceSchema.safeParse({ ...source, originalSha256: 'c'.repeat(64) }).success).toBe(true)
    })
  })

  describe('tool checks', () => {
    const entity = createEntity(investigation.id, 'domain', { x: 0, y: 0 }, 'exemple.fr')
    const check = (toolId: string, checkedAt = '2026-10-20T10:00:00.000Z') => ({ toolId, checkedAt })
    const parse = (toolChecks: unknown) => entitySchema.safeParse({ ...entity, toolChecks })

    it('accepts an entity without the field and a list of distinct tools', () => {
      expect(entitySchema.safeParse(entity).success).toBe(true)
      expect(parse([check('crtsh'), check('shodan')]).success).toBe(true)
      expect(parse([]).success).toBe(true)
    })

    it('rejects a check without a date or with a non-UTC date', () => {
      expect(parse([{ toolId: 'crtsh' }]).success).toBe(false)
      expect(parse([check('crtsh', '2026-10-20T12:00:00+02:00')]).success).toBe(false)
      expect(parse([check('crtsh', 'yesterday')]).success).toBe(false)
    })

    it('rejects a tool id outside lowercase letters, digits and hyphens', () => {
      expect(parse([check('<script>')]).success).toBe(false)
      expect(parse([check('Crtsh')]).success).toBe(false)
      expect(parse([check('')]).success).toBe(false)
      expect(parse([check('a'.repeat(65))]).success).toBe(false)
      expect(parse([check('a'.repeat(64))]).success).toBe(true)
    })

    it('rejects two checks for the same tool, tagged for the import error', () => {
      const result = parse([check('crtsh'), check('crtsh', '2026-10-21T10:00:00.000Z')])
      expect(result.success).toBe(false)
      const issue = !result.success ? result.error.issues[0] : undefined
      expect(issue?.code === 'custom' && issue.params).toMatchObject({ importCode: 'duplicateToolCheck' })
    })

    it('limits the number of checks', () => {
      const many = (count: number) => Array.from({ length: count }, (_, index) => check(`tool-${index}`))
      expect(parse(many(LIMITS.toolChecks)).success).toBe(true)
      expect(parse(many(LIMITS.toolChecks + 1)).success).toBe(false)
    })
  })
})
