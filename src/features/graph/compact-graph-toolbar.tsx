import { ArrowLeft, Ellipsis, ListFilter, Paperclip, Redo2, Search, X } from 'lucide-react'
import { useState } from 'react'
import { useStore } from 'zustand'
import { routeHref } from '@/app/router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { activeCriteriaCount } from '@/domain/graph-view'
import { useGraphExports } from '@/features/graph-export/use-graph-exports'
import { HistoryControls } from '@/features/graph/history-controls'
import { SaveIndicator } from '@/features/graph/save-indicator'
import { FiltersDialog } from '@/features/graph-search/filters-panel'
import { SearchField } from '@/features/graph-search/search-field'
import { SourcesLibraryDialog } from '@/features/sources/sources-library-dialog'
import { useGraphStore } from '@/store/graph-store'
import { useViewStore } from '@/store/view-store'

/**
 * The graph toolbar on narrow screens: the essentials stay in the bar, everything else lives in the
 * "Plus d’actions" menu. A new toolbar action must be added to this menu too.
 */
export function CompactGraphToolbar({ name, onExportJson }: { name: string; onExportJson: () => void }) {
  const [searching, setSearching] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const activeFilters = useViewStore((state) => activeCriteriaCount(state.filters))
  const canRedo = useStore(useGraphStore.temporal, (state) => state.futureStates.length > 0)
  const sourceCount = useGraphStore((state) => Object.keys(state.sources).length)
  const { empty, exportPng, exportSvg, pngDialog } = useGraphExports()

  const closeSearch = () => {
    useViewStore.getState().setQuery('')
    setSearching(false)
  }

  return (
    <div className="flex h-12 shrink-0 items-center gap-1 border-b px-1">
      {searching ? (
        <>
          <SearchField fullWidth />
          <Button variant="ghost" size="icon" className="size-11 shrink-0" onClick={closeSearch}>
            <X />
            <span className="sr-only">Fermer la recherche</span>
          </Button>
        </>
      ) : (
        <>
          <Button variant="ghost" size="icon" className="size-11 shrink-0" asChild>
            <a href={routeHref({ name: 'home' })} aria-label="Retour aux enquêtes">
              <ArrowLeft />
            </a>
          </Button>
          <h1 className="min-w-0 flex-1 truncate font-medium">{name}</h1>
          <SaveIndicator iconOnly />
          <Button
            variant="ghost"
            size="icon"
            className="size-11 shrink-0"
            aria-label="Rechercher dans le graphe"
            onClick={() => setSearching(true)}
          >
            <Search />
          </Button>
          <HistoryControls undoOnly />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative size-11 shrink-0"
                aria-label="Plus d’actions"
              >
                <Ellipsis />
                {activeFilters > 0 && (
                  <span
                    aria-hidden
                    data-testid="filters-dot"
                    className="absolute top-2.5 right-2.5 size-2 rounded-full bg-primary"
                  />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={!canRedo} onSelect={() => useGraphStore.getState().redo()}>
                <Redo2 /> Rétablir
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setFiltersOpen(true)}>
                <ListFilter /> Filtres
                {activeFilters > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {activeFilters}
                  </Badge>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSourcesOpen(true)}>
                <Paperclip /> Sources ({sourceCount})
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Exporter</DropdownMenuLabel>
                <DropdownMenuItem onSelect={onExportJson}>JSON</DropdownMenuItem>
                <DropdownMenuItem disabled={empty} onSelect={exportPng}>
                  PNG
                </DropdownMenuItem>
                <DropdownMenuItem disabled={empty} onSelect={exportSvg}>
                  SVG
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
      <FiltersDialog open={filtersOpen} onOpenChange={setFiltersOpen} />
      <SourcesLibraryDialog open={sourcesOpen} onOpenChange={setSourcesOpen} />
      {pngDialog}
    </div>
  )
}
