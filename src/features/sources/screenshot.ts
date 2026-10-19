import { detectImageMime, type ImageMime } from '@/domain/image-format'
import { LIMITS, type Attachment } from '@/domain/schemas'
import { sha256Hex } from '@/lib/hash'
import { newId } from '@/lib/ids'

export const SCREENSHOT_ERRORS = {
  format: 'Format non pris en charge (PNG, JPEG, WebP ou GIF)',
  size: 'Capture trop volumineuse (20 Mo maximum)',
  hash: 'Calcul d’empreinte indisponible',
} as const

export const ACCEPTED_IMAGES = 'image/png,image/jpeg,image/webp,image/gif'

export type ScreenshotResult = { ok: true; attachment: Attachment } | { ok: false; error: string }

/**
 * Turns a picked, dropped or pasted file into a screenshot. The size is checked before the bytes
 * are read, and the format comes from the content: the name and declared type are ignored.
 */
export async function intakeScreenshot(file: Blob, investigationId: string): Promise<ScreenshotResult> {
  if (file.size > LIMITS.attachmentBytes) return { ok: false, error: SCREENSHOT_ERRORS.size }
  const bytes = new Uint8Array(await file.arrayBuffer())
  const mime = detectImageMime(bytes)
  if (!mime) return { ok: false, error: SCREENSHOT_ERRORS.format }
  let sha256: string
  try {
    sha256 = await sha256Hex(bytes)
  } catch {
    return { ok: false, error: SCREENSHOT_ERRORS.hash }
  }
  return {
    ok: true,
    attachment: {
      id: newId(),
      investigationId,
      blob: new Blob([bytes as BlobPart], { type: mime }),
      mime,
      size: bytes.length,
      sha256,
    },
  }
}

const EXTENSIONS: Record<ImageMime, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export function screenshotFilename(attachment: Pick<Attachment, 'mime' | 'sha256'>): string {
  return `capture-${attachment.sha256.slice(0, 8)}.${EXTENSIONS[attachment.mime]}`
}
