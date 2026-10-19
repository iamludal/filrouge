import { AlertCircle, Check, Loader2 } from 'lucide-react'
import { useGraphStore } from '@/store/graph-store'

export function SaveIndicator() {
  const status = useGraphStore((state) => state.saveStatus)
  return (
    <span
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      {status === 'saved' && (
        <>
          <Check className="size-3.5" /> Enregistré
        </>
      )}
      {(status === 'pending' || status === 'saving') && (
        <>
          <Loader2 className="size-3.5 animate-spin" /> Enregistrement…
        </>
      )}
      {status === 'error' && (
        <span className="flex items-center gap-1.5 text-destructive">
          <AlertCircle className="size-3.5" /> Échec de l’enregistrement
        </span>
      )}
    </span>
  )
}
