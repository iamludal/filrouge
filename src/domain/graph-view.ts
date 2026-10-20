import { ENTITY_TYPE_IDS, type EntityTypeId } from '@/domain/entity-types'
import { circleCenter } from '@/domain/graph-geometry'
import type { Confidence, Entity, Position, Relation, Status } from '@/domain/schemas'

/** An entity or a relation, the two kinds of element of a graph. */
export interface ElementRef {
  type: 'entity' | 'relation'
  id: string
}

type Reliability = Confidence['reliability']
type Credibility = Confidence['credibility']

/**
 * Criteria that dim what does not match them. An empty or `null` criterion lets everything through;
 * values within a criterion are alternatives, and criteria combine.
 */
export interface GraphFilters {
  types: EntityTypeId[]
  /** Lower-cased: tags are compared ignoring case. */
  tags: string[]
  entityStatus: Status | null
  relationStatus: Status | null
  /** Worst reliability still accepted ("au moins B"); `null` accepts every grade. */
  minReliability: Exclude<Reliability, 'F'> | null
  /** Worst credibility still accepted ("au moins 2"); `null` accepts every grade. */
  minCredibility: Exclude<Credibility, 6> | null
  includeUngraded: boolean
}

export const EMPTY_FILTERS: GraphFilters = {
  types: [],
  tags: [],
  entityStatus: null,
  relationStatus: null,
  minReliability: null,
  minCredibility: null,
  includeUngraded: true,
}

const RELIABILITY_ORDER = 'ABCDEF'

function isConfidenceActive(filters: GraphFilters): boolean {
  return filters.minReliability !== null || filters.minCredibility !== null || !filters.includeUngraded
}

/** How many of the five criteria are set. */
export function activeCriteriaCount(filters: GraphFilters): number {
  return [
    filters.types.length > 0,
    filters.tags.length > 0,
    filters.entityStatus !== null,
    filters.relationStatus !== null,
    isConfidenceActive(filters),
  ].filter(Boolean).length
}

function passesConfidence(confidence: Confidence | undefined, filters: GraphFilters): boolean {
  if (!confidence) return filters.includeUngraded
  const { minReliability, minCredibility } = filters
  if (
    minReliability &&
    RELIABILITY_ORDER.indexOf(confidence.reliability) > RELIABILITY_ORDER.indexOf(minReliability)
  )
    return false
  return !minCredibility || confidence.credibility <= minCredibility
}

/** Type, tag, entity status and confidence apply to an entity. */
export function passesFilters(entity: Entity, filters: GraphFilters): boolean {
  if (filters.types.length > 0 && !filters.types.includes(entity.type)) return false
  if (filters.tags.length > 0 && !entity.tags.some((tag) => filters.tags.includes(tag.toLowerCase())))
    return false
  if (filters.entityStatus && entity.status !== filters.entityStatus) return false
  return passesConfidence(entity.confidence, filters)
}

/** Only relation status and confidence apply to a relation; its entities are checked apart. */
export function relationPassesFilters(relation: Relation, filters: GraphFilters): boolean {
  if (filters.relationStatus && relation.status !== filters.relationStatus) return false
  return passesConfidence(relation.confidence, filters)
}

export interface TypeOption {
  type: EntityTypeId
  count: number
}

/** The types in use, plus the checked ones that no entity uses any more, so they can be unchecked. */
export function typeOptions(
  entities: Readonly<Record<string, Entity>>,
  checked: readonly EntityTypeId[],
): TypeOption[] {
  const counts = new Map<EntityTypeId, number>()
  for (const entity of Object.values(entities)) counts.set(entity.type, (counts.get(entity.type) ?? 0) + 1)
  return ENTITY_TYPE_IDS.filter((type) => counts.has(type) || checked.includes(type)).map((type) => ({
    type,
    count: counts.get(type) ?? 0,
  }))
}

export interface TagOption {
  /** Lower-cased, as stored in the filters. */
  key: string
  /** The first spelling met. */
  label: string
  count: number
}

/** The tags in use, case-insensitively merged and sorted for `locale`, plus the checked ones no entity carries. */
export function tagOptions(
  entities: Readonly<Record<string, Entity>>,
  checked: readonly string[],
  locale: string,
): TagOption[] {
  const options = new Map<string, TagOption>()
  for (const entity of Object.values(entities)) {
    for (const tag of entity.tags) {
      const key = tag.toLowerCase()
      const option = options.get(key)
      if (option) option.count++
      else options.set(key, { key, label: tag, count: 1 })
    }
  }
  for (const key of checked) if (!options.has(key)) options.set(key, { key, label: key, count: 0 })
  return [...options.values()].sort((a, b) => a.label.localeCompare(b.label, locale, { sensitivity: 'base' }))
}

