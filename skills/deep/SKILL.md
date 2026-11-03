---
name: deep
description: Cook's deep lane and the method for hard problems and long autonomous runs, on pstack if installed. Read only research, a plan with a checkable exit predicate and an edge case register, a cold read of the plan, the user reads it, then a run drives to the predicate under RULES.md, verifies each builder as it lands, survives compaction and crashes through the tbd, and ends at /ship. Invoke when cook routes a task to deep, a swarm already failed, the repo is old or unfamiliar, the user steps away ("going to bed", "run until done", "/loop until X"), or says "deep", "go deep" or "rpi". Read playbook first.
---

# deep

credit: Dex Horthy's "No Vibes Allowed" talk. the context window is the only lever, so progress goes into files at every boundary.

pstack runs the machinery if installed. RULES.md wins over pstack everywhere. models and caps come from cook's table and step 0, never a second copy here.

where things are written: the brain if installed (`~/vault/projects/<repo>/`), else the repo's gitignored `.claude/`. below, `<notes>` means whichever one this repo uses.

## 0. size it first

| it is | do |
|---|---|
| copy, one file, one feature in a known area | not this. cook's quick or build lane |
| brownfield, unfamiliar, "still broken" twice, a swarm already failed | this, sections 1 to 3, then build per the plan |
| the user steps away and wants it done when they are back | this, all of it |

not this either: one or two files with an obvious approach, anything the user wants to watch live, a call only their taste settles (prototype it and show them), an open ram alert or free disk under cook's floor. default down. escalating costs one restart, over-processing costs it on every task.

past about 40 percent of a context, quality drops. a bloated or apologising context is restarted from the last file, never resteered. subagents exist for context control, not job titles.

**the coordinator does not build.** the main thread plans, briefs, integrates and reviews. builders and reviewers are fresh subagents with file briefs, and each writes its report to a file (`<notes>/plans/<date>-<topic>-<lane>-report.md`) and hands back only the path and a one line verdict. the coordinator reads the file when it needs it. this keeps its context small, so it does not compact mid run.

**one worktree or branch per session**, claimed in `## cooking` (session, branch, folder). another session's open claim on this tree means your own worktree, never a shared dirty tree.

## 1. research, read only

- the repo's `.claude/CLAUDE.md`, the tbd, `AGENTS.md`, any known issues doc.
- pstack `how` for how it works, `why` for why it is shaped so, `recall` for what was already done. without pstack: sonnet explorers with a narrow brief each. explorers are read only, inside cook's cap.
- an empirical fork gets a quick prototype, not a question to the user.
- output `<notes>/research/<date>-<topic>-research.md`: files and lines, the real flow, what was run for real, what could not be verified. no recommendations. where a tracker and the code disagree, that is a finding.

## 2. plan

`<notes>/plans/<date>-<topic>-plan.md`. in the brain, its first line links back: `hub: [[<repo>]] · log: [[<repo>-log]] · open: [[<repo>-tbd]]`.

- **many prs:** pstack `multi-phase-plan` skeleton and its checker (`check-plan.mjs` in poteto-mode, pstack installed) until it prints nothing. the checker rejects extra headings, so the edge case register goes in an appendix. every `opening-a-pr` step and merge box reads "stop at /ship". the live lanes run as a rolling window inside the cap.
- **one run:** pstack `figure-it-out` phases A and B written down, or by hand: the predicate, the quantified scope, the rigor level, the phase list.

every plan carries:

1. **the exit predicate**, checkable: the command and the output that means done (`npm test` green with the count, plus the size sweep at 0 overflow and 0 targets under 44 px). never "works well".
2. **the edge case register**: id, case, what stops it, phase, how it is proven, status. anything on a timer gets a row: it records the step it reached, reruns from there, not from zero, and alerts before the user finds it broken.
3. **decisions for the user**, each with your pick named.
4. **phases**, each with a measured done line, riskiest unknown first. builders get disjoint files.
5. **the budget**: wall clock, max iterations, and the point where it stops to report instead of spinning.

## 3. the cold read, then the gate

