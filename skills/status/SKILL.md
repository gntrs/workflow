---
name: status
description: Answers "all done? pushed? merged? deployed?" in five lines or fewer. Branch, ahead and behind, uncommitted files, the pr and its checks, the last deploy, open tbd items and whether a cooking entry is still open. Read only. Invoke when the user says "all done?", "pushed?", "merged?", "deployed?", "where are we", "status", or /status.
---

# status

five lines max. read only. never commits, pushes, merges or comments. the only network call that touches anything local is `git fetch`, which moves remote refs and nothing else.

## gather

skip what does not apply, never fail loudly:

1. `git branch --show-current`, `git status --short | wc -l`
2. `git fetch --quiet`, then `git rev-list --left-right --count @{u}...HEAD`. no upstream: "not pushed, no upstream".
3. `gh pr view --json number,state,isDraft,mergedAt,url,reviewDecision` and `gh pr checks`. no pr: say so.
4. a deploy host the repo uses (`.vercel/`, a netlify or fly config, a deploy line in `.claude/CLAUDE.md`): the newest deployment for main and for this branch. behind a login: "cannot check from here", never a guess.
5. the tbd: the brain's `~/vault/projects/<repo>/<repo>-tbd.md` if installed, else `.claude/tbd.md`. `grep -c '^- \[ \]'`, plus how many sit under `## the user, now`, and whether a `## cooking` entry is still open. no tbd file: drop the line.

## answer

```
not done: 2 commits not pushed, e2e failing
branch  feat/x · 2 ahead, 0 behind · 3 files uncommitted
pr      #41 open, ready · checks 5/6, e2e red
deploy  main live at 1a2b3c4, 2h ago · this branch not deployed
tbd     7 open, 2 waiting on you · cooking entry still open
```

- the first line answers the question in the first word: done, not done, pushed, not pushed, merged, live. then the one move that is next.
- every number measured now. anything from memory says so.
- nothing under it. no prose, no offer.
