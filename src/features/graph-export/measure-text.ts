export type MeasureText = (text: string, font: string) => number

/** Font stack of the exported drawing: a file opened elsewhere cannot rely on the app's fonts. */
export const EXPORT_FONT_FAMILY =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

/** Rough width: 0.6 em per character, from the pixel size found in a CSS font shorthand. */
export const estimateTextWidth: MeasureText = (text, font) => {
  const size = Number(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? 12)
  return Array.from(text).length * size * 0.6
}

let context: CanvasRenderingContext2D | null | undefined
const cache = new Map<string, number>()

function getContext(): CanvasRenderingContext2D | null {
  if (context !== undefined) return context
  try {
    // jsdom has no canvas and reports it through its console: skip the probe there.
    context = /jsdom/i.test(navigator.userAgent) ? null : document.createElement('canvas').getContext('2d')
  } catch {
    context = null
  }
  return context
}

/** Width measured by the browser with the export font, or an estimate when no canvas exists. */
export const measureText: MeasureText = (text, font) => {
  const ctx = getContext()
  if (!ctx) return estimateTextWidth(text, font)
  const key = `${font}|${text}`
  let width = cache.get(key)
  if (width === undefined) {
    ctx.font = font
    width = ctx.measureText(text).width
    cache.set(key, width)
  }
  return width
}
