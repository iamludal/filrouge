import { AlertCircle, Check, Loader2 } from 'lucide-react'
import { useGraphStore } from '@/store/graph-store'

const TEXTS = {
  saved: 'Enregistré',
  pending: 'Enregistrement…',
  saving: 'Enregistrement…',
  error: 'Échec de l’enregistrement',
} as const

/** The save status. With `iconOnly` (narrow screens) the text is only the accessible name. */
export function SaveIndicator({ iconOnly = false }: { iconOnly?: boolean }) {
  const status = useGraphStore((state) => state.saveStatus)
  const text = TEXTS[status]
  const Icon = status === 'saved' ? Check : status === 'error' ? AlertCircle : Loader2

  return (
    <span
      className={
        status === 'error'
          ? 'flex items-center gap-1.5 text-xs text-destructive'
          : 'flex items-center gap-1.5 text-xs text-muted-foreground'
      }
      role="status"
      aria-live="polite"
      aria-label={iconOnly ? text : undefined}
      title={iconOnly ? text : undefined}
    >
      <Icon
        aria-hidden
        className={status === 'pending' || status === 'saving' ? 'size-3.5 animate-spin' : 'size-3.5'}
      />
      {!iconOnly && text}
    </span>
  )
}
