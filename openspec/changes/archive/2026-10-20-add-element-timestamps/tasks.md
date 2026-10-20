# Tasks

Each numbered group is one Conventional Commit. Every group ends green on
`bun run lint && bun run format:check && bun run typecheck && bun run test`
(plus `bun run test:e2e` when it changes the UI).

## 1. Date rules – `test(store): lock when entity and relation dates change`

- [x] 1.1 In `graph-store.test.ts`, with Vitest fake timers, add cases for: a new entity has `createdAt === updatedAt`; `updateEntity` (label, properties) and `updateRelation` (label, direction) set `updatedAt` to the current instant and keep `createdAt`; `attachSource`, `detachSource` and `removeSource` refresh the citing element; verify `bun run test`
- [x] 1.2 Add the negative cases: `moveEntities`, `updateSource`, `setSourceAttachment` and `addRelation` leave every entity's `updatedAt` unchanged, and undo then redo of a rename restore the `updatedAt` of each state; verify `bun run test` (fix the store only if a case fails)
- [x] 1.3 In `export-format.test.ts`, check that an import as a copy keeps `createdAt` / `updatedAt` of every entity and relation while changing their ids; verify `bun run test`

## 2. Dates in the detail panel – `feat(entities): show creation and last-modified dates in the detail panel`

- [x] 2.1 Add `formatDate` (fr-FR, medium date only), `formatDateTime` (fr-FR, medium date, short time) and `formatDateTimeFull` (long date, time with seconds) to `src/lib/format.ts`, switch `investigations-page.tsx` to `formatDateTime`; verify `format.test.ts` checks the three against the same instant built with `Intl` and the investigations list still shows "Modifiée le"
- [x] 2.2 Create `src/features/entities/element-timestamps.tsx` (design: muted horizontal row, `CalendarPlus` / `PenLine` icon + day, modification date only when the dates differ, focusable `<time dateTime aria-label>` as shadcn `Tooltip` trigger); verify `element-timestamps.test.tsx` for equal dates (one date), different dates (two dates), no visible "Créée le" text, the `aria-label` and `dateTime` attributes, and the tooltip content with seconds on focus
- [x] 2.3 Render `ElementTimestamps` as the first element of `EntityPanel` and `RelationPanel`; verify a `detail-content.test.tsx` case that selecting an entity then editing its notes makes the "Modifiée le …" date (found by accessible name) appear without reselecting, and that a relation panel shows the dates too

## 3. Acceptance – `test(e2e): cover element dates on desktop and mobile`

- [x] 3.1 Add `tests/e2e/timestamps.spec.ts` (`timezoneId: 'Europe/Paris'`): dates located by accessible name – add an entity (creation date only), rename it (modification date appears), hover the creation date and check the tooltip "Créée le … à hh:mm:ss", drag another entity and check its panel still shows only the creation date, reload and check the dates are unchanged; verify `bun run test:e2e`
- [x] 3.2 In `tests/e2e/mobile.spec.ts`, select an entity, expand the drawer and check the "Créée le …" date is shown, and that the collapsed summary does not show it; verify `bun run test:e2e`
- [x] 3.3 Tick the v0.3 box "Dates de création et de dernière modification…" in `ROADMAP.md` and verify the full check suite passes

## Workflow follow-up

- The user commits each group (agents do not commit); propose the commit message above when a group is done.
- Archive the change with `openspec archive add-element-timestamps` once reviewed and merged.
