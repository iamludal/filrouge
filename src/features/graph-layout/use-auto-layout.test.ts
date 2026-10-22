import type { ElkNode } from 'elkjs/lib/elk-api'
import { toast } from 'sonner'
import { createInvestigation } from '@/domain/factories'
import { createLayoutController, NOTICE_DELAY_MS, type Elk } from '@/features/graph-layout/use-auto-layout'
import { fr } from '@/i18n/messages/fr'
import { useGraphStore } from '@/store/graph-store'
import { useViewStore } from '@/store/view-store'

vi.mock('sonner', () => ({ toast: { loading: vi.fn(), dismiss: vi.fn(), info: vi.fn(), error: vi.fn() } }))

const texts = fr.graph.layout
const store = () => useGraphStore.getState()
const steps = () => useGraphStore.temporal.getState().pastStates.length

/** An ELK stand-in placing nodes on a row; with `hold`, answers only when `release()` is called. */
function fakeElk({ hold = false, fail = false } = {}) {
  const waiting: (() => void)[] = []
  const elk: Elk = {
    layout: vi.fn(
      (graph: ElkNode) =>
        new Promise<ElkNode>((resolve, reject) => {
          const answer = () =>
            fail
              ? reject(new Error('boom'))
              : resolve({
                  ...graph,
                  children: graph.children?.map((child, i) => ({ ...child, x: i * 400, y: 0 })),
                })
          if (hold) waiting.push(answer)
          else answer()
        }),
    ),
    terminateWorker: vi.fn(),
  }
  const release = async () => {
    // The pipeline asks ELK twice per group (spread, then overlap removal).
    for (let round = 0; round < 4 && waiting.length > 0; round++) {
      for (const answer of waiting.splice(0)) answer()
      await vi.advanceTimersByTimeAsync(0)
    }
  }
  return { elk, release }
}

function openGraph() {
  const investigation = createInvestigation('Mise en page')
  store().load({ investigation, entities: [], relations: [], sources: [] })
  const a = store().addEntity('person', { x: 0, y: 0 }, 'A')
  const b = store().addEntity('person', { x: 0, y: 0 }, 'B')
  const c = store().addEntity('person', { x: 0, y: 0 }, 'C')
  store().addRelation(a.id, b.id, 'connaît')
  store().addRelation(b.id, c.id, 'connaît')
  store().setSelection({ entityIds: [], relationIds: [] })
  return { a, b, c }
}

const positionsOf = () => Object.values(store().entities).map((entity) => entity.position)

describe('layout controller', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    useViewStore.getState().reset()
  })
  afterEach(() => vi.useRealTimers())

  it('applies a layout as one undo step, and sets the transition', async () => {
    const { a } = openGraph()
    const before = steps()
    const { elk } = fakeElk()
    await createLayoutController(async () => elk).apply('organic', texts)

    expect(new Set(positionsOf().map((p) => `${p.x},${p.y}`)).size).toBe(3)
    expect(steps()).toBe(before + 1)
    const transition = useViewStore.getState().layoutTransition
    expect(transition?.from[a.id]).toEqual({ x: 0, y: 0 })
    expect(transition?.entities).toBe(store().entities)
    store().undo()
    expect(positionsOf()).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ])
  })

  it('loads ELK once and keeps it for the next layouts', async () => {
    openGraph()
    const { elk } = fakeElk()
    const load = vi.fn(async () => elk)
    const controller = createLayoutController(load)
    await controller.apply('organic', texts)
    await controller.apply('hierarchical', texts)
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('shows no notice for a fast layout', async () => {
    openGraph()
    const { elk } = fakeElk()
    await createLayoutController(async () => elk).apply('organic', texts)
    await vi.advanceTimersByTimeAsync(NOTICE_DELAY_MS * 2)
    expect(toast.loading).not.toHaveBeenCalled()
  })

  it('shows the notice after 300 ms, and removes it when the layout is applied', async () => {
    openGraph()
    const { elk, release } = fakeElk({ hold: true })
    void createLayoutController(async () => elk).apply('organic', texts)
    await vi.advanceTimersByTimeAsync(NOTICE_DELAY_MS - 1)
    expect(toast.loading).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(toast.loading).toHaveBeenCalledWith(
      'Mise en page…',
      expect.objectContaining({ id: 'auto-layout' }),
    )

    await release()
    expect(toast.dismiss).toHaveBeenCalledWith('auto-layout')
    expect(new Set(positionsOf().map((p) => `${p.x},${p.y}`)).size).toBe(3)
  })

  it('cancels from the notice: nothing moves and no undo step is added', async () => {
    openGraph()
    const before = steps()
    const { elk, release } = fakeElk({ hold: true })
    void createLayoutController(async () => elk).apply('organic', texts)
    await vi.advanceTimersByTimeAsync(NOTICE_DELAY_MS)
    const options = vi.mocked(toast.loading).mock.calls[0]![1] as unknown as {
      action: { onClick: () => void }
    }
    options.action.onClick()

    expect(elk.terminateWorker).toHaveBeenCalled()
    await release()
    expect(positionsOf().every((p) => p.x === 0 && p.y === 0)).toBe(true)
    expect(steps()).toBe(before)
  })

  it('reports a failure without moving anything', async () => {
    openGraph()
    const { elk } = fakeElk({ fail: true })
    await createLayoutController(async () => elk).apply('organic', texts)
    expect(toast.error).toHaveBeenCalledWith('La mise en page a échoué')
    expect(positionsOf().every((p) => p.x === 0 && p.y === 0)).toBe(true)
  })

  it('drops the result when an entity is deleted during the computation', async () => {
    const { c } = openGraph()
    const { elk, release } = fakeElk({ hold: true })
    void createLayoutController(async () => elk).apply('organic', texts)
    await vi.advanceTimersByTimeAsync(0)
    store().removeElements([c.id], [])
    await release()

    expect(toast.info).toHaveBeenCalledWith('Graphe modifié pendant le calcul : mise en page annulée')
    expect(positionsOf().every((p) => p.x === 0 && p.y === 0)).toBe(true)
  })

  it('still applies the layout when only the selection changes during the computation', async () => {
    const { a } = openGraph()
    const { elk, release } = fakeElk({ hold: true })
    void createLayoutController(async () => elk).apply('organic', texts)
    await vi.advanceTimersByTimeAsync(0)
    store().setSelection({ entityIds: [a.id], relationIds: [] })
    await release()

    expect(toast.info).not.toHaveBeenCalled()
    expect(new Set(positionsOf().map((p) => `${p.x},${p.y}`)).size).toBe(3)
  })

  it('drops a layout in progress silently when a new one starts', async () => {
    openGraph()
    const slow = fakeElk({ hold: true })
    const fast = fakeElk()
    const elks = [slow.elk, fast.elk]
    const controller = createLayoutController(async () => elks.shift()!)
    void controller.apply('organic', texts)
    await vi.advanceTimersByTimeAsync(0)
    await controller.apply('hierarchical', texts)

    expect(slow.elk.terminateWorker).toHaveBeenCalled()
    await slow.release()
    expect(toast.info).not.toHaveBeenCalled()
    expect(fast.elk.layout).toHaveBeenCalled()
    expect(steps()).toBeGreaterThan(0)
  })

  it('does nothing with fewer than two entities', async () => {
    const investigation = createInvestigation('Seule')
    store().load({ investigation, entities: [], relations: [], sources: [] })
    store().addEntity('person', { x: 0, y: 0 })
    const { elk } = fakeElk()
    const load = vi.fn(async () => elk)
    await createLayoutController(load).apply('organic', texts)
    expect(load).not.toHaveBeenCalled()
  })
})
