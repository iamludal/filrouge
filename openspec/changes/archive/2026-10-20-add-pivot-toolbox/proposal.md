# Proposal

## Why

Once an entity is on the graph, the investigator pivots: searches the email in breach databases,
the domain in certificate logs, the username across social networks. Today filrouge offers no help
for this step: the investigator has to remember which tools exist for which kind of entity, retype
the value in each one, and keep track elsewhere of which tools were already run on which entity.
The roadmap's v0.3 "Pivots" item covered only the URL part; this change widens it into a toolbox
with a per-entity checklist, as agreed when the idea was challenged.

## What Changes

- A built-in, read-only **catalog of OSINT tools** (about 50): search engines, breach databases,
  whois and DNS, account enumeration, infrastructure, archives, company registries, blockchain
  explorers, reverse image search, metadata and maps. Each tool lists the entity types it applies
  to and, for each, either a **URL template** where `{value}` is replaced by the entity's encoded
  label (e.g. `https://crt.sh/?q={value}`) or a **plain link** to the tool's site or GitHub
  repository ("toolbox" mode, for command-line tools and services without a usable query URL).
- An **"Outils" / "Tools" tab** next to "Détails" in the entity panel (and therefore in the mobile
  drawer) lists the tools that apply to the entity's type, grouped by category, with the count
  of checked tools in the tab label.
- Each tool is a real link opening in a new tab with `noopener noreferrer`; its resolved address
  is the link target, so the browser shows it before the click, and its host is displayed next to
  the name. No link submits a public scan: archive, urlscan.io and VirusTotal links only search.
- A **manual checkbox per tool and per entity**, separate from the link, records that the tool was
  used and when. Checking and unchecking are undoable and count as an edit of the entity.
- The entity model gains an optional `toolChecks` list (`{ toolId, checkedAt }`), validated on
  import and included in the export. As filrouge is not published yet, the model is extended in
  place without bumping `SCHEMA_VERSION` (same approach as screenshots).
- Out of scope: custom tools and a settings screen (roadmap v0.4), filtering entities by unchecked
  tools, pivots in the command palette, copyable command lines, automatic checking on click.

## Capabilities

### New Capabilities
- `pivot-tools`: the built-in tool catalog, the entity panel's tools tab, link resolution and
  opening, and the per-entity tool checks (data, display, validation, export).

### Modified Capabilities
- `element-timestamps`: checking or unchecking a tool refreshes the entity's last-modified date.
- `edit-history`: checking and unchecking a tool are undoable edits, each its own step.

## Impact

- `src/domain/`: new `pivot-tools.ts` (catalog data, URL resolution, tools for a type);
  `schemas.ts` gains `toolCheckSchema`, `LIMITS.toolChecks` and the optional `Entity.toolChecks`.
- `src/store/graph-store.ts`: a `setToolCheck` action, recorded as its own history step.
- `src/features/pivots/`: the tools tab content, mounted by `entity-panel.tsx` in new "Détails" / "Outils" tabs (shadcn `tabs` added).
- `src/i18n/messages/{fr,en}.ts`: tab title, category names, checkbox labels, counts.
- Export/import: no code change expected beyond the schema (the entity spread already carries
  the field); round-trip tests cover it.
- No new dependency, no CSP change, no network request made by the app: only tabs the user opens.
