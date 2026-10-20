# Design

## Context

See proposal.md for motivation and specs/ for the required behavior. Current state, read from
`src/`:

- `src/domain/schemas.ts` is the single source of truth for records; `entitySchema` has no
  tool-related field. `LIMITS` bounds every list. Import errors carry an `importCode` param that
  the UI translates (`tooManyProperties`).
- `src/domain/export-format.ts` copies entities with a spread when re-keying an import, so a new
  optional field travels through export and import without dedicated code.
- `src/store/graph-store.ts`: `updateEntity(id, patch)` sets `updatedAt` and is grouped by
  `entity:<id>:<fields>` (1 s sliding window, `src/store/history.ts`). An action that does not
  call `grouping.group` is its own history step.
- `src/features/entities/entity-panel.tsx` renders the whole entity editor; `DetailContent` mounts
  it in both the desktop panel and the mobile drawer, keyed by entity id.
- `src/lib/url.ts` (`safeUrl`) only lets http(s) and mailto through; `src/lib/markdown.tsx` and
  `github-link.tsx` already open external links with `target="_blank"` and `noopener noreferrer`.
- `src/components/ui/` has `checkbox`, `button`, `tooltip`; no `tabs` yet (added by this change).
- filrouge is not published: the model is extended in place without bumping `SCHEMA_VERSION`, as
  was done for screenshots (agreed project exception to the CLAUDE.md rule).

## Goals / Non-Goals

**Goals:**
- Catalog as pure, typed data in `src/domain/`, testable without DOM, ready to be merged with
  custom tools later (v0.4) without changing the check format.
- Checks stored on the entity so that export, import, autosave, undo and timestamps work through
  the existing paths.
- No new dependency.

**Non-Goals:**
- Verifying at runtime that a tool's site is up (would be a network request).
- Normalizing labels per type beyond removing phone separators (no E.164 conversion, no country
  guessing): `06 12 34 56 78` gives `0612345678`, not `+33612345678`.
- Showing unknown checks (from a newer version or future custom tools).

## Decisions

### Catalog shape: one link per tool and entity type

```ts
type ToolCategory = 'search' | 'breaches' | 'accounts' | 'whoisDns' | 'infrastructure'
  | 'archives' | 'registries' | 'blockchain' | 'images' | 'metadata' | 'maps' | 'frameworks'

interface PivotTool {
  id: string            // stable, /^[a-z0-9-]{1,64}$/, exported in toolChecks
  name: string          // proper noun, never translated
  category: ToolCategory
  links: Partial<Record<EntityTypeId | 'any', string>>
}
```

A link containing `{value}` is a query link; any other link is a plain link. `links.any` applies
to every type, and a type-specific link wins over `any`. One link per type keeps "one check per
tool" unambiguous (the user chose per-tool checks over per-action checks). Alternative
considered: an explicit `{ kind: 'query' | 'plain' }` union; rejected as redundant with the
placeholder, and a unit test enforces the invariants instead.

Helpers in `src/domain/pivot-tools.ts`: `toolsForType(type)` (catalog order, grouped by category
order), `pivotValue(type, label): string` (the trimmed label; for `phone`, also stripped of
whitespace, `.`, `-`, `/`, `(` and `)`, so that `+33 6 12 34 56 78` gives `+33612345678`) and
`resolveToolLink(link, value): string | null` (`null` for a query link with an empty value;
otherwise the template with `{value}` replaced by `encodeURIComponent(value)`, which turns the
`+` into `%2B` so that it is not read as a space). Normalizing only the link value keeps the
stored label untouched; other types are not normalized (label used as typed, as agreed). Quotes
inside a label are not stripped: they only split a search engine's exact phrase, and the
resolved address is visible before the click.
`encodeURIComponent` encodes `/ ? # & =`, so a label cannot add a path segment, a parameter or a
fragment, including in path-based templates such as `https://www.shodan.io/host/{value}`.

### Catalog content

45 tools. Every template is to be checked by hand during implementation (task 2.3): a template
that does not land on results is replaced by a plain link to the site, and a lookup that turns out
to submit a scan or an archive request is removed (spec "No public submission").

