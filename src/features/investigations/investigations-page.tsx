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
import { ElementTimestamps } from '@/features/entities/element-timestamps'
import { useExportInvestigation, useImportInvestigation } from '@/features/import-export/use-import-export'
import { InvestigationFormDialog } from '@/features/investigations/investigation-form-dialog'
import { useInvestigationsStore } from '@/store/investigations-store'
import { useI18n } from '@/i18n/locale'

export function InvestigationsPage() {
  const { t } = useI18n()
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
          <h1 className="text-2xl font-semibold tracking-tight">{t.home.title}</h1>
          <p className="text-sm text-muted-foreground">{t.home.storedLocally}</p>
        </div>
        <div className="flex gap-2">
          <input {...importer.inputProps} data-testid="import-input" />
          <Button variant="outline" onClick={importer.open}>
            <FileUp /> {t.home.import}
          </Button>
          <Button onClick={() => setCreating(true)}>
            <Plus /> {t.home.new}
          </Button>
        </div>
      </div>

      {loaded && items.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          {t.home.empty}
        </div>
      )}

      <ul className="grid grid-cols-1 gap-3" aria-label={t.home.listLabel}>
        {items.map((investigation) => (
          <li
            key={investigation.id}
            className="group flex items-start gap-3 rounded-xl border bg-card px-4 py-5 transition-colors hover:bg-muted/50"
          >
            <a
              href={routeHref({ name: 'investigation', id: investigation.id })}
              className="min-w-0 flex-1 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <div className="truncate font-medium">{investigation.name}</div>
              {investigation.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{investigation.description}</p>
              )}
              <div className="mt-2.5">
                <ElementTimestamps
                  createdAt={investigation.createdAt}
                  updatedAt={investigation.updatedAt}
                  showTime
                />
              </div>
            </a>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t.home.actionsFor(investigation.name)}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setRenaming(investigation)}>
                  <Pencil /> {t.home.rename}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void exportInvestigation(investigation.id)}>
                  <FileDown /> {t.home.exportJson}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(investigation)}>
                  <Trash2 /> {t.common.delete}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        ))}
      </ul>

      <InvestigationFormDialog
        open={creating}
        onOpenChange={setCreating}
        title={t.home.new}
        submitLabel={t.home.create}
        onSubmit={async ({ name, description }) => {
          const investigation = await create(name, description || undefined)
          navigate({ name: 'investigation', id: investigation.id })
        }}
      />

      <InvestigationFormDialog
        open={renaming !== null}
        onOpenChange={(open) => !open && setRenaming(null)}
        title={t.home.renameTitle}
        submitLabel={t.common.save}
        initial={renaming ?? undefined}
        onSubmit={async ({ name, description }) => {
          if (renaming) await update(renaming.id, { name, description: description || undefined })
        }}
      />

      {exportDialog}
      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.home.deleteTitle(deleting?.name ?? '')}</AlertDialogTitle>
            <AlertDialogDescription>{t.home.deleteDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (!deleting) return
                await remove(deleting.id)
                toast.success(t.home.deleted)
              }}
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
