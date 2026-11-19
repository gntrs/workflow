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

a stop gate before the pick holds the order: refs read and `ref-check.mjs` clean, options live, sweep clean, then stop for the user. nothing ships past it until they choose. a "just go" builds on looks copied from products you found and read, and leaves the picker live.

## reading a reaction

- "better, but more" means keep the direction and push it. do not branch.
- "not better" twice on the same screen means the composition is wrong, not the details. stop patching and run three directions, below.
- "still" means the last fix did not land. check the served build before fixing again.
- a label that is "off": remove it, do not restyle it.
- "looks good, now do the phone": the desktop is approved, the phone is the next gate.

every reaction goes into the taste file the moment it arrives, and into the next brief verbatim.

## two "no"s: three directions

every patch keeps the composition, so the rejected layout survives every round. after the second "no" on the same screen the fixing stops and three new pages get built. this is step 3 of the loop with layout as the axis, except a reviewer picks and the user sees one.

not this:

- one "no" with a clear fix: fix it.
- a "no" about one label, one number or a line of copy does not count toward two.
- check the served build before counting the second "no". a stale build means they never saw the last fix.
- a small change on a screen they already approved: one builder, then the reviewer.

the steps:

1. **stop.** no third patch. say so in one line and start over.
2. **what it is for, in the user's words.** the one message where they say what they do with the thing, pasted whole. their core loop becomes the page. if they never said it, ask that one question.
3. **one brief in a file,** read by every builder and the reviewer: what it is for, the whiteboard marks verbatim when a board ran ([whiteboard.md](whiteboard.md#5-the-brief-from-the-marks)), right first and the wrong pile as the avoid list, every reaction verbatim, the rejected screenshots by path and named as rejected, your read of why marked as yours, `brand.md` and the rules in force, the three directions, how to check, what to report. real data is wired in before the first direction is built and the brief says where it loads from and which of it is real: sample numbers hide the layout problems that real ones show, a missing value, a price in cents, twelve items where the mock had six.
4. **three directions, each copied from its own read ref.** a direction is what the page is: a decision desk like one product, a gallery like another, a table like a third. each has its `## sources` row and evidence folder, read with `ref-read.mjs` before anyone builds. a direction with nothing real behind it is a fourth guess. a palette or a font is not a direction. each builder gets one, its own file, its own scratch folder and port, and sees nobody else's work.
5. **each builder looks at its own work.** every round: the fast check (section 7) and screenshots at a wide desktop (1920x1080 or the user's own screen), a laptop (1440x900) and a phone (390x844), opened and judged. at least three look and fix rounds, then the full sweep once before the report: chromium and webkit, overflow 0, targets under 44 px 0, text under 12 px 0. three builders and their browsers fill a laptop, so the sweep runs on a spare machine when there is one ([whiteboard.md](whiteboard.md#10-the-sweep-on-a-spare-machine)). the brief says it plainly: stop when the screenshots are good, not when the code runs.
6. **a fresh reviewer picks.** it has seen none of the earlier rounds. it takes its own screenshots, uses each page, picks one, runs the reviewer brief's checks on the pick and lists every "no" still coming, in the user's voice.
7. **one fix round on the pick,** by the pick's builder, or a fresh one with the brief and the list. then steps 9 and 10 of the loop: measure, look at the final screenshots yourself, cut, sweep.
8. **the user sees one page.** the other two stay beside it as files. the message that shows it says a fresh review ran and what it picked.

the agent count follows cook's cap. at 2: two builders, then the third. at 1 or with no subagents: the three one after another, each built from the brief alone without opening the others, and the pick as a separate cold pass with only the brief and the three files in front of you.

after a yes the composition is frozen: later rounds are one builder with a short round brief (what they said, what stays exactly, what changes, numbered) and the reviewer again. two "no"s on the pick means new directions, never a patch.

it costs about five agents and an hour before the user sees anything. that is the trade: one long round instead of more short ones that keep the rejected layout.

### directions brief

```
you are building one direction of <page> for <who>. it has been rejected
<n> times. the last word was "<reaction>".

what it is for, their words:
  "<the message where they say what they do with it>"
what they marked on the board, verbatim (when a board ran):
  right: <ref file> "<note>"   close: <ref file> "<note>"
  wrong, the avoid list: <ref file> "<note>"
what they said about the look, verbatim:
  - "<reaction>"
rejected: <screenshot paths>. open them. why it failed, my read, not their
  words: <one paragraph>. do not make another one of these.
brand: <path to brand.md>, read only. its tokens and its ## components kit.
rules: ~/.claude/skills/design/SKILL.md, <taste file>
data: <where it loads from, the fields, what is real, what is thin>

your direction: <letter and name>, copied from <product>.
ref: <its ## sources row> and <its evidence folder>. open the screenshots and
  styles.json first. copy its structure (layout, density, row and panel
  pattern), never its colors, logo or copy. scale and rhythm are yours
  inside that structure. no ref, or unread: stop and say so.

you own: <one file> and <scratch folder>. port <n>. write nothing else.
every round: the fast check, then screenshots at a wide desktop, a laptop
  and a phone size, opened and judged as the user would, each state clicked
  through. at least three look and fix rounds. the full sweep once at the end.
brand check: node ~/.claude/tools/brand-check.mjs <brand.md> <your file>
ref check: node ~/.claude/tools/ref-check.mjs <brand.md>
report: write it to <report path>: the file, the screenshot paths, the probe
  numbers and which were measured, brand and ref check results, the three
  decisions that matter, what is weakest, the copy that is yours. send back
  three lines: done or blocked, the report path, the weakest point.
```

### picking reviewer brief

```
three directions of one page were built from the same brief: <brief path>.
you have seen none of the earlier versions. files: <a>, <b>, <c>.
brand: <path to brand.md>. refs: its ## sources rows and evidence folders.

1. serve them and take your own screenshots at a phone and a desktop size.
   do not use the builders' screenshots.
2. use each one: pick items, change modes, type into fields.
3. for each: what the user will say "no" to, in their voice, most sure first.
4. pick one. say what to take from the other two, if anything.
5. on the pick, run checks 3 to 6 of the reviewer brief: brand.md, its ref,
   the states the sweep covered, true data.
6. list the fixes the pick needs before the user sees it, numbered.
write the full findings to <report path>. send back the pick and the list.
```

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
kit: build from brand.md ## components. an element the kit lacks: copy the
  ref's version of it and list it in your report, never drawn from nothing. every new screen draws empty, loading, error and full.
ref for this surface: <the ## sources row> and <its evidence folder>. open the
  screenshots and styles.json first. copy its structure (layout, density, row
  and panel pattern), never its colors, logo or copy. no ref, or unread: stop
  and say so, do not build from memory.
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
ref check: node ~/.claude/tools/ref-check.mjs <brand.md>, report pass or the findings
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
refs: brand.md ## sources, each with its evidence folder

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
4. open each surface's ref evidence beside the screen. a surface with no ref, a
   ref with no evidence or marked unread, or a structure that departs from its
   ref without a reason is a finding. so is any element in neither the kit nor
   the ref.
5. check the sweep covered every state: every screen, open menus and sheets,
   empty, loading, error, long content. name any state it skipped.
6. check true data: any row, kind, metric or number the backend does not have.
7. check less: anything that could go.

verdict: ship, fix these (numbered), or redo (one paragraph why).
```

## fixing in parallel

split the findings by file owner. each builder gets only its findings and its files. drift goes to the user once (code or brand.md, which is right), then to the builder that owns the file. after all land: the fast check, screenshots, a new private preview. if the reviewer said redo, go back to the options with the user, not to the builders.
