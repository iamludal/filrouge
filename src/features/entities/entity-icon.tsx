import {
  AtSign,
  Building2,
  Calendar,
  Car,
  FileText,
  Globe,
  Image,
  Link,
  Mail,
  MapPin,
  Phone,
  Server,
  User,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { ENTITY_TYPES, type EntityIconName, type EntityTypeId } from '@/domain/entity-types'

const ICONS: Record<EntityIconName, LucideIcon> = {
  user: User,
  'at-sign': AtSign,
  mail: Mail,
  phone: Phone,
  globe: Globe,
  server: Server,
  link: Link,
  building: Building2,
  'map-pin': MapPin,
  image: Image,
  'file-text': FileText,
  wallet: Wallet,
  car: Car,
  calendar: Calendar,
}

export function EntityIcon({ type, className }: { type: EntityTypeId; className?: string }) {
  const Icon = ICONS[ENTITY_TYPES[type].icon]
  return <Icon className={className} aria-hidden />
}
