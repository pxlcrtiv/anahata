# AGENTS.md

Guidance for AI coding agents (OpenCode, Claude Code, etc.) working in this repo.

## Agent skills

### Issue tracker

Issues live in **GitHub Issues** for this repo (`pxlcrtiv/anahata`). Use the `gh` CLI to create/list/read issues. PRs are created via `gh pr create`. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical five roles, label string == name: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Apply `ready-for-agent` to tickets that an agent can pick up directly. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: `CONTEXT.md` at repo root is the domain glossary; ADRs live in `docs/adr/`. See `docs/agents/domain.md`.

## Engineering flow (Matt Pocock skills)

For feature work in this repo, use the engineering skills: `/to-spec` → `/to-tickets` → `/implement`, with one `git worktree` + branch + PR per ticket (see the `worktree-pr-workflow` skill). Each ticket is a vertical tracer-bullet slice, built test-first, committed atomically, and verified green (`npx tsc --noEmit`, `npx vitest run`, `npm run build`) before review.

**Push rule:** never `git push` or open a PR without explicit user go-ahead.
