import { z } from 'zod'
import { ENTITY_TYPE_IDS } from '@/domain/entity-types'
import { IMAGE_MIME_TYPES } from '@/domain/image-format'

// Zod's JIT compiles validators with `new Function`, which the CSP forbids (no 'unsafe-eval').
z.config({ jitless: true })

export const SCHEMA_VERSION = 1

// Upper bounds keep hostile imports from exhausting memory or the renderer.
export const LIMITS = {
  name: 200,
  label: 500,
  text: 100_000,
  url: 2_048,
  tag: 100,
  tags: 100,
  propertyKey: 100,
  propertyValue: 10_000,
  properties: 200,
  sourceIds: 500,
  attachmentBytes: 20 * 1024 * 1024,
} as const

const id = z.uuid()
const isoDate = z.iso.datetime({ offset: false })
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)

export const confidenceSchema = z.object({
  reliability: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
  credibility: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
})

export const statusSchema = z.enum(['verified', 'hypothesis'])

export const entityTypeIdSchema = z.enum(ENTITY_TYPE_IDS)

/** Property values are restricted to JSON primitives: no nested structure to render. */
export const propertyValueSchema = z.union([
  z.string().max(LIMITS.propertyValue),
  z.number(),
  z.boolean(),
  z.null(),
])

export const propertiesSchema = z
  .record(z.string().min(1).max(LIMITS.propertyKey), propertyValueSchema)
  .refine((record) => Object.keys(record).length <= LIMITS.properties, {
    message: `Au plus ${LIMITS.properties} propriétés`,
  })

export const positionSchema = z.object({ x: z.number().finite(), y: z.number().finite() })

export const investigationSchema = z.object({
  id,
  name: z.string().trim().min(1).max(LIMITS.name),
  description: z.string().max(LIMITS.text).optional(),
  createdAt: isoDate,
  updatedAt: isoDate,
  schemaVersion: z.number().int().positive(),
  encrypted: z.boolean(),
})

export const entitySchema = z.object({
  id,
  investigationId: id,
  type: entityTypeIdSchema,
  label: z.string().max(LIMITS.label),
  properties: propertiesSchema,
  tags: z.array(z.string().trim().min(1).max(LIMITS.tag)).max(LIMITS.tags),
  notes: z.string().max(LIMITS.text).optional(),
  sourceIds: z.array(id).max(LIMITS.sourceIds),
  confidence: confidenceSchema.optional(),
  status: statusSchema,
  position: positionSchema,
  createdAt: isoDate,
  updatedAt: isoDate,
})

export const relationSchema = z.object({
  id,
  investigationId: id,
  from: id,
  to: id,
  label: z.string().max(LIMITS.label),
  directed: z.boolean(),
  sourceIds: z.array(id).max(LIMITS.sourceIds),
  confidence: confidenceSchema.optional(),
  status: statusSchema,
  createdAt: isoDate,
  updatedAt: isoDate,
})

export const sourceSchema = z.object({
  id,
  investigationId: id,
  url: z
    .url({ protocol: /^https?$/ })
    .max(LIMITS.url)
    .optional(),
  title: z.string().max(LIMITS.label).optional(),
  capturedAt: isoDate,
  archiveUrl: z
    .url({ protocol: /^https?$/ })
    .max(LIMITS.url)
    .optional(),
  attachmentId: id.optional(),
  sha256: sha256.optional(),
  /** SHA-256 of the file as added, when the stored screenshot was optimized. */
  originalSha256: sha256.optional(),
  note: z.string().max(LIMITS.text).optional(),
})

export const attachmentSchema = z.object({
  id,
  investigationId: id,
  blob: z.instanceof(Blob),
  mime: z.enum(IMAGE_MIME_TYPES),
  size: z.number().int().nonnegative().max(LIMITS.attachmentBytes),
  sha256,
  originalSha256: sha256.optional(),
  originalSize: z.number().int().nonnegative().optional(),
})

export type Confidence = z.infer<typeof confidenceSchema>
export type Status = z.infer<typeof statusSchema>
export type PropertyValue = z.infer<typeof propertyValueSchema>
export type Position = z.infer<typeof positionSchema>
export type Investigation = z.infer<typeof investigationSchema>
export type Entity = z.infer<typeof entitySchema>
export type Relation = z.infer<typeof relationSchema>
export type Source = z.infer<typeof sourceSchema>
export type Attachment = z.infer<typeof attachmentSchema>

/** An investigation with everything it contains (attachments excluded). */
export interface InvestigationSnapshot {
  investigation: Investigation
  entities: Entity[]
  relations: Relation[]
  sources: Source[]
}
