import type { EntityColorId, EntityIconId } from '@/domain/entity-appearance'

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

export interface EntityTypeDefinition {
  id: EntityTypeId
  icon: EntityIconId
  color: EntityColorId
}

export const ENTITY_TYPES: Record<EntityTypeId, EntityTypeDefinition> = {
  person: {
    id: 'person',
    icon: 'user',
    color: 'blue',
  },
  alias: {
    id: 'alias',
    icon: 'at-sign',
    color: 'violet',
  },
  email: { id: 'email', icon: 'mail', color: 'pink' },
  phone: {
    id: 'phone',
    icon: 'phone',
    color: 'orange',
  },
  domain: {
    id: 'domain',
    icon: 'globe',
    color: 'cyan',
  },
  ip: { id: 'ip', icon: 'server', color: 'teal' },
  url: { id: 'url', icon: 'link', color: 'sky' },
  organization: {
    id: 'organization',
    icon: 'building',
    color: 'indigo',
  },
  address: {
    id: 'address',
    icon: 'map-pin',
    color: 'green',
  },
  image: {
    id: 'image',
    icon: 'image',
    color: 'yellow',
  },
  document: {
    id: 'document',
    icon: 'file-text',
    color: 'slate',
  },
  crypto_wallet: {
    id: 'crypto_wallet',
    icon: 'wallet',
    color: 'amber',
  },
  vehicle: {
    id: 'vehicle',
    icon: 'car',
    color: 'purple',
  },
  event: {
    id: 'event',
    icon: 'calendar',
    color: 'red',
  },
}
