import { describe, expect, it } from 'vitest'
import { en } from './en'
import { fr } from './fr'

type Tree = { [key: string]: unknown }

/** Every leaf as `path -> value`, arrays and functions being leaves. */
function leaves(tree: Tree, prefix = ''): Map<string, unknown> {
  const out = new Map<string, unknown>()
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [inner, leaf] of leaves(value as Tree, path)) out.set(inner, leaf)
    } else out.set(path, value)
  }
  return out
}

const french = leaves(fr)
const english = leaves(en)

describe('dictionaries', () => {
  it('have the same keys', () => {
    expect([...english.keys()].sort()).toEqual([...french.keys()].sort())
  })

  it('have the same kind of value under each key', () => {
    for (const [path, value] of french) {
      const other = english.get(path)
      expect(typeof other, path).toBe(typeof value)
      expect(Array.isArray(other), path).toBe(Array.isArray(value))
    }
  })

  it('hold no empty text', () => {
    for (const [name, map] of [
      ['fr', french],
      ['en', english],
    ] as const) {
      for (const [path, value] of map) {
        if (typeof value === 'string') expect(value.trim(), `${name}.${path}`).not.toBe('')
        if (Array.isArray(value)) {
          expect(value.length, `${name}.${path}`).toBe((french.get(path) as unknown[]).length)
          for (const item of value) expect(String(item).trim(), `${name}.${path}`).not.toBe('')
        }
      }
    }
  })

  it('call every function with arguments and get text back', () => {
    for (const [name, map] of [
      ['fr', french],
      ['en', english],
    ] as const) {
      for (const [path, value] of map) {
        if (typeof value !== 'function') continue
        const text = (value as (...args: unknown[]) => unknown)('Sample', 3, 'x')
        expect(typeof text, `${name}.${path}`).toBe('string')
        expect((text as string).length, `${name}.${path}`).toBeGreaterThan(0)
      }
    }
  })

  it('keeps the entity type ids and scales in step', () => {
    expect(Object.keys(en.entityTypes)).toEqual(Object.keys(fr.entityTypes))
    expect(Object.keys(en.assessment.reliability)).toEqual(Object.keys(fr.assessment.reliability))
  })
})
