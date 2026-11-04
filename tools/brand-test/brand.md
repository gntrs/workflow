status: confirmed 2026-11-03
owner: test
tokens: tokens.css, tailwind.config.js
last checked: 2026-11-03

## color
| role | token | light | dark | contrast | use |
|---|---|---|---|---|---|
| ground | --ground | #fbfbfa | #111113 | 17.8 | page |
| surface | --surface | #ffffff | #1c1c1e | | cards |
| ink | --ink | #1a1a1a | #f2f2f0 | 16.1 | text |
| accent | --accent | rgb(0, 102, 255) | hsl(216, 100%, 60%) | 4.6 | links |
| shadow color | --shadow-color | rgba(0, 0, 0, 0.08) | | | shadows |

## type
| role | token | family | size | weight | tracking |
|---|---|---|---|---|---|
| body | --font-body | Inter, sans-serif | 16px | 400 | 0 |
| mono | --font-mono | "JetBrains Mono", ui-monospace | 0.875rem | 400 | 0 |

## shape and space
| role | token | value |
|---|---|---|
| radius | --radius | 8px |
| radius pill | --radius-pill | 999px |
| spacing steps | --space-* | 4px 16px 24px |
| shadow | --shadow | 0 1px 2px rgba(0, 0, 0, 0.08) |

## allow
- transparent  css keyword
- #1da1f2  the x share button, third party

## proposed
| role | token | light | dark | from | why | asked |
|---|---|---|---|---|---|---|
| accent hover | --accent-hover | #0052cc | | accent #0066ff, one step darker | no hover state | 2026-11-03, waiting |
| radius large | --radius-lg | 12px | | radius, one step up | sheets look cramped | 2026-11-03, waiting |
