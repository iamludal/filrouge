---
name: git-commit
description: Commit exactly what is staged, using a Conventional Commit message. Never stages, unstages, amends or pushes.
argument-hint: "[optional: a ticket reference or other context to include]"
disable-model-invocation: true
---

## Goal

Turn the files the user has staged into one commit. Running `/git-commit` is the user's explicit
request to commit in this turn, so commit straight away, without asking for confirmation.

## Why the index is off-limits

The user stages files as they review them: staged means "I have read this". The commit must contain
exactly that set – nothing they have not reviewed, and nothing they had reviewed dropped. So this
skill only ever reads the index, and the commit command is chosen so it cannot write to it either:

- No `git add`, `git reset`, `git restore --staged`, `git stash`, `git rm`, `git mv`.
- No `git commit -a`, and no paths after `git commit`: `git commit <path>` silently commits that
  path's working-tree content, staged or not.
- No `--amend`, no `--no-verify`, no `git push`.

Unstaged and untracked changes stay exactly where they are, partially staged files included.

## Steps

1. **Nothing staged** (the staged list below is empty): say so in one line and stop. Do not fall back
   to the working tree.
2. **Generate the message** from the staged diff and the rules below:
   - Follow the repository's established commit format. For Conventional Commits, use
     `type(scope): subject`, followed by a blank line and a short body. Include a scope when it is
     part of the repository's convention. Do not add a trailing period to the subject.
   - Use a type permitted by the repository's commit policy and prefer vocabulary from recent
     history. If none is established, choose the type matching the dominant change: `feat` for
     new behavior, `fix` for correcting behavior, `refactor` for internal restructuring, `perf`
     for measurable performance improvements, `docs` for documentation, `test` for test-only
     changes, `chore` for maintenance, `style` for formatting, `build` or `ci` for build or
     pipeline changes, and `revert` for undoing a commit.
   - When scopes are used, prefer a scope established in recent history. Otherwise choose a concise
     domain, workspace, category, or changed top-level directory that best describes the change.
   - Keep the subject concise and factual: describe what changed, not the mechanism. Use 1 to 4
     short body lines to explain what changed and why it matters, without repeating the diff or
     adding filler.
   - Follow any commit-message length limits configured by the repository. If none are defined,
     keep the subject around 72 characters and body lines under 100. Wrap prose sensibly; keep
     URLs on one line and prefer a concise identifier when it refers to the same item.
   - Include a reference to any known ticket, issue, PR, or other tracked work item when its
     identifier or URL appears in the arguments, branch, staged diff, or conversation. Add it as
     a concise body line or footer; do not search for or guess references. Include a relevant
     specification or change request by its known identifier when one clearly covers this work.
     Omit unknown references and do not add a `Co-Authored-By` trailer.
   - If the staged diff bundles unrelated concerns, warn about splitting before committing, but
     still create one message for the dominant change and repeat the warning in the final report.
3. **Commit**: write the message to a file in the scratchpad directory and run
   `git commit -F <file>`, from the repo root, with nothing else on the command line. A file rather
   than `-m` keeps the blank line between title and body and avoids shell-quoting the body.
4. **Hook rejection**: if a repository commit-message hook rejects the message, read its error,
   correct the message to satisfy the reported rule, rewrite the file and retry once. On a second
   failure, stop and print the hook error and last message so the user can commit by hand. Any other
   failure: stop and report it, never retry around it.
5. **Report**: run `git log -1 --format='%h %s'` and `git status --short`, then print:
   - the short hash and the full message,
   - the committed files (the staged list below),
   - one line saying what is left uncommitted, or that the tree is clean.

## Context

Argument passed to this skill: `$ARGUMENTS`

Current branch: !`git branch --show-current`

Recent commit style for established type, scope, and format conventions:

!`git log --oneline -30`

Staged files (exactly what the commit will contain):

!`git diff --cached --name-status`

Staged diff (the only changes to include in the message):

!`git diff --cached`
