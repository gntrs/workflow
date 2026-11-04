---
name: design
description: the front end design method. invoke before styling, laying out or animating anything a person will look at, web page, app screen, artifact, dashboard, mock, landing. covers building only from the user's brand (brand.md as the contract, checked by tools/brand-check.mjs) and from real products (competitors, similar software, the user's pics and files, read by tools/ref-read.mjs and gated by tools/ref-check.mjs), the five questions when there is no brand, the loop that lands a design, taste, "less", defaults a brand can override, type, color, motion, phone first and the size sweep with tools/responsive-probe.js. triggers, "design this", "make it look good", "redo the ui", "it looks like ai slop", "make it cleaner", "build the landing", "use our brand", "we have no brand", "/design".
---

# design

how to make a screen the user says yes to on the first look, not the fourth. most of it is not taste, it is method: nothing is invented. every screen is built from two real inputs, checked by two tools, and a fresh reader says "no" before the user has to.

- **the brand** gives the values and the parts: colors, type, radius, the element kit. `brand.md`, checked by `brand-check.mjs`.
- **a real product** gives the structure: layout, density, the sidebar, the row or thread pattern, motion. a competitor, similar software, the user's screenshots or files, read and saved as evidence by `ref-read.mjs`, checked by `ref-check.mjs`.

neither is optional. a confirmed brand still needs a real product behind each new surface, and a good reference never brings its own colors.

depth is in `references/`. where a rule says OPEN, the user decides. ask. five things under every rule here:

- **less.** every element carries information or it goes.
- **alive, never gated.** motion is ambient or answers the pointer.
- **one of each.** one accent, one radius, one face, one spring, one ease.
- **phone first.** people review on their phones, so the phone layout is the real one.
- **their words stay theirs.** cut chrome freely, never reword what the user wrote.

## 1. brand first

the brand is read before anything is drawn. a brand you invent and the user did not pick is one more thing for them to say "no" to.

**`brand.md` already exists** (root, `.claude/` or the brain): read it first and do not rewrite it. `confirmed`: build to it. `draft` or `default, not chosen`: show the owner once and go on. otherwise look in this order: tokens in code (`tailwind.config.*`, `:root` custom properties, a `theme` file, a tokens json), a brand doc (`BRAND.md`, `docs/brand*`, `design-system.md`), the live site, their other products, the logo files. no `brand.md` yet: you are in one of three states:

1. **brand in code.** many screens that disagree (several button recipes, a dozen radii): audit first, [references/audit.md](references/audit.md). otherwise extract it into `brand.md` with the token names, each value with where it came from. status `draft` until the owner reads it, then `confirmed <date>`.
2. **brand only in a doc, figma or a live site.** read computed styles off the live site, values off the doc. figma you cannot open: ask for an export or screenshots and mark every value inferred. write `brand.md`, then put the values into tokens in code before the first screen.
3. **none.** the five questions, three live looks on one real screen, each copied from one real product or one of the user's pics and named on its option (a "just go" skips the questions, never the looks, and you find the products, section 2), the pick goes into `brand.md`. see [references/brand.md](references/brand.md#no-brand-five-questions).

