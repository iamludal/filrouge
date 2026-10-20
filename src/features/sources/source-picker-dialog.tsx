import { Paperclip } from 'lucide-react'
import { useMemo, useState, type KeyboardEvent } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useGraphStore, type ElementRef } from '@/store/graph-store'
import { useSourceName } from '@/features/sources/use-source-name'
import { useI18n } from '@/i18n/locale'

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
  const { t } = useI18n()
  const sourceName = useSourceName()
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
          !needle || `${sourceName(source)} ${source.url ?? ''}`.toLocaleLowerCase().includes(needle),
      )
  }, [sources, attachedIds, query, sourceName])

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
        <DialogTitle>{t.sources.picker.title}</DialogTitle>
        <DialogDescription>{t.sources.picker.description}</DialogDescription>
      </DialogHeader>
      <Input
        autoFocus
        role="combobox"
        aria-expanded
        aria-controls="source-picker-list"
        aria-label={t.sources.picker.filterLabel}
        placeholder={t.sources.picker.filterPlaceholder}
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
        aria-label={t.sources.picker.listLabel}
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
              <span className="min-w-0 flex-1 truncate">{sourceName(source)}</span>
              {source.attachmentId && (
                <Paperclip className="size-3.5 shrink-0" aria-label={t.sources.withScreenshot} />
              )}
            </button>
          </li>
        ))}
      </ul>
      {candidates.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {query.trim() ? t.sources.picker.noMatch : t.sources.picker.none}
        </p>
      )}
    </div>
  )
}
