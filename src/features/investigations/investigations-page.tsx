import { FileDown, FileUp, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { navigate, routeHref } from '@/app/router'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Investigation } from '@/domain/schemas'
import { useExportInvestigation, useImportInvestigation } from '@/features/import-export/use-import-export'
import { InvestigationFormDialog } from '@/features/investigations/investigation-form-dialog'
import { formatDateTime } from '@/lib/format'
import { useInvestigationsStore } from '@/store/investigations-store'

export function InvestigationsPage() {
  const { items, loaded, refresh, create, update, remove } = useInvestigationsStore()
  const [creating, setCreating] = useState(false)
  const [renaming, setRenaming] = useState<Investigation | null>(null)
  const [deleting, setDeleting] = useState<Investigation | null>(null)
  const { exportInvestigation, exportDialog } = useExportInvestigation()
  const importer = useImportInvestigation()

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Enquêtes</h1>
          <p className="text-sm text-muted-foreground">Stockées uniquement dans ce navigateur.</p>
        </div>
        <div className="flex gap-2">
          <input {...importer.inputProps} data-testid="import-input" />
          <Button variant="outline" onClick={importer.open}>
            <FileUp /> Importer
          </Button>
          <Button onClick={() => setCreating(true)}>
            <Plus /> Nouvelle enquête
          </Button>
        </div>
      </div>

      {loaded && items.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          Aucune enquête pour le moment. Créez-en une ou importez un fichier JSON.
        </div>
      )}

      <ul className="grid grid-cols-1 gap-3" aria-label="Liste des enquêtes">
        {items.map((investigation) => (
          <li
            key={investigation.id}
            className="group flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
          >
            <a
              href={routeHref({ name: 'investigation', id: investigation.id })}
              className="min-w-0 flex-1 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <div className="truncate font-medium">{investigation.name}</div>
              {investigation.description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">{investigation.description}</p>
              )}
              <div className="mt-1 text-xs text-muted-foreground">
                Modifiée le {formatDateTime(investigation.updatedAt)}
              </div>
            </a>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Actions pour ${investigation.name}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setRenaming(investigation)}>
                  <Pencil /> Renommer
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void exportInvestigation(investigation.id)}>
                  <FileDown /> Exporter en JSON
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(investigation)}>
                  <Trash2 /> Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        ))}
      </ul>

      <InvestigationFormDialog
        open={creating}
        onOpenChange={setCreating}
        title="Nouvelle enquête"
        submitLabel="Créer"
        onSubmit={async ({ name, description }) => {
          const investigation = await create(name, description || undefined)
          navigate({ name: 'investigation', id: investigation.id })
        }}
      />

      <InvestigationFormDialog
        open={renaming !== null}
        onOpenChange={(open) => !open && setRenaming(null)}
        title="Renommer l’enquête"
        submitLabel="Enregistrer"
        initial={renaming ?? undefined}
        onSubmit={async ({ name, description }) => {
          if (renaming) await update(renaming.id, { name, description: description || undefined })
        }}
      />

      {exportDialog}
      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {deleting?.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Toutes les entités, relations et sources de cette enquête seront définitivement supprimées de ce
              navigateur. Exportez-la d’abord si vous souhaitez la conserver.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (!deleting) return
                await remove(deleting.id)
                toast.success('Enquête supprimée')
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
