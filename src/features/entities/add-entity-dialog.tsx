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
        <DialogTitle>Nouvelle entité</DialogTitle>
        <DialogDescription>
          Le libellé pourra être modifié ensuite dans le panneau de détail.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        <Label htmlFor="entity-type">Type</Label>
        <EntityTypeSelect id="entity-type" value={type} onChange={setType} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="entity-label">Libellé</Label>
        <Input
          id="entity-label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          maxLength={LIMITS.label}
          placeholder="ex. jean.dupont@example.org"
          autoFocus
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
        <Button type="submit">Ajouter</Button>
      </DialogFooter>
    </form>
  )
}
