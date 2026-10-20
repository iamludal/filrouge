import type { Locale } from '@/i18n/types'

/** Unit symbols of the byte formatter, supplied by the dictionary. */
export interface ByteUnits {
  byte: string
  kilobyte: string
  megabyte: string
}

export interface Formatters {
  /** The day of an ISO instant in the viewer's time zone, e.g. "20 oct. 2026". */
  formatDate: (iso: string) => string
  /** An ISO instant in the viewer's time zone, e.g. "20 oct. 2026, 14:32". */
  formatDateTime: (iso: string) => string
  /** An ISO instant with the full month and the seconds, e.g. "20 octobre 2026 à 14:32:05". */
  formatDateTimeFull: (iso: string) => string
  /** A byte count in binary steps, e.g. "812 Ko" or "8,4 Mo" in French, "8.4 MB" in English. */
  formatBytes: (bytes: number) => string
  formatNumber: (value: number) => string
}

const INTL_TAGS: Record<Locale, string> = { fr: 'fr-FR', en: 'en-US' }

interface IntlSet {
  date: Intl.DateTimeFormat
  dateTime: Intl.DateTimeFormat
  dateTimeFull: Intl.DateTimeFormat
  number: Intl.NumberFormat
  oneDecimal: Intl.NumberFormat
  noDecimal: Intl.NumberFormat
}

const intlSets = new Map<Locale, IntlSet>()

function intlSet(locale: Locale): IntlSet {
  let set = intlSets.get(locale)
  if (!set) {
    const tag = INTL_TAGS[locale]
    set = {
      date: new Intl.DateTimeFormat(tag, { dateStyle: 'medium' }),
      dateTime: new Intl.DateTimeFormat(tag, { dateStyle: 'medium', timeStyle: 'short' }),
      dateTimeFull: new Intl.DateTimeFormat(tag, { dateStyle: 'long', timeStyle: 'medium' }),
      number: new Intl.NumberFormat(tag),
      oneDecimal: new Intl.NumberFormat(tag, { maximumFractionDigits: 1 }),
      noDecimal: new Intl.NumberFormat(tag, { maximumFractionDigits: 0 }),
    }
    intlSets.set(locale, set)
  }
  return set
}

/** Formatters following the conventions of `locale`; the `Intl` instances are cached per locale. */
export function createFormatters(locale: Locale, units: ByteUnits): Formatters {
  const set = intlSet(locale)
  return {
    formatDate: (iso) => set.date.format(new Date(iso)),
    formatDateTime: (iso) => set.dateTime.format(new Date(iso)),
    formatDateTimeFull: (iso) => set.dateTimeFull.format(new Date(iso)),
    formatBytes: (bytes) => {
      if (bytes < 1024) return `${bytes} ${units.byte}`
      const kib = bytes / 1024
      if (kib < 1024) return `${Math.round(kib)} ${units.kilobyte}`
      const mib = kib / 1024
      return `${(mib < 10 ? set.oneDecimal : set.noDecimal).format(mib)} ${units.megabyte}`
    },
    formatNumber: (value) => set.number.format(value),
  }
}

/** Cuts `text` to `max` characters (code points) with a trailing "…". */
export function truncate(text: string, max: number): string {
  const chars = Array.from(text)
  return chars.length <= max ? text : `${chars.slice(0, max - 1).join('')}…`
}
