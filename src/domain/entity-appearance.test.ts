import {
  ENTITY_COLOR_IDS,
  ENTITY_COLORS,
  ENTITY_ICON_IDS,
  entityAppearance,
  typeAppearance,
} from '@/domain/entity-appearance'
import { ENTITY_TYPE_IDS, ENTITY_TYPES } from '@/domain/entity-types'

describe('entity appearance', () => {
  it('offers 16 distinct colours with distinct hex values', () => {
    expect(ENTITY_COLOR_IDS).toHaveLength(16)
    expect(new Set(Object.values(ENTITY_COLORS)).size).toBe(16)
  })

  it('offers 95 distinct kebab-case icons, without flag nor star', () => {
    expect(ENTITY_ICON_IDS).toHaveLength(95)
    expect(new Set(ENTITY_ICON_IDS).size).toBe(95)
    for (const id of ENTITY_ICON_IDS) expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/)
    expect(ENTITY_ICON_IDS).not.toContain('flag')
    expect(ENTITY_ICON_IDS).not.toContain('star')
  })

  it('draws every type in a palette colour and an icon of the set', () => {
    for (const type of ENTITY_TYPE_IDS) {
      const { color, icon } = ENTITY_TYPES[type]
      expect(ENTITY_COLOR_IDS).toContain(color)
      expect(ENTITY_ICON_IDS).toContain(icon)
    }
  })

  it("falls back to the type's colour and icon", () => {
    expect(entityAppearance({ type: 'person' })).toEqual({ color: ENTITY_COLORS.blue, icon: 'user' })
    expect(entityAppearance({ type: 'person' })).toEqual(typeAppearance('person'))
  })

  it('uses the custom colour and icon, each independently', () => {
    expect(entityAppearance({ type: 'person', color: 'red', icon: 'skull' })).toEqual({
      color: ENTITY_COLORS.red,
      icon: 'skull',
    })
    expect(entityAppearance({ type: 'person', color: 'red' })).toEqual({
      color: ENTITY_COLORS.red,
      icon: 'user',
    })
    expect(entityAppearance({ type: 'person', icon: 'skull' })).toEqual({
      color: ENTITY_COLORS.blue,
      icon: 'skull',
    })
  })

  it('keeps the custom values when only the type changes', () => {
    const custom = { color: 'red', icon: 'skull' } as const
    expect(entityAppearance({ type: 'email', ...custom })).toEqual(
      entityAppearance({ type: 'person', ...custom }),
    )
  })
})
