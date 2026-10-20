# Design

## Context

See proposal.md for motivation and specs/ for the required behaviour.

- `entitySchema` and `relationSchema` already declare `status: 'verified' | 'hypothesis'` and
  `confidence?: { reliability: 'A'…'F', credibility: 1…6 }`, and the export format validates them
  through the same schemas. Nothing in the model, the Dexie schema or the export format changes.
- `EntityPatch` and `RelationPatch` in `src/store/graph-store.ts` already accept `status` and
  `confidence`; `updateEntity`/`updateRelation` mark the element dirty, so the debounced save
  covers the new edits without change.
- `createEntity`/`createRelation` in `src/domain/factories.ts` hard-code `status: 'verified'`.
- Nodes are rendered by `entity-node.tsx` (a 48 px circle with a 2 px border in the type colour),
  links by `floating-edge.tsx` (`BaseEdge` plus an `EdgeLabelRenderer` label).
- shadcn `select`, `switch`, `badge` and `tooltip` are already generated.

## Goals / Non-Goals

**Goals:**
- One shared editor for status and grade, used by both panels.
- All grade wording in one pure module so the panel, the badge and later filters agree.

**Non-Goals:**
- No change to the stored shape of `confidence` (no partial grade, no extra "unknown" state).
- No colour coding of grades.
- No status or grade in the "Ajouter une entité" dialog: entities are created verified, then
  switched or graded in the panel that opens on selection.

## Decisions

### D1. Relations default to `hypothesis`, entities stay `verified`, no migration

`createRelation` defaults to `'hypothesis'` and, like the store's `addRelation`, takes an optional
`status` so the dialog can pass the switch value. `createEntity` keeps `'verified'`. Entities are
mostly direct observations, links carry the attributions and inferences; a dashed line only draws
attention while it stays a minority, so it should mark the reasoning, not every new element.
Stored and imported elements keep their status: rewriting them would invent a judgement the user
never made.

*Alternative:* both default to `hypothesis`. Rejected: users rarely go back to validate, so the
whole graph would end up dashed and the signal would be lost.
*Alternative:* migrate existing relations to `hypothesis`. Rejected: v0.1 had no way to choose,
so `verified` there means "unassessed", but the app is unreleased and the user can switch them.

### D2. Grade wording lives in `src/domain/assessment.ts`

The module exports, as plain data and pure functions:

- `RELIABILITY` and `CREDIBILITY`: ordered lists of `{ value, label, phrase }`.
- `formatConfidence(c)` → `"B2"`.
- `describeConfidence(c)` → `"Cotation B2 : source habituellement fiable, information probablement vraie"`.
- `withReliability(current, value)` / `withCredibility(current, value)` → a complete grade, filling
  the missing half with `F` or `6` when `current` is undefined (spec: grade is always complete).

| Value | Label (selector)            | Phrase (description)                      |
| ----- | --------------------------- | ----------------------------------------- |
| A     | Totalement fiable           | source totalement fiable                  |
| B     | Habituellement fiable       | source habituellement fiable              |
| C     | Assez fiable                | source assez fiable                       |
| D     | Pas toujours fiable         | source pas toujours fiable                |
| E     | Peu fiable                  | source peu fiable                         |
| F     | Fiabilité indéterminée      | fiabilité de la source indéterminée       |
| 1     | Confirmée                   | information confirmée                     |
| 2     | Probablement vraie          | information probablement vraie            |
| 3     | Possiblement vraie          | information possiblement vraie            |
| 4     | Douteuse                    | information douteuse                      |
| 5     | Improbable                  | information improbable                    |
| 6     | Véracité indéterminée       | véracité de l’information indéterminée    |

Labels and phrases are separate because "F – Fiabilité indéterminée" does not read as "source
fiabilité indéterminée". Selector items render as `"<value> – <label>"`.

*Alternative:* derive phrases by lower-casing labels. Rejected for the reason above.

### D3. Filling the missing half rather than allowing partial grades

The schema requires both halves. Instead of loosening it (model change, migration, and every
consumer handling a half grade), picking one half on an ungraded element fills the other with the
scale's "cannot be judged" value, which is exactly what the Admiralty code uses for an unknown.
Clearing is a separate "Effacer la cotation" button, so the selectors never need a "Non évaluée"
item: it is only their placeholder when the element is ungraded.

### D4. One `AssessmentFields` component in `src/features/assessment/`

Props: `{ idPrefix, status, confidence, onChange(patch) }` where `patch` is
`{ status } | { confidence: Confidence | undefined }`. `EntityPanel` and `RelationPanel` pass
`updateEntity`/`updateRelation`. It renders a "Statut" field with the "Hypothèse" switch, the two
selects, "Cotation : B2" and "Effacer la cotation" when graded. Clearing sends
`confidence: undefined`; `updateEntity` already spreads the patch, so the key ends up `undefined`,
which the schema accepts and Dexie/JSON omit.

Placement: after the label (entity) or direction (relation), before properties/sources, since it
qualifies the element itself.

### D5. Rendering

- **Node:** the circle gets `border-dashed` when `status === 'hypothesis'` (same 2 px width and type
  colour, so the type stays readable). A graded entity gets a small `Badge` anchored on the
  circle's top-right, outside the connection handle on the right edge, with `title` and
  `aria-label` set to `describeConfidence`. `title` is used rather than the Radix tooltip because
  nodes are memoised and numerous; a native tooltip costs nothing per node.
- **Link:** `FloatingEdge` adds `stroke-dasharray: 6 4` when the relation is a hypothesis; the
  arrow marker is unaffected. The label text becomes `[label, formatConfidence(c)].filter(Boolean)
  .join(' · ')`, with `title` set to the label plus the description. The label stays rendered only
  when that text is non-empty.
- **Mini-map:** unchanged (it draws node rectangles only).

### D6. Relation dialog

`RelationForm` gains a `hypothesis` state (default `true`) and a "Hypothèse" switch below
"Orientée (flèche)". `onSubmit(label, directed, status)` passes it to `addRelation`.

## Risks / Trade-offs

- [Existing v0.1 relations look "verified" although they were never assessed] → Accepted (D1).
  The app is unreleased; the user can switch them to hypothesis.
- [A presumed entity is created verified by mistake] → The panel opens on the new entity with the
  "Hypothèse" switch in view, right after the label.
- [Dashed borders are thin at low zoom] → 2 px border and a 6/4 dash keep it visible at the
  default zoom; filters (next change) will give a stronger way to isolate hypotheses.
- [Badge overlaps the source handle] → The badge sits top-right while the handle is centred on the
  right edge; the e2e test creates a relation by dragging from a graded entity.
- [Relation default switched to hypothesis breaks tests asserting `verified`] → Only the factory
  sets it; the e2e fixture in `sources.spec.ts` sets `status` explicitly. Unit tests touching the
  default are updated in the same commit.

## Migration Plan

None: no stored data changes. Rollback is reverting the commits; elements created as hypotheses
stay valid under the old code.

The entities spec keeps its v0.1 "New entity defaults" requirement (status "verified"); only the
relations spec changes its default.
