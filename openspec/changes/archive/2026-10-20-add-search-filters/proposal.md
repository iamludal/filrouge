# Proposal

## Why

Past a few dozen entities, finding "the email that appeared in that note" or "every unverified
lead" means scanning the canvas by eye. Full-text search and filters by type, tag, status and
confidence are the two last open items of the v0.2 milestone ("Sources, confiance, navigation").

## What Changes

- A **search field** in the graph view toolbar ("Rechercher…", focused with Cmd/Ctrl+F) looks up
  the typed text, case- and accent-insensitively, in each entity's label, property keys and
  values, notes and tags, and in each relation's label.
- Matching elements are **highlighted** on the canvas and every other element is **dimmed**. A
  counter reads "2 / 5" (or "Aucun résultat"); Enter and Shift+Enter (or the arrow buttons)
  **move to the next / previous result**: the view centres on it and selects it. Escape or the
  clear button empties the search and restores the graph.
- A **"Filtres" button** in the toolbar opens a panel to narrow the graph by **entity type**,
  **tag** (the tags used in the investigation), **entity status** and **relation status** (two
  separate three-way choices "Tous" / "Vérifiés" / "Hypothèses", so that e.g. only verified
  relations can be kept while every entity stays visible) and **confidence**, given as minimum
  thresholds ("fiabilité au moins B", "crédibilité au moins 3") with an "inclure les éléments non
  cotés" option. Values within a criterion are alternatives; criteria combine. Elements that do
  not match are **dimmed, not hidden**: they stay in place, selectable and editable. The button
  shows how many criteria are active, and "Réinitialiser" clears them all.
- Type, tag and entity status apply to entities; relation status applies to relations; confidence
  applies to both. A relation is dimmed when one of its entities is.
- Search and filters work together: search results are taken among the elements that pass the
  filters.
- Search and filters are **view state only**: they are not saved, not exported, not part of the
  undo history, and are reset when an investigation is opened. The PNG/SVG export keeps drawing
  the whole graph without dimming.

## Capabilities

### New Capabilities
- `graph-search`: full-text search in the open investigation's graph: searched fields, matching
  rules, highlighting and dimming, result counter, navigation between results, keyboard access,
  clearing.
- `graph-filters`: narrowing the graph by entity type, tag, status and confidence: available
  criteria, how they combine, how relations are affected, dimming, active-criteria indicator,
  reset, and the combination with search.

### Modified Capabilities
<!-- None: canvas, entity, relation and export requirements are unchanged; the dimming and
     highlighting rules live in the two new capabilities. -->

## Impact

- `src/domain/`: pure matching functions (text normalisation, element ↔ query, element ↔
  filters, combined visibility of every element). No DOM, fully unit-tested.
- `src/store/`: a small view-state store (query, filters, current result) separate from the graph
  store, outside the zundo history, reset on `load` / `close`.
- `src/features/graph-search/` (new): search field with counter and navigation, filters
  panel, Cmd/Ctrl+F shortcut.
- `src/features/graph/`: `graph-canvas.tsx` passes dimmed / highlighted flags to nodes and edges;
  `entity-node.tsx` and `floating-edge.tsx` render them; `investigation-page.tsx` mounts the
  search field and filters button in the toolbar.
- New shadcn/ui components: `popover`, `checkbox`, `toggle-group`. No other dependency.
- No data model change, no `SCHEMA_VERSION` bump, no persisted or exported field.
- Sequencing: `add-graph-export` is still in the working tree and touches
  `investigation-page.tsx` and `floating-edge.tsx`; implement this change once that one is
  committed.
