import type { EntityTypeId } from '@/domain/entity-types'

/** Catalog order of the categories; the tools section lists them in this order. */
export const TOOL_CATEGORIES = [
  'search',
  'breaches',
  'accounts',
  'whoisDns',
  'infrastructure',
  'archives',
  'registries',
  'blockchain',
  'images',
  'metadata',
  'maps',
  'frameworks',
] as const

export type ToolCategory = (typeof TOOL_CATEGORIES)[number]

type LinkKey = EntityTypeId | 'any'

export interface PivotTool {
  /** Stable once shipped: it is what `toolChecks` stores in the export. */
  id: string
  /** A proper noun, never translated. */
  name: string
  category: ToolCategory
  /**
   * One link per entity type, or `any`. A link holding `{value}` is a query link; any other link
   * only opens the tool's site or repository.
   */
  links: Partial<Record<LinkKey, string>>
}

/** The same link for several keys. */
function same(keys: LinkKey[], link: string): Partial<Record<LinkKey, string>> {
  return Object.fromEntries(keys.map((key) => [key, link]))
}

const exact = (base: string) => `${base}%22{value}%22`

/**
 * Built-in tools. Query links only look up what already exists: none submits a scan, an archive
 * request or a report. Each link is to be opened by hand once (task 2.3 of `add-pivot-toolbox`).
 */
