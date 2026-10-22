import { toast } from 'sonner'
import { buildLayoutInput } from '@/domain/layout/layout-scope'
import type { LayoutAlgorithm } from '@/domain/layout/types'
import type { Position } from '@/domain/schemas'
import { runLayout, type ElkEngine } from '@/features/graph-layout/run-layout'
import { useI18n } from '@/i18n/locale'
import type { Messages } from '@/i18n/types'
import { useGraphStore } from '@/store/graph-store'
import { useViewStore } from '@/store/view-store'

/** A layout running longer than this shows the "Mise en page…" notice. */
export const NOTICE_DELAY_MS = 300
const NOTICE_ID = 'auto-layout'

export interface Elk extends ElkEngine {
  /** Stops a computation in progress; the instance cannot be used afterwards. */
  terminateWorker(): void
}

type LayoutTexts = Messages['graph']['layout']

const reducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Runs layouts one at a time. ELK is loaded on the first layout and kept for the next ones. A new
 * layout or a cancel stops the one in progress by terminating ELK's worker: ELK cannot be
 * interrupted otherwise.
 */
export function createLayoutController(loadElk: () => Promise<Elk>) {
  let elk: Elk | null = null
  let latest = 0
  let running = false
  let notice: ReturnType<typeof setTimeout> | undefined

  const finish = () => {
    running = false
    clearTimeout(notice)
    toast.dismiss(NOTICE_ID)
  }

  /** Ends the layout in progress, if any, killing its computation. */
  const stop = () => {
    if (running) {
      elk?.terminateWorker()
      elk = null
    }
    finish()
  }

  const cancel = () => {
    latest++
    stop()
  }

  async function apply(algorithm: LayoutAlgorithm, texts: LayoutTexts): Promise<void> {
    stop()
    const request = ++latest
    const { entities, relations, selection } = useGraphStore.getState()
    const input = buildLayoutInput(
      Object.values(entities),
      Object.values(relations),
      selection.entityIds,
      algorithm,
    )
    if (input.nodes.length < 2) return

    running = true
    notice = setTimeout(() => {
      toast.loading(texts.running, {
        id: NOTICE_ID,
        duration: Infinity,
        action: { label: texts.cancel, onClick: cancel },
      })
    }, NOTICE_DELAY_MS)

    try {
      elk ??= await loadElk()
      const positions = await runLayout(input, elk)
      if (request !== latest) return
      finish()
      const current = useGraphStore.getState()
      if (current.entities !== entities || current.relations !== relations) {
        toast.info(texts.stale)
        return
      }
      const from: Record<string, Position> = {}
      for (const id of Object.keys(positions)) {
        const entity = entities[id]
        if (entity) from[id] = entity.position
      }
      current.arrangeEntities(positions)
      useViewStore.getState().setLayoutTransition({
        from,
        entities: useGraphStore.getState().entities,
        animate: !reducedMotion(),
      })
    } catch {
      if (request !== latest) return
      finish()
      // A failed computation may leave ELK in a broken state: start from a fresh one next time.
      elk = null
      toast.error(texts.failed)
    }
  }

  return { apply, cancel }
}

const controller = createLayoutController(async () =>
  (await import('@/features/graph-layout/elk')).createElk(),
)

/** Applies a layout to the open investigation, in the active language. */
export function useAutoLayout() {
  const { t } = useI18n()
  return (algorithm: LayoutAlgorithm) => void controller.apply(algorithm, t.graph.layout)
}

/** A layout needs at least two entities. */
export function useCanLayout() {
  return useGraphStore((state) => Object.keys(state.entities).length >= 2)
}
