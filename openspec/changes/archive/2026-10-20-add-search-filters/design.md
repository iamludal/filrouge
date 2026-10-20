# Design

## Context

See proposal.md for motivation and specs/graph-search, specs/graph-filters for behaviour.

Current state that shapes the approach:

- `useGraphStore` (Zustand + zundo `temporal`) holds the open investigation's `entities`,
  `relations`, `sources` and `selection`. Only the three record maps are tracked by the history;
  `selection` is not.
- `GraphCanvas` keeps React Flow's own `nodes` / `edges` arrays and rebuilds them with
  `syncNodes` / `syncEdges` from a store subscription, preserving React Flow's internal fields.
  Store-driven selection already flows into React Flow (that is how a new element gets selected).
- `EntityNode` and `FloatingEdge` render everything from `data.entity` / `data.relation`; the
  relation label is drawn by `EdgeLabelRenderer` in an HTML layer separate from the SVG path.
- `ReactFlowProvider` wraps only `GraphCanvas`; the toolbar in `InvestigationPage` is outside it.
- `src/domain/graph-geometry.ts` (from `add-graph-export`) gives the circle centre of an entity
  slot, shared by the canvas and the image export.
- shadcn/ui has `dropdown-menu`, `select`, `tooltip`, `badge`, but no `popover` or `checkbox`.
- Undo/redo shortcuts are ignored while any `[role="dialog"]` is in the DOM.

## Goals / Non-Goals

**Goals:**
- Keep matching and filtering pure, in `src/domain/`, so every spec rule is unit-tested without
  a DOM.
- One derived "graph view" (which elements are dimmed, which are results, in which order) used
  by the canvas, the counter and the navigation, so they never disagree.
- Stay responsive while typing on graphs of about a thousand elements.

**Non-Goals:**
- Hiding filtered elements, saved filter presets, filters on sources or on dates.
- Searching inside sources (title, URL, note) or rendered Markdown (the raw notes text is
  searched).
- Fuzzy matching, regular expressions, search operators.
- Showing search or filter state in the image export.

## Decisions

### 1. Pure "graph view" computation in `src/domain/graph-view.ts`

Functions:

- `normalizeText(text)`: `normalize('NFD')`, strip `\p{M}`, lower-case. Used for both the query and
  the fields.
- `searchTerms(query)`: normalised query split on whitespace, empty words dropped; `[]` means no
  search.
- `entityHaystack(entity)` / `relationHaystack(relation)`: the normalised searchable fields
  (label, property keys, property values via `String()` except `null`, notes, tags; relation
  label) joined with `\n`. Because terms never contain whitespace, a term cannot match across two
  fields. Cached in a `WeakMap` keyed by the entity/relation object: store records are immutable,
  so an edit produces a new object and invalidates the cache for free.
- `passesFilters(entity, filters)` / `relationPassesFilters(relation, filters)`.
- `computeGraphView(entities, relations, terms, filters)` → `{ dimmedEntityIds, dimmedRelationIds,
  resultIds: ElementRef[] }`, applying the spec's rules in one place: filters first (a relation is
  filtered out when it fails status/confidence or either end is filtered out), then search among
  what is left; results sorted by anchor point (y, then x), entity anchor = circle centre,
  relation anchor = middle of its two circle centres (same geometry helper as the canvas).
- `typeOptions(entities)` (used types with counts) and `tagOptions(entities)` (unique ignoring
  case, first-seen spelling, sorted with `localeCompare(…, 'fr', { sensitivity: 'base' })`).

Alternative considered: computing in the components. Rejected: the counter, the navigation and
the canvas would each re-derive the same rules.

`ElementRef` moves from `graph-store.ts` to the domain (re-exported by the store) since the view
returns it.

### 2. Filters model

```ts
interface GraphFilters {
  types: EntityTypeId[]            // [] = criterion inactive
  tags: string[]                   // normalised (lower-case) tags
  entityStatus: Status | null      // null = "Tous"
  relationStatus: Status | null
  minReliability: 'A' | 'B' | 'C' | 'D' | 'E' | null
  minCredibility: 1 | 2 | 3 | 4 | 5 | null
  includeUngraded: boolean         // default true
}
```

The confidence criterion is active when a threshold is set or `includeUngraded` is false;
`activeCriteriaCount(filters)` counts the five criteria for the button badge. Reliability "at
least B" means its index in `RELIABILITY` is ≤ B's; same for credibility. No threshold "F" / "6":
they would let everything through, which "Toutes" already does.

Status is two single-value fields rather than one `Status[]` shared by both kinds: with a single
criterion, "only verified relations" would also dim hypothetical entities. A single value per
kind is enough, since checking both statuses is the same as "Tous".

A checked type or tag that no entity uses any more (last one deleted or retagged) stays checked
and stays listed with a count of 0, so the user can still uncheck it.

### 3. Separate, unrecorded view store `src/store/view-store.ts`

