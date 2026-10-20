import { ENTITY_TYPE_IDS } from '@/domain/entity-types'
import {
  PIVOT_TOOLS,
  TOOL_CATEGORIES,
  isQueryLink,
  pivotValue,
  resolveToolLink,
  toolCounts,
  toolsForType,
} from '@/domain/pivot-tools'
import { toolCheckSchema } from '@/domain/schemas'

const link = (type: Parameters<typeof toolsForType>[0], toolId: string) =>
  toolsForType(type).find((entry) => entry.tool.id === toolId)?.link as string

const open = (type: Parameters<typeof toolsForType>[0], toolId: string, label: string) =>
  resolveToolLink(link(type, toolId), pivotValue(type, label))

describe('resolveToolLink', () => {
  it('encodes the trimmed label inside the search engine phrase', () => {
    expect(open('person', 'google', ' Jean Dupont & Cie ')).toBe(
      'https://www.google.com/search?q=%22Jean%20Dupont%20%26%20Cie%22',
    )
    expect(open('person', 'google', 'jean dupont')).toBe(
      'https://www.google.com/search?q=%22jean%20dupont%22',
    )
  })

  it('leaves an apostrophe alone and encodes accents and typographic quotes', () => {
    expect(open('person', 'google', "valérie d'hont")).toBe(
      "https://www.google.com/search?q=%22val%C3%A9rie%20d'hont%22",
    )
    expect(open('person', 'google', 'valérie d’hont')).toContain('d%E2%80%99hont')
  })

  it('fills a domain template', () => {
    expect(open('domain', 'crtsh', 'exemple.fr')).toBe('https://crt.sh/?q=exemple.fr')
  })

  it('keeps a label with / ? # & = inside its parameter or path segment', () => {
    const hostile = 'a/b?c=d&e#f'
    const query = open('domain', 'crtsh', hostile) as string
    expect(new URL(query).search).toBe('?q=a%2Fb%3Fc%3Dd%26e%23f')
    expect(new URL(query).hash).toBe('')
    const path = new URL(open('ip', 'shodan', hostile) as string)
    expect(path.pathname).toBe('/host/a%2Fb%3Fc%3Dd%26e%23f')
    expect(path.search).toBe('')
  })

  it('does not interpret $ patterns of the label', () => {
    expect(resolveToolLink('https://crt.sh/?q={value}', "$& $1 $'")).toBe(
      "https://crt.sh/?q=%24%26%20%241%20%24'",
    )
  })

  it('gives null for a query link without a value, and the address for a plain link', () => {
    expect(open('domain', 'crtsh', '   ')).toBeNull()
    expect(open('alias', 'whatsmyname', '')).toBeNull()
    expect(open('alias', 'sherlock', '')).toBe('https://github.com/sherlock-project/sherlock')
    expect(open('alias', 'sherlock', 'jdupont')).toBe('https://github.com/sherlock-project/sherlock')
  })
})

describe('pivotValue', () => {
  it('trims every type', () => {
    expect(pivotValue('person', ' jean ')).toBe('jean')
    expect(pivotValue('email', '\tjean@example.org\n')).toBe('jean@example.org')
  })

  it('removes phone separators and keeps the leading +', () => {
    expect(pivotValue('phone', '+33 6 12 34 56 78')).toBe('+33612345678')
    expect(pivotValue('phone', '(06) 12.34-56/78')).toBe('0612345678')
    expect(pivotValue('phone', ' - . - ')).toBe('')
  })

  it('keeps inner spaces, dots and hyphens of other types', () => {
    expect(pivotValue('person', 'Jean-Pierre  Dupont Jr.')).toBe('Jean-Pierre  Dupont Jr.')
    expect(pivotValue('address', '12 rue (A)/B')).toBe('12 rue (A)/B')
  })

  it('sends a phone number to Dehashed with an encoded +, and gives null for separators only', () => {
    expect(open('phone', 'dehashed', '+33 6 12 34 56 78')).toBe(
      'https://dehashed.com/search?query=%2B33612345678',
    )
    expect(open('phone', 'google', '(06) 12.34-56/78')).toBe(
      'https://www.google.com/search?q=%220612345678%22',
    )
    expect(open('phone', 'dehashed', ' - . - ')).toBeNull()
  })
})

