import {
  EXPORT_FORMAT,
  MAX_IMPORT_BYTES,
  buildExport,
  parseExport,
  remapIds,
  serializeExport,
} from '@/domain/export-format'
import { createEntity, createInvestigation, createRelation } from '@/domain/factories'
import { LIMITS, SCHEMA_VERSION, type Attachment, type Source } from '@/domain/schemas'
import { sha256Hex } from '@/lib/hash'

function sampleSnapshot() {
  const investigation = createInvestigation('Test')
  const a = createEntity(investigation.id, 'person', { x: 0, y: 0 }, 'Alice')
  const b = createEntity(investigation.id, 'email', { x: 100, y: 0 }, 'alice@example.org')
  const relation = createRelation(investigation.id, a.id, b.id, 'utilise')
  return { investigation, entities: [a, b], relations: [relation], sources: [] as Source[] }
}

const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

/** A snapshot whose source S holds a (tiny, fake) PNG screenshot. */
async function snapshotWithScreenshot() {
  const snapshot = sampleSnapshot()
  const bytes = new Uint8Array([...PNG_HEADER, 1, 2, 3, 4, 5, 6, 7, 8])
  const sha256 = await sha256Hex(bytes)
  const attachment: Attachment = {
    id: crypto.randomUUID(),
    investigationId: snapshot.investigation.id,
    blob: new Blob([bytes], { type: 'image/png' }),
    mime: 'image/png',
    size: bytes.length,
    sha256,
  }
  const source: Source = {
    id: crypto.randomUUID(),
    investigationId: snapshot.investigation.id,
    title: 'Capture',
    capturedAt: new Date().toISOString(),
    attachmentId: attachment.id,
    sha256,
  }
  return { snapshot: { ...snapshot, sources: [source] }, attachment, source, bytes }
}

