# Proposal

## Why

Every entity of a type looks the same on the graph: all persons are the same blue circle with the
same icon. In a real investigation the investigator wants to tell apart, at a glance, the suspect
from the witnesses, a company's own domains from the ones it impersonates, or the few entities
that matter most. The only tools today are tags and filters, which do not show on the node. The
roadmap's v0.3 item "Mise en forme des entités" asks for a per-entity colour and icon that replace
the type's, and an "important" marker visible on the graph and filterable.

## What Changes

- An entity can get a **custom colour**, picked from a fixed palette of 16 colours, that replaces
  its type's colour wherever the entity is drawn (node, mini-map, detail panel header, mobile
  drawer summary, PNG and SVG exports). A "Couleur du type" choice goes back to the type's colour.
- An entity can get a **custom icon**, picked from a fixed, curated set of lucide icons shipped
  with the app (the 14 type icons plus about 30 OSINT-oriented ones), that replaces its type's
  icon in the same places. An "Icône du type" choice goes back to the type's icon. No image import.
- An entity can be marked **"important"**: its node shows a flag badge (also drawn in PNG and SVG
  exports), and the filters panel gains an **"Importance"** criterion keeping only important
  entities.
- The three settings are edited in the entity's detail panel, one entity at a time (no bulk edit
  for a multiple selection). They are ordinary entity edits: saved, undoable, and they refresh the
  entity's last-modified date. Changing the entity's type keeps its custom colour and icon.
- The entity model gains three optional fields, `color` (a palette id such as `"red"`), `icon` (an
  icon id such as `"skull"`) and `important` (boolean), validated on import (unknown ids rejected)
  and included in the JSON export. As filrouge is not published yet, the model is extended in place
  without bumping `SCHEMA_VERSION`, as for screenshots and tool checks.
- Out of scope: free colour picker, user images as icons, styling relations, bulk edit, custom
  entity types (roadmap v1.0), sorting or searching by importance.

## Capabilities

### New Capabilities
- `entity-appearance`: the colour palette and icon set, the per-entity colour, icon and
  "important" settings, their editing in the detail panel, their resolution against the type's
  defaults, and their validation and export.

### Modified Capabilities
- `graph-canvas`: an entity node uses the entity's own colour and icon and shows a flag badge when
  the entity is important; the mini-map uses the entity's colour.
- `graph-filters`: a sixth criterion, "Importance", in the filters panel and in the active criteria
  count.
- `graph-image-export`: exported entities use the entity's own colour and icon and draw the flag
  badge of important entities.
- `element-timestamps`: changing an entity's colour, icon or importance refreshes its
  last-modified date.

## Impact

- `src/domain/`: new `entity-appearance.ts` (palette, icon ids, `entityAppearance(entity)`
  resolution); `entity-types.ts` icon ids move into that shared icon set; `schemas.ts` gains the
  optional `color`, `icon` and `important` fields; `graph-view.ts` gains the `importantOnly`
  criterion.
- `src/features/entities/`: `entity-icons.ts` maps the whole icon set; `EntityIcon` takes an icon
  id; new colour, icon and importance controls in `entity-panel.tsx`.
- `src/features/graph/`: `entity-node.tsx` (colour, icon, flag badge), `graph-canvas.tsx`
  (mini-map), `detail-content.tsx` and `detail-drawer.tsx` (header icon and colour).
- `src/features/graph-export/`: `graph-layout.ts` (flag badge box) and `graph-image.tsx`.
- `src/features/graph-search/filters-panel.tsx`: the "Importance" criterion.
- `src/i18n/messages/{fr,en}.ts`: colour and icon names, control labels, criterion labels.
- Export/import: no code change beyond the schema; round-trip tests cover the new fields.
- No new dependency (lucide-react is already shipped), no CSP change, no network request.
