# notes, per repo

part of `playbook`. where plans, the log and open items live, and their shapes.

## where

the brain if installed (`~/vault/projects/<repo>/`, see `brain`), else the repo's gitignored `.claude/`. same shapes in both; only the names differ.

| what | with the brain | without |
|---|---|---|
| hub: what it is, where it lives, links to everything | `<repo>.md` | the repo's `.claude/CLAUDE.md` |
| log, newest first | `<repo>-log.md` | `.claude/log.md` |
| open items | `<repo>-tbd.md` | `.claude/tbd.md` |
| plans | `plans/<date>-<topic>-plan.md` | `.claude/plans/<date>-<topic>-plan.md` |
| research | `research/` | `.claude/research/` |
| taste | `taste/taste.md` | `.claude/taste.md` |
| sql or commands the user runs by hand | the repo's `.claude/sql/` | `.claude/sql/` |

without the brain, check the notes files are ignored before writing the first one: `git check-ignore -q .claude/tbd.md && echo ignored`. not ignored: run `/initiate`, which adds the exact paths to `.git/info/exclude` (never all of `.claude/`, teams commit settings there). none of it is ever committed, or copied into a commit, a PR or a release.

## the log

newest first. one entry per session, written as the work happens, not at the end:

```
## 2026-01-15, feat/export-csv
- changed: csv export on the reports page, streaming, 3 new tests
- checked: `npm test` 41/41, exported a 10k row report by hand, opened it in a spreadsheet app
- open: exports over 50k rows untested, the empty state copy is a placeholder
```

date, branch, what changed, what was checked and how, what is open. short lines, facts only. commit shas when there are any.

## the tbd

open items as checkboxes, grouped by who moves next:

```
## cooking
task: <the task, in the user's words>
plan: <path to the plan>
branch: feat/export-csv
next: <the one next step>

## the user, now
- [ ] set `EXPORT_BUCKET` in the production env

## waiting on someone else
- [ ] design review of the empty state (<who>)

## to build, on the next cook
- [ ] exports over 50k rows

## ideas
- [ ] scheduled exports
```

- the `## cooking` entry sits at the top while a task is live. a compact, a clear or a crash resumes from it without the user retyping the task. close it when the work ends.
- each item links the plan section it came from.
- sql the user must run goes in `.claude/sql/`, one dated file per change, first line says read or write, safe to run twice, ends with a query that shows the result. the tbd points to it.

## plans

`<date>-<topic>-plan.md`. the first line links the hub, log and tbd. the shape:

- what to build, what not to build, why, the end result.
- a done line that is checkable: a command, a count, a screenshot, never "works well".
- an **edge case register**: id, case, what stops it, phase, how it is proven, status.
- decisions only the user can make, in their own table with your pick named.
- phases, each with its own measured done line.

the plan file in Claude Code's plan mode, if one is used, is a pointer to this file, never the plan itself.

## rules

- unique, dated names. `plan.md` alone is never a name, and with the brain a bare `[[log]]` resolves to whichever log Obsidian finds first.
- personal data about other people (a scraped list, a data export) stays out of all of it.
- a session that ends without a log entry has lost its trace.
- default branch name is `main`, never `master`.
