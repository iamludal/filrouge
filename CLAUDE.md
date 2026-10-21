# CLAUDE.md

Guide for development agents working on Filrouge.

- Product reference and task order: `ROADMAP.md` (one task at a time, check the box once the DoD is met).
- Package manager: Bun (version pinned in `packageManager`). The tools (Vite, Vitest,
  Playwright) run under Node through `bun run`. Beware: `bun test` runs Bun's own runner, not Vitest.
- Mandatory checks: `bun run lint && bun run format:check && bun run typecheck && bun run test`
  (+ `bun run test:e2e` for UI flows).
- Commits: Conventional Commits, one commit per roadmap task.
- Agents are not allowed to commit, the user does: commits are SSH-signed (`~/.ssh/github`, passphrase-protected)
  and, without a terminal to type it, `git commit` hangs. The agent leaves the changes in the working
  tree (checks green), checks the tasks, then proposes the Conventional Commits message of the
  finished group. The user commits. The agent carries on without waiting for the commit.

## Architecture

- `src/domain/`: Zod schemas (source of truth for types), entity types, migrations. Pure, no DOM.
- `src/db/`: Dexie + repositories. Only repositories touch Dexie.
- `src/store/`: Zustand stores. The open investigation is loaded in memory; changes are
  persisted by a debounced save (`src/store/persistence.ts`).
- `src/features/<feature>/`: components and hooks per feature.
- `src/components/ui/`: generated shadcn/ui components (`bunx shadcn@latest add <name>`).
- `src/lib/`: pure utilities.

## Rules

- Never `dangerouslySetInnerHTML` (ESLint rule); Markdown through `src/lib/markdown.tsx` only.
- Every text shown to the user goes through `src/i18n/` (`fr` and `en` dictionaries, `useI18n()`), never hard-coded in a component; add the key in both languages (typecheck fails otherwise). The domain returns identifiers or codes, the interface translates them. Investigation content is never translated.
- No network request at runtime; the CSP (in `vite.config.ts`) must stay strict.
- Never log investigation content (`no-console` enabled, except warn/error).
- All imported data goes through a Zod schema before reaching the store.
- Every new action of the graph toolbar must also appear in the "More actions" menu of the compact toolbar (`compact-graph-toolbar.tsx`, narrow screens).
- Never use the em dash "—" (too long): use the en dash "–" instead (code, docs, texts, commit messages).
- Model change: bump `SCHEMA_VERSION` and add a tested migration.
- Repository docs (README, ROADMAP, CONTRIBUTING, SECURITY, this file) are written in English.
