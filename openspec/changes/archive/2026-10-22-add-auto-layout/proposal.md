# Proposal

## Why

Every node is placed by hand. Past 30 or so entities, tidying the graph takes longer than the
research itself, and a pasted batch of accounts or domains lands in a pile. An automatic layout
turns a messy graph into a readable one in one click, and the radial layout answers the most
common OSINT need: show everything around the target, hop by hop.

## What Changes

- A new "Mise en page" menu in the graph toolbar, after "Affichage", with three layouts:
  - "Organique": a network layout where linked entities end up close to each other;
  - "Hiérarchique": layers from top to bottom, following the direction of the relations;
  - "Radial": one entity in the centre and the others on rings, one ring per hop.
- Scope: with no entity or one entity selected, the whole graph is laid out; with two or more
  entities selected, only those entities are laid out, using the relations between them, and they
  stay where the selection was. The rest of the graph does not move.
- Radial centre: the selected entity when exactly one is selected; otherwise the important entity
  with the most relations (then any entity with the most relations, then the oldest).
- Disconnected groups are laid out one by one and packed side by side, largest first, with
  unlinked entities aligned in a grid after them.
- Filtered-out (dimmed) entities are laid out like the others.
- The layout is applied at once: one undo step, saved like a drag, positions on the 16 px grid,
  no change to any entity's last-modified date. Nodes glide to their new place (about 300 ms),
  or jump there when the system asks for reduced motion. The view then fits the laid-out entities.
- A layout that takes more than about 300 ms shows a "Mise en page…" notice with an "Annuler"
  button. If the graph changes while the layout is computed, the result is dropped and a notice
  says so.
- On narrow screens, "Plus d'actions" holds a "Mise en page" submenu with the same three layouts.
- The computation runs off the main thread, so the interface never freezes, and the layout code is
  loaded only the first time a layout is used.

## Capabilities

### New Capabilities

- `graph-layout`: automatic layouts of the graph view – the menu and its layouts, the scope
  (whole graph or selection), the radial centre, the packing of disconnected groups, how the result
  is applied (grid, undo, save, animation, view) and the behaviour of a long or outdated
  computation.

### Modified Capabilities

- `responsive-layout`: the "Plus d'actions" menu of the compact toolbar holds a "Mise en page"
  submenu.

## Impact

- New dependency `elkjs` (layout algorithms, no network access, EPL-2.0), its worker loaded lazily;
  the CSP already allows same-origin workers (`worker-src 'self' blob:`).
- New `src/domain/layout/` (pure: scope, components, packing, radial, grid snapping).
- New `src/features/graph-layout/` (ELK loader, layout pipeline, menu, hook, notices).
- `graph-store.ts`: a layout action recorded as its own history step.
- `graph-canvas.tsx`: animated transition of node positions after a layout, fit of the view.
- `investigation-page.tsx` (desktop toolbar), `compact-graph-toolbar.tsx` (submenu).
- `src/i18n/messages/{fr,en}.ts`: menu and notice strings.
- No model change, no `SCHEMA_VERSION` bump, no network request.
