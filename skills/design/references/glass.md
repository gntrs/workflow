# liquid glass, on request only

[glisse](https://github.com/0kzh/glisse) (MIT, react 18 or later) is Apple's liquid glass for the web: `Button`, `Switch`, `Slider`, `SegmentedControl`, `TabBar`, `Menu`, `SearchField`, `Input` and a plain `Glass` surface. live examples: [glisse.kelvinzhang.ca](https://glisse.kelvinzhang.ca).

## only when the user asks

- use it only when the user names it, or asks for liquid glass. never suggest it, never add it on your own, never pick it as one of the three looks.
- it is someone else's finished design. use the components as shipped: no restyling their internals, no overriding their classes, no copying their css into the project. if it clashes with the brand, say so and let the user decide.
- one surface at a time, where they asked for it. the rest of the app stays on the brand's own kit.

## how it maps onto the workflow

1. **install, with their yes:** `npm install glisse`. the components bring their own styles.
2. **the kit:** each component used gets a row under `## components` in `brand.md`, `where` the import (`import { Switch } from "glisse"`) and `from` set to `node_modules/glisse`, so `ref-check.mjs` sees something real behind it.
3. **the ref:** read the docs site for the surface with `ref-read.mjs https://glisse.kelvinzhang.ca --surface <name>` and keep the row under `## sources`. the reviewer opens it beside the screen.
4. **the brand check:** its css lives in `node_modules`, which the check skips. your own code around it is checked as usual.
5. **the sweep:** the controls are 32 to 40 px tall. on a phone each sits inside a 44 px box with padding, so the probe measures the box, not the glass.
6. **browsers:** the refraction runs in chromium only. safari and firefox get a plain blur. sweep in webkit too and look at the screenshots: a glass control on a busy photo can lose contrast there. measure the text on it.
7. **reduced motion:** check the presses and the lens with `prefers-reduced-motion` on. what still moves goes in the hand test.
