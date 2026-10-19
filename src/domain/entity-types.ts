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
  label: string
  icon: EntityIconName
  color: string
  /** Suggested property keys shown in the detail panel. */
  properties: readonly string[]
}

export const ENTITY_TYPES: Record<EntityTypeId, EntityTypeDefinition> = {
  person: {
    id: 'person',
    label: 'Personne',
    icon: 'user',
    color: '#2563eb',
    properties: ['prénom', 'nom', 'date de naissance', 'nationalité'],
  },
  alias: {
    id: 'alias',
    label: 'Alias / compte',
    icon: 'at-sign',
    color: '#7c3aed',
    properties: ['plateforme', 'identifiant', 'url du profil'],
  },
  email: { id: 'email', label: 'Email', icon: 'mail', color: '#db2777', properties: ['fournisseur'] },
  phone: {
    id: 'phone',
    label: 'Téléphone',
    icon: 'phone',
    color: '#ea580c',
    properties: ['pays', 'opérateur'],
  },
  domain: {
    id: 'domain',
    label: 'Domaine',
    icon: 'globe',
    color: '#0891b2',
    properties: ['registrar', 'date de création'],
  },
  ip: { id: 'ip', label: 'Adresse IP', icon: 'server', color: '#0d9488', properties: ['ASN', 'pays'] },
  url: { id: 'url', label: 'URL', icon: 'link', color: '#0284c7', properties: ['titre'] },
  organization: {
    id: 'organization',
    label: 'Organisation',
    icon: 'building',
    color: '#4f46e5',
    properties: ['pays', 'identifiant légal', 'secteur'],
  },
  address: {
    id: 'address',
    label: 'Adresse',
    icon: 'map-pin',
    color: '#16a34a',
    properties: ['ville', 'pays', 'latitude', 'longitude'],
  },
  image: {
    id: 'image',
    label: 'Image',
    icon: 'image',
    color: '#ca8a04',
    properties: ['empreinte', 'source'],
  },
  document: {
    id: 'document',
    label: 'Document',
    icon: 'file-text',
    color: '#64748b',
    properties: ['auteur'],
  },
  crypto_wallet: {
    id: 'crypto_wallet',
    label: 'Portefeuille crypto',
    icon: 'wallet',
    color: '#d97706',
    properties: ['blockchain'],
  },
  vehicle: {
    id: 'vehicle',
    label: 'Véhicule',
    icon: 'car',
    color: '#9333ea',
    properties: ['immatriculation', 'marque', 'modèle'],
  },
  event: {
    id: 'event',
    label: 'Événement',
    icon: 'calendar',
    color: '#dc2626',
    properties: ['date', 'lieu'],
  },
}