**the element kit:** `brand.md`'s `## components` lists the parts the product already ships, each with a `from`: the code file it lives in, or the `## sources` row it was copied from. reuse before you draw: a screen built from those rows is on brand by construction. a new element needs the owner's yes and a real product's version of it behind it, never one drawn from nothing. once a kit exists, the project's own linter fails a raw `<button>`, `<input>` or `<select>` outside the kit folder ([references/audit.md](references/audit.md#the-lint)). every new screen draws four states: empty, loading (a form: the action in flight), error and full.

`brand.md` lives at the project root, or in the private notes (`.claude/brand.md`, ignored like the other notes files, or the brain at `~/vault/projects/<repo>/brand.md`) when the repo is shared and the user keeps notes out of it. template: [references/brand.md](references/brand.md). a filled one: [references/brand-example.md](references/brand-example.md).

**who wins:** the user's fresh word, then `brand.md`, then the taste file, then this skill's defaults. a brand with a gradient or a serif beats the defaults below. accessibility (contrast, 44 px targets on phones, 12 px text) and the size sweep always hold, whatever wins. **live css wins over a doc,** because it is what users see: when they disagree, say which and ask which is right.

**gaps:** a screen needs a value the brand does not have (a hover, a warning, a second radius): derive it from the nearest token, write it under `## proposed` with the reason, and flag it in your report. never invent one silently.

**drift:** `node ~/.claude/tools/brand-check.mjs <brand.md> [changed files]` lists colors, font families, radii and shadows in the changed files (tailwind palette and radius classes included) that are not in `brand.md`, its token files or its `## allow` list. values under `## proposed` print as proposed, not as hits. a token file is the brand too: a new or changed value there is a brand change and waits for the owner like any other. on a hit, ask once whether the code or `brand.md` is right, fix whichever loses, and log it under `## changes`.

**allowed on purpose:** a value the brand accepts anywhere (a payment button's color used on every checkout) goes under `## allow` with why. one line that shows someone else's brand (an embed, a map tile) gets a `brand-check-ignore` comment on it or the line above. neither is a way to get the check green.

## 2. a real product behind every surface

every new surface (a list, a panel, a settings page, a landing) copies the structure of one real product. never from memory, never a stock look.

1. **the user's own first.** anything they gave you: a link, a screenshot, a file, a board, their other app, a screen they liked.
2. **then find them.** ask once: "what do your users use today, or who are your closest competitors?". no answer, or "just go": search the category yourself (a web search, an app store, the user's links), open two or three similar products, and pick one per surface. write the query you used.
3. **read it, save the evidence.** `node ~/.claude/tools/ref-read.mjs <url> --surface <name>` opens it at 390 and 1440, saves screenshots and the computed styles (type, buttons, inputs, rows, hairlines, width) to `.claude/refs/`, and prints the row for `## sources`. behind a login: `--storage state.json`. the user's pics and files: `ref-read.mjs <file>`, marked `user pic`, values inferred by eye. a ref you could not open stays `unread`, and you ask for screenshots or a logged in session. never a row you did not read.
4. **one product per surface, not a collage.** copy its structure, proportions and discipline. its values only where the brand has none, and then under `## proposed`. never its brand, logo or copy.
5. **read what the product is made of.** the visual device comes from the product itself (a thread for something about connection, a cloud for storage), not from a stock look.

**the gate:** `node ~/.claude/tools/ref-check.mjs <brand.md>` fails when `## sources` is empty, a row's evidence is missing, a surface has only unread refs, or a kit row has no `from`. it runs in the fast check and before ship (with `--ship`, which also fails a brand still `default, not chosen`). depth: [references/inspo.md](references/inspo.md).

## 3. the loop that lands

every step removes one of the user's "no"s before they have to say it.

1. **brand and refs** (sections 1 and 2): `brand.md` exists, every surface has a read ref, `ref-check.mjs` is clean.
2. **their words, verbatim.** every reaction goes into the brief exactly as written, typos and caps included. never soften "this looks cheap" into "refine the styling".
3. **2 or 3 live options on one screen,** differing on one axis (palette and type first, layout only when layout is the question), when the look is the question (no brand yet, or a redesign). a new screen in a confirmed brand skips to step 5, with its ref read first. the real screen, working, a segmented control on top that swaps them live, the current look kept as one option, the measured ref shots above them.
4. **the user picks.** iterate on the pick, do not branch again for a fix. the pick goes into `brand.md`.
5. **one fresh agent per surface,** each owning only its own files, from one shared brief: the `brand.md` path and its `## components` kit to build from, the ref for its surface (the `## sources` row and its evidence folder), the user's words verbatim, the defaults and taste in force. disjoint files mean no merge fights. the brief ends with the brand check line.
6. **the fast check** (section 7) on every change: build, flow, probe at 3 sizes, brand check.
7. **a fresh reviewer predicts the "no"** and compares the screen to `brand.md`: color roles, type roles, radius, voice, logo use, kit use (a hand-rolled element that duplicates a kit row is drift), the four states. it opens each surface's ref evidence beside the screen: a surface with no ref, a ref with no evidence, or a structure that departs from its ref is a finding. each departure is named intended or drift. it gets only the artifact, the user's words, the taste file, `brand.md` and the ref evidence, never your story of the build.
8. **builders fix the findings in parallel,** each on its own files. the fast check again.
9. **measure, then look, then cut.** screenshots at a phone and a desktop size, frames for anything that moves, looked at by you first. ask what can still go (section 5).
10. **the sweep, then a private preview.** a link the user already shared with others waits for their yes before it changes.

- no subagents: run steps 5 and 8 one surface at a time, and step 7 as a separate cold pass with only the artifact, the words, the taste file, `brand.md` and the ref evidence in front of you.
- models: the strongest model for builders and the reviewer (a second model family for the reviewer when available), a fast one for measuring refs and screenshots.
- the briefs and how to read a reaction: [references/loop.md](references/loop.md).

## 4. taste, learned

the taste file is how the user's "no" gets said once instead of five times. it lives in the brain if installed (`~/vault/taste/taste.md`), else `.claude/taste.md` in the repo. a filled one: [references/taste-example.md](references/taste-example.md).

1. **day one.** no taste file: before the first screen, ask in one message what they love (two or three links or screenshots), what they hate, one site or app they would copy. the five brand questions already cover it when there was no brand. "just go" skips these questions (not the three looks); ask again after their first reaction.
2. **every reaction, the moment it arrives,** verbatim, dated, with what it was about. copy reactions too, under `## copy`. `<date> <screen> "<their exact words>" -> what changed`
3. **read it before every brief.** builders and the reviewer get it, and the reviewer quotes it back when it predicts a "no".
4. **the same "no" twice becomes a rule** under `## the rule you keep repeating`. tell them in one line: `taste: "<their words>" is a rule now`.

## 5. less

the default check before anything is shown. too much ui is the most common "no".

- one view where there are two. one menu instead of a row of toggles. one column when two compete.
- a plain word or number instead of a pill, badge, tag or status dot. color carries data or it goes.
- no label that repeats its heading. no filler stats, no decorative copy.
- **true data only.** nothing the backend does not have: no invented rows, kinds, metrics or numbers. every row opens the thing it describes, once that screen exists; until then the row is plain text, not a dead link. sample data in a project with no backend lives in one file marked sample. a viewer sees only what they are allowed to.
- before showing: ask "what can still go?" and cut it.

## 6. defaults

each one held for a reason. a brand or the taste file overrides any of them. one always holds: no character, logo or photo the user has no rights to, slipped in quietly. name the risk once, then do what they say.

- **no eyebrows** (a small uppercase spaced label above a heading): the most copied generated look, and it repeats the heading.
- **no decorative gradients,** not on type, not on the accent: one flat value reads as a decision, a gradient reads as a template.
- **no reveal on scroll:** after a jump or a fast fling the screen sits at opacity 0. scroll motion only when scrubbed, every resting frame whole. [references/motion.md](references/motion.md)
- **no glass cards on blurred blobs:** the stock generated hero. glass on chrome that reads clean is fine. liquid glass components only when the user asks for them: [references/glass.md](references/glass.md).
- **no invented brand lore:** no made up origin or slogan cadence. the true origin in two plain lines or nothing.
- **one segmented control,** not separate tab buttons, on a phone: tabs wrap and misalign at 320 px.
- **cards in a row are one height,** tops aligned: a mismatch reads as broken.
- **no emoji in headings or buttons, no em dashes in ui strings:** both read as machine written.
- **no font picked blind:** faces go on the real screen and the user picks. serif is OPEN.

## type, color, motion, copy

- **type:** one face for everything read, one mono for small labels and numbers. display tight (-0.02 to -0.03em, line height about 1.05), body untracked, tabular nums on numbers. new work with no brand face uses the system stack. body 16 px, stepping to 17.5 and 18.5 on wide reading pages, near 15 px in dense app ui.
- **color:** one vocabulary everywhere: ground, surface, ink, muted ink, accent, accent ink, error, hairline. a second hue needs a job (error, a data series), never a mood. the accent is rationed: the mark, the primary button, the selected state. hairlines are low alpha ink. muted ink at 4.5:1 or more, measured under the glyph. charts: load the `dataviz` skill if present.
- **motion:** ambient (a slow drift, a blink) and pointer response (press on pointer down, `scale(.97)`). one spring, one ease. one intro on load, nothing else plays on its own. `prefers-reduced-motion` is flat. loops stop off screen and in a hidden tab. animate transform and opacity.
- **copy:** load the `write` skill if present. the brand's `## voice` sets the tone. the user's own lines stay verbatim; copy you add is short and flagged as yours.

depth: [references/tokens.md](references/tokens.md), [references/motion.md](references/motion.md), [references/components.md](references/components.md), [references/assets.md](references/assets.md).

## 7. phone first and the size sweep

- own layout under 640 px, not the desktop squeezed. `svh`, safe area insets, hover only on hover devices.
- hit areas 44 px under 640 wide, 24 px above it (a pointer, so a 36 px desktop button is fine), measured on the control's own box: a smaller look sits inside a 44 px box with padding, never a `::before` the probe cannot see. text 12 px floor, no sideways scroll, a section at most about 1.2 screens on a common phone.
- **fast check, before every preview, under 5 minutes:** the build passes, the main flow works, `PROBE_SIZES=320x690,390x844,1440x900 node ~/.claude/tools/probe-test.mjs <url> [paths]` (a small phone, a common phone, a laptop), `node ~/.claude/tools/brand-check.mjs <brand.md>` and `node ~/.claude/tools/ref-check.mjs <brand.md>`.
- **full sweep, before ship:** every size in the probe's list, chromium and webkit, every screen and state walked, overflow, hidden sideways scrollers, small targets, tiny text, unreachable controls and console errors (read in devtools or your runner, the probe does not collect them) all 0, brand check clean. a box meant to scroll sideways (a chip row, a board on a phone) carries `data-probe-scroll`; never reflow an intended scroller into a stack just to quiet the probe, and never hide overflow with `overflow-x: hidden`: the probe reports what it cuts off.
- the probe lays the page out in an iframe of each exact size. a resized maximised window is silently ignored, so never trust one. headless: `node ~/.claude/tools/probe-test.mjs http://localhost:3000 / /login`. a state the sweep must see (an open panel) gets a url so it can be swept as a path. `probe-test.mjs`, `brand-check.mjs`, `ref-read.mjs` and `ref-check.mjs` run from `~/.claude/tools/`. only `responsive-probe.js` is copied into the project, as `tools/responsive-probe.js`, with `SIZES` edited to the devices it runs on, phones first.
- images that leave the page (a readme, a social card) bring their own background and get checked at the size they actually show.
- a screenshot you are sent may be a stale build. grep a string from it in the code before fixing.
- say which numbers were measured and which were inferred. no browser, a ref behind a login, only screenshots, or a native app: [references/verify.md](references/verify.md).

## done means

the full sweep is clean, the brand check has no hits (proposed values aside), `ref-check.mjs --ship` is clean, every surface matches the structure of its ref, every `## proposed` value is flagged to the owner, no element outside the kit without the owner's yes, every new screen draws its four states, the screenshots were looked at, the reviewer's findings are fixed or argued, and the user has a numbered hand test: what to open, at which size, what they should see, what would mean it is broken. what headless cannot see (real phone toolbars, how motion feels) is labelled unseen.

## references

| file | holds |
|---|---|
| [references/brand.md](references/brand.md) | the brand.md contract template, extracting a brand, the five questions, the brand kit |
| [references/brand-example.md](references/brand-example.md) | a filled brand.md for an invented product |
| [references/audit.md](references/audit.md) | an inconsistent app into one system: count, decide, build the foundation in order, recount |
| [references/loop.md](references/loop.md) | the loop in depth, builder and reviewer briefs, reading reactions |
| [references/inspo.md](references/inspo.md) | finding competitors and similar products, reading them, recording the evidence |
| [references/taste-example.md](references/taste-example.md) | a filled taste file, one person's picks |
| [references/tokens.md](references/tokens.md) | the token shape and the neutral starter set |
| [references/components.md](references/components.md) | the mechanics of common parts: hit boxes, segmented control, glass, cards, buttons, data rows |
| [references/glass.md](references/glass.md) | liquid glass with glisse, only on the user's request, and how it fits the kit, refs and sweep |
| [references/motion.md](references/motion.md) | scrubbed scroll, one spring, eases, reduced motion, shaders as accent only |
| [references/verify.md](references/verify.md) | the two tier check, the probe, the brand check, thresholds, contrast, browser traps |
| [references/assets.md](references/assets.md) | generated renders, cutouts, icons, sizes |

when a rule here and a fresh word from the user disagree, the user's word wins. write it down dated in the taste file.
