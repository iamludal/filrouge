import { detectImageMime } from '@/domain/image-format'
import type { Attachment } from '@/domain/schemas'
import { sha256Hex } from '@/lib/hash'
import { newId } from '@/lib/ids'

/** Screenshots at or under this size are not worth optimizing. */
export const OPTIMIZE_THRESHOLD_BYTES = 2 * 1024 * 1024
const QUALITY = 0.85

export type EncodeMime = 'image/webp' | 'image/jpeg'
/** Re-encodes an image at the same resolution; may return a Blob of another type if unsupported. */
export type ImageEncoder = (image: Blob, mime: EncodeMime, quality: number) => Promise<Blob | null>

/** Optimization is offered for large PNG, JPEG and WebP images; GIF would lose its animation. */
export function canOptimize(attachment: Pick<Attachment, 'mime' | 'size'>): boolean {
  return attachment.mime !== 'image/gif' && attachment.size > OPTIMIZE_THRESHOLD_BYTES
}

export const browserEncoder: ImageEncoder = async (image, mime, quality) => {
  const bitmap = await createImageBitmap(image)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext('2d')
    if (!context) return null
    if (mime === 'image/jpeg') {
      // JPEG has no transparency: avoid a black background.
      context.fillStyle = '#fff'
      context.fillRect(0, 0, canvas.width, canvas.height)
    }
    context.drawImage(bitmap, 0, 0)
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, quality))
  } finally {
    bitmap.close()
  }
}

export type OptimizeResult =
  { ok: true; attachment: Attachment } | { ok: false; reason: 'no-gain' | 'unavailable' }

/**
 * Re-encodes a screenshot as WebP (JPEG when the browser cannot write WebP). The result is a new
 * attachment that remembers the fingerprint and size of the original file. When the output is not
 * smaller, nothing is returned and the original should be kept.
 */
export async function optimizeAttachment(
  original: Attachment,
  encode: ImageEncoder = browserEncoder,
): Promise<OptimizeResult> {
  for (const mime of ['image/webp', 'image/jpeg'] as const) {
    let encoded: Blob | null
    try {
      encoded = await encode(original.blob, mime, QUALITY)
    } catch {
      return { ok: false, reason: 'unavailable' }
    }
    if (!encoded) continue
    const bytes = new Uint8Array(await encoded.arrayBuffer())
    // Browsers silently fall back to PNG when they cannot write the requested type.
    if (detectImageMime(bytes) !== mime) continue
    if (bytes.length >= original.size) return { ok: false, reason: 'no-gain' }
    return {
      ok: true,
      attachment: {
        id: newId(),
        investigationId: original.investigationId,
        blob: new Blob([bytes as BlobPart], { type: mime }),
        mime,
        size: bytes.length,
        sha256: await sha256Hex(bytes),
        originalSha256: original.originalSha256 ?? original.sha256,
        originalSize: original.originalSize ?? original.size,
      },
    }
  }
  return { ok: false, reason: 'unavailable' }
}
