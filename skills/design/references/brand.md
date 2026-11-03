# brand guidelines

use the user's before making any. a brand you invent and the user did not pick is one more thing for them to say "no" to.

## 1. look for what exists

check these, in order, and note what each holds:

| where | what to read |
|---|---|
| tokens in code | `tailwind.config.*`, `:root` custom properties in the global css, `theme.ts`, `tokens.json`, a ui kit's theme file |
| a brand doc | `brand.md`, `BRAND.md`, `docs/brand*`, `design-system.md`, a figma or pdf export in the repo |
| the live site | open it in a browser, read computed styles off the real elements: body, h1, h2, the primary button, a card, a hairline |
| their other products | another app or site of theirs. ask if you do not know of one |
| the logo | svg or png in `public/`, `assets/`, the favicon |

## 2. found: extract into brand.md

write `brand.md` at the project root, or where the project keeps docs. short, measured, each value with its source.

```markdown
# brand

measured <date>

## sources
| ref | what was read | body | display | radius | hairline | button | spacing | motion |
|---|---|---|---|---|---|---|---|---|
| src/index.css, the live site | computed styles | ... | ... | ... | ... | ... | ... | ... |

## color
| role | value | from |
|---|---|---|
| ground | #fafaf9 | src/index.css:12 |
| ink / muted ink | #18181b / #67676f (5.1:1 on ground) | src/index.css:14-16 |
| accent | #... (text on ground variant #..., 4.5:1 or more) | tailwind.config.js:20 |
| error | #... | |
| hairline | rgba(24,24,27,.12) | |

## type
| role | face | size / weight / tracking / line height |
|---|---|---|
| display | ... | clamp(...) / 600 / -0.025em / 1.05 |
| body | ... | 16px / 400 / 0 / 1.55 |
| label, numbers | mono ... | 12px / 500 |

## shape and space
radius ..., space scale ..., gutter ..., max width ..., button height ...

## motion
ease ..., durations ..., spring ...

## voice
three lines max: how the product talks. quote real copy from the site.

## do not
the user's own no's for this brand, verbatim.
```

then use only what is in it. a new value goes into `brand.md` first, with the reason.

## 3. none: build it with the user

1. ask for three references they like, sites or apps, any field. if they have none, offer three and mark them as your pick.
2. open and measure all three. write each one's measured row into `brand.md` under `## sources`.
3. propose one short set drawn from them: a base pair, one accent, one face, one mono, one radius, one ease. one sentence on what came from which ref.
4. show it on one real screen of the product, not a swatch page. two or three variants at most, switchable live.
5. the user picks. write `brand.md` from the pick, then build.

short beats complete. a brand.md of twenty measured lines that the user picked does more than a long one nobody read.

## traps

- spec files drift from the code. when a doc and the live css disagree, the live css is what users see. say which and ask which wins.
- muted ink drifts too light. measure its contrast first.
- type on a bright accent fill is usually ink, not white. measure it.
- a font licensed to one project is not reusable in another. check before copying a face across.
