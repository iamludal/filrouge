export const ENTITY_TYPE_IDS = [
  'person',
  'alias',
  'email',
  'phone',
  'domain',
  'ip',
  'url',
  'organization',
  'address',
  'image',
  'document',
  'crypto_wallet',
  'vehicle',
  'event',
] as const

export type EntityTypeId = (typeof ENTITY_TYPE_IDS)[number]

/** Icon names map to lucide-react components in the UI layer; the domain stays DOM-free. */
export type EntityIconName =
  | 'user'
  | 'at-sign'
  | 'mail'
  | 'phone'
  | 'globe'
  | 'server'
  | 'link'
  | 'building'
  | 'map-pin'
  | 'image'
  | 'file-text'
  | 'wallet'
  | 'car'
  | 'calendar'

export interface EntityTypeDefinition {
  id: EntityTypeId
  icon: EntityIconName
  color: string
}

export const ENTITY_TYPES: Record<EntityTypeId, EntityTypeDefinition> = {
  person: {
    id: 'person',
    icon: 'user',
    color: '#2563eb',
  },
  alias: {
    id: 'alias',
    icon: 'at-sign',
    color: '#7c3aed',
  },
  email: { id: 'email', icon: 'mail', color: '#db2777' },
  phone: {
    id: 'phone',
    icon: 'phone',
    color: '#ea580c',
  },
  domain: {
    id: 'domain',
    icon: 'globe',
    color: '#0891b2',
  },
  ip: { id: 'ip', icon: 'server', color: '#0d9488' },
  url: { id: 'url', icon: 'link', color: '#0284c7' },
  organization: {
    id: 'organization',
    icon: 'building',
    color: '#4f46e5',
  },
  address: {
    id: 'address',
    icon: 'map-pin',
    color: '#16a34a',
  },
  image: {
    id: 'image',
    icon: 'image',
    color: '#ca8a04',
  },
  document: {
    id: 'document',
    icon: 'file-text',
    color: '#64748b',
  },
  crypto_wallet: {
    id: 'crypto_wallet',
    icon: 'wallet',
    color: '#d97706',
  },
  vehicle: {
    id: 'vehicle',
    icon: 'car',
    color: '#9333ea',
  },
  event: {
    id: 'event',
    icon: 'calendar',
    color: '#dc2626',
  },
}
