import { act, fireEvent, render, screen } from '@testing-library/react'
import { useLongPress } from '@/features/graph/use-long-press'

function Harness({ onLongPress }: { onLongPress: (x: number, y: number) => void }) {
  const handlers = useLongPress(onLongPress)
  return (
    <div {...handlers}>
      <div className="react-flow__pane" data-testid="pane" />
      <div className="react-flow__node" data-testid="node" />
    </div>
  )
}

function setup() {
  const onLongPress = vi.fn()
  render(<Harness onLongPress={onLongPress} />)
  return { onLongPress, pane: screen.getByTestId('pane'), node: screen.getByTestId('node') }
}

const touch = { pointerType: 'touch', clientX: 100, clientY: 200 }

describe('useLongPress', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('fires after 500 ms with the pressed point', () => {
    const { onLongPress, pane } = setup()
    fireEvent.pointerDown(pane, touch)
    act(() => vi.advanceTimersByTime(499))
    expect(onLongPress).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(onLongPress).toHaveBeenCalledExactlyOnceWith(100, 200)
  })

  it('does not fire when the finger moves 30 px first', () => {
    const { onLongPress, pane } = setup()
    fireEvent.pointerDown(pane, touch)
    fireEvent.pointerMove(pane, { ...touch, clientX: 130 })
    act(() => vi.advanceTimersByTime(600))
    expect(onLongPress).not.toHaveBeenCalled()
  })

  it('tolerates a tiny jitter', () => {
    const { onLongPress, pane } = setup()
    fireEvent.pointerDown(pane, touch)
    fireEvent.pointerMove(pane, { ...touch, clientX: 104 })
    act(() => vi.advanceTimersByTime(500))
    expect(onLongPress).toHaveBeenCalledOnce()
  })

  it('does not fire on a short tap', () => {
    const { onLongPress, pane } = setup()
    fireEvent.pointerDown(pane, touch)
    act(() => vi.advanceTimersByTime(300))
    fireEvent.pointerUp(pane, touch)
    act(() => vi.advanceTimersByTime(600))
    expect(onLongPress).not.toHaveBeenCalled()
  })

  it('does not fire when a second finger joins', () => {
    const { onLongPress, pane } = setup()
    fireEvent.pointerDown(pane, { ...touch, pointerId: 1 })
    fireEvent.pointerDown(pane, { ...touch, pointerId: 2 })
    act(() => vi.advanceTimersByTime(600))
    expect(onLongPress).not.toHaveBeenCalled()
  })

  it('ignores the mouse and pen', () => {
    const { onLongPress, pane } = setup()
    fireEvent.pointerDown(pane, { ...touch, pointerType: 'mouse' })
    fireEvent.pointerDown(pane, { ...touch, pointerType: 'pen' })
    act(() => vi.advanceTimersByTime(600))
    expect(onLongPress).not.toHaveBeenCalled()
  })

  it('ignores a press on a node', () => {
    const { onLongPress, node } = setup()
    fireEvent.pointerDown(node, touch)
    act(() => vi.advanceTimersByTime(600))
    expect(onLongPress).not.toHaveBeenCalled()
  })

  it('suppresses the system context menu on the pane after a touch only', () => {
    const { pane } = setup()
    expect(fireEvent.contextMenu(pane)).toBe(true)
    fireEvent.pointerDown(pane, touch)
    expect(fireEvent.contextMenu(pane)).toBe(false)
  })

  it('swallows the release of a long press once, so the click it would synthesise is not delivered', () => {
    const { pane } = setup()
    fireEvent.pointerDown(pane, touch)
    act(() => vi.advanceTimersByTime(500))
    expect(fireEvent.touchEnd(pane)).toBe(false)
    expect(fireEvent.touchEnd(pane)).toBe(true)
  })
})
