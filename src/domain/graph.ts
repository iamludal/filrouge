import type { Relation, Source } from '@/domain/schemas'

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

/** How many entities and relations reference each source. Unused sources are absent. */
export function sourceUsage(elements: Iterable<{ sourceIds: readonly string[] }>): Map<string, number> {
  const usage = new Map<string, number>()
  for (const element of elements) {
    for (const sourceId of new Set(element.sourceIds)) usage.set(sourceId, (usage.get(sourceId) ?? 0) + 1)
  }
  return usage
}

/**
 * The source, other than `excludeId`, holding a screenshot with this SHA-256, either as stored or
 * as the original file of an optimized one.
 */
export function findDuplicateSource(
  sources: Iterable<Source>,
  sha256: string,
  excludeId?: string,
): Source | undefined {
  for (const source of sources) {
    if (source.id === excludeId) continue
    if (source.sha256 === sha256 || source.originalSha256 === sha256) return source
  }
  return undefined
}
