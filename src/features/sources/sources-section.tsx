import { Paperclip, Plus } from 'lucide-react'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { sourceUsage } from '@/domain/graph'
import type { Source } from '@/domain/schemas'
import { sourceDisplayName } from '@/domain/sources'
import { SourceFormDialog } from '@/features/sources/source-form-dialog'
import { SourcePickerDialog } from '@/features/sources/source-picker-dialog'
import { useGraphStore, type ElementRef } from '@/store/graph-store'

/** Sources attached to an entity or a relation, with the actions to add, open and detach them. */
export function SourcesSection({ element }: { element: ElementRef }) {
  const sourceIds = useGraphStore((state) =>
    element.type === 'entity'
      ? state.entities[element.id]?.sourceIds
      : state.relations[element.id]?.sourceIds,
  )
  const sources = useGraphStore((state) => state.sources)
  const entities = useGraphStore((state) => state.entities)
  const relations = useGraphStore((state) => state.relations)
  const detachSource = useGraphStore((state) => state.detachSource)

  const [creating, setCreating] = useState(false)
  const [picking, setPicking] = useState(false)
  const [editing, setEditing] = useState<Source | null>(null)
  const [detaching, setDetaching] = useState<Source | null>(null)
  const [deleteToo, setDeleteToo] = useState(false)

  const attached = (sourceIds ?? []).flatMap((id) => sources[id] ?? [])

  const requestDetach = (source: Source) => {
    const usage = sourceUsage([...Object.values(entities), ...Object.values(relations)])
    if ((usage.get(source.id) ?? 0) > 1) {
      detachSource(element, source.id)
      return
    }
    // Last reference: let the user choose between keeping the source and deleting it.
    setDeleteToo(false)
    setDetaching(source)
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      {attached.length > 0 && (
        <ul className="grid grid-cols-1 gap-1" aria-label="Sources attachées">
          {attached.map((source) => (
            <li key={source.id} className="flex items-center gap-1">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-1.5 rounded px-1 py-0.5 text-left text-sm hover:bg-accent"
                onClick={() => setEditing(source)}
              >
                <span className="min-w-0 wrap-anywhere">{sourceDisplayName(source)}</span>
                {source.attachmentId && <Paperclip className="size-3.5 shrink-0" aria-label="Avec capture" />}
              </button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Retirer ${sourceDisplayName(source)}`}
                onClick={() => requestDetach(source)}
              >
                Retirer
              </Button>
            </li>
          ))}
        </ul>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <Plus /> Ajouter une source
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => setCreating(true)}>Nouvelle source</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setPicking(true)}>Source existante</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SourceFormDialog open={creating} onOpenChange={setCreating} attachTo={element} />
      <SourcePickerDialog open={picking} onOpenChange={setPicking} element={element} />
      {editing && (
        <SourceFormDialog
          open
          onOpenChange={(open) => !open && setEditing(null)}
          source={sources[editing.id] ?? editing}
        />
      )}

      <AlertDialog open={detaching !== null} onOpenChange={(open) => !open && setDetaching(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer « {detaching ? sourceDisplayName(detaching) : ''} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Aucun autre élément n’utilise cette source. Elle peut rester dans l’enquête, sans être
              rattachée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4"
              checked={deleteToo}
              onChange={(event) => setDeleteToo(event.target.checked)}
            />
            Supprimer aussi la source et sa capture
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (detaching) detachSource(element, detaching.id, deleteToo)
              }}
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
