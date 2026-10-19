import { Paperclip, Pencil, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { sourceUsage } from '@/domain/graph'
import type { Source } from '@/domain/schemas'
import { sourceDisplayName, usageLabel } from '@/domain/sources'
import { SourceFormDialog } from '@/features/sources/source-form-dialog'
import { useGraphStore } from '@/store/graph-store'

/** The "Sources (N)" toolbar button and the library of all sources of the open investigation. */
export function SourcesLibrary() {
  const count = useGraphStore((state) => Object.keys(state.sources).length)
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Paperclip /> Sources ({count})
      </Button>
      <SourcesLibraryDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

export function SourcesLibraryDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const sources = useGraphStore((state) => state.sources)
  const entities = useGraphStore((state) => state.entities)
  const relations = useGraphStore((state) => state.relations)
  const removeSource = useGraphStore((state) => state.removeSource)

  const [editing, setEditing] = useState<Source | null>(null)
  const [deleting, setDeleting] = useState<Source | null>(null)

  const usage = useMemo(
    () => sourceUsage([...Object.values(entities), ...Object.values(relations)]),
    [entities, relations],
  )
  const list = Object.values(sources)
  const deletingCount = deleting ? (usage.get(deleting.id) ?? 0) : 0

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Sources de l’enquête</DialogTitle>
            <DialogDescription>
              Une source peut appuyer plusieurs entités et relations. Rattachez-la depuis leur panneau.
            </DialogDescription>
          </DialogHeader>
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune source pour l’instant.</p>
          ) : (
            <ul className="grid gap-1" aria-label="Sources de l’enquête">
              {list.map((source) => (
                <li key={source.id} className="flex items-center gap-2 rounded border px-2 py-1.5">
                  <div className="grid min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm">
                      <span className="truncate">{sourceDisplayName(source)}</span>
                      {source.attachmentId && (
                        <Paperclip className="size-3.5 shrink-0" aria-label="Avec capture" />
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {usageLabel(usage.get(source.id) ?? 0)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditing(source)}
                    aria-label={`Modifier ${sourceDisplayName(source)}`}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleting(source)}
                    aria-label={`Supprimer ${sourceDisplayName(source)}`}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      {editing && (
        <SourceFormDialog
          open
          onOpenChange={(next) => !next && setEditing(null)}
          source={sources[editing.id] ?? editing}
        />
      )}

      <AlertDialog open={deleting !== null} onOpenChange={(next) => !next && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {deleting ? sourceDisplayName(deleting) : ''} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingCount > 0
                ? `Elle sera retirée de ${deletingCount} élément${deletingCount > 1 ? 's' : ''}, et sa capture sera supprimée.`
                : 'Elle n’est utilisée par aucun élément. Sa capture éventuelle sera supprimée.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleting) removeSource(deleting.id)
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
