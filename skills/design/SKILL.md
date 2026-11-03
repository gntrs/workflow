---
name: design
description: the frontend framework. invoke before styling, laying out or animating anything a person will look at, web page, app screen, artifact, dashboard, mock, landing. covers references first, the user's brand guidelines (brand.md), the loop that lands a design, "less" as a default check, the hard no's, type, color, motion, phone first and the size sweep with tools/responsive-probe.js. triggers, "design this", "make it look good", "redo the ui", "it looks like ai slop", "make it cleaner", "build the landing", "/design".
---

# design

how to make a screen the user says yes to on the first look, not the fourth. most of it is not taste, it is method: look before guessing, measure before showing, and let a fresh reader say "no" before the user has to.

depth is in `references/`. where a rule says OPEN, the user decides. ask.

## 1. references first, never guess

before drawing anything, find what already does this well and measure it.

1. **copy what the user already owns before inventing.** their live site, their other app, a screen they liked, a product they named ("like our landing", "copy the chat app"). open it, measure it, copy its motion, layout and spacing. nothing gets invented when something of theirs exists.
2. **then real products that do the thing well.** two or three, named by the user or picked by you and marked as your pick. open each in a real browser and measure: spacing scale, type sizes and weights, tracking, radius, hairline alpha, button height, motion timing. write the numbers down. a screenshot is not a measurement.
3. **write each reference's measured row into `brand.md` under `## sources`,** so the numbers outlive the session.
4. **one reference, not a collage.** copy proportions, palette discipline and the type scale of the one that fits. never its brand, logo or copy.
5. **read what the product is made of.** the visual device comes from the product itself (a thread for something about connection, a cloud for storage), not from a stock look.

how to find, measure and record refs: [references/inspo.md](references/inspo.md).

## 2. brand guidelines

look for the user's before you make any.

- **where to look:** tokens in code (`tailwind.config.*`, css custom properties, a `theme` file, a design tokens json), a brand doc (`brand.md`, `BRAND.md`, `docs/brand*`, a figma export), the live site's computed styles, their other products.
- **found:** extract it into `brand.md` at the project root (or wherever the project keeps docs): colors with roles, type faces and scale, radius, spacing, motion, voice, the logo files. measured values, each with where it came from. then use it, and only it.
- **none:** build `brand.md` with the user. ask for three references they like, measure all three, write each one's measured row into `brand.md` under `## sources`, propose one short set (a base pair, one accent, one face, one radius, one ease) drawn from them, show it on one real screen, and let them pick. short beats complete.
- when the live css and a brand doc disagree, the live css is what users see. say so and ask which wins.

template and extraction steps: [references/brand.md](references/brand.md). token shape and a neutral starter set: [references/tokens.md](references/tokens.md).

## 3. the loop that lands

the process, in order. every step removes one of the user's "no"s before they have to say it.

1. **copy and measure what the user owns** (section 1). build from it.
2. **their words, verbatim.** every reaction the user gives goes into the brief exactly as written, typos and caps included. never soften "this looks cheap" into "refine the styling".
3. **one screen first,** two or three directions at most. best form: the real screen, working, with a segmented control on top that swaps directions live and the current look kept as one option. the user picks; iterate on the pick, do not branch again for a fix.
4. **one builder per screen,** each owning only its own files, from one shared brief. disjoint files mean no merge fights. each builds its screen alone and sweeps it before reporting.
5. **the fast check** (section 6) on every change.
6. **a fresh reviewer predicts the "no".** a new agent gets only the artifact, the user's words verbatim and the taste file, never your story of what you did. its one job: list what the user will dislike before they look. it also checks the sweep covered every state (every screen, open menu, empty, error, loading), because a sweep that silently skips states reports clean.
7. **builders fix the findings in parallel,** each on its own files. then the fast check again.
8. **measure, then look.** the sweep, screenshots at the phone and desktop sizes, frame by frame captures for anything that moves. you look at them before the user does.
9. **ask what can still go** (section 4), cut it.
10. **a private preview.** every iteration goes to a private preview. a link the user has already shared with others waits for their yes before it changes.

no subagents available: run steps 4 and 7 one screen at a time, and do step 6 as a separate cold pass with only the artifact, the words and the taste file in front of you.

| role | model |
|---|---|
| builder per screen | the strongest model |
| fresh reviewer | the strongest model, a second model family when available, never the only one |
| ref measuring, screenshots | a fast model |

the exact names live in cook's model table; setup swaps them for what the user's plan has.

the reviewer brief, the builder brief and how to log reactions: [references/loop.md](references/loop.md).

## 4. less

the default check before anything is shown. too much ui is the most common "no".

- cut first. every element carries information or it goes.
- one view where there are two. one menu instead of a row of toggles. one column when two compete.
- a plain word or number instead of a pill, badge, tag or status dot.
- no label that repeats its heading. no filler stats, no decorative copy.
- **true data only.** nothing the data or backend does not actually have: no invented rows, notification kinds, metrics or numbers. every row opens the thing it describes.
- private numbers stay private. a viewer sees only what they are allowed to.
- before showing: ask "what can still go?" and cut it.

## 5. hard no's

these apply to every product. each was learned from a real "no".

