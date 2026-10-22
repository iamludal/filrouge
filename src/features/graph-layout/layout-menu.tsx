import { LayoutGrid, Network, Orbit, Waypoints, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LAYOUT_ALGORITHMS, type LayoutAlgorithm } from '@/domain/layout/types'
import { useAutoLayout, useCanLayout } from '@/features/graph-layout/use-auto-layout'
import { useI18n } from '@/i18n/locale'

const ICONS: Record<LayoutAlgorithm, LucideIcon> = {
  organic: Waypoints,
  hierarchical: Network,
  radial: Orbit,
}

/** The layouts, shared by the desktop menu and the narrow screens' "Mise en page" submenu. */
export function LayoutMenuItems() {
  const { t } = useI18n()
  const apply = useAutoLayout()

  return (
    <>
      {LAYOUT_ALGORITHMS.map((algorithm) => {
        const Icon = ICONS[algorithm]
        return (
          <DropdownMenuItem key={algorithm} className="whitespace-nowrap" onSelect={() => apply(algorithm)}>
            <Icon /> {t.graph.layout[algorithm]}
          </DropdownMenuItem>
        )
      })}
    </>
  )
}

/** The "Mise en page" button of the graph toolbar. */
export function LayoutMenu() {
  const { t } = useI18n()
  const canLayout = useCanLayout()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={!canLayout}>
          <LayoutGrid /> {t.graph.layout.menu}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <LayoutMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
