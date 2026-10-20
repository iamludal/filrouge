import { X } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { normalizeTags } from '@/domain/graph'
import { LIMITS } from '@/domain/schemas'
import { useI18n } from '@/i18n/locale'

export function TagsEditor({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const { t } = useI18n()
  const [draft, setDraft] = useState('')

  const commit = () => {
    if (!draft.trim()) return
    onChange(normalizeTags([...tags, ...draft.split(',')]).slice(0, LIMITS.tags))
    setDraft('')
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-1" aria-label={t.entities.tagsEditor.listLabel}>
          {tags.map((tag) => (
            <li key={tag} className="max-w-full">
              <Badge
                variant="secondary"
                className="h-auto max-w-full gap-1 pr-1 wrap-anywhere whitespace-normal"
              >
                {tag}
                <button
                  type="button"
                  className="shrink-0 rounded-sm opacity-60 hover:opacity-100 focus-visible:opacity-100"
                  aria-label={t.entities.tagsEditor.remove(tag)}
                  onClick={() => onChange(tags.filter((other) => other !== tag))}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
      <Input
        aria-label={t.entities.tagsEditor.addLabel}
        placeholder={t.entities.tagsEditor.placeholder}
        value={draft}
        maxLength={LIMITS.tag * 5}
        className="h-8 text-xs"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault()
            commit()
          }
        }}
      />
    </div>
  )
}
