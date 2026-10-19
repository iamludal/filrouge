import { useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { MAX_IMPORT_BYTES } from '@/domain/export-format'
import { downloadText, safeFilename } from '@/lib/download'
import { useInvestigationsStore } from '@/store/investigations-store'

export function useExportInvestigation() {
  const exportJson = useInvestigationsStore((state) => state.exportJson)
  return useCallback(
    async (id: string) => {
      const result = await exportJson(id)
      if (!result) {
        toast.error('Enquête introuvable')
        return
      }
      downloadText(safeFilename(result.name, 'filrouge.json'), result.json)
    },
    [exportJson],
  )
}

/** Returns a ref for a hidden file input and a function opening the file picker. */
export function useImportInvestigation(onImported?: (id: string) => void) {
  const inputRef = useRef<HTMLInputElement>(null)
  const importJson = useInvestigationsStore((state) => state.importJson)

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_IMPORT_BYTES) {
        toast.error('Fichier trop volumineux (50 Mo maximum)')
        return
      }
      try {
        const result = await importJson(await file.text())
        if (!result.ok) {
          toast.error('Import refusé : fichier invalide', { description: result.errors.join('\n') })
          return
        }
        toast.success(
          result.copied ? 'Enquête importée comme copie (elle existait déjà)' : 'Enquête importée',
        )
        onImported?.(result.investigation.id)
      } catch (error) {
        console.error('Import failed', error instanceof Error ? error.name : 'unknown')
        toast.error('Import impossible')
      }
    },
    [importJson, onImported],
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
