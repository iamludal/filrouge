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
import { useI18n } from '@/i18n/locale'
import { LIMITS, type Status } from '@/domain/schemas'

interface RelationDialogProps {
  open: boolean
  fromLabel: string
  toLabel: string
  onOpenChange: (open: boolean) => void
  onSubmit: (label: string, directed: boolean, status: Status) => void
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
  const { t } = useI18n()
  const [label, setLabel] = useState('')
  const [directed, setDirected] = useState(true)
  const [hypothesis, setHypothesis] = useState(true)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit(label.trim() || t.relations.defaultLabel, directed, hypothesis ? 'hypothesis' : 'verified')
    onOpenChange(false)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{t.relations.new}</DialogTitle>
        <DialogDescription className="truncate">
          {fromLabel} → {toLabel}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        <Label htmlFor="relation-label">{t.relations.label}</Label>
        <Input
          id="relation-label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          maxLength={LIMITS.label}
          placeholder={t.relations.defaultLabel}
          list="relation-suggestions"
          autoFocus
        />
        <datalist id="relation-suggestions">
          {t.relations.suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="relation-directed" checked={directed} onCheckedChange={setDirected} />
        <Label htmlFor="relation-directed">{t.relations.directedArrow}</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="relation-hypothesis" checked={hypothesis} onCheckedChange={setHypothesis} />
        <Label htmlFor="relation-hypothesis">{t.assessment.hypothesis}</Label>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          {t.common.cancel}
        </Button>
        <Button type="submit">{t.relations.create}</Button>
      </DialogFooter>
    </form>
  )
}
