# Design

## Context

See proposal.md for motivation and specs/ for the required behavior. Current state, read from
`src/`:

- `src/domain/entity-types.ts` gives each type an `icon` (`EntityIconName`, 14 kebab-case ids)
  and a `color` (a Tailwind 600 hex, the same in light and dark themes). The domain stays
  DOM-free: `src/features/entities/entity-icons.ts` maps icon ids to lucide components.
- Type colour and icon are read straight from `ENTITY_TYPES[entity.type]` in six places:
  `entity-node.tsx`, `graph-canvas.tsx` (mini-map), `detail-content.tsx` (heading),
  `detail-drawer.tsx` (collapsed summary), `graph-export/graph-image.tsx`, and
  `graph-search/filters-panel.tsx` / `entity-type-select.tsx` (which show a type, not an entity,
  and stay as they are).
- `src/store/graph-store.ts`: `updateEntity(id, patch)` spreads the patch, sets `updatedAt`, and is
  grouped per `entity:<id>:<fields>` within a 1 s window. Clearing a field is done with
  `undefined` (as `notes` does).
- `src/domain/graph-view.ts`: `GraphFilters` holds the criteria, `passesFilters` applies the
  entity ones, `activeCriteriaCount` counts five; relations of a filtered-out entity are dimmed.
- `src/features/graph-export/graph-layout.ts` computes every drawn box (label, grade badge) so the
  image bounds include them; `graph-image.tsx` draws lucide icons as nested SVG.
- `src/components/ui/` already has `popover`, `radio-group`, `toggle`, `switch`.
- filrouge is not published: the model is extended in place without bumping `SCHEMA_VERSION`, as
  for screenshots and tool checks (agreed project exception to the CLAUDE.md rule).
- lucide-react 1.59.0 is installed; every icon id below was checked against its type
  definitions (`Fingerprint`, for one, does not exist there and was left out).

## Goals / Non-Goals

**Goals:**
- One pure resolution function, so that every place that draws an entity agrees on its colour and
  icon, and the type's defaults stay the fallback.
- Stored values are ids, never raw hex or component names: hostile imports cannot inject a style,
  and the palette can be retuned later without touching data.
- Only the icons of the set end up in the bundle (named imports, no dynamic icon loading).

**Non-Goals:**
- Theme-dependent colours: the palette, like the type colours, uses one value for both themes.
- Showing the custom appearance in the type selector or the type filter (they describe types).
- Searching by colour, icon or importance.

## Decisions

### D1. Palette ids are Tailwind colour names, values are their 600 shade

```ts
export const ENTITY_COLORS = {
  red: '#dc2626', orange: '#ea580c', amber: '#d97706', yellow: '#ca8a04',
  lime: '#65a30d', green: '#16a34a', emerald: '#059669', teal: '#0d9488',
  cyan: '#0891b2', sky: '#0284c7', blue: '#2563eb', indigo: '#4f46e5',
  violet: '#7c3aed', purple: '#9333ea', pink: '#db2777', slate: '#64748b',
} as const
export type EntityColorId = keyof typeof ENTITY_COLORS
```

The 14 type colours are exactly 14 of these values, so `ENTITY_TYPES` switches from hex to a
`EntityColorId` and both share one source; a unit test asserts it. 600 shades are what types
already use and read on both the light card and the dark one. Alternatives: free hex (user
declined: illegible colours in one of the themes, hex validation only); a theme-aware pair per
colour (more work for every renderer, export included, for no requested benefit).

### D2. One icon set shared by types and entities

`EntityIconName` becomes `ENTITY_ICON_IDS`, a `const` array of 44 kebab-case ids in
`src/domain/entity-appearance.ts`: the 14 type icons, then `users`, `venetian-mask`, `ghost`,
`skull`, `bot`, `shield`, `lock`, `key-round`, `eye`, `crosshair`, `triangle-alert`, `bug`,
`smartphone`, `laptop`, `router`, `database`, `hard-drive`, `cloud`, `hash`, `message-circle`,
`camera`, `newspaper`, `credit-card`, `banknote`, `landmark`, `briefcase`, `house`, `plane`,
`ship`, `gavel`. `flag` and `star` are left out: the flag is the "important" badge and a star
would read as a second marker. `entity-icons.ts` maps every id with a typed
`Record<EntityIconId, LucideIcon>` (the compiler catches a missing one). Icon names for screen
readers live in `t.appearance.icons[id]`, colour names in `t.appearance.colors[id]`.

