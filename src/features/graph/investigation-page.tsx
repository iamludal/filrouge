import { ReactFlowProvider } from '@xyflow/react'
import { ArrowLeft, FileDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { routeHref } from '@/app/router'
import { Button } from '@/components/ui/button'
import { investigations } from '@/db/repositories/investigations'
import { useExportInvestigation } from '@/features/import-export/use-import-export'
import { DetailPanel } from '@/features/graph/detail-panel'
import { GraphCanvas } from '@/features/graph/graph-canvas'
import { SaveIndicator } from '@/features/graph/save-indicator'
import { useGraphStore } from '@/store/graph-store'
import { startAutosave, type Autosave } from '@/store/persistence'

type LoadState = 'loading' | 'ready' | 'missing'

export function InvestigationPage({ id }: { id: string }) {
  const [state, setState] = useState<LoadState>('loading')
  const autosave = useRef<Autosave | null>(null)
  const investigation = useGraphStore((s) => s.investigation)
  const exportInvestigation = useExportInvestigation()

  useEffect(() => {
    let cancelled = false
    const saver = startAutosave(undefined, undefined, () =>
      toast.error('Impossible d’enregistrer les modifications', { id: 'autosave-error' }),
    )
    autosave.current = saver

    void investigations.loadSnapshot(id).then((snapshot) => {
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
      window.removeEventListener('pagehide', onHide)
      document.removeEventListener('visibilitychange', onVisibility)
      void saver.flush().finally(() => {
        saver.stop()
        if (useGraphStore.getState().investigation?.id === id) useGraphStore.getState().close()
      })
    }
  }, [id])

  if (state === 'missing') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">Enquête introuvable dans ce navigateur.</p>
        <Button variant="outline" asChild>
          <a href={routeHref({ name: 'home' })}>Retour aux enquêtes</a>
        </Button>
      </div>
    )
  }

  if (state === 'loading' || !investigation) return null

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b px-2">
        <Button variant="ghost" size="icon-sm" asChild>
          <a href={routeHref({ name: 'home' })} aria-label="Retour aux enquêtes">
            <ArrowLeft />
          </a>
        </Button>
        <h1 className="min-w-0 truncate font-medium">{investigation.name}</h1>
        <div className="ml-auto flex items-center gap-3">
          <SaveIndicator />
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await autosave.current?.flush()
              await exportInvestigation(id)
            }}
          >
            <FileDown /> Exporter
          </Button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <ReactFlowProvider>
            <GraphCanvas />
          </ReactFlowProvider>
        </div>
        <DetailPanel />
      </div>
    </div>
  )
}
