import { useEffect, type RefObject } from 'react'
import { DIALOGS } from '@/features/graph/use-history-shortcuts'

/** Cmd/Ctrl+F. Matched on the typed letter, so AZERTY works. */
export function isSearchShortcut(event: KeyboardEvent): boolean {
  return (
    event.key.toLowerCase() === 'f' && (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey
  )
}

/** Sends Cmd/Ctrl+F to the search field instead of the browser's find bar, outside dialogs. */
export function useSearchShortcut(input: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isSearchShortcut(event) || document.querySelector(DIALOGS)) return
      event.preventDefault()
      input.current?.focus()
      input.current?.select()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [input])
}
