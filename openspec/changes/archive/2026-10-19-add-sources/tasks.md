# Tasks

Each numbered group is one Conventional Commit. Every group ends green on
`bun run lint && bun run format:check && bun run typecheck && bun run test`
(plus `bun run test:e2e` when it changes the UI).

## 1. Screenshot intake helpers — `feat(domain): detect image formats and hash attachments`

- [x] 1.1 Add `src/domain/image-format.ts` (PNG, JPEG, GIF, WebP magic bytes → MIME or `null`) and verify unit tests cover each format, SVG, text renamed `.png`, and truncated headers
- [x] 1.2 Add `src/lib/hash.ts` (SHA-256 hex via `crypto.subtle`) and chunked base64 encode/decode helpers in `src/lib/`, and verify tests check a known `sha256sum` vector and a base64 round trip on a multi-megabyte buffer
- [x] 1.3 Tighten `attachmentSchema` (MIME enum, `LIMITS.attachmentBytes` = 20 MB, optional `originalSha256`/`originalSize`) and add optional `originalSha256` to `sourceSchema`; verify `schemas.test.ts` rejects an SVG MIME, an oversized `size` and a malformed original hash

## 2. Export format with attachments — `feat(domain): embed optional attachments in exports`

- [x] 2.1 Extend the export file schema with `attachments` (id, investigationId, mime, size, sha256, optional originalSha256/originalSize, base64 `data`, `.default([])`, `SCHEMA_VERSION` unchanged) and the "unknown screenshot" integrity check; verify `export-format.test.ts` rejects a source referencing a missing attachment and accepts a file without `attachments`
- [x] 2.2 Make `parseExport` async: version check, Zod, then decode/sniff/size/SHA-256 verification of each attachment against its declaration and its source; verify tests reject tampered base64, disguised SVG, size mismatch and `schemaVersion` 2
- [x] 2.3 Build exports with or without attachments (sources lose `attachmentId` when excluded) and extend `remapIds` to attachments; verify a round-trip test with and without attachments and a remap test keeping source ↔ attachment links
- [x] 2.4 Raise `MAX_IMPORT_BYTES` to 200 MB and update the toast message to "Fichier trop volumineux (200 Mo maximum)"; verify the size test

## 3. Storage — `feat(db): persist sources and attachments with the graph`

- [x] 3.1 Extend `GraphChanges` and `applyChanges` (sources and attachments upserts/deletes, validation, attachment cleanup on source deletion or `attachmentId` change, dangling `sourceIds` check) and verify `repositories.test.ts` covers each case, including a failed batch writing nothing
- [x] 3.2 Add attachment reads to the repositories (get by id, count and total size per investigation, load for export) and attachment writes to `importSnapshot`; verify import/export repository tests with Blob bytes compared via `arrayBuffer()`

## 4. Store — `feat(store): manage sources in the open investigation`

- [x] 4.1 Load sources into `useGraphStore`, add dirty tracking for sources, pending attachments and deleted attachments, and include them in `takeChanges`/`restoreChanges`; verify `graph-store.test.ts` and `persistence.test.ts` (failed save retried with source and screenshot together)
- [x] 4.2 Add actions `createSource` (optionally attached to an element), `updateSource`, `attachSource`, `detachSource(elementId, sourceId, deleteSource)`, `removeSource`, `setSourceAttachment`; verify tests for shared sources, last-reference detach with and without deletion, removal stripping all references, and entity deletion keeping sources

## 5. Source form — `feat(sources): add source form with screenshot capture`

- [x] 5.1 Create `src/features/sources/source-form-dialog.tsx` (title, URL, archive link, capture date in local time, note, validation messages from the spec) and verify component tests for invalid URL, empty source and date conversion
- [x] 5.2 Add the capture zone (file picker, drop, paste scoped to the dialog, original-file hint, format and size errors, preview, SHA-256 with "Copier l’empreinte", full-size dialog, "Télécharger la capture", replace, "Retirer la capture") with a `useAttachmentUrl` hook revoking object URLs; verify component tests for rejection messages and displayed hash
- [x] 5.3 Add `src/features/sources/optimize-image.ts` (WebP 0.85 at same resolution, JPEG fallback, output sniffed and hashed, original kept when not smaller) and the "Optimiser la capture" option (> 2 MB, not GIF, unchecked, "X Mo → Y Mo", EXIF warning, "Capture optimisée" with "Empreinte d’origine"); verify unit tests with a mocked encoder for gain, no gain and fallback, and component tests for the option's visibility and default
- [x] 5.4 Add `findDuplicateSource` in `src/domain/` (matches `sha256` or `originalSha256` of other sources) and the non-blocking warning ("Ouvrir la source existante", "Rattacher cette source" from an element, "Ajouter quand même"); verify unit tests for exact, original-of-optimized, self-exclusion and one-byte-different cases, and component tests for the three choices

## 6. Sources in panels and library — `feat(sources): attach sources to entities and relations`

- [x] 6.1 Add `sources-section.tsx` to `EntityPanel` and `RelationPanel` ("Ajouter une source" → "Nouvelle source" / "Source existante", list with display name and screenshot indicator, "Retirer" with last-reference confirmation, unchecked by default) and the keyboard-usable `source-picker-dialog.tsx`; verify component tests for filtering, already-attached exclusion and the confirmation checkbox
- [x] 6.2 Add the "Sources (N)" toolbar button and `sources-library-dialog.tsx` (usage counts, "Non utilisée", edit, delete with "Elle sera retirée de N éléments"); verify component tests for counts and deletion
- [x] 6.3 Add the export dialog ("Inclure les captures (N, X Mo)", checked by default, skipped when there is no screenshot, estimated size, export with screenshots blocked above 200 MB) on both export entry points; verify component tests for both paths and for the size guard
- [x] 6.4 Add the graph-level paste shortcut (one selected element, focus outside text fields, no open dialog; opens "Nouvelle source" pre-filled, nothing created on cancel; hint when no single selection); verify component tests for each condition and an e2e paste on a selected entity

## 7. Acceptance — `test(e2e): cover sources and screenshots`

- [x] 7.1 Add `tests/e2e/sources.spec.ts`: create a source with a pasted or chosen PNG on an entity, reuse it on a relation, reload, check the displayed SHA-256 against a precomputed value, detach and delete; verify `bun run test:e2e` passes with no CSP violation and no request outside the origin
- [x] 7.2 Extend the round-trip e2e: export with screenshots, delete, re-import, download the screenshot and compare its SHA-256; import a file exported before this change (no `attachments`); verify `bun run test:e2e`
- [x] 7.3 Tick the three v0.2 source boxes in `ROADMAP.md` and verify the full check suite passes

## Workflow follow-up

- Archive the change with `openspec archive add-sources` once reviewed and merged.
