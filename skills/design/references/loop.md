# the loop that lands

the process from [SKILL.md](../SKILL.md) section 3, with the briefs. it is the round that worked after several that did not: stop guessing, measure what is real, show a few live options, let the user pick, then hold every builder to the pick and cut.

## why rounds fail

the failing pattern is "build a guess, show it, get corrected", five times. each round fixes the last "no" and adds a new one. the loop below removes the guessing:

1. **the user's own saves and screens, read first.** their boards, liked posts, the screens they already ship. one look at what they saved often answers the biggest question (dark or light, dense or airy) before anything is built.
2. **one named real product per surface,** opened and measured, never recalled. a sidebar measured off one app, a thread view off another, an admin table off a third. row heights, padding, sizes, weights, colors, written down. a product behind a login: the user's logged in browser, or its shipped css, or values marked inferred.
3. **2 or 3 live options on one axis,** with the measured ref shots above them. the user picks by looking, not by reading.
4. **the pick goes into `brand.md`,** and from then on every builder works from that file.
5. **one fresh agent per surface,** one shared brief. fresh means no history of earlier rounds to defend.
6. **the fresh reviewer predicts the "no"** and checks the screen against `brand.md`.
7. **cut, then sweep.**

a stop gate before the pick holds the order: refs measured, options live, sweep clean, then stop for the user. nothing ships past it until they choose. a "just go" builds on the starter and leaves the picker live.

## reading a reaction

- "better, but more" means keep the direction and push it. do not branch.
- "not better" twice means the loop was skipped somewhere. run the fresh reviewer.
- "still" means the last fix did not land. check the served build before fixing again.
- a label that is "off": remove it, do not restyle it.
- "looks good, now do the phone": the desktop is approved, the phone is the next gate.

every reaction goes into the taste file the moment it arrives, and into the next brief verbatim.

## builder brief

one shared brief, one copy per surface with its own files filled in. short, in a file the builder reads.

```
surface: <name>
you own: <exact files>. write nothing else.
build alone with: <command that builds only this surface, if there is one>
brand: <path to brand.md>, read only. use its tokens only. a value it lacks:
  derive it from the nearest token and list it with the reason in your report.
  the lead writes it under ## proposed. the token files are brand too: do not
  add or change a value there. kit files are read only: a kit bug goes in
  your report, the lead fixes it once for every screen.
kit: build from brand.md ## components. a new element goes in your report,
  never drawn quietly. every new screen draws empty, loading, error and full.
copy from: <the ref measured for this surface, with its numbers>
the user's words, verbatim:
  - "<reaction>"
  - "<reaction>"
defaults and taste in force: ~/.claude/skills/design/SKILL.md section 6, minus what
  brand.md overrides, plus <taste file path>
data: only what <api, table, fixture> actually returns. no invented rows or kinds.
before you report: build, this surface's flow, the probe at 3 sizes,
  a screenshot at a phone and a desktop size.
report: files changed, probe output pasted, proposed values, what you could not check.
brand check: node ~/.claude/tools/brand-check.mjs <brand.md> [changed files], report pass or the listed hits
```

## reviewer brief

a fresh agent. it gets only these, never your story of the build.

```
you are reviewing a design before the user sees it. your job is to predict what
they will say "no" to, and to say where it departs from the brand.

the artifact: <preview url or files>
the user's words, verbatim, newest first:
  - "<reaction>"
the taste file: <path>
brand: <path to brand.md>

1. open it at a phone size and a desktop size. use it.
2. list every place the user will say "no", in their voice, with the screen and
   the element. order by how sure you are.
3. compare it to brand.md: color roles (accent only on the mark, the primary
   button and the selected state), type roles, radius, voice in the copy, logo
   use, every brand-check-ignore line in the diff and its reason, kit use (a hand-rolled button, field, row or state that duplicates a
   ## components row is drift; name every element not in the kit), and
   gradients (built from brand colors still passes the script, so check it
   here). name each departure, and call it intended (a proposed value, an
   approved change) or drift.
4. check the sweep covered every state: every screen, open menus and sheets,
   empty, loading, error, long content. name any state it skipped.
5. check true data: any row, kind, metric or number the backend does not have.
6. check less: anything that could go.

verdict: ship, fix these (numbered), or redo (one paragraph why).
```

## fixing in parallel

split the findings by file owner. each builder gets only its findings and its files. drift goes to the user once (code or brand.md, which is right), then to the builder that owns the file. after all land: the fast check, screenshots, a new private preview. if the reviewer said redo, go back to the options with the user, not to the builders.