describe('toolsForType', () => {
  const ids = (type: Parameters<typeof toolsForType>[0]) => toolsForType(type).map((entry) => entry.tool.id)

  it('lists crt.sh and Shodan for a domain, not sherlock', () => {
    expect(ids('domain')).toEqual(expect.arrayContaining(['crtsh', 'shodan', 'google']))
    expect(ids('domain')).not.toContain('sherlock')
  })

  it('lists only the search engines and frameworks for types without specific tools', () => {
    for (const type of ['vehicle', 'event'] as const) {
      expect(
        toolsForType(type).every((entry) => ['search', 'frameworks'].includes(entry.tool.category)),
      ).toBe(true)
    }
  })

  it('prefers the type-specific link over any', () => {
    expect(link('person', 'google')).toContain('google.com/search')
  })

  it('groups by category in the catalog order', () => {
    const order = toolsForType('email').map((entry) => TOOL_CATEGORIES.indexOf(entry.tool.category))
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  it('does not offer a tool on a type it was not made for', () => {
    expect(ids('phone')).toContain('phoneinfoga')
    expect(ids('email')).not.toContain('phoneinfoga')
  })
})

describe('catalog invariants', () => {
  const links = PIVOT_TOOLS.flatMap((tool) =>
    Object.entries(tool.links).map(([key, value]) => ({ tool, key, value: value as string })),
  )

  it('has unique ids and names, and ids fit the check format', () => {
    expect(new Set(PIVOT_TOOLS.map((tool) => tool.id)).size).toBe(PIVOT_TOOLS.length)
    expect(new Set(PIVOT_TOOLS.map((tool) => tool.name)).size).toBe(PIVOT_TOOLS.length)
    for (const tool of PIVOT_TOOLS) {
      expect(
        toolCheckSchema.safeParse({ toolId: tool.id, checkedAt: '2026-10-20T10:00:00.000Z' }).success,
      ).toBe(true)
    }
  })

  it('uses known categories and known entity types', () => {
    for (const tool of PIVOT_TOOLS) {
      expect(TOOL_CATEGORIES).toContain(tool.category)
      for (const key of Object.keys(tool.links)) expect(['any', ...ENTITY_TYPE_IDS]).toContain(key)
    }
  })

  it('only holds https links with at most one {value}, each resolving to a valid address', () => {
    for (const { tool, value } of links) {
      expect(value.startsWith('https://'), tool.id).toBe(true)
      expect(value.split('{value}').length - 1, tool.id).toBeLessThanOrEqual(1)
      const resolved = resolveToolLink(value, 'exemple 1')
      expect(resolved, tool.id).not.toBeNull()
      expect(new URL(resolved as string).protocol, tool.id).toBe('https:')
    }
  })

  it('never puts {value} in the host name', () => {
    for (const { tool, value } of links) {
      const afterScheme = value.slice('https://'.length)
      const host = afterScheme.split('/')[0] as string
      expect(host.includes('{'), tool.id).toBe(false)
    }
  })

  it('offers at least one tool for every entity type', () => {
    for (const type of ENTITY_TYPE_IDS) expect(toolsForType(type).length, type).toBeGreaterThan(0)
  })

  it('does not link to a scan, archive or report submission', () => {
    for (const { tool, value } of links) {
      expect(value, tool.id).not.toMatch(/\/(submit|scan|save|report)\b|[?&]url=|\/api\//i)
    }
  })

  it('knows which links are queries', () => {
    expect(isQueryLink('https://crt.sh/?q={value}')).toBe(true)
    expect(isQueryLink('https://github.com/megadose/holehe')).toBe(false)
  })
})

describe('toolCounts', () => {
  it('counts the checked tools among those listed for the type, ignoring the others', () => {
    const total = toolsForType('domain').length
    expect(toolCounts('domain', undefined)).toEqual({ checked: 0, total })
    expect(
      toolCounts('domain', [{ toolId: 'crtsh' }, { toolId: 'shodan' }, { toolId: 'future-tool' }]),
    ).toEqual({
      checked: 2,
      total,
    })
    expect(toolCounts('url', [{ toolId: 'crtsh' }]).checked).toBe(0)
  })
})
