import { CalendarPlus, PenLine, type LucideIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useI18n } from '@/i18n/locale'

function DateLine({
  icon: Icon,
  kind,
  iso,
  showTime,
}: {
  icon: LucideIcon
  kind: 'created' | 'modified'
  iso: string
  showTime: boolean
}) {
  const { t, format } = useI18n()
  const { formatDate, formatDateTime, formatDateTimeFull } = format
  const label = t.entities.timestamps[kind](formatDateTimeFull(iso))
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <time dateTime={iso} tabIndex={0} aria-label={label} className="flex w-fit items-center gap-1.5">
          <Icon className="size-3.5" aria-hidden />
          {showTime ? formatDateTime(iso) : formatDate(iso)}
        </time>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/** When an element was created and, once edited, last modified. `showTime` adds the time of day. */
export function ElementTimestamps({
  createdAt,
  updatedAt,
  showTime = false,
}: {
  createdAt: string
  updatedAt: string
  showTime?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <DateLine icon={CalendarPlus} kind="created" iso={createdAt} showTime={showTime} />
      {updatedAt !== createdAt && (
        <DateLine icon={PenLine} kind="modified" iso={updatedAt} showTime={showTime} />
      )}
    </div>
  )
}
