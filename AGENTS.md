# AGENTS.md

for any coding agent that opens this repo, Claude Code or not.

## you were asked to set someone up

read [SETUP.md](SETUP.md) and follow it. it looks at the machine, asks once, installs into `~/.claude/`, tailors, proves it worked and ends with a hand test. do not copy files blind.

## you were sent only the link

clone it first, then read SETUP.md:

```
git clone --depth 1 https://github.com/gntrs/workflow.git ~/.claude/workflow
```

## you are working on this repo itself

markdown skills, one rules file, two installers and one probe script. no build.

- skills live in `skills/<name>/SKILL.md`, depth in `skills/<name>/references/`. frontmatter `name` matches the folder.
- `rules/RULES.md` is always on. a skill never contradicts it.
- generic only. no names, emails, hosts, private projects or personal paths.
- lowercase, direct prose. zero em dashes.
- `bash scripts/check.sh` before you hand back. it must print `ok`. put your own private strings in `.claude/denylist.txt` (gitignored, one regex per line) and it scans for them too.
- after changing `tools/responsive-probe.js`, run `node tools/probe-test.mjs` (needs playwright with chromium: `npx playwright install chromium`, or point `PLAYWRIGHT_MODULE` at an installed copy) and show it still catches the planted cases.
- after changing an installer, run it into a throwaway home: `HOME=$(mktemp -d) bash install.sh --yes --dry-run`, then without `--dry-run`, twice.

## the rules that hold here too

- no commit, push, pr or merge without the user's yes that specific time.
- no ai or tool authorship in commits, prs or files.
- end with a numbered hand test plan: what to run, what to see, what means broken.

## without slash commands

the skills are plain markdown. an agent with no skills support reads `skills/cook/SKILL.md` when the user says "cook this" and follows it. everything else follows from there.
