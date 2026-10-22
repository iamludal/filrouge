# Tasks

The whole change is one ROADMAP task and lands as one Conventional Commit:
`feat(graph): add organic, hierarchical and radial automatic layouts`.

## 1. Dependency and worker spike

- [x] 1.1 Add `elkjs@0.12.0` with `bun add elkjs@0.12.0`; check that `elk.bundled.js` holds no `eval(` nor `new Function`, and note its EPL-2.0 license in the README (dependencies or third-party note); verify `bun install` succeeds and the README renders
- [x] 1.2 Add `src/features/graph-layout/elk.ts` (ELK `elk-api` with `elk-worker.min.js?worker` as worker factory); run a 3-node `stress` layout from a temporary entry point on the production build and verify in Playwright that it comes back with no CSP violation and that the worker is a separate chunk; remove the temporary entry point

## 2. Pure layout domain

- [x] 2.1 Add `src/domain/layout/components.ts` (connected components in a stable order, orphans apart) with tests: two groups and two orphans, order by size then oldest entity; verify `bun run test src/domain/layout` passes
- [x] 2.2 Add `src/domain/layout/layout-scope.ts` (`buildLayoutInput`: whole graph for 0 or 1 selected entity, selected entities and relations between them for 2+, selected relations alone ignored; radial centre by selection, then important, degree in scope, `createdAt`, id) with tests for every scenario of "Layout scope" and "Radial centre"; verify the tests pass
- [x] 2.3 Add `src/domain/layout/radial.ts` (BFS tree from the centre, sectors by leaf count, rings by hop) with tests: rings by distance, branches kept together, no overlap on a ring of 20 nodes, deterministic output; verify the tests pass
- [x] 2.4 Add `src/domain/layout/pack.ts` (components largest first in shelves, orphans in a grid after them, no overlap) and `src/domain/layout/place.ts` (translate a selection result to the former selection centre, round to 16 px) with tests: no overlapping boxes, largest group at the top left, orphans on a grid, centre kept within one grid step, every coordinate a multiple of 16; verify the tests pass

## 3. Worker and store

- [x] 3.1 Add `src/features/graph-layout/run-layout.ts`, the full pipeline around an injected ELK instance (components, ELK `stress` or `layered` with `elk.direction: DOWN` per component, `radial.ts` for the centre group, `pack.ts`, `place.ts`), with tests in Vitest using `elk.bundled.js` (no worker) on: directed chain A → B → C gives A above B above C, an undirected relation follows creation order, a 3-cycle is laid out without overlap, 30 nodes at the same position end up without overlap, same input gives same output; verify the tests pass
- [x] 3.2 Add `arrangeEntities(positions)` to `graph-store.ts` (positions only, `updatedAt` unchanged, grouping reset, never merged) with tests in `history.test.ts`: one undo restores every position, a drag less than a second before stays a separate step, `updatedAt` unchanged, unchanged positions not rewritten; verify the tests pass

## 4. Layout feature

- [x] 4.1 Add `src/features/graph-layout/use-auto-layout.ts` (lazy worker, latest request id only, terminate on cancel and on a new request, stale check on the `entities` and `relations` references, commit with `arrangeEntities`, `layoutTransition` set in `view-store` unless reduced motion), plus the `t.graph.layout` keys (`menu`, `organic`, `hierarchical`, `radial`, `running`, `cancel`, `failed`, `stale`) in `fr.ts` and `en.ts`; test it with a fake worker: notice after 300 ms only, "Annuler" moves nothing and adds no undo step, failure notice, stale notice on an entity deletion, no notice on a selection change, second request supersedes the first silently; verify `bun run typecheck` and the tests pass
- [x] 4.2 `graph-canvas.tsx` (through `use-layout-transition.ts`): play `layoutTransition` for 300 ms (ease-out, local `nodes` only), clear it on any other `entities` change, then `fitView` on the laid-out entities; test in `use-layout-transition.test.tsx` that a store change during the transition shows the store positions; verify the tests pass
- [x] 4.3 Add `src/features/graph-layout/layout-menu.tsx` (`LayoutMenu` after `DisplayMenu` in `investigation-page.tsx`, `LayoutMenuItems`, icons, disabled under two entities) and the "Mise en page" submenu after "Affichage" in `compact-graph-toolbar.tsx`; cover them in `layout-menu.test.tsx` and `compact-graph-toolbar.test.tsx` (items in French and English, disabled state, item click calls the layout); verify the tests pass

## 5. End-to-end and docs

- [x] 5.1 Add `tests/e2e/auto-layout.spec.ts` on a seeded graph: each layout moves nodes and keeps them on the grid, one Cmd/Ctrl+Z restores every position, positions kept after reload, a 3-entity selection leaves the other entities in place, radial around the single selected entity, menu reachable with the keyboard, reduced motion (`page.emulateMedia({ reducedMotion: 'reduce' })`) places nodes at once, no worker script requested before the first layout and no request outside the origin; verify `bun run test:e2e tests/e2e/auto-layout.spec.ts` passes
- [x] 5.2 Update `tests/e2e/mobile.spec.ts`: "Plus d'actions" lists "Mise en page", its submenu lists the three layouts, "Radial" from it moves the nodes; verify `bun run test:e2e tests/e2e/mobile.spec.ts` passes
- [x] 5.3 Update the README feature list ("Finding your way" or a new "Layout" line) and the ROADMAP line in v0.3 to describe the delivered behaviour with the OpenSpec reference (`add-auto-layout`), then check it once the DoD is met; verify `bun run format:check` passes

## 6. Verification

- [x] 6.1 Run `bun run lint && bun run format:check && bun run typecheck && bun run test && bun run test:e2e` and verify everything is green, with no new `console` call and no network request

## Workflow follow-up

- The user commits (signed) with the message above, then the change is archived with `/opsx:archive`.
