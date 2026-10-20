import { useReactFlow } from '@xyflow/react'
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import { useRef, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ElementRef } from '@/domain/graph-view'
import { useGraphView } from '@/features/graph-search/use-graph-view'
import { useSearchShortcut } from '@/features/graph-search/use-search-shortcut'
import { isApplePlatform, shortcutLabel } from '@/lib/platform'
import { cn } from '@/lib/utils'
import { useGraphStore } from '@/store/graph-store'
import { useViewStore } from '@/store/view-store'
import { useI18n } from '@/i18n/locale'
import type { Messages } from '@/i18n/types'

const sameRef = (a: ElementRef | null, b: ElementRef) => a?.type === b.type && a.id === b.id

function counterText(t: Messages, count: number, position: number): string {
  if (count === 0) return t.search.none
  if (position > 0) return t.search.position(position, count)
  return t.search.count(count)
}

/** Search box of the graph toolbar: finds elements, shows how many, and walks through them. */
export function SearchField({ fullWidth = false }: { fullWidth?: boolean }) {
  const { t } = useI18n()
  const query = useViewStore((state) => state.query)
  const currentResult = useViewStore((state) => state.currentResult)
  const view = useGraphView()
  const { setCenter, getZoom } = useReactFlow()
  const input = useRef<HTMLInputElement>(null)
  useSearchShortcut(input)

  const { results } = view
  const index = currentResult ? results.findIndex((ref) => sameRef(currentResult, ref)) : -1

  const goTo = (position: number) => {
    const result = results[(position + results.length) % results.length]
    const anchor = result && view.anchors.get(result.id)
    if (!result || !anchor) return
    useViewStore.getState().setCurrentResult(result)
    useGraphStore.getState().setSelection({
      entityIds: result.type === 'entity' ? [result.id] : [],
      relationIds: result.type === 'relation' ? [result.id] : [],
    })
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    void setCenter(anchor.x, anchor.y, { zoom: getZoom(), duration: reducedMotion ? 0 : 300 })
  }
  // Without a current result, "next" starts at the first one and "previous" at the last one.
  const next = () => goTo(index + 1)
  const previous = () => goTo(index === -1 ? results.length - 1 : index - 1)

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (event.shiftKey) previous()
      else next()
    } else if (event.key === 'Escape') {
      useViewStore.getState().setQuery('')
    }
  }

  const searching = view.searching
  const label = t.graph.toolbar.search

  return (
    <div role="search" className={cn('flex items-center gap-1', fullWidth && 'min-w-0 flex-1')}>
      <div className={cn('relative', fullWidth && 'min-w-0 flex-1')}>
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          ref={input}
          value={query}
          onChange={(event) => useViewStore.getState().setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          aria-label={label}
          title={`${label} (${shortcutLabel('search', isApplePlatform())})`}
          placeholder={t.search.placeholder}
          autoComplete="off"
          spellCheck={false}
          className={cn('pr-28 pl-7', fullWidth ? 'h-9 w-full' : 'h-7 w-64')}
          autoFocus={fullWidth}
        />
        <span
          aria-live="polite"
          className="pointer-events-none absolute top-1/2 right-8 -translate-y-1/2 text-xs text-muted-foreground"
        >
          {searching ? counterText(t, results.length, index + 1) : ''}
        </span>
        {query && (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={t.search.clear}
            className="absolute top-1/2 right-1 -translate-y-1/2"
            onClick={() => {
              useViewStore.getState().setQuery('')
              input.current?.focus()
            }}
          >
            <X />
          </Button>
        )}
      </div>
      {searching && (
        <>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t.search.previous}
            disabled={results.length === 0}
            onClick={previous}
          >
            <ChevronUp />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t.search.next}
            disabled={results.length === 0}
            onClick={next}
          >
            <ChevronDown />
          </Button>
        </>
      )}
    </div>
  )
}