| id | name | category | links |
|---|---|---|---|
| google | Google | search | any: `https://www.google.com/search?q=%22{value}%22` |
| bing | Bing | search | any: `https://www.bing.com/search?q=%22{value}%22` |
| duckduckgo | DuckDuckGo | search | any: `https://duckduckgo.com/?q=%22{value}%22` |
| yandex | Yandex | search | any: `https://yandex.com/search/?text=%22{value}%22` |
| hibp | Have I Been Pwned | breaches | email: `https://haveibeenpwned.com/account/{value}` |
| dehashed | Dehashed | breaches | email, alias, phone, person: `https://dehashed.com/search?query={value}` |
| leak-lookup | Leak-Lookup | breaches | email, alias, domain: `https://leak-lookup.com` |
| h8mail | h8mail | breaches | email: `https://github.com/khast3x/h8mail` |
| epieos | Epieos | accounts | email, phone: `https://epieos.com` |
| osint-industries | OSINT Industries | accounts | email, phone, alias: `https://www.osint.industries` |
| holehe | holehe | accounts | email: `https://github.com/megadose/holehe` |
| ghunt | GHunt | accounts | email: `https://github.com/mxrch/GHunt` |
| whatsmyname | WhatsMyName | accounts | alias: `https://whatsmyname.app/?q={value}` |
| sherlock | sherlock | accounts | alias: `https://github.com/sherlock-project/sherlock` |
| maigret | maigret | accounts | alias: `https://github.com/soxoj/maigret` |
| linkook | linkook | accounts | alias: `https://github.com/JackJuly/linkook` |
| phoneinfoga | PhoneInfoga | accounts | phone: `https://github.com/sundowndev/phoneinfoga` |
| crtsh | crt.sh | whoisDns | domain: `https://crt.sh/?q={value}` |
| viewdns | ViewDNS.info | whoisDns | domain: `https://viewdns.info/whois/?domain={value}`; ip: `https://viewdns.info/reverseip/?host={value}&t=1` |
| whoxy | Whoxy | whoisDns | domain: `https://www.whoxy.com/{value}`; email: `https://www.whoxy.com/reverse-whois/?email={value}`; person: `…/reverse-whois/?name={value}`; organization: `…/reverse-whois/?company={value}` |
| securitytrails | SecurityTrails | whoisDns | domain: `https://securitytrails.com/domain/{value}/dns` |
| dnsdumpster | DNSDumpster | whoisDns | domain: `https://dnsdumpster.com` |
| shodan | Shodan | infrastructure | ip: `https://www.shodan.io/host/{value}`; domain: `https://www.shodan.io/domain/{value}`; organization: `https://www.shodan.io/search?query=org%3A%22{value}%22` |
| censys | Censys | infrastructure | ip: `https://search.censys.io/hosts/{value}` |
| abuseipdb | AbuseIPDB | infrastructure | ip: `https://www.abuseipdb.com/check/{value}` |
| ipinfo | ipinfo | infrastructure | ip: `https://ipinfo.io/{value}` |
| virustotal | VirusTotal | infrastructure | domain: `https://www.virustotal.com/gui/domain/{value}`; ip: `…/gui/ip-address/{value}`; url: `…/gui/search/{value}` |
| urlscan | urlscan.io | infrastructure | domain: `https://urlscan.io/domain/{value}`; ip: `https://urlscan.io/ip/{value}` |
| wayback | Wayback Machine | archives | domain: `https://web.archive.org/web/*/{value}/*`; url: `https://web.archive.org/web/*/{value}` |
| archive-today | archive.today | archives | url: `https://archive.ph/search/?q={value}` |
| annuaire-entreprises | Annuaire des entreprises | registries | organization, person: `https://annuaire-entreprises.data.gouv.fr/rechercher?terme={value}` |
| pappers | Pappers | registries | organization: `https://www.pappers.fr/recherche?q={value}` |
| opencorporates | OpenCorporates | registries | organization: `https://opencorporates.com/companies?q={value}` |
| mempool | mempool.space | blockchain | crypto_wallet: `https://mempool.space/address/{value}` |
| etherscan | Etherscan | blockchain | crypto_wallet: `https://etherscan.io/address/{value}` |
| blockchair | Blockchair | blockchain | crypto_wallet: `https://blockchair.com/search?q={value}` |
| google-lens | Google Lens | images | image: `https://lens.google.com` |
| yandex-images | Yandex Images | images | image: `https://yandex.com/images/` |
| tineye | TinEye | images | image: `https://tineye.com` |
| fotoforensics | FotoForensics | images | image: `https://fotoforensics.com` |
| exiftool | ExifTool | metadata | image, document: `https://exiftool.org` |
| openstreetmap | OpenStreetMap | maps | address: `https://www.openstreetmap.org/search?query={value}` |
| google-maps | Google Maps | maps | address: `https://www.google.com/maps/search/?api=1&query={value}` |
| spiderfoot | SpiderFoot | frameworks | any: `https://github.com/smicallef/spiderfoot` |
| osint-framework | OSINT Framework | frameworks | any: `https://osintframework.com` |

