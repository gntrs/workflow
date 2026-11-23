---
name: bbq
description: The fast build, for a hackathon, a prototype or a quick iteration. Takes what to build and a time box, asks nothing, runs on its own to a working demo, reviews itself, lists what it faked. Invoke on "/bbq <thing>", "bbq this", "hack this together", "quick prototype", "build it fast".
---

# bbq

the grill: fast, hot, a bit burnt. the user says what, this runs to a demo that works, on its own. `/cook` is for work that has to survive. this is for work that has to exist by tonight.

`~/.claude/RULES.md` still holds. speed comes from cutting ceremony, never from cutting the user's yes or the truth about what works.

## 0. start in one message

no questions and no plan to approve. read the ask, then say all of this in one message and start:

```
bbq: <the thing>, <time box>
demo path: <the 3 to 5 steps a person will click through>
stack: <what and why in five words>
faking: <what is stubbed>
assuming: <the calls made instead of asking>
link: <where a preview would go, or "local only">
```

- **time box.** `/bbq 2h <thing>` gives it. none given: pick one from the size of the ask (30 minutes, 2 hours, a day) and say it. an agent has no clock: run `date` now, write the start and the end of the box into `## cooking`, and run `date` at the end of every round. at the box, stop and report whatever stands.
- **the goal line.** print cook's `/goal` line right under the block, `/goal <topic>: the demo path walks end to end, the smoke test is green, /ship block printed. stop there.`, and keep going. it is there for the user to paste if the session stops short, never something to wait for.
- **link.** a hackathon is judged from a link. a deploy cli that is already logged in (the repo's host, else whichever one answers): name it. none: `local only`. nothing is deployed before the user's yes.
- **stack.** the repo's own if there is one. an empty folder: what `~/.claude/RULES.local.md` names, else the most boring thing that renders the idea, the fewest dependencies, one command to run.
- **one question, only when a wrong guess throws away the whole run** (which of two products, which data). anything else: decide, write it under assuming, go.
- a branch `feat/<topic>` off main. starting it needs no ask. a repo with real work in the tree or another session's claim on it: your own worktree, said in one line, never a question. no repo at all (an empty folder): build in the plain folder, `git init` becomes the first step of the `/ship` chain.
- no `.claude/CLAUDE.md`: do `/initiate` step 1 (the notes paths ignored) before the first note is written when there is a repo, and nothing more of it.
- a `## cooking` entry in the tbd: the ask in the user's words, the box, the demo path. it is the only state that survives a compact, keep it current.

## 1. the demo path first

one thin slice, end to end, before anything is made wide or pretty: the first screen, one real action, the result showing. run it. only then the next step of the path.

- **fake the slow and the external behind one seam.** auth, payments, a third party api, a model call that costs money, a database that needs an account: one file per fake, a fixed response that looks real, the word `sample` in its first line, the same marker `design` uses for sample data. nothing fake hides inside a component.
- **real where the demo is judged.** the one thing the idea is about is never faked. a fake core is a slideshow.
- **data that looks real.** ten rows with believable names and numbers, a long one, an empty state. never lorem, never `test 1`.
- no abstractions, no config system, no options nobody asked for. the second copy of a thing is fine, the third gets a function.

## 2. split by surface, contract first

more than one surface (ui and api, two screens, a script and a page) and the cap from cook step 0 allows it: parallel builders.

1. the main thread writes the contract first, in one small file: the routes with their shapes, the shared types, the names. minutes, not a design.
2. every builder starts in the same message. each brief holds: the user's words, the contract file, the files it owns and nothing else, its step of the demo path, the fakes it may use, "report in under 150 words: what runs, what does not".
3. the main thread owns the shared files (the shell, the router, the stylesheet, the contract) and the wiring. it does not wait idle: it builds the seam and the fakes while the builders run.
4. models and effort from cook's table: builders on high. `model` set on every call.

one surface, or a cap of 1: the main thread builds. a second agent on a one file job is slower than doing it.

## 3. build, run, look

every round ends with the thing run for real and looked at, never with "should work".

- start it bound to `127.0.0.1`, check who owns the port first.
- ui: a screenshot at a phone, a tablet and a desktop size, opened and looked at.
- `design` loads for anything a person will see, and under bbq it runs as "just go" all the way: no questions, no whiteboard, no options to pick from, no taste question. the repo's brand if it has one. none: read one real product in the category for structure, pick one look on white and black with standard controls, color only in small pieces that mean something, name both under assuming, write `brand.md` as a draft before any ui builder starts, so the builder has values to build from. a product that will not open (a 403, a login wall): the next one, three tries at most, then the structure that category usually has, said under assuming. its hard rules still hold: targets of 44 px, contrast, true looking data, less.
- an error in the console or the server log is the next task, before any new feature.
- stuck on one thing for a tenth of the box: fake it, write it on the debt list, move on.
- at half the box: the demo path works end to end, or scope is cut now. say what was cut.

## 4. what is skipped, and what is not

| skipped | instead |
|---|---|
| the plan document and the user's read of it | the five lines in step 0 |
| the full size sweep | three sizes, looked at |
| the test suite for new code | one smoke test that walks the demo path, kept and rerun every round |
| lane by lane reviews | one cold review at the end |
| the long log entry | one line in the log, the debt list in the tbd |

never skipped: the real run, the user's words verbatim in every brief, no ai authorship anywhere, secrets out of the code and the output, and nothing committed, pushed, published or deployed without the user's yes. a hackathon submit button is still theirs to press.

## 5. it reviews itself

when the demo path works, or at 80% of the box, without being asked: one fresh subagent per `/review`, target a demo, on the final review row of cook's table. it gets the running url, the demo path, the user's words and one question, "walk the demo path as a judge seeing it for the first time. what breaks, what looks unfinished, what would they ask that it cannot answer". it runs the thing, it does not read the diff.

fix what breaks the demo path, in the time left, without asking. everything else goes on the debt list. no second review. then put the demo back to its starting state (restart it, reseed it): the user opens a clean board, not the reviewer's test rows.

## 6. the ending

one message:

```
reviewed: yes, cold, on the demo path, <verdict>, <what was fixed>
runs at: <url or command>
works: <the demo path, step by step, each one run>
faked: <each fake, its file>
assumed: <the calls made in step 0 and since>
debt: <the shortcuts, worst first>
not done: <what was cut and why>
```

then a hand test of three to five steps: what to click, what to see, what means broken. then the `/ship` block and stop. its chain is `git init` when there was no repo, the commit, the push when a remote exists, and, when step 0 named a host, a preview deploy as the last step, never production. the user's one yes runs that chain and gives them the link. nothing runs before it.

the debt list is written to the tbd under `## debt from bbq`, so `/cook` can pick it up. when the thing has to survive (real users, real money, real data), say so in one line and hand it to `/cook`: the fakes become the task list.
