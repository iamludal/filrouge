import { z } from 'zod'
import { detectImageMime, IMAGE_MIME_TYPES } from '@/domain/image-format'
import {
  attachmentSchema,
  entitySchema,
  investigationSchema,
  LIMITS,
  relationSchema,
  SCHEMA_VERSION,
  sourceSchema,
  type Attachment,
  type InvestigationSnapshot,
} from '@/domain/schemas'
import { base64ToBytes, bytesToBase64 } from '@/lib/base64'
import { sha256Hex } from '@/lib/hash'
import { newId, nowIso } from '@/lib/ids'

export const EXPORT_FORMAT = 'filrouge.investigation'
export const MAX_IMPORT_BYTES = 200 * 1024 * 1024

const MAX_ITEMS = 100_000
const MAX_ATTACHMENTS = 10_000
const MAX_BASE64_LENGTH = Math.ceil(LIMITS.attachmentBytes / 3) * 4

const hex64 = z.string().regex(/^[a-f0-9]{64}$/)

/** A screenshot as written in the export file: the Blob becomes base64 `data`. */
export const exportedAttachmentSchema = z.object({
  id: z.uuid(),
  investigationId: z.uuid(),
  mime: z.enum(IMAGE_MIME_TYPES),
  size: z.number().int().nonnegative().max(LIMITS.attachmentBytes),
  sha256: hex64,
  originalSha256: hex64.optional(),
  originalSize: z.number().int().nonnegative().optional(),
  data: z.string().max(MAX_BASE64_LENGTH),
})

export type ExportedAttachment = z.infer<typeof exportedAttachmentSchema>

export const exportFileSchema = z
  .object({
    format: z.literal(EXPORT_FORMAT),
    schemaVersion: z.literal(SCHEMA_VERSION),
    exportedAt: z.iso.datetime({ offset: false }),
    investigation: investigationSchema,
    entities: z.array(entitySchema).max(MAX_ITEMS),
    relations: z.array(relationSchema).max(MAX_ITEMS),
    sources: z.array(sourceSchema).max(MAX_ITEMS),
    // Files exported before screenshots existed have no such list.
    attachments: z.array(exportedAttachmentSchema).max(MAX_ATTACHMENTS).default([]),
  })
  .superRefine((file, ctx) => {
    const investigationId = file.investigation.id
    const ids = new Set<string>([investigationId])
    const entityIds = new Set(file.entities.map((entity) => entity.id))
    const sourceIds = new Set(file.sources.map((source) => source.id))
    const attachmentIds = new Set(file.attachments.map((attachment) => attachment.id))

    const collections = [
      ['entities', file.entities],
      ['relations', file.relations],
      ['sources', file.sources],
      ['attachments', file.attachments],
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

    file.sources.forEach((source, index) => {
      if (source.attachmentId && !attachmentIds.has(source.attachmentId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['sources', index, 'attachmentId'],
          message: 'Capture inconnue',
        })
      }
    })
  })

export type ExportFile = z.infer<typeof exportFileSchema>

/** An investigation with its screenshots. The snapshot itself stays free of Blobs. */
export interface InvestigationExport {
  snapshot: InvestigationSnapshot
  attachments: Attachment[]
}

/**
 * Rough size of an export file with its screenshots: the JSON without them, plus base64 (4 bytes
 * for every 3) and a fixed overhead for each screenshot's metadata.
 */
export function estimateExportBytes(
  baseJsonLength: number,
  attachments: { count: number; totalSize: number },
): number {
  return baseJsonLength + Math.ceil(attachments.totalSize / 3) * 4 + attachments.count * 600
}

async function toExported(attachment: Attachment): Promise<ExportedAttachment> {
  const bytes = new Uint8Array(await attachment.blob.arrayBuffer())
  const { blob: _blob, ...fields } = attachment
  return { ...fields, data: bytesToBase64(bytes) }
}

/**
 * Builds the export file. Only the given attachments are embedded; a source whose screenshot is
 * not embedded keeps its fingerprints but loses the reference.
 */
export async function buildExport(
  snapshot: InvestigationSnapshot,
  attachments: Attachment[] = [],
): Promise<ExportFile> {
  const embedded = new Set(attachments.map((attachment) => attachment.id))
  const sources = snapshot.sources.map((source) => {
    if (!source.attachmentId || embedded.has(source.attachmentId)) return source
    const { attachmentId: _attachmentId, ...rest } = source
    return rest
  })
  return {
    format: EXPORT_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: nowIso(),
    ...snapshot,
    sources,
    attachments: await Promise.all(attachments.map(toExported)),
  }
}

export async function serializeExport(
  snapshot: InvestigationSnapshot,
  attachments: Attachment[] = [],
): Promise<string> {
  return JSON.stringify(await buildExport(snapshot, attachments), null, 2)
}

export type ParseResult =
  { ok: true; snapshot: InvestigationSnapshot; attachments: Attachment[] } | { ok: false; errors: string[] }

/** Decodes and checks every embedded screenshot against its declaration and its source. */
async function verifyAttachments(file: ExportFile): Promise<ParseResult> {
  const errors: string[] = []
  const attachments: Attachment[] = []
  const sourceByAttachment = new Map(
    file.sources.flatMap((source) => (source.attachmentId ? [[source.attachmentId, source] as const] : [])),
  )

  for (const [index, exported] of file.attachments.entries()) {
    const fail = (message: string) => errors.push(`attachments.${index} : ${message}`)
    const bytes = base64ToBytes(exported.data)
    if (!bytes) {
      fail('Contenu base64 invalide')
      continue
    }
    if (bytes.length > LIMITS.attachmentBytes) {
      fail('Capture trop volumineuse')
      continue
    }
    if (bytes.length !== exported.size) {
      fail('Taille incohérente')
      continue
    }
    const mime = detectImageMime(bytes)
    if (mime !== exported.mime) {
      fail('Format d’image incohérent')
      continue
    }
    const sha256 = await sha256Hex(bytes)
    if (sha256 !== exported.sha256) {
      fail('Empreinte incohérente')
      continue
    }
    const source = sourceByAttachment.get(exported.id)
    if (source?.sha256 && source.sha256 !== sha256) {
      fail('Empreinte différente de celle de la source')
      continue
    }
    const { data: _data, ...fields } = exported
    attachments.push(
      attachmentSchema.parse({ ...fields, blob: new Blob([bytes as BlobPart], { type: mime }) }),
    )
  }

  if (errors.length > 0) return { ok: false, errors: errors.slice(0, 5) }
  const { investigation, entities, relations, sources } = file
  return { ok: true, snapshot: { investigation, entities, relations, sources }, attachments }
}

/** Parses untrusted JSON text. Never throws; errors are short, display-safe strings. */
export async function parseExport(text: string): Promise<ParseResult> {
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

  return verifyAttachments(result.data)
}

/**
 * Gives every record a fresh id, screenshots included, preserving references. Used to import a
 * copy next to the original.
 */
export function remapIds({ snapshot, attachments }: InvestigationExport): InvestigationExport {
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
    snapshot: {
      investigation: { ...snapshot.investigation, id: investigationId },
      sources: snapshot.sources.map((source) => ({
        ...source,
        id: map(source.id),
        investigationId,
        ...(source.attachmentId ? { attachmentId: map(source.attachmentId) } : {}),
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
    },
    attachments: attachments.map((attachment) => ({
      ...attachment,
      id: map(attachment.id),
      investigationId,
    })),
  }
}