describe('export format', () => {
  it('round-trips a snapshot', async () => {
    const snapshot = sampleSnapshot()
    expect(await parseExport(await serializeExport(snapshot))).toEqual({
      ok: true,
      snapshot,
      attachments: [],
    })
  })

  it('keeps status and confidence through a round trip', async () => {
    const { investigation, entities, relations } = sampleSnapshot()
    const [a, b] = entities as [(typeof entities)[number], (typeof entities)[number]]
    const snapshot = {
      investigation,
      entities: [
        {
          ...a,
          status: 'verified' as const,
          confidence: { reliability: 'A' as const, credibility: 1 as const },
        },
        { ...b, status: 'hypothesis' as const },
      ],
      relations: relations.map((r) => ({
        ...r,
        status: 'hypothesis' as const,
        confidence: { reliability: 'D' as const, credibility: 4 as const },
      })),
      sources: [] as Source[],
    }
    const result = await parseExport(await serializeExport(snapshot))
    expect(result.ok && result.snapshot).toEqual(snapshot)
  })

  it('rejects an imported entity graded outside the scale', async () => {
    const snapshot = sampleSnapshot()
    const json = JSON.parse(await serializeExport(snapshot))
    json.entities[0].confidence = { reliability: 'G', credibility: 7 }
    expect((await parseExport(JSON.stringify(json))).ok).toBe(false)
  })

  it('rejects invalid JSON without throwing', async () => {
    expect(await parseExport('{nope')).toEqual({
      ok: false,
      errors: [{ code: 'invalidJson' }],
    })
  })

  it('rejects an unknown format and files from a newer version', async () => {
    const json = JSON.parse(await serializeExport(sampleSnapshot()))
    expect((await parseExport(JSON.stringify({ ...json, format: 'other' }))).ok).toBe(false)
    const newer = await parseExport(JSON.stringify({ ...json, schemaVersion: SCHEMA_VERSION + 1 }))
    expect(newer.ok).toBe(false)
    if (!newer.ok) expect(newer.errors[0]).toEqual({ code: 'newerVersion', value: SCHEMA_VERSION + 1 })
  })

  it('rejects files larger than the import limit', async () => {
    const result = await parseExport('x'.repeat(MAX_IMPORT_BYTES + 1))
    expect(result.ok).toBe(false)
  })

  it('rejects dangling relations, duplicate ids and foreign records', async () => {
    const snapshot = sampleSnapshot()
    const [a] = snapshot.entities
    const dangling = { ...snapshot.relations[0]!, to: crypto.randomUUID() }
    const result = await parseExport(
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
      expect(result.errors.map((error) => error.code)).toContain('duplicateId')
      expect(result.errors.map((error) => error.code)).toContain('inconsistentInvestigation')
      expect(result.errors.map((error) => error.code)).toContain('unknownEntity')
    }
  })

  it('reports an entity with too many properties by code, with the limit', async () => {
    const json = JSON.parse(await serializeExport(sampleSnapshot()))
    json.entities[0].properties = Object.fromEntries(
      Array.from({ length: LIMITS.properties + 1 }, (_, index) => [`k${index}`, 'v']),
    )
    const result = await parseExport(JSON.stringify(json))
    expect(!result.ok && result.errors[0]).toMatchObject({
      code: 'tooManyProperties',
      path: 'entities.0.properties',
      value: LIMITS.properties,
    })
  })

  describe('tool checks', () => {
    const checks = [
      { toolId: 'crtsh', checkedAt: '2026-10-19T10:00:00.000Z' },
      { toolId: 'future-tool', checkedAt: '2026-10-20T10:00:00.000Z' },
    ]
    const withChecks = () => {
      const snapshot = sampleSnapshot()
      const [a, ...others] = snapshot.entities
      return { ...snapshot, entities: [{ ...a!, toolChecks: checks }, ...others] }
    }

    it('round-trips the checks, unknown tools included', async () => {
      const snapshot = withChecks()
      const json = await serializeExport(snapshot)
      expect(JSON.parse(json).entities[0].toolChecks).toEqual(checks)
      expect(await parseExport(json)).toEqual({ ok: true, snapshot, attachments: [] })
    })

    it('exports an entity without checks without the field', async () => {
      const json = JSON.parse(await serializeExport(sampleSnapshot()))
      expect(json.entities[0]).not.toHaveProperty('toolChecks')
    })

    it('keeps the checks when importing as a copy', async () => {
      const { snapshot } = remapIds({ snapshot: withChecks(), attachments: [] })
      expect(snapshot.entities[0]?.toolChecks).toEqual(checks)
    })

    it('refuses a duplicate check, naming the field', async () => {
      const json = JSON.parse(await serializeExport(withChecks()))
      json.entities[0].toolChecks = [checks[0], { ...checks[0], checkedAt: '2026-10-21T10:00:00.000Z' }]
      const result = await parseExport(JSON.stringify(json))
      expect(!result.ok && result.errors[0]).toMatchObject({
        code: 'duplicateToolCheck',
        path: 'entities.0.toolChecks',
      })
    })

    it('refuses an invalid tool id', async () => {
      const json = JSON.parse(await serializeExport(withChecks()))
      json.entities[0].toolChecks = [{ toolId: '<script>', checkedAt: checks[0]!.checkedAt }]
      expect((await parseExport(JSON.stringify(json))).ok).toBe(false)
    })
  })

  it('remaps every id while preserving references', async () => {
    const snapshot = sampleSnapshot()
    const { snapshot: copy } = remapIds({ snapshot, attachments: [] })
    expect(copy.investigation.id).not.toBe(snapshot.investigation.id)
    const ids = new Set(copy.entities.map((entity) => entity.id))
    expect(snapshot.entities.some((entity) => ids.has(entity.id))).toBe(false)
    expect(ids.has(copy.relations[0]!.from) && ids.has(copy.relations[0]!.to)).toBe(true)
    expect(copy.entities.every((entity) => entity.investigationId === copy.investigation.id)).toBe(true)
    expect((await parseExport(await serializeExport(copy))).ok).toBe(true)
  })

  it('keeps entity and relation dates when remapping ids', () => {
    const snapshot = sampleSnapshot()
    const { snapshot: copy } = remapIds({ snapshot, attachments: [] })
    const dates = (items: { createdAt: string; updatedAt: string }[]) =>
      items.map(({ createdAt, updatedAt }) => ({ createdAt, updatedAt }))
    expect(dates(copy.entities)).toEqual(dates(snapshot.entities))
    expect(dates(copy.relations)).toEqual(dates(snapshot.relations))
  })
})

