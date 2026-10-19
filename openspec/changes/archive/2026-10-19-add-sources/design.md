# Design

## Context

See proposal.md for motivation. Current state, read from `src/` at commit `8e817bf`:

- `src/domain/schemas.ts` already defines `sourceSchema` (with `attachmentId`, `sha256`,
  `archiveUrl`, `capturedAt`) and `attachmentSchema` (`blob`, `mime`, `size`, `sha256`). Entities
  and relations carry `sourceIds`. `SCHEMA_VERSION` is 1.
- Dexie (`src/db/dexie.ts`, version 1) already has `sources` and `attachments` tables, indexed by
  `investigationId` (and `sha256` for attachments). `investigations.remove` already deletes both.
- `loadSnapshot` reads sources but the graph store ignores them; `GraphChanges` and
  `graphRepository.applyChanges` only handle entities and relations.
- Export (`src/domain/export-format.ts`) includes sources, excludes attachments, and pins
  `schemaVersion` to `z.literal(SCHEMA_VERSION)`. There is no `src/domain/migrations/` yet.
- filrouge has not been released publicly yet.
- CSP allows `img-src 'self' data: blob:`; Markdown rendering forbids images.

## Goals / Non-Goals

**Goals:**
- Reuse the existing model where possible: only optional fields and the export `attachments` list
  are added.
- Keep the single save path: sources and screenshots go through the same debounced, atomic,
  validated batch as entities and relations.
- Treat every screenshot, typed or imported, as hostile bytes.

**Non-Goals:**
- Confidence, status and their rendering (next change, `add-confidence-status`).
- Showing sources on graph nodes (badge, count) or searching them.
- Several screenshots per source, non-image attachments (PDF, HTML archives), storage-level
  deduplication of identical screenshots (duplicates are only detected and reported).
- Similarity between different images (perceptual hash): planned separately in ROADMAP v0.3.
- Duplicate detection across investigations.
- Fetching anything from archive.org or the source URL (no network).
- Undo/redo of source edits (comes with `add-undo-redo`).

## Decisions

### Sources live in the graph store, screenshots do not
The open investigation's sources are loaded into `useGraphStore` (`sources: Record<id, Source>`)
with the same dirty tracking as entities and relations (`dirty.sources`, `dirty.deletedSources`).
Screenshot Blobs are not loaded at open: they are read on demand by id when displayed.

A newly added screenshot is kept in the store as a pending `Attachment` (`pendingAttachments`,
Blob reference only, no copy) until the next save writes it; the deleted or replaced ones go in
`dirty.deletedAttachments`. The display hook looks in `pendingAttachments` first, then the
repository, and revokes its object URL on unmount.

- Alternative: write the attachment to Dexie immediately on upload, outside the debounced save.
  Rejected: a crash or failed save between the two writes leaves orphan blobs or a source pointing
  to nothing, and it would need a cleanup sweep. Keeping both in one transaction makes the
  "source and screenshot saved together" requirement trivial.

### One repository batch for everything
`GraphChanges` gains `upsertSources`, `deleteSourceIds`, `upsertAttachments`,
`deleteAttachmentIds`. `applyChanges` validates every record with Zod, checks `investigationId`,
and, inside the same `rw` transaction on all five tables:
- deletes the attachment of each deleted source, and the previous attachment of a source whose
  `attachmentId` changed (read from the stored row, so the store cannot forget one);
- checks that every `sourceIds` of upserted entities and relations exists in stored sources or in
  the batch, minus deleted ones (`sources.bulkGet`), otherwise throws and nothing is written.

Store actions keep references consistent on their side: `removeSource(id)` strips the id from all
`sourceIds` and marks those elements dirty; `detachSource(elementId, sourceId, deleteSource)` is
a single action so the confirmation choice is applied atomically.

### Screenshot intake: sniff, bound, hash
`src/domain/image-format.ts` (pure) detects PNG, JPEG, GIF and WebP from magic bytes and returns
the MIME type, or `null`. The declared `File.type` and file name are ignored. SVG is never
accepted: displayed through `<img>` it cannot run script, but it could if a blob URL were ever
opened as a document, so it is excluded by construction.

