# Issue Tracker — GitHub Issues

This repo tracks work in **GitHub Issues** for `pxlcrtiv/anahata`.

## How agents use it
- List issues: `gh issue list --repo pxlcrtiv/anahata`
- Read an issue: `gh issue view <number>`
- Create an issue: `gh issue create --title "..." --body "..." --label ready-for-agent`
- Close an issue: `gh issue close <number> --comment "..."`

## Notes
- PRs are **not** a request surface (the "PRs as a request surface" flag is **off** / default) — GitHub Issues are the request surface for this repo.
- Default base branch for PRs is `main`.
