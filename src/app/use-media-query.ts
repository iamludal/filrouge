import { useSyncExternalStore } from 'react'

// Tailwind's `md` breakpoint (48rem) is where the desktop layout starts.
const NARROW_QUERY = '(max-width: 47.99rem)'

function subscribe(onChange: () => void) {
  const media = window.matchMedia(NARROW_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

const getSnapshot = () => window.matchMedia(NARROW_QUERY).matches

/** True on narrow screens (below 768 px), following resizes and rotations. */
export function useIsNarrow() {
  return useSyncExternalStore(subscribe, getSnapshot)
}
