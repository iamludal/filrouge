# Proposal

## Why

The "important" mark added by `add-entity-styling` is too discreet: a 16 px flag in a corner of the
node is easy to miss on a busy graph, which defeats its purpose. And the 30 extra icons turned out
to be few once used on real investigations (no identity document, no vehicle other than a car, no
place such as a factory or a hospital, no cryptocurrency).

## What Changes

- An important entity's node circle gets a border grown outwards (4 px instead of 2, so the
  node looks larger) and a translucent
  background of its own colour, and its flag badge grows from 16 to 24 px. The PNG and SVG exports
  draw all three, as on the canvas.
- The icon set grows from 44 to 95 icons: 51 more lucide icons shipped with the app (people and
  identity, places, transport, telecom and computing, money, media, objects and time). Existing ids are
  kept, so files using them stay valid; no model change.

## Capabilities

### New Capabilities

### Modified Capabilities
- `entity-appearance`: the icon set holds 95 icons.
- `graph-canvas`: an important entity's node has a thicker border, a background tinted with its
  colour and a larger flag badge.
- `graph-image-export`: the exported important entity has the same thicker border, tint and
  larger flag badge.

## Impact

- `src/domain/entity-appearance.ts` (icon ids), `src/features/entities/entity-icons.ts` (map),
  `src/i18n/messages/{fr,en}.ts` (51 names each).
- `src/domain/entity-appearance.ts` (`importantTint`), `src/features/graph/entity-node.tsx`
  (border, tint, badge size), `src/features/graph-export/graph-layout.ts`
  and `graph-image.tsx` (border, tint flattened on white, badge size).
- No new dependency, no schema change, no network request.
