# motion

## the line

- banned: appear on scroll. a fade and 12px rise once per element reads as template motion.
- why: after any jump (an anchor, a back button, a fast fling) a reveal page shows most of the screen at opacity 0, and the scroll gets heavier. content that waits for a scroll is content people do not see.
- allowed: motion tied to scroll position, eased, resting picture always whole, scrolling back plays it back.
- the rule: never content hidden until a scroll, never fires once.

## scrubbed scroll, the recipe

- `measure(rect, vh)` returns the css variables an element wants. the css decides what they move.
- one passive listener and one rAF loop for the page. values glide `0.2` of the way per frame, so wheel steps of 100px come out as one move. the loop stops once everything has arrived.
- elements more than a screen away are skipped.
- trap: the end state must actually be reached. a variable that ends at ~1e-10 leaves a 3d transform on at rest. snap to rest under `0.001`.
- simpler version: a hook writes `--p` 0 to 1 across the screen, blobs drift, a figure parallaxes 22px, transform only, reduced motion holds at 0.5.
- pinned motion only with a pointer, wide enough and motion allowed: `@media (min-width: 900px) and (hover: hover) and (prefers-reduced-motion: no-preference)`.

## one spring

- `spring(x, w = 17, z = 0.55)`: a damped step response. 0.55 pops past 1 once and settles, 0.9 and up just lands.
- `inout(t, a, b)`: in on the spring at a, out on a firmer one (`w * 1.1`, `z = 1`) at b.
- `wobble(x, w = 22, z = 0.32)`: 0 at rest, for the squash when something changes.
- a mock never keeps animation state: it asks how far into the spring it is at t, so a loop, a still frame and a scrubbed frame draw the same picture.
- one rAF for every live mock, the loop time is the page clock, scrolling to a section never starts anything, off screen mocks stop drawing.

## eases and durations

- page ease `cubic-bezier(.22,1,.36,1)`, 180ms small, 320ms medium, 560 to 620ms large. large is for a layout move, never a reveal.
- the sliding pill: `0.5s cubic-bezier(.32,.72,0,1)`.

## ambient and pointer

- allowed: a background that drifts slowly one way, a blink. nothing else moves on its own.
- a drift is a css transform on a baked layer, gpu composited, reduced motion stops it.
- pointer: hover answers, press answers, hover only on hover devices.
- press on pointer down: `scale(.97)`.
- one intro on load is fine (text rises, a product shot settles).
- animate transform and opacity only.

## reduced motion, flat

- transforms off, opacity 1, no transitions.
- site wide: animation and transition durations to 0.001ms, smooth scroll off.
- mocks draw a still frame, an intro starts at its end.
- steps show each step's still and move only on click.
- color changes that carry state stay, motion stops.

## traps

- a WAAPI `oncancel` race can flash one frame. record every frame's rect under real wheel input and count flashes, jerks and frames off screen.
- a smooth `scrollTo` can be dropped halfway on ios webkit. a "see it work" jump is a rAF glide cancelled by touch, wheel or key.
- an old spec that says "reveals on scroll are a short fade, once" is stale. ignore it.

## shaders and webgpu, accent only

- a shader decorates a page, it never is the page. a full page live shader background has lost to a baked image with a css drift: calmer, and free on a phone. ask first: would a baked image look as good?
- get the library's api from its docs or examples, never from memory.
- the color rules do not relax on the gpu. no extra hue because the noise looked nice.
- motion needs a reason, nothing that moves blocks reading, text over it wins the contrast.
- before shipping: degrades without webgpu (a black canvas is not degrading, a baked image is), stops in a hidden tab, respects reduced motion, compared side by side with a baked still on a real phone. headless webgpu needs `--enable-unsafe-webgpu`; how it looks goes in the hand test as unseen.