describe('export with attachments', () => {
  it('accepts a file without an attachments list', async () => {
    const json = JSON.parse(await serializeExport(sampleSnapshot()))
    delete json.attachments
    const result = await parseExport(JSON.stringify(json))
    expect(result.ok && result.attachments).toEqual([])
  })

  it('embeds screenshots and restores the same bytes', async () => {
    const { snapshot, attachment, bytes } = await snapshotWithScreenshot()
    const file = await buildExport(snapshot, [attachment])
    expect(file.schemaVersion).toBe(1)
    expect(file.attachments).toHaveLength(1)
    expect(file.attachments[0]!.sha256).toBe(attachment.sha256)
    expect(file.sources[0]!.attachmentId).toBe(attachment.id)

    const result = await parseExport(JSON.stringify(file))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const restored = new Uint8Array(await result.attachments[0]!.blob.arrayBuffer())
    expect(Array.from(restored)).toEqual(Array.from(bytes))
    expect(result.attachments[0]!.mime).toBe('image/png')
  })

  it('round-trips with screenshots: same content apart from exportedAt', async () => {
    const { snapshot, attachment } = await snapshotWithScreenshot()
    const first = JSON.parse(await serializeExport(snapshot, [attachment]))
    const parsed = await parseExport(JSON.stringify(first))
    if (!parsed.ok) throw new Error('parse failed')
    const second = JSON.parse(await serializeExport(parsed.snapshot, parsed.attachments))
    expect({ ...second, exportedAt: '' }).toEqual({ ...first, exportedAt: '' })
  })

  it('exports without screenshots: fingerprints kept, reference dropped', async () => {
    const { snapshot, source } = await snapshotWithScreenshot()
    const file = await buildExport(snapshot)
    expect(file.attachments).toEqual([])
    expect(file.sources[0]!.attachmentId).toBeUndefined()
    expect(file.sources[0]!.sha256).toBe(source.sha256)
    expect((await parseExport(JSON.stringify(file))).ok).toBe(true)
  })

  it('rejects a source referencing an unknown screenshot', async () => {
    const { snapshot, attachment } = await snapshotWithScreenshot()
    const file = await buildExport(snapshot, [attachment])
    const result = await parseExport(JSON.stringify({ ...file, attachments: [] }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.map((error) => error.code)).toContain('unknownAttachment')
  })

  it('rejects tampered base64, a mismatched size and a mismatched fingerprint', async () => {
    const { snapshot, attachment } = await snapshotWithScreenshot()
    const file = await buildExport(snapshot, [attachment])
    const entry = file.attachments[0]!
    const attempt = (patch: Partial<typeof entry>) =>
      parseExport(JSON.stringify({ ...file, attachments: [{ ...entry, ...patch }] }))

    const invalid = await attempt({ data: '***' })
    expect(!invalid.ok && invalid.errors[0]).toMatchObject({ code: 'invalidBase64' })

    // Same length, different bytes: only the fingerprint can tell.
    const swapped = entry.data.slice(0, -4) + 'AAAA'
    const tampered = await attempt({ data: swapped })
    expect(tampered.ok).toBe(false)

    const size = await attempt({ size: entry.size + 1 })
    expect(!size.ok && size.errors[0]).toMatchObject({ code: 'sizeMismatch' })

    const sha = await attempt({ sha256: 'f'.repeat(64) })
    expect(!sha.ok && sha.errors[0]).toMatchObject({ code: 'hashMismatch' })
  })

  it('rejects an attachment whose fingerprint differs from its source', async () => {
    const { snapshot, attachment } = await snapshotWithScreenshot()
    const file = await buildExport(snapshot, [attachment])
    const sources = [{ ...file.sources[0]!, sha256: 'e'.repeat(64) }]
    const result = await parseExport(JSON.stringify({ ...file, sources }))
    expect(!result.ok && result.errors[0]).toMatchObject({ code: 'sourceHashMismatch' })
  })

  it('rejects disguised content declared as PNG', async () => {
    const { snapshot, attachment } = await snapshotWithScreenshot()
    const file = await buildExport(snapshot, [attachment])
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>')
    const entry = {
      ...file.attachments[0]!,
      data: btoa(String.fromCharCode(...svg)),
      size: svg.length,
      sha256: await sha256Hex(svg),
    }
    const result = await parseExport(JSON.stringify({ ...file, attachments: [entry] }))
    expect(!result.ok && result.errors[0]).toMatchObject({ code: 'mimeMismatch' })
  })

  it('rejects an SVG mime type and files from schemaVersion 2', async () => {
    const { snapshot, attachment } = await snapshotWithScreenshot()
    const file = await buildExport(snapshot, [attachment])
    const svgMime = { ...file.attachments[0]!, mime: 'image/svg+xml' }
    expect((await parseExport(JSON.stringify({ ...file, attachments: [svgMime] }))).ok).toBe(false)
    expect((await parseExport(JSON.stringify({ ...file, schemaVersion: 2 }))).ok).toBe(false)
  })

  it('remaps screenshot ids and keeps source ↔ attachment links', async () => {
    const { snapshot, attachment } = await snapshotWithScreenshot()
    const copy = remapIds({ snapshot, attachments: [attachment] })
    const copiedAttachment = copy.attachments[0]!
    expect(copiedAttachment.id).not.toBe(attachment.id)
    expect(copiedAttachment.investigationId).toBe(copy.snapshot.investigation.id)
    expect(copy.snapshot.sources[0]!.attachmentId).toBe(copiedAttachment.id)
    const reparsed = await parseExport(await serializeExport(copy.snapshot, copy.attachments))
    expect(reparsed.ok).toBe(true)
  })
})
