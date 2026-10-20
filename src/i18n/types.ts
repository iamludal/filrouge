import type { fr } from './messages/fr'

export const LOCALES = ['fr', 'en'] as const
export type Locale = (typeof LOCALES)[number]

/** Widens the literal types of `as const` dictionaries so other languages can supply other texts. */
type Widen<T> = T extends string
  ? string
  : T extends (...args: infer Args) => string
    ? (...args: Args) => string
    : T extends readonly unknown[]
      ? readonly string[]
      : { -readonly [K in keyof T]: Widen<T[K]> }

/** Every language must provide exactly the keys of the French dictionary. */
export type Messages = Widen<typeof fr>
