---
name: cook
description: The one entry point for any task the user hands over. Sizes it into quick, build or deep, picks effort, models and how many subagents, runs pstack underneath if installed, reviews early instead of at the end, and ends every lane the same way, branch, real run, hand tests, the size sweep for front end, the log and tbd, /ship, then on the user's yes the commit and push. Invoke when the user says "cook", "/cook <task>", "do it", "build this", "fix this", or types /deep or /playbook after a prompt. Also handles short asks like "push it", "all done?", "give me the sql", "open it locally", "preview link".
---

# cook

one door for every task. size it, run the lane, end it the same way every time. `~/.claude/RULES.md` wins over anything pstack says.

## 0. before anything

1. load `playbook`: working style, swarm shapes, the mistake ledger. front end work also loads `design`. anything a person reads loads `write`.
2. `git remote -v` and the repo's gitignored `.claude/CLAUDE.md`. no `.claude/CLAUDE.md`: offer `/initiate` first. notes say what was true when written: when a note and the code disagree, the code wins and the note gets fixed. before saying a bug is live or fixed, read the code on main.
3. read the repo tbd: the brain's `~/vault/projects/<repo>/<repo>-tbd.md` if installed, else `.claude/tbd.md`. an open `## cooking` entry there is the task, pick it up.
4. resources, every time a subagent or worktree is on the table. the cap counts every subagent in flight: builders, explorers, reviewers. it is 4 at 16 gb ram and up and only goes down:
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
| build | one feature or bug in a known area | high | up to 2 in flight at once: explorer, plan reviewer, final reviewer, in sequence | pstack poteto-mode with its feature or bug-fix playbook. without pstack: a short plan in chat, build in the main thread, one reviewer subagent |
| deep | brownfield, unfamiliar, "still broken" twice, a swarm already failed, the user steps away | xhigh or max | up to 4 subagents in flight, builders and reviewers together, inside the cap from step 0 | `/deep` |

this table and the cap in step 0 are the one source of truth for models and caps. `/deep`, `/review` and `playbook` point here instead of repeating numbers. `~/.claude/skills/pstack/models.md` covers pstack's own roles only. set `model` on every agent call, the main thread's model never decides a subagent's. setup swaps these names for what the user's plan has:

| role | model | effort |
|---|---|---|
| explorer, how, recall | sonnet | medium |
| feature, bug fix, builder | opus | high, the floor. never downgrade a builder silently |
| architect, interrogate, review | opus | xhigh |
| deep lane planner | opus. fable as a second model family when available, never the only one | max |
| status, sorting | haiku | low |

say the lane in one line before starting: `lane: build, opus high, 1 explorer, 1 reviewer`.

on build and deep, the line after it is a ready `/goal` to paste. `/goal` is a Claude Code command that keeps the session working until the condition holds, so it cannot stop short. no `/goal` on your version: put the finish line in `## cooking` and check it before stopping.

```
/goal <repo> <topic>: <the measured finish line>. /ship block printed. stop there.
```

- the finish line is numbers the user can check: tests green with the count, build green, the sweep with 0 overflow and 0 targets under 44 px, the named bug reproduced then gone. never "works well".
- it always ends at `/ship`. never put commit, push, pr, merge or deploy in a goal: those need the user's yes, so a goal that names them loops on "waiting on you" and burns tokens.
- quick lane: no goal.
- the user already set a goal that needs their yes: say once which step only they can do, then answer each check in one line.

## 2. review at three points

quick lane: none of these.

review is where wall clock goes. most final reviews come back "fix these" with a long list, so read earlier and the list lands while the build still runs. every reviewer is a fresh subagent per `/review`: the target, the user's words verbatim, the bar, and the line "predict the user's no". never your summary of the ask.

