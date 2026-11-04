# components that hold up

the mechanics of common parts: what breaks them and how big they must be. the look (colors, radius, blur amounts, sizes) comes from `brand.md` and from the ref for that surface, never from here. build a part only when the kit or the surface's ref has it; if the project already has the component in code, copy from the file. a value the brand lacks goes under its `## proposed`.

## a glass header, when the brand or the ref has one

- liquid glass components (glisse) only when the user asks: [glass.md](glass.md).

- links in the middle only when they fit, no nav row on phones.
- fixed, not sticky: a sticky element's backdrop is not the scrolling page in every engine, and the blur goes flat.
- no `isolation` on it, an isolated element has nothing behind it to blur.
- no band of transparent header above or below the pill, text would scroll through it.
- more opaque where blur is costly or weak.
- header at most 56px on a phone.

## glass on content

- a secondary button on a photo is real glass: white at .28, blur 10, a bright rim. a flat white pill on a photo is a hole in the page.
- ink glass works for a code block over an image.
- a product window or screenshot is never translucent, never blurred.

## segmented control with a sliding pill

- the answer to separate tab buttons on a phone.
- a pill slides to the active item by `translateX(calc(var(--i) * 100%))`, with the brand's ease.
- buttons at least 44px tall on phones. labels muted ink, ink when on.
- a 32px design system segment fails the phone gate as written. make the hit area 44.

## cards, radius, inset

- the brand's radius and inset, one title row and gap. cards in a row match height to under 1px.
- no full width card holding everything. separate cards read better.

## data ui: hairlines, not pills

- selected tab is an ink outline or the accent, never both. lists are rows on a hairline.
- parts of a board lose their cards: a hairline plus a label so tops line up, no shadows.
- table rows: hairlines, no zebra.
- spec rows: mono term in muted ink, sans detail in ink, hairline between.
- color that carries data stays (at a glance status on a dashboard is a job); color as decoration goes.

## buttons

- primary: accent fill, accent ink text, 44px, one per screen.
- hover lifts 1px, `:active` `scale(.97)` placed after the hover rules so a press wins. hover inside `@media (hover: hover)`.
- a 40px look goes inside a 44px box with padding. a `::before` hit area is invisible to the probe, so it fails the sweep.
