# tokens

copy a whole set, do not mix sets. a project that ships tokens keeps them: read them from the code into `brand.md`. this file gives the shape every set should have and a neutral starter for a project with none.

## the shape of a set

| role or token | what it holds |
|---|---|
| ground | the page background, plus one or two sunk steps if needed |
| surface | cards, sheets, inputs, one step off the ground |
| ink | text you read |
| muted ink | meta and captions, still 4.5:1 or more on ground. a disabled step below it is never for text you must read |
| accent | one flat value, rationed |
| accent ink | text on an accent fill, by measured contrast |
| error | errors only |
| hairline | low alpha ink at one to three strengths, not solid greys |
| sans | one face for everything read |
| mono | labels and numbers only |
| type scale | display, heading, lead, body, label, as `clamp()` in code |
| space | one scale, used everywhere |
| gutter, max | page padding and max width |
| radius | one value, plus a small one if needed |
| ease, durations | one page ease, one in-out, small, medium, large |

## the neutral starter

only when nothing real can be opened (no browser, no refs, no pics), so a "just go" still gets real looks first. copy it into `brand.md` as written, with `status: default, not chosen`, and `ref-check.mjs --ship` fails until the owner picks. the accent is ink on purpose: nobody picked a hue yet, and the first look round picks one.

```markdown
## color
| role | token | light | dark | contrast | use |
|---|---|---|---|---|---|
| ground | --ground | #fafaf9 | #111113 | | page background |
| surface | --surface | #ffffff | #1a1a1d | | cards, sheets, inputs |
| ink | --ink | #18181b | #ededef | 17.0:1 light, 16.1:1 dark on ground | text you read |
| muted ink | --ink-muted | #67676f | #a0a0a8 | 5.4:1 light, 7.3:1 dark on ground | meta, captions |
| accent | --accent | #18181b | #ededef | 17.0:1 light, 16.1:1 dark on ground | the primary button, the selected state |
| accent ink | --accent-ink | #ffffff | #111113 | 17.7:1 light, 16.1:1 dark on accent | text on an accent fill |
| error | --error | #d61f2c | #ff6b6b | 4.9:1 light, 6.8:1 dark on ground | errors only |
| hairline | --hairline | rgba(24,24,27,0.12) | rgba(237,237,239,0.14) | | borders and dividers |

## type
| role | token | family | size | weight | tracking |
|---|---|---|---|---|---|
| display | --font-sans | system-ui | 56px | 700 | -0.025em |
| heading | --font-sans | system-ui | 28px | 700 | -0.02em |
| body | --font-sans | system-ui | 16px | 400 | 0em |
| label | --font-mono | ui-monospace | 12px | 500 | 0.02em |

## shape and space
| role | token | value |
|---|---|---|
| radius | --radius | 12px |
| radius small | --radius-sm | 6px |
| shadow | --shadow | none |
| spacing steps | --space-* | 4px 8px 12px 16px 24px 32px 48px 64px 96px |
| max width | --max | 1220px |
| hit area | --hit | 44px |
```

in code the families are full stacks and sizes are fluid:

| token | value |
|---|---|
| sans | `ui-sans-serif, -apple-system, 'Segoe UI', system-ui, sans-serif` |
| mono | `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace` |
| display | `clamp(2.5rem, 7.4vw, 3.5rem)` |
| heading | `clamp(1.4rem, 3vw, 1.75rem)` |
| body | `clamp(1rem, 1.1vw, 1.06rem)`, line height 1.5 to 1.6 |
| label | `.75rem`, never under 12px on a phone |
| root size | 16px; reading pages may step to 17.5px from 1200 and 18.5px from 1600, dense app ui stays near 15px body |
| gutter | `max(clamp(16px, 4.5vw, 64px), env(safe-area-inset-left), env(safe-area-inset-right))` |
| ease | `cubic-bezier(.22,1,.36,1)`, in-out `cubic-bezier(.65,0,.35,1)` |
| durations | 180, 320, 560ms |

## rules that came with sets that shipped

- type on a bright accent fill is accent ink, usually dark: a mid orange with white text sat near 2.3:1, with ink near 7.8:1. measure it.
- muted ink drifts too light. one set had it at 3.3:1 and had to move to 5.3:1. check it before anything else.
- emphasis in a headline is one solid word in the accent or muted ink, never a gradient.
- a dark set follows the same shape, flipped. keep the same face and scale when copying type from a light page into a dark one.
- per os tuning is allowed: ios glass more opaque, android display tracking a hair looser and a cheaper blur. set a `data-os` attribute before paint.
- radius reads: small (3 to 6px) editorial, 12 to 20px app.

## OPEN, the owner decides

- serif ever. some editorial pages carry one well, app ui almost never does.
- extra accents defined in a set but unused: give them a job or delete them.