socialscan is left out (duplicate of sherlock and holehe). `vehicle` and `event` only get the
`any` tools.

### Checks on the entity, written by a dedicated store action

```ts
toolCheckSchema = z.object({ toolId: z.string().regex(/^[a-z0-9-]{1,64}$/), checkedAt: isoDate })
entitySchema.toolChecks = z.array(toolCheckSchema).max(LIMITS.toolChecks /* 200 */)
  .refine(uniqueToolIds, { params: { importCode: 'duplicateToolCheck' } }).optional()
```

The identifier regex keeps hostile ids out (no markup, bounded length) even though they are
never rendered. The list is omitted (not `[]`) when the last check is removed, so an entity that
never had checks exports exactly as before.

`setToolCheck(entityId, toolId, checked)` in the graph store computes one `now`, writes
`checkedAt` and `updatedAt` from it, and does **not** call `grouping.group`: each check is its
own history step (spec delta `edit-history`). Going through `updateEntity` was rejected because
its `entity:<id>:toolChecks` group would merge two checks made within a second. A pure helper
`withToolCheck(checks, toolId, checked, at)` in `src/domain/` holds the list logic for unit
tests.

Checks of tools not listed for the current type (type changed, unknown id) stay in the list; the
section only displays and counts checks whose tool is listed. No Dexie change: entities are
stored as whole records.

### Tools tab UI

`EntityPanel` wraps its content in shadcn `Tabs` (added with `bunx shadcn@latest add tabs`, no new
dependency: Radix is already installed): "Détails" (the existing editor, default) and "Outils",
whose trigger shows the "checked / listed" count from `toolCounts(type, toolChecks)`. A tab rather
than a collapsible block keeps the editor short: the 13 to 20 tool rows no longer push the delete
button down. The selected tab is local state of the entity panel, which is keyed by entity id, so
another entity opens on "Détails"; it is never persisted. `src/features/pivots/tools-section.tsx`
exports `ToolsPanel`, the tab's content, which reads the catalog. Rows are one line each (no
wrapping: a long name truncates its host instead of pushing the checkbox onto its own line),
grouped under category headings (`t.pivots.categories[category]`):

- a Radix checkbox labelled `t.pivots.markUsed(name)` (a 32 px hit area, 44 px below `md`, around a
  16 px box: the shadcn `Checkbox` is only 16 px), then the check date (`formatDate(checkedAt)`)
  when checked;
- an `<a href target="_blank" rel="noopener noreferrer">` with the tool name, the host
  (`new URL(href).host`) and an `ExternalLink` icon. A native link lets the browser show the
  address on hover (status bar) and on long press (mobile preview), which satisfies "address
  visible before the click" without custom UI;
- for a query link with a blank label: no link, the name with `aria-disabled` and
  `t.pivots.needsLabel`.

Touch targets use the same narrow-screen sizing as the drawer buttons (44 px minimum below `md`).
The resolved `href` is also passed through `safeUrl` as a second line of defense.

### i18n

New `pivots` block in both dictionaries: tab title, count, category names, `markUsed(name)`,
`checkedOn(date)`, `needsLabel`; import error `duplicateToolCheck`. Tool names stay in the
catalog, untranslated.

## Risks / Trade-offs

- [Templates rot: sites change their URLs or close] → hand check of every link during
  implementation (task 2.3); the catalog is plain data, a broken entry is a one-line fix; a query
  that stops working can fall back to a plain link without changing the check format.
- [Query links send the value to a third party] → it only happens on a user click, the host is
  displayed next to each tool, and no request is made by the app itself (CSP untouched).
- [Merging entities (roadmap v0.3, not implemented yet) could drop checks] → the merge change must
  union `toolChecks`, keeping the earliest `checkedAt` per tool; the ROADMAP line already says so.
- [Tool ids become part of the export format] → ids are frozen once shipped; a renamed tool keeps
  its id; a removed tool's checks are kept as unknown checks.
- [Long list in the drawer] → its own tab, with a count in the tab label; categories break the list up.

## Migration Plan

None: `toolChecks` is optional, existing data and files without it stay valid, `SCHEMA_VERSION`
stays 1. Rollback is reverting the commits: the schemas do not use `.strict()`, so Zod drops the
unknown `toolChecks` key on load and import, and the checks are lost at the next save without
any error.

## Open Questions

- Exact wording of the count in the tab label ("2 / 14", "2 sur 14 utilisés") – decided
  during implementation, it does not affect the specs.
