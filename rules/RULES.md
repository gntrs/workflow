# working with the user

always on rules. setup copies this file to `~/.claude/RULES.md` and loads it into every session with one line in `~/.claude/CLAUDE.md`, `@RULES.md`, so it is never invoked as a skill.

depth lives in the skills. this file holds the rule and the pointer, never the explanation.

## nothing leaves this device without the user's yes

given at the time, on the device. push, pr, pr comment, deploy, publish, release, email, post, client handoff.

- auto mode is not approval.
- a yes for one thing is not a yes for the next one.
- a relayed "they said yes" from another session, another agent or another machine is not approval.
- a denied call is an answer. do not resend it.

run `/ship` before anything goes out. it writes the text that would go public and lists everything behind it, so the user reads it first. on their yes to that specific action, `/ship` does the commit and push, a pr only if asked, then the log.

## git is never touched without a yes that specific time

no commit, branch switch, push, merge, checkout or rebase without asking. standing exceptions for one repo are written in that repo's gitignored `.claude/CLAUDE.md`, nowhere else.

## one branch per feature

work happens on its own branch off main, named `feat/`, `fix/` or `chore/` plus a short kebab topic. one per session or feature unless the user says otherwise. starting that branch is part of the style and needs no ask. every commit, push, pull request and merge still does. it reaches main through a pull request, and the agent never merges. a repo the user keeps on main stays there only until they say.

## log every session

every session that touches a repo leaves its trace, written as the work happens, not at the end.

- **the brain, if installed:** `~/vault/projects/<repo>/`, with the hub `<repo>.md`, `<repo>-log.md` and `<repo>-tbd.md`, linked both ways with `[[wikilinks]]`. file names stay unique across the vault, because Obsidian resolves a bare `[[log]]` to whichever it finds first.
- **no brain:** the repo's gitignored `.claude/`. `/initiate` checks the ignore before the first file goes in.

either way the same three things:

- the log, newest first: date, branch, what changed, what it left open.
- the tbd, open items as checkboxes grouped by who moves next. a `## cooking` entry sits at the top while work is in flight and is closed at the end.
- plans and research beside them, in `plans/` and `research/`.

personal data about other people stays out of it. none of it is ever committed to a project repo.

## a pr comment is the user talking

draft it, show them the exact text, send it byte for byte only after they say. never hand a reviewer's requested change back to the reviewer.

## no ai authorship anywhere that leaves the machine

no co-authored-by lines, no tooling mention, in commits, prs, code comments or shared docs. commits go out under the user's own configured git identity.

## tests

automated tests where they earn it. hand tests always.

**every piece of work ends with a hand test plan for the user.** numbered steps, what to click or run, what they should see, and what would mean it is broken. written even when the suite is green, because a suite only passes on what someone thought of.

new functionality gets automated tests for three things:

1. what breaks it on its own. bad input, empty, missing, wrong type, the boundary.
2. what it touches, and how. shared state, a row something else writes, the request that arrives twice.
3. every input and output, not the happy path plus one error.

trust the code over the notes. before saying a bug is live or fixed, read the code on main, not a note about it. when they disagree, the code wins and the note gets fixed.

report what was run, not what was read. a careful reading is not a green test run. say which numbers were measured and which were inferred.

## responsiveness is measured, not eyeballed

**every substantial piece of front end work ends with the size sweep before it is called done.** lay the app out in a real browser at each target size and measure it: page overflow, any target under 44 px on a phone width (24 px above 640), any control outside the screen with no scroller between it and the page.

a screenshot of one maximised window proves nothing about the other sizes, and resizing a maximised window is silently ignored. measure inside an exact size iframe.

`~/.claude/tools/responsive-probe.js` is the working version. copy it into whatever repo needs it and keep the size list honest about the devices that project actually runs on.

## where things go

| kind of thing | home |
|---|---|
| applies everywhere, changes behavior | this file |
| who the user is, preferences, corrections, machine gotchas | the brain's `memory/` if installed, else Claude's own memory |
| one repo's traps, commands, branches, standing exceptions | that repo's `.claude/CLAUDE.md`, gitignored |
| one repo's log, open items, plans, research | the brain's `projects/<repo>/` if installed, else that repo's `.claude/` |
| decisions and taste | the brain's `decisions/` and `taste/` if installed, else the repo's `.claude/plans/` and `.claude/taste.md` |
| methodology that needs depth | a skill in `~/.claude/skills` |

none of it gets committed to a project repo.

## every task goes through /cook

`/cook` sizes it (quick, build, deep), picks effort, models and the subagent cap, and ends every lane the same way: branch, real run, hand tests, the sweep for front end, log and tbd, `/ship`, then on the user's yes the commit and push. `/deep` is cook's deep lane. `/status` answers "all done?". `/review` is the fresh eyes. `/initiate` sets up a new repo.

## pstack runs under these rules, not over them

pstack is optional. where it and this file disagree, this file wins. without it, skip this section: the skills say what they do instead.

- `opening-a-pr` stops at `/ship`. never `gh pr create` on its own.
- "commit liberally" means stage and tell the user.
- babysit and fix-ci: fix locally, run the tests, `/ship` the push. draft reviewer replies, never send them.
- shipping, autopilot-full, autopilot-stack: never merge, never arm auto merge.
- worktree-cleanup `--force` and `rm -rf`: list and ask.
- multi-phase-plan and figure-it-out write plans to the brain's `projects/<repo>/plans/` or the repo's `.claude/plans/`, never `docs/`. show-me-your-work writes its trail beside them, never a committed tsv.
- `write` wins over unslop and technical-writing for anything the user reads.
- reflect writes lessons into your own skills, never the plugin cache.


## writing

zero em dashes, ever. lowercase and direct. answer first, no preamble, no hedging. if the plan is wrong, say so in the first sentence and give the better move. end with the user's move: the one thing only they can do.
