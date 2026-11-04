# setup, for the agent

you were asked to set this workflow up for the person you are talking to. it is a set of markdown skills, one rules file and three small scripts (the size probe, its runner, the brand check) that go into `~/.claude/`. install it tailored to them, do not copy it blind.

works the same on macos, linux, wsl and windows. on windows use `$HOME\.claude` and powershell where this says bash.

## 0. get the files

if you only have the link, clone it where updates are one `git pull` away:

```
git clone --depth 1 https://github.com/gntrs/workflow.git ~/.claude/workflow
```

then read every file under `rules/`, `skills/*/SKILL.md`, `pstack/README.md` and this file before you write anything. it is small.

## 1. look first, then ask once

check these yourself and say what you found, in one short block. do not ask about any of them:

- os and shell, total ram, free disk.
- whether `git`, `gh`, `node`, `docker` (and whether a docker vm is running), `python3`, `bun` and the `claude` cli exist.
- `git config --global user.name` and `user.email`. none set: add a question for the name and email their commits go out as.
- what is already in `~/.claude/`: `CLAUDE.md`, `RULES.md`, any skill folder with the same name as one of ours (`cook`, `deep`, `ship`, `status`, `review`, `initiate`, `design`, `write`, `playbook`, `brain`, `dream`), and whether pstack is already installed (`claude plugin list`).

then one message, numbered, each question with the default you will use if they say "you decide":

1. **name.** what to call them. default: first name from git config. skills say "the user" and that stays fine.
2. **pstack.** install the open-pstack plugin cook runs on (playbooks for features, bugs, plans, reviews, long runs)? default: yes if the `claude` cli exists. no means cook runs its own lanes, which still work.
3. **the brain.** a notes vault at `~/vault` (Obsidian friendly) where every repo gets a hub, a log and an open items list, plus `/brain` and `/dream`? default: no. without it, notes live in each repo's gitignored `.claude/`.
4. **git strictness.** shipped: no commit, push, merge, pr or deploy without their yes that specific time, and one `feat/`, `fix/` or `chore/` branch per feature, which needs no ask. keep it, or allow local commits freely and gate only what leaves the machine? default: keep it. and: add the per repo notes files to the global gitignore, so they never get committed anywhere? default: yes.
5. **writing voice.** how text should sound (lowercase or not, formal or not), banned words. default: the plain style in `skills/write`.
6. **parallel agents.** default from what you measured (see the table below). ask only if they run several sessions at once or a heavy local stack.

## 2. install

run the installer with a flag for every answer. you have no terminal, so it asks nothing and anything you leave out is a no.

```
bash ~/.claude/workflow/install.sh --dry-run --yes --with-pstack --with-brain --gitignore     # mac, linux, wsl
powershell -ExecutionPolicy Bypass -File $HOME\.claude\workflow\install.ps1 -DryRun -Yes -WithPstack -WithBrain -Gitignore   # windows
```

- `--with-pstack` / `--no-pstack` per answer 2, `--with-brain` / `--no-brain` per answer 3.
- `--gitignore` adds the per repo notes files (`.claude/CLAUDE.md`, `log.md`, `tbd.md`, `plans/` and the rest, never all of `.claude/`) to their global gitignore. it touches git config, so ask.
- an existing skill with the same name is skipped and listed. `--force` replaces it and keeps the old one as `<name>.bak-<date>`. ask before `--force`.

show them the `--dry-run` output, then run it without `--dry-run`. the installer is short and commented: read it if they want to know exactly what it does.

## 3. tailor

edit the installed copies in `~/.claude/`, never this repo's files.

| in the files | becomes |
|---|---|
| "the user" | their name if they asked for it |
| the subagent cap in `cook` | nothing to edit: cook reads ram, a running docker vm and free disk every time. lower the ceiling of 4 only if they asked |
| the disk floor, 8 gb free before a worktree | keep it. already under it: tell them worktrees stay off until they free space |
| the model table in `cook`, and `pstack/models.md` | the current claude models their plan has. no access to one: the nearest one they do. a second model family is optional, never the only lane |
| git lines in `RULES.md` | per answer 4 |
| `skills/write` | per answer 5 |

pstack off: remove the pstack section in `RULES.md`. cook's build lane already says what runs without it.

keep the substance. do not soften "nothing leaves without your yes", "git is never touched without a yes that specific time", "hand tests always" or "a checkable finish line". those are the point.

## 4. prove it

say what you ran, not what you read.

1. `ls ~/.claude/skills` lists every skill you installed.
2. `grep -n '@RULES.md' ~/.claude/CLAUDE.md` shows the import.
3. `ls ~/.claude/tools/responsive-probe.js ~/.claude/tools/probe-test.mjs ~/.claude/tools/brand-check.mjs` lists all three.
4. pstack yes: `claude plugin list` shows pstack.
5. brain yes: `ls ~/vault` shows `HOME.md`, `now.md`, `projects/`.

then hand them this, numbered:

1. quit and reopen claude code. skills and rules load at session start.
2. make a throwaway repo: `mkdir t && cd t && git init && printf 'teh readme\n' > README.md && git add -A && git commit -qm init`. type `/initiate`. expect: the notes paths in `.git/info/exclude`, a `.claude/CLAUDE.md`, `.claude/tbd.md`, and `git status --short` showing none of them. broken if: a notes file shows as untracked, `.gitignore` changed, or it commits.
3. type `/cook fix a typo in the readme`. expect: one line naming the lane `quick`, a `fix/` branch, the fix in the main thread, no subagents, a numbered hand test, then the `/ship` block and a stop. broken if: it spawns agents, asks five questions, or commits.
4. type `/status`. expect: five lines or fewer, the first answering "done or not".
5. say yes to the `/ship` block. expect: one commit under their git identity, no co-authored-by line (`git log -1 --format='%an <%ae>%n%b'`), a push only if a remote exists. broken if: it opens a pr unasked, merges, or touches main.

## 5. finish

five lines: what was installed, what was skipped and why, where the source lives (`~/.claude/workflow`, update with `git pull` and the installer again), and the one thing to try first: `/cook` on a real task.
