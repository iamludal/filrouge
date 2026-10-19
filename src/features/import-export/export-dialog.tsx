import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AttachmentStats } from '@/db/repositories/attachments'
import { MAX_IMPORT_BYTES, estimateExportBytes } from '@/domain/export-format'
import { formatBytes } from '@/lib/format'

export interface PendingExport {
  id: string
  name: string
  /** The export without screenshots, ready to download as is. */
  baseJson: string
  stats: AttachmentStats
}

interface ExportDialogProps {
  pending: PendingExport | null
  onCancel: () => void
  onConfirm: (includeAttachments: boolean) => void
}

export function ExportDialog({ pending, onCancel, onConfirm }: ExportDialogProps) {
  return (
    <Dialog open={pending !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        {/* Radix unmounts closed content, so the checkbox is checked again on each opening. */}
        {pending && <ExportForm pending={pending} onCancel={onCancel} onConfirm={onConfirm} />}
      </DialogContent>
    </Dialog>
  )
}

function ExportForm({
  pending,
  onCancel,
  onConfirm,
}: {
  pending: PendingExport
  onCancel: () => void
  onConfirm: (includeAttachments: boolean) => void
}) {
  const [include, setInclude] = useState(true)
  const { stats } = pending
  const estimate = include ? estimateExportBytes(pending.baseJson.length, stats) : pending.baseJson.length
  const tooLarge = include && estimate > MAX_IMPORT_BYTES

  return (
    <div className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Exporter « {pending.name} »</DialogTitle>
        <DialogDescription>Le fichier est enregistré sur cet appareil, rien n’est envoyé.</DialogDescription>
      </DialogHeader>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4"
          checked={include}
          onChange={(event) => setInclude(event.target.checked)}
        />
        Inclure les captures ({stats.count}, {formatBytes(stats.totalSize)})
      </label>
      <p className="text-sm text-muted-foreground">Taille estimée : environ {formatBytes(estimate)}</p>
      {tooLarge && (
        <p role="alert" className="text-sm text-destructive">
          Fichier estimé à plus de 200 Mo : il ne pourrait pas être réimporté. Excluez les captures ou
          optimisez les plus lourdes.
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="button" disabled={tooLarge} onClick={() => onConfirm(include)}>
          Exporter
        </Button>
      </DialogFooter>
    </div>
  )
}
