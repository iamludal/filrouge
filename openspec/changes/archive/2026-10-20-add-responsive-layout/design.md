# Design

## Context

The graph view (`src/features/graph/investigation-page.tsx`) is a fixed-height column: a 44 px
toolbar (`SearchField` 256 px wide, `FiltersButton` popover, `HistoryControls`, `SaveIndicator`
with text, `SourcesLibrary`, `ExportMenu`) above a row holding `GraphCanvas` and the always-mounted
`DetailPanel` (`aside`, `w-80`). The app shell (`src/app/app.tsx`) already uses `h-dvh`.
React Flow already pans with one finger and zooms with a pinch on touch screens; double-click to
add an entity and hover-revealed handles have no touch equivalent. jsdom has no `matchMedia`:
`src/test/setup.ts` stubs it (always `matches: false`). `vaul` is in `node_modules` only as a
transitive dependency of the `shadcn` CLI.

## Goals / Non-Goals

**Goals:**
- One component tree for both layouts; the narrow layout swaps presentation, not behaviour (the
  same stores, editors, dialogs and actions).
- Keep every desktop requirement and existing e2e test unchanged.

**Non-Goals:**
- Multiple selection by touch (no rectangle or modifier-tap gesture): a phone works on one element
  at a time. Keyboard-free deletion of a multiple selection is still covered by the new button.
- A context menu on long press of a node, or touch equivalents of hover tooltips (grade meaning).
- Reworking the app header (brand, GitHub link, theme menu): it already fits 360 px.
- Landscape-phone specific layout (a 915 × 412 viewport is wide: desktop layout).
- PWA / offline (stays in v1.0).

## Decisions

### Bottom drawer rather than a full-screen sheet

The ROADMAP wording proposed a full-screen `Sheet` below `md`. A full-screen sheet hides the graph
while editing, so every "edit A, look at the graph, select B" loop costs a close and a reopen, and
the user loses sight of what they are editing. A **non-modal bottom drawer with two states**
(collapsed summary bar, expanded at most `85dvh`) keeps the canvas visible and tappable above it,
the pattern of map apps where the selection on the map drives the sheet. Selecting on the canvas
updates the drawer in place; the drawer is hidden without selection so the graph gets the whole
screen when browsing. The user's suggestion is kept, with these two refinements (non-modal, hidden
when empty).

### Custom drawer, no new dependency

Alternatives: shadcn `drawer` (vaul) or a Radix `Dialog` styled as a sheet. Both are modal by
design (focus trap, overlay, scroll lock), which contradicts the "canvas stays usable" goal; vaul's
non-modal snap-point mode would mean a new runtime dependency for two states we can hold in local
state. The drawer is a small component in `src/features/graph/detail-drawer.tsx`:
- a fixed-position `section` (`aria-label="Panneau de détail"`) at the bottom of the graph area,
  height driven by state `collapsed | expanded`, with a CSS `transition` on `height`/`transform`
  (disabled under `prefers-reduced-motion`);
- a bar with the handle `button` (`aria-expanded`, `aria-controls`, names "Déplier le panneau" /
  "Replier le panneau"), the one-line summary, and a "Fermer" icon button;
- drag on the handle with Pointer Events (`setPointerCapture`); the drawer follows the finger
  during the drag; on release, `dy < -80` expands, `dy > 80` collapses (or clears the selection
  when already collapsed), anything else snaps back. A tap (no movement) toggles;
- the body (`overflow-y-auto`, `overscroll-contain`) renders the same content as the side panel
  and is `hidden` while collapsed, so collapsed fields are neither visible nor focusable.

`DetailPanel` is split into `DetailContent` (the current entity / relation / multiple-selection
body, unchanged) and two shells: the existing `aside` and the drawer. The expanded state lives in
the drawer's local state and resets to collapsed when the selection becomes empty (the drawer
unmounts), which gives "next selection starts collapsed".

### Rendering one layout at a time, decided in JS

A `useIsNarrow()` hook (`src/app/use-media-query.ts`, next to the theme's own `matchMedia` use;
`useSyncExternalStore` over `matchMedia('(max-width: 47.99rem)')`) decides between the side panel and the drawer, and between the full and compact
toolbars. CSS-only (`hidden md:flex` on both variants) was rejected: both editors would be mounted
at once, duplicating form ids, local editing state and the search field's `Ctrl+F` focus target.
The hook re-renders on resize/rotation; selection, search and filters live in stores, so they
survive the switch. Unit tests default to the wide layout through the existing `matchMedia` stub;
narrow-layout component tests override it with a helper in `src/test/`.

