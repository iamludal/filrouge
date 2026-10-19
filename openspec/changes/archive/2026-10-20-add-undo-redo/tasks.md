# Tasks

Each numbered group is one Conventional Commit. Every group ends green on
`bun run lint && bun run format:check && bun run typecheck && bun run test`
(plus `bun run test:e2e` when it changes the UI). Agents do not commit: they leave the group in
the working tree and propose its commit message.

## 1. Deferred screenshot deletion — `feat(db): purge unreferenced screenshots instead of deleting them on release`

- [x] 1.1 Stop deleting released screenshots in `graphRepository.applyChanges`, remove `deleteAttachmentIds` from `GraphChanges` and `deletedAttachments` from the store's `dirty`, and keep released screenshots in the store's `attachments` map; verify `repositories.test.ts` (deleting or re-pointing a source keeps its screenshot stored, a source pointing at a missing screenshot is still refused) and `persistence.test.ts` pass
- [x] 1.2 Add `graphRepository.purgeUnreferencedAttachments(investigationId)` (one `rw` transaction, deletes by primary key the investigation's screenshots no source references); verify a repository test where referenced screenshots and other investigations' screenshots are kept and the others deleted
- [x] 1.3 Limit `attachmentsRepository.stats` and `investigationsRepository.loadExport` to screenshots referenced by a source; verify repository tests with an unreferenced screenshot present (count, total size and export exclude it)
- [x] 1.4 Call the purge in `InvestigationPage` before loading the snapshot and after the final flush on leave, ignoring failures; verify an e2e test in `tests/e2e/sources.spec.ts`: delete a source with a screenshot, wait for "Enregistré", go home, and check through `page.evaluate` on IndexedDB that the screenshot is gone

## 2. History in the store — `feat(store): record graph edits for undo and redo with zundo`

- [x] 2.1 Add `zundo` (`bun add zundo@^2.3.0`) and verify `bun install --frozen-lockfile` and `bun run build` succeed
- [x] 2.2 Add `src/store/history.ts`: diff of two record maps into upserts/deletes, merge into `dirty`, and the group-key `handleSet` wrapper (1 s sliding window); verify `src/store/history.test.ts` unit tests for the diff (added, changed, removed, unchanged identity) and the grouping (same key within 1 s, after 1 s, different key, reset)
- [x] 2.3 Wrap `useGraphStore` with `temporal` (partialize `entities`/`relations`/`sources`, reference equality, `limit: 100`), add `undo()`/`redo()` that recompute `dirty`, set `saveStatus` to pending and prune the selection, clear the history in `load`/`close`, set group keys in `updateEntity`, `updateRelation`, `updateSource` and `moveEntities`, and make `detachSource` with deletion a single `set`; verify `history.test.ts` store tests: undo/redo of create, edit, move, cascade deletion, `removeSource` with a stored screenshot, attach/detach; selection and `setSaveStatus` not recorded; typing coalesced; new edit clears redo; 101st step drops the oldest; history empty after `load`
- [x] 2.4 Verify persistence of undone states in `persistence.test.ts` (with fake-indexeddb): delete an entity with relations, save, undo, save, and check the repository lists the entity and its relations again

## 3. Shortcuts and toolbar — `feat(graph): add undo and redo shortcuts and toolbar buttons`

- [x] 3.1 Add `useHistoryShortcuts()` in `src/features/graph/` (Mod+Z, Mod+Shift+Z, Ctrl+Y; ignored in text fields and while a dialog is open) and mount it with the graph view; verify a component test (`@testing-library/user-event`) for each shortcut, for focus in a textarea, and for an open dialog
- [x] 3.2 Add a pure platform helper in `src/lib/` (macOS or not, shortcut labels) and verify its unit test for both platforms
- [x] 3.3 Add "Annuler" / "Rétablir" icon-only buttons (`Undo2` / `Redo2`, `aria-label`) to the investigation page toolbar, disabled from the temporal store, each wrapped in the shadcn `Tooltip` with a `span` trigger so it also shows when disabled; verify the component test checks the accessible names, the tooltip text on hover (disabled button included) and on keyboard focus, and both disabled states on open and after one edit then one undo
- [x] 3.4 Add `tests/e2e/undo-redo.spec.ts` covering the edit-history spec scenarios: undo/redo a deletion with relations, undo a move, typed label undone in one step, source with screenshot restored after its deletion was saved, shortcut ignored in the notes field, tooltip shown on the toolbar buttons, undo then reload keeps the restored entity, history empty after leaving; verify `bun run test:e2e`
- [x] 3.5 Check the "Undo/redo" box in `ROADMAP.md` (v0.2) and verify the full check suite, `bun run test:e2e` included, is green

## Workflow follow-up

- Archive the change (`openspec archive add-undo-redo`) after the user has committed the three groups.
