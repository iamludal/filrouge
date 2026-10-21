# ROADMAP – Filrouge

> **Filrouge** is a **100% static**, **local-first** and open-source web app to visually connect
> the findings of an OSINT investigation: entities, links, sources and confidence levels.
> No investigation data ever leaves the user's browser.

This document is the development reference. Milestones are tackled **in order**,
one task at a time. A task is only done when its "Definition of Done" is met.

---

## 1. Non-negotiable principles

1. **Local-first**: no backend. All data lives in IndexedDB.
2. **Zero leak**: no telemetry, no analytics, no third-party script, no CDN at runtime.
   Any outgoing network request (map tiles, remote favicon…) must be **opt-in** and flagged in the UI.
3. **Hostile data**: any imported or typed content (labels, notes, URLs, JSON files) is considered
   potentially malicious. It is validated with Zod and sanitized before any HTML rendering (DOMPurify).
   `dangerouslySetInnerHTML` is forbidden, except behind DOMPurify.
4. **Traceability**: every entity and every relation can be linked to one or more sources.
5. **Versioned model**: every investigation carries a `schemaVersion`, and every model change comes with a tested migration.
6. **Accessibility and keyboard**: every main action can be performed with the keyboard.

---

## 2. Tech stack

| Area                | Choice                                                        |
| ------------------- | ------------------------------------------------------------- |
| Build               | Vite + React 19 + TypeScript (`strict: true`)                 |
| Package manager     | Bun                                                           |
| UI                  | Tailwind CSS v4 + shadcn/ui + lucide-react                    |
| Graph (render/edit) | @xyflow/react (React Flow)                                    |
| Graph algorithms    | graphology (+ graphology-shortest-path, graphology-metrics)   |
| Automatic layouts   | elkjs (in a Web Worker)                                       |
| State               | Zustand + zundo (undo/redo)                                   |
| Persistence         | Dexie.js (IndexedDB)                                          |
| Validation          | Zod (single source of truth for schemas)                      |
| Markdown            | react-markdown + DOMPurify                                    |
| Map                 | Leaflet + OpenStreetMap (opt-in)                              |
| Crypto              | WebCrypto (AES-GCM + PBKDF2)                                  |
| Tests               | Vitest + Testing Library + fake-indexeddb; Playwright for E2E |
| Quality             | ESLint + Prettier + typecheck in CI                           |
| Distribution        | PWA (vite-plugin-pwa), GitHub Pages deployment                |

---

## 3. Target layout

```
src/
  app/                # bootstrap, routing, global layout, providers
  features/
    investigations/   # list, create, rename, delete investigations
    graph/            # React Flow canvas, nodes, edges, toolbar, layouts
    entities/         # detail panel, forms, entity types
    relations/
    sources/          # sources, attachments, confidence
    search/           # search, filters, command palette
    timeline/
    map/
    import-export/
    extraction/       # entity extraction from raw text
    pivots/
    crypto/
  domain/
    schemas.ts        # Zod schemas + inferred types
    entity-types.ts   # entity type definitions (icon, color, properties)
    migrations/       # schemaVersion migrations
  db/
    dexie.ts          # database and index definition
    repositories/     # data access (no direct Dexie access from components)
  store/              # Zustand stores
  lib/                # pure utilities (sanitize, hash, ids, regex…)
  workers/            # elkjs layout, heavy computations
tests/
  e2e/                # Playwright
```

---

## 4. Data model (v1)

```ts
// src/domain/schemas.ts – implemented with Zod, types inferred via z.infer
Investigation { id: string; name: string; description?: string;
                createdAt: string; updatedAt: string;
                schemaVersion: number; encrypted: boolean }

Entity        { id: string; investigationId: string;
                type: EntityTypeId; label: string;
                properties: Record<string, unknown>;
                tags: string[]; notes?: string;          // Markdown
                sourceIds: string[]; confidence?: Confidence;
                status: "verified" | "hypothesis";
                position: { x: number; y: number };
                createdAt: string; updatedAt: string }

Relation      { id: string; investigationId: string;
                from: string; to: string;                // entity ids
                label: string; directed: boolean;
                sourceIds: string[]; confidence?: Confidence;
                status: "verified" | "hypothesis";
                createdAt: string; updatedAt: string }

Source        { id: string; investigationId: string;
                url?: string; title?: string;
                capturedAt: string; archiveUrl?: string;
                attachmentId?: string; sha256?: string; note?: string }

Attachment    { id: string; investigationId: string;
                blob: Blob; mime: string; size: number; sha256: string }

Confidence    { reliability: "A"|"B"|"C"|"D"|"E"|"F";   // Admiralty code: source reliability
                credibility: 1|2|3|4|5|6 }              // information credibility
```

Default entity types: `person`, `alias` (handle/account), `email`, `phone`, `domain`, `ip`, `url`,
`organization`, `address`, `image`, `document`, `crypto_wallet`, `vehicle`, `event`.

IDs: `crypto.randomUUID()`. Dates: ISO 8601 UTC.

---

## 5. Definition of Done (for every task)

