import { z } from 'zod'
import {
  entitySchema,
  investigationSchema,
  relationSchema,
  SCHEMA_VERSION,
  sourceSchema,
  type InvestigationSnapshot,
} from '@/domain/schemas'
import { newId, nowIso } from '@/lib/ids'

export const EXPORT_FORMAT = 'filrouge.investigation'
export const MAX_IMPORT_BYTES = 50 * 1024 * 1024

const MAX_ITEMS = 100_000

export const exportFileSchema = z
  .object({
    format: z.literal(EXPORT_FORMAT),
    schemaVersion: z.literal(SCHEMA_VERSION),
    exportedAt: z.iso.datetime({ offset: false }),
    investigation: investigationSchema,
    entities: z.array(entitySchema).max(MAX_ITEMS),
    relations: z.array(relationSchema).max(MAX_ITEMS),
    sources: z.array(sourceSchema).max(MAX_ITEMS),
  })
  .superRefine((file, ctx) => {
    const investigationId = file.investigation.id
    const ids = new Set<string>([investigationId])
    const entityIds = new Set(file.entities.map((entity) => entity.id))
    const sourceIds = new Set(file.sources.map((source) => source.id))

    const collections = [
      ['entities', file.entities],
      ['relations', file.relations],
      ['sources', file.sources],
    ] as const
    for (const [key, items] of collections) {
      items.forEach((item, index) => {
        if (ids.has(item.id))
          ctx.addIssue({ code: 'custom', path: [key, index, 'id'], message: 'Identifiant dupliqué' })
        ids.add(item.id)
        if (item.investigationId !== investigationId) {
          ctx.addIssue({
            code: 'custom',
            path: [key, index, 'investigationId'],
            message: 'Enquête incohérente',
          })
        }
      })
    }

    file.relations.forEach((relation, index) => {
      for (const end of ['from', 'to'] as const) {
        if (!entityIds.has(relation[end])) {
          ctx.addIssue({ code: 'custom', path: ['relations', index, end], message: 'Entité inconnue' })
        }
      }
    })

    for (const [key, items] of [
      ['entities', file.entities],
      ['relations', file.relations],
    ] as const) {
      items.forEach((item, index) => {
        if (item.sourceIds.some((sourceId) => !sourceIds.has(sourceId))) {
          ctx.addIssue({ code: 'custom', path: [key, index, 'sourceIds'], message: 'Source inconnue' })
        }
      })
    }
  })

export type ExportFile = z.infer<typeof exportFileSchema>

export function buildExport(snapshot: InvestigationSnapshot): ExportFile {
  return {
    format: EXPORT_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: nowIso(),
    ...snapshot,
  }
}

export function serializeExport(snapshot: InvestigationSnapshot): string {
  return JSON.stringify(buildExport(snapshot), null, 2)
}

export type ParseResult = { ok: true; snapshot: InvestigationSnapshot } | { ok: false; errors: string[] }

/** Parses untrusted JSON text. Never throws; errors are short, display-safe strings. */
export function parseExport(text: string): ParseResult {
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, errors: ['Fichier trop volumineux'] }

  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, errors: ['Le fichier n’est pas un JSON valide'] }
  }

  if (typeof raw === 'object' && raw !== null && 'schemaVersion' in raw) {
    const version = (raw as { schemaVersion: unknown }).schemaVersion
    if (typeof version === 'number' && version > SCHEMA_VERSION) {
      return { ok: false, errors: [`Format v${version} produit par une version plus récente de filrouge`] }
    }
  }

  const result = exportFileSchema.safeParse(raw)
  if (!result.success) {
    const errors = result.error.issues.slice(0, 5).map((issue) => {
      const path = issue.path.map(String).join('.')
      return path ? `${path} : ${issue.message}` : issue.message
    })
    if (result.error.issues.length > 5)
      errors.push(`… et ${result.error.issues.length - 5} autre(s) erreur(s)`)
    return { ok: false, errors }
  }

  const { investigation, entities, relations, sources } = result.data
  return { ok: true, snapshot: { investigation, entities, relations, sources } }
}

/** Gives every record a fresh id, preserving references. Used to import a copy next to the original. */
export function remapIds(snapshot: InvestigationSnapshot): InvestigationSnapshot {
  const mapping = new Map<string, string>()
  const map = (oldId: string) => {
    let mapped = mapping.get(oldId)
    if (!mapped) {
      mapped = newId()
      mapping.set(oldId, mapped)
    }
    return mapped
  }
  const investigationId = map(snapshot.investigation.id)
  return {
    investigation: { ...snapshot.investigation, id: investigationId },
    sources: snapshot.sources.map((source) => ({
      ...source,
      id: map(source.id),
      investigationId,
    })),
    entities: snapshot.entities.map((entity) => ({
      ...entity,
      id: map(entity.id),
      investigationId,
      sourceIds: entity.sourceIds.map(map),
    })),
    relations: snapshot.relations.map((relation) => ({
      ...relation,
      id: map(relation.id),
      investigationId,
      from: map(relation.from),
      to: map(relation.to),
      sourceIds: relation.sourceIds.map(map),
    })),
  }
}
