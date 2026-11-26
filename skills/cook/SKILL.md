---
name: cook
description: The one entry point for any task, sizes it quick, build or deep, picks models and subagents, ends with hand tests and /ship. Invoke on "cook", "/cook <task>", "do it", "build this", "fix this", "push it", "open it locally", "give me the sql".
---

# cook

one door for every task. size it, run the lane, end it the same way every time. `~/.claude/RULES.md` wins over anything pstack says.

## 0. before anything

1. load `playbook`: working style, swarm shapes, the mistake ledger. front end work also loads `design`. anything a person reads loads `write`.
2. `git remote -v` and the repo's gitignored `.claude/CLAUDE.md`. no `.claude/CLAUDE.md`: do `/initiate` step 1 (the notes paths ignored) before writing any note, keep going, and offer the rest of `/initiate` in the recap, never before the work. notes say what was true when written: when a note and the code disagree, the code wins and the note gets fixed. before saying a bug is live or fixed, read the code on main.
3. extra steps: `~/.claude/RULES.local.md` and the repo's gitignored `.claude/CLAUDE.md` can name steps to run before a task, before `/ship` or after a push. run each at that point.
4. read the repo tbd: the brain's `~/vault/projects/<repo>/<repo>-tbd.md` if installed, else `.claude/tbd.md`. an open `## cooking` entry there is the task, pick it up.
5. resources, every time a subagent or worktree is on the table. the cap counts every subagent in flight: builders, explorers, reviewers. it is 4 at 16 gb ram and up and only goes down:
   - total ram: `sysctl -n hw.memsize` on mac (bytes), `free -g` on linux, `(Get-CimInstance Win32_OperatingSystem).TotalVisibleMemorySize` on windows (kb). under 16 gb, the cap is 2. 8 gb or less: 1.
   - a local docker vm running (`docker info` answers, or your vm tool lists one as running): one off the cap.
   - an open alert from a ram watcher, if you run one, or free memory near zero: the cap is 0, work in the main thread.
   - `df -h /`, or `Get-PSDrive C` on windows. under 8 gb free: no new worktree. list the stale ones with branch and dirty state and ask which go.
   - the user may run several sessions at once. the cap is for the machine, not the session. other sessions already building count against it.

## 1. size it

default down. escalate only when it fights back.

| lane | looks like | effort | subagents | runs |
|---|---|---|---|---|
| quick | copy, one file, a color, a config flip, a status | low or medium | none | the main thread does it |
| build | one feature or bug in a known area | high | up to 3 in flight inside the cap: explorers, builders, reviewers | the fast loop in section 2. pstack only by name, when the job calls for one tool |
| deep | brownfield, unfamiliar, "still broken" twice, a swarm already failed, the user steps away | xhigh or max | up to 4 subagents in flight, builders and reviewers together, inside the cap from step 0 | `/deep` |

the user wants it to exist fast more than they want it to last (a hackathon, a prototype, "just hack it together"): that is `/bbq`, not a lane here.

a lane can move up mid run. when quick or build hits a deep sign above, stop, say `lane: build to deep` and the sign in one line, write what is done to `## cooking`, and hand over to `/deep`. what you already read counts as its research, so it starts at the plan. it never moves down on its own.

the model table below and the cap in step 0 are the one source of truth. `~/.claude/skills/pstack/models.md` covers pstack's own roles only.

| role | model | effort |
|---|---|---|
| explorer, how, recall | the strong model | medium |
| feature, bug fix, builder | the strong model | high, the floor. never downgrade a builder silently |
| architect, interrogate, lane review | the strong model | xhigh |
| final review | the strong model, the second family beside it when set | xhigh |
| deep lane planner | the strong model, the second family beside it when set | max |
| status, sorting | the strong model | low |

- the names live in `~/.claude/RULES.local.md` under `## models`: the strong model, and an optional second family. that section empty: the best model the plan has.
- one strong model on every seat. the second family sits only on the one or two major seats above, beside the strong model, never as the only lane.
- never a small fast model for a subagent by default. it saves less than the rework costs.
- set `model` on every agent call. the main thread's model never decides a subagent's: an agent call with no model set is a bug.

