# setup, for the agent

you were asked to set this workflow up for the person you are talking to. it is a set of markdown skills, one rules file and six small scripts (the size probe, its runner, the brand check, the ref reader, the ref check, the recorder) that go into `~/.claude/`. install it, then write what is personal into their own file. do not copy it blind.

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
- what is already in `~/.claude/`: `CLAUDE.md`, `RULES.md`, `RULES.local.md`, `settings.json`, any skill folder with the same name as one of ours (`cook`, `bbq`, `deep`, `ship`, `status`, `review`, `initiate`, `design`, `write`, `playbook`, `brain`, `dream`), and whether pstack is already installed (`claude plugin list`).
- an earlier install: `bash ~/.claude/workflow/install.sh --status` says which version is there and which files they edited.

then one message, numbered, each question with the default you will use if they say "you decide":

1. **name.** what to call them. default: first name from git config. skills say "the user" and that stays fine.
2. **pstack.** install the open-pstack plugin cook runs on (playbooks for features, bugs, plans, reviews, long runs)? default: yes if the `claude` cli exists. no means cook runs its own lanes, which still work.
3. **the brain.** a notes vault at `~/vault` (Obsidian friendly) where every repo gets a hub, a log and an open items list, plus `/brain` and `/dream`? default: no. without it, notes live in each repo's gitignored `.claude/`.
4. **git strictness.** shipped: no commit, push, merge, pr or deploy without their yes that specific time, and one `feat/`, `fix/` or `chore/` branch per feature, which needs no ask. keep it, or allow local commits freely and gate only what leaves the machine? default: keep it. and: add the per repo notes files to the global gitignore, so they never get committed anywhere? default: yes.
5. **writing voice.** how text should sound (lowercase or not, formal or not), banned words. default: the plain style in `skills/write`.
6. **ask before anything leaves.** add an ask list to `~/.claude/settings.json`, so claude code itself stops before a push, merge, pr, release or deploy command, whatever a skill says? default: yes. without it, "nothing leaves without your yes" is a rule the agent follows, not one the app enforces.
7. **parallel agents.** default from what you measured (cook reads ram, a running docker vm and free disk every time). ask only if they run several sessions at once or a heavy local stack.

## 2. install

run the installer with a flag for every answer. you have no terminal, so it asks nothing and anything you leave out is a no.

```
bash ~/.claude/workflow/install.sh --dry-run --yes --with-pstack --with-brain --with-permissions --gitignore     # mac, linux, wsl
powershell -ExecutionPolicy Bypass -File $HOME\.claude\workflow\install.ps1 -DryRun -Yes -WithPstack -WithBrain -WithPermissions -Gitignore   # windows
```

- `--with-pstack` / `--no-pstack` per answer 2, `--with-brain` / `--no-brain` per answer 3, `--with-permissions` / `--no-permissions` per answer 6.
- `--gitignore` adds the per repo notes files (`.claude/CLAUDE.md`, `log.md`, `tbd.md`, `plans/` and the rest, never all of `.claude/`) to their global gitignore. it touches git config, so ask.
- `--with-permissions` merges the ask list in `setup/permissions.json` into `~/.claude/settings.json`. everything already in that file stays, and the old file is copied to `~/.claude/workflow-backups/` first. the rules match how a command starts, so `git push` asks and `git -C <dir> push` or a push through `gh api` does not: it is a second lock, the first is still the rule in `RULES.md`.
- `--with-hooks` (mac and linux, needs `jq`) adds a hook that installs missing `node_modules` before a command that needs them, the fix for a fresh clone answering "command not found". offer it to anyone who works in node repos, and say what it does: it runs the project's own install, postinstall scripts included, in any repo the agent runs a node command in.
- a file they did not touch is updated. a file they edited is kept and named in the output. `--force` replaces it and moves their copy to `~/.claude/workflow-backups/`. ask before `--force`, and read what they changed first: it probably belongs in `RULES.local.md`.

