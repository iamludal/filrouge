# Proposal

## Why

filrouge reached v0.1 (ROADMAP.md, milestones v0.0 and v0.1) before OpenSpec was adopted, so
`openspec/specs/` is empty. Future changes (v0.2+) need a baseline to write deltas against;
this change records the behavior that already ships, without touching the code.

## What Changes

- Document the existing, tested behavior of the v0.1 MVP as main specs.
- No code, dependency or data-model change. No behavior is added, modified or removed.
- Where code and ROADMAP.md disagree, the specs follow the code (what ships today); gaps are
  listed in design.md, not specified.

## Capabilities

### New Capabilities

- `app-shell`: application frame, hash-based navigation, light/dark/system theme.
- `investigations`: listing, creating, renaming and deleting investigations on the home screen.
- `graph-canvas`: the investigation graph view: adding, moving, selecting and deleting elements.
- `entities`: entity types and editing an entity (type, label, properties, tags, Markdown notes).
- `relations`: creating relations between entities and editing their label and direction.
- `local-persistence`: browser-only storage, automatic saving, save status and write-time validation.
- `investigation-import-export`: versioned JSON export file and validated import.
- `content-security`: no outgoing network requests, Content-Security-Policy, safe rendering of
  untrusted text.

### Modified Capabilities

None (no existing specs).

## Impact

- Adds `openspec/specs/<capability>/spec.md` for the eight capabilities above once archived.
- No impact on `src/`, tests, build or deployment.
