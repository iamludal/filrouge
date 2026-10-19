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
import { Switch } from '@/components/ui/switch'
import { RELATION_SUGGESTIONS } from '@/domain/relations'
import { LIMITS } from '@/domain/schemas'

interface RelationDialogProps {
  open: boolean
  fromLabel: string
  toLabel: string
  onOpenChange: (open: boolean) => void
  onSubmit: (label: string, directed: boolean) => void
}

export function RelationDialog({ open, onOpenChange, ...props }: RelationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <RelationForm onOpenChange={onOpenChange} {...props} />
      </DialogContent>
    </Dialog>
  )
}

function RelationForm({ fromLabel, toLabel, onOpenChange, onSubmit }: Omit<RelationDialogProps, 'open'>) {
  const [label, setLabel] = useState('')
  const [directed, setDirected] = useState(true)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit(label.trim() || 'lié à', directed)
    onOpenChange(false)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Nouvelle relation</DialogTitle>
        <DialogDescription className="truncate">
          {fromLabel} → {toLabel}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        <Label htmlFor="relation-label">Libellé</Label>
        <Input
          id="relation-label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          maxLength={LIMITS.label}
          placeholder="lié à"
          list="relation-suggestions"
          autoFocus
        />
        <datalist id="relation-suggestions">
          {RELATION_SUGGESTIONS.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="relation-directed" checked={directed} onCheckedChange={setDirected} />
        <Label htmlFor="relation-directed">Orientée (flèche)</Label>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
        <Button type="submit">Créer la relation</Button>
      </DialogFooter>
    </form>
  )
}
