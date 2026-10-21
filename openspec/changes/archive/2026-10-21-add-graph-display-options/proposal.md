# Proposal

## Why

On a busy graph, entity labels, relation labels, rating badges and "important" marks pile up and hide
the structure of the investigation, and the user has no way to declutter the view or to export a
plain diagram. The mini-map, too, can only be removed by shrinking the window.

## What Changes

- A new "Affichage" menu in the graph toolbar, after "Filtres", with four checkable options, each
  with an icon and all checked by default: "Libellés des entités", "Libellés des relations",
  "Cotations" and "Marque « Important »", plus "Réinitialiser l'affichage".
- Unchecking an option hides that element on the canvas:
  - entity labels: the label under each circle (the name stays available on hover);
  - relation labels: the whole label of each link, rating included;
  - ratings: the rating badge of entities and the rating part of relation labels;
  - important mark: the flag badge, the thicker border and the tint of important entities, which
    then look like any other entity.
- The mini-map is handled apart from these options: on wide screens, the zoom controls end with a
  map-icon button that hides or shows it. It has no menu item, no dot and is left alone by the
  reset. It stays hidden on narrow screens.
- The options are a preference of the device: kept across reloads, shared by every investigation,
  never saved in an investigation nor exported in its JSON file, and not undoable.
- The "Affichage" button shows a dot while any of the four options differs from the default; on
  narrow screens the "Plus d'actions" button shows the same dot and its menu holds an "Affichage"
  submenu.
- The PNG and SVG exports follow the display options: what is hidden on the canvas is not drawn in
  the image, and the image frame fits what is drawn.

## Capabilities

### New Capabilities
- `graph-display-options`: the display options of the graph view – the menu, the defaults, their
  effect on the canvas, their persistence on the device and the "changed" indicator.

### Modified Capabilities
- `graph-canvas`: the mini-map and the node and link decorations (labels, ratings, important mark)
  are shown only while their display option is on.
- `graph-image-export`: entity and relation drawings leave out what the display options hide.
- `responsive-layout`: the "Plus d'actions" menu holds an "Affichage" submenu, and its button's dot
  also signals changed display options.

## Impact

- New `src/domain/display-options.ts` (type, defaults, Zod schema) and
  `src/store/display-store.ts` (device preference in `localStorage`).
- New `src/features/graph/display-menu.tsx`; `investigation-page.tsx` (desktop toolbar),
  `compact-graph-toolbar.tsx` (submenu, dot).
- `entity-node.tsx`, `floating-edge.tsx`, `graph-canvas.tsx` (mini-map) read the options.
- `graph-layout.ts`, `graph-image.tsx`, `render-graph-svg.ts`, `use-graph-exports.tsx` take the
  options.
- `src/i18n/messages/{fr,en}.ts`: menu strings.
- No model change, no `SCHEMA_VERSION` bump, no new dependency, no network request.
