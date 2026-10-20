import { act } from '@testing-library/react'

// Captured on the first mock: setup.ts installs the jsdom stub after this module is imported.
let defaultMatchMedia: typeof window.matchMedia | undefined
const listeners = new Set<() => void>()
let narrow = false

function mediaQueryList(query: string): MediaQueryList {
  // Only width queries follow the mocked viewport; a narrow viewport matches `max-width` ones.
  const matches = () => query.includes('max-width') && narrow
  const own = new Map<EventListenerOrEventListenerObject, () => void>()
  return {
    get matches() {
      return matches()
    },
    media: query,
    onchange: null,
    addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
      const notify = () => {
        const event = { matches: matches(), media: query } as MediaQueryListEvent
        if (typeof listener === 'function') listener(event)
        else listener.handleEvent(event)
      }
      own.set(listener, notify)
      listeners.add(notify)
    },
    removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
      const notify = own.get(listener)
      if (notify) listeners.delete(notify)
      own.delete(listener)
    },
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }
}

/** Makes `max-width` media queries match (narrow) or not (wide) and notifies their listeners. */
export function mockViewport(size: 'narrow' | 'wide') {
  defaultMatchMedia ??= window.matchMedia
  window.matchMedia = mediaQueryList
  narrow = size === 'narrow'
  act(() => listeners.forEach((notify) => notify()))
}

/** Back to the jsdom default (every query is false: wide). */
export function resetViewport() {
  narrow = false
  if (defaultMatchMedia) window.matchMedia = defaultMatchMedia
  defaultMatchMedia = undefined
  listeners.clear()
}
