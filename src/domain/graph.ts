import type { Relation } from '@/domain/schemas'

/** Relations that would be left dangling once the given entities are removed. */
export function orphanedRelationIds(
  relations: Iterable<Relation>,
  removedEntityIds: Iterable<string>,
): string[] {
  const removed = new Set(removedEntityIds)
  const orphaned: string[] = []
  for (const relation of relations) {
    if (removed.has(relation.from) || removed.has(relation.to)) orphaned.push(relation.id)
  }
  return orphaned
}

/** Normalizes free-form tag input: trimmed, non-empty, de-duplicated (case-insensitive), order kept. */
export function normalizeTags(tags: Iterable<string>): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of tags) {
    const tag = raw.trim()
    const key = tag.toLocaleLowerCase()
    if (tag && !seen.has(key)) {
      seen.add(key)
      result.push(tag)
    }
  }
  return result
}
