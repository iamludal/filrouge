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
import { Textarea } from '@/components/ui/textarea'
import { LIMITS } from '@/domain/schemas'

interface InvestigationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  submitLabel: string
  initial?: { name: string; description?: string }
  onSubmit: (values: { name: string; description: string }) => Promise<void>
}

export function InvestigationFormDialog(props: InvestigationFormDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        {/* Radix unmounts closed content, so the form state resets on each opening. */}
        <InvestigationForm {...props} />
      </DialogContent>
    </Dialog>
  )
}

function InvestigationForm({
  title,
  submitLabel,
  initial,
  onSubmit,
  onOpenChange,
}: InvestigationFormDialogProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      await onSubmit({ name: name.trim(), description: description.trim() })
      onOpenChange(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>Les données restent dans ce navigateur.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        <Label htmlFor="investigation-name">Nom</Label>
        <Input
          id="investigation-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={LIMITS.name}
          required
          autoFocus
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="investigation-description">Description (optionnelle)</Label>
        <Textarea
          id="investigation-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={LIMITS.text}
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
        <Button type="submit" disabled={busy || !name.trim()}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )
}
