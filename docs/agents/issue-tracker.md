# Issue Tracker — GitHub Issues

This repo tracks work in **GitHub Issues** for `pxlcrtiv/anahata`.

## How agents use it
- List issues: `gh issue list --repo pxlcrtiv/anahata`
- Read an issue: `gh issue view <number>`
- Create an issue: `gh issue create --title "..." --body "..." --label ready-for-agent`
- Create a PR: `gh pr create --base main --title "..." --body "..."`

## Notes
- PRs are the primary request/review surface for completed work.
- The "PRs as a request surface" flag is **off** (default).
- Default base branch for PRs is `main`.
