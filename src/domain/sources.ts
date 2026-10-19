import { LIMITS, type Source } from '@/domain/schemas'

export const SOURCE_ERRORS = {
  url: 'URL invalide (http ou https)',
  date: 'Date de capture invalide',
  empty: 'Renseignez au moins un titre, une URL ou une capture',
} as const

/** Title, else the URL's host name, else a placeholder. Used wherever a source is listed. */
export function sourceDisplayName(source: Pick<Source, 'title' | 'url'>): string {
  const title = source.title?.trim()
  if (title) return title
  if (source.url) {
    try {
      return new URL(source.url).hostname
    } catch {
      // Falls through: a stored URL is validated, but never trust it for display.
    }
  }
  return 'Source sans titre'
}

/** True for an `http` or `https` URL of at most 2,048 characters. */
export function isHttpUrl(value: string): boolean {
  if (value.length > LIMITS.url) return false
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

/** An ISO date in UTC as the value of a `datetime-local` input (local time, to the minute). */
export function toLocalInput(iso: string): string {
  const date = new Date(iso)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** The inverse of `toLocalInput`: a local date and time becomes an ISO date in UTC, or `null`. */
export function fromLocalInput(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export interface SourceFormValues {
  title: string
  url: string
  archiveUrl: string
  capturedAt: string
  note: string
}

export interface SourceFormErrors {
  url?: string
  archiveUrl?: string
  capturedAt?: string
  form?: string
}

/** Checks the form as typed; an empty object means it can be saved. */
export function validateSourceForm(values: SourceFormValues, hasScreenshot: boolean): SourceFormErrors {
  const errors: SourceFormErrors = {}
  const url = values.url.trim()
  const archiveUrl = values.archiveUrl.trim()
  if (url && !isHttpUrl(url)) errors.url = SOURCE_ERRORS.url
  if (archiveUrl && !isHttpUrl(archiveUrl)) errors.archiveUrl = SOURCE_ERRORS.url
  if (fromLocalInput(values.capturedAt) === null) errors.capturedAt = SOURCE_ERRORS.date
  if (!values.title.trim() && !url && !hasScreenshot) errors.form = SOURCE_ERRORS.empty
  return errors
}

/** "Non utilisée", "1 utilisation", "3 utilisations". */
export function usageLabel(count: number): string {
  if (count === 0) return 'Non utilisée'
  return `${count} utilisation${count > 1 ? 's' : ''}`
}
