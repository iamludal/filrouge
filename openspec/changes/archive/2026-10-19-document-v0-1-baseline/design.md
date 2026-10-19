# Design

## Context

See proposal.md for motivation. The behavior described in the specs was read from `src/` and the
existing unit and e2e tests (`tests/e2e/mvp.spec.ts`, `tests/e2e/smoke.spec.ts`) at commit
`f095af6`. No code changes.

## Goals / Non-Goals

**Goals:**
- One spec per durable capability, so v0.2+ changes (sources, confidence, undo, search…) extend an
  existing capability or add a new one.
- Every scenario is checkable, and most are already covered by tests.

**Non-Goals:**
- Specifying the roadmap's future milestones.
- Fixing gaps between ROADMAP.md and the code (listed below as follow-ups).

## Decisions

- **Specs follow the code, not the roadmap.** The baseline must describe what ships, otherwise the
  first real delta would modify requirements that were never true.
- **Capability split by user-facing concern** (8 capabilities) rather than by source folder:
  `local-persistence` and `investigation-import-export` cut across `db/`, `store/` and `features/`.
  Alternative considered: one `mvp` spec, rejected because it would become a catch-all.
- **Data-model fields without UI are not specified as features.** Sources, confidence, status and
  attachments exist in the schema but cannot be edited yet; they appear only where observable
  (export content, import validation).
- **Specs in English, UI strings quoted in French** as they appear on screen, consistent with the
  code and commit language.

## Risks / Trade-offs

- [Specs drift from code] → each future change goes through a delta; scenarios map to tests.
- [UI strings quoted verbatim make specs brittle to copy changes] → acceptable, these strings are
  what e2e tests assert on.

## Gaps found (follow-up candidates, not specified)

- ROADMAP promises DOMPurify; Markdown is made safe by skipping raw HTML instead. Equivalent today,
  to revisit if an HTML rendering path is ever added.
- Attachments are not included in exports (roadmap v0.2 sources/attachments will need it).
- No migration mechanism yet beyond `schemaVersion` 1 rejection of newer files.
- Keyboard-only creation of relations is not possible yet (roadmap principle 6).
