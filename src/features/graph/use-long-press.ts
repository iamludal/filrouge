import { useCallback, useEffect, useRef, type MouseEvent, type PointerEvent } from 'react'

const DELAY_MS = 500
/** A finger that moves farther than this is panning, not pressing. */
const MOVE_TOLERANCE = 10

/**
 * Lifting the finger after a long press makes the browser synthesise a click where it was. The dialog
 * the press opened is already under that point, so the click would activate whatever it lands on:
 * the release of the press is swallowed.
 */
function swallowRelease() {
  const stop = (event: Event) => {
    if (event.type === 'touchend') event.preventDefault()
    document.removeEventListener('touchend', stop, true)
    document.removeEventListener('touchcancel', stop, true)
  }
  document.addEventListener('touchend', stop, { capture: true, passive: false })
  document.addEventListener('touchcancel', stop, { capture: true, passive: false })
}

/**
 * Touch equivalent of the double-click on the empty canvas: pressing the React Flow pane with a
 * finger for half a second calls `onLongPress` with the pressed point. A move, a release, a
 * cancelled gesture or a second finger (pinch) abandons the press. Mouse and pen are ignored.
 */
export function useLongPress(onLongPress: (clientX: number, clientY: number) => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const lastWasTouch = useRef(false)

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    start.current = null
  }, [])

  useEffect(() => cancel, [cancel])

  const onPointerDown = (event: PointerEvent) => {
    lastWasTouch.current = event.pointerType === 'touch'
    if (event.pointerType !== 'touch') return
    const onPane = (event.target as HTMLElement).classList.contains('react-flow__pane')
    // A second finger turns the gesture into a pinch.
    if (timer.current || !onPane) return cancel()
    const { clientX, clientY } = event
    start.current = { x: clientX, y: clientY }
    timer.current = setTimeout(() => {
      cancel()
      swallowRelease()
      onLongPress(clientX, clientY)
    }, DELAY_MS)
  }

  const onPointerMove = (event: PointerEvent) => {
    if (!start.current) return
    if (Math.hypot(event.clientX - start.current.x, event.clientY - start.current.y) > MOVE_TOLERANCE)
      cancel()
  }

  // Android shows its own menu after a long press: the canvas has its own meaning for it.
  const onContextMenu = (event: MouseEvent) => {
    if (lastWasTouch.current && (event.target as HTMLElement).classList.contains('react-flow__pane'))
      event.preventDefault()
  }

  return { onPointerDown, onPointerMove, onPointerUp: cancel, onPointerCancel: cancel, onContextMenu }
}
