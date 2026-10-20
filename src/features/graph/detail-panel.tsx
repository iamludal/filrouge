import { DetailContent } from '@/features/graph/detail-content'
import { useI18n } from '@/i18n/locale'

/** The detail panel docked on the right of the canvas on wide screens. */
export function DetailPanel() {
  const { t } = useI18n()
  return (
    <aside
      aria-label={t.detail.panelLabel}
      className="flex w-80 shrink-0 flex-col overflow-x-hidden overflow-y-auto border-l bg-background p-4"
    >
      <DetailContent />
    </aside>
  )
}
