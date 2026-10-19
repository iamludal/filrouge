import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LIMITS, type PropertyValue } from '@/domain/schemas'

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
    <div className="grid gap-2">
      {entries.map(([key, value]) => (
        <div key={key} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] gap-1.5">
          <Input
            aria-label="Nom de la propriété"
            defaultValue={key}
            maxLength={LIMITS.propertyKey}
            className="h-8 text-xs text-muted-foreground"
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
          <Input
            aria-label={`Valeur de ${key}`}
            value={display(value)}
            maxLength={LIMITS.propertyValue}
            className="h-8 text-xs"
            onChange={(event) => onChange({ ...properties, [key]: event.target.value })}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Supprimer la propriété ${key}`}
            onClick={() => onChange(Object.fromEntries(entries.filter(([k]) => k !== key)))}
          >
            <X />
          </Button>
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
          aria-label="Nouvelle propriété"
          placeholder="Nouvelle propriété"
          value={newKey}
          maxLength={LIMITS.propertyKey}
          onChange={(event) => setNewKey(event.target.value)}
          className="h-8 text-xs"
        />
        <Button type="submit" variant="outline" size="icon-sm" aria-label="Ajouter la propriété">
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
