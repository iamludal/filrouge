import { useEffect } from 'react'
import { useGraphStore } from '@/store/graph-store'

export type HistoryAction = 'undo' | 'redo'

export const DIALOGS = '[role="dialog"], [role="alertdialog"]'
const TEXT_FIELDS = 'input, textarea, select'

/** Cmd/Ctrl+Z undoes; Cmd/Ctrl+Shift+Z and Ctrl+Y redo. Matched on the typed letter, so AZERTY works. */
export function historyActionOf(event: KeyboardEvent): HistoryAction | null {
  if (event.altKey) return null
  const key = event.key.toLowerCase()
  if (key === 'z' && (event.metaKey || event.ctrlKey)) return event.shiftKey ? 'redo' : 'undo'
  if (key === 'y' && event.ctrlKey && !event.metaKey && !event.shiftKey) return 'redo'
  return null
}

/** In a text field the browser's own text undo applies instead. */
function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || target.matches(TEXT_FIELDS))
}

/** Binds the undo/redo shortcuts for as long as the graph view is mounted. */
export function useHistoryShortcuts() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const action = historyActionOf(event)
      if (!action || isTypingTarget(event.target) || document.querySelector(DIALOGS)) return
      event.preventDefault()
      useGraphStore.getState()[action]()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
