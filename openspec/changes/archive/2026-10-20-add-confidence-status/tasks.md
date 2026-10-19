# Tasks

Each numbered group is one Conventional Commit. Every group ends green on
`bun run lint && bun run format:check && bun run typecheck && bun run test`
(plus `bun run test:e2e` when it changes the UI).

## 1. Grade vocabulary and defaults — `feat(domain): describe Admiralty grades and default relations to hypothesis`

- [x] 1.1 Add `src/domain/assessment.ts` (`RELIABILITY`, `CREDIBILITY` with value/label/phrase from design D2, `formatConfidence`, `describeConfidence`, `withReliability`, `withCredibility`) and verify `assessment.test.ts` covers the order of both scales, "B2" formatting, the "F"/"6" phrases, and the completion rule (A on ungraded → A6, 1 on ungraded → F1, 4 on B2 → B4)
- [x] 1.2 Default `createRelation` to `status: 'hypothesis'` (keep `createEntity` at `'verified'`), add an optional `status` parameter to `createRelation` and to the store's `addRelation`; verify factory and `graph-store.test.ts` tests for both defaults (entity verified, relation hypothesis) and for `addRelation(..., 'verified')`
- [x] 1.3 Add a `schemas.test.ts` / `export-format.test.ts` case rejecting reliability "G" and credibility 7 in an imported entity, and a round-trip test keeping status and confidence (graded, ungraded, both statuses); verify `bun run test`

## 2. Assessment editor — `feat(assessment): edit status and confidence grade in the detail panel`

- [x] 2.1 Create `src/features/assessment/assessment-fields.tsx` (design D4: "Statut" with the "Hypothèse" switch, "Fiabilité de la source" and "Crédibilité de l’information" selects with "Non évaluée" placeholder and `"<value> — <label>"` items, "Cotation : B2", "Effacer la cotation" only when graded) and verify `assessment-fields.test.tsx` for toggling the status, grading in two steps, the half-grade completion, changing one half, and clearing
- [x] 2.2 Use `AssessmentFields` in `EntityPanel` (after the label) and `RelationPanel` (after the direction), wired to `updateEntity`/`updateRelation`; verify a store-level test that clearing leaves no `confidence` on the saved element and that a status change marks the element dirty
- [x] 2.3 Add the "Hypothèse" switch (on by default) to `relation-dialog.tsx` below "Orientée (flèche)" and pass the status through `graph-canvas.tsx` to `addRelation`; verify a component test that the submitted status follows the switch

## 3. Canvas rendering — `feat(graph): show hypotheses and confidence grades on the canvas`

- [x] 3.1 In `entity-node.tsx`, draw the circle dashed for hypotheses and add the grade badge (top-right, `title` and `aria-label` from `describeConfidence`); verify a component test for dashed vs solid border, badge text "B2", the description text, and no badge when ungraded
- [x] 3.2 In `floating-edge.tsx`, dash the stroke (`6 4`) for hypotheses and render the label as `label · grade` (grade alone when the label is empty, `title` with the description); verify a component test for "connaît · C3", "A1" alone, and the dash attribute
- [x] 3.3 Run `bun run test:e2e` and verify the existing suites still pass with the new default (new relations now dashed, entities unchanged) and no CSP violation

## 4. Acceptance — `test(e2e): cover status and confidence grades`

- [x] 4.1 Add `tests/e2e/assessment.spec.ts`: create two entities and a relation with default settings (solid nodes, dashed link), turn on "Hypothèse" on one entity (dashed circle) then off again (solid), grade it "B" only (badge "B6") then "2" ("B2"), grade the relation "C3" (label "… · C3"), create a second relation from the graded entity with "Hypothèse" off (solid link), reload and check everything; verify `bun run test:e2e`
- [x] 4.2 Extend the round-trip e2e: export, delete, re-import and check statuses and grades are unchanged, and that a v0.1 file (all verified, ungraded) imports with no badge and no dashed line; verify `bun run test:e2e`
- [x] 4.3 Tick the two v0.2 boxes "Niveau de confiance…" and "Rendu visuel…" in `ROADMAP.md` and verify the full check suite passes

## Workflow follow-up

- The user commits each group (agents do not commit); propose the commit message above when a group is done.
- Archive the change with `openspec archive add-confidence-status` once reviewed and merged.
