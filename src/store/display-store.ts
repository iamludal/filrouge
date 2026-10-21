import { create } from 'zustand'
import {
  DEFAULT_DISPLAY,
  displayOptionsSchema,
  resetMenuOptions,
  type DisplayOption,
  type DisplayOptions,
} from '@/domain/display-options'

const STORAGE_KEY = 'filrouge:display'

function readOptions(): DisplayOptions {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = displayOptionsSchema.safeParse(JSON.parse(stored))
      if (parsed.success) return parsed.data
    }
  } catch {
    // storage unavailable or unreadable: show everything
  }
  return DEFAULT_DISPLAY
}

function writeOptions(options: DisplayOptions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(options))
  } catch {
    // storage unavailable (private mode…): the choice only lasts for the session
  }
}

interface DisplayState {
  options: DisplayOptions
  toggle: (option: DisplayOption) => void
  reset: () => void
}

/**
 * How much of the graph is drawn: a preference of the device, shared by every investigation. Apart
 * from the view store (reset whenever an investigation opens) and from the graph store (saved,
 * exported and undoable): it is none of these.
 */
export const useDisplayStore = create<DisplayState>()((set) => ({
  options: readOptions(),
  toggle: (option) => set((state) => ({ options: { ...state.options, [option]: !state.options[option] } })),
  reset: () => set((state) => ({ options: resetMenuOptions(state.options) })),
}))

useDisplayStore.subscribe((state, previous) => {
  if (state.options !== previous.options) writeOptions(state.options)
})