A plain Zustand store: `query`, `filters`, `currentResult: ElementRef | null`, and actions
`setQuery`, `setFilters`, `resetFilters`, `setCurrentResult`, `reset`. It is not wrapped by
`temporal` and never touches `dirty`, so it is out of the undo history and out of persistence
by construction. `setQuery` clears `currentResult`.

The current result is stored as an `ElementRef`, not an index: when the results change (an edit,
a filter), its position "k" is recomputed; if it is no longer a result the counter falls back to
"<n> résultats" and the next Enter starts again from the first result.

`InvestigationPage` calls `useViewStore.getState().reset()` when it mounts for an id and when it
leaves, next to the existing `load` / `close`.

Alternative considered: adding these fields to `useGraphStore` and excluding them from
`partialize`. Rejected: every view change would still go through the temporal middleware's
`handleSet`, and `load` / `close` would mix document and view concerns.

### 4. One hook feeds the canvas and the toolbar

`useGraphView()` (in `src/features/graph-search/`) reads entities, relations, query and filters,
defers the query with `useDeferredValue`, and memoises `computeGraphView`. The canvas, the
counter and the navigation all call it; the memo depends only on store references, so they get
the same object.

### 5. Canvas rendering of dimmed / highlighted elements

`syncNodes` / `syncEdges` take the view and set `data.dimmed` and `data.highlighted`. The canvas
keeps the latest view in a ref for its graph-store subscription and resyncs in an effect when the
view changes. To avoid re-rendering every node on each keystroke, `syncNodes` reuses the previous
`data` object when entity, dimmed and highlighted are unchanged (`EntityNode` is memoised on its
props).

- `EntityNode`: `opacity-25` with a short opacity transition when dimmed; a highlight ring
  (`ring-4 ring-amber-400/70`) distinct from the selection ring when highlighted.
- `FloatingEdge`: dimmed lowers the opacity of both the path and the HTML label (they live in
  different layers, hence a data flag rather than the edge `className`); highlighted draws the
  stroke and label border in the same amber.
- Mini-map: `nodeColor` returns a muted colour for dimmed nodes.
- Dimmed elements keep their pointer events, so click, box selection and drag behave as usual.
- The "Aucun élément ne correspond aux filtres." hint is a React Flow `Panel`, like the empty-graph
  hint.

The image export renders from the graph store, not from React Flow, so it is unaffected without
any change.

### 6. Toolbar placement and navigation

`ReactFlowProvider` moves up in `InvestigationPage` to wrap the toolbar and the canvas, so the
search field can use `useReactFlow()`. Navigation calls `setSelection` for the result (the canvas
already mirrors store-driven selection) and `setCenter(anchor.x, anchor.y, { zoom: getZoom(),
duration })`, with `duration` 0 under `prefers-reduced-motion`, 300 ms otherwise.

The search field (input + counter with `aria-live="polite"` + previous/next icon buttons + clear
button) and the "Filtres" button sit at the start of the toolbar's right-hand group, before the
undo/redo buttons.

### 7. Filters panel with shadcn `popover`, `checkbox` and `toggle-group`

`bunx shadcn@latest add popover checkbox toggle-group`. The panel is a `Popover` holding checkbox
lists for types (with `EntityIcon`) and tags (scrollable when long), two single-choice
`ToggleGroup`s ("Tous" / "Vérifiés" / "Hypothèses") for entity and relation status, two existing
`Select`s for the thresholds and a checkbox for ungraded elements, plus "Réinitialiser". The
toggle groups never allow an empty value: deselecting falls back to "Tous". The
badge on the button uses the existing `Badge`.

Alternative considered: `DropdownMenu` with checkbox items. Rejected: it closes or traps focus in
ways that do not suit selects inside it, and the panel is a form, not a menu.

### 8. Cmd/Ctrl+F

`useSearchShortcut(inputRef)` binds `keydown` on `window` while the graph view is mounted: Mod+F
(matched on the typed letter, like the history shortcuts, so AZERTY works; Alt excluded) focuses
and selects the field and calls `preventDefault()`, unless a dialog is open. `platform.ts` gains a
`search` label ("⌘F" / "Ctrl+F") shown in the field's tooltip. Escape is handled on the input
itself.

## Risks / Trade-offs

- [Cmd/Ctrl+F no longer opens the browser's find bar in the graph view] → the page's text is the
  graph itself, which the browser cannot search inside the canvas anyway; the shortcut is
  inactive on the home screen and in dialogs.
- [Radix `Popover` content has `role="dialog"`, so undo/redo shortcuts are ignored while the
  filters panel is open] → consistent with other dialogs; the panel closes on Escape or outside
  click.
- [Recomputing the view on every keystroke for large graphs] → cached haystacks, deferred query,
  memoised view; the cost is a linear scan of pre-normalised strings.
- [Box selection also selects dimmed elements, so a Delete can remove elements the user did not
  "see"] → dimmed elements stay visible (25 % opacity) and the detail panel shows the selection
  count; this matches the "dimmed, not hidden" requirement.
- [Highlight colour must read in both themes] → amber ring checked visually in light and dark
  during the e2e task.