- [ ] Strict TypeScript code, no unjustified `any`
- [ ] Unit tests for business logic (domain, repositories, lib)
- [ ] `bun run lint`, `bun run typecheck` and `bun run test` pass
- [ ] No new network request at runtime (except documented opt-in)
- [ ] Any displayed data coming from the user or an import is sanitized
- [ ] UI works in light and dark themes
- [ ] One box checked in this file

---

## 6. Milestones

### v0.0 – Foundations

- [x] Initialize the Vite + React + TS (strict) project with Bun
- [x] Set up Tailwind v4, shadcn/ui, light/dark theme (follows the system + manual toggle)
- [x] Set up ESLint, Prettier, Vitest, Playwright
- [x] Add a strict CSP via `<meta http-equiv="Content-Security-Policy">` (`default-src 'self'`, no `unsafe-eval`)
- [x] GitHub Actions CI: lint, typecheck, tests, build
- [x] Automatic deployment to GitHub Pages from `main`
- [x] Repository files: `LICENSE`, `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CLAUDE.md`

**Acceptance criterion**: `bun run dev` shows an empty app shell and CI is green.

### v0.1 – MVP: editable and persistent graph

- [x] Zod schemas of the model (§4) + validation tests
- [x] Dexie database (tables `investigations`, `entities`, `relations`, `sources`, `attachments`, indexed by `investigationId`)
- [x] CRUD repositories + tests with fake-indexeddb
- [x] Home screen: list investigations, create, rename, delete (with confirmation)
- [x] React Flow canvas: zoom, pan, minimap, snap grid
- [x] Custom node per entity type (icon, color, label)
- [x] Add an entity (toolbar + double-click on the canvas)
- [x] Create a relation by dragging from one node to another, with a label prompt
- [x] Detail side panel: edit the label, properties, tags and Markdown notes (sanitized rendering)
- [x] Delete entities/relations (Delete key), cascading deletion of orphan relations
- [x] Debounced autosave of every change, positions included
- [x] JSON export / import of an investigation (versioned format, validated by Zod, clean rejection on error)

**Acceptance criterion**: I create an investigation, add 10 linked entities, reload the page,
everything is intact; I export to JSON, delete the investigation, re-import it identically.

### v0.2 – Sources, confidence, navigation

- [x] Source CRUD, attached to an entity or a relation
- [x] Attachments (screenshots) stored as Blobs + SHA-256 computation
- [x] "archive.org link" field and capture date
- [x] Confidence level (Admiralty code) and verified/hypothesis status
- [x] Visual rendering: hypothetical relations dashed, confidence badge on nodes
- [x] Full-text search (labels, properties, notes) with highlighting on the graph
- [x] Filters by type, tag, status and confidence (filtered-out elements are dimmed)
- [x] Undo/redo (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z) via zundo
- [x] PNG and SVG export of the graph

### v0.3 – Analysis and productivity

- [x] Responsive mobile and tablet layout (from 360 px wide, narrow layout below the `md` breakpoint): compact graph toolbar (collapsible search, Undo, "More actions" menu with Redo, Filters, Sources and exports), detail panel as a drawer anchored at the bottom, non-modal, hidden with no selection, collapsed (selection summary) or expanded (full editor) by tapping or dragging its handle, minimap hidden, "Delete selection" button for multiple selection, touch targets ≥ 44 px, dialogs contained in the screen, no horizontal scrolling. Playwright E2E tests on a mobile viewport (`devices['Pixel 7']`)
- [x] Touch gestures on the canvas: one-finger pan and pinch zoom, long press on the canvas to add an entity (equivalent of double-click), relation creation by finger from the handle of a selected entity (44 px touch area)
- [x] Creation and last-modification dates of entities and relations, shown in the detail panel (and the mobile drawer); moving a node does not count as a modification (OpenSpec `add-element-timestamps`)
- [x] FR/EN internationalization: interface in French and English, language detected from the browser or system language (English fallback), language menu in the header, choice persisted in this browser, dates, numbers and sizes formatted for the language, standard OSINT vocabulary (NATO Admiralty scale); investigation content is never translated and the export format stays unchanged (OpenSpec `add-i18n`)
- [ ] Automatic layouts (force, hierarchical, radial) via elkjs in a Web Worker
- [ ] Shortest path between two selected entities (graphology), highlighted
- [ ] Highlight neighbors within N hops
- [ ] Merge two entities (properties, tags, sources and relations merged, without loss)
- [ ] Extraction from text: paste a text, regex detection (emails, IPv4/v6, domains, URLs, phone numbers, BTC/ETH wallets), preview then selective creation
- [x] Pivot toolbox: "Tools" section of the detail panel (and the mobile drawer) listing the tools of a built-in catalog that apply to the entity's type (search engines, leaks, whois/DNS, accounts, archives, block explorers, company registries, reverse image search). Per tool and per type: URL template with the encoded label (e.g. `https://crt.sh/?q={value}`, `https` only; phone numbers without spaces or separators, stored label unchanged) or plain link to the website or GitHub repository (command-line tools, "toolbox" mode); opens in a new tab (`noopener noreferrer`), resolved URL visible before clicking, never a link that launches a public scan. Manual check per tool and per entity, separate from the link, dated (`toolChecks: { toolId, checkedAt }[]`, optional field validated by Zod, included in the export), undoable, kept when merging entities. Catalog not editable in the app. Checking or unchecking counts as a modification (`updatedAt`) (OpenSpec `add-pivot-toolbox`)
- [x] Extended pivot catalog: OCCRP Aleph and OpenSanctions ("Investigative databases" category), Analyzeid and BuiltWith (domains), dotDB (organizations and aliases), Yandex Maps and historical imagery (Esri Wayback, Remonter le temps IGN, cartes.gouv.fr) for addresses, VIN decoders ("Vehicles" category); Censys link fixed to `platform.censys.io` (OpenSpec `extend-pivot-catalog`)
- [ ] Command palette (Cmd/Ctrl+K)
- [ ] Similar screenshots: perceptual hash (64-bit dHash, computed locally) of each screenshot, "Screenshot very close to the one of source X" warning below a Hamming distance threshold, and side-by-side comparison of two screenshots (e.g. a post captured on two dates)
- [x] Entity styling: per-entity color (palette of 16) and icon (lucide set of 44, no image import), replacing the type's ones, and "important" marker (flag on the node, "Importance" filter criterion, present in PNG and SVG exports)
- [x] Graph display options: entity labels, relation labels, ratings and "Important" mark can be hidden from a "Display" menu (one icon per option, submenu of "More actions" on narrow screens), alert dot while an option is changed; minimap can be hidden separately, with a button in the zoom controls (no dot, no reset). Device preference (`localStorage`, validated by Zod) shared by all investigations, neither saved, nor exported to JSON, nor undoable; PNG and SVG exports only draw what is displayed (OpenSpec `add-graph-display-options`)
- [ ] Visual groups / clusters of nodes

