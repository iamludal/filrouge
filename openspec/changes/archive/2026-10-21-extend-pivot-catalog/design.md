# Design

## Context

The catalog lives in `src/domain/pivot-tools.ts` (`PIVOT_TOOLS`, `TOOL_CATEGORIES`), one link per
tool and entity type, a link with `{value}` being a query. Category names are translated in the
`pivots.categories` block of both dictionaries. The catalog invariant tests in
`src/domain/pivot-tools.test.ts` already enforce unique ids and names, `https` links, at most one
`{value}`, and that every resolved link parses; one test still expects "vehicle" and "event" to
have only the `search` and `frameworks` tools.

## Goals / Non-Goals

**Goals:**
- Add the 11 tools below and fix Censys without touching the model, the store or the UI code.

**Non-Goals:**
- No VIN detection or label reformatting for vehicles: the label is used as typed, like every
  other type.
- No per-tool "sign-in required" badge: Dehashed already needs an account and has none.

## Decisions

### Catalog content

Every link below was opened on 2026-10-21 (headless Chromium, then the user's browser for the
Cloudflare and captcha pages) with the sample value given, and landed on results.

| id | name | category | types | link | sample |
|---|---|---|---|---|---|
| `aleph` | OCCRP Aleph | `investigations` | person, organization | `https://aleph.occrp.org/search?q={value}` | Gazprom (redirects to the free OCCRP sign-in) |
| `opensanctions` | OpenSanctions | `investigations` | person, organization | `https://www.opensanctions.org/search/?q={value}` | Gazprom |
| `analyzeid` | Analyzeid | `infrastructure` | domain | `https://analyzeid.com/id/{value}` | lemonde.fr |
| `builtwith` | BuiltWith | `infrastructure` | domain | `https://builtwith.com/{value}` | lemonde.fr |
| `dotdb` | dotDB | `whoisDns` | organization, alias | `https://dotdb.com/search?keyword={value}&position=any` | lemonde |
| `yandex-maps` | Yandex Maps | `maps` | address | `https://yandex.com/maps/?text={value}` | 10 rue de Rivoli, Paris |
| `esri-wayback` | World Imagery Wayback | `maps` | address | `https://livingatlas.arcgis.com/wayback/` | plain |
| `ign-remonter-le-temps` | Remonter le temps (IGN) | `maps` | address | `https://remonterletemps.ign.fr/` | plain |
| `cartes-gouv` | cartes.gouv.fr | `maps` | address | `https://cartes.gouv.fr/explorer-les-cartes/` | plain |
| `vindecoder-net` | vindecoder.net | `vehicles` | vehicle | `https://www.vindecoder.net/?vin={value}` | 1HGCM82633A004352 |
| `vindecoder-pl` | vindecoder.pl | `vehicles` | vehicle | `https://vindecoder.pl/report/{value}` | 1HGCM82633A004352 |

Censys keeps the id `censys`; its `ip` link becomes `https://platform.censys.io/hosts/{value}`
(checked with 8.8.8.8). Keeping the id keeps existing `toolChecks` attached.

Category order: `investigations` goes after `registries` (people and companies are researched
together), `vehicles` after `maps`, before `frameworks`, which stays last.

Alternatives considered:
- Aleph and OpenSanctions in `registries`: rejected, the category is named "Registres
  d'entreprises" and both also cover people.
- Analyzeid and BuiltWith in `whoisDns`: rejected, they read the site's content, not its
  registration or DNS, which matches "Infrastructure et réputation" better.
- Géoportail under its old address: `www.geoportail.gouv.fr/carte` now redirects to
  cartes.gouv.fr, so the catalog links to the final address and names it after it.
- A query link for Remonter le temps or cartes.gouv.fr: both take coordinates, not an address, so
  they stay plain links.

### i18n

Two keys in `pivots.categories`: `investigations` ("Bases d'enquête" / "Investigative databases")
and `vehicles` ("Véhicules" / "Vehicles"). The `Record<ToolCategory, string>` typing makes the
typecheck fail if either dictionary misses one.

## Risks / Trade-offs

- [A vehicle label is often a make, a model or a plate, not a VIN] → the VIN decoders then show
  "invalid VIN"; the host shown next to the name and the visible target make it clear before the
  click. A VIN-specific type or property is left to a later change.
- [BuiltWith, dotDB and vindecoder.pl show a captcha or a Cloudflare check] → the user solves it
  once in their browser; the link itself is correct.
- [Aleph needs a free OCCRP account] → after sign-in the search is kept; worth it for the
  coverage of leaks and registries.
- [Links rot, as Censys and Memento did] → the check date is recorded at the top of the catalog;
  the next review starts from it.
