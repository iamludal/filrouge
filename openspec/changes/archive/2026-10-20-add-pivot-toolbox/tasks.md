# Tasks

Each numbered group is one Conventional Commit. Every group ends green on
`bun run lint && bun run format:check && bun run typecheck && bun run test`
(plus `bun run test:e2e` when it changes the UI). Agents do not commit: they leave the group in
the working tree and propose its commit message.

## 1. Tool checks in the model and the store – `feat(domain): record tool checks on entities`

- [x] 1.1 Add `toolCheckSchema`, `LIMITS.toolChecks` (200) and the optional `toolChecks` list to `entitySchema` in `src/domain/schemas.ts` (id regex `^[a-z0-9-]{1,64}$`, `checkedAt` ISO UTC, unique `toolId` refine with `importCode: 'duplicateToolCheck'`), add the `duplicateToolCheck` import error in `src/i18n/messages/fr.ts` and `en.ts`; verify `schemas.test.ts` cases: valid list, missing field, duplicate id, "<script>" id, 201 items, non-UTC date
- [x] 1.2 Add the pure helper `withToolCheck(checks, toolId, checked, at)` in `src/domain/` (adds or replaces with the new date, removes, returns `undefined` when empty, leaves other ids untouched); verify its unit tests
- [x] 1.3 Add `setToolCheck(entityId, toolId, checked)` to `src/store/graph-store.ts`: one `now` for `checkedAt` and `updatedAt`, entity marked dirty, no `grouping.group` call; verify `graph-store.test.ts` (check, uncheck, `updatedAt` equals `checkedAt`, unknown entity ignored) and `history.test.ts` (undo restores the previous check and date, two checks within one second are two undo steps)
- [x] 1.4 Verify in `export-format.test.ts` that an entity with `toolChecks` survives export and import as a copy unchanged, that an entity without checks is exported without the field, that an unknown `toolId` is kept, and that a file with a duplicate check is refused with an error naming the field; verify a `persistence.test.ts` (fake-indexeddb) case where checks are saved and read back

## 2. Tool catalog – `feat(pivots): add a built-in catalog of OSINT tools`

- [x] 2.1 Add `src/domain/pivot-tools.ts` with the `ToolCategory` order, the 45 tools of design.md, `toolsForType(type)` (type-specific link over `any`, catalog order, grouped by category), `pivotValue(type, label)` and `resolveToolLink(link, value)`; verify unit tests: " Jean Dupont & Cie " on Google gives `https://www.google.com/search?q=%22Jean%20Dupont%20%26%20Cie%22`, "exemple.fr" on crt.sh gives `https://crt.sh/?q=exemple.fr`, a label with `/`, `?` and `#` stays inside the parameter or path segment, blank label gives `null` for a query link and the URL for a plain link, phone "+33 6 12 34 56 78" on Dehashed gives `https://dehashed.com/search?query=%2B33612345678`, phone "(06) 12.34-56/78" gives `0612345678`, phone " - . - " gives `null`, and a non-phone label keeps its inner spaces, dots and hyphens
- [x] 2.2 Add catalog invariant tests: ids unique and matching the check id regex, names unique, every link `https`, at most one `{value}` per link, every resolved link parses with `new URL`, every entity type has at least one tool, "domain" lists crt.sh and Shodan but not sherlock, "vehicle" lists only the `any` tools
- [x] 2.3 Open every query link by hand in a browser with a realistic sample value per type, and every plain link; replace a query that does not land on results with a plain link to the site, remove any link that submits a scan or an archive request, and record the check date in a comment at the top of the catalog; verify the tests of 2.1 and 2.2 still pass

## 3. Tools section – `feat(pivots): list tools and their checks in the entity panel`

- [x] 3.1 Add the `pivots` block to `src/i18n/messages/fr.ts` and `en.ts` (section title, count, category names, `markUsed(name)`, `checkedOn(date)`, `needsLabel`); verify `bun run typecheck` and `messages.test.ts`
- [x] 3.2 Add `src/features/pivots/tools-section.tsx` (`ToolsPanel`, the content of an "Outils" tab: category headings, one-line rows, checkbox calling `setToolCheck`, link with `target="_blank"`, `rel="noopener noreferrer"`, host and `ExternalLink` icon, href passed through `safeUrl`, disabled query entry with `needsLabel` for a blank label, 44 px targets below `md`) and wrap `entity-panel.tsx` in "Détails" / "Outils" tabs (shadcn `tabs`, count from `toolCounts` in the tab label, `detailsTab` key in both dictionaries); verify a component test: starts on "Détails" with "0 / N" on the tab, expanded list for a domain, link attributes and href, blank label disables WhatsMyName but not sherlock, checking shows the date and updates the count, clicking a link does not check, type change hides then shows a check again, unknown checks not counted, English category headings, arrow-key tab switch and Space on "Marquer crt.sh comme utilisé"
- [x] 3.3 Add `tests/e2e/pivot-tools.spec.ts`: check crt.sh on a domain entity, reload and find it checked with the same date, export and read `toolChecks` in the downloaded file, undo the check from the toolbar, and on `devices['Pixel 7']` open the drawer, open the "Outils" tab and measure the tab, link and checkbox at 44 × 44 px or more, and at 360 px check that every checkbox is on its link's line (in `mobile.spec.ts`, the only file the `mobile` project runs); verify `bun run test:e2e`
- [x] 3.4 Check the "Boîte à outils de pivots" box in `ROADMAP.md` (v0.3) and verify the full check suite, `bun run test:e2e` included, is green

## Workflow follow-up

- Archive the change (`openspec archive add-pivot-toolbox`) after the user has committed the three groups.
- The "Fusion de deux entités" change must union `toolChecks`, keeping the earliest `checkedAt` per tool.
