# liquid glass, on request only

[glisse](https://github.com/0kzh/glisse) (MIT, react 18 or later) is Apple's liquid glass for the web: `Button`, `Switch`, `Slider`, `SegmentedControl`, `TabBar`, `Menu`, `SearchField`, `Input` and a plain `Glass` surface. live examples: [glisse.kelvinzhang.ca](https://glisse.kelvinzhang.ca).

## only when the user asks

- use it only when the user names it, or asks for liquid glass, for a surface they name. never suggest it, never add it on your own, never pick it as one of the three looks.
- one surface at a time, where they asked. the brand's own kit stays the kit everywhere else: no other surface reuses a glisse row.
- not a react 18 or later project: glisse does not fit. say so and stop. no port, no react added for it, no copied css.
- it is someone else's finished design. use the components as shipped: no restyling their internals, no overriding their classes, no copying their css. the only changes are the levers glisse ships (below), each with the user's yes.

## install

- pin the exact version with the project's package manager (`npm install glisse@0.5.0`, or pnpm, yarn, bun), and write the version in the kit row. it is young and releases often.
- its styles are injected by js in the browser. a server rendered page (next.js, remix) paints the controls unstyled until hydration: add `import "glisse/styles.css"` in the root layout. the components already carry `"use client"`.

## in brand.md

each component used gets a row under `## components`, scoped to the surface it was asked for:

| element | use | where | from | recipe |
|---|---|---|---|---|
| switch (glisse 0.5.0) | `import { Switch } from "glisse"` | <the project file holding its 44 px label> | glisse | only on <surface>, asked <date>: "<their words>". glisse colors on: #34c759 |

- the brand's own row for that element stays. the glisse row is for that surface only.
- `from` is the glisse row under `## sources`, not `node_modules/glisse`: a fresh clone or a ci run before install has no `node_modules`.
- the sources row: `ref-read.mjs https://glisse.kelvinzhang.ca --surface glisse`. it is evidence for the components' look only, the docs site's own brand (its dark ground, its fonts) is not the product's. the surface still copies its structure from a real product, as every surface does.

## what the brand check cannot see

the colors live in glisse's css in `node_modules`, so `brand-check.mjs` stays at 0 hits while they paint the screen:

- `Button variant="filled"` is #0088ff, a switch turned on is #34c759, destructive is #ff383c.
- dark mode follows `prefers-color-scheme` or `[data-theme]` on `<html>`, not a `.dark` class. a light only page on a phone set to dark gets dark grey glass with white labels.

write the colors into the kit row's recipe so the reviewer sees them. the levers glisse ships, each only with the user's yes:

- `data-theme` on `<html>`: `light` when the brand has no dark mode, otherwise kept in step with the app's own theme.
- `--lg-fill`, `--lg-on` and the `tint` prop, set to brand tokens.

## hit areas, measured

the probe measures the control's own box, plus a `<label>` tied to it. a padded `div` around a control does not count.

| part | size | passes on a phone with |
|---|---|---|
| Switch | 60x25 | a `<label>` padded to 44 px around it (a tap on the padding toggles it) |
| Button, Slider, SearchField, Input | 40 tall | a `<label>` padded to 44 px |
| Menu trigger | 40x40 | a `<label>` padded to 44 px |
| SegmentedControl, TabBar tabs | 32 tall | `style={{ "--lg-tab-height": "44px" }}`, glisse's own lever, with the user's yes |
| TabBar with icons | 10 px labels | cannot pass the 12 px floor |
| Menu items, the Input clear button | 32 px | cannot pass |

the last two rows fail on a phone whatever wins, because 44 px targets and 12 px text always hold. tell the user and let them pick: leave that part out on phones, or not use it.

## browsers and the hand test

- the refraction of the live page behind the glass runs in chromium only. safari and firefox get a frosted blur. the thumbs and the tab lens bend their own content in every browser, and content marked `data-glisse-backdrop` bends in webkit too, on the cpu (slow on big areas).
- on an iphone every browser is webkit, so a review on a phone shows the frost, not the bend. say that in the hand test.
- sweep in webkit as well as chromium, and measure the contrast of text on the glass over the real background.
- `prefers-reduced-motion`: the springs snap and the menu fades. check it once and list what still moves in the hand test.
