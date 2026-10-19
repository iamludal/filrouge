# Proposal

## Why

An OSINT graph mixes established facts with leads that still need checking, and findings come
from sources of very different quality. The data model has carried `status` (verified or
hypothesis) and an optional Admiralty `confidence` on entities and relations since v0.1, but the
user can neither see nor change them, so every element looks equally certain. Now that sources
exist (`add-sources`), this is the next v0.2 block: let the user grade each element and make
uncertainty visible on the graph, before search and filters build on it.

## What Changes

- Entity and relation panels get an **assessment** section: a "Hypothèse" switch for the status
  and an Admiralty grade made of the source reliability (A–F) and the information credibility
  (1–6), each with its French meaning. The grade is optional and can be cleared.
- Picking only one half of the grade fills the other with its "cannot be judged" value (F or 6),
  so the stored grade is always complete, as the model requires.
- **BREAKING (behaviour)**: new relations start as **hypotheses** instead of verified. The
  "Nouvelle relation" dialog gets a "Hypothèse" switch, on by default. In OSINT, uncertainty
  mostly lies in links (attributions, inferences), while entities are usually direct observations
  (an email, a domain, an account): new entities stay verified, and the user switches the rare
  presumed entity to hypothesis in its panel. This keeps dashed lines a minority signal pointing
  at the reasoning to check. Existing data is unchanged (no migration, `SCHEMA_VERSION` stays 1).
- On the canvas, hypothetical entities have a **dashed circle** and hypothetical relations a
  **dashed line**. A graded entity shows a **confidence badge** (e.g. "B2") on its node; a graded
  relation shows the grade after its label (e.g. "connaît · B2"). The badge and label explain the
  grade on hover.
- Status and grade are saved automatically and survive export and re-import (already covered by
  the model and the export format; this change adds the tests).

Out of scope: editing several selected elements at once, filtering by status or confidence
(planned in `add-search-filters`), deriving a grade from the attached sources.

## Capabilities

### New Capabilities
- `assessment`: the status (verified or hypothesis) and the Admiralty confidence grade of entities
  and relations: values, French labels, editing in the detail panel, persistence and export.

### Modified Capabilities
- `relations`: the creation dialog offers a "Hypothèse" switch, on by default.
- `graph-canvas`: node appearance shows the hypothesis border and the confidence badge; links
  show the hypothesis dash and the grade in their label.

## Impact

- `src/domain/`: new `assessment.ts` (grade labels, notation, completion rule); `factories.ts`
  default relation status. No schema change, no migration, export format unchanged.
- `src/store/graph-store.ts`: `addRelation` accepts a status. `updateEntity`/`updateRelation`
  already accept `status` and `confidence`.
- `src/features/assessment/` (new) used by `EntityPanel` and `RelationPanel`;
  `relation-dialog.tsx`; `entity-node.tsx` and `floating-edge.tsx` for rendering.
- Tests: unit tests for the domain helpers and components, e2e for editing, rendering and
  round-trip. The e2e fixture in `tests/e2e/sources.spec.ts` sets its status explicitly and is
  unaffected.
- No new dependency, no network access, no CSP change.
