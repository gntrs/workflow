---
name: playbook
description: How to work on any build, which pstack skill runs which subagent job, swarm shapes, the mistake ledger. Cook loads it. Invoke on "spin up agents", "swarm", "parallelize this", or any build.
---

# playbook

how to work. RULES.md holds the always-on rules and wins over this file and over pstack. this file holds how. depth is in `references/`, one read away.

## keep lessons where updates cannot erase them

updates replace this file and every installed skill, so lessons never go into them. a lesson that applies everywhere is one line in `~/.claude/RULES.local.md`. one repo's goes into that repo's `.claude/CLAUDE.md`. one worth sharing with everyone: offer it as a change to the workflow repo itself.

**write one when:** a root cause cost real time and would again (a dead deploy hook, a key owned by the wrong account, a platform gate like autoplay on phones). the user corrects how work is done, or reacts strongly to an approach. a swarm shape works notably well or fails notably badly.

**do not write one for:** one-off bugs with no general lesson, routine work that followed the playbook, anything already written here, minutes-old chat detail.

**how:** one line, tight, and delete what became false. no changelog. zero em dashes. tell the user in one line what you wrote and where.

## before any work

read `git remote -v` and the repo's gitignored `.claude/CLAUDE.md` if one exists. where it is stricter than this file, it wins. then read the open items: the brain if installed (`~/vault/projects/<repo>/<repo>-tbd.md`), else `.claude/tbd.md`. a live `## cooking` entry there is the task. shapes in `references/notes.md`.

## how to work

- **/cook is the door.** every task goes through it: size it (quick, build, deep), run the lane, end the same way. long autonomous work is `/deep`. do not build a second entry.
- **plans are written down before builders run**, with an edge case register and a checkable done line, and get a cold read before any builder starts (`references/swarm.md`). the user reads it too.
- **you test before the user tests.** build, fix, run it yourself, report. "tested" means measured on a real run. say what was executed and what was only read.
- **every job ends with a numbered hand test plan**, the size sweep for front end, a log entry, then `/ship`.
- **test on every OS you target.** a cross build proves it compiles, not that it runs.
- **commits in a long run need a run grant:** asked once, recorded with date and branch in the repo's gitignored `.claude/CLAUDE.md`, gone when the run ends, never covering push, PR, comment or merge. `/deep` has the wording.
- **always end with the user's move.** the one thing only they can do (an env var, a migration to paste, a retest on a phone), stated plainly.
- **a new separate ask mid build gets its own lane** at once and ships alone when green. folding it into the running batch makes it wait on the slowest change.

## how to talk

- blunt. if the plan is wrong, say so in the first sentence and why, then the better move.
- answer first. no preamble, no restating the question. a table, a numbered list, a one-line verdict.
- no hedging. failed means failed. unverified is labelled unverified in the same sentence.
- do not ask when a sensible default exists. make the call, state it, keep going. two or three taste calls at the end, your pick named first.
- diagnose the real problem, not only the stated one, and flag adjacent things that matter in one line each.
- name the most likely thing to break, loudly, before it breaks.
- **undoing is still an action.** when something the user can see is in doubt, say what you would do and wait. reversible is not free.
- never comment on typos or rushed typing. parse it and move.

| the user says | means |
|---|---|
| "cook" | go, no more discussion. runs `/cook` |
| "spin up", "swarm" | launch subagents, per the map below |
| "ship it", "push it" | `/ship`, nothing more |
| "all done?", "pushed?", "merged?" | `/status` |
| "is this the best outcome", "fresh eyes" | `/review` |

## subagents, through pstack when it is installed

pstack (`github.com/ericlitman/open-pstack`, MIT) is an optional engine; the middle column applies only with pstack installed. RULES.md wins over it. pick the skill by the job; the last column is what to do without it.