### Compact toolbar

`InvestigationPage` renders `GraphToolbar` (current content) or `CompactGraphToolbar`. The compact
one reuses the existing pieces through small presentation props rather than forks:
- `SaveIndicator` gets an `iconOnly` variant (`role="status"`, `aria-label` = the text);
- `HistoryControls` exposes the undo button alone; "Rétablir" is a menu item calling the same
  action;
- `SearchField` is unchanged; a compact wrapper toggles between the toolbar row and the field
  spanning the row with a "Fermer la recherche" button (which also clears the query);
- the "Plus d’actions" `DropdownMenu` lists "Rétablir", "Filtres" (count badge), "Sources", then
  a labelled group "Exporter" with JSON / PNG / SVG. Menu items open their dialogs through
  controlled `open` state lifted out of the current trigger components: `SourcesLibraryDialog`
  is already controlled; `ExportMenu`'s actions are extracted into a `useGraphExports()` hook used
  by both the desktop menu and the compact menu; the filters form (`FiltersForm`) is rendered in a
  `Dialog` titled "Filtres" in the compact layout.
- Buttons use `size="icon"` raised to `size-11` (44 px) in the compact toolbar.

### Touch gestures on the canvas

- **Long press**: pointer handlers on the canvas wrapper, active for `pointerType === 'touch'` on
  the `.react-flow__pane` target only. A 500 ms timer starts on `pointerdown`; it is cancelled by a
  move beyond 10 px, `pointerup`, `pointercancel`, or a second pointer (pinch). On fire it calls the
  existing `openAddEntityAt(clientX, clientY)`. The pane's `contextmenu` event is prevented on touch
  so Android does not show the system menu, and `-webkit-touch-callout: none` / `user-select: none`
  are set on the pane.
- **Pan / pinch**: React Flow's defaults (`panOnDrag`, `zoomOnPinch`) are kept and asserted;
  `touch-action: none` is already set by React Flow on the pane.
- **Handle by touch**: on `(pointer: coarse)` the source handle gets an invisible `::before` hit
  area of 44 × 44 px centred on the 12 px dot (CSS in the node's classes), and React Flow's
  `connectionRadius` is kept at its default so a drop near the target works. The handle is
  already always visible on a selected node.

### Viewport and keyboard

`index.html` viewport meta gains `interactive-widget=resizes-content`, so on Chromium the
on-screen keyboard shrinks the layout viewport: `h-dvh` shrinks and the expanded drawer's body
scrolls the focused field into view. Safari ignores the key and overlays the keyboard; the drawer
body is a scroll container, so the browser's own focus scrolling still reaches the field.

### Dialogs

shadcn `DialogContent` already uses `max-w-[calc(100%-2rem)]`. It gains
`max-h-[calc(100dvh-2rem)] overflow-y-auto` so tall dialogs (source form, sources library) scroll
instead of overflowing.

### E2E on a phone viewport

`playwright.config.ts` adds a `mobile` project (`devices['Pixel 7']`: Chromium, 412 × 915,
`hasTouch`, `isMobile`) with `testMatch: /mobile\.spec\.ts/`; the `chromium` project ignores that
file. Taps use `locator.tap()`; long press and finger drags use CDP `Input.dispatchTouchEvent`
through a helper in `tests/e2e/touch.ts`. The 360 px no-scroll checks set the viewport inside the
spec. Pinch zoom is React Flow's own behaviour and is not re-tested end-to-end.

## Risks / Trade-offs

- [The drawer's drag fights the canvas pan when it starts on the canvas] → only the handle bar
  starts a drawer drag; the body scrolls natively and never drags the drawer.
- [Long press conflicts with React Flow's pane pan] → the timer is cancelled as soon as the finger
  moves more than 10 px, which is when a pan becomes visible.
- [Collapsed drawer covers the bottom of the canvas, including the zoom controls] → the canvas
  area gets a bottom padding equal to the collapsed height while the drawer is shown, so React
  Flow's bottom-left controls move above it.
- [Two toolbars to keep in sync as features land in v0.3] → both are built from the same pieces
  and actions; a CLAUDE.md rule states that every new toolbar action also goes in the compact
  menu.
- [`matchMedia` stub always reports wide] → narrow-layout unit tests must opt in explicitly; e2e
  on the `mobile` project covers the real thing.

## Migration Plan

UI only, no stored data change. Rollback is reverting the commits.
