import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useI18n } from '@/i18n/locale'
import { DEFAULT_PNG_SCALE, PNG_SCALES, pngSize, type PngScale } from '@/features/graph-export/png'

export interface PendingPng {
  name: string
  svg: string
  /** Drawing size, before scaling. */
  width: number
  height: number
}

interface PngExportDialogProps {
  pending: PendingPng | null
  onCancel: () => void
  onConfirm: (scale: PngScale) => void
}

export function PngExportDialog({ pending, onCancel, onConfirm }: PngExportDialogProps) {
  return (
    <Dialog open={pending !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        {/* Radix unmounts closed content, so the scale is back to its default on each opening. */}
        {pending && <PngForm pending={pending} onCancel={onCancel} onConfirm={onConfirm} />}
      </DialogContent>
    </Dialog>
  )
}

function PngForm({
  pending,
  onCancel,
  onConfirm,
}: {
  pending: PendingPng
  onCancel: () => void
  onConfirm: (scale: PngScale) => void
}) {
  const { t, format } = useI18n()
  const { formatNumber } = format
  const [scale, setScale] = useState<PngScale>(DEFAULT_PNG_SCALE)
  const groupLabel = useId()

  return (
    <div className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{t.graphExport.pngTitle(pending.name)}</DialogTitle>
        <DialogDescription>{t.graphExport.pngDescription}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3">
        <p id={groupLabel} className="text-sm font-medium">
          {t.graphExport.scale}
        </p>
        <RadioGroup
          aria-labelledby={groupLabel}
          value={String(scale)}
          onValueChange={(value) => setScale(Number(value) as PngScale)}
        >
          {PNG_SCALES.map((option) => {
            const size = pngSize(pending.width, pending.height, option)
            const id = `${groupLabel}-${option}`
            return (
              <div key={option} className="flex items-center gap-2 text-sm">
                <RadioGroupItem id={id} value={String(option)} />
                <label htmlFor={id} className="flex cursor-pointer gap-2">
                  <span className="font-medium">
                    {option}×{option === DEFAULT_PNG_SCALE && t.graphExport.recommended}
                  </span>
                  <span className="text-muted-foreground">
                    {formatNumber(size.width)} × {formatNumber(size.height)} px
                    {size.limited && t.graphExport.limited}
                  </span>
                </label>
              </div>
            )
          })}
        </RadioGroup>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t.common.cancel}
        </Button>
        {/* Focused on opening, so Enter exports at once at the recommended scale. */}
        <Button type="button" autoFocus onClick={() => onConfirm(scale)}>
          {t.graph.toolbar.export}
        </Button>
      </DialogFooter>
    </div>
  )
}
