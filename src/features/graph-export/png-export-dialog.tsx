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

const number = (value: number) => value.toLocaleString('fr-FR')

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
  const [scale, setScale] = useState<PngScale>(DEFAULT_PNG_SCALE)
  const groupLabel = useId()

  return (
    <div className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Exporter « {pending.name} » en PNG</DialogTitle>
        <DialogDescription>L’image est enregistrée sur cet appareil, rien n’est envoyé.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3">
        <p id={groupLabel} className="text-sm font-medium">
          Échelle
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
                    {option}×{option === DEFAULT_PNG_SCALE && ' (recommandé)'}
                  </span>
                  <span className="text-muted-foreground">
                    {number(size.width)} × {number(size.height)} px{size.limited && ' (limitée)'}
                  </span>
                </label>
              </div>
            )
          })}
        </RadioGroup>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        {/* Focused on opening, so Enter exports at once at the recommended scale. */}
        <Button type="button" autoFocus onClick={() => onConfirm(scale)}>
          Exporter
        </Button>
      </DialogFooter>
    </div>
  )
}
