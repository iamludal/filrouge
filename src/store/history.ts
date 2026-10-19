import type { Entity, Relation, Source } from '@/domain/schemas'

/** The part of the graph state the edit history records. */
export interface RecordMaps {
  entities: Record<string, Entity>
  relations: Record<string, Relation>
  sources: Record<string, Source>
}

export type RecordKind = keyof RecordMaps

/** Most recent steps kept in the history. */
export const HISTORY_LIMIT = 100
/** Consecutive edits of one field closer than this form a single step. */
export const GROUP_WINDOW_MS = 1000

export function pickRecords(state: RecordMaps): RecordMaps {
  return { entities: state.entities, relations: state.relations, sources: state.sources }
}

/** Nothing recordable changed: the history ignores the update. */
export function sameRecords(a: RecordMaps, b: RecordMaps): boolean {
  return a.entities === b.entities && a.relations === b.relations && a.sources === b.sources
}

export interface RecordDiff {
  /** Ids absent before, or present as a different object. */
  upserted: string[]
  /** Ids present before and absent after. */
  removed: string[]
}

export type StateDiff = Record<RecordKind, RecordDiff>

function diffMap<T>(before: Record<string, T>, after: Record<string, T>): RecordDiff {
  if (before === after) return { upserted: [], removed: [] }
  const upserted = Object.keys(after).filter((id) => before[id] !== after[id])
  const removed = Object.keys(before).filter((id) => !(id in after))
  return { upserted, removed }
}

/** What storage must be told after the records went from `before` to `after`. */
export function diffRecords(before: RecordMaps, after: RecordMaps): StateDiff {
  return {
    entities: diffMap(before.entities, after.entities),
    relations: diffMap(before.relations, after.relations),
    sources: diffMap(before.sources, after.sources),
  }
}

/**
 * Merges bursts of edits to one field into a single history step. An action declares its group
 * with `group(key, run)`; a recorded change in the same group, less than `windowMs` after the
 * previous one, extends the previous step instead of adding a new one. Any other recorded
 * change, or `reset()`, ends the group.
 */
export function createGrouping(windowMs = GROUP_WINDOW_MS, clock: () => number = () => Date.now()) {
  let declared: string | undefined
  let last: { key: string; at: number } | undefined

  return {
    group<T>(key: string, run: () => T): T {
      declared = key
      try {
        return run()
      } finally {
        declared = undefined
      }
    },

    reset() {
      declared = undefined
      last = undefined
    },

    /** Wraps zundo's recording function, to be returned from its `handleSet` option. */
    handleSet:
      <A extends unknown[]>(record: (...args: A) => void) =>
      (...args: A) => {
        const key = declared
        const now = clock()
        if (key && last?.key === key && now - last.at < windowMs) {
          last.at = now
          return
        }
        last = key ? { key, at: now } : undefined
        record(...args)
      },
  }
}

export type Grouping = ReturnType<typeof createGrouping>
