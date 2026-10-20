import { CalendarPlus, PenLine, type LucideIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDate, formatDateTimeFull } from '@/lib/format'

function DateLine({ icon: Icon, verb, iso }: { icon: LucideIcon; verb: string; iso: string }) {
  const label = `${verb} le ${formatDateTimeFull(iso)}`
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <time dateTime={iso} tabIndex={0} aria-label={label} className="flex w-fit items-center gap-1.5">
          <Icon className="size-3.5" aria-hidden />
          {formatDate(iso)}
        </time>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/** When an entity or relation was created and, once edited, last modified. */
export function ElementTimestamps({ createdAt, updatedAt }: { createdAt: string; updatedAt: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <DateLine icon={CalendarPlus} verb="Créée" iso={createdAt} />
      {updatedAt !== createdAt && <DateLine icon={PenLine} verb="Modifiée" iso={updatedAt} />}
    </div>
  )
}
