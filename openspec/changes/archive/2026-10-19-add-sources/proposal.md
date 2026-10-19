# Proposal

## Why

Traceability is a core principle of filrouge: every entity and relation should point to the
evidence behind it. The data model already has `Source`, `Attachment` and `sourceIds` since v0.1,
but nothing lets the user create, attach or view sources, so findings cannot be backed by
evidence yet. This is the first block of the v0.2 milestone (sources, confidence, navigation) and
the confidence work builds on it.

## What Changes

- An investigation gets a **source library**: sources are created once and can back several
  entities and relations (many-to-many, as already modelled).
- Entity and relation panels get a "Sources" section: create a new source, attach an existing one,
  open it, or detach it. Detaching the last reference asks whether to also delete the source
  (unchecked by default).
- A source has a title, a URL, an archive link (archive.org or similar), a capture date and a note.
- A source can hold one **screenshot** (PNG, JPEG, WebP or GIF, checked by content, not by file
  name), added by file picker, drag and drop or paste. Its SHA-256 is computed locally, stored on
  the source and shown to the user. The screenshot can be previewed, downloaded, replaced or
  removed.
- Screenshots over 2 MB can optionally be **optimized** (re-encoded locally, off by default so the
  stored bytes stay those of the evidence). An optimized screenshot keeps the original file's
  SHA-256 and size beside its own.
- A "Sources" view in the graph toolbar lists every source of the investigation with its usage
  count, and allows editing and deleting (deleting a used source detaches it everywhere after
  confirmation).
- Sources and screenshots are saved automatically like the rest of the graph, in the same atomic
  batch.
- Export gains an option to **include screenshots** (base64 in the JSON file, new `attachments`
  list). `schemaVersion` stays 1: the application has not been released publicly, so the format
  is extended in place; files without `attachments` still import. Import verifies each embedded
  screenshot (format, size, SHA-256) before storing anything.
- The maximum import file size grows from 50 MB to 200 MB to accommodate embedded screenshots.
  The export dialog shows the estimated size and blocks an export with screenshots that would
  exceed it, so every exported file can be re-imported.

## Capabilities

### New Capabilities
- `sources`: the per-investigation source library, its fields, creation, editing, attaching to and
  detaching from entities and relations, and deletion.
- `attachments`: screenshots attached to a source: accepted formats, size limit, SHA-256
  fingerprint, preview, download, replacement and removal.

### Modified Capabilities
- `investigation-import-export`: optional embedded screenshots in the export file, attachment
  integrity checks on import, export size guard, raised size limit.
- `local-persistence`: sources and attachments are saved automatically and atomically with graph
  edits, validated before write, and attachments are deleted with their source.

## Impact

- `src/domain/`: export format extended with `attachments` (`SCHEMA_VERSION` unchanged), optional
  original-fingerprint fields, image format detection; `src/lib/`: SHA-256 and base64 helpers.
- `src/db/`: graph repository writes sources and attachments, investigations repository imports
  and exports attachments. No Dexie version change (tables and indexes already exist).
- `src/store/graph-store.ts`: sources and pending attachments in the open investigation, dirty
  tracking, attach/detach actions.
- `src/features/sources/` (new), entity and relation panels, graph toolbar, export flow.
- No new runtime dependency expected; screenshots are displayed through `blob:` URLs, already
  allowed by the CSP. No network access.