- **no eyebrows or kickers:** no small uppercase letter spaced label above a heading. no exception.
- **no gradients for decoration:** not on type, not on the accent. one flat value.
- **no reveal on scroll:** no fade in, no rise on scroll, no IntersectionObserver reveals, no stagger. scroll motion only when scrubbed (a function of scroll position, every resting frame whole).
- **no invented brand lore:** no made up origin story, slogan cadence or triads. the true origin in two plain lines or nothing.
- **no decoration posing as data:** no status dots or colored pills for looks. color carries data or it goes.
- **no glass cards on blurred blobs.** real glass on chrome or content is fine when it reads clean.
- no tabs as separate buttons on a phone: one segmented control.
- no cards of random heights. equal heights, aligned tops.
- no emoji in headings or buttons. no em dashes anywhere, ui strings included.
- no font picked blind: show faces on the real screen and let the user pick.

## default taste, override in your taste file

opinionated picks that have held. the user's taste file (the brain if installed, `~/vault/taste/`, else `.claude/taste.md` in the repo) overrides any of them.

- **mascots:** no clip art. one soft shape, one flat color, pill eyes, alive (blinks, follows the pointer), shown in two or three directions for the user to pick. never a hand drawn character with outlines and details. if the user drew it, it is theirs to draw. never off screen, never over text.
- **icons:** one outline set (ionicons 5 outline is the default pick, over lucide), on controls only. sf symbols are not licensed for the web.
- **previews** are 4:3 unless asked.
- **no purple to blue** anything.
- **no full width card** holding everything.
- **glass** anywhere if done well.

## type, color, motion

- **type:** one face for everything read, one mono for small labels and numbers, never a sentence. display tight (-0.02 to -0.03em, line height about 1.05), body untracked, tabular nums on numbers. default face for new work is the system stack; a project that ships a face keeps it. body near 17.5 to 18.5 px on reading pages, near 15 px in dense app ui. nothing under 12 px on a phone. serif is OPEN.
- **color:** a base pair and one accent. a second hue needs a job (error, a data series), never a mood. the accent is rationed: the mark, the primary button, the selected state. hairlines are low alpha ink. contrast measured under the glyph, muted ink at 4.5:1 or more. charts: color must be true, load the `dataviz` skill if present.
- **motion:** ambient (a slow drift, a blink) and pointer response (press on pointer down, `scale(.97)`). one spring, one ease (`cubic-bezier(.22,1,.36,1)`). one intro on load is allowed, nothing else plays on its own. `prefers-reduced-motion` is flat. loops stop off screen and in a hidden tab. animate transform and opacity.

depth: [references/tokens.md](references/tokens.md), [references/motion.md](references/motion.md), [references/components.md](references/components.md).

## copy

- load the `write` skill for anything a person reads.
- the user's own lines stay verbatim. cut chrome freely, never reword what they wrote.
- copy you add is short and flagged as yours so they can swap it.

## 6. phone first and the size sweep

the phone layout is the real one: people review on their phones.

- own layout under 640 px, not the desktop squeezed. `svh`, safe area insets, hover only on hover devices.
- hit areas 44 px (40 visual is fine), text 12 px floor, no sideways scroll, a section at most about 1.2 screens on a common phone.
- **two tiers:**
  - **fast check, before every preview, under 5 minutes:** the build passes, the main flow works by hand or script, and `~/.claude/tools/responsive-probe.js` at 3 sizes (a small phone, a common phone, a laptop).
  - **full sweep, before ship:** every size in the probe's list, chromium and webkit, every screen and state walked, overflow 0, small targets 0, tiny text 0, unreachable 0, console errors 0.
- the probe lays the page out in an iframe of each exact size and measures. a resized maximised window is silently ignored, so never trust one. paste it into the console of a tab in front, or headless: `node tools/probe-test.mjs http://localhost:3000 / /login` sweeps those paths and exits non-zero on a fault. edit its `SIZES` to the devices the project actually runs on, phones first.
- a screenshot you are sent may be a stale build. grep a string from it in the code before fixing.
- say which numbers were measured and which were inferred.

**no browser, or not web:**

- refs only from the user's screenshots: read values off them and mark every one inferred, not measured.
- native apps: run the simulator or emulator at the smallest and the largest device, each at the default and the largest dynamic type size. the probe is web only.
- no tooling at all: the hand test carries the sweep, and every number in the report is labelled unseen.

how to run it, phone thresholds, contrast and browser traps: [references/verify.md](references/verify.md).

## done means

the full sweep is clean, the screenshots were looked at, the fresh reviewer's findings are fixed or argued, and the user has a numbered hand test: what to open, at which size, what they should see, what would mean it is broken. the parts headless cannot see (real phone toolbars, how motion feels) are labelled unseen.

## references

| file | holds |
|---|---|
| [references/brand.md](references/brand.md) | find, extract or build `brand.md`, the template |
| [references/loop.md](references/loop.md) | the loop in depth, reviewer and builder briefs, logging reactions |
| [references/inspo.md](references/inspo.md) | finding, measuring and recording refs, what past reactions teach |
| [references/tokens.md](references/tokens.md) | the token shape, a starter set, rules from sets that shipped |
| [references/components.md](references/components.md) | glass header pill, segmented control, cards, buttons, data rows |
| [references/motion.md](references/motion.md) | scrubbed scroll, one spring, eases, reduced motion, shaders as accent only |
| [references/verify.md](references/verify.md) | the two tier check, the probe, thresholds, contrast, stale builds, browser traps |
| [references/assets.md](references/assets.md) | generated renders, cutouts, icons, sizes |

when a rule here and a fresh word from the user disagree, the user's word wins. write it down dated in the taste file, then fix the rule.
