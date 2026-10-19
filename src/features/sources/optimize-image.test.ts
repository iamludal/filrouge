import type { Attachment } from '@/domain/schemas'
import {
  OPTIMIZE_THRESHOLD_BYTES,
  canOptimize,
  optimizeAttachment,
  type ImageEncoder,
} from '@/features/sources/optimize-image'

const MB = 1024 * 1024
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0))
const WEBP = (length: number) =>
  new Uint8Array([...ascii('RIFF'), 0, 0, 0, 0, ...ascii('WEBP'), ...new Array(length).fill(7)])
const JPEG = (length: number) => new Uint8Array([0xff, 0xd8, 0xff, ...new Array(length).fill(9)])

function original(size = 8 * MB, mime: Attachment['mime'] = 'image/png'): Attachment {
  return {
    id: crypto.randomUUID(),
    investigationId: crypto.randomUUID(),
    blob: new Blob([new Uint8Array(PNG)], { type: mime }),
    mime,
    size,
    sha256: 'a'.repeat(64),
  }
}

const blobOf = (bytes: Uint8Array, type: string) => new Blob([bytes as BlobPart], { type })

describe('canOptimize', () => {
  it('offers large PNG, JPEG and WebP only', () => {
    expect(canOptimize({ mime: 'image/png', size: OPTIMIZE_THRESHOLD_BYTES + 1 })).toBe(true)
    expect(canOptimize({ mime: 'image/jpeg', size: 5 * MB })).toBe(true)
    expect(canOptimize({ mime: 'image/webp', size: 5 * MB })).toBe(true)
    expect(canOptimize({ mime: 'image/png', size: MB })).toBe(false)
    expect(canOptimize({ mime: 'image/png', size: OPTIMIZE_THRESHOLD_BYTES })).toBe(false)
    expect(canOptimize({ mime: 'image/gif', size: 8 * MB })).toBe(false)
  })
})

describe('optimizeAttachment', () => {
  it('returns a smaller WebP that remembers the original fingerprint', async () => {
    const source = original()
    const encode: ImageEncoder = async () => blobOf(WEBP(1000), 'image/webp')
    const result = await optimizeAttachment(source, encode)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.attachment.mime).toBe('image/webp')
    expect(result.attachment.size).toBeLessThan(source.size)
    expect(result.attachment.sha256).toMatch(/^[a-f0-9]{64}$/)
    expect(result.attachment.sha256).not.toBe(source.sha256)
    expect(result.attachment.originalSha256).toBe(source.sha256)
    expect(result.attachment.originalSize).toBe(source.size)
    expect(result.attachment.id).not.toBe(source.id)
  })

  it('keeps the very first original when optimizing twice', async () => {
    const first = original()
    const encode: ImageEncoder = async () => blobOf(WEBP(1000), 'image/webp')
    const once = await optimizeAttachment(first, encode)
    if (!once.ok) throw new Error('expected a result')
    const again = await optimizeAttachment({ ...once.attachment, size: 5 * MB }, encode)
    expect(again.ok && again.attachment.originalSha256).toBe(first.sha256)
  })

  it('falls back to JPEG when the browser cannot write WebP', async () => {
    const encode: ImageEncoder = async (_image, mime) =>
      mime === 'image/webp' ? blobOf(new Uint8Array(PNG), 'image/png') : blobOf(JPEG(500), 'image/jpeg')
    const result = await optimizeAttachment(original(), encode)
    expect(result.ok && result.attachment.mime).toBe('image/jpeg')
  })

  it('reports no gain when the output is not smaller', async () => {
    const encode: ImageEncoder = async () => blobOf(WEBP(10), 'image/webp')
    expect(await optimizeAttachment(original(20), encode)).toEqual({ ok: false, reason: 'no-gain' })
  })

  it('reports unavailable when encoding fails or yields no image', async () => {
    const failing: ImageEncoder = async () => {
      throw new Error('boom')
    }
    expect(await optimizeAttachment(original(), failing)).toEqual({ ok: false, reason: 'unavailable' })
    const empty: ImageEncoder = async () => null
    expect(await optimizeAttachment(original(), empty)).toEqual({ ok: false, reason: 'unavailable' })
  })
})
