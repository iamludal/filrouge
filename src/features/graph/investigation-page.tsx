import { ReactFlowProvider } from '@xyflow/react'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { routeHref } from '@/app/router'
import { useIsNarrow } from '@/app/use-media-query'
import { Button } from '@/components/ui/button'
import { graph } from '@/db/repositories/graph'
import { investigations } from '@/db/repositories/investigations'
import { useExportInvestigation } from '@/features/import-export/use-import-export'
import { ExportMenu } from '@/features/graph-export/export-menu'
import { CompactGraphToolbar } from '@/features/graph/compact-graph-toolbar'
import { DetailDrawer } from '@/features/graph/detail-drawer'
import { DetailPanel } from '@/features/graph/detail-panel'
import { GraphCanvas } from '@/features/graph/graph-canvas'
import { HistoryControls } from '@/features/graph/history-controls'
import { SaveIndicator } from '@/features/graph/save-indicator'
import { DisplayMenu } from '@/features/graph/display-menu'
import { FiltersButton } from '@/features/graph-search/filters-panel'
import { SearchField } from '@/features/graph-search/search-field'
import { PasteScreenshot } from '@/features/sources/paste-screenshot'
import { SourcesLibrary } from '@/features/sources/sources-library-dialog'
import { cn } from '@/lib/utils'
import { useGraphStore } from '@/store/graph-store'
import { useViewStore } from '@/store/view-store'
import { startAutosave, type Autosave } from '@/store/persistence'
import { useI18n } from '@/i18n/locale'

type LoadState = 'loading' | 'ready' | 'missing'

export function InvestigationPage({ id }: { id: string }) {
  const { t } = useI18n()
  // The load effect must not rerun when the language changes: it would reload the investigation.
  const autosaveErrorText = useRef(t.graph.autosaveError)
  useEffect(() => {
    autosaveErrorText.current = t.graph.autosaveError
  }, [t])
  const [state, setState] = useState<LoadState>('loading')
  const autosave = useRef<Autosave | null>(null)
  const investigation = useGraphStore((s) => s.investigation)
  const narrow = useIsNarrow()
  const hasSelection = useGraphStore((s) => s.selection.entityIds.length + s.selection.relationIds.length > 0)
  const { exportInvestigation, exportDialog } = useExportInvestigation()

  useEffect(() => {
    let cancelled = false
    // The search and filters of a previous visit never carry over.
    useViewStore.getState().reset()
    const saver = startAutosave(undefined, undefined, () =>
      toast.error(autosaveErrorText.current, { id: 'autosave-error' }),
    )
    autosave.current = saver

    // Screenshots released by deleted sources are only dropped here and on leave,
    // so an undo can bring them back. Best effort: a failure is retried on the next open.
    const purge = () => graph.purgeUnreferencedAttachments(id).catch(() => {})

    void purge()
      .then(() => investigations.loadSnapshot(id))
      .then((snapshot) => {
        if (cancelled) return
        if (!snapshot) {
          setState('missing')
          return
        }
        useGraphStore.getState().load(snapshot)
        setState('ready')
      })

    // Best effort: flush pending edits when the tab is hidden or closed.
    const onHide = () => void saver.flush()
    const onVisibility = () => document.visibilityState === 'hidden' && onHide()
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      useViewStore.getState().reset()
      window.removeEventListener('pagehide', onHide)
      document.removeEventListener('visibilitychange', onVisibility)
      void saver
        .flush()
        .then(purge)
        .finally(() => {
          saver.stop()
          if (useGraphStore.getState().investigation?.id === id) useGraphStore.getState().close()
        })
    }
  }, [id])

  const exportJson = async () => {
    await autosave.current?.flush()
    await exportInvestigation(id)
  }

  if (state === 'missing') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">{t.graph.notFound}</p>
        <Button variant="outline" asChild>
          <a href={routeHref({ name: 'home' })}>{t.graph.backHome}</a>
        </Button>
      </div>
    )
  }

  if (state === 'loading' || !investigation) return null

  return (
    <ReactFlowProvider>
      <div className="flex min-h-0 flex-1 flex-col">
        {narrow ? (
          <CompactGraphToolbar name={investigation.name} onExportJson={exportJson} />
        ) : (
          <div className="flex h-11 shrink-0 items-center gap-2 border-b px-2">
            <Button variant="ghost" size="icon-sm" asChild>
              <a href={routeHref({ name: 'home' })} aria-label={t.graph.backHome}>
                <ArrowLeft />
              </a>
            </Button>
            <h1 className="min-w-0 truncate font-medium">{investigation.name}</h1>
            <div className="ml-auto flex items-center gap-3">
              <SearchField />
              <FiltersButton />
              <DisplayMenu />
              <HistoryControls />
              <SaveIndicator />
              <SourcesLibrary />
              <ExportMenu onExportJson={exportJson} />
            </div>
          </div>
        )}
        <div className="relative flex min-h-0 flex-1">
          {/* Room for the collapsed drawer, so the canvas controls stay above it. */}
          <div className={cn('min-w-0 flex-1', narrow && hasSelection && 'pb-14')}>
            <GraphCanvas />
          </div>
          {narrow ? <DetailDrawer /> : <DetailPanel />}
        </div>
        {exportDialog}
        <PasteScreenshot />
      </div>
    </ReactFlowProvider>
  )
}
