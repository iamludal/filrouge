# Tasks

One Conventional Commit: `feat(entities): make important entities stand out and add more icons`.
The group ends green on `bun run lint && bun run format:check && bun run typecheck && bun run test`
and `bun run test:e2e`.

## 1. Important mark and icon set

- [x] 1.1 Grow an important node's circle border outwards to 4 px (a 2 px outline over the 2 px border) and a translucent veil of its own colour (`importantTint` in `entity-appearance.ts`) and grow its flag badge to 24 px in `entity-node.tsx`; verify `entity-node.test.tsx` (border, tint and badge size only when important) and the desktop e2e (computed border width and background)
- [x] 1.2 Draw the 4 px stroke, the tint flattened on white and the 24 px flag badge in the export (`graph-layout.ts`, `graph-image.tsx`); verify `render-graph-svg.test.tsx` (important circle 4 px with a light fill of its colour, unmarked 2 px and white, flag inside the bounds)
- [x] 1.3 Add the 51 icons to `ENTITY_ICON_IDS`, the lucide map and both dictionaries; verify `entity-appearance.test.ts` (95 unique kebab-case ids, no flag nor star), `appearance-field.test.tsx` (96 cells) and the mobile e2e picker test (96 cells of 44 px)
- [x] 1.4 Verify the full check suite, `bun run test:e2e` included, is green

## Workflow follow-up

- Archive the change after the user has committed it.
