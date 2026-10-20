import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { SourceFormDialog } from '@/features/sources/source-form-dialog'
import { useGraphStore, type ElementRef, type Selection } from '@/store/graph-store'
import { useI18n } from '@/i18n/locale'

/** The selected element, when exactly one entity or one relation is selected. */
function singleSelection({ entityIds, relationIds }: Selection): ElementRef | null {
  if (entityIds.length === 1 && relationIds.length === 0) return { type: 'entity', id: entityIds[0]! }
  if (entityIds.length === 0 && relationIds.length === 1) return { type: 'relation', id: relationIds[0]! }
  return null
}

function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]') !== null
  )
}

/**
 * Ctrl/Cmd+V on the graph: an image in the clipboard opens "Nouvelle source" with that screenshot,
 * for the selected element. Text pastes and pastes into fields or open dialogs are left alone.
 */
export function PasteScreenshot() {
  const hint = useI18n().t.sources.pasteHint
  const [pasted, setPasted] = useState<{ file: File; element: ElementRef } | null>(null)

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const image = [...(event.clipboardData?.files ?? [])].find((file) => file.type.startsWith('image/'))
      if (!image || isEditable(event.target)) return
      // A dialog (such as the source form) handles its own pastes.
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return
      event.preventDefault()
      const element = singleSelection(useGraphStore.getState().selection)
      if (element) setPasted({ file: image, element })
      else toast.info(hint)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [hint])

  if (!pasted) return null
  return (
    <SourceFormDialog
      open
      onOpenChange={(open) => !open && setPasted(null)}
      attachTo={pasted.element}
      initialFile={pasted.file}
    />
  )
}
