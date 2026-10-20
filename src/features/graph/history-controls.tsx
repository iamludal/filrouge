import { Redo2, Undo2, type LucideIcon } from 'lucide-react'
import { useStore } from 'zustand'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useHistoryShortcuts, type HistoryAction } from '@/features/graph/use-history-shortcuts'
import { isApplePlatform, shortcutLabel } from '@/lib/platform'
import { useGraphStore } from '@/store/graph-store'
import { useI18n } from '@/i18n/locale'

const ICONS: Record<HistoryAction, LucideIcon> = { undo: Undo2, redo: Redo2 }

function HistoryButton({
  action,
  enabled,
  className,
}: {
  action: HistoryAction
  enabled: boolean
  className?: string
}) {
  const Icon = ICONS[action]
  const { t } = useI18n()
  const label = t.graph.history[action]
  return (
    <Tooltip>
      {/* A disabled button receives no pointer events: the tooltip hangs on a wrapper. */}
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button
            variant="ghost"
            size="icon-sm"
            className={className}
            aria-label={label}
            disabled={!enabled}
            onClick={() => useGraphStore.getState()[action]()}
          >
            <Icon />
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {label} ({shortcutLabel(action, isApplePlatform())})
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * The undo/redo buttons of the graph toolbar, and the keyboard shortcuts that go with them. With
 * `undoOnly` (narrow screens) only "Annuler" is shown, "Rétablir" living in the toolbar menu.
 */
export function HistoryControls({ undoOnly = false }: { undoOnly?: boolean }) {
  useHistoryShortcuts()
  const canUndo = useStore(useGraphStore.temporal, (state) => state.pastStates.length > 0)
  const canRedo = useStore(useGraphStore.temporal, (state) => state.futureStates.length > 0)
  return (
    <div className="flex items-center">
      <HistoryButton action="undo" enabled={canUndo} className={undoOnly ? 'size-11' : undefined} />
      {!undoOnly && <HistoryButton action="redo" enabled={canRedo} />}
    </div>
  )
}
