# changelog

newest first. the installer prints the version it had and the one it wrote.

## 1.1.1

- the readme says what this is in one line under the hero, so the page has words before "install".
- `setup/known-hashes.txt` now holds the 1.1.0 files too.

## 1.1.0

updates work now. before this, running the installer again skipped every skill that differed from the new one, whether you had edited it or not.

- **`/bbq`, the fast build.** for a hackathon, a prototype or a quick iteration: no questions, a time box, the demo path end to end first, fakes behind one seam, builders split by surface on a contract, one cold review of the demo, a debt list at the end.
- **big prs and single features are faster.** the build lane and the deep lane's phase builders no longer go through pstack's full feature playbook (a design panel on every job, a worktree per delegate, a commit per unit, its own pr flow). everything independent starts in one message, a ten line plan, builders split by files, high effort only on the plan and the final review, pstack tools by name. the deep lane keeps pstack for the long loop and its state.
- **it reviews itself.** on build and deep the cold review runs and its findings are fixed without being asked.
- **the installer tracks what it installed.** `~/.claude/workflow-manifest` holds a hash per file. on the next run a file you did not touch is replaced, a file you edited is kept and named. an install from before this version is recognised from the hashes of every file ever shipped, so it updates too.
- **backups leave `skills/`.** `--force` moves your copy to `~/.claude/workflow-backups/<date>/`. the `<name>.bak-<date>` folders older versions left inside `skills/` are moved there on the next run.
- **your settings have their own file.** `~/.claude/RULES.local.md` is created once and never written again. name, model names, voice, git changes and extra steps go there, and it wins over `RULES.md`. installed skills are no longer edited by setup.
- **`--with-permissions`.** merges an ask list into `~/.claude/settings.json`, so claude code stops and asks before a push, merge, pr, release or deploy command. the old file is backed up.
- **`--with-hooks`.** a hook that installs missing `node_modules` before a command that needs them. mac and linux, needs `jq`.
- **`--status`** says what you have, what main has, what is behind and what you edited. **`--uninstall`** moves what it installed to the backups folder and takes its lines out of `CLAUDE.md` and its hook out of `settings.json`.
- **merge.** the agent may merge, only on a yes that names the merge. a numbered chain printed in the `/ship` block can be approved with one yes, once.
- **models.** no model names in the skills. one strong model for every seat, a second family only for the major seats, names in `RULES.local.md`.
- **the size sweep** adds 2560 wide and a new fault, `off-center`: a tall column with a max width and no auto margins, glued to the left on a wide screen.
- **every recap and `/ship` block** says first whether a fresh review ran and what it said.
- **lighter.** `design/SKILL.md` went from 3,496 words to 1,718, the rest moved into its references. the skill descriptions that load on every turn went from 989 words to 504.
- **pstack** pin moved from v1.5.0 to v1.21.0, and an existing install moves with it. `skills/pstack/models.md` ships with every role on `inherit-parent` and is yours: created once, never written again.
- **a skill folder that is a link** to your own copy is left alone.
- **the installer pulls** when it runs from `~/.claude/workflow`, so running it again is the update.
- **ci.** the installer cases on linux, mac and windows, the repo check and the tool self tests. playwright is pinned in `package.json`.

### if you edited your installed copy

setup used to tailor `RULES.md` and the skills in place. those files count as edited, so the installer keeps them and names them.

1. run `bash install.sh --status` to see which files you edited.
2. move what is yours (name, models, voice, git lines) into `~/.claude/RULES.local.md`.
3. run `bash install.sh --force`. your old copies are in `~/.claude/workflow-backups/`.

## 1.0.0

the first public version: cook, deep, ship, review, status, initiate, design, write, playbook, the optional brain, the size probe, the brand check, the ref reader and the recorder.
