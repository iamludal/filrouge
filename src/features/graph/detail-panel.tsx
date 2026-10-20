import { DetailContent } from '@/features/graph/detail-content'

/** The detail panel docked on the right of the canvas on wide screens. */
export function DetailPanel() {
  return (
    <aside
      aria-label="Panneau de détail"
      className="flex w-80 shrink-0 flex-col overflow-y-auto border-l bg-background p-4"
    >
      <DetailContent />
    </aside>
  )
}