| job | pstack | without pstack |
|---|---|---|
| how does X work, before touching it | `how` | 1 to 2 read only explorers |
| why is it built this way | `why` | `git log -p` and `git blame` in the main thread |
| one-way door, a new boundary, a data shape | `architect` | two structurally different sketches by two agents, then pick |
| two or more valid shapes for one artifact | `arena` | same, candidates in the scratchpad |
| parallel coverage, a race, verify lanes | `swarm` | a rolling window of Agent calls under the cap |
| contested design, hard work before `/ship` | `interrogate` | `/review` twice, two model families if available |
| fresh eyes on a plan or a diff | `/review` | `/review` |
| one feature or bug in a known area | cook's fast loop (cook section 2), a pstack tool only by name | the same |
| a hackathon, a prototype, a quick iteration | `/bbq` | `/bbq` |
| long run to a checkable predicate | pstack's `autonomous-run` or `orchestrate` playbook | `/deep` drives it |
| resume after a compact, a clear or a crash | pstack's `session-pickup` playbook | read the `## cooking` entry first |
| "catch me up" | `recall` | read the log, newest first |

plans, decision trails and multi-phase plans go to the brain if installed (`~/vault/projects/<repo>/plans/`), else `.claude/plans/`. never `docs/`, never committed.

swarm shapes, who does what in a big run, and the review-earlier rules: `references/swarm.md`.

## hard rules for every subagent brief

1. **disjoint file ownership.** each writer owns its own files or directory. shared files (page shells, translations, routers, the shared stylesheet, a token file, a tailwind config) belong to one integrator, named as forbidden in every other brief, with what to do instead.
2. **test reality, do not theorize.** curl the live api with the real key, run the server, read the served bundle, check the file exists.
3. **report honestly.** every report has an open issues field. "cannot verify audio from here, needs a phone retest" is the right shape.
4. **secrets:** never more than the last 4 characters, never stage a `.env`.
5. **verify the deploy, not the checkmark.** fetch the live bundle, grep for a marker from this round.
6. **state the fallback loudly.** any failure path surfaces a reason to the user or the log.
7. **no subagent commits, pushes or comments.** only the main thread, only with the user's yes or inside a run grant.
8. **the user's words verbatim** in the brief, not your summary of them.
9. **the report goes to a file** the brief names (scratchpad or `.claude/`), with a three line summary back. a long report pasted into the coordinator fills its context.

## speed, without losing the outcome

what makes a run fast is rarely a faster model. it is less waiting. the rules are in cook section 2 and hold in every lane: everything independent starts in one message, a contract before a split, a brief that needs no follow up, reports under 200 words, review while it builds, high effort only on the seats that decide. the coordinator does not build the pieces once two or more builders run. the shared files, the seams and the wiring are its own. a second agent is slower on a one file change, on anything that needs the context already in the main thread, and when two would write the same file.

## models and caps

one source of truth: the cap in `cook` (section 0) and its model table (section 1). do not copy them here. what this file adds:

- **one strong model on every seat, `model` set on every call.** a second family only on the one or two major seats (the deep lane planner, the final review), beside the strong model, never the only lane: a panel on one model dies with that model's credits. the names live in `~/.claude/RULES.local.md` under `## models`.
- **never silently downgrade a builder.** a cheaper builder saves less than the rework costs.
- **the user's time is the constraint, both ways.** heavy machinery for work that deserves it, a trivial task stays trivial.
- **the cap is for the machine, not the session.** other sessions open on the same repo count against it: list them, take your own worktree and say so, ask only when free disk is under cook's floor. two sessions building the same branch names put two writers in one tree.
- a dev server binds to `127.0.0.1` (plus a private vpn address if the user works across machines), never `0.0.0.0`: a laptop on shared wifi serves the whole room.
- a dev server's build cache (`.next` and the like) can grow to several GB. kill the server and clear it when done.

## mistakes already made, do not repeat

read `references/mistakes.md` before a build.

## references

one read away: `notes.md` (where plans, log and open items live, with or without the brain), `swarm.md` (shapes, who does what, review earlier), `deploy.md` (branches, commit voice, main, versions, release notes, strip list, PR comments), `debugging.md` (doctrine, browser traps, no-browser verify), `research.md` (research swarm and its sourcing rules), `mistakes.md`. visual work and artifacts: `design`. anything a human reads: `write`.
