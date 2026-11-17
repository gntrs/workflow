---
name: initiate
description: Bootstrap a repo with everything an agent needs, all gitignored. Ignores its notes files in .git/info/exclude (never all of .claude/) and verifies it before writing anything, reads the stack instead of guessing, writes .claude/CLAUDE.md with the fast and full verify commands, sets up the log, tbd and plans (in the brain if installed, else .claude/), checks the user's own git identity, proposes a test setup. Invoke in a fresh clone or when the user says initiate, set up this repo, or new repo. Never commits.
---

# initiate

bootstrap this repo so an agent can work in it without guessing. everything created here is private and gitignored. nothing this command writes is ever committed.

if the user passed a description of the project, use it. otherwise work it out from the repo and say what you could not determine.

## 1. ignore first, before you write anything

the step that gets missed, and not recoverable once a file is committed.

- confirm this is a git repo. if not, stop and ask before `git init`.
- the notes files are `.claude/CLAUDE.md`, `.claude/log.md`, `.claude/tbd.md`, `.claude/taste.md`, `.claude/brand.md`, `.claude/plans/`, `.claude/research/`, `.claude/sql/`, `.claude/run/`, `.claude/videos/`. add each to `.git/info/exclude`, without duplicating a line. that file is local to this clone and never committed, so nothing in the repo changes. never ignore all of `.claude/`: teams commit `.claude/settings.json`, `commands/` and `agents/` there.
- verify: create `.claude/plans/probe`, run `git status --short --ignored .claude`, confirm it shows as ignored (`!!`) and not as untracked, then delete the probe. also `git ls-files` on the notes paths must print nothing: a notes file already tracked is still committed despite the ignore, flag it and ask. do not continue until both pass.

## 2. read the repo, do not assume

- stack and package manager from `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, lockfiles.
- scripts that actually exist: test, typecheck, lint, build, dev. read them, do not guess the names.
- test runner and where tests live. note config pointing at a layer that does not exist, an `e2e/` that was never created counts.
- deploy config: `vercel.json`, `.vercel/project.json`, `.github/workflows`, Dockerfile, Procfile. is there ci at all.
- branches: `git branch -a`, `git symbolic-ref refs/remotes/origin/HEAD`. which is prod, what deploys from it.
- env: `.env.example`, or grep for `process.env` / `os.environ` to find what is required with no default.
- the readme and any notes, for anything that contradicts the above. notes go stale: trust the code, and where they disagree, write down what the code does.

install and run it if that is cheap. a command you ran beats a command you read.

## 3. write `.claude/CLAUDE.md`

short. only what an agent gets wrong without it. no filler, no restating the file tree. cover, only if true:

- one line on what this project is.
- install and run, with exact flags. if install needs something non obvious, that line is the most valuable in the file.
- the real commands for test, typecheck, lint, build.
- **verify, fast:** one command or a short list, under 5 minutes: the build, the main flow once, 3 sizes for ui. run before every preview.
- **verify, full:** the whole suite, the full size sweep, every browser the project supports. run before `/ship`.
- working branch versus prod branch, and what deploys from where. if a push to a branch is a live deploy, say so in those words.
- the branch rule: one branch per feature off main, `feat/`, `fix/` or `chore/` plus a topic, into main through a pull request. note what ci runs on.
- where env and secrets come from, and which have no default.
- traps found in step 2. anything that made you stumble goes here so it stumbles nobody again.
- the git identity this repo commits as (step 5).
- where this repo's notes live: the brain folder, or `.claude/`.
- one line naming which global skills apply. do not copy skill content in.
- a `standing exceptions` heading, empty. only the user adds to it.

no ai attribution anywhere in it.

## 4. the notes

the brain if installed (`~/vault/projects/<repo>/`), else `.claude/`. create, if missing:

- **brain:** the hub `<repo>.md` (what it is, where it lives, links to every plan and note), `<repo>-log.md` with today's entry, `<repo>-tbd.md` with what is open, `plans/`, `research/`. link every existing brain note about this repo from the hub, and give each a first line back to the hub. unique file names, never a bare `log.md`.
- **no brain:** `.claude/log.md` (`# log`, newest first, today's entry: date, branch, "initiated", what is open), `.claude/tbd.md` (`# tbd`, the open items from step 2 as `- [ ]` checkboxes under `## the user, now`, `## waiting on someone else`, `## to build, on the next cook`, `## ideas`), `.claude/plans/`, `.claude/research/`.

either way, a `## cooking` entry goes at the top of the tbd only while work is in flight. `.claude/sql/` only when there is a database, for queries the user runs by hand. it stays in `.claude/` even with a brain, because sql can carry real rows.

re run step 1's check after writing: `git status --short` shows none of the `.claude/` files.

## 5. git identity

never set an identity you made up, and never hardcode one.

1. read what is there: `git config user.name` and `git config user.email` (local, then global).
2. both set: leave them alone, record them in `.claude/CLAUDE.md`.
3. either empty: ask the user once which name and email this repo commits as, then set them locally with `git config user.name` / `git config user.email`.
4. a push later rejected because the email is private (GitHub does this when "block command line pushes that expose my email" is on): offer the host's noreply address. on GitHub it is shown under settings, emails, and ends in `users.noreply.github.com`; `gh api user --jq '.id,.login'` gives the two parts it is built from. set it locally only after the user says yes, and record it in `.claude/CLAUDE.md`.

## 6. tests, if there are none

do not install a framework unasked. propose one sized to the project and wait for a yes:

- which runner fits this stack and why.
- the first real test to write, naming an actual function or route in this repo.
- the fast and full verify commands it would give.
- what a hand test of the main flow looks like.

for anything web that means the runner plus one real test, never a scaffold of empty files. front end repos also get `~/.claude/tools/responsive-probe.js` copied in, with its size list trimmed to the devices this project runs on, once the user says yes.

## 7. report

what was created, changed, left alone, and could not be determined. then numbered hand test steps to confirm the setup: the install command, the dev command, what they should see, and `git status --short` showing nothing from `.claude/`.

no commit, no push. `/initiate` only writes ignored files, lines in `.git/info/exclude`, local git config after a yes, and the brain folder if installed.
