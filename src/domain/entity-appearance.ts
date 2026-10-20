import { ENTITY_TYPES, type EntityTypeId } from '@/domain/entity-types'

/** Palette ids are Tailwind colour names; values are their 600 shade (readable in both themes). */
export const ENTITY_COLORS = {
  red: '#dc2626',
  orange: '#ea580c',
  amber: '#d97706',
  yellow: '#ca8a04',
  lime: '#65a30d',
  green: '#16a34a',
  emerald: '#059669',
  teal: '#0d9488',
  cyan: '#0891b2',
  sky: '#0284c7',
  blue: '#2563eb',
  indigo: '#4f46e5',
  violet: '#7c3aed',
  purple: '#9333ea',
  pink: '#db2777',
  slate: '#64748b',
} as const

export type EntityColorId = keyof typeof ENTITY_COLORS

export const ENTITY_COLOR_IDS = Object.keys(ENTITY_COLORS) as [EntityColorId, ...EntityColorId[]]

/**
 * Icon ids map to lucide-react components in the UI layer; the domain stays DOM-free. Ids are
 * never removed, so files that use them stay valid. `flag` and `star` are left out on purpose:
 * the flag is the "important" badge.
 */
export const ENTITY_ICON_IDS = [
  // Entity type icons.
  'user',
  'at-sign',
  'mail',
  'phone',
  'globe',
  'server',
  'link',
  'building',
  'map-pin',
  'image',
  'file-text',
  'wallet',
  'car',
  'calendar',
  // Additional icons.
  'users',
  'venetian-mask',
  'ghost',
  'skull',
  'bot',
  'shield',
  'lock',
  'key-round',
  'eye',
  'crosshair',
  'triangle-alert',
  'bug',
  'smartphone',
  'laptop',
  'router',
  'database',
  'hard-drive',
  'cloud',
  'hash',
  'message-circle',
  'camera',
  'newspaper',
  'credit-card',
  'banknote',
  'landmark',
  'briefcase',
  'house',
  'plane',
  'ship',
  'gavel',
  'user-check',
  'user-x',
  'id-card',
  'contact',
  'baby',
  'crown',
  'handshake',
  'scale',
  'siren',
  'factory',
  'store',
  'school',
  'hospital',
  'hotel',
  'mountain',
  'map',
  'anchor',
  'train-front',
  'bus',
  'truck',
  'bike',
  'satellite',
  'radio-tower',
  'wifi',
  'cpu',
  'code',
  'terminal',
  'qr-code',
  'video',
  'mic',
  'coins',
  'bitcoin',
  'receipt',
  'package',
  'clock',
  'target',
  'scan-face',
  'radar',
  'drone',
  'helicopter',
  'sailboat',
  'fuel',
  'warehouse',
  'church',
  'tent',
  'printer',
  'headphones',
  'gamepad',
  'film',
  'gem',
  'book-open',
] as const

export type EntityIconId = (typeof ENTITY_ICON_IDS)[number]

export interface EntityAppearance {
  /** Hex colour. */
  color: string
  icon: EntityIconId
}

/** Colour and icon of an entity type, used where a type (not an entity) is shown. */
export function typeAppearance(type: EntityTypeId): EntityAppearance {
  const definition = ENTITY_TYPES[type]
  return { color: ENTITY_COLORS[definition.color], icon: definition.icon }
}

/** What an entity looks like: its own colour and icon, else its type's. */
export function entityAppearance(entity: {
  type: EntityTypeId
  color?: EntityColorId | undefined
  icon?: EntityIconId | undefined
}): EntityAppearance {
  const fallback = typeAppearance(entity.type)
  return {
    color: entity.color ? ENTITY_COLORS[entity.color] : fallback.color,
    icon: entity.icon ?? fallback.icon,
  }
}

/** Opacity of the veil of its own colour over an important entity's card background. */
export const IMPORTANT_TINT = 0.18

/** A veil of the entity's colour, `hex` being `#rrggbb`, over the card background. */
export function importantTint(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16))
  const veil = `rgba(${r}, ${g}, ${b}, ${IMPORTANT_TINT})`
  return `linear-gradient(${veil}, ${veil})`
}