/** What the canvas needs to know about each element while a search or a filter is active. */
export interface GraphView {
  searching: boolean
  /** Every entity is dimmed by the filters, so there is nothing to look at. */
  nothingMatchesFilters: boolean
  dimmedEntityIds: ReadonlySet<string>
  dimmedRelationIds: ReadonlySet<string>
  /** Search results, ordered by their place on the graph (top to bottom, then left to right). */
  results: ElementRef[]
  /** Centre of each result on the canvas, by element id. */
  anchors: ReadonlyMap<string, Position>
}

/** Lower-cases and strips accents, so that "Société" matches "societe". */
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

/** The words of a query; an empty list means there is no search. */
export function searchTerms(query: string): string[] {
  return normalizeText(query).split(/\s+/).filter(Boolean)
}

// Store records are immutable: an edit creates a new object, which invalidates its cache entry.
const entityHaystacks = new WeakMap<Entity, string>()
const relationHaystacks = new WeakMap<Relation, string>()

/** The searched fields of an entity, normalised and separated by line breaks. */
export function entityHaystack(entity: Entity): string {
  let haystack = entityHaystacks.get(entity)
  if (haystack === undefined) {
    const values = Object.values(entity.properties).filter((value) => value !== null)
    haystack = normalizeText(
      [
        entity.label,
        ...Object.keys(entity.properties),
        ...values.map(String),
        entity.notes ?? '',
        ...entity.tags,
      ].join('\n'),
    )
    entityHaystacks.set(entity, haystack)
  }
  return haystack
}

export function relationHaystack(relation: Relation): string {
  let haystack = relationHaystacks.get(relation)
  if (haystack === undefined) {
    haystack = normalizeText(relation.label)
    relationHaystacks.set(relation, haystack)
  }
  return haystack
}

/** Terms hold no whitespace, so none can match across two fields. */
function matchesAll(haystack: string, terms: readonly string[]): boolean {
  return terms.every((term) => haystack.includes(term))
}

function byPlace(a: { anchor: Position; id: string }, b: { anchor: Position; id: string }): number {
  return a.anchor.y - b.anchor.y || a.anchor.x - b.anchor.x || a.id.localeCompare(b.id)
}

/**
 * Which elements are dimmed and which are search results. Filters come first: a filtered-out
 * element is dimmed and never a result. A relation is dimmed when it fails its own criteria or
 * when one of its entities is filtered out, and is placed at the middle of its two circles.
 */
export function computeGraphView(
  entities: Readonly<Record<string, Entity>>,
  relations: Readonly<Record<string, Relation>>,
  terms: readonly string[],
  filters: GraphFilters = EMPTY_FILTERS,
): GraphView {
  const searching = terms.length > 0
  const found: { ref: ElementRef; anchor: Position; id: string }[] = []
  const dimmedEntityIds = new Set<string>()
  const dimmedRelationIds = new Set<string>()
  const filteredOutEntityIds = new Set<string>()

  for (const entity of Object.values(entities)) {
    if (!passesFilters(entity, filters)) {
      filteredOutEntityIds.add(entity.id)
      dimmedEntityIds.add(entity.id)
    } else if (searching && !matchesAll(entityHaystack(entity), terms)) {
      dimmedEntityIds.add(entity.id)
    } else if (searching) {
      found.push({
        ref: { type: 'entity', id: entity.id },
        anchor: circleCenter(entity.position),
        id: entity.id,
      })
    }
  }

  for (const relation of Object.values(relations)) {
    const from = entities[relation.from]
    const to = entities[relation.to]
    const shown =
      from &&
      to &&
      !filteredOutEntityIds.has(from.id) &&
      !filteredOutEntityIds.has(to.id) &&
      relationPassesFilters(relation, filters)
    if (!shown || (searching && !matchesAll(relationHaystack(relation), terms))) {
      dimmedRelationIds.add(relation.id)
    } else if (searching) {
      const a = circleCenter(from.position)
      const b = circleCenter(to.position)
      found.push({
        ref: { type: 'relation', id: relation.id },
        anchor: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        id: relation.id,
      })
    }
  }

  found.sort(byPlace)
  const entityCount = Object.keys(entities).length
  return {
    searching,
    nothingMatchesFilters: entityCount > 0 && filteredOutEntityIds.size === entityCount,
    dimmedEntityIds,
    dimmedRelationIds,
    results: found.map((item) => item.ref),
    anchors: new Map(found.map((item) => [item.id, item.anchor])),
  }
}