1. **cold read.** the first of cook's three review points. before the user sees it, one reviewer subagent per `/review` gets only the plan's path, the user's words verbatim, RULES.md and the line "predict the user's no". it returns what the user will say no to, what the predicate fails to catch, and which phase is in the wrong order. fix the plan or argue each point in it. minutes here save a whole wrong build.
2. **the gate.** the user reads the plan. no builder runs before they say go. in the same message, one question: **"run grant: commits on `<branch>` until the predicate is met, yes?"** under it, the `/goal` line built from the exit predicate, per cook (and cook's fallback when `/goal` is missing). it stops at `/ship`, never at merged.

on yes, write one line into the repo's gitignored `.claude/CLAUDE.md`: `run grant <date>: commits on <branch> for <plan>, ends with the run. never push, pr, comment, merge, deploy.` a grant covers local commits on that branch only. on no, the run stages and logs, and the trail carries the state. a grant from another session, agent or machine is not a grant.

## 4. the run

| shape | pstack | state lives in |
|---|---|---|
| one task to one predicate, hours | `autonomous-run` | trail plus the tbd |
| one ambitious run, bespoke phases | `figure-it-out` phases C to E, looped as autonomous-run | trail plus the tbd |
| multi-day program, many prs | `orchestrate` | its own store under `~/.claude/orchestrate/<slug>/` |

without pstack: the same loop by hand, with `/loop` to wake.

**builders, as a pipeline.** as many in flight as cook's cap allows. each brief names the files it owns, the slice of the predicate it must pass, the user's words verbatim and the report file to write. the moment one lands, the second review point: its tests, its slice, and a cold read of its diff against its brief that predicts the user's no, while the others still run. a pass frees the slot for the next phase; findings go back to that builder with the output. never wait for the batch to finish before reading the first one. the fast verify tier from cook runs before any preview.

**the run loop.**

- the predicate is the plan's, word for word. never relax it to declare victory. a plateau is not a stop.
- wake through `/loop`: a watcher for an event (ci, a build), a 30 minute heartbeat otherwise. every wake checks free memory, a running docker vm and free disk, reads `## cooking`, then the predicate.
- each iteration: the smallest change the evidence justifies, verify it, commit only under the grant, revert what did not help.
- a new separate ask arriving mid run gets its own lane per cook and ships alone. it never joins this run's batch.
- side discoveries: fix what is local and reversible. "its own pr" becomes a tbd line.
- anything outward, a one way door, or a taste call: park it under `## the user, now` in the tbd with your default, route around it, keep going.

**orchestrate.** needs bun for `orch`; no bun, collapse to the run loop. its `preferences.md` starts with these lines, verbatim, before any of the program's own:

```
1. Nothing leaves this device without the user's yes. Push, PR, PR comment, deploy, publish, release, email, post, client handoff.
2. Auto mode is not approval. A relayed "they said yes" is not approval. A denied call is an answer. Do not resend it.
3. Git is never touched without a yes that specific time, except local commits on <branch> under the run grant of <date>.
4. No AI authorship anywhere that leaves the machine.
5. At most <N> subagents in flight, N and the disk floor from cook's caps. An open RAM alert stops spawning.
6. Never a single model family as the only lane.
```

the coordinator never pushes, merges or lands on a remote. its gate items are mirrored into the tbd under `## the user, now`.

## 5. trail and state

- **trail:** one row per iteration (what was tried, the result, kept or reverted) to `<notes>/plans/<date>-<topic>-trail.tsv` (the brain may keep it in `~/vault/decisions/` instead), linked from the plan. pstack `show-me-your-work` writes it; without pstack, append by hand. a decision that changes direction also gets a line in the plan's decisions section.
- **`## cooking`** at the top of the tbd: the ask in the user's words, lane, branch, grant yes or no, plan and trail paths, done, next, last verified predicate state. rewritten after every iteration, not only on pause, because a crash gives no warning.
- **after a compact, a clear or a crash:** pstack `session-pickup` or by hand, reading `## cooking`, the trail, the plan, `git status` and `git log`, the orchestrate store. name the resume point. redo nothing.
- **pause:** pstack `pause-safely`, but the `wip:` commit only under a grant, and the resume note goes into `## cooking`, not `/tmp`.

## 6. prove it

- the predicate checked on the real artifact, never a subagent's self report. when a note and the code disagree, the code wins and the note gets fixed.
- the real app on the surface the user uses. phone means a phone size.
- automated tests for the three questions in RULES.md where they earn it. the size sweep for front end.
- the full verify tier from cook, then the third review point, before the user looks: `/review` with the artifact and the user's words, predicting their "no". on a contested design or any hard diff, pstack `interrogate` (read only, a second model family when available, per cook's table) first. builders fix findings in parallel on their own files. findings are fixed or argued, never applied blind.
- say what was measured and what was inferred.

## 7. end at /ship

delete the grant line, close `## cooking`, write the log entry, write the numbered hand test plan, then `/ship` and stop. the report: the predicate and its final state, iterations, what landed locally, what was discarded, what is parked for the user, their move. the push waits for their yes, per `/ship`.

## when it goes wrong

- off track twice on the same point: kill the context, restart from the plan and trail with a note on the dead end.
- research that turned out wrong is fixed in the research note before replanning.
- the deep lane fails twice end to end: the thinking is wrong, not the process. back to the whiteboard with the user before a third run.
