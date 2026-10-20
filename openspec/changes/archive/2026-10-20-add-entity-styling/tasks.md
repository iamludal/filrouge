# Tasks

Each numbered group is one Conventional Commit. Every group ends green on
`bun run lint && bun run format:check && bun run typecheck && bun run test`
(plus `bun run test:e2e` when it changes the UI). Agents do not commit: they leave the group in
the working tree and propose its commit message.

## 1. Appearance in the model – `feat(domain): add per-entity color, icon and important mark`

- [x] 1.1 Add `src/domain/entity-appearance.ts` with `ENTITY_COLORS` / `ENTITY_COLOR_IDS` (16 ids of design D1), `ENTITY_ICON_IDS` (44 ids of design D2) and `entityAppearance(entity)`; switch `ENTITY_TYPES` to colour ids and icon ids from this module (`EntityIconName` replaced by `EntityIconId`); verify unit tests: every type colour and icon is in the palette and the set, ids are unique and kebab-case, `flag` and `star` are not icons, and `entityAppearance` returns the type's hex and icon without custom values, the custom ones otherwise, and keeps them when only `type` changes
- [x] 1.2 Add the optional `color`, `icon` and `important` fields to `entitySchema` in `src/domain/schemas.ts` (design D3); verify `schemas.test.ts` cases: entity without the fields, with valid ids, `color` "#ff0000", `icon` "flag", `important` "yes" rejected, `important` false accepted
- [x] 1.3 Verify in `export-format.test.ts` that an entity with `color`, `icon` and `important` survives export and import as a copy, that an entity without them exports without the keys (also after `updateEntity(id, { color: undefined })` in `graph-store.test.ts`), and that an unknown `color` is refused with an error whose path ends in `color`; verify a `persistence.test.ts` (fake-indexeddb) case where the fields are saved and read back, and a `history.test.ts` case where undoing a colour change restores the previous value and `updatedAt`

## 2. Entity display and panel controls – `feat(entities): pick a color, an icon and an important mark per entity`

- [x] 2.1 Add the `appearance` block to `src/i18n/messages/fr.ts` and `en.ts` (field label "Apparence" / "Appearance", "Couleur", "Icône", "Important", "Couleur du type" / "Type color", "Icône du type" / "Type icon", the 16 colour names and 44 icon names keyed by id); verify `bun run typecheck` and `messages.test.ts`
- [x] 2.2 Extend `src/features/entities/entity-icons.ts` to the whole icon set (`Record<EntityIconId, LucideIcon>`, named imports) and make `EntityIcon` take an `icon` id; update type-only callers (`entity-type-select.tsx`, `filters-panel.tsx`) to pass the type's icon; verify existing component tests still pass
- [x] 2.3 Draw entities with `entityAppearance` in `entity-node.tsx`, the mini-map colour in `graph-canvas.tsx`, the heading in `detail-content.tsx` and the collapsed summary in `detail-drawer.tsx`; add the flag badge to `entity-node.tsx` (design D6); verify `entity-node.test.tsx` (custom colour on border and icon, custom icon rendered, flag badge named "Important" only when important, grade and flag badges both present), `detail-content.test.tsx` and `detail-drawer.test.tsx` (heading and summary use the custom icon and colour)
- [x] 2.4 Add the "Apparence" field to `entity-panel.tsx` with the colour and icon popover pickers and the "Important" toggle (design D5), in a new `src/features/entities/appearance-field.tsx`; verify a component test: current choice checked in each picker, picking "Rouge" calls `updateEntity` with `color: 'red'` and closes the picker, "Couleur du type" and "Icône du type" clear the field, arrow keys plus Enter pick "Orange", toggle sets `important: true` then clears it, English names shown with the English locale, and no "Apparence" field for a multiple selection (`detail-content.test.tsx`)
- [x] 2.5 Add `tests/e2e/entity-appearance.spec.ts`: pick "Rouge" and "Crâne" for a Personne entity and mark it important, check the node's border colour, icon and flag, reload and find them unchanged, export and read `color`, `icon` and `important` in the downloaded file, undo the mark from the toolbar; and in `mobile.spec.ts` open the icon picker from the expanded drawer at 412 px and check every icon cell is at least 44 × 44 px and the page has no horizontal scroll; verify `bun run test:e2e`

## 3. Importance filter – `feat(filters): filter the graph on important entities`

- [x] 3.1 Add `importantOnly` to `GraphFilters`, `EMPTY_FILTERS`, `passesFilters` and `activeCriteriaCount`, and an `importantCount(entities)` helper in `src/domain/graph-view.ts`; verify `graph-view.test.ts`: unmarked entity dimmed, relation to it dimmed, combined with a type, count of 6 criteria, reset clears it
- [x] 3.2 Add the "Importance" criterion to `filters-panel.tsx` (checkbox "Entités importantes uniquement (N)", fr and en keys); verify `filters-panel.test.tsx` (six criteria listed, count shown, checking dims the unmarked entities, "Réinitialiser" unchecks it) and a case in `tests/e2e/filters.spec.ts` where the "Filtres" button shows "2" with a type and the importance criterion; verify `bun run test:e2e`

## 4. Image export – `feat(graph-export): draw entity color, icon and important flag`

- [x] 4.1 Add the flag box to `graph-layout.ts` (included in the bounds) and draw entities with `entityAppearance` and the flag badge in `graph-image.tsx` (design D6); verify `render-graph-svg.test.tsx`: a styled entity's circle stroke and icon use the palette red and the skull paths, an important entity gets a flag badge inside the image bounds and an unmarked one none, an entity alone at the top left of the graph still has its flag inside the bounds
- [x] 4.2 Extend `tests/e2e/graph-export.spec.ts`: export the SVG of a graph with an important, red entity and find the red stroke and the flag badge in the file; verify `bun run test:e2e`
- [x] 4.3 Check the "Mise en forme des entités" box in `ROADMAP.md` (v0.3), dropping "périmètre à préciser (OpenSpec)", and verify the full check suite, `bun run test:e2e` included, is green

## Workflow follow-up

- Archive the change (`openspec archive add-entity-styling`) after the user has committed the four groups.
- The "Fusion de deux entités" change must decide which colour and icon win, and keep `important` when either entity has it.
- The "Types d'entités personnalisés" change (v1.0) should reuse the palette and icon set of this change.
