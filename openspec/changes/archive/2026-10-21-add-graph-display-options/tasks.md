# Tasks

The whole change is one ROADMAP task and lands as one Conventional Commit:
`feat(graph): add display options to show or hide labels, ratings, important mark and minimap`.

## 1. Options model and device preference

- [x] 1.1 Add `src/domain/display-options.ts` (type, `DEFAULT_DISPLAY`, Zod schema with per-field `true` defaults, `MENU_OPTIONS`, `isDefaultDisplay` over the menu options and `resetMenuOptions`) with unit tests in `display-options.test.ts` covering defaults, a partial stored object and an invalid one; verify `bun run test src/domain/display-options.test.ts` passes
- [x] 1.2 Add `src/store/display-store.ts` (`options`, `toggle`, `reset`, read once from `filrouge:display` inside a `try` with schema validation, written back on change inside a `try`) with tests in `display-store.test.ts`: default when nothing is stored, invalid JSON falls back to defaults, toggle persists to `localStorage`, reset restores defaults, `view-store.reset()` leaves it untouched; verify `bun run test src/store/display-store.test.ts` passes
- [x] 1.3 Add the `t.graph.display` keys (`menu`, `entityLabels`, `relationLabels`, `ratings`, `importantMark`, `reset`, `hideMinimap`, `showMinimap`) to `fr.ts` and `en.ts`; verify `bun run typecheck` passes

## 2. Canvas follows the options

- [x] 2.1 `entity-node.tsx`: hide the label (keeping `title` and adding `aria-label` with the name), the rating badge, and the important mark (flag, 4 px border, tint) according to the options; extend `entity-node.test.tsx` with one test per option and the combined "icon and colour only" case; verify the tests pass
- [x] 2.2 `floating-edge.tsx`: drop the rating from the label when `ratings` is off, render no label when the text is empty or `relationLabels` is off; extend `floating-edge.test.tsx` ("connaît · C3" becomes "connaît", rating-only label disappears, relation labels off hides both); verify the tests pass
- [x] 2.3 `graph-canvas.tsx`: render the `MiniMap` only when `!narrow && options.minimap`, and on wide screens add a `ControlButton` at the end of `<Controls>` toggling the option (`Compass` icon, highlighted while shown, named "Masquer la mini-carte" / "Afficher la mini-carte"); verify with the e2e tests of 5.1 and 5.2

## 3. Menus

- [x] 3.1 Add `src/features/graph/display-menu.tsx` (`DisplayMenu` button with `Eye` icon and dot, `DisplayMenuItems` checkbox items that keep the menu open, one icon per option, reset item disabled at defaults, no minimap item; `reset` keeps the mini-map) and mount `DisplayMenu` after `FiltersButton` in `investigation-page.tsx`; cover it in `display-menu.test.tsx` (items and checked state in French and English, toggle keeps the menu open, dot and reset state); verify the tests pass
- [x] 3.2 `compact-graph-toolbar.tsx`: add the "Affichage" submenu after "Filtres" (no "Mini-carte") and show the existing dot when a non-minimap option is off; extend `compact-graph-toolbar.test.tsx` (submenu items, dot with "Cotations" off, no dot with only the mini-map hidden); verify the tests pass

## 4. Exports follow the options

- [x] 4.1 `graph-layout.ts` takes a `display` argument: leave out hidden label, badge and flag boxes, expose per-node `important` combined with the option; `graph-image.tsx` draws from the layout only; `render-graph-svg.ts` and `use-graph-exports.tsx` pass `useDisplayStore.getState().options`; extend `render-graph-svg.test.tsx` (labels off: no label text and narrower frame with circles ≥ 32 px inside; ratings off: "connaît" without "B2"/"C3"; mark off: 2 px stroke, white fill, no `data-flag`; defaults: label, "B2" and flag present); verify the tests pass

## 5. End-to-end and docs

- [x] 5.1 Add `tests/e2e/display-options.spec.ts`: toggle each option on a seeded graph and check the canvas, "Réinitialiser l'affichage", preference kept after reload and shared with another investigation, corrupted `filrouge:display` falls back to defaults, JSON export unchanged, rating toggle not undone by "Annuler", exported SVG without the hidden labels, the mini-map button hiding and showing the mini-map with its name switching, with no menu item, no dot and no reset effect; verify `bun run test:e2e tests/e2e/display-options.spec.ts` passes
- [x] 5.2 Update `tests/e2e/mobile.spec.ts`: the overflow menu lists "Affichage", the zoom controls hold no mini-map button, toggling "Libellés des entités" from it hides the labels, and the "Plus d'actions" dot shows with "Cotations" off; verify `bun run test:e2e tests/e2e/mobile.spec.ts` passes
- [x] 5.3 Add the ROADMAP line in v0.3 (« Options d'affichage du graphe : libellés des entités et des relations, cotations, marque « Important » et mini-carte masquables depuis un menu « Affichage » (sous-menu de « Plus d'actions » sur écran étroit), préférence de l'appareil, suivie par les exports PNG et SVG (OpenSpec `add-graph-display-options`) ») and check it once the DoD is met

## 6. Verification

- [x] 6.1 Run `bun run lint && bun run format:check && bun run typecheck && bun run test && bun run test:e2e` and verify everything is green, with no new `console` call and no network request
