import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  CREDIBILITY,
  RELIABILITY,
  formatConfidence,
  withCredibility,
  withReliability,
} from '@/domain/assessment'
import type { Confidence, Status } from '@/domain/schemas'
import { Field } from '@/features/entities/entity-panel'

/** A full-width trigger whose value wraps instead of being clipped in a narrow panel. */
const WRAPPING_TRIGGER =
  'w-full whitespace-normal text-left data-[size=default]:h-auto data-[size=default]:min-h-8 *:data-[slot=select-value]:line-clamp-none'

export type AssessmentPatch = { status: Status } | { confidence: Confidence | undefined }

interface AssessmentFieldsProps {
  idPrefix: string
  status: Status
  confidence: Confidence | undefined
  onChange: (patch: AssessmentPatch) => void
}

/** Status switch and Admiralty grade of an entity or a relation. */
export function AssessmentFields({ idPrefix, status, confidence, onChange }: AssessmentFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex items-center gap-2">
        <Switch
          id={`${idPrefix}-hypothesis`}
          checked={status === 'hypothesis'}
          onCheckedChange={(checked) => onChange({ status: checked ? 'hypothesis' : 'verified' })}
        />
        <Label htmlFor={`${idPrefix}-hypothesis`}>Hypothèse</Label>
      </div>
      <Field label="Fiabilité de la source" htmlFor={`${idPrefix}-reliability`}>
        <Select
          value={confidence?.reliability ?? ''}
          onValueChange={(value) =>
            onChange({ confidence: withReliability(confidence, value as Confidence['reliability']) })
          }
        >
          <SelectTrigger id={`${idPrefix}-reliability`} className={WRAPPING_TRIGGER}>
            <SelectValue placeholder="Non évaluée" />
          </SelectTrigger>
          <SelectContent>
            {RELIABILITY.map((grade) => (
              <SelectItem key={grade.value} value={grade.value}>
                {grade.value} — {grade.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Crédibilité de l’information" htmlFor={`${idPrefix}-credibility`}>
        <Select
          value={confidence ? String(confidence.credibility) : ''}
          onValueChange={(value) =>
            onChange({ confidence: withCredibility(confidence, Number(value) as Confidence['credibility']) })
          }
        >
          <SelectTrigger id={`${idPrefix}-credibility`} className={WRAPPING_TRIGGER}>
            <SelectValue placeholder="Non évaluée" />
          </SelectTrigger>
          <SelectContent>
            {CREDIBILITY.map((grade) => (
              <SelectItem key={grade.value} value={String(grade.value)}>
                {grade.value} — {grade.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {confidence && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>Cotation : {formatConfidence(confidence)}</span>
          <Button variant="outline" size="sm" onClick={() => onChange({ confidence: undefined })}>
            Effacer la cotation
          </Button>
        </div>
      )}
    </div>
  )
}
