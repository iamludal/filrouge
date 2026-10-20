const MAX_SIDE = 16_384
const MAX_AREA = 16_777_216

/** Scales offered for the PNG, relative to the drawing size. */
export const PNG_SCALES = [1, 2, 4, 8] as const
export type PngScale = (typeof PNG_SCALES)[number]
/** Sharp when enlarged in a document; a small graph is only a few hundred pixels wide. */
export const DEFAULT_PNG_SCALE: PngScale = 4

export interface PngSize {
  width: number
  height: number
  /** Scale actually applied, lower than the requested one when limited. */
  scale: number
  limited: boolean
}

/** Size of the PNG at `scale`, scaled down to stay within browser canvas limits. */
export function pngSize(width: number, height: number, scale: number = DEFAULT_PNG_SCALE): PngSize {
  const effective = Math.min(
    scale,
    MAX_SIDE / width,
    MAX_SIDE / height,
    Math.sqrt(MAX_AREA / (width * height)),
  )
  // The epsilon absorbs float error, e.g. 20000 * (16384 / 20000) = 16383.999…
  return {
    width: Math.max(1, Math.floor(width * effective + 1e-6)),
    height: Math.max(1, Math.floor(height * effective + 1e-6)),
    scale: effective,
    limited: effective < scale,
  }
}

/**
 * Gives the SVG the PNG's pixel size (its viewBox is unchanged), so the browser rasterises the
 * vector drawing at full resolution instead of enlarging a bitmap of its original size.
 */
export function sizedSvg(svg: string, width: number, height: number): string {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const root = doc.documentElement
  if (root.nodeName !== 'svg' || doc.querySelector('parsererror')) throw new Error('Invalid SVG')
  root.setAttribute('width', String(width))
  root.setAttribute('height', String(height))
  return new XMLSerializer().serializeToString(doc)
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('SVG image failed to load'))
    image.src = url
  })
}

/** Rasterises an SVG drawing of `width` × `height` to a PNG at `scale`, on a white background. */
export async function svgToPng(
  svg: string,
  width: number,
  height: number,
  scale: number = DEFAULT_PNG_SCALE,
): Promise<Blob> {
  const size = pngSize(width, height, scale)
  const sized = sizedSvg(svg, size.width, size.height)
  const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const image = await loadImage(url)
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas unavailable')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, size.width, size.height)
    context.drawImage(image, 0, 0, size.width, size.height)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png'),
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}