`src/lib/hash.ts` computes SHA-256 with `crypto.subtle.digest` (available in secure contexts:
GitHub Pages over HTTPS and `localhost`). The size limit (20 MB, `LIMITS.attachmentBytes`) is
checked before reading the bytes. `attachmentSchema` gains the MIME enum and the size bound.

### Optional optimization keeps the original fingerprint
Default is to store the original bytes: re-encoding changes the hash, strips EXIF (often evidence
itself on photos taken from a target) and can blur small text. Optimization is opt-in, per
screenshot, offered above 2 MB for PNG, JPEG and WebP (not GIF: animation would be lost).

- Pipeline: hash the original first, then `createImageBitmap` → `OffscreenCanvas` (or a detached
  `<canvas>`) at the same resolution → `convertToBlob` / `toBlob` as WebP, quality 0.85. Browsers
  that cannot encode WebP (the result type is checked) fall back to JPEG 0.85. The output is
  sniffed with `image-format.ts` and hashed like any other screenshot. If it is not smaller, the
  original is kept.
- Encoding runs when the box is checked, so the form can show "8 Mo → X Mo" before saving; it is
  discarded if unchecked again.
- Model: `attachmentSchema` gains optional `originalSha256` and `originalSize`; `sourceSchema`
  gains optional `originalSha256`, mirrored like `sha256` so it survives an export without
  screenshots. "Optimized" is derived from `originalSha256` being present, not stored. Both fields
  are optional, so existing rows stay valid.
- Import cannot verify an original fingerprint (the original bytes are gone); only the stored
  image's SHA-256 is checked. The UI labels it "Empreinte d’origine" without claiming it was
  verified.
- Alternatives: always compress (rejected, breaks evidence integrity), lossless-only re-encode
  (rejected, still changes the hash and strips metadata for little gain on screenshots), compress
  only at export (rejected, the exported file would no longer match the stored evidence).

### Duplicate detection from the store
Sources mirror `sha256` and `originalSha256`, and all sources of the open investigation are in the
store, so duplicate detection is a pure in-memory lookup (`findDuplicateSource(sources, hash,
excludeId)` in `src/domain/`): the hash of the added file (the original one, computed before any
optimization) is compared with both fields of every other source. No repository query, and
pending unsaved sources are covered. The `attachments.sha256` index is not needed for this.

The source `sha256` mirrors its attachment's hash. It is kept when a source is exported without
screenshots (the proof of what was seen survives), and cleared when the user removes the
screenshot.

### Source UI
New feature folder `src/features/sources/`:
- `source-form-dialog.tsx`: fields from the spec, capture zone (file input, drop, paste listener
  scoped to the open dialog), preview, fingerprint with copy, full-size view, download. Capture
  date uses `<input type="datetime-local">`, converted to and from UTC ISO.
- `sources-section.tsx`: used by both `EntityPanel` and `RelationPanel`; list, "Ajouter une
  source" dropdown ("Nouvelle source", "Source existante"), "Retirer" with the last-reference
  confirmation.
- `source-picker-dialog.tsx`: filterable list for "Source existante" (input + listbox, arrow keys
  and Enter). No new shadcn `command` dependency; existing `dialog` and `input` suffice.
- `sources-library-dialog.tsx`: opened from a "Sources (N)" toolbar button; usage counts are
  derived from the store (`sourceIds` of entities and relations), never stored.

Paste on the graph: a `paste` listener on `document`, mounted with the investigation page, acts
only when the clipboard holds an image file, no dialog is open, and the event target is not
editable (`input`, `textarea`, `contenteditable`); otherwise it returns without
`preventDefault`, so text paste is untouched. It opens `source-form-dialog` pre-filled with the
image and the target element; nothing reaches the store until "Enregistrer". The form's own paste
listener (scoped to the dialog) handles pastes while it is open, so the two never both fire.

Links (URL, archive link) render through `safeUrl` with `target="_blank"` and
`rel="noopener noreferrer"`. The note is plain text (`whitespace-pre-wrap`), not Markdown, which
keeps the rendering surface minimal.

