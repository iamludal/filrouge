# Tasks

## 1. Baseline specs

- [x] 1.1 Review the eight delta specs against the running app and fix any statement that does not match observed behavior; verify with `openspec validate document-v0-1-baseline --strict`
- [x] 1.2 Confirm existing checks still pass with no code change: `bun run lint && bun run format:check && bun run typecheck && bun run test`

## Workflow follow-up

- Archive the change (`openspec archive document-v0-1-baseline`) so the specs land in `openspec/specs/`.
- Verify with `openspec list --specs` that the eight capabilities are listed.
- Commit as `docs(openspec): add baseline specs for v0.1`.
