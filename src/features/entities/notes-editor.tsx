import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { LIMITS } from '@/domain/schemas'
import { SafeMarkdown } from '@/lib/markdown'

export function NotesEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [preview, setPreview] = useState(value.length > 0)

  return (
    <div className="grid gap-2">
      <div className="flex justify-end gap-1">
        <Button variant={preview ? 'ghost' : 'secondary'} size="xs" onClick={() => setPreview(false)}>
          Écrire
        </Button>
        <Button variant={preview ? 'secondary' : 'ghost'} size="xs" onClick={() => setPreview(true)}>
          Aperçu
        </Button>
      </div>
      {preview ? (
        <div
          className="min-h-20 rounded-lg border p-2 text-sm"
          onDoubleClick={() => setPreview(false)}
          data-testid="notes-preview"
        >
          {value ? (
            <SafeMarkdown>{value}</SafeMarkdown>
          ) : (
            <span className="text-muted-foreground">Aucune note.</span>
          )}
        </div>
      ) : (
        <Textarea
          aria-label="Notes (Markdown)"
          value={value}
          maxLength={LIMITS.text}
          rows={8}
          placeholder="Notes en Markdown…"
          className="font-mono text-xs"
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  )
}
