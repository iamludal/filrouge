import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { LIMITS } from '@/domain/schemas'
import { SafeMarkdown } from '@/lib/markdown'
import { useI18n } from '@/i18n/locale'

export function NotesEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useI18n()
  const texts = t.entities.notesEditor
  const [preview, setPreview] = useState(value.length > 0)

  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="flex justify-end gap-1">
        <Button variant={preview ? 'ghost' : 'secondary'} size="xs" onClick={() => setPreview(false)}>
          {texts.write}
        </Button>
        <Button variant={preview ? 'secondary' : 'ghost'} size="xs" onClick={() => setPreview(true)}>
          {texts.preview}
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
            <span className="text-muted-foreground">{texts.none}</span>
          )}
        </div>
      ) : (
        <Textarea
          aria-label={texts.label}
          value={value}
          maxLength={LIMITS.text}
          rows={8}
          placeholder={texts.placeholder}
          className="font-mono text-xs"
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  )
}
