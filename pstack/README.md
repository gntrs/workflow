# pstack, optional

pstack is the engine cook can run on: open-pstack (MIT, `github.com/ericlitman/open-pstack`), a Claude Code plugin with playbooks for features, bug fixes, plans, reviews, arenas and long autonomous runs. it is installed as a plugin, pinned to one tag, never copied here, because a copy would load every skill twice.

- `install.sh` installs the pinned plugin and adds `@skills/pstack/models.md` to `~/.claude/CLAUDE.md`. safe to run again. setup copies `models.md` to `~/.claude/skills/pstack/models.md` so that import resolves.
- `models.md` says which model and effort each pstack role uses. pstack's roles only; cook's own agents use cook's table. swap names for whatever your plan has. fable lanes are optional.

the rules on top are in `RULES.md`, "pstack runs under these rules, not over them". where they disagree, RULES.md wins.

without pstack: cook's build lane is a short plan in chat, the main thread builds, one reviewer subagent reads it. `/deep` runs the same research, plan and run loop by hand, with `/loop` to wake. nothing else changes.

moving the pin: read the new tag's changes, check the playbooks RULES.md overrides (opening-a-pr, shipping, babysit, autopilot), then change `TAG` and rerun.