export const PIVOT_TOOLS: readonly PivotTool[] = [
  {
    id: 'google',
    name: 'Google',
    category: 'search',
    links: { any: exact('https://www.google.com/search?q=') },
  },
  { id: 'bing', name: 'Bing', category: 'search', links: { any: exact('https://www.bing.com/search?q=') } },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    category: 'search',
    links: { any: exact('https://duckduckgo.com/?q=') },
  },
  {
    id: 'yandex',
    name: 'Yandex',
    category: 'search',
    links: { any: exact('https://yandex.com/search/?text=') },
  },

  {
    id: 'hibp',
    name: 'Have I Been Pwned',
    category: 'breaches',
    links: { email: 'https://haveibeenpwned.com/account/{value}' },
  },
  {
    id: 'dehashed',
    name: 'Dehashed',
    category: 'breaches',
    links: same(['email', 'alias', 'phone', 'person'], 'https://dehashed.com/search?query={value}'),
  },
  {
    id: 'leak-lookup',
    name: 'Leak-Lookup',
    category: 'breaches',
    links: same(['email', 'alias', 'domain'], 'https://leak-lookup.com'),
  },
  {
    id: 'h8mail',
    name: 'h8mail',
    category: 'breaches',
    links: { email: 'https://github.com/khast3x/h8mail' },
  },

  {
    id: 'epieos',
    name: 'Epieos',
    category: 'accounts',
    links: same(['email', 'phone'], 'https://epieos.com'),
  },
  {
    id: 'osint-industries',
    name: 'OSINT Industries',
    category: 'accounts',
    links: same(['email', 'phone', 'alias'], 'https://www.osint.industries'),
  },
  {
    id: 'holehe',
    name: 'holehe',
    category: 'accounts',
    links: { email: 'https://github.com/megadose/holehe' },
  },
  { id: 'ghunt', name: 'GHunt', category: 'accounts', links: { email: 'https://github.com/mxrch/GHunt' } },
  {
    id: 'whatsmyname',
    name: 'WhatsMyName',
    category: 'accounts',
    links: { alias: 'https://whatsmyname.app/?q={value}' },
  },
  {
    id: 'sherlock',
    name: 'sherlock',
    category: 'accounts',
    links: { alias: 'https://github.com/sherlock-project/sherlock' },
  },
  {
    id: 'maigret',
    name: 'maigret',
    category: 'accounts',
    links: { alias: 'https://github.com/soxoj/maigret' },
  },
  {
    id: 'linkook',
    name: 'linkook',
    category: 'accounts',
    links: { alias: 'https://github.com/JackJuly/linkook' },
  },
  {
    id: 'phoneinfoga',
    name: 'PhoneInfoga',
    category: 'accounts',
    links: { phone: 'https://github.com/sundowndev/phoneinfoga' },
  },

  { id: 'crtsh', name: 'crt.sh', category: 'whoisDns', links: { domain: 'https://crt.sh/?q={value}' } },
  {
    id: 'viewdns',
    name: 'ViewDNS.info',
    category: 'whoisDns',
    links: {
      domain: 'https://viewdns.info/whois/?domain={value}',
      ip: 'https://viewdns.info/reverseip/?host={value}&t=1',
    },
  },
  {
    id: 'whoxy',
    name: 'Whoxy',
    category: 'whoisDns',
    links: {
      domain: 'https://www.whoxy.com/{value}',
      email: 'https://www.whoxy.com/reverse-whois/?email={value}',
      person: 'https://www.whoxy.com/reverse-whois/?name={value}',
      organization: 'https://www.whoxy.com/reverse-whois/?company={value}',
    },
  },
  {
    id: 'securitytrails',
    name: 'SecurityTrails',
    category: 'whoisDns',
    links: { domain: 'https://securitytrails.com/domain/{value}/dns' },
  },
  {
    id: 'dnsdumpster',
    name: 'DNSDumpster',
    category: 'whoisDns',
    links: { domain: 'https://dnsdumpster.com' },
  },

  {
    id: 'shodan',
    name: 'Shodan',
    category: 'infrastructure',
    links: {
      ip: 'https://www.shodan.io/host/{value}',
      domain: 'https://www.shodan.io/domain/{value}',
      organization: 'https://www.shodan.io/search?query=org%3A%22{value}%22',
    },
  },
  {
    id: 'censys',
    name: 'Censys',
    category: 'infrastructure',
    links: { ip: 'https://search.censys.io/hosts/{value}' },
  },
  {
    id: 'abuseipdb',
    name: 'AbuseIPDB',
    category: 'infrastructure',
    links: { ip: 'https://www.abuseipdb.com/check/{value}' },
  },
  { id: 'ipinfo', name: 'ipinfo', category: 'infrastructure', links: { ip: 'https://ipinfo.io/{value}' } },
  {
    id: 'virustotal',
    name: 'VirusTotal',
    category: 'infrastructure',
    links: {
      domain: 'https://www.virustotal.com/gui/domain/{value}',
      ip: 'https://www.virustotal.com/gui/ip-address/{value}',
      url: 'https://www.virustotal.com/gui/search/{value}',
    },
  },
  {
    id: 'urlscan',
    name: 'urlscan.io',
    category: 'infrastructure',
    links: { domain: 'https://urlscan.io/domain/{value}', ip: 'https://urlscan.io/ip/{value}' },
  },

  {
    id: 'wayback',
    name: 'Wayback Machine',
    category: 'archives',
    links: {
      domain: 'https://web.archive.org/web/*/{value}/*',
      url: 'https://web.archive.org/web/*/{value}',
    },
  },
  {
    id: 'archive-today',
    name: 'archive.today',
    category: 'archives',
    links: { url: 'https://archive.ph/search/?q={value}' },
  },

  {
    id: 'annuaire-entreprises',
    name: 'Annuaire des entreprises',
    category: 'registries',
    links: same(
      ['organization', 'person'],
      'https://annuaire-entreprises.data.gouv.fr/rechercher?terme={value}',
    ),
  },
  {
    id: 'pappers',
    name: 'Pappers',
    category: 'registries',
    links: { organization: 'https://www.pappers.fr/recherche?q={value}' },
  },
  {
    id: 'opencorporates',
    name: 'OpenCorporates',
    category: 'registries',
    links: { organization: 'https://opencorporates.com/companies?q={value}' },
  },

  {
    id: 'mempool',
    name: 'mempool.space',
    category: 'blockchain',
    links: { crypto_wallet: 'https://mempool.space/address/{value}' },
  },
  {
    id: 'etherscan',
    name: 'Etherscan',
    category: 'blockchain',
    links: { crypto_wallet: 'https://etherscan.io/address/{value}' },
  },
  {
    id: 'blockchair',
    name: 'Blockchair',
    category: 'blockchain',
    links: { crypto_wallet: 'https://blockchair.com/search?q={value}' },
  },

  { id: 'google-lens', name: 'Google Lens', category: 'images', links: { image: 'https://lens.google.com' } },
  {
    id: 'yandex-images',
    name: 'Yandex Images',
    category: 'images',
    links: { image: 'https://yandex.com/images/' },
  },
  { id: 'tineye', name: 'TinEye', category: 'images', links: { image: 'https://tineye.com' } },
  {
    id: 'fotoforensics',
    name: 'FotoForensics',
    category: 'images',
    links: { image: 'https://fotoforensics.com' },
  },

  {
    id: 'exiftool',
    name: 'ExifTool',
    category: 'metadata',
    links: same(['image', 'document'], 'https://exiftool.org'),
  },

  {
    id: 'openstreetmap',
    name: 'OpenStreetMap',
    category: 'maps',
    links: { address: 'https://www.openstreetmap.org/search?query={value}' },
  },
  {
    id: 'google-maps',
    name: 'Google Maps',
    category: 'maps',
    links: { address: 'https://www.google.com/maps/search/?api=1&query={value}' },
  },

  {
    id: 'spiderfoot',
    name: 'SpiderFoot',
    category: 'frameworks',
    links: { any: 'https://github.com/smicallef/spiderfoot' },
  },
  {
    id: 'osint-framework',
    name: 'OSINT Framework',
    category: 'frameworks',
    links: { any: 'https://osintframework.com' },
  },
]

