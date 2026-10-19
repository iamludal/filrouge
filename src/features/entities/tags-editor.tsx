import { X } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { normalizeTags } from '@/domain/graph'
import { LIMITS } from '@/domain/schemas'

export function TagsEditor({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState('')

  const commit = () => {
    if (!draft.trim()) return
    onChange(normalizeTags([...tags, ...draft.split(',')]).slice(0, LIMITS.tags))
    setDraft('')
  }

  return (
    <div className="grid gap-2">
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-1" aria-label="Tags">
          {tags.map((tag) => (
            <li key={tag}>
              <Badge variant="secondary" className="gap-1 pr-1">
                {tag}
                <button
                  type="button"
                  className="rounded-sm opacity-60 hover:opacity-100 focus-visible:opacity-100"
                  aria-label={`Retirer le tag ${tag}`}
                  onClick={() => onChange(tags.filter((t) => t !== tag))}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
      <Input
        aria-label="Ajouter des tags"
        placeholder="Ajouter un tag (Entrée)"
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