### Export format extended in place, `SCHEMA_VERSION` stays 1
The application has not been released publicly, so there are no files or browsers in the wild to
migrate: the format is extended without a version bump, and `src/domain/migrations/` is still not
needed. Once filrouge is public, any model change goes back to the CLAUDE.md rule (bump and tested
migration).

The export file gets `attachments: ExportedAttachment[]` (`id`, `investigationId`, `mime`,
`size`, `sha256`, optional `originalSha256`/`originalSize`, `data` base64), always written, and
read with `.default([])` so files exported before this change still import.

- Export: `investigations.exportJson(id, { includeAttachments })`. Without attachments, sources
  are written without `attachmentId`. Base64 is produced in chunks to avoid call-stack limits on
  large arrays.
- Import: `parseExport` keeps its current version check (newer than 1 is rejected) before Zod
  validation.
- Verification is asynchronous (SHA-256), so `parseExport` becomes `async` and returns
  attachments as Blobs; `superRefine` keeps the synchronous checks (ids, references, size fields),
  then a second pass decodes, sniffs and hashes each attachment.
- `remapIds` also remaps attachment ids and `source.attachmentId`.
- `importSnapshot` writes attachments in the same transaction.
- `MAX_IMPORT_BYTES` becomes 200 MB (20 MB × base64 overhead leaves room for about 7 maximum-size
  screenshots, far more typical ones).

`InvestigationSnapshot` stays Blob-free; attachments travel beside it
(`{ snapshot, attachments }`) only for export and import.

Alternative considered: ZIP export with image files beside the JSON. Rejected for now: needs a
zip dependency and a second import path; base64-in-JSON keeps one self-contained, validated file.
Can be revisited with the v1.0 encrypted export.

No Dexie version change either: the `sources` and `attachments` tables and their indexes already
exist, and the new fields are optional.

### Export dialog
`useExportInvestigation` asks the repository for the attachment count and total size of the
investigation (index on `investigationId`, sizes read from rows, no Blob read). Zero: direct
download as today. Otherwise it opens a small dialog with "Inclure les captures (N, X Mo)",
checked by default, because the export is mostly used as a backup.

The dialog shows an estimated size: serialized JSON without attachments plus
`ceil(size / 3) × 4` per screenshot. If the estimate with screenshots exceeds `MAX_IMPORT_BYTES`,
export with screenshots is disabled. Why keep a limit at all: import reads the whole file into
memory (`file.text()` then `JSON.parse`), peaking around three times the file size; browsers also
cap strings at roughly 512 MB, so neither import nor `JSON.stringify` can go much further anyway.
The limit turns a tab crash on a hostile or accidental huge file into a clear refusal, and the
export guard keeps both sides symmetric. A ZIP or streamed format (v1.0) is what would lift it.

## Risks / Trade-offs

- [Large exports held in memory: a 200 MB JSON string plus decoded Blobs] → bounded by the import
  limit, the export guard and the per-screenshot limit.
- [WebP encoding quality differs between browsers; decoding hostile images] → optimization is
  opt-in and shows the result size; decoding uses the browser's image decoder, the same exposure
  as displaying the image.
- [fake-indexeddb Blob support in Node may differ from browsers] → unit tests compare bytes via
  `arrayBuffer()`; the real round trip is covered by Playwright against the production build.
- [`crypto.subtle` is missing on plain HTTP origins other than localhost] → the app is only served
  over HTTPS or localhost; a missing `crypto.subtle` shows "Calcul d’empreinte indisponible" and
  refuses the screenshot rather than storing it without a hash.
- [Same `schemaVersion` 1 for two file shapes: a pre-change build reading a file with
  `attachments` would ignore that field (Zod strips unknown keys) and may reject sources whose
  `attachmentId` it cannot resolve] → no such build is public; acceptable before the first release.
- [Pending Blobs lost if the tab closes before the debounced save] → same guarantee as other edits:
  flush on `visibilitychange`/`pagehide` already exists, and the source dialog triggers an
  immediate flush on save.
- [Paste listener capturing images meant elsewhere] → listener attached only while the source
  dialog is open, on the dialog element.

## Migration Plan

None: no stored-data or file-format migration. Local development databases from v0.1 stay valid
as they are.