export interface ToolEntry {
  tool: PivotTool
  /** The link template for this entity type: a query link when it holds `{value}`. */
  link: string
}

/** Tools for an entity type, a type-specific link winning over `any`, grouped by category. */
export function toolsForType(type: EntityTypeId): ToolEntry[] {
  const entries: ToolEntry[] = []
  for (const tool of PIVOT_TOOLS) {
    const link = tool.links[type] ?? tool.links.any
    if (link) entries.push({ tool, link })
  }
  // Array.prototype.sort is stable: catalog order is kept inside a category.
  return entries.sort(
    (a, b) => TOOL_CATEGORIES.indexOf(a.tool.category) - TOOL_CATEGORIES.indexOf(b.tool.category),
  )
}

export function isQueryLink(link: string): boolean {
  return link.includes('{value}')
}

/**
 * What goes in place of `{value}`: the trimmed label. Phone numbers also lose their separators
 * (spaces, dots, hyphens, slashes, parentheses) and keep the leading "+", as sites index the
 * same number under many spellings. The stored label is never changed.
 */
export function pivotValue(type: EntityTypeId, label: string): string {
  const trimmed = label.trim()
  return type === 'phone' ? trimmed.replace(/[\s.\-/()]/g, '') : trimmed
}

/**
 * The address to open: a plain link as is, a query link with `{value}` percent-encoded (a `+`
 * becomes `%2B`, a `/`, `?`, `#` or `&` cannot leave their place). `null` when a query link has
 * nothing to search.
 */
export function resolveToolLink(link: string, value: string): string | null {
  if (!isQueryLink(link)) return link
  if (!value) return null
  return link.replace('{value}', () => encodeURIComponent(value))
}

/** How many of the tools listed for a type are checked, and how many are listed. */
export function toolCounts(
  type: EntityTypeId,
  checks: readonly { toolId: string }[] | undefined,
): { checked: number; total: number } {
  const entries = toolsForType(type)
  const checkedIds = new Set((checks ?? []).map((check) => check.toolId))
  return { checked: entries.filter(({ tool }) => checkedIds.has(tool.id)).length, total: entries.length }
}
