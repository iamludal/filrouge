import { graph as defaultGraphRepository, type GraphRepository } from '@/db/repositories/graph'
import { hasPendingChanges, useGraphStore } from '@/store/graph-store'

export const AUTOSAVE_DELAY_MS = 400

export interface Autosave {
  /** Saves pending edits right away. Resolves once everything queued so far is persisted. */
  flush: () => Promise<void>
  stop: () => void
}

/**
 * Persists graph edits to IndexedDB, debounced. Saves are serialized: a flush waits for the
 * previous one, so writes always land in order.
 */
export function startAutosave(
  repository: GraphRepository = defaultGraphRepository,
  delay = AUTOSAVE_DELAY_MS,
  onError: (error: unknown) => void = () => {},
): Autosave {
  let timer: ReturnType<typeof setTimeout> | undefined
  let chain: Promise<void> = Promise.resolve()

  const save = async () => {
    const store = useGraphStore.getState()
    const changes = store.takeChanges()
    if (!changes) return
    store.setSaveStatus('saving')
    try {
      await repository.applyChanges(changes)
      const after = useGraphStore.getState()
      after.setSaveStatus(hasPendingChanges(after) ? 'pending' : 'saved')
    } catch (error) {
      useGraphStore.getState().restoreChanges(changes)
      useGraphStore.getState().setSaveStatus('error')
      onError(error)
    }
  }

  const flush = () => {
    clearTimeout(timer)
    timer = undefined
    chain = chain.then(save)
    return chain
  }

  const unsubscribe = useGraphStore.subscribe((state, previous) => {
    if (state.dirty !== previous.dirty && hasPendingChanges(state)) {
      clearTimeout(timer)
      timer = setTimeout(() => void flush(), delay)
    }
  })

  return {
    flush,
    stop: () => {
      clearTimeout(timer)
      unsubscribe()
    },
  }
}
