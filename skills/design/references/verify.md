# verify: two tiers, the probe, the brand check, thresholds, contrast, browser traps

front end work is not done until it is measured. say which numbers were measured and which were inferred, every time.

## two tiers

| tier | when | what | budget |
|---|---|---|---|
| fast | before every preview, after every builder lands | build passes, the main flow works, the probe at 3 sizes (320x690, 390x844, 1440x900), the brand check on the changed files, no console errors | under 5 minutes |
| full | before ship | every size in `SIZES`, chromium and webkit, every screen and state walked, the 12 px floor, console errors, the brand check on every file the work touched, screenshots looked at | as long as it takes |

the fast tier is what makes small, frequent previews possible. running the full sweep on every one pixel change is what makes iteration slow.

put both in the repo as one command each so anyone can run them. the full tier runs the probe twice: once as is, once with `PROBE_BROWSER=webkit` (buttons in webkit do not inherit the page font, so 11 px button text shows up only there, and a native `<select>` renders about 23 px tall there unless it gets its own height). the sweep is already one: `node ~/.claude/tools/probe-test.mjs http://localhost:3000 / /login` sweeps those paths at every size and exits non-zero on any fault.

## the probe

`tools/responsive-probe.js`, the one file that gets copied into the project (as `tools/responsive-probe.js`), so its `SIZES` match the devices the project runs on. run from the project root, `probe-test.mjs` takes only that copy's `SIZES`; the probe itself is always the installed one, so an update reaches every project.

it lays the page out in an iframe of each exact size and measures:

- sideways overflow, naming the boxes sticking out
- content cut off at the edge by `overflow-x: hidden`
- a sideways scroller hiding content. a box meant to scroll or peek (a chip row, a carousel, a board on a phone) carries `data-probe-scroll`
- clipped text
- controls under 44 px at phone widths, under 24 px above
- text under 12 px at phone widths
- controls nobody can reach, and steps that never arrived

text and controls at opacity 0 (a reveal on scroll that has not run) are counted on the row, not measured. a page whose sections fade in gets its reveals turned off for the sweep, or is walked with steps.

- **console:** start the dev server, open it in a tab that stays in front, paste the file, `report(await probeAll())`. several paths: `probeAll({ paths: ['/', '/login'] })`. screens behind clicks: pass `steps`, each waiting for what it opened, never a fixed sleep.
- **headless:** `node ~/.claude/tools/probe-test.mjs <url> [paths...]`, for example `node ~/.claude/tools/probe-test.mjs http://localhost:3000 / /login`. it opens the url in headless chromium, sweeps each path at every size, prints the report and exits 1 on a fault. with no arguments, in a clone of the workflow repo, it runs its self-test on fixture pages: a planted 30 px button, a planted overflow and a hidden sideways scroller must be caught, a clean page must pass. needs playwright with chromium (`npx playwright install chromium`, or `PLAYWRIGHT_MODULE` pointing at an installed copy).
- **your own runner:** open a page of the app, `page.addScriptTag({ path: 'tools/responsive-probe.js' })`, then `page.evaluate(async () => report(await probeAll({ paths: ['/'] })))`.
- **fast tier:** `PROBE_SIZES=320x690,390x844,1440x900 node ~/.claude/tools/probe-test.mjs <url> [paths...]`, or in a console `probeAll({ sizes: SIZES.filter(([w, h]) => ['320x690', '390x844', '1440x900'].includes(`${w}x${h}`)) })`.
- edit `SIZES` to the devices the project actually runs on. phones first, every phone twice: full height and with the toolbar showing.
- `data-probe-skip` on anything to ignore, with a comment saying why.
- apps behind a login: log in once in a playwright script, save `context.storageState({ path: 'state.json' })`, then `PROBE_STORAGE=state.json node ~/.claude/tools/probe-test.mjs <url> [paths...]`. or run the console version in a logged in tab. a path that redirects (to the login) or answers 404 fails the sweep, never counts as clean.

## the brand check

`node ~/.claude/tools/brand-check.mjs <brand.md> [changed files]`, run from the project root. it stays in `~/.claude/tools/`, nothing to copy.

