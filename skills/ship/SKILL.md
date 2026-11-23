---
name: ship
description: Pre-flight before anything leaves the device, the public text, every file, real test output, hand tests, the chain a yes runs, then stop. Runs that chain only on the user's yes. Invoke before any push, pr, pr comment, merge, release, publish or deploy, or on "ship it", "push it".
---

# ship

nothing leaves this device without the user's yes, given now, on the device. this command prepares that decision, prints the chain a yes would run, stops, and only after a yes runs exactly that chain. it never opens a pr, merges or deploys unless that step is in the chain the user said yes to.

produce one block the user can read top to bottom. its first line says whether a fresh review ran and its verdict: `reviewed: yes, cold, fix these, all taken` or `reviewed: no`. then what goes public. everything under it is the evidence, and the chain closes it.

## 1. the text

write what would actually be posted: the commit message, pr description or pr comment, whichever this is going out as.

- the user's voice per `write`. lowercase, short, direct.
- zero em dashes.
- no ai attribution, no co-authored-by, no tooling mention, no "in this session".
- never claim more than was verified. if something was not run, it does not appear here as done.
- what changed and why, not how clever it was.

this part becomes public, so write it properly rather than dumping a changelog. the user reads it, edits it if they want, and only then does it go anywhere.

## 2. everything that was done

under the text, the full record. no summarising, no "and 4 more files".

- `git status --short` and `git diff --stat`, every file listed.
- `git log origin/<branch>..HEAD --oneline` so the commits going out are named. no upstream yet: say so and list all local commits.

## 3. what was tested, with the real output

detect the scripts from `package.json` or the project's equivalent and run them: test, typecheck, lint, build. this is cook's full verify tier.

- paste the actual output. not "tests pass".
- a script that does not exist: say which and that it does not exist. never skip one silently.
- a suite that self skips without a local service: say how many skipped and why. a skip is not a pass.

## 4. hand tests

numbered steps. required, not conditional on the suite failing. for each: what to run or click, what they should see, what would mean it is broken. cover the path a real user takes through what changed, plus the one edge case most likely to bite. if it cannot be followed without asking a question, it is not tight enough.

## 5. what was not verified

name it plainly. anything read but not run, inferred but not measured, or untestable from here (login walls, deploy protection, a missing local service).

## 6. where this goes

target branch, what deploys from it, and the live url if a push to it is a deploy. say "a push to this branch is live" in those words when true.

work goes out on its own `feat/`, `fix/` or `chore/` branch and reaches main through a pull request. name the branch, say whether ci runs on a plain branch push or only once the pr opens, and say what main needs before a deploy from it.

## 7. safety checks

- `git ls-files | grep -iE 'env|key|secret|pem'` and confirm nothing from that list is staged.
- never print more than 4 characters of any secret value.
- working notes, research, trackers, `.env` files and the notes files in `.claude/` (per `/initiate`) are not going out. `AGENTS.md` and `CLAUDE.md` only if the repo already commits them as the team's convention.
- confirm the notes files are ignored here (`git check-ignore .claude/tbd.md`). if not, flag it before anything else.
- `git config user.name` and `git config user.email` are the user's own identity for this remote. if they look wrong, say so now, not after the commit.
- a `never send` list of strings in `~/.claude/RULES.local.md` or the repo's `.claude/CLAUDE.md` is grepped against everything going out: the text, the diff, new files, commit messages. a hit stops the block until the user says what to do.

## 8. the chain, then stop

close the block with what a yes runs, numbered, one action a line:

```
on your yes:
1. commit the 3 files above with this message
2. push feat/export-csv
3. open the pr, base main
4. merge (squash) when every check is green
```

- commit and push are the default chain. a pr only if the user asked for one. a merge only if they named it, with the method the repo uses (its `.claude/CLAUDE.md`, else the host's settings).
- one yes covers exactly this chain, once. a later yes covers nothing until a new block prints a new chain. no chain printed: one yes is one action.
- a deploy goes in a chain only when the user named it and the repo's `.claude/CLAUDE.md` says how. the one other case: a `/bbq` run may print a preview deploy, never production, as the last step, on a host cli that is already logged in.

print the block and wait. run nothing, even if the user approved a similar thing earlier in the session. a yes for one thing is not a yes for the next one.

## 9. on the user's yes, run the chain

only after a yes to this block, in this session, on this device. a relayed yes is not one. the printed steps in order, nothing more, and stop at the first failure or the first thing not in the chain (a hook asking for input, a rebase, a review requested): report it and wait for a new yes.

1. confirm the branch: `git branch --show-current`. on main or the prod branch: stop and ask, never commit there unless the repo's `.claude/CLAUDE.md` records that standing exception.
2. stage only the files listed in section 2: `git add <each path>`. never `git add -A` or `git add .`. check `git status --short` shows no notes file or anything from the safety list staged.
3. commit with the approved text, byte for byte, as the user's configured git identity: `git commit -F <file with the approved message>`. no `--author` override, no `Co-Authored-By` trailer, no tool mention. if a commit hook rewrites or rejects it, stop and show the output.
4. no remote (`git remote` prints nothing): say so and stop after the commit.
   push the feature branch: `git push -u origin <branch>` the first time, `git push` after. never `--force` unless the user said those words for this push, and then `--force-with-lease`. a push rejected for the email address: stop, and offer the host's noreply address per `/initiate` step 5.
5. paste the push output, `git log -1 --format='%h %an <%ae> %s'` and `git status -sb`, so the user sees what went and as whom.
6. a pr only if the chain has it: `gh pr create --title <approved> --body-file <approved>`, base main. paste the url.
7. a merge only if the chain has it: `gh pr checks <n> --watch`, then, every check green, `gh pr merge <n>` with the printed method. any red, a check that never finishes, a conflict or a required review: stop and report. never `--auto`, never `--admin`, never force. paste `gh pr view <n> --json state,mergedAt`.
8. the log entry: date, branch, the short sha, pushed, the pr url if any, merged or not, what is open. the tbd updated. the brain if installed (`~/vault/projects/<repo>/<repo>-log.md`), else `.claude/log.md`.

after a deploy the user ran or approved, verify the served artifact (fetch the live page or bundle and grep for a string from this change), not the green checkmark. hosts rehash chunks, so comparing hashes proves nothing. a production deploy can get a public domain even when previews sit behind a login: after any prod deploy, list the deployment's domains (the host's cli or dashboard) and open each one logged out to see what is public. merge and deploy runbooks live in `playbook`.
