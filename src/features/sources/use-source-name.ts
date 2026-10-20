import { useCallback } from 'react'
import type { Source } from '@/domain/schemas'
import { sourceDisplayName } from '@/domain/sources'
import { useI18n } from '@/i18n/locale'

/** Names a source wherever it is listed: its title, else its host name, else a placeholder. */
export function useSourceName(): (source: Pick<Source, 'title' | 'url'>) => string {
  const { t } = useI18n()
  return useCallback((source) => sourceDisplayName(source) ?? t.sources.untitled, [t])
}