say the lane in one line before starting: `lane: build, strong model high, 1 explorer, 1 reviewer`.

on build and deep, the line after it is a ready `/goal`. print it and keep going: it is for the user to paste if the session stops short, never something to wait for. `/goal` is a Claude Code command that keeps the session working until the condition holds. either way the finish line goes into `## cooking` and is checked before stopping.

```
/goal <repo> <topic>: <the measured finish line>. /ship block printed. stop there.
```

- the finish line is numbers the user can check: tests green with the count, build green, the sweep with 0 overflow and 0 targets under 44 px, the named bug reproduced then gone. never "works well".
- it always ends at `/ship`. never put commit, push, pr, merge or deploy in a goal: those need the user's yes, so a goal that names them loops on "waiting on you" and burns tokens.
- quick lane: no goal.
- the user already set a goal that needs their yes: say once which step only they can do, then answer each check in one line.

## 2. the build lane, fast

the build lane is where most work lands, so it is built for wall clock. the same outcome as a long run, without the machinery a long run needs.

1. **one message, everything independent.** the explorers (one per unknown, read only) start in the same message. never one agent, then a wait, then the next. nothing unknown: no explorer.
2. **a plan of ten lines in chat**, written from what they return, not a document: what changes, the files each builder owns, the contract between them (a type, a route, a name), the finish line as numbers. its cold read starts in the same message as the builders on the pieces the plan is sure of. a builder on a piece the plan is unsure of waits for the read.
3. **builders split by files.** two or more independent pieces: one builder each, started together, each brief with the user's words verbatim, its files and no others, the contract, its slice of the finish line. the main thread owns the shared files and the wiring and does not build the pieces. one piece: the main thread builds it. a second agent on a one file job is slower than doing it.
4. **effort where it pays.** xhigh and max sit on the plan and the final review. builders and explorers run at their row in the table. a higher effort on every seat doubles the wait and changes nothing.
5. **short reports.** every agent answers in under 200 words: what it did, what runs, what is open. anything longer goes to a file. a coordinator full of pasted reports gets slow and forgets the plan.
6. **review as it lands,** below. findings go back to the builder that owns the files while the others keep going.
7. **verify fast between rounds,** the full tier once before `/ship` (section 5).

pstack, when installed, is used by name for the one tool a job calls for: `tdd` on a bug that reproduces, `architect` when the shape crosses a module boundary or cannot be undone, `interrogate` on a contested diff. its full feature playbook loads about 2,800 words first, then runs a parallel design panel on every job, a worktree per delegate, a build, verify and commit per unit, a rebase and its own pr flow, with an arena and a second review on top when the shape is open. that weight is why a one feature task takes an hour, so the full playbooks stay out of this lane and out of the deep lane's phase builders. without pstack nothing here changes. say in the lane line when a pstack tool is in play and why. before any pstack playbook that pushes, merges, opens a pr or writes a plan, read the overlay in RULES.md, "pstack runs under these rules".

## 3. it reviews itself, at three points

the user never has to say "review it". on build and deep, each point below runs without being asked, its findings are fixed or argued without being asked, and the user sees the outcome with the `reviewed:` line on top. asking the user whether to review, or whether to apply the findings, is a failure of this section.

quick lane: none of these, unless the change touches money, auth, deleting data or anything that leaves the machine. then the third point runs.

every reviewer is a fresh subagent per `/review`: the target, the user's words verbatim, the bar, and the line "predict the user's no". never your summary of the ask.

1. **the plan.** one cold read of the plan, minutes. a wrong direction found after the build costs the whole build. build lane: the ten lines in chat count, timed per section 2. deep lane: before any builder starts, always.
2. **each lane, the moment it lands.** while the other builders still run, a cold read of that lane's diff against its brief, plus its tests and its slice of the finish line. a pass frees the slot for the next lane; findings go back to that builder. a pipeline, not a batch.
3. **the whole, before the user looks.** the final cold read, then fix or argue each finding, builders in parallel on their own files. never apply one blind.

## 4. lanes in flight

