import { useDeferredValue, useMemo } from 'react'
import { computeGraphView, searchTerms, type GraphFilters, type GraphView } from '@/domain/graph-view'
import type { Entity, Relation } from '@/domain/schemas'
import { useGraphStore } from '@/store/graph-store'
import { useViewStore } from '@/store/view-store'

let last: { entities: object; relations: object; key: string; filters: object; view: GraphView } | null = null

/** One entry is enough: the canvas and the search field ask for the same view at the same time. */
function sharedView(
  entities: Record<string, Entity>,
  relations: Record<string, Relation>,
  terms: string[],
  filters: GraphFilters,
): GraphView {
  const key = terms.join(' ')
  if (
    last?.entities !== entities ||
    last.relations !== relations ||
    last.key !== key ||
    last.filters !== filters
  ) {
    last = { entities, relations, key, filters, view: computeGraphView(entities, relations, terms, filters) }
  }
  return last.view
}

/** Which elements the current search dims or finds. */
export function useGraphView(): GraphView {
  const entities = useGraphStore((state) => state.entities)
  const relations = useGraphStore((state) => state.relations)
  const query = useDeferredValue(useViewStore((state) => state.query))
  const filters = useViewStore((state) => state.filters)
  return useMemo(
    () => sharedView(entities, relations, searchTerms(query), filters),
    [entities, relations, query, filters],
  )
}
