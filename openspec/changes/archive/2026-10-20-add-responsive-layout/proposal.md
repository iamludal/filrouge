# Proposal

## Why

The graph view is built for a desktop window: a 320 px detail panel always docked on the right, a
toolbar holding a 256 px search field and six controls, a mini-map, and interactions that rely on a
mouse and a keyboard (double-click, hover-revealed handles, Delete key). On a 360 px phone the
canvas is squeezed to nothing and several actions are unreachable. OSINT work often happens away
from a desk (checking a lead, adding an account seen on a phone), so the ROADMAP moves the
"Responsive mobile et tablette" task from v1.0 to the start of v0.3, before the canvas gets more
features that would each need retrofitting.

## What Changes

- **Narrow screens** are viewports narrower than 768 CSS px (Tailwind `md`). From 360 px up, the
  page never scrolls horizontally. Tablets in portrait (768 px and up) keep the desktop layout.
- On narrow screens the **detail panel becomes a bottom drawer** instead of a side panel:
  - hidden while nothing is selected, so the canvas uses the whole screen;
  - it appears **collapsed** (a short bar showing what is selected: type and label, relation ends,
    or "3 éléments sélectionnés") as soon as something is selected, leaving the graph visible
    and interactive above it (non-modal);
  - tapping or dragging its handle up **expands** it to most of the screen height with the same
    editor as the desktop panel; dragging it down or tapping the handle collapses it, and a
    "Fermer" button (or dragging down from the collapsed state) clears the selection.
- On narrow screens the **graph toolbar is compacted**: back link, investigation name, save status
  as an icon, a search button revealing the search field over the toolbar, an undo button, and a
  "Plus d’actions" overflow menu holding "Rétablir", "Filtres" (opened in a dialog), "Sources" and
  the export formats. The menu button shows a dot when filters are active.
- The **mini-map is hidden** on narrow screens.
- **Touch gestures** on the canvas (any viewport): one-finger pan and pinch zoom (already supported
  by the canvas, now required), **long press on empty canvas adds an entity** there (touch
  equivalent of the double-click), and the connection handle of a selected entity gets a touch
  target large enough to **drag a relation with a finger**.
- **Delete without a keyboard**: the multiple-selection panel gets a "Supprimer la sélection"
  button (single entities and relations already have one in their panel).
- **Touch targets** of the compact toolbar and the drawer controls are at least 44 × 44 px, and
  dialogs fit within a 360 px wide viewport, scrolling internally when taller than the screen.
- ROADMAP: the responsive task moves from v1.0 to the top of v0.3, its wording updated to the
  bottom-drawer design.

## Capabilities

### New Capabilities
- `responsive-layout`: how the application adapts to narrow and touch screens: the narrow-screen
  threshold, no horizontal scrolling, the compact graph toolbar and its overflow menu, the
  bottom detail drawer and its states, minimum touch target size, dialogs fitting the viewport.

### Modified Capabilities
- `graph-canvas`: the mini-map is hidden on narrow screens; an entity can be added by long press;
  the detail panel requirement now covers the drawer and the empty state on narrow screens; the
  multiple selection can be deleted from the panel.
- `relations`: creating a relation by dragging works with a finger from a selected entity's handle.
- `graph-search`: on narrow screens the search field is reached through a search button.
- `graph-filters`: on narrow screens the filters panel is opened from the overflow menu.

## Impact

- `src/features/graph/investigation-page.tsx` (toolbar layout), `detail-panel.tsx` (side panel vs
  drawer), `graph-canvas.tsx` (mini-map, long press), `entity-node.tsx` (touch handle size).
- New: a drawer component, a media-query hook, a mobile toolbar overflow menu; `search-field.tsx`,
  `filters-panel.tsx`, `history-controls.tsx`, `save-indicator.tsx`, `export-menu.tsx`,
  `sources-library-dialog.tsx` gain a compact presentation or are reachable from the menu.
- `index.html` viewport meta (`interactive-widget=resizes-content` so the on-screen keyboard
  resizes the layout).
- `playwright.config.ts`: a `mobile` project on `devices['Pixel 7']` running a new
  `tests/e2e/mobile.spec.ts`.
- No new runtime dependency, no network access, no data model change.
