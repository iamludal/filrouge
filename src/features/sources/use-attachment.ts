import { useEffect, useState } from 'react'
import { attachments as repository } from '@/db/repositories/attachments'
import type { Attachment } from '@/domain/schemas'
import { useGraphStore } from '@/store/graph-store'

/** A screenshot of the open investigation: from this session's memory, else from storage. */
export function useStoredAttachment(id: string | undefined): Attachment | undefined {
  const inMemory = useGraphStore((state) => (id ? state.attachments[id] : undefined))
  const [loaded, setLoaded] = useState<Attachment>()

  useEffect(() => {
    if (!id || inMemory) return
    let cancelled = false
    void repository
      .get(id)
      .then((attachment) => !cancelled && setLoaded(attachment))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [id, inMemory])

  return inMemory ?? (loaded?.id === id ? loaded : undefined)
}

/** An object URL for a Blob, revoked when the Blob changes or the component unmounts. */
export function useBlobUrl(blob: Blob | undefined): string | undefined {
  const [entry, setEntry] = useState<{ blob: Blob; url: string }>()

  useEffect(() => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    // Mirrors an external resource (the object URL) created for this Blob into state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntry({ blob, url })
    return () => URL.revokeObjectURL(url)
  }, [blob])

  return blob && entry?.blob === blob ? entry.url : undefined
}