### v0.4 – Complementary views

- [ ] Table view of all entities (sorting, filters, quick editing)
- [ ] Timeline of dated entities and relations (`event` type and date properties)
- [ ] Leaflet map of geolocated entities. **Disabled by default**, with a warning explaining that tiles are loaded from a third-party server
- [ ] Investigation folders on the home screen (a single level, no nesting): create, rename, delete a folder (its investigations go back to the root, never deleted), move an investigation, filter the list by folder. The folder is a local organization: not included in the export
- [ ] Investigation archiving (reversible alternative to deletion, since data is local only): archive / unarchive from the list, archived investigations hidden by default (collapsed section or "Archived" filter), read-only or opening possible without accidental editing, permanent deletion always available from the archives. `archivedAt` field: tested schema migration (`SCHEMA_VERSION`). To be decided: included in the export or not
- [ ] Custom tools: add, edit and delete your own tools (name, types, `https`-only URL template or plain link) from a Settings screen; the built-in catalog tools can be neither edited nor deleted. Custom tools shared by all investigations of this browser, not exported; the check keeps a copy of the tool name (`toolName`) to stay readable after its deletion or in another browser. To be decided: export/import of custom tools

### v1.0 – Security, interoperability, distribution

- [ ] Optional per-investigation encryption: AES-GCM, key derived with PBKDF2 (≥ 600,000 iterations, random salt), unlocking with a passphrase, key kept in memory only
- [ ] Automatic lock after inactivity
- [ ] Encrypted export (the exported JSON stays encrypted)
- [ ] ZIP export/import (`.filrouge.zip`): `investigation.json` + one image per screenshot, read entry by entry to lift the 200 MB JSON limit. Limits kept: 20 MB per screenshot, bounded number of entries and JSON size, zip bomb protection (uncompressed size checked). Network-free dependency (e.g. fflate)
- [ ] CSV export (entities, relations) and GraphML (Gephi)
- [ ] STIX 2.1 export (bundle) for OpenCTI/MISP
- [ ] Markdown and PDF investigation report (graph, entities, sources)
- [ ] Custom entity types (property schema, icon, color)
- [ ] Installable PWA and full offline operation
- [ ] `schemaVersion` migration system + migration tests
- [ ] Playwright E2E tests of the main user journeys
- [x] README screenshots and open-source front page: English README, CONTRIBUTING, SECURITY and CODE_OF_CONDUCT, English demos, `bun run screenshots` (OpenSpec `prepare-open-source-release`)
- [ ] User documentation

### Post-1.0 ideas (not prioritized)

- Sigma.js rendering for very large graphs (> 5,000 nodes)
- Import from Maltego (.mtgx) and OSINTracker
- Comparison of two investigations / detection of common entities
- Community pivot plugins

---

## 7. Notes for the development agent

- Handle **one task at a time**, in order, then check the matching box in this file.
- Before adding a dependency, check that it makes no network call at runtime and justify its addition.
- Components never access Dexie directly: they go through repositories and stores.
- Business logic (domain, lib) stays pure and testable without a DOM.
- Never log investigation content to the console in production.
- When a product behavior is ambiguous, stop and ask rather than invent.