1. **the plan, before any builder starts.** one cold read of the plan, minutes. a wrong direction found after the build costs the whole build. build lane: the short plan in chat counts, the read can run while the explorer reads. deep lane: always.
2. **each lane, the moment it lands.** while the other builders still run, a cold read of that lane's diff against its brief, plus its tests and its slice of the finish line. a pass frees the slot for the next lane; findings go back to that builder. a pipeline, not a batch.
3. **the whole, before the user looks.** the final cold read, then fix or argue each finding, builders in parallel on their own files. never apply one blind.

explorers and reviewers run alongside a builder whenever they read different things than it writes. wait for an explorer first only when the build depends on its answer.

## 3. lanes in flight

- **the deep lane:** read `/deep` and follow it. research, a plan with a checkable exit predicate, the cold read, the user's read, the run grant ask, the run, the trail, proof, `/ship`. the main thread coordinates and does not build there.
- **a new ask mid build** that is separate from the running work gets its own lane at once: its own branch or worktree, its own builder inside the cap, its own `/ship`. it ships alone, never folded into the running batch.
- **one worktree or branch per session.** claim it in the `## cooking` entry (session, branch, folder). before building, check the tbd for another session's open claim. if one holds this tree, start your own worktree instead of sharing a dirty tree, or ask.

## 4. verify in two tiers

- **fast, under 5 minutes, before every preview or hand off mid build:** the build, the main flow run once for real, 3 sizes for ui (a phone, a tablet, a desktop).
- **full, before `/ship`:** the whole suite, the full size sweep, every browser the project supports.

`/initiate` proposes both commands for each repo and writes them into `.claude/CLAUDE.md`.

## 5. pstack overlay

pstack is optional and runs underneath if installed. the overlay is in RULES.md under "pstack runs under these rules". read it before any pstack playbook that pushes, merges, opens a pr or writes a plan. without pstack: the build lane is a short plan in chat, the main thread builds, one reviewer subagent reads it; the deep lane runs the same loop by hand, per `/deep`.

## 6. keep state through a compact

as the work moves, keep one entry at the top of the repo tbd under `## cooking`: the task in the user's words, lane, the session's claim (session, branch, worktree folder), what is done, what is next. update it after each step. after a /compact or /clear, read it back first.

## 7. the ending, every lane

1. **branch.** `feat/`, `fix/` or `chore/` plus a kebab topic, off main. starting it needs no ask.
2. **real run, full tier.** the change seen working in the app, not just tests, then the full verify tier. say what was run and what was only read.
3. **hand test plan.** numbered: what to click or run, what they should see, what means broken. check which app owns a localhost port (`lsof -iTCP:<port> -sTCP:LISTEN`) before naming it.
4. **size sweep** if front end: `~/.claude/tools/responsive-probe.js` at every target size. overflow, targets under 44 px, stranded controls.
5. **notes.** a newest first entry in the log, the tbd updated, the `## cooking` entry closed, traps added to `.claude/CLAUDE.md`. the brain if installed (`~/vault/projects/<repo>/`), else `.claude/`.
6. **/ship.** print the block and stop.
7. **on the user's yes to that specific action:** `/ship` commits, then pushes the feature branch. a pr only if they asked for one. merge never, by the agent.

never commit, push, open a pr, merge or deploy without the user's yes that specific time.

## short asks

| they say | do |
|---|---|
| "push it", "ship it" | `/ship`, then wait for the yes |
| "all done?", "pushed?", "merged?" | `/status` |
| sql or a command for them to run | one paste. write it to the repo's gitignored `.claude/sql/` (or `.claude/run/` for shell) as `<date>-<topic>.sql`, never the brain, because it can carry real rows. first line a comment: reads or writes, and what. safe to run twice. it ends with a query that shows the result. open it (`open` on mac, `xdg-open` on linux, `start` on windows) |
| "open the sql again" | reopen the newest file in that folder |
| "open it locally" | start the dev server, check the port owner, open the url |
| "preview link" | the branch preview url from `gh pr view` or the host, and say if it is behind a login |
| after a push they approved | any post push step the repo's `.claude/CLAUDE.md` names (a rebuild, a restart), from the pushed tree |
| "is this the best outcome" | `/review` |
