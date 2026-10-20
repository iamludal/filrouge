# Tasks

Each numbered group is one Conventional Commit. Every group ends green on
`bun run lint && bun run format:check && bun run typecheck && bun run test`
(plus `bun run test:e2e` when it changes the UI). Agents do not commit: they leave the group in
the working tree and propose its commit message.

## 1. Censys link – `fix(pivots): point Censys to its current host pages`

- [x] 1.1 Change Censys's `ip` link in `src/domain/pivot-tools.ts` to `https://platform.censys.io/hosts/{value}`, id unchanged; verify a unit test in `src/domain/pivot-tools.test.ts` that "8.8.8.8" resolves to `https://platform.censys.io/hosts/8.8.8.8`

## 2. Extended catalog – `feat(pivots): add investigative, web, map and vehicle tools`

- [x] 2.1 Add the `investigations` and `vehicles` categories to `TOOL_CATEGORIES` in the order of design.md, and their names to `pivots.categories` in `src/i18n/messages/fr.ts` ("Bases d'enquête", "Véhicules") and `en.ts` ("Investigative databases", "Vehicles"); verify `bun run typecheck` and `messages.test.ts`
- [x] 2.2 Add the 11 tools of design.md to `PIVOT_TOOLS` with their exact links, and update the comment at the top of the catalog with the 2026-10-21 check date; verify the existing catalog invariant tests still pass
- [x] 2.3 Update `src/domain/pivot-tools.test.ts`: the "types without specific tools" test keeps only "event"; new cases: "domain" lists `analyzeid` and `builtwith`, "person" lists `aleph` and `opensanctions` under `investigations`, "vehicle" lists `vindecoder-net` and `vindecoder-pl` under `vehicles` after the `search` tools, "Gazprom" on OpenSanctions gives `https://www.opensanctions.org/search/?q=Gazprom`, "lemonde" on dotDB gives `https://dotdb.com/search?keyword=lemonde&position=any`, "1HGCM82633A004352" on vindecoder.pl gives `https://vindecoder.pl/report/1HGCM82633A004352`; verify `bun run test`
- [x] 2.4 Add the line « Catalogue de pivots étendu » to v0.3 in `ROADMAP.md` (Aleph, OpenSanctions, Analyzeid, BuiltWith, dotDB, Yandex Maps, imagerie historique, décodeurs VIN, lien Censys corrigé, OpenSpec `extend-pivot-catalog`), checked, and verify the full check suite, `bun run test:e2e` included, is green

## Workflow follow-up

- Archive the change (`openspec archive extend-pivot-catalog`) after the user has committed both groups.
