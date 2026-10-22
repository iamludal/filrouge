import { useEffect, type Dispatch, type SetStateAction } from 'react'
import type { Position } from '@/domain/schemas'
import type { EntityNode } from '@/features/graph/types'
import { useGraphStore } from '@/store/graph-store'
import { useViewStore } from '@/store/view-store'

export const TRANSITION_MS = 300

const easeOut = (t: number) => 1 - (1 - t) ** 3

interface FitOptions {
  nodes: { id: string }[]
  duration: number
}

/**
 * Glides the entities of a layout from their old to their new positions. The store already holds
 * the new positions: only the canvas nodes are moved, so undo, redo and saving never see the
 * in-between positions. Any other edit of the entities ends the transition at once, `syncNodes`
 * having already put the nodes where the store says. The view then fits the laid-out entities.
 */
export function useLayoutTransition(
  setNodes: Dispatch<SetStateAction<EntityNode[]>>,
  toCanvas: (position: Position) => Position,
  fitView: (options: FitOptions) => void,
) {
  useEffect(() => {
    let frame = 0

    const play = () => {
      cancelAnimationFrame(frame)
      const transition = useViewStore.getState().layoutTransition
      if (!transition) return
      const fitted = { nodes: Object.keys(transition.from).map((id) => ({ id })) }
      const end = () => useViewStore.getState().setLayoutTransition(null)

      if (!transition.animate) {
        frame = requestAnimationFrame(() => fitView({ ...fitted, duration: 0 }))
        end()
        return
      }

      const start = performance.now()
      const step = () => {
        const { entities } = useGraphStore.getState()
        if (entities !== transition.entities) return end()
        const progress = Math.min(1, (performance.now() - start) / TRANSITION_MS)
        const t = easeOut(progress)
        setNodes((nodes) =>
          nodes.map((node) => {
            const from = transition.from[node.id]
            const to = entities[node.id]?.position
            if (!from || !to || node.dragging) return node
            const position = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }
            return { ...node, position: toCanvas(position) }
          }),
        )
        if (progress < 1) frame = requestAnimationFrame(step)
        else {
          end()
          fitView({ ...fitted, duration: TRANSITION_MS })
        }
      }
      // First frame right away, so the nodes never flash at their new positions.
      step()
    }

    const unsubscribe = useViewStore.subscribe((state, previous) => {
      if (state.layoutTransition && state.layoutTransition !== previous.layoutTransition) play()
    })
    return () => {
      unsubscribe()
      cancelAnimationFrame(frame)
    }
  }, [setNodes, toCanvas, fitView])
}
