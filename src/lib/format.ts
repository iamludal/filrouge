const date = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' })
const dateTime = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
const dateTimeFull = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'medium' })

/** The day of an ISO instant in the viewer's time zone, e.g. "20 oct. 2026". */
export function formatDate(iso: string): string {
  return date.format(new Date(iso))
}

/** An ISO instant in the viewer's time zone, e.g. "20 oct. 2026, 14:32". */
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso))
}

/** An ISO instant with the full month and the seconds, e.g. "20 octobre 2026 à 14:32:05". */
export function formatDateTimeFull(iso: string): string {
  return dateTimeFull.format(new Date(iso))
}

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
