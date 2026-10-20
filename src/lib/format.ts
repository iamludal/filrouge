/** A byte count in French units, e.g. "812 Ko" or "8,4 Mo". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  const kib = bytes / 1024
  if (kib < 1024) return `${Math.round(kib)} Ko`
  const mib = kib / 1024
  return `${mib.toLocaleString('fr-FR', { maximumFractionDigits: mib < 10 ? 1 : 0 })} Mo`
}

/** Cuts `text` to `max` characters (code points) with a trailing "…". */
export function truncate(text: string, max: number): string {
  const chars = Array.from(text)
  return chars.length <= max ? text : `${chars.slice(0, max - 1).join('')}…`
}
