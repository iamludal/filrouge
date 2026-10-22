# Contributing to Filrouge

Thanks for your interest! Bug reports, ideas and pull requests are welcome. This guide explains
how the project works so your contribution lands smoothly. By participating, you agree to follow
the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Principles

Filrouge handles sensitive investigation data, so a few rules are non-negotiable (details in
[ROADMAP.md §1](./ROADMAP.md#1-non-negotiable-principles)):

- **Local-first**: no backend. All data lives in the browser (IndexedDB).
- **Zero leak**: no telemetry, no analytics, no third-party script, no CDN at runtime. Any outgoing
  network request must be opt-in and flagged in the UI.
- **Hostile data**: everything typed or imported is considered malicious: Zod validation,
  sanitized rendering, `dangerouslySetInnerHTML` forbidden.
- **Traceability**: every entity and relation can be linked to its sources.
- **Versioned model**: a model change bumps `SCHEMA_VERSION` and comes with a tested migration.
- **Keyboard and accessibility**: every main action works with the keyboard.

## Getting started

Prerequisites: [Bun](https://bun.sh) ≥ 1.2 (version pinned in `packageManager`) and Node.js ≥ 22
(Vite, Vitest and Playwright run under Node through `bun run`).

```bash
git clone https://github.com/iamludal/filrouge.git
cd filrouge
bun install
bun run dev       # http://localhost:5173
```

To try the app with data, import a demo investigation from [`examples/`](./examples) on the home
screen.

## Scripts

| Command               | Purpose                                                          |
| --------------------- | ---------------------------------------------------------------- |
| `bun run dev`         | development server                                               |
| `bun run build`       | production build in `dist/` (CSP injected)                       |
| `bun run preview`     | serve the production build                                       |
| `bun run lint`        | ESLint                                                           |
| `bun run format`      | Prettier (write); `bun run format:check` to check only           |
| `bun run typecheck`   | strict TypeScript check                                          |
| `bun run test`        | unit tests (Vitest; not `bun test`, which runs Bun's own runner) |
| `bun run test:e2e`    | end-to-end tests (Playwright, against the production build)      |
| `bun run screenshots` | regenerate the README screenshots in `docs/images/` (Playwright) |

The first Playwright run needs a browser: `bunx playwright install chromium`.

Before pushing, run the full suite:

```bash
bun run lint && bun run format:check && bun run typecheck && bun run test && bun run test:e2e
```

## Project layout

```
src/
  domain/        Zod schemas (source of truth for types), entity types, export format. Pure, no DOM.
  db/            Dexie database and repositories. Only repositories touch Dexie.
  store/         Zustand stores; the open investigation is saved by a debounced autosave.
  features/      components and hooks, one folder per feature (graph, entities, sources, pivots…)
  components/ui/ shadcn/ui components (bunx shadcn@latest add <name>)
  i18n/          French and English dictionaries (useI18n())
  lib/           pure utilities (Markdown rendering, hashing…)
tests/
  e2e/           Playwright end-to-end tests
  screenshots/   README screenshot script
examples/        demo investigations (JSON exports)
openspec/        specifications and change proposals
```

## Workflow

1. **Pick or discuss a task.** [ROADMAP.md](./ROADMAP.md) lists the milestones, handled in order.
   For a new feature, open an issue first to discuss its scope.
2. **Specify.** Behavior is described with [OpenSpec](https://github.com/Fission-AI/OpenSpec):
   current specs live in `openspec/specs/`, proposals in `openspec/changes/<name>/` (proposal,
   delta specs, design, tasks). Non-trivial changes start with a proposal.
3. **Implement**, one task per commit, and check the box in the change's `tasks.md` and in
   `ROADMAP.md` when done.
4. **Open a pull request** with a short description of what changes and why.

### Trying a pull request build

The CI attaches the static build of every pull request as a `filrouge-pr-<number>` artifact, kept
14 days: download it from the "Summary" page of the CI run (or with
`gh run download --name filrouge-pr-<number>`), unzip it, and serve the folder at the root of a
local server, for example `python3 -m http.server 8080` from inside it, then open
`http://localhost:8080`. Opening `index.html` directly from the disk does not work (module scripts
and workers need HTTP).

The local server is another origin than the production site, so the build starts with an empty
storage and never touches your real investigations: import a demo from `examples/` to try it.

### Definition of Done

- Strict TypeScript, no unjustified `any`.
- Unit tests for business logic (domain, repositories, lib); e2e tests for UI flows.
- Lint, format, typecheck and tests pass.
- No new network request at runtime (except a documented opt-in).
- Any displayed user or imported data is sanitized.
- UI works in light and dark themes, and on narrow screens (every graph toolbar action is also in
  the compact toolbar's "More actions" menu).
- Every user-facing string goes through `src/i18n/`, in both `fr` and `en` (typecheck fails if a
  key is missing). Investigation content is never translated.
- If the change alters what the README shows, rerun `bun run screenshots`.

### Commits

[Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`,
`chore:`…), one commit per task. Code, comments, commits and docs are written in English. Use the
en dash "–", never the em dash.

## Adding a dependency

Justify it in the pull request and check that it makes **no network call at runtime** (fonts,
icons, analytics, CDN…). Prefer small, well-maintained packages.

## Deploying

The production build is fully static: `bun run build` outputs `dist/`, which any static host can
serve. The `.github/workflows/deploy.yml` workflow publishes it to GitHub Pages on every push to
`main`.

**Serve it from a dedicated domain or subdomain.** IndexedDB is isolated per origin: served from
`<user>.github.io/filrouge`, the app would share its origin, hence its data, with every other
Pages site of that account. If you must serve it from a subpath anyway, build with
`FILROUGE_BASE=/filrouge/ bun run build`.

## Security

Found a vulnerability? Please follow [SECURITY.md](./SECURITY.md) instead of opening a public
issue.
