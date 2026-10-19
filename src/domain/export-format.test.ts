import { EXPORT_FORMAT, parseExport, remapIds, serializeExport } from '@/domain/export-format'
import { createEntity, createInvestigation, createRelation } from '@/domain/factories'
import { SCHEMA_VERSION } from '@/domain/schemas'

function sampleSnapshot() {
  const investigation = createInvestigation('Test')
  const a = createEntity(investigation.id, 'person', { x: 0, y: 0 }, 'Alice')
  const b = createEntity(investigation.id, 'email', { x: 100, y: 0 }, 'alice@example.org')
  const relation = createRelation(investigation.id, a.id, b.id, 'utilise')
  return { investigation, entities: [a, b], relations: [relation], sources: [] }
}

describe('export format', () => {
  it('round-trips a snapshot', () => {
    const snapshot = sampleSnapshot()
    const result = parseExport(serializeExport(snapshot))
    expect(result).toEqual({ ok: true, snapshot })
  })

  it('rejects invalid JSON without throwing', () => {
    expect(parseExport('{nope')).toEqual({ ok: false, errors: ['Le fichier n’est pas un JSON valide'] })
  })

  it('rejects an unknown format and files from a newer version', () => {
    const json = JSON.parse(serializeExport(sampleSnapshot()))
    expect(parseExport(JSON.stringify({ ...json, format: 'other' })).ok).toBe(false)
    const newer = parseExport(JSON.stringify({ ...json, schemaVersion: SCHEMA_VERSION + 1 }))
    expect(newer.ok).toBe(false)
    if (!newer.ok) expect(newer.errors[0]).toMatch(/plus récente/)
  })

  it('rejects dangling relations, duplicate ids and foreign records', () => {
    const snapshot = sampleSnapshot()
    const [a] = snapshot.entities
    const dangling = { ...snapshot.relations[0]!, to: crypto.randomUUID() }
    const result = parseExport(
      JSON.stringify({
        format: EXPORT_FORMAT,
        schemaVersion: SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        ...snapshot,
        entities: [
          ...snapshot.entities,
          a,
          { ...a!, id: crypto.randomUUID(), investigationId: crypto.randomUUID() },
        ],
        relations: [dangling],
      }),
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.join('\n')).toMatch(/Identifiant dupliqué/)
      expect(result.errors.join('\n')).toMatch(/Enquête incohérente/)
      expect(result.errors.join('\n')).toMatch(/Entité inconnue/)
    }
  })

  it('remaps every id while preserving references', () => {
    const snapshot = sampleSnapshot()
    const copy = remapIds(snapshot)
    expect(copy.investigation.id).not.toBe(snapshot.investigation.id)
    const ids = new Set(copy.entities.map((entity) => entity.id))
    expect(snapshot.entities.some((entity) => ids.has(entity.id))).toBe(false)
    expect(ids.has(copy.relations[0]!.from) && ids.has(copy.relations[0]!.to)).toBe(true)
    expect(copy.entities.every((entity) => entity.investigationId === copy.investigation.id)).toBe(true)
    expect(parseExport(serializeExport(copy)).ok).toBe(true)
  })
})
