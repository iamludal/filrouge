# Proposal

## Why

In an investigation, when a fact was recorded matters: it tells the user which leads are fresh,
which were set aside long ago, and in what order the picture was built. Entities and relations
have carried `createdAt` and `updatedAt` since v0.1, and the store already refreshes `updatedAt`
on most edits, but the user never sees them and no spec says which edits count. This change shows
both dates in the detail panel and fixes the rules, before the v0.4 table and timeline views
build on them.

## What Changes

- The entity and relation panels (side panel on wide screens, expanded drawer on narrow ones)
  start with the creation date and, once the element has been edited, the last-modified date. Each
  is an icon followed by the day ("20 oct. 2026"), side by side on one row, without a visible label to keep the
  panel uncluttered; "Créée le" / "Modifiée le" and the exact time with seconds appear in a
  tooltip on hover or keyboard focus, and in the accessible name. Dates use the French locale
  and the browser's time zone.
- The rules for the last-modified date are specified: any change to the element's own content
  (type, label, properties, tags, notes, status, confidence, relation label and direction, sources
  attached, detached or deleted) refreshes it; moving a node on the canvas, editing a source's own
  fields, or adding or removing a relation connected to an entity does not. Undo and redo put
  back the dates of the restored state.
- Import keeps the dates of the file, including when importing as a copy.
- `ROADMAP.md` gets the corresponding v0.3 task.

No data model change: the fields already exist and are validated (`SCHEMA_VERSION` stays 1,
export format unchanged). Out of scope: sorting or filtering by date (comes with the v0.4 table
view), dates on sources (already shown as the capture date), a per-field change log.

## Capabilities

### New Capabilities
- `element-timestamps`: the creation and last-modification dates of entities and relations:
  which edits refresh them, how they are shown in the detail panel, and how they survive undo,
  export and import.

### Modified Capabilities
None. The lossless round trip in `investigation-import-export` already covers the dates; the new
capability states it explicitly for the copy case.

## Impact

- `src/lib/format.ts`: a shared French date-time formatter, also used by the investigations
  list (which currently builds its own).
- `src/features/`: a small timestamps component rendered at the end of `EntityPanel` and
  `RelationPanel`, hence in both the side panel and the drawer through `DetailContent`.
- `src/store/graph-store.ts`: behaviour already matches the rules; this change adds the tests
  that lock it (move without bump, source edits, undo).
- Tests: unit tests for the formatter, the component and the store rules; one e2e on desktop and
  mobile viewports.
- No new dependency, no network access, no CSP change.
