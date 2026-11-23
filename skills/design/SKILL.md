---
name: design
description: The front end design method, built from the user's brand and real products. Invoke before styling or animating anything a person sees, or on "design this", "still ugly", "not better", "new directions", "whiteboard", "ai slop", "use our brand".
---

# design

a screen the user says yes to on the first look, not the fourth. nothing is invented: every screen is built from two real inputs, checked by two tools, and a fresh reader says "no" before the user has to.

- **the brand** gives the values and the parts (colors, type, radius, the element kit): `brand.md`, checked by `brand-check.mjs`.
- **a real product** gives the structure (layout, density, the row or panel pattern, motion): read by `ref-read.mjs`, gated by `ref-check.mjs`.

neither is optional. a confirmed brand still needs a real product behind each new surface, and a reference never brings its own colors. where a rule says OPEN, the user decides: ask. under every rule:

- **less.** every element carries information or it goes.
- **alive, never gated.** motion is ambient or answers the pointer.
- **one of each.** one accent, one radius, one face, one spring, one ease.
- **phone first.** people review on their phones, so the phone layout is the real one.
- **their words stay theirs.** cut chrome freely, never reword what the user wrote.

## 1. brand first

read the brand before anything is drawn. an invented brand is one more thing to say "no" to.

- **`brand.md` exists:** read it, do not rewrite it. `confirmed`: build to it. `draft` or `default, not chosen`: show the owner once and go on.
- **no `brand.md`:** the brand is in code, only in a doc or a live site, or nowhere (the five questions and three live looks; "just go" skips the questions, never the looks). read [references/brand.md](references/brand.md#finding-the-brand) before writing one, and [references/audit.md](references/audit.md) when screens disagree.
- **the element kit:** reuse `## components` before you draw. a new element needs the owner's yes and a real product's version behind it. every new screen draws four states: empty, loading (a form: the action in flight), error, full.
- **who wins:** the user's fresh word, then `brand.md`, then the taste file, then the defaults here. accessibility (contrast, 44 px targets on phones, 12 px text) and the size sweep always hold. live css beats a doc: when they disagree, say which and ask.
- **gaps, drift, allow:** never invent a value silently, never quiet the check to get green. on the first value the brand lacks or the first brand check hit, read [references/brand.md](references/brand.md#gaps-drift-and-allow).

## 2. a real product behind every surface

every new surface copies the structure of one real product. never from memory, never a stock look.

1. **the user's own first:** a link, a screenshot, a file, a board, a screen they liked.
2. **then find them.** ask once who their users use today or their closest competitors. no answer or "just go": search the category, open two or three, pick one per surface, write the query.
3. **read it, save the evidence:** `node ~/.claude/tools/ref-read.mjs <url> --surface <name>`. never a `## sources` row you did not read. logins, pics, motion: [references/inspo.md](references/inspo.md).
4. **one product per surface, not a collage.** copy its structure and discipline. its values only where the brand has none, under `## proposed`. never its brand, logo or copy.
5. **the visual device comes from what the product is** (a thread for connection, a cloud for storage).

**the gate:** `ref-check.mjs <brand.md>` in the fast check, `--ship` before ship.

## 3. the loop that lands

every step removes a "no" before it is said. read [references/loop.md](references/loop.md) before the first brief: the briefs, the options, reading a reaction, running without subagents.

1. **brand and refs** in place, `ref-check.mjs` clean.
2. **their words, verbatim,** typos and caps kept. never soften "this looks cheap".
3. **the look is the question:** wide open, the whiteboard ([references/whiteboard.md](references/whiteboard.md)). otherwise 2 or 3 live options on one real screen. a new screen in a confirmed brand skips to step 5.
4. **the user picks.** iterate on the pick, do not branch for a fix. the pick goes into `brand.md`.
5. **one fresh agent per surface,** own files only, one shared brief.
6. **the fast check** on every change.
7. **a fresh reviewer predicts the "no"** against `brand.md` and the ref evidence. it gets the artifact, the user's words, the taste file, `brand.md` and the evidence, never your story of the build.
8. **builders fix findings in parallel,** own files. the fast check again.
9. **measure, look, cut.** screenshots, the widest first: a page with a max width can sit glued to the left on a wide monitor and pass every narrow size. then a laptop and a phone, frames for anything that moves, looked at by you first. ask what can still go.
10. **the sweep, then a private preview.** a link the user already shared waits for their yes before it changes.

- **two "no"s on the same screen: stop patching.** three directions, each from its own read ref, a fresh reviewer picks, the user sees one ([references/loop.md](references/loop.md#two-nos-three-directions)).
- **models** per cook's table: the strong model on every seat, measuring refs included, `model` set on every call, the second family beside it on the picking reviewer when set.

## 4. taste

every reaction goes into the taste file verbatim and dated, the moment it arrives, and the file is read before every brief. the same "no" twice is a rule. the method: [references/taste.md](references/taste.md), read before the first screen.

## 5. less

too much ui is the most common "no". before anything is shown:

- one view where there are two, one menu instead of a row of toggles, one column when two compete.
- a plain word or number instead of a pill, badge or status dot. color carries data or it goes.
- no label that repeats its heading, no filler stats, no decorative copy.
- **one name per control.** a label, a placeholder and a hint never say the same thing. "judge" over a select reading "pick a judge" over a line "pick a judge to score" is three names for one control: keep the one inside it, the label stays for screen readers.
- **color in balance.** no brand color given: pure white, pure black, hairlines, the controls people already know. color comes in small whole pieces that mean something: a swatch per team or category, the chosen state, each with its text color checked. two ways to miss: one small orange or purple on cream picked to look designed, and every surface filled with color. the loud look is for when the owner asks for it.
- **one treatment per kind of thing.** ranks, tags, statuses: one style for all of them, emphasis by weight. a filled colored badge for 1, black ones for 2 and 3 and `#4` after that is three styles for one list.
- **a focus ring is for the keyboard.** `:focus-visible` on buttons and links, drawn inside the control. a field shows focus by its own border, mouse or keyboard: a ring stacked on a border reads as a thick blob.
- **a few fixed choices are one segmented control.** two to five options the user switches between: one box, cells side by side, the chosen one filled. a dropdown hides them and its menu never lines up with the page.
- **true data only.** no invented rows, kinds, metrics or numbers. a row opens what it describes once that screen exists, until then it is plain text. sample data with no backend lives in one file marked sample. a viewer sees only what they may.
- ask "what can still go?", and cut it.

## 6. defaults

a brand or the taste file overrides any of them. one always holds: no character, logo or photo the user has no rights to, slipped in quietly. name the risk once, then do what they say.

- **no eyebrows** (a small uppercase label above a heading): the most copied generated look.
- **no decorative gradients,** on type or the accent. one flat value reads as a decision.
- **no reveal on scroll:** after a jump the screen sits at opacity 0. scroll motion only when scrubbed.
- **no glass cards on blurred blobs.** liquid glass only on request ([references/glass.md](references/glass.md)).
- **no invented brand lore.** the true origin in two plain lines or nothing.
- **one segmented control,** not tab buttons, on a phone.
- **cards in a row are one height,** tops aligned.
- **no emoji in headings or buttons, no em dashes in ui strings.**
- **no font picked blind:** faces go on the real screen and the user picks. serif is OPEN.

type and color: [references/tokens.md](references/tokens.md) before the first token. motion: [references/motion.md](references/motion.md) before anything moves. hit boxes, cards, buttons, data rows: [references/components.md](references/components.md). renders, icons, images that leave the page: [references/assets.md](references/assets.md). copy: `write`, the brand's `## voice`, and copy you add is short and flagged as yours.

## 7. phone first and the size sweep

- own layout under 640 px, not the desktop squeezed.
- hit areas 44 px under 640 wide, 24 px above, on the control's own box. text 12 px floor, no sideways scroll, a section at most about 1.2 screens on a common phone.
- **fast check, before every preview, under 5 minutes:** build, the main flow, the probe at 3 sizes, the brand and ref checks.
- **full sweep, before ship:** every size in the probe's list, 1920 and 2560 wide included, chromium and webkit, every screen and state. overflow, hidden sideways scrollers, small targets, tiny text, unreachable controls, console errors and `off-center` all 0.
- commands, probe rules, thresholds, and what to do with no browser or a native app: [references/verify.md](references/verify.md), before the first sweep.

## done means

the full sweep and both checks (`ref-check.mjs --ship`) clean, proposed values flagged to the owner, every surface matches its ref, no element outside the kit without a yes, four states drawn, screenshots looked at widest first, a recording (`record.mjs`) looked at for a scroll story or drag scene going out, the reviewer's findings fixed or argued, and a numbered hand test: what to open, at which size, what they should see, what means broken. what headless cannot see is labelled unseen.
