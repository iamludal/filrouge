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
import { useI18n } from '@/i18n/locale'

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
  const { t, format } = useI18n()
  const { formatBytes } = format
  const [include, setInclude] = useState(true)
  const { stats } = pending
  const estimate = include ? estimateExportBytes(pending.baseJson.length, stats) : pending.baseJson.length
  const tooLarge = include && estimate > MAX_IMPORT_BYTES

  return (
    <div className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{t.importExport.dialog.title(pending.name)}</DialogTitle>
        <DialogDescription>{t.importExport.dialog.description}</DialogDescription>
      </DialogHeader>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4"
          checked={include}
          onChange={(event) => setInclude(event.target.checked)}
        />
        {t.importExport.dialog.include(stats.count, formatBytes(stats.totalSize))}
      </label>
      <p className="text-sm text-muted-foreground">{t.importExport.dialog.estimate(formatBytes(estimate))}</p>
      {tooLarge && (
        <p role="alert" className="text-sm text-destructive">
          {t.importExport.dialog.tooLarge(formatBytes(MAX_IMPORT_BYTES))}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t.common.cancel}
        </Button>
        <Button type="button" disabled={tooLarge} onClick={() => onConfirm(include)}>
          {t.graph.toolbar.export}
        </Button>
      </DialogFooter>
    </div>
  )
}
