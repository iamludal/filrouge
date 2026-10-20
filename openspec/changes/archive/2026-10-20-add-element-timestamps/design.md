# Design

## Context

See proposal.md for motivation and specs/element-timestamps/spec.md for the rules.

Observed state:

- `Entity` and `Relation` already have `createdAt` / `updatedAt` (`isoDate`, UTC `Z` strings) in
  `src/domain/schemas.ts`; `createEntity` / `createRelation` set both to the same `nowIso()`.
- `graph-store.ts` already refreshes `updatedAt` in `updateEntity`, `updateRelation`,
  `patchElement` (attach / detach source) and `dropSource` (source deletion). `moveEntities`,
  `updateSource`, `setSourceAttachment` and `addRelation` leave entity dates alone. The rules of
  the spec therefore describe the current behaviour; nothing in the store needs to change.
- Undo / redo (zundo) snapshot whole records, so dates come back with the restored state.
- Import spreads the parsed records and only remaps ids for a copy, so dates are kept.
- `DetailContent` renders `EntityPanel` / `RelationPanel` in both the side panel and the expanded
  drawer; the collapsed drawer summary is a separate component.
- The investigations list formats `updatedAt` with its own module-level
  `Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })`.

## Goals / Non-Goals

**Goals:**
- One shared date-time formatter for every user-facing date, so the panel and the investigations
  list read the same.
- Lock the existing store behaviour with tests, so a later refactor cannot start bumping dates
  on moves or forget them on source changes.

**Non-Goals:**
- Changing which store actions bump `updatedAt` (they already match the spec).
- Relative dates ("il y a 3 min"): they need a ticking re-render and age badly in screenshots
  and exports; absolute dates are what an investigator cites.

## Decisions

### Formatter in `src/lib/format.ts`
Add `formatDate(iso)` (medium date only, shown in the panel), `formatDateTime(iso)` (medium date, short time, `fr-FR`, browser time zone, used by the investigations list) and
`formatDateTimeFull(iso)` (long date, `timeStyle: 'medium'`, so seconds are included) next to
`formatBytes`. Formatters are created once at module level. The investigations list switches to
`formatDateTime`. Alternative: keep per-component formatters; rejected, two copies already drift
easily and the v0.4 table and timeline views will need the same format.

The helpers take no time-zone parameter. Unit tests assert on the `dateTime` attribute or on
strings built with the same helper, so they do not depend on the machine's zone; the one e2e
check on a literal string sets Playwright's `timezoneId: 'Europe/Paris'` for that test.

### `ElementTimestamps` component
`src/features/entities/element-timestamps.tsx`, next to `Field`, which `RelationPanel` already
imports from the entities feature. Props: `createdAt`, `updatedAt`. Renders a small muted block
(`text-xs text-muted-foreground`), one flex row (`flex-wrap`, so it wraps on a very narrow panel) holding, per date, a lucide icon (`CalendarPlus` for creation,
`PenLine` for modification, `aria-hidden`) and a
`<time dateTime={iso} tabIndex={0} aria-label="Créée le <date>">` showing `formatDate(iso)`; the time is only in the tooltip.
The modification line is omitted when `updatedAt === createdAt` (string comparison on the stored
ISO values). Placed first in both panels: it is short metadata, and the bottom of a long panel is often out of view.
Both nouns are feminine ("entité", "relation"), so "Créée" / "Modifiée" fit both without a
gender prop.

Icon and date visible, label on demand: the date is the information, the label only
disambiguates which date it is, and two distinct icons already do that once learned. Hiding the
date itself behind a hover was rejected: every lookup would cost a gesture, and touch has none.

Each `<time>` is the trigger of a shadcn `Tooltip` (provider already in `src/app/providers.tsx`)
whose content is "Créée le " + `formatDateTimeFull(iso)`. Shadcn rather than native `title`: it
opens on keyboard focus too, matching the toolbar's history buttons, and looks consistent with
them. The cost is two extra tab stops at the end of the panel, accepted. Touch devices get no
tooltip; the icon carries the meaning there, and the `aria-label` covers screen readers.

Alternative considered: show the dates in the panel header next to the type. Rejected, the
header is shared with the collapsed drawer layout and would crowd narrow screens.

### No store change, tests only
Add unit tests in `graph-store.test.ts` for each rule of the spec (move, source edit, relation
creation, attach / detach / delete source, undo). Use Vitest fake timers to make instants
distinct and deterministic.

## Risks / Trade-offs

- [Typing in the label or notes field refreshes `updatedAt` on every keystroke, so the
  "Modifiée le" line re-renders while typing] → It only changes text at minute resolution and
  the panel already re-renders on each keystroke; no measurable cost.
- [An edit that sets a field to its current value (e.g. re-selecting the same type) still bumps
  `updatedAt`] → Accepted: rare, harmless, and avoiding it means deep-comparing patches in the
  store for no user-visible gain.
- [Dates are shown in the viewer's time zone, so two people sharing an export may read
  different hours] → The full ISO instant is in the `dateTime` attribute and the export file;
  showing the zone in the panel text is not worth the clutter for a single-user tool.
