# Proposal

## Why

Every edit in filrouge is saved automatically a few hundred milliseconds after it happens, so a
mistaken deletion, a drag in the wrong place or an overwritten label is persisted at once with
no way back. Undo/redo is the safety net that makes direct manipulation of the graph trustworthy,
and it is part of the v0.2 milestone.

## What Changes

- The graph view keeps an **edit history** for the open investigation: every change to entities,
  relations and sources (creation, edit, move, deletion, attaching and detaching a source, adding,
  replacing or removing a screenshot) can be undone and redone.
- Shortcuts **Cmd/Ctrl+Z** (undo), **Cmd/Ctrl+Shift+Z** and **Ctrl+Y** (redo) work on the graph
  view. They leave text fields alone, so typing in a field keeps the browser's native text undo,
  and they do nothing while a dialog is open.
- "Annuler" and "Rétablir" buttons in the graph toolbar, disabled when there is nothing to undo
  or redo.
- Typing in the same field of the same element produces one history step, not one per keystroke.
  A drag of one or several nodes is one step.
- Undone and redone states are saved automatically like any other edit. The history lives in
  memory only: it starts empty when an investigation is opened and is dropped when it is left or
  the page is reloaded. It holds at most 100 steps.
- Selection, viewport, the investigation name and import/export are not part of the history.
- **Screenshot deletion becomes deferred**: deleting a source or replacing/removing its
  screenshot no longer deletes the image from storage at once, so that undoing it can bring the
  image back. Screenshots no longer referenced by any source are purged when the investigation is
  left or opened again. Export and the export dialog's screenshot count ignore unreferenced
  screenshots.

## Capabilities

### New Capabilities
- `edit-history`: undo/redo of graph edits in the open investigation: what is recorded, step
  grouping, shortcuts, toolbar buttons, history lifetime and limit, persistence of undone states.

### Modified Capabilities
- `local-persistence`: "Cascade deletion" no longer deletes a released screenshot in the same
  save; unreferenced screenshots are purged when the investigation is left or opened.
- `attachments`: "Replace or remove a screenshot" no longer requires the previous image to be
  deleted from storage immediately; it is purged with the other unreferenced screenshots.
- `investigation-import-export`: export and its screenshot count include only screenshots
  referenced by a source.

## Impact

- New runtime dependency: `zundo` (temporal middleware for Zustand, ~1 KB), as planned in the
  roadmap.
- `src/store/graph-store.ts`: history middleware, `undo`/`redo` actions, dirty tracking recomputed
  after undo/redo, released screenshots kept in memory for the session.
- `src/db/repositories/graph.ts`: released screenshots are no longer deleted inside
  `applyChanges`; new purge of unreferenced screenshots. `src/db/repositories/investigations.ts`
  and `attachments.ts`: export and stats limited to referenced screenshots.
- `src/features/graph/`: keyboard shortcuts and toolbar buttons; `investigation-page.tsx` purges
  on open and leave.
- No data model change, no `SCHEMA_VERSION` bump, no network access.
- The history is generic over the stored records, so the status and confidence fields added by
  `add-confidence-status` are covered without extra work.
