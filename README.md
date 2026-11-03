<!-- agents: to set this up for someone, run `git clone --depth 1 https://github.com/gntrs/workflow.git ~/.claude/workflow` and follow SETUP.md in it. -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/hero-dark.svg">
  <img alt="workflow: one door for every task. /cook sizes it, builders run in parallel, each lane is reviewed as it lands, and nothing leaves until you say yes." src="assets/hero-light.svg">
</picture>

a way of working with Claude Code that has shipped real products, packaged so you can have it in two minutes.

you type `/cook <task>`. it sizes the task, picks the lane, runs up to 4 agents in parallel, reviews each piece the moment it lands, shows you the app working, hands you a numbered test plan, and stops before anything leaves your machine.

## install

paste this into Claude Code:

```
set up https://github.com/gntrs/workflow
```

it clones the repo, reads [SETUP.md](SETUP.md), looks at your machine, asks you about six things once, installs into `~/.claude/`, tailors it to your ram and models, and proves it worked.

no agent, just a shell:

```bash
curl -fsSL https://raw.githubusercontent.com/gntrs/workflow/main/install.sh | bash -s -- --yes
```

windows:

```powershell
git clone --depth 1 https://github.com/gntrs/workflow $HOME\.claude\workflow
powershell -ExecutionPolicy Bypass -File $HOME\.claude\workflow\install.ps1
```

flags: `--with-pstack`, `--with-brain`, `--gitignore`, `--force`, `--dry-run` (powershell: `-WithPstack`, `-WithBrain`, `-Gitignore`, `-Force`, `-DryRun`).

## what it fixes

| without it | with it |
|---|---|
| the agent says "done" and it isn't | every task has a finish line you can check, and ends with the app actually run |
| one long chat that forgets everything after a compact | state lives in a file, and a fresh agent picks it up from there |
| a review at the very end that sends everything back | the plan is read cold before building, each piece is reviewed as it lands |
| a commit, push or deploy you never asked for | nothing leaves without your yes, that time, for that thing |
| ui that looks like every other ai ui | real references measured first, your brand used, less every round |
| a simple fix buried in ceremony | quick things run in the main thread, no agents, no plan |

## how it runs

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/loop-dark.svg">
  <img alt="your task goes to /cook, which picks quick, build or deep. every lane ends with a branch, a real run, a hand test, the size sweep and notes, then /review predicts your no, then /ship waits for your yes." src="assets/loop-light.svg">
</picture>

| lane | looks like | runs |
|---|---|---|
| **quick** | a typo, a color, a config flip | the main thread does it. no agents |
| **build** | one feature or bug in code you know | up to 2 helpers: an explorer and a cold reviewer. the plan is read before the build |
| **deep** | unfamiliar code, broke twice, or "run until it's done" | research, a plan with a checkable finish line, your read, then up to 4 agents in flight, builders and reviewers together, each builder on its own files while a coordinator plans, reviews and integrates |

what makes it fast:

- **review earlier.** a cold read of the plan before anyone builds, a cold read of each lane the moment it lands while the others still run, then the final one. findings land while they are cheap.
- **the coordinator doesn't build.** on deep runs it plans, briefs, integrates and reviews, so its context stays small and doesn't compact mid run.
- **a new ask gets its own lane.** it doesn't wait behind the batch that is running.

on build and deep, cook prints a `/goal` line with a measured finish line, so the session can't stop short. it always ends at `/ship`. the always on rules behind all of it are in [rules/RULES.md](rules/RULES.md).

## the skills

| skill | what it does | say |
|---|---|---|
| [`/cook`](skills/cook/SKILL.md) | the one door. sizes any task, picks lane, models and caps, ends every lane the same way | cook, build this, fix this |
| [`/deep`](skills/deep/SKILL.md) | the deep lane: research, plan, the gate, a long autonomous run, proof | deep, run until done |
| [`/ship`](skills/ship/SKILL.md) | pre-flight. the exact text that would go public, every file, real test output, hand tests. commits and pushes only after your yes | ship it, push it |
| [`/review`](skills/review/SKILL.md) | one fresh agent reads the work cold and says ship, fix these, or redo | is this the best we can do |
| [`/status`](skills/status/SKILL.md) | done? pushed? merged? in five lines | all done? |
| [`/initiate`](skills/initiate/SKILL.md) | sets up a repo for agents: private notes in a gitignored `.claude/` | initiate |
| [`design`](skills/design/SKILL.md) | the front end method. loads on its own before any ui work | |
| [`write`](skills/write/SKILL.md) | anything a human reads, and the tells that make text read as ai | |
| [`playbook`](skills/playbook/SKILL.md) | swarm shapes, debugging, research, the mistake ledger | |
| [`/brain`](skills/brain/SKILL.md), [`/dream`](skills/dream/SKILL.md) | optional. a notes vault every repo writes to, and its cleanup | remember this, clean the vault |


## design that doesn't look generated

the [design](skills/design/SKILL.md) skill is the loop that kept landing:

1. **references first.** open real products that do this well and measure them. copy what you already own before inventing anything.
2. **your brand.** it finds your tokens, theme or site and writes a `brand.md`. none yet: it builds one with you from three references you pick.
3. **your words are the spec.** your reactions go into the builders' briefs verbatim, never softened.
4. **a reviewer predicts your no.** a fresh agent gets only the screen, your words and your taste file, before you look.
5. **less.** one view where there are two, a plain word instead of a badge, nothing the data doesn't back.
6. **measured, then looked at.** [responsive-probe.js](tools/responsive-probe.js) lays the app out at every size: overflow, targets under 44 px, controls stranded off screen.

## the brain, optional

say yes in setup and you get `~/vault`, an [Obsidian](https://obsidian.md) friendly folder where every repo keeps a hub, a log and an open items list, linked both ways. `/brain` answers "what did we decide" from it, `/dream` keeps it tidy. say no and each repo keeps the same notes in its own gitignored `.claude/`. the skeleton is in [brain-template/](brain-template/HOME.md).

## for agents

[AGENTS.md](AGENTS.md) for any agent opening this repo, [llms.txt](llms.txt) for a map. the skills are plain markdown, so an agent without slash commands can read `skills/cook/SKILL.md` and follow it.

## credits

- [pstack](https://github.com/ericlitman/open-pstack) (MIT) is the engine underneath: playbooks for features, bugs, plans and long runs. optional, installed as a plugin, never copied in.
- the deep lane follows Dex Horthy's talk "No Vibes Allowed": the context window is the lever, so progress goes into files at every boundary.

## license

[MIT](LICENSE)
