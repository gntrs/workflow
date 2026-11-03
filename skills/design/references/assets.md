# assets: renders, cutouts, photos, icons

## where images come from

| source | good for | notes |
|---|---|---|
| an image generation tool, a strong photoreal model | product renders with transparency, 3d mascot renders, direction mockups | log the credits before and after, every time |
| a fast image model | wallpapers, glows, backgrounds | cheap, a few credits |
| a pro model at 2k | people and animals true to life | simple short prompts work best |
| upscale and background removal | taking a phone photo up to 2880 wide | |
| a chat assistant's image tool | single objects, cutouts | transparent png comes with a halo, needs the alpha route |
| renders on white | small card objects, og images | the multiply route |
| local screenshots of the real app | product shots | run the app on public sample data. never screenshot real personal folders |

- generated product photos are stand ins only, never shipped as someone's real work.
- check the owner's uploads for a moodboard before inventing a mood.

## cutouts, two routes

- **white ground (multiply):** bbox of anything under 236, near white pushed to 255, webp at 720 and 360, placed with `mix-blend-mode: multiply` so the white goes and the shadow stays.
- **colored ground or halo (alpha):** in a headless chromium canvas if the machine has no image libraries. harden alpha (`(a-0.4)/0.6` for soft subjects like clouds, `(a-0.45)/0.55` for hard ones), pull soft edge pixels toward the subject color, crop, export webp at two widths.
- the hard case, a subject on two different grounds: flood from the border by chroma distance. the numbers are per render.
- tracing a png into an svg path without potrace: a small png decoder plus moore contour tracing.
- a black ground under `mix-blend-mode: screen` must be exactly `#000000`. re-measure after any re-encode.
- a picture that other overlays are placed on (a screen inside a device, a seat on a hill) means re-measuring by pixel for every new render.

## baked over live

- a sky or background as two baked webp layers rendered from an svg, the lit layer drifting by css, beat a live shader on look and on phone cost.
- halftone baked in a headless canvas, separate cells per size so neither moires.
- grain: inline svg feTurbulence 0.8, two octaves, tiled 200px, about 3 percent, pointer events none. paper reads as paper, never dirty.

## sizes

- two widths of every raster (`hero.webp` 1774 and `hero-900.webp`, `-360` sizes for card art).
- preload the hero image with `fetchpriority`. preloading tall decorative layers measured useless.

## photos and people

- photos with other people in them stay unused unless they agreed.
- personal data about other people stays out of anything shared.