show them the `--dry-run` output, then run it without `--dry-run`. the installer is short and commented: read it if they want to know exactly what it does.

## 3. tailor

one file: `~/.claude/RULES.local.md`. the installer created it, never writes it again, and it wins over `RULES.md`. fill its sections from the answers. never edit an installed skill or `RULES.md`: an edited file stops getting updates.

| section in `RULES.local.md` | gets |
|---|---|
| name | their name if they asked for it. empty keeps "the user" |
| models | the current models their plan has: one strong model for every seat, and a second model family for the major seats only if they have one |
| git | what differs from the shipped strictness, per answer 4. empty keeps it |
| voice | per answer 5 |
| parallel agents | a lower ceiling, only if they asked. the disk floor (8 gb free before a worktree) stays. already under it: tell them worktrees stay off until they free space |
| extra steps | anything they want run before a task, before `/ship` or after a push, and strings that must never leave the machine |

pstack on: `~/.claude/skills/pstack/models.md` is theirs too, created once and never written again. it ships with every role on `inherit-parent`. put the same model names there only if they want a role pinned.

keep the substance. do not write anything into `RULES.local.md` that softens "nothing leaves without your yes", "git is never touched without a yes that specific time", "hand tests always" or "a checkable finish line", unless they asked for exactly that in answer 4. those are the point.

### they installed before 1.1.0 and tailored the old way

the old setup edited `RULES.md` and the skills in place. `install.sh --status` lists those files as edited. move what is theirs into `RULES.local.md`, show them the result, then run the installer with `--force`. their old copies are in `~/.claude/workflow-backups/`.

## 4. prove it

say what you ran, not what you read.

1. `ls ~/.claude/skills` lists every skill you installed.
2. `grep -n '@RULES' ~/.claude/CLAUDE.md` shows both imports, `@RULES.md` then `@RULES.local.md`, and `bash ~/.claude/workflow/install.sh --status` says 0 behind.
3. `ls ~/.claude/tools/responsive-probe.js ~/.claude/tools/probe-test.mjs ~/.claude/tools/brand-check.mjs ~/.claude/tools/ref-read.mjs ~/.claude/tools/ref-check.mjs ~/.claude/tools/record.mjs` lists all six.
4. pstack yes: `claude plugin list` shows pstack.
5. brain yes: `ls ~/vault` shows `HOME.md`, `now.md`, `projects/`.
6. permissions yes: `grep -n 'git push' ~/.claude/settings.json` shows the ask rule.

then hand them this, numbered:

1. quit and reopen claude code. skills and rules load at session start.
2. make a throwaway repo: `mkdir t && cd t && git init && printf 'teh readme\n' > README.md && git add -A && git commit -qm init`. type `/initiate`. expect: the notes paths in `.git/info/exclude`, a `.claude/CLAUDE.md`, `.claude/tbd.md`, and `git status --short` showing none of them. broken if: a notes file shows as untracked, `.gitignore` changed, or it commits.
3. type `/cook fix a typo in the readme`. expect: one line naming the lane `quick`, a `fix/` branch, the fix in the main thread, no subagents, a numbered hand test, then the `/ship` block and a stop. broken if: it spawns agents, asks five questions, or commits.
4. type `/status`. expect: five lines or fewer, the first answering "done or not".
5. say yes to the `/ship` block. expect: it runs the numbered chain the block printed and nothing else, one commit under their git identity, no co-authored-by line (`git log -1 --format='%an <%ae>%n%b'`), a push only if a remote exists. broken if: it opens a pr or merges without that step in the chain, or touches main.

## 5. finish

five lines: what was installed, what was skipped and why, where the source lives (`~/.claude/workflow`), how to update (`bash ~/.claude/workflow/install.sh --yes`: it pulls the newest version, replaces what they did not edit and names what it kept), where their own settings are (`~/.claude/RULES.local.md`), and the one thing to try first: `/cook` on a real task.
