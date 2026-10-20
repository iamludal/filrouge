import { createElement, useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import { attachments as attachmentsRepository } from '@/db/repositories/attachments'
import { MAX_IMPORT_BYTES } from '@/domain/export-format'
import { formatImportError } from '@/features/import-export/import-errors'
import { useI18n } from '@/i18n/locale'
import { ExportDialog, type PendingExport } from '@/features/import-export/export-dialog'
import { downloadText, safeFilename } from '@/lib/download'
import { useInvestigationsStore } from '@/store/investigations-store'

export function useExportInvestigation() {
  const { t } = useI18n()
  const exportJson = useInvestigationsStore((state) => state.exportJson)
  const [pending, setPending] = useState<PendingExport | null>(null)

  const exportInvestigation = useCallback(
    async (id: string) => {
      // Without screenshots first: it is the whole export when there are none, and it gives the
      // base size for the estimate otherwise.
      const base = await exportJson(id, false)
      if (!base) {
        toast.error(t.importExport.notFound)
        return
      }
      const stats = await attachmentsRepository.stats(id)
      if (stats.count === 0) {
        downloadText(safeFilename(base.name, 'filrouge.json'), base.json)
        return
      }
      setPending({ id, name: base.name, baseJson: base.json, stats })
    },
    [exportJson, t],
  )

  const confirm = async (includeAttachments: boolean) => {
    if (!pending) return
    const { id, name, baseJson } = pending
    setPending(null)
    const json = includeAttachments ? (await exportJson(id, true))?.json : baseJson
    if (json === undefined) {
      toast.error(t.importExport.notFound)
      return
    }
    downloadText(safeFilename(name, 'filrouge.json'), json)
  }

  const exportDialog = createElement(ExportDialog, {
    pending,
    onCancel: () => setPending(null),
    onConfirm: (include: boolean) => void confirm(include),
  })

  return { exportInvestigation, exportDialog }
}

/** Returns a ref for a hidden file input and a function opening the file picker. */
export function useImportInvestigation(onImported?: (id: string) => void) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { t, format } = useI18n()
  const importJson = useInvestigationsStore((state) => state.importJson)

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_IMPORT_BYTES) {
        toast.error(t.importExport.fileTooLarge(format.formatBytes(MAX_IMPORT_BYTES)))
        return
      }
      try {
        const result = await importJson(await file.text())
        if (!result.ok) {
          toast.error(t.importExport.refused, {
            description: result.errors.map((error) => formatImportError(t, error)).join('\n'),
          })
          return
        }
        toast.success(result.copied ? t.importExport.importedCopy : t.importExport.imported)
        onImported?.(result.investigation.id)
      } catch (error) {
        console.error('Import failed', error instanceof Error ? error.name : 'unknown')
        toast.error(t.importExport.failed)
      }
    },
    [importJson, onImported, t, format],
  )

  const inputProps = {
    ref: inputRef,
    type: 'file' as const,
    accept: 'application/json,.json',
    className: 'hidden',
    'aria-hidden': true,
    tabIndex: -1,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (file) void handleFile(file)
    },
  }

  return { inputProps, open: () => inputRef.current?.click() }
}
