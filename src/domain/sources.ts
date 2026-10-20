import { LIMITS, type Source } from '@/domain/schemas'

/** Why a source form cannot be saved; the UI turns each code into a message. */
export type SourceErrorCode = 'invalidUrl' | 'invalidDate' | 'empty'

/** Title, else the URL's host name, else `undefined` (the UI shows its "untitled" placeholder). */
export function sourceDisplayName(source: Pick<Source, 'title' | 'url'>): string | undefined {
  const title = source.title?.trim()
  if (title) return title
  if (source.url) {
    try {
      return new URL(source.url).hostname
    } catch {
      // Falls through: a stored URL is validated, but never trust it for display.
    }
  }
  return undefined
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
  url?: SourceErrorCode
  archiveUrl?: SourceErrorCode
  capturedAt?: SourceErrorCode
  form?: SourceErrorCode
}

/** Checks the form as typed; an empty object means it can be saved. */
export function validateSourceForm(values: SourceFormValues, hasScreenshot: boolean): SourceFormErrors {
  const errors: SourceFormErrors = {}
  const url = values.url.trim()
  const archiveUrl = values.archiveUrl.trim()
  if (url && !isHttpUrl(url)) errors.url = 'invalidUrl'
  if (archiveUrl && !isHttpUrl(archiveUrl)) errors.archiveUrl = 'invalidUrl'
  if (fromLocalInput(values.capturedAt) === null) errors.capturedAt = 'invalidDate'
  if (!values.title.trim() && !url && !hasScreenshot) errors.form = 'empty'
  return errors
}
