import { Paperclip } from 'lucide-react'
import { useMemo, useState, type KeyboardEvent } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { sourceDisplayName } from '@/domain/sources'
import { useGraphStore, type ElementRef } from '@/store/graph-store'

interface SourcePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  element: ElementRef
}

export function SourcePickerDialog(props: SourcePickerDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <SourcePicker {...props} />
      </DialogContent>
    </Dialog>
  )
}

function SourcePicker({ onOpenChange, element }: SourcePickerDialogProps) {
  const sources = useGraphStore((state) => state.sources)
  const attachedIds = useGraphStore((state) =>
    element.type === 'entity'
      ? state.entities[element.id]?.sourceIds
      : state.relations[element.id]?.sourceIds,
  )
  const attachSource = useGraphStore((state) => state.attachSource)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const candidates = useMemo(() => {
    const attached = new Set(attachedIds)
    const needle = query.trim().toLocaleLowerCase()
    return Object.values(sources)
      .filter((source) => !attached.has(source.id))
      .filter(
        (source) =>
          !needle || `${sourceDisplayName(source)} ${source.url ?? ''}`.toLocaleLowerCase().includes(needle),
      )
  }, [sources, attachedIds, query])

  const choose = (index: number) => {
    const source = candidates[index]
    if (!source) return
    attachSource(element, source.id)
    onOpenChange(false)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((current) => Math.min(current + 1, candidates.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      choose(Math.min(active, candidates.length - 1))
    }
  }

  return (
    <div className="grid gap-3">
      <DialogHeader>
        <DialogTitle>Source existante</DialogTitle>
        <DialogDescription>Choisissez une source de l’enquête à rattacher.</DialogDescription>
      </DialogHeader>
      <Input
        autoFocus
        role="combobox"
        aria-expanded
        aria-controls="source-picker-list"
        aria-label="Filtrer les sources"
        placeholder="Filtrer par titre ou URL"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setActive(0)
        }}
        onKeyDown={handleKeyDown}
      />
      <ul
        id="source-picker-list"
        role="listbox"
        aria-label="Sources"
        className="grid max-h-64 gap-1 overflow-y-auto"
      >
        {candidates.map((source, index) => (
          <li key={source.id} role="option" aria-selected={index === active}>
            <button
              type="button"
              tabIndex={-1}
              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent ${
                index === active ? 'bg-accent' : ''
              }`}
              onClick={() => choose(index)}
            >
              <span className="min-w-0 flex-1 truncate">{sourceDisplayName(source)}</span>
              {source.attachmentId && <Paperclip className="size-3.5 shrink-0" aria-label="Avec capture" />}
            </button>
          </li>
        ))}
      </ul>
      {candidates.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {query.trim() ? 'Aucune source ne correspond.' : 'Aucune autre source dans cette enquête.'}
        </p>
      )}
    </div>
  )
}
