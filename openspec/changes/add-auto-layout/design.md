# Design

## Context

See proposal.md for the motivation and specs/ for the behaviour. Today:

- `graph-store.ts` exposes `moveEntities(positions)`: it writes new positions without touching
  `updatedAt`, is recorded by zundo, and is grouped under `move:<ids>` so that consecutive moves of
  the same nodes within one second form one step.
- `graph-canvas.tsx` keeps its own React Flow `nodes` state, rebuilt from the store by `syncNodes`
  on every store change. Edges are `FloatingEdge`s computed from node positions, so they follow any
  node move for free.
- A stored position is the top-left corner of a 144 px slot (`NODE_WIDTH`), the 48 px circle
  centred in it at the top, the label below. Positions snap to `GRID_SIZE` (16 px).
- The CSP allows `worker-src 'self' blob:` and `script-src 'self'` without `unsafe-eval`.
- elkjs 0.12.0 (checked): no `eval` nor `new Function` in `elk.bundled.js` or the worker build,
  ships `layered`, `stress`, `force`, `radial`, `rectpacking`; about 1.6 MB minified.
  License: EPL-2.0 OR GPL-3.0-or-later.

## Goals / Non-Goals

**Goals:**
- Pure, DOM-free layout logic in `src/domain/layout/`, unit-tested without a worker or ELK.
- No cost for users who never lay out: elkjs is not in the main bundle.
- Deterministic results: same graph, same layout.

**Non-Goals:**
- Keeping non-selected entities as fixed obstacles that the selection layout avoids (a selection
  laid out in place may overlap its neighbours; undo covers it).
- Layout options in the UI (spacing, direction), remembering the last layout, laying out
  automatically on import or on edit.
- Very large graphs beyond a few thousand entities (tracked separately with the Sigma.js idea).

## Decisions

### Pipeline: split, lay out, pack, place, snap

```
 store snapshot ----> buildLayoutInput (scope, centre)                  [main thread, pure]
                          |
                          v
                     components -> per component:
                               organic      -> ELK stress        --+
                               hierarchical -> ELK layered (DOWN) -+--> ELK worker
                               radial       -> radialLayout (centre group only, pure)
                          |
                          v
                     packComponents (largest first, orphans in a grid)  [pure]
                          |
                          v
 arrangeEntities <-- placeAndSnap (translate to selection centre, round to 16 px)  [pure]
```

Every step except the ELK call is a pure function in `src/domain/layout/`:
`layout-scope.ts` (which entities and relations, which centre), `components.ts` (connected
components, stable order), `pack.ts` (shelf packing), `radial.ts`, `place.ts` (translation and grid
snapping). `src/features/graph-layout/run-layout.ts` chains them around an injected ELK instance,
so Vitest runs the same pipeline with `elk.bundled.js` and no worker.

*Alternative:* hand the whole graph to ELK with `separateConnectedComponents`. Rejected: its
packing differs per algorithm, the orphans grid and "largest first" would not be guaranteed, and
the behaviour of the specs would hinge on ELK internals instead of tested code.

### ELK `stress` for "Organique", `layered` for "Hiérarchique"

`stress` gives better network drawings than ELK's `force` (an Eades spring embedder) and is
deterministic. `layered` with `elk.direction: DOWN` gives the layers; each relation is passed as
an ELK edge from `from` to `to`, so an undirected relation follows its creation order, and ELK
breaks cycles itself. Nodes are passed as 144 × 80 boxes (slot width, circle plus two label lines)
with spacing large enough that rounding to the grid cannot create an overlap.

### Radial layout written in house

ELK's `radial` expects a tree. Ours runs a breadth-first search from the centre (neighbours sorted
by creation date for stability), keeps the BFS tree, and gives each subtree an angular sector
proportional to its number of leaves, so branches stay together. Ring radius grows with the hop
count and, per ring, enough to fit its nodes at the slot width. It is about a hundred lines, pure
and testable, and avoids feeding a non-tree graph to an algorithm that does not support it.

*Alternative:* ELK `radial` over a precomputed spanning tree. Rejected: same BFS work on our side,
plus a translation step and less control on sector sizes.

### Centre and scope chosen on the main thread

`buildLayoutInput(state, algorithm)` reads the selection: 0 or 1 selected entity means the whole
graph (with the selected entity as radial centre), 2+ means the selected entities and the relations
whose both ends are selected. Selected relations alone do not narrow the scope. The automatic
centre ranks by `important`, then degree within the scope, then `createdAt`, then id. For a
selection, `place.ts` translates the result so the centre of its bounding box matches the centre of
the selected entities' bounding box before the layout.

