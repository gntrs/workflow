# tokens

copy a whole set, do not mix sets. if the project already ships tokens, read them from the code and use those. this file gives the shape every set should have and a neutral starter set for a project with none.

## the shape of a set

| token | what it holds |
|---|---|
| bg | the ground, plus bg-2 and bg-3 for sunk areas, and a card value one step lighter |
| ink | ink, ink-2, ink-3 (muted, still 4.5:1 or more on bg), ink-4 (disabled, never for text you must read) |
| accent | one flat value, a hover value, a text-on-bg value that passes 4.5:1, an error red |
| lines | low alpha ink at three strengths, not solid greys |
| sans | one face for everything read |
| mono | for labels and numbers only |
| type scale | hero, h2, h3, lead, body, meta, as `clamp()` |
| root size | steps up on big screens |
| space | one scale, used everywhere |
| gutter / max | page padding and max width |
| ease | one page ease, one in-out |
| durations | small, medium, large |
| radius | one value, plus a small and a large if needed |

## starter set (light, neutral, one accent)

| token | value |
|---|---|
| bg | `#fafaf9`, bg-2 `#f2f1ee`, bg-3 `#e8e6e1`, card `#ffffff` |
| ink | `#18181b`, ink-2 `#46464d`, ink-3 `#67676f`, ink-4 `#b0b0b6` |
| accent | pick one flat hue for the project. keep a darker text variant at 4.5:1 or more on bg. error `#d61f2c` |
| lines | `rgba(24,24,27,.12)`, `.07`, strong `.24` |
| sans | `ui-sans-serif, -apple-system, 'Segoe UI', system-ui, sans-serif` |
| mono | `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace` |
| hero | `clamp(2.5rem, 7.4vw, 5.4rem)` |
| h2 / h3 | `clamp(1.75rem, 3.7vw, 2.75rem)` / `clamp(1.15rem, 2vw, 1.45rem)` |
| lead / body | `clamp(1.06rem, 1.55vw, 1.25rem)` / `clamp(1rem, 1.1vw, 1.06rem)` |
| meta | `clamp(.68rem, .92vw, .76rem)`, `.75rem` under 640 |
| root size | 16px, 17.5px from 1200, 18.5px from 1600 (reading pages; dense app ui stays near 15px body) |
| space | `4 8 12 16 24 32 48 64 96 136` |
| gutter / max | `max(clamp(16px, 4.5vw, 64px), env(safe-area-inset-left), env(safe-area-inset-right))` / `1220px` |
| ease | `cubic-bezier(.22,1,.36,1)`, in-out `cubic-bezier(.65,0,.35,1)` |
| durations | 180, 320, 560, 620ms |
| radius | one per project. 3px reads editorial, 12 to 20px reads app |
| body | line-height 1.5 to 1.6 |
| h2 | 700, line-height 1.08, `-0.025em`, `text-wrap: balance` |
| mono label | uppercase, `.1em`, ink-3, 500, small labels only |
| emphasis in a headline | color ink-2 or the accent as one solid word, never a gradient, no italic unless the cut is loaded |

## rules that came with sets that shipped

- type on a bright accent fill is ink, not white. measure it: a mid orange with white text sat near 2.3:1, with ink near 7.8:1.
- muted ink drifts too light. one set had ink-3 at 3.3:1 and had to move to 5.3:1. check it before anything else.
- "the one colored word" in a hero is a solid accent, never a gradient. a gradient there was disliked on sight.
- per os tuning is allowed: ios glass more opaque, android display tracking a hair looser and a cheaper blur. set a `data-os` attribute before paint.
- a dark set follows the same shape, flipped. keep the same face and scale when copying type from a liked light page into a dark one.

## stale sources

project design docs drift from the code. when a spec file says one thing and the live css says another, the live css wins. reveal on scroll in an old spec is still banned.

## OPEN, the owner decides

- serif ever. some editorial pages carry one well, app ui almost never does. ask.
- extra accents defined in a set but unused. either give them a job or delete them.
