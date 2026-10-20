import { create } from 'zustand'
import { EMPTY_FILTERS, type ElementRef, type GraphFilters } from '@/domain/graph-view'

/**
 * How the open graph is looked at: search and filters. A plain store, apart from the graph store,
 * so it is never part of the undo history, never saved and never exported.
 */
interface ViewState {
  query: string
  /** The result the user last navigated to; cleared whenever the query changes. */
  currentResult: ElementRef | null
  filters: GraphFilters

  setQuery: (query: string) => void
  setCurrentResult: (result: ElementRef | null) => void
  setFilters: (patch: Partial<GraphFilters>) => void
  resetFilters: () => void
  reset: () => void
}

const INITIAL = { query: '', currentResult: null, filters: EMPTY_FILTERS } as const

export const useViewStore = create<ViewState>()((set) => ({
  ...INITIAL,
  setQuery: (query) => set({ query, currentResult: null }),
  setCurrentResult: (currentResult) => set({ currentResult }),
  setFilters: (patch) => set((state) => ({ filters: { ...state.filters, ...patch } })),
  resetFilters: () => set({ filters: EMPTY_FILTERS }),
  reset: () => set(INITIAL),
}))