- **what it reads:** every literal in `brand.md`'s tables, its token files and its `## allow` list.
- **what it flags:** each color, font family, radius and shadow in the changed files that is none of them, tailwind palette, `rounded-*` and `font-[...]` classes included. values under `## proposed` print as proposed. exits 1 on a hit.
- **what it does not check:** sizes, weights, spacing, percent radii. "0 hits" means color, face, radius and shadow are on brand, nothing more. a gradient passes only when every stop is a brand color.
- **what it misses:** named colors in plain props (`<Icon color="red">`), react native `StyleSheet.create` and arbitrary classes like `bg-[tomato]`. named colors in css and in `style`, `sx` and `css` props are read. the reviewer catches the rest.
- **which files:** the changed ones, or name them when nothing is uncommitted and there is no base branch. a changed file is checked whole, so touching one line of an old file shows the hits already in it. a folder run on an older app is an audit to read, not a gate.

- run it on the changed files only. vendor code and third party css are not the brand's to check.
- a hit is a question, not a fix: a gap goes under `## proposed`, drift is asked once and logged under `## changes` ([SKILL.md](../SKILL.md) section 1), a value the brand accepts goes under `## allow`, one line of someone else's brand gets `brand-check-ignore` ([SKILL.md](../SKILL.md) section 1).
- `node tools/brand-check.mjs --self-test`, in a clone of the workflow repo, proves it still catches a planted off brand value and passes a clean file.

## coverage, or the sweep lies

a sweep that skips states reports clean. it only covers what it walked.

- list every state before sweeping: each screen, open menus, sheets and dialogs, empty, loading, error, long content, logged out.
- the report's row count must equal sizes times states. check it.
- the fresh reviewer checks this list against the app, not against the report.

## phone thresholds that have held

- header at most 56 px
- hero at most 1.1 screens, the product's top edge above the fold on a common phone
- no section over 1.2 screens on a common phone, 1.4 on the smallest
- no text under 12 px, no control box under 44 px under 640 wide, under 24 px above
- anything that moves overlaps text by 0 px
- a state change (a key press, a toggle) moves nothing below it
- no horizontal overflow at any size

## phone specifics that bite

- own layout under 640, `svh` units, `viewport-fit=cover` and safe area insets, an html background for the rubber band, hover only on hover devices, any per os attribute set before paint.
- anchors under a fixed header: scroll padding and a scroll margin adding up put them far too low. use one, not both.
- deep links need a jump after `document.fonts.ready`, fonts can shrink the page after load.
- not verifiable headless, so it goes in the hand test: `svh` with real toolbars, the status bar inset, blur cost on a mid range android, rubber band color, fast flings.

## contrast, measured under the glyph

- measure the pixels behind each glyph, not the token pair. darkening muted ink and adding a soft glow behind small white type over an image has taken a page from dozens of contrast faults to zero.
- white on a light warm image can sit near 1.5:1. measure, then switch to ink.
- in a hidden tab a theme change does not recalculate inherited colors, so a contrast audit invents faults. set the theme before load.

## no browser, or not web

- a ref behind a login or that will not load: use values already in `brand.md` or the taste file, or the user's screenshots, and mark them inferred.
- refs only from screenshots: read values off them and mark every one inferred, not measured.
- native apps: run the simulator or emulator at the smallest and the largest device, each at the default and the largest dynamic type size. the probe is web only, and the brand check reads web and react native source only: swift, kotlin and dart go to the reviewer.
- no tooling at all: the hand test carries the sweep, and every number in the report is labelled unseen.

## a screenshot you are sent may be old

- a cache first service worker can serve an old shell. grep the code for a phrase in the image. if it is gone, the image is stale; say so and say how to get the current build.
- the reverse also happens. check before dismissing it.
- the served bundle is the truth: fetch the page, pull the css chunk, grep the compiled rule. that is how a push is confirmed live.

## browser traps

- a backgrounded or automation driven tab is often hidden: zero animation frames, no ResizeObserver, frozen transitions, screenshots of the wrong frame. check `document.visibilityState` and count frames before trusting anything that moves. the probe refuses to start in a hidden tab.
- playwright headless chromium is an honest phone renderer (`devices['iPhone 14']`). run webkit too, it finds real faults (a dropped smooth scroll on ios).
- old headless chromium never fires animation frames: use the new headless mode. transitions do not advance under virtual time, prove them with `document.getAnimations()`.
- `window.scrollTo` can stop dispatching scroll events. verify scroll driven ui with real wheel input.
- an intermittent fault gets blamed on the last change. run the baseline twice before reverting anything.
- motion faults: record every frame's rect under real wheel input and count flashes, jerks and frames off screen.
- never kill a browser by name. close a test browser by its own temp profile or its own pid, so the user's real browser survives.

## then the hand test

every piece of work ends with numbered hand steps: what to open, at which size, what should be seen, what would mean it is broken. what headless cannot see (real phone toolbars, how it looks, how motion feels) is labelled unseen.
