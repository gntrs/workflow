# audit: turning an inconsistent app into one system

for an app that already ships many screens that do not agree: five button recipes, twenty radii, greys that drift warm and cool. a new brand on top of that is one more layer nobody follows. count first, decide once, then build the foundation in an order that cannot break anything.

## 1. count what is there

`node ~/.claude/tools/brand-check.mjs --audit [brand.md] <src folder>` lists every distinct color, font family, radius, shadow, font size and weight in the code, with how often each is used and where. with a `brand.md` it marks each value in or off brand and gives the share of uses that are off. on a big app the list is long: write it to a file (`> audit.txt`) and read the summary lines at the end first.

then the parts a script cannot count, by reading the code: every place a button, field, caps label, status pill, selected state, card and empty state is drawn. one row per recipe, with `file:line`. "40 primary buttons in 22 recipes" is the finding that makes a kit obvious.

and contrast, measured from the pixels under real text, not from the token pairs.

## 2. name the causes, not the symptoms

three or four lines, each one a cause behind many findings: "small text is too light", "nothing is on a scale", "every screen rebuilds its own button". a list of 200 findings gets nothing decided. also write what is good and must survive the cleanup.

## 3. propose a closed set, with the cost

for each cause, one proposal: a token set, a scale, or one component, plus the map from old to new values ("14.5 snaps to 14, 19 to 20") and how many call sites each change touches. the owner answers numbered decisions in one sitting. each answer goes into `brand.md` tagged `(ruled)` with the date.

## 4. build the foundation, cheapest risk first

1. changes that move no pixel: rename to tokens, delete dead values.
2. text roles: which grey is body, which is meta, which is never text (placeholder, disabled, a chevron).
3. the type ramp, snapped.
4. one component per primitive: the button, the caps label, the status pill, the selected state. after this a hand-rolled copy is drift.
5. spacing, radius, elevation.

each step lands on its own, with the brand check clean and the sweep run. a decided value the code does not ship yet goes under "decided, not built" (see [brand.md](brand.md#gaps-and-drift)).

## 5. write it down twice, keep it in step

`brand.md` for agents and the check, a page for people if the team wants one (the brand kit page from the brandless path works). when they disagree, ask the owner which is right and log it under `## changes`. a change to a token changes `brand.md` in the same commit, or the check flags it.

## 6. count again after every round

fixes add drift: a cleanup round that fixes three findings can add seven. rerun `--audit` after each round and compare the counts to the last one. the numbers should only go down.

## the lint, when the project wants a harder gate

`brand-check.mjs` checks values in changed files. a project test in its own suite can add what values alone miss:

- a text color role that is never text (the faintest grey used as `color:` fails)
- a closed type ramp: font sizes only from the set, weights only from the set
- banned utility classes where the theme means something else
- every `var(--x)` resolves to something declared
- one primitive only: a caps label drawn by hand (uppercase plus tracking) fails outside its component
- every allowlist entry names the file, the exact line and why, and a stale entry fails

write the test so it fails on a planted case first, the same way `--self-test` does.
