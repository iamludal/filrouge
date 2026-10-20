import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LIMITS, type PropertyValue } from '@/domain/schemas'
import { useI18n } from '@/i18n/locale'

interface PropertiesEditorProps {
  properties: Record<string, PropertyValue>
  suggestions: readonly string[]
  onChange: (properties: Record<string, PropertyValue>) => void
}

function display(value: PropertyValue): string {
  return value === null ? '' : String(value)
}

/** Rebuilds the record with one key renamed, preserving insertion order. */
function renameKey(properties: Record<string, PropertyValue>, from: string, to: string) {
  return Object.fromEntries(
    Object.entries(properties).map(([key, value]) => [key === from ? to : key, value]),
  )
}

export function PropertiesEditor({ properties, suggestions, onChange }: PropertiesEditorProps) {
  const { t } = useI18n()
  const texts = t.entities.propertiesEditor
  const [newKey, setNewKey] = useState('')
  const entries = Object.entries(properties)
  const missingSuggestions = suggestions.filter((key) => !(key in properties))

  const add = (key: string) => {
    const trimmed = key.trim()
    if (!trimmed || trimmed in properties || entries.length >= LIMITS.properties) return
    onChange({ ...properties, [trimmed]: '' })
    setNewKey('')
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {/* Name above its value, so that neither is squeezed in a narrow panel. */}
      {entries.map(([key, value]) => (
        <div key={key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-1.5 gap-y-1">
          <Input
            aria-label={texts.name}
            defaultValue={key}
            maxLength={LIMITS.propertyKey}
            className="h-7 border-transparent bg-transparent px-1.5 text-xs font-medium text-muted-foreground hover:border-input md:text-xs dark:bg-transparent"
            onBlur={(event) => {
              const next = event.target.value.trim()
              if (next === key) return
              if (!next || next in properties) {
                event.target.value = key
                return
              }
              onChange(renameKey(properties, key, next))
            }}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={texts.remove(key)}
            onClick={() => onChange(Object.fromEntries(entries.filter(([k]) => k !== key)))}
          >
            <X />
          </Button>
          <Input
            aria-label={texts.value(key)}
            value={display(value)}
            maxLength={LIMITS.propertyValue}
            className="col-span-2 h-8 text-xs"
            onChange={(event) => onChange({ ...properties, [key]: event.target.value })}
          />
        </div>
      ))}
      <form
        className="flex gap-1.5"
        onSubmit={(event) => {
          event.preventDefault()
          add(newKey)
        }}
      >
        <Input
          aria-label={texts.newLabel}
          placeholder={texts.newLabel}
          value={newKey}
          maxLength={LIMITS.propertyKey}
          onChange={(event) => setNewKey(event.target.value)}
          className="h-8 text-xs"
        />
        <Button type="submit" variant="outline" size="icon-sm" aria-label={texts.add}>
          <Plus />
        </Button>
      </form>
      {missingSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {missingSuggestions.map((key) => (
            <Button key={key} variant="secondary" size="xs" onClick={() => add(key)}>
              <Plus /> {key}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