### D3. Optional entity fields, absent when unset

```ts
color: z.enum(ENTITY_COLOR_IDS).optional(),
icon: z.enum(ENTITY_ICON_IDS).optional(),
important: z.boolean().optional(),
```

The UI writes `important: true` or clears it with `undefined`, so an unmarked entity exports
without the field; `important: false` from an outside file is still accepted. Clearing goes
through `updateEntity(id, { color: undefined })`; JSON export drops `undefined` keys, which gives
the "absent from the entity" behavior. Alternative: a nested `appearance` object; rejected, it
makes clearing one part and the patch-based history grouping clumsier, for three flat fields.

### D4. Resolution in the domain

```ts
export function entityAppearance(entity: Pick<Entity, 'type' | 'color' | 'icon'>): {
  color: string        // hex
  icon: EntityIconId
}
```

Every renderer of an entity calls it (node, mini-map, heading, drawer summary, export).
`EntityIcon` takes an `icon: EntityIconId` instead of a `type`; type-only call sites pass
`ENTITY_TYPES[type].icon`. The drawer summary carries the entity's color and icon ids alongside its
`typeId`.

### D5. Panel controls: two popover pickers and a toggle

An "Apparence" `Field` after "Libellé" holds:
- "Couleur": a button showing the current swatch (or the type's, labelled "Couleur du type"),
  opening a `Popover` with a `RadioGroup` of 17 items (reset first, then the palette) as a grid
  of swatches with `aria-label` names. Arrow keys move, Enter/Space selects and closes.
- "Icône": same pattern with 45 items (reset first, then the 44 icons), drawn in the entity's
  current colour.
- "Important": a `Toggle` with the flag icon, `aria-pressed`.

Grid cells are `size-11` under `pointer-coarse` and `size-8` otherwise; 6 columns of 44 px plus
padding stay under 300 px, inside a 360 px screen. Alternative: inline swatch rows always visible;
rejected, 44 icons would take a large part of the panel and of the mobile drawer.

Picking the same value as current does nothing. Successive picks of the same field within 1 s
merge into one history step, as typing does (no edit-history change needed).

### D6. Flag badge at the top left

The grade badge sits at the top right (`-top-2 -right-4`). The flag badge is a 16 px circle with
`bg-background`, a border and a filled `Flag` icon in red-600, at `-top-2 -left-2`, with
`role="img"` and `aria-label` "Important". Its colour does not follow the entity colour so the
marker reads the same on every node. In the export, `graph-layout.ts` adds a `flag` box next to
the `badge` box (so bounds include it) and `graph-image.tsx` draws the same circle and icon. The
node's own box (used for box selection) is unchanged, like for the grade badge.

### D7. Importance criterion as a boolean

`GraphFilters.importantOnly: boolean`, `false` in `EMPTY_FILTERS`. `passesFilters` rejects an
unmarked entity when it is set; `activeCriteriaCount` counts it as the sixth criterion. The panel
shows one checkbox with the number of important entities (a tiny `importantCount(entities)`
helper). Relations need no change: they already follow filtered-out entities. Alternative: a
three-state "all / important / unmarked" select; nobody asked to isolate unmarked entities.

## Risks / Trade-offs

- [Custom colour equal to another type's colour may mislead, e.g. a person in the email pink] →
  accepted: this is the investigator's choice; the panel heading and the node label still say the
  type.
- [Fixed set may lack an icon someone needs] → adding one later is a one-line change to the set,
  the map and both dictionaries; ids are never removed, so old files stay valid.
- [Same `schemaVersion` 1 for files with and without the fields: a build from before this change
  silently drops them on import (Zod objects strip unknown keys)] → acceptable while unpublished,
  as decided for tool checks.
- [Bundle grows by 30 icons] → a few kilobytes gzipped; named imports keep it bounded.

## Migration Plan

None: the three fields are optional; stored data and older files stay valid and render as before.
Rollback is reverting the commits; entities saved with the fields then load with their type's
colour and icon, the fields being dropped by validation, which is acceptable for an unpublished
app.
