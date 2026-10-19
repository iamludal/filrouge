# Design

## Context

See proposal.md for motivation. Current state, read from `src/` at commit `1d605f6`:

- `src/store/graph-store.ts` holds the open investigation as records keyed by id (`entities`,
  `relations`, `sources`), updated immutably: an edited record is a new object, untouched records
  keep their identity. Edits also mark ids in `dirty` sets; `takeChanges()` turns them into a
  `GraphChanges` batch that `startAutosave` (`src/store/persistence.ts`) writes 400 ms later.
- `attachments` in the store only holds screenshots added in this session; stored ones are read on
  demand (`useStoredAttachment`). `releaseAttachment` drops a released screenshot from memory and
  lists it in `dirty.deletedAttachments`.
- `graphRepository.applyChanges` (`src/db/repositories/graph.ts`) also deletes, on its own, the
  stored screenshot of a deleted or re-pointed source, and refuses a batch where a source points
  at a missing screenshot ("Capture introuvable").
- `GraphCanvas` commits positions only on drag end (`!change.dragging`), with one `moveEntities`
  call for all dragged nodes. Text fields (`entity-panel`, `relation-panel`, source form) call
  `updateEntity` / `updateRelation` / `updateSource` on every keystroke.
- `zundo` is not installed. Status and confidence (from `add-confidence-status`) are edited
  through `updateEntity` / `updateRelation` and `addRelation`, like any other field.

## Goals / Non-Goals

**Goals:**
- One generic mechanism over the record maps, so any present or future store action that edits
  entities, relations or sources is undoable without per-action code.
- Undo/redo reuses the normal save path: no special persistence code.
- Keep `graph-store.ts` changes small and localized; the history logic lives in its own module.

**Non-Goals:**
- Persisting the history across reloads or sharing it between tabs.
- Undo of investigation-level operations (rename, delete, import), selection or viewport.
- A visible history list or jumping several steps at once.
- Undo inside dialogs (e.g. the source form): the history only records committed store edits.

## Decisions

### zundo `temporal` middleware over the three record maps

`useGraphStore` is wrapped with `temporal(..., { partialize, equality, limit: 100, handleSet })`.
`partialize` keeps `{ entities, relations, sources }`; `equality` compares the three references,
so actions that only touch `selection`, `dirty`, `saveStatus` or `investigation` record nothing.
History snapshots share record objects with the live state (structural sharing), so 100 steps
cost little memory.

Alternatives: a hand-written command stack with inverse operations per action (more code, every
new action needs its inverse, easy to get wrong with cascades); Immer patches (new dependency and
a rewrite of every action). zundo is the roadmap's choice and fits the immutable records as is.

### Store-level `undo()` / `redo()` that recompute `dirty`

The UI never calls `useGraphStore.temporal` directly to move in time. `graph-store` exposes
`undo()` and `redo()` that read the record maps, call `temporal.undo()` / `redo()`, then diff the
maps before and after by id and identity (`src/store/history.ts`, pure and unit-tested):

- present after and absent or a different object before → upsert (and removed from the matching
  `deleted*` set);
- present before and absent after → delete (and removed from the upsert set).

The result is merged into `dirty` and `saveStatus` becomes `pending`, which triggers the existing
autosave. Selection is pruned of ids that no longer exist. Repository cascades stay correct: a
restored entity's relations are restored in the same diff, and `applyChanges` runs deletes before
puts.

Alternative: snapshotting `dirty` in the history. Rejected: `dirty` is cleared by saves, so an old
snapshot would no longer describe what storage needs.

### Step grouping by group key, inside `handleSet`

Each recording action may set a group key before calling `set` (e.g. `updateEntity:<id>:<sorted
patch keys>`, `moveEntities:<sorted ids>`). The `handleSet` wrapper skips pushing a new past
state when the key equals the previous one and the previous change is less than 1 s old (sliding
window), so the step keeps the state from before the first keystroke. Actions without a key,
`undo`, `redo`, `load` and `close` reset the group. Multi-record actions (cascade deletion,
`createSource` with attach, `removeSource`) are a single `set`, hence a single step already;
`detachSource` with deletion, which does two `set` calls, is made a single `set`.

