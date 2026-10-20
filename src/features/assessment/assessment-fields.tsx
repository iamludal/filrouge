import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  CREDIBILITY_VALUES,
  RELIABILITY_VALUES,
  formatConfidence,
  withCredibility,
  withReliability,
} from '@/domain/assessment'
import type { Confidence, Status } from '@/domain/schemas'
import { Field } from '@/features/entities/entity-panel'
import { useI18n } from '@/i18n/locale'

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
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex items-center gap-2">
        <Switch
          id={`${idPrefix}-hypothesis`}
          checked={status === 'hypothesis'}
          onCheckedChange={(checked) => onChange({ status: checked ? 'hypothesis' : 'verified' })}
        />
        <Label htmlFor={`${idPrefix}-hypothesis`}>{t.assessment.hypothesis}</Label>
      </div>
      <Field label={t.assessment.reliabilityField} htmlFor={`${idPrefix}-reliability`}>
        <Select
          value={confidence?.reliability ?? ''}
          onValueChange={(value) =>
            onChange({ confidence: withReliability(confidence, value as Confidence['reliability']) })
          }
        >
          <SelectTrigger id={`${idPrefix}-reliability`} className={WRAPPING_TRIGGER}>
            <SelectValue placeholder={t.assessment.unrated} />
          </SelectTrigger>
          <SelectContent>
            {RELIABILITY_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {value} – {t.assessment.reliability[value].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label={t.assessment.credibilityField} htmlFor={`${idPrefix}-credibility`}>
        <Select
          value={confidence ? String(confidence.credibility) : ''}
          onValueChange={(value) =>
            onChange({ confidence: withCredibility(confidence, Number(value) as Confidence['credibility']) })
          }
        >
          <SelectTrigger id={`${idPrefix}-credibility`} className={WRAPPING_TRIGGER}>
            <SelectValue placeholder={t.assessment.unrated} />
          </SelectTrigger>
          <SelectContent>
            {CREDIBILITY_VALUES.map((value) => (
              <SelectItem key={value} value={String(value)}>
                {value} – {t.assessment.credibility[value].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {confidence && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>{t.assessment.rating(formatConfidence(confidence))}</span>
          <Button variant="outline" size="sm" onClick={() => onChange({ confidence: undefined })}>
            {t.assessment.clear}
          </Button>
        </div>
      )}
    </div>
  )
}
