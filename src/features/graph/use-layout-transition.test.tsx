import { act, renderHook } from '@testing-library/react'
import { useState } from 'react'
import { createInvestigation } from '@/domain/factories'
import type { Position } from '@/domain/schemas'
import type { EntityNode } from '@/features/graph/types'
import { TRANSITION_MS, useLayoutTransition } from '@/features/graph/use-layout-transition'
import { useGraphStore } from '@/store/graph-store'
import { useViewStore } from '@/store/view-store'

const store = () => useGraphStore.getState()
const toCanvas = (position: Position) => position

function setup() {
  const investigation = createInvestigation('Transition')
  store().load({ investigation, entities: [], relations: [], sources: [] })
  const a = store().addEntity('person', { x: 0, y: 0 })
  const fitView = vi.fn()
  const { result } = renderHook(() => {
    const [nodes, setNodes] = useState<EntityNode[]>(() =>
      Object.values(store().entities).map((entity) => ({
        id: entity.id,
        type: 'entity',
        position: entity.position,
        data: { entity },
      })),
    )
    useLayoutTransition(setNodes, toCanvas, fitView)
    return { nodes, setNodes }
  })
  /** What a layout does: new positions in the store, then the transition, as `syncNodes` would sync. */
  const layout = (animate: boolean) =>
    act(() => {
      store().arrangeEntities({ [a.id]: { x: 320, y: 160 } })
      result.current.setNodes((nodes) => nodes.map((node) => ({ ...node, position: { x: 320, y: 160 } })))
      useViewStore.getState().setLayoutTransition({
        from: { [a.id]: { x: 0, y: 0 } },
        entities: store().entities,
        animate,
      })
    })
  const position = () => result.current.nodes[0]!.position
  return { a, fitView, layout, position, result }
}

describe('useLayoutTransition', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
    useViewStore.getState().reset()
  })
  afterEach(() => vi.useRealTimers())

  it('starts from the old positions and glides to the new ones, then fits the view', () => {
    const { a, fitView, layout, position } = setup()
    layout(true)
    expect(position()).toEqual({ x: 0, y: 0 })

    act(() => vi.advanceTimersByTime(100))
    expect(position().x).toBeGreaterThan(0)
    expect(position().x).toBeLessThan(320)

    act(() => vi.advanceTimersByTime(TRANSITION_MS))
    expect(position()).toEqual({ x: 320, y: 160 })
    expect(fitView).toHaveBeenCalledWith({ nodes: [{ id: a.id }], duration: TRANSITION_MS })
    expect(useViewStore.getState().layoutTransition).toBeNull()
  })

  it('moves the nodes at once with reduced motion', () => {
    const { a, fitView, layout, position } = setup()
    layout(false)
    expect(position()).toEqual({ x: 320, y: 160 })
    act(() => vi.advanceTimersByTime(20))
    expect(fitView).toHaveBeenCalledWith({ nodes: [{ id: a.id }], duration: 0 })
  })

  it('stops at once when the entities change during the transition', () => {
    const { layout, position, result } = setup()
    layout(true)
    act(() => vi.advanceTimersByTime(100))
    act(() => {
      store().undo()
      // syncNodes puts the node where the store says.
      result.current.setNodes((nodes) => nodes.map((node) => ({ ...node, position: { x: 0, y: 0 } })))
    })
    act(() => vi.advanceTimersByTime(TRANSITION_MS))
    expect(position()).toEqual({ x: 0, y: 0 })
    expect(useViewStore.getState().layoutTransition).toBeNull()
  })
})
