# Proposal

## Why

The built-in pivot catalog shipped with `add-pivot-toolbox` leaves gaps found by comparing it with
the oscarzulu.org OSINT toolbox (210 tools): no sanctions or investigative database for people and
companies, no way to pivot from a domain to sites sharing its analytics IDs or technologies, no
map beyond OpenStreetMap and Google Maps, and nothing at all for "vehicle" entities. One existing
link is also stale: Censys moved its host pages to `platform.censys.io`, and the old
`search.censys.io` address now answers 403.

## What Changes

- Add 11 tools to the catalog, every link opened by hand on 2026-10-21 with a sample value:
  - people and companies: OCCRP Aleph (query, sign-in required) and OpenSanctions (query);
  - domains: Analyzeid (sites sharing the same analytics and ad IDs) and BuiltWith (technologies);
  - brands and usernames: dotDB (registered domains containing the keyword);
  - addresses: Yandex Maps (query), and plain links to Esri World Imagery Wayback, IGN "Remonter
    le temps" and cartes.gouv.fr (former Géoportail);
  - vehicles: vindecoder.net and vindecoder.pl (VIN query).
- Two new categories: "Bases d'enquête" / "Investigative databases" and "Véhicules" / "Vehicles".
- Fix Censys's IP link to `https://platform.censys.io/hosts/{value}`. Its identifier does not
  change, so existing checks stay attached.
- "vehicle" entities now get specific tools; "event" remains the only type limited to the search
  engines and frameworks.
- Rejected after testing: Memento Time Travel (domain no longer resolves) and License Plates of
  the World (invalid HTTPS certificate). Out of scope: face recognition services, tools that need
  the file to be uploaded, Web-check (probes the target live), and the new entity types that
  aircraft, vessel or parcel tracking would need.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `pivot-tools`: the catalog requirement now gives "vehicle" its own tools and names "event" as
  the type without specific tools; new scenarios pin the new query links and Censys's address.

## Impact

- `src/domain/pivot-tools.ts`: 11 tools, 2 categories, Censys link.
- `src/i18n/messages/fr.ts` and `en.ts`: 2 category names.
- `src/domain/pivot-tools.test.ts`: the "types without specific tools" test (vehicle moves out),
  new link cases.
- `ROADMAP.md`: one new v0.3 line.
- No model change, no `SCHEMA_VERSION` bump, no new runtime network request (links are only
  opened by the user in a new tab).
