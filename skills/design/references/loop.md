# the loop that lands

the process from [SKILL.md](../SKILL.md) section 3, with the briefs.

## logging reactions

where, when and the format: [SKILL.md](../SKILL.md) section 3b. the same "no" twice becomes a rule there.

reading a reaction:

- "better, but more" means keep the direction and push it. do not branch.
- "not better" twice means the loop was skipped somewhere. run the fresh reviewer.
- "still" means the last fix did not land. check the served build before fixing again.
- a label that is "off": remove it, do not restyle it.
- "looks good, now do the phone": the desktop is approved, the phone is the next gate.

## builder brief

one per screen. short, in a file the builder reads.

```
screen: <name>
you own: <exact files>. write nothing else.
build alone with: <command that builds only this screen, if there is one>
copy from: <what the user owns, with measured values> and brand.md
the user's words, verbatim:
  - "<reaction>"
  - "<reaction>"
hard no's: skills/design/SKILL.md section 5, plus the taste file
data: only what <api, table, fixture> actually returns. no invented rows or kinds.
before you report: the fast check (build, this screen's flow, probe at 3 sizes), a screenshot at a phone and a desktop size.
report: files changed, probe output pasted, what you could not check.
```

## reviewer brief

a fresh agent. it gets only these, never your story of the build.

```
you are reviewing a design before the user sees it. your job is to predict what
they will say "no" to.

the artifact: <preview url or files>
the user's words, verbatim, newest first:
  - "<reaction>"
the taste file: <path>
brand: <path to brand.md>

1. open it at a phone size and a desktop size. use it.
2. list every place the user will say "no", in their voice, with the screen and
   the element. order by how sure you are.
3. check the sweep covered every state: every screen, open menus and sheets,
   empty, loading, error, long content. name any state it skipped.
4. check true data: any row, kind, metric or number the backend does not have.
5. check less: anything that could go.

verdict: ship, fix these (numbered), or redo (one paragraph why).
```

## fixing in parallel

split the findings by file owner. each builder gets only its findings and its files. after all land: the fast check, then screenshots, then a new private preview. if the reviewer said redo, go back to step 3 of the loop with the user, not to the builders.