- **the deep lane:** read `/deep` and follow it. research, a plan with a checkable exit predicate, the cold read, the user's read, the run grant ask, the run, the trail, proof, `/ship`. the main thread coordinates and does not build there.
- **a new ask mid build** that is separate from the running work gets its own lane at once: its own branch or worktree, its own builder inside the cap, its own `/ship`. it ships alone, never folded into the running batch.
- **one worktree or branch per session.** claim it in the `## cooking` entry (session, branch, folder). before building, check the tbd for another session's open claim. if one holds this tree, start your own worktree and say so in one line. ask only when free disk is under the floor in step 0.

## 5. verify in two tiers

- **fast, under 5 minutes, before every preview or hand off mid build:** the build, the main flow run once for real, 3 sizes for ui (a phone, a tablet, a desktop).
- **full, before `/ship`:** the whole suite, the full size sweep, every browser the project supports.

`/initiate` proposes both commands for each repo and writes them into `.claude/CLAUDE.md`.

## 6. keep state through a compact

as the work moves, keep one entry at the top of the repo tbd under `## cooking`: the task in the user's words, lane, the session's claim (session, branch, worktree folder), what is done, what is next. update it after each step. after a /compact or /clear, read it back first.

## 7. the ending, every lane

1. **branch.** `feat/`, `fix/` or `chore/` plus a kebab topic, off main. starting it needs no ask.
2. **real run, full tier.** the change seen working in the app, not just tests, then the full verify tier. say what was run and what was only read. a scroll story or a wheel or drag scene that goes out with the work (a pr, a launch post) gets a video: `node ~/.claude/tools/record.mjs <url>` (`--shot` for a drag), frames pulled and looked at, the path in the /ship block.
3. **hand test plan.** numbered: what to click or run, what they should see, what means broken. check which app owns a localhost port (`lsof -iTCP:<port> -sTCP:LISTEN`) before naming it.
4. **size sweep and brand check** if front end: `node ~/.claude/tools/probe-test.mjs <url> [paths]` at every target size, 1920 and 2560 wide included (overflow, targets under 44 px, stranded controls, `off-center`), and `node ~/.claude/tools/brand-check.mjs <brand.md>` on the changed files when the project has a `brand.md` (at the root, in `.claude/`, or in the brain at `~/vault/projects/<repo>/brand.md`).
5. **notes.** a newest first entry in the log, the tbd updated, the `## cooking` entry closed, traps added to `.claude/CLAUDE.md`. the brain if installed (`~/vault/projects/<repo>/`), else `.claude/`.
6. **/ship.** its first line says whether a fresh review ran and its verdict (`reviewed: yes, cold, fix these, all taken` or `reviewed: no`), the same as any recap. it ends with the numbered chain a yes would run. print the block and stop.
7. **on the user's yes:** `/ship` runs exactly that chain, once: commit, push the feature branch, a pr only if they asked, a merge only if they named it and the checks are green. it stops at the first failure or the first thing not in the chain.

never commit, push, open a pr, merge or deploy without the user's yes that specific time, to that action or to a printed chain that holds it. never arm auto merge, never merge on red checks, never force.

## short asks

| they say | do |
|---|---|
| "push it", "ship it", "merge it" | `/ship`, then wait for the yes |
| "all done?", "pushed?", "merged?" | `/status` |
| sql or a command for them to run | one paste, in a file, per `playbook` (`references/debugging.md`, "a command for the user to run") |
| "open the sql again" | reopen the newest file in that folder |
| "open it locally" | start the dev server bound to `127.0.0.1` (plus a private vpn address if the user works across machines), never `0.0.0.0`: a laptop on shared wifi serves the whole room. check the port owner, open the url |
| "preview link" | the branch preview url from `gh pr view` or the host, and say if it is behind a login |
| after a push they approved | any post push step the repo's `.claude/CLAUDE.md` names (a rebuild, a restart), from the pushed tree |
| "is this the best outcome" | `/review` |
| "hack it together", "quick prototype", a hackathon | `/bbq` |
| "build a palette", "what goes with this color" | `/palette` |
