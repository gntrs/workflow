---
name: review
description: Fresh eyes on a plan, a diff or a running demo. One subagent with no prior context predicts the user's "no" and returns ship, fix these, or redo. The reviewer changes nothing; inside cook or bbq the caller fixes the findings unasked. Invoke on /review, "is this the best outcome", "second pair of eyes", "review the plan".
---

# review

the reviewer did not watch the work happen. that is the point. it gets the artifact and the bar, never the story of how it got here. its one job: predict what the user will say no to, before they see it.

## what goes to the reviewer

one subagent, read only, with `model` and effort set on the call from cook's table: the lane review row for a plan or one lane, the final review row for the whole or a demo. its prompt holds only:

1. **the target.** a plan: its path. one lane: its diff and its brief. the whole: the branch name and `git diff main...HEAD` plus uncommitted changes, or the pr number. a demo (from `/bbq`): the running url and the demo path, walked, not read.
2. **the user's words, verbatim**, copied from the `## cooking` entry in the tbd or the plan's first section, plus any reaction they gave to an earlier round. not a summary of them.
3. **where to read the bar:**
   - `~/.claude/RULES.md`
   - `design` for anything visual, `write` for anything a person reads
   - `playbook` for how the user works
   - the repo's `.claude/CLAUDE.md`
   - the taste file: `~/vault/taste/` if the brain is installed, else `.claude/taste.md`. with the brain, also the repo hub `~/vault/projects/<repo>/<repo>.md`
4. **the question:** predict the user's no. is this the best outcome for what they asked, or just a working one.

nothing else. no transcript, no "here is what we tried", no defence of choices. if the reviewer needs to know why, the code or the plan should already say.

## what the reviewer is told to do

- run it, do not just read it. tests, the build, the app if it can start. say which.
- check the ask against the result line by line. missing, extra, or misread.
- hunt the edge case most likely to bite: empty, twice, offline, phone width, the slow path.
- check taste: does it look and read like what the user ships, or like a generic ai page. what can still go.
- check rules: no ai authorship, no em dashes in anything a person reads, nothing outward done without the user, hand tests present, the sweep for front end.
- a plan: also whether the exit predicate would catch the failure, and whether the riskiest phase runs first.
- return:

```
verdict: ship | fix these | redo
the user's likely no: one line, in their register
why: one or two lines
fix:
1. file:line, what is wrong, what right looks like
2. ...
not checked: what it could not run and why
```

`redo` means the approach is wrong, not the code. it says what approach instead.

## then

the reviewer changes nothing: no edits, no commits.

- **inside a cook or bbq run** this skill runs without the user asking, and the caller does not stop on the verdict. each finding goes to the builder that owns those files and is fixed or argued, without asking. the verdict and what was done with it go into the `reviewed:` line of the recap.
- **called by the user on its own:** show the verdict as returned, with one line on top only if you disagree with it, and why. start no fix. the user says which items to take, then it goes back through `/cook`.
