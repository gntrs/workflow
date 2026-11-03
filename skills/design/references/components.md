# components that hold up

each one is a recipe. if the project already has the component in code, copy from the file, not from memory. values here are starting points; the project's `brand.md` wins.

## the glass header pill

- one row, about 52px, one glass pill the width of the screen, brand left, main action right, links in the middle only from 900px. no nav row on phones.
- restrained recipe: a near white at .84 alpha, `backdrop-filter: blur(12px) saturate(1.4)`, a hairline ring, one pixel of white along the top edge.
- floating variant: `min(760px, 100%)` wide, white at .78, `saturate(1.6) blur(16px)`.
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
- a quiet track, padding 4, radius 16; a pill radius 12 slides to the active item by `translateX(calc(var(--i) * 100%))` over `0.5s cubic-bezier(.32,.72,0,1)`.
- buttons at least 44px tall. labels muted ink, full ink when on.
- a 32px design system segment fails the phone gate as written. make the hit area 44.

## cards, radius, inset

- one radius, one inset, one title row and gap. cards in a row are one height; a visible mismatch reads as broken, aim for under 1px.
- radius is per project, not one global value. small reads editorial, 12 to 20 reads app.
- no full width card holding everything. separate cards read better.

## data ui: hairlines, not pills

- selected tab is an ink outline. lists are rows on a hairline.
- parts of a board lose their cards: a hairline plus a label so tops line up, no shadows.
- table rows: hairlines, no zebra.
- spec rows: mono term in muted ink, sans detail in ink, hairline between.
- color that carries data stays (at a glance status on a dashboard is a job); color as decoration goes.

## buttons

- primary: accent fill, ink or white text by measured contrast, 44px, one per screen.
- hover lifts 1px, `:active` `scale(.97)` placed after the hover rules so a press wins. hover inside `@media (hover: hover)`.
- 40px visual is fine with a 44px hit area via a `::before` inset.
