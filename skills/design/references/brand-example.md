status: confirmed 2026-10-14
owner: the founder
tokens: src/styles/tokens.css, tailwind.config.ts
last checked: 2026-10-30

# brand: truewheel

an invented product, filled in to show every field. the values are real and their contrasts measured; the company is not.

## essence
- what it is: a booking and job board app for small bike repair shops
- for whom: two or three mechanics who book repairs on a phone between jobs, and the riders who drop bikes off
- feels: calm, handmade, exact
- never: sporty, loud, techy

## logo
- files: public/logo.svg, public/logo-mark.svg, public/logo-dark.svg
- clear space: 16px on every side
- smallest: 20px tall for the mark, 96px wide for the full logo
- on dark: public/logo-dark.svg, never the light file on a dark ground
- never: stretch, recolor outside accent or ink, add a shadow or outline, put it on a photo

## color
| role | token | light | dark | contrast | use |
|---|---|---|---|---|---|
| ground | --ground | #f7f5f0 | #141413 | | page background |
| surface | --surface | #ffffff | #1e1d1b | | cards, sheets, inputs |
| ink | --ink | #1c1b19 | #efece6 | 15.8:1 light, 15.6:1 dark on ground | text you read |
| muted ink | --ink-muted | #6b675f | #a39e94 | 5.2:1 light, 6.9:1 dark on ground | meta, timestamps, captions |
| accent | --accent | #0f6b5c | #3fb8a2 | 5.9:1 light, 7.5:1 dark on ground | the mark, the primary button, the selected job |
| accent ink | --accent-ink | #ffffff | #0b1f1b | 6.4:1 light, 7.0:1 dark on accent | text on an accent fill |
| error | --error | #c62828 | #ff6e6e | 5.2:1 light, 6.8:1 dark on ground | failed payment, a missed slot |
| hairline | --hairline | rgba(28,27,25,0.12) | rgba(239,236,230,0.14) | | borders and row dividers |

## type
| role | token | family | size | weight | tracking |
|---|---|---|---|---|---|
| display | --font-sans | Inter | 40px | 600 | -0.025em |
| heading | --font-sans | Inter | 20px | 600 | -0.01em |
| body | --font-sans | Inter | 15px | 400 | 0em |
| label | --font-mono | JetBrains Mono | 12px | 500 | 0.02em |

## shape and space
| role | token | value |
|---|---|---|
| radius | --radius | 10px |
| radius small | --radius-sm | 6px |
| shadow | --shadow | 0 1px 2px rgba(17,17,19,0.08) |
| spacing steps | --space-* | 4px 8px 12px 16px 24px 32px 48px |
| max width | --max | 1120px |
| hit area | --hit | 44px |

## icons and imagery
- icons: one outline set, 1.5px stroke, 20px, on controls only
- imagery: the shop's own photos of bikes on the stand, cropped tight, no people unless they agreed
- never: stock photos of riders, illustrations of bikes, icons as decoration next to headings

## motion
- ease: cubic-bezier(0.22, 1, 0.36, 1)
- durations: 160ms, 280ms, 480ms
- what moves: press (scale 0.97 on pointer down), a job card sliding to its new column, nothing on load

## components
| element | use | where | recipe |
|---|---|---|---|
| button | `<Button variant="primary">`, `"secondary"`, `"quiet"` | src/ui/Button.tsx | primary accent fill, accent ink text, 44px, --radius, press scale 0.97; one primary per screen |
| text field | `<Field label>` | src/ui/Field.tsx | hairline edge, --radius-sm, 16px text on phones so ios does not zoom, error line under it, no red border |
| segmented | `<Segmented options>` | src/ui/Segmented.tsx | max 3 options, picked lifts to surface with --shadow, never accent |
| job card | `<JobCard>` | src/board/JobCard.tsx | surface, hairline edge, --radius, price top right in tabular nums |
| empty and error | `<StateCard tone>` | src/ui/StateCard.tsx | empty: one line and one action. error: what happened, then what to do |
| loading | `<Skeleton>` | src/ui/Skeleton.tsx | the real layout in --hairline, no spinner outside a button |

not built: toast, tooltip, table. stand-ins: a line under the control for a toast, a `<JobCard>` list for a table. ask before adding one.

## voice
- short, like a mechanic texting a customer. numbers over adjectives.
- says: "your bike is ready. 2 parts, 45 min, 38 eur."
- says: "no slots left today. next one is thu 9:00."
- never says: "we're thrilled to let you know your ride is good to go!"

## do and don't
- do: "it should look like a clean workbench"
- do: "the price is always visible before they book"
- don't: "no bright green, we're not a gym app"
- don't: "no little bike icons everywhere"

## allow
- #635bff: the payment provider's embedded checkout button, its brand, not ours

## proposed
| role | token | light | dark | from | why | asked |
|---|---|---|---|---|---|---|
| accent hover | --accent-hover | #0d5a4d | #5cc7b3 | accent, one step darker in light, lighter in dark | the primary button had no hover state | 2026-10-29, waiting |

## sources
| ref | what was read | values |
|---|---|---|
| the shop's old booking page | computed styles, 2026-10-12 | body Inter 15px, radius 10px, accent #0f6b5c |
| a calm notes app the founder named | computed styles, 2026-10-12 | hairline rgba alpha 0.12, row height 44px, heading weight 600 |
| a fitness app the founder does not want to look like | screenshots, inferred | saturated green, heavy shadows: what to stay away from |

## changes
- 2026-10-30 radius on the job card was 12px in code, brand.md said 10px. founder: brand wins, code fixed.
- 2026-10-14 confirmed from look b of three. founder: "b, but less green"
- 2026-10-12 draft written from the old booking page
