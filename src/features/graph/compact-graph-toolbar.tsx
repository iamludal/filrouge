import { ArrowLeft, Ellipsis, Eye, LayoutGrid, ListFilter, Paperclip, Redo2, Search, X } from 'lucide-react'
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { isDefaultDisplay } from '@/domain/display-options'
import { activeCriteriaCount } from '@/domain/graph-view'
import { useGraphExports } from '@/features/graph-export/use-graph-exports'
import { DisplayMenuItems } from '@/features/graph/display-menu'
import { LayoutMenuItems } from '@/features/graph-layout/layout-menu'
import { useCanLayout } from '@/features/graph-layout/use-auto-layout'
import { HistoryControls } from '@/features/graph/history-controls'
import { SaveIndicator } from '@/features/graph/save-indicator'
import { FiltersDialog } from '@/features/graph-search/filters-panel'
import { SearchField } from '@/features/graph-search/search-field'
import { SourcesLibraryDialog } from '@/features/sources/sources-library-dialog'
import { useDisplayStore } from '@/store/display-store'
import { useGraphStore } from '@/store/graph-store'
import { useViewStore } from '@/store/view-store'
import { useI18n } from '@/i18n/locale'

/**
 * The graph toolbar on narrow screens: the essentials stay in the bar, everything else lives in the
 * "Plus d'actions" menu. A new toolbar action must be added to this menu too.
 */
export function CompactGraphToolbar({ name, onExportJson }: { name: string; onExportJson: () => void }) {
  const { t } = useI18n()
  const [searching, setSearching] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const activeFilters = useViewStore((state) => activeCriteriaCount(state.filters))
  const displayChanged = useDisplayStore((state) => !isDefaultDisplay(state.options))
  const canRedo = useStore(useGraphStore.temporal, (state) => state.futureStates.length > 0)
  const sourceCount = useGraphStore((state) => Object.keys(state.sources).length)
  const canLayout = useCanLayout()
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
            <span className="sr-only">{t.graph.toolbar.closeSearch}</span>
          </Button>
        </>
      ) : (
        <>
          <Button variant="ghost" size="icon" className="size-11 shrink-0" asChild>
            <a href={routeHref({ name: 'home' })} aria-label={t.graph.backHome}>
              <ArrowLeft />
            </a>
          </Button>
          <h1 className="min-w-0 flex-1 truncate font-medium">{name}</h1>
          <SaveIndicator iconOnly />
          <Button
            variant="ghost"
            size="icon"
            className="size-11 shrink-0"
            aria-label={t.graph.toolbar.search}
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
                aria-label={t.graph.toolbar.moreActions}
              >
                <Ellipsis />
                {(activeFilters > 0 || displayChanged) && (
                  <span
                    aria-hidden
                    data-testid="menu-dot"
                    className="absolute top-2.5 right-2.5 size-2 rounded-full bg-primary"
                  />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={!canRedo} onSelect={() => useGraphStore.getState().redo()}>
                <Redo2 /> {t.graph.toolbar.redo}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setFiltersOpen(true)}>
                <ListFilter /> {t.graph.toolbar.filters}
                {activeFilters > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {activeFilters}
                  </Badge>
                )}
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Eye /> {t.graph.display.menu}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DisplayMenuItems />
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger
                  disabled={!canLayout}
                  className="data-disabled:pointer-events-none data-disabled:opacity-50"
                >
                  <LayoutGrid /> {t.graph.layout.menu}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <LayoutMenuItems />
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem onSelect={() => setSourcesOpen(true)}>
                <Paperclip /> {t.graph.toolbar.sources(sourceCount)}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>{t.graph.toolbar.export}</DropdownMenuLabel>
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
