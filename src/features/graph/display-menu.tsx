import { BadgeCheck, Eye, Flag, RotateCcw, Tag, Type, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { isDefaultDisplay, MENU_OPTIONS } from '@/domain/display-options'
import { useI18n } from '@/i18n/locale'
import { useDisplayStore } from '@/store/display-store'

const ICONS: Record<(typeof MENU_OPTIONS)[number], LucideIcon> = {
  entityLabels: Type,
  relationLabels: Tag,
  ratings: BadgeCheck,
  importantMark: Flag,
}

/**
 * The checkable display options and the reset item, shared by the desktop menu and the narrow
 * screens' "Affichage" submenu. The mini-map is not here: it has its own button on the canvas.
 */
export function DisplayMenuItems() {
  const { t } = useI18n()
  const options = useDisplayStore((state) => state.options)
  const labels = {
    entityLabels: t.graph.display.entityLabels,
    relationLabels: t.graph.display.relationLabels,
    ratings: t.graph.display.ratings,
    importantMark: t.graph.display.importantMark,
  }

  return (
    <>
      {MENU_OPTIONS.map((key) => {
        const Icon = ICONS[key]
        return (
          <DropdownMenuCheckboxItem
            key={key}
            className="whitespace-nowrap"
            checked={options[key]}
            // Keep the menu open: several options are often changed in a row.
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={() => useDisplayStore.getState().toggle(key)}
          >
            <Icon /> {labels[key]}
          </DropdownMenuCheckboxItem>
        )
      })}
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="whitespace-nowrap"
        disabled={isDefaultDisplay(options)}
        onSelect={() => useDisplayStore.getState().reset()}
      >
        <RotateCcw /> {t.graph.display.reset}
      </DropdownMenuItem>
    </>
  )
}

/** The "Affichage" button of the graph toolbar, with a dot while an option is unchecked. */
export function DisplayMenu() {
  const { t } = useI18n()
  const changed = useDisplayStore((state) => !isDefaultDisplay(state.options))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Eye /> {t.graph.display.menu}
          {changed && (
            <span
              aria-hidden
              data-testid="display-dot"
              className="absolute -top-1 -right-1 size-2 rounded-full bg-primary"
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      {/* Sized by its items, not by the trigger button. */}
      <DropdownMenuContent align="end" className="w-auto">
        <DisplayMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
