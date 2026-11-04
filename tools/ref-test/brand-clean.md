status: confirmed 2026-11-04
owner: test
tokens: none
last checked: 2026-11-04

## color
| role | token | light | dark | contrast | use |
|---|---|---|---|---|---|
| ground | --ground | #fafaf7 | | | page |
| surface | --surface | #ffffff | | | fields |
| ink | --ink | #22221f | | 15.9 | text |
| accent | --accent | #1f6feb | | 4.6 | buttons |
| hairline | --hairline | #dddcd5 | | | header edge |
| field edge | --field-edge | #c8c8c0 | | | input border |
| row edge | --row-edge | #e5e5e0 | | | list rows |

## type
| role | token | family | size | weight | tracking |
|---|---|---|---|---|---|
| body | --font-body | "Planted Text", sans-serif | 17px | 400 | 0 |
| display | --font-display | "Planted Display", serif | 44px | 700 | -1px |

## shape and space
| role | token | value |
|---|---|---|
| radius | --radius | 7px |
| radius small | --radius-sm | 5px |

## components
| element | use | where | from | recipe |
|---|---|---|---|---|
| <button> | <Button> | <path/to/Button.tsx> | <that file, or a ## sources surface> | <one line> |
| button | `<button>` | site.html | site.html | accent fill, white text, 40px, 7px radius |
| text field | `<input>` | site.html | home | hairline edge, 5px radius, 38px |
| list row | `<li>` | site.html | http://localhost:4321/ | 48px, row edge below |
| empty state | `<p>` | site.html | list | one line, one action |

## sources
| surface | ref | how | evidence | date | values |
|---|---|---|---|---|---|
| <people list> | <url or file> | <read, user pic, user file, unread> | <.claude/refs/...> | <date> | <what was read> |
| home | http://localhost:4321/ | read | refs/site-2026-11-04 | 2026-11-04 | face Planted Display, body Planted Text 17px, button #1f6feb, radius 7px, row 48px |
| list | shot.png | user pic | tools/ref-test/refs/file-shot-2026-11-04/shot.png | 2026-11-04 | inferred, read by eye |
