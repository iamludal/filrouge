import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { EntityTypeId } from '@/domain/entity-types'
import { LIMITS } from '@/domain/schemas'
import { EntityTypeSelect } from '@/features/entities/entity-type-select'
import { useI18n } from '@/i18n/locale'

interface AddEntityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (type: EntityTypeId, label: string) => void
}

let lastType: EntityTypeId = 'person'

export function AddEntityDialog({ open, onOpenChange, onSubmit }: AddEntityDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <AddEntityForm onOpenChange={onOpenChange} onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  )
}

function AddEntityForm({ onOpenChange, onSubmit }: Omit<AddEntityDialogProps, 'open'>) {
  const { t } = useI18n()
  const [type, setType] = useState<EntityTypeId>(lastType)
  const [label, setLabel] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    lastType = type
    onSubmit(type, label)
    onOpenChange(false)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{t.entities.add.title}</DialogTitle>
        <DialogDescription>{t.entities.add.description}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        <Label htmlFor="entity-type">{t.entities.type}</Label>
        <EntityTypeSelect id="entity-type" value={type} onChange={setType} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="entity-label">{t.entities.label}</Label>
        <Input
          id="entity-label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          maxLength={LIMITS.label}
          placeholder={t.entities.add.placeholder}
          autoFocus
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          {t.common.cancel}
        </Button>
        <Button type="submit">{t.entities.add.submit}</Button>
      </DialogFooter>
    </form>
  )
}
