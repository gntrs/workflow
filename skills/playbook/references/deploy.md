# git, release and deploy

part of `playbook`. the rules themselves (no git without a yes, nothing outward without a yes, one branch per feature, no ai authorship) are in RULES.md; this is the depth. per repo deploy runbooks live in that repo's `.claude/CLAUDE.md`.

## branching

every piece of work gets its own branch off main: `feat/`, `fix/` or `chore/` plus a short kebab topic (`feat/export-csv`, `fix/query-filters`, `chore/ci-test-gate`). one per session or feature unless the user says otherwise. two features in one session are two branches, so each pull request reads as one thing. `main` is what deploys. a repo the user keeps on main alone stays there until they say.

check what ci runs on before relying on it: if it runs on pull requests and pushes to main only, a pushed branch shows nothing until its pull request opens.

## git is never touched without a yes

a yes once is not a yes next time, auto mode included. write the files, run the build, report exactly what is ready and which files changed, then wait. staging is fine; recording in git is the user's call every time. the one exception is a **run grant** for commits during a long autonomous run (`/deep`).

## nothing leaves without the user's say-so

prepare it fully, show the exact file list and what was excluded, wait. `/ship` does this.

**before anything goes to a client or a public repo, strip:**
- the user's own notes and time logs
- `AGENTS.md`, `CLAUDE.md`, `.claude/`, anything that reads as ai instructions
- internal-only surfaces nobody asked the recipient to have (an admin console, a debug page)
- `.env`, generated files, unused starter assets
- anything personal

a public repo gets a stricter pass: no names, emails, home paths, host or machine names, keys, private project or client names, real rows, internal notes. made up data and `example.com` only. scan every diff and new file and say it was scanned. a hit already in history is never rewritten on your own: list it with the sha and let the user decide.

then run the check in front of the user: `git status --short`, then `git ls-files | grep -iE "env|key|secret|pem"`. explain what a step does rather than just running it. git history is permanent and a deleted file is still readable in it; the only fix for a leaked secret is rotating it.

## commit messages

git history is read by clients and teammates, so it sounds like a person: plain, direct, no marketing, no filler. every subagent that writes a commit message gets this.

- **say what changed and why it mattered.** "the document preview failed every single time, and said the details were wrong" beats "fix preview validation".
- **subject is a sentence a person would say.** match the repo's existing convention; with none, no prefixes, no ticket refs, no scopes in brackets. sentence case, no full stop.
- **no em dashes, anywhere.** comma, full stop or colon.
- **body explains the reasoning**, wrapped near 78 columns, full sentences. if the fix is subtle, say what was tried and why this shape.
- **never claim more than was verified.**
- **no ai attribution of any kind.** no Co-Authored-By, no "generated with".
- **one commit per idea.** no "various improvements".

same standard for the tree: no stray scratch scripts, no `.tmp` files, no commented out blocks, no dead exports. delete rather than comment out.

## main is sacred

only push to main when everything is green: tests, typecheck, style, build, the demo runs. main is the branch someone can clone blind and trust. never push to main to "save progress", that is what the branch is for.

## the noreply author, per clone

github can reject pushes signed with a private email (`push declined due to email privacy restrictions`). when the global config uses one, set the noreply address in each clone before the first commit: `git config user.email "<id>+<user>@users.noreply.github.com"`. a fresh clone has none. after a rejected push: set it, `git commit --amend --reset-author --no-edit`, ask, push again. `/initiate` sets it.

## versions

MAJOR.MINOR.PATCH:
- first number stays **0** until the user is genuinely proud of it. 1.0.0 is a statement, never bumped without them.
- second number on a **big change**, meaningfully different or better.
- third number for **small updates**, fixes, polish.

## every release gets a github release note

a CHANGELOG entry is not a substitute: the changelog is read by people already in the repo, the release note by people deciding whether to enter it.

1. **compatibility and the install line first.** does it break the wire or the api, can an old version talk to a new one. then the install command.
2. **a two column table, previous release against this one**, real measured numbers, bold only what changed. unchanged rows stay, an unchanged row is evidence too.
3. **"what we did not have, and now do."** bold lead-in per item, then the reasoning. say what the situation was before.
4. **"what got more expensive."** any regression with both numbers and why the trade is right. never omit one.
5. **"what we still do not have."** a release note that only lists wins is an advertisement. this section is why the rest gets believed.

check for skipped releases first: `gh release list` against `git tag -l`. when there is a gap, span the table across it and say so. publishing a release is public: draft it to the scratchpad, show the user, `/ship`, wait for go.

## verify the deploy

- before saying anything is live, verify the deployed artifact. check the pipeline exists and fired.
- the served bundle is the truth: fetch the page, resolve the real chunk names, grep for a string only this round introduced. hosts rehash chunks, so comparing local hashes to live ones proves nothing.
- a cli deploy (`vercel --prod` and the like) ships the local directory, dirty tree included. prefer the git hook where it works.
- a changed env var reaches nothing until a redeploy. check the newest deployment postdates the edit before testing it.
- give the user a deploy url after every push when previews are per commit, since an old link silently serves the old build.

## a PR comment is the user speaking

it goes out under their name, so it is drafted, shown and sent only on their word.

- **never hand a reviewer's requested change back to the reviewer.** if it really should not be done, ask the user, then argue it with a reason.
- **check the repo before asserting a blocking item.**
- **run it, or label it unverified in the same sentence as the claim.** a careful reading is not a green run.
- **short.** length reads as a bot and buries the one line that mattered.

draft to the scratchpad, show the user, wait. then send the exact text they approved, byte for byte, posted from that file rather than retyped. no tightening, no typo fix, no extra line thought of while posting. anything that changes after the yes needs a second yes.