### ELK's own worker, created lazily, one request at a time

The spike showed that `elk.bundled.js` cannot run inside a worker of ours: when it finds no
`document` but a `self`, its embedded worker code takes over `self.onmessage` and no longer exports
the in-thread fallback. So the main thread uses the small `elkjs/lib/elk-api.js` (about 5 kB) with
`workerFactory: () => new ElkWorker()`, where `ElkWorker` is `elkjs/lib/elk-worker.min.js?worker`.
Both are imported by `src/features/graph-layout/elk.ts`, itself loaded with a dynamic `import()`
on the first layout, so Vite emits the worker (about 1.4 MB) as a separate chunk downloaded on
demand. Checked on the production build: the layout runs, no CSP violation.

Only the ELK calls run in the worker; scope, components, radial, packing and snapping are linear
or `n log n` and stay on the main thread. Each request carries an id; the main side keeps the
latest id only and ignores any older answer.

Cancel and "new layout while one runs" call `terminateWorker()` and drop the ELK instance; the next
layout creates a new one. ELK cannot be interrupted from inside, and terminating is the only way to
free the CPU.

*Alternatives:* a worker of ours bundling `elk.bundled.js` (rejected, see above, or with a fake
`document` global, a hack); ELK on the main thread (rejected: a large graph would freeze the UI,
and the specs require the notice and its "Annuler" button to stay usable).

### Stale result detection by reference

The store replaces `entities` and `relations` maps on every edit. The request keeps both
references; when the result arrives, if either differs from the current state, the result is
dropped with the "modifié" notice. Selection and view changes do not touch these maps, so they do
not cancel a layout.

### Store action: its own history step

A new `arrangeEntities(positions)` writes positions like `moveEntities` (same `updatedAt` rule)
but resets the grouping first and runs outside any group, so a layout is never merged with a drag
made less than a second before. It changes only the entities whose position differs.

### Animation in the canvas, after the commit

The positions are committed to the store first (undo step and save done at once). The feature
then sets a transient `layoutTransition` (ids → old canvas positions, start time) in `view-store`.
`GraphCanvas` sees it and, with `requestAnimationFrame` for 300 ms, writes interpolated positions
(ease-out) into its local `nodes` state, never into the store; edges follow. Any other store change
to `entities` clears the transition and `syncNodes` takes over, which ends the animation at once
on undo, redo or edit. With `prefers-reduced-motion: reduce` no transition is set. When it ends,
`fitView({ nodes, duration: 300 })` frames the laid-out entities (no duration with reduced motion).

*Alternative:* animate first and commit at the end. Rejected: an edit during the animation would
then race with the pending commit; committing first leaves a single source of truth.

### Notices through sonner

A timer started with the request shows `toast.loading("Mise en page…")` after 300 ms, with an
"Annuler" action; it is dismissed on result, failure or cancel. Failure uses `toast.error`, the
stale case `toast.info`. Strings live under `t.graph.layout` in both dictionaries.

### Menus

`src/features/graph-layout/layout-menu.tsx` exports `LayoutMenu` (desktop button, `LayoutGrid`
icon, after `DisplayMenu`) and `LayoutMenuItems`, reused in a "Mise en page" submenu of
`compact-graph-toolbar.tsx` after "Affichage" (rule: every toolbar action also in "More actions").
Icons: `Waypoints` (organic), `Network` (hierarchical), `Orbit` (radial). Both are disabled with
fewer than two entities.

## Risks / Trade-offs

- [elkjs adds about 1.6 MB to the deployed files] → only in the worker chunk, downloaded on first
  use; checked by an e2e test that no worker script is requested before a layout.
- [EPL-2.0 dependency in an MIT project] → allowed for an unmodified library used as is; keep its
  license notice in the bundle (Vite keeps `@license` comments) and mention it in the README's
  dependencies or a `THIRD_PARTY` note. The maintainer confirms this is acceptable before merge.
- [A selection laid out in place can overlap non-selected entities] → accepted (non-goal), undo in
  one step.
- [Stress layout on thousands of nodes takes seconds] → worker, notice with "Annuler".
- [Undirected relations in "Hiérarchique" follow creation order, which can look arbitrary] →
  stable and documented in the spec; a future option could pick the direction.
- [Worker bundling under the strict CSP and in Playwright] → the first task is a spike that runs
  ELK in the worker on the production build before any UI work.

## Migration Plan

No data migration: only positions change, through the existing model. Rollback is a revert of the
commit; existing investigations keep the positions they were saved with.