Alternative: zundo's documented throttled `handleSet` (lodash-style). Rejected: it merges
unrelated edits made within the window and adds a dependency.

### History lifetime

`load` and `close` call `temporal.getState().clear()` after setting state, so the loaded snapshot
is never an undoable step and leaving an investigation drops its history.

### Deferred screenshot deletion

Undoing a source deletion must bring its screenshot back, but today the screenshot is deleted in
the same save. Decisions:

- `applyChanges` no longer deletes released screenshots, and `GraphChanges.deleteAttachmentIds` /
  `dirty.deletedAttachments` are removed. Its integrity checks are unchanged.
- The store's `attachments` map becomes append-only for the session: a released screenshot added
  in this session stays in memory so a restored source can still display and save it.
- New `graphRepository.purgeUnreferencedAttachments(investigationId)`: one `rw` transaction that
  reads the sources' `attachmentId`s and deletes, by primary key, the investigation's screenshots
  no source references. `InvestigationPage` calls it before loading the snapshot and after the
  final flush on leave. Failures are ignored (retried on next open); nothing is logged.
- `attachments.stats` and `investigations.loadExport` only consider referenced screenshots, so an
  export made before a purge (e.g. tab killed) is unchanged.

Alternatives: keeping a copy of the released Blob in the history (stored screenshots are not in
memory, they would have to be read before deletion, asynchronously); excluding screenshot
operations from undo (breaks "undo a source deletion", the most valuable case).

### Shortcuts and buttons

A `useHistoryShortcuts()` hook in `src/features/graph/` listens to `keydown` on `window` while
the graph view is mounted: Mod+Z (`metaKey || ctrlKey`) undoes, Mod+Shift+Z and Ctrl+Y redo,
matched on `event.key` lowercased (works on AZERTY). It returns early when the event target is an
`input`, `textarea`, `select` or `contenteditable`, or when a `[role="dialog"]` /
`[role="alertdialog"]` is open, and calls `preventDefault()` otherwise. React Flow binds no
listener to these keys.

"Annuler" / "Rétablir" icon-only buttons (`Button` `variant="ghost" size="icon-sm"`, lucide
`Undo2` / `Redo2`, `aria-label`) sit in the investigation page toolbar, enabled from
`useStore(useGraphStore.temporal, s => s.pastStates.length > 0)` (resp. `futureStates`). Each is
wrapped in the existing shadcn `Tooltip` (`src/components/ui/tooltip.tsx`, provider already in
`src/app/providers.tsx`, first use in the app) reading "Annuler (⌘Z)" / "Rétablir (⇧⌘Z)" on
macOS and "Annuler (Ctrl+Z)" / "Rétablir (Ctrl+Shift+Z)" elsewhere; the platform comes from a
small pure helper in `src/lib/` (`navigator.userAgentData?.platform`, falling back to
`navigator.platform`). A disabled button receives no pointer events, so the tooltip trigger is a
`span` around the button rather than the button itself; the button keeps its own focus for the
keyboard case.

### Test layout

New store tests go in `src/store/history.test.ts`, next to the module; repository tests in `src/db/repositories/repositories.test.ts`; UI journeys in a
new `tests/e2e/undo-redo.spec.ts`.

## Risks / Trade-offs

- [A new store action forgets a group key] → it still works, just one step per call; acceptable
  default, reviewed per action.
- [Released screenshots occupy storage until the investigation is left] → bounded by the session;
  purge on open covers crashes and closed tabs.
- [A `set` that changes the record maps without user intent (e.g. future normalization on load)
  would become an undo step] → `load` clears the history after its `set`; any such action must
  pause tracking (`temporal.pause()`/`resume()`).
- [Undo restores a record's old `updatedAt`] → intended: the record is back to its previous
  content.

## Migration Plan

No data migration and no `SCHEMA_VERSION` bump: the stored format is unchanged. Screenshots
orphaned by earlier versions (none expected) are purged on next open. Rollback: reverting the
change restores immediate deletion; screenshots left unreferenced meanwhile stay in storage
until the investigation is deleted, which is harmless.
