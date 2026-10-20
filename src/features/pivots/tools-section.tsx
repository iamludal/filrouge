import { Check, ExternalLink } from 'lucide-react'
import { Checkbox as CheckboxPrimitive } from 'radix-ui'
import { useMemo } from 'react'
import {
  pivotValue,
  resolveToolLink,
  toolsForType,
  TOOL_CATEGORIES,
  type ToolEntry,
} from '@/domain/pivot-tools'
import type { Entity } from '@/domain/schemas'
import { useI18n } from '@/i18n/locale'
import { safeUrl } from '@/lib/url'
import { useGraphStore } from '@/store/graph-store'

/** The hit area is 32 px, 44 px on narrow screens, around a 16 px box. */
function ToolCheckbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <CheckboxPrimitive.Root
      checked={checked}
      aria-label={label}
      onCheckedChange={(next) => onChange(next === true)}
      className="group/tool grid size-8 shrink-0 place-content-center rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50 max-md:size-11"
    >
      <span className="flex size-4 items-center justify-center rounded-[4px] border border-input transition-colors group-data-[state=checked]/tool:border-primary group-data-[state=checked]/tool:bg-primary group-data-[state=checked]/tool:text-primary-foreground dark:bg-input/30">
        <CheckboxPrimitive.Indicator>
          <Check className="size-3.5" aria-hidden />
        </CheckboxPrimitive.Indicator>
      </span>
    </CheckboxPrimitive.Root>
  )
}

function hostOf(href: string): string {
  try {
    return new URL(href).host
  } catch {
    return ''
  }
}

function ToolRow({
  entity,
  entry,
  value,
  checkedAt,
}: {
  entity: Entity
  entry: ToolEntry
  value: string
  checkedAt: string | undefined
}) {
  const { t, format } = useI18n()
  const setToolCheck = useGraphStore((state) => state.setToolCheck)
  const { tool } = entry
  const resolved = resolveToolLink(entry.link, value)
  const href = resolved ? safeUrl(resolved) : ''

  return (
    <li data-checked={checkedAt !== undefined} className="group/row flex items-center gap-1 text-sm">
      <ToolCheckbox
        checked={checkedAt !== undefined}
        label={t.pivots.markUsed(tool.name)}
        onChange={(checked) => setToolCheck(entity.id, tool.id, checked)}
      />
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.pivots.open(tool.name, hostOf(href))}
          className="flex min-h-8 min-w-0 flex-1 items-center gap-1.5 rounded px-1 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none max-md:min-h-11"
        >
          <span className="shrink-0 font-medium group-data-[checked=true]/row:font-normal group-data-[checked=true]/row:text-muted-foreground">
            {tool.name}
          </span>
          <span className="min-w-0 truncate text-xs text-muted-foreground">{hostOf(href)}</span>
          <ExternalLink className="size-3 shrink-0 text-muted-foreground" aria-hidden />
        </a>
      ) : (
        <span
          aria-disabled="true"
          className="flex min-h-8 min-w-0 flex-1 items-center gap-1.5 px-1 opacity-60 max-md:min-h-11"
        >
          <span className="font-medium">{tool.name}</span>
          <span className="text-xs">{t.pivots.needsLabel}</span>
        </span>
      )}
      {checkedAt && (
        <time
          dateTime={checkedAt}
          aria-label={t.pivots.checkedOn(format.formatDateTimeFull(checkedAt))}
          className="shrink-0 text-xs text-muted-foreground"
        >
          {format.formatDate(checkedAt)}
        </time>
      )}
    </li>
  )
}

/**
 * The tools of the catalog that apply to the entity's type, each a link to open and a manual
 * checkbox to record that it was used.
 */
export function ToolsPanel({ entity }: { entity: Entity }) {
  const { t } = useI18n()
  const entries = useMemo(() => toolsForType(entity.type), [entity.type])
  // Checks of tools not listed for this type (type changed, unknown id) stay stored, unseen.
  const checks = new Map((entity.toolChecks ?? []).map((check) => [check.toolId, check.checkedAt]))
  const value = pivotValue(entity.type, entity.label)

  return (
    <div className="grid grid-cols-1 gap-3">
      {TOOL_CATEGORIES.map((category) => {
        const inCategory = entries.filter((entry) => entry.tool.category === category)
        if (inCategory.length === 0) return null
        return (
          <section key={category} className="grid grid-cols-1 gap-0.5">
            <h3 className="px-1 text-xs font-medium text-muted-foreground">
              {t.pivots.categories[category]}
            </h3>
            <ul>
              {inCategory.map((entry) => (
                <ToolRow
                  key={entry.tool.id}
                  entity={entity}
                  entry={entry}
                  value={value}
                  checkedAt={checks.get(entry.tool.id)}
                />
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
