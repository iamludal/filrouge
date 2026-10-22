import { create } from 'zustand'
import { EMPTY_FILTERS, type ElementRef, type GraphFilters } from '@/domain/graph-view'
import type { Entity, Position } from '@/domain/schemas'

/** Entities just moved by an automatic layout, which the canvas glides to their new positions. */
export interface LayoutTransition {
  /** Stored positions before the layout. */
  from: Record<string, Position>
  /** The graph store's entities right after the layout: any other edit ends the transition. */
  entities: Record<string, Entity>
  /** False when the system asks for reduced motion: the canvas only fits the view. */
  animate: boolean
}

/**
 * How the open graph is looked at: search, filters and the transition of a layout. A plain store, apart from the graph store,
 * so it is never part of the undo history, never saved and never exported.
 */
interface ViewState {
  query: string
  /** The result the user last navigated to; cleared whenever the query changes. */
  currentResult: ElementRef | null
  filters: GraphFilters
  layoutTransition: LayoutTransition | null

  setQuery: (query: string) => void
  setCurrentResult: (result: ElementRef | null) => void
  setFilters: (patch: Partial<GraphFilters>) => void
  resetFilters: () => void
  setLayoutTransition: (transition: LayoutTransition | null) => void
  reset: () => void
}

const INITIAL = { query: '', currentResult: null, filters: EMPTY_FILTERS, layoutTransition: null } as const

export const useViewStore = create<ViewState>()((set) => ({
  ...INITIAL,
  setQuery: (query) => set({ query, currentResult: null }),
  setCurrentResult: (currentResult) => set({ currentResult }),
  setFilters: (patch) => set((state) => ({ filters: { ...state.filters, ...patch } })),
  resetFilters: () => set({ filters: EMPTY_FILTERS }),
  setLayoutTransition: (layoutTransition) => set({ layoutTransition }),
  reset: () => set(INITIAL),
}))
