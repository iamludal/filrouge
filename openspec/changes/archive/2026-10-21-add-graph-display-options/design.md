# Design

## Context

See proposal.md for the motivation and specs/ for the behaviour. Today:

- `src/store/view-store.ts` holds how the graph is looked at (search, filters). It is reset when an
  investigation is opened, never saved, never part of undo.
- `src/app/theme.tsx` is the existing device preference: read from `localStorage`
  (`filrouge:theme`) inside a `try`, written on change, falling back to a default.
- The canvas decorations live in `entity-node.tsx` (label, grade badge, flag, border, tint),
  `floating-edge.tsx` (label built by `relationLabelText`) and `graph-canvas.tsx` (`MiniMap`, hidden
  when `useIsNarrow()`).
- The exports go through `layoutGraph()` (positions and boxes, frame computed from every box) then
  `GraphImage` (SVG drawing). `GraphImage` reads `entity.important` and the layout's `badge` /
  `flag` boxes directly.

## Goals / Non-Goals

**Goals:**
- One source of truth for the five options, readable by the canvas, both toolbars and the exports.
- The defaults render exactly what is rendered today, on the canvas and in the exports.

**Non-Goals:**
- Labels that depend on the zoom level, hiding filtered elements, hiding icons, the grid or the zoom
  controls (deferred or rejected during exploration).
- Syncing the options between devices or tabs that are already open.

## Decisions

### Options model in the domain, store apart from `view-store`

`src/domain/display-options.ts` exports the `DisplayOptions` type (`entityLabels`,
`relationLabels`, `ratings`, `importantMark`, `minimap`, all booleans), `DEFAULT_DISPLAY` (all
`true`), a Zod schema, `MENU_OPTIONS` (the four options of the menu) and two pure helpers:
`isDefaultDisplay(options)`, which looks at the menu options only, and `resetMenuOptions(options)`,
which restores them and keeps `minimap` as it is. The mini-map lives in the same stored object but
is not a menu option: no dot, no reset.

`src/store/display-store.ts` is a small Zustand store (`options`, `toggle(key)`, `reset()`).
It is a separate store, not a slice of `view-store`: `view-store.reset()` runs on every investigation
opening and must not wipe a device preference.

*Alternative:* add the options to `view-store` and exclude them from `reset()`. Rejected: it mixes
per-investigation transient state and a durable preference with different lifetimes.

### Hand-written `localStorage` persistence, validated by Zod

The store reads `filrouge:display` once at creation, inside a `try`, `JSON.parse`, then validates it
with the schema, where each field defaults to `true` (a preference saved before a future option
exists stays valid). On a parse or validation failure the store starts from `DEFAULT_DISPLAY`. A
`subscribe` writes the options back on change, inside a `try` (private mode, quota).

*Alternative:* Zustand's `persist` middleware. Rejected: hydration errors surface through its own
callbacks and logging, the theme already uses the hand-written pattern, and stored data must go
through a Zod schema like every other untrusted input.

### Canvas reads the store where it draws

`EntityNode` and `FloatingEdge` select `options` from the display store themselves. They are not
given flags through node `data` as search does. The flags are global, not per element, so
threading them through `syncNodes`/`withViewFlags` would rebuild every node for no gain. A toggle
re-renders every node once, which is acceptable for a rare action.

- Entity label off: the label element is not rendered, so the node box hugs the circle (box
  selection then hits the circle only). The wrapper keeps `title` and gets `aria-label` with the
  name.
- Ratings off: no badge. The edge label text is `relationLabelText(label, ratings ? confidence :
  undefined)`. The label element is not rendered when that text is empty or `relationLabels` is off.
- Important mark off: the node computes `important = entity.important && options.importantMark` and
  uses it for the border width, the tint and the flag.
- Mini-map: rendered when `!narrow && options.minimap`.

### Mini-map button in React Flow's `Controls`

On wide screens `graph-canvas.tsx` adds a `ControlButton` at the end of `<Controls>`, which toggles
`options.minimap` in the display store. It always shows the `Compass` icon, highlighted (the same gray as the borders of the other controls)
while the mini-map is shown, with `aria-label` and `title` set to `t.graph.display.hideMinimap` or
`showMinimap`. It is the only control of the mini-map: it has no menu item, does not light the dot
and is left alone by "Réinitialiser l'affichage", because showing a map is a navigation aid, not a
way of decluttering the graph.

*Alternatives:*
- A menu item as well, in sync with the button. Rejected: two controls for one state, and the
  reset and the dot would have to treat it as a special case.
- `MapMinus`/`MapPlus` icons. Rejected after a try: at 16 px they are hard to tell from a pin or a
  folder, so a single `Compass` icon with a highlighted state reads better.
- A plain "-"/"+" button. Rejected: the zoom controls already hold "+" and "-", so it would read as
  zooming.
- A button in the mini-map's corner, with a floating chip left in its place once it is hidden.
  Rejected: it adds a floating element, it moves between the two states, and it competes with
  panning inside the mini-map (`pannable`).

### Exports: options resolved in the layout

`layoutGraph()` gets a `display: DisplayOptions` argument. It leaves out the label, badge and flag
boxes the options hide, so the frame fits what is drawn. It exposes a per-node `important` flag
already combined with the option, and an optional entity label. `GraphImage` draws from the layout
only and stops reading `entity.important`. `renderGraphSvg` passes the options through, and
`use-graph-exports` reads them with `useDisplayStore.getState()` at export time. PNG goes through
the same SVG, so it follows.

*Alternative:* let `GraphImage` skip elements while `layoutGraph` keeps their boxes. Rejected: the
frame would keep empty margins where hidden labels were.

### One menu body shared by both toolbars

`src/features/graph/display-menu.tsx` exports `DisplayMenu` (desktop: outline "Affichage" button
with an `Eye` icon, a dot while `!isDefaultDisplay`, dropdown) and `DisplayMenuItems`
(one `DropdownMenuCheckboxItem` per option, each with its own icon: `Type`, `Tag`, `BadgeCheck`,
`Flag`, plus "Réinitialiser l'affichage"). Checkbox items call `event.preventDefault()` in `onSelect` so the menu stays open.
`CompactGraphToolbar` renders `DisplayMenuItems` inside a `DropdownMenuSub` "Affichage", placed
after "Filtres", and adds the display condition to its existing dot. That keeps
the CLAUDE.md rule: the new toolbar action is in "Plus d'actions".

### Strings

The new keys go under `t.graph.display` in `fr.ts` and `en.ts`: `menu`, `entityLabels`,
`relationLabels`, `ratings`, `importantMark`, `reset`, `hideMinimap`, `showMinimap`. French uses "Libellés", the term
the entity editor already uses.

## Risks / Trade-offs

- [A device preference is invisible state, so an export can miss labels the user forgot they hid.]
  The "Affichage" dot (and the "Plus d'actions" dot) signals any changed option. The JSON export is
  never affected.
- [The flag sits outside the circle, so hiding it changes the node's measured box.] React Flow
  re-measures the node, and stored positions are unaffected.
- [Two open tabs can disagree until reload.] Accepted: each tab writes its own changes, and the
  last write wins on the next load.
- [An option added later must not reset users' choices.] Per-field defaults in the schema keep old
  stored objects valid.
