# brand.md, the contract

`brand.md` is the one file every builder reads and every screen is checked against. short and literal: a value a script can find, the token it lives in, and who said yes to it. a filled one: [brand-example.md](brand-example.md).

## the shape

`tools/brand-check.mjs` reads the `tokens:` line, the value tables and the `## allow` and `## proposed` sections. `tools/ref-check.mjs` reads `status:`, `## sources` and `## components`. the rest is for people and the reviewer. keep the headings exactly as written.

- **a brand doc in another shape** (a long prose brief at `BRAND.md`, a pdf): leave it, write the contract beside it as `brand.md` (or `.claude/brand.md` on a case-insensitive disk where the names collide), and link both ways.
- **inferred lines:** an essence, voice or do line the code cannot give gets `(my pick)` or `(inferred)` until the owner reads it.
- **status:** `draft` (written, not read by the owner), `confirmed <date>` (the owner said yes), or `default, not chosen` (the neutral starter, nobody picked it; `ref-check.mjs --ship` fails it).
- **tokens:** the token files in code, comma separated, or `none`. the check reads them too.
- **shadcn on tailwind v3** stores colors as bare channels (`--primary: 222.2 47.4% 11.2%`): write the row as `hsl(222.2 47.4% 11.2%)`.
- **every value in a table is a literal:** a hex, an `rgb()` or `rgba()`, an `oklch()` (tailwind v4 and shadcn tokens), a font family, a px or rem. no `clamp()`, no "see above". fluid sizes live in code; the table holds the largest size.
- **one color vocabulary:** ground, surface, ink, muted ink, accent, accent ink, error, hairline. more roles only with a job (a data series, a warning).
- **dark:** a dark column filled in, or `none` in every dark cell when the product has no dark mode.
- **components:** the element kit, so every screen repeats the same parts. one row per element the product already ships (button, field, select, switch, segmented, chip, menu, dialog, toast, card, empty and error state, skeleton, nav): what to import, the file it lives in, `from` (that code file, or the `## sources` surface or ref it was copied from), its look in one line. a screen built only from these rows is on brand by construction. no kit yet (a new product): each element gets its row as the first screen ships it, copied from the surface's ref, never drawn from nothing. `ref-check.mjs` fails a row with no `from`. a new element needs the owner's yes: until then its row says `proposed` in the recipe, the same as a value under `## proposed`.
- **two surfaces** (a marketing site and an app) with separate token sets: one `brand.md` per surface, or one table per surface under each heading. say which tokens do not exist on which surface.
- **`## allow` is a decision, not a fix:** never add a value to get the check green. a hit is either drift (fix the code) or a new brand value (ask, then add it to the table).

```markdown
status: draft
owner: <who approves changes>
tokens: <comma separated paths to the token files in code, or none>
last checked: <date>

# brand: <product>

## essence
- what it is: <one line>
- for whom: <one line>
- feels: <three words>
- never: <three words>

## logo
- files: <paths>
- clear space: <px>
- smallest: <px>
- on dark: <which file>
- never: <stretch, recolor, outline, ...>

## color
| role | token | light | dark | contrast | use |
|---|---|---|---|---|---|
| ground | --ground | #... | #... | | page background |
| surface | --surface | #... | #... | | cards, sheets, inputs |
| ink | --ink | #... | #... | x:1 on ground | text you read |
| muted ink | --ink-muted | #... | #... | x:1 on ground, 4.5 or more | meta, captions |
| accent | --accent | #... | #... | x:1 on ground | the mark, the primary button, the selected state |
| accent ink | --accent-ink | #... | #... | x:1 on accent | text on an accent fill |
| error | --error | #... | #... | x:1 on ground | errors only |
| hairline | --hairline | rgba(...) | rgba(...) | | borders and dividers |

## type
| role | token | family | size | weight | tracking |
|---|---|---|---|---|---|
| display | --font-display | <family> | <px> | <weight> | <em> |
| heading | --font-sans | <family> | <px> | <weight> | <em> |
| body | --font-sans | <family> | <px> | <weight> | 0em |
| label | --font-mono | <family> | <px> | <weight> | <em> |

## shape and space
| role | token | value |
|---|---|---|
| radius | --radius | <px> |
| radius small | --radius-sm | <px> |
| shadow | --shadow | <full box-shadow value, or none> |
| spacing steps | --space-* | <px px px ...> |
| max width | --max | <px> |
| hit area | --hit | 44px |

## icons and imagery
- icons: <one set, outline or filled, stroke width>
- imagery: <photos, renders, none; what they show>
- never: <...>

## motion
- ease: <cubic-bezier(...)>
- durations: <ms, ms, ms>
- what moves: <press, one intro, ...>

## components
| element | use | where | from | recipe |
|---|---|---|---|---|
| <button> | <Button variant="primary"> | <path/to/Button.tsx> | <that file, or a ## sources surface> | <one line: fill, text, height, radius, press> |

not built: <elements that do not exist yet, and the stand-in to use until they do>

## voice
- <how it talks, one line>
- says: "<a real string from the product>"
- says: "<another>"
- never says: "<a string it would not use>"

## do and don't
- do: <the owner's words, verbatim>
- don't: <the owner's words, verbatim>

## allow
- <literal value>: <why it is allowed in code>

## proposed
| role | token | light | dark | from | why | asked |
|---|---|---|---|---|---|---|

## sources
| surface | ref | how | evidence | date | values |
|---|---|---|---|---|---|
| <people list> | <url or file> | <read, user pic, user file, unread> | <.claude/refs/...> | <date> | <what was read> |

## changes
- <date> <what changed> <who said so>
```

## filling it from what exists

| where | what to read |
|---|---|
| tokens in code | `tailwind.config.*`, `:root` custom properties in the global css, `theme.ts`, `tokens.json`, a ui kit's theme file |
| a brand doc | `brand.md`, `BRAND.md`, `docs/brand*`, `design-system.md`, a pdf or figma export |
| the live site | `ref-read.mjs <url>`: computed styles off body, headings, the first button and input, a row, a hairline, saved with screenshots |
| their other products | another app or site of theirs. ask if you do not know of one |
| the logo | svg or png in `public/`, `assets/`, the favicon |
| the element kit | `components/ui`, a design system package, the shared button, field and row files: grep for the button every screen imports |

a shadcn app: its `globals.css` is a token file, so the first change to it checks every token there. map the ones it ships (card, popover, muted, border, ring, chart and sidebar tokens) to roles on day one, or list the unused ones under `## allow` with why.

an app on stock tailwind or a ui kit (shadcn) with no custom theme keys: put the class keys it uses in the token column (`blue-600`, `rounded-lg`, `shadow-xs`) so the check accepts them.

1. map every token you find to a role in the vocabulary. a token with no role goes in the report as unused, never quietly kept.
2. measure every contrast cell with a real ratio. muted ink drifts too light and type on a bright accent is usually ink, not white: check those two first.
3. voice: quote real strings off the live product, not a description.
4. `## do and don't` holds only what the owner said, verbatim. leave it empty before inventing one.
5. status `draft`. show the owner the file, then `confirmed <date>`.

a font licensed to one project is not reusable in another. check before copying a face across.

## no brand: five questions

one message, all five:

1. what does it do, and for whom?
2. three words for how it should feel.
3. what your users use today, or your closest competitors. and one product you admire, and why.
4. one you do not want to look like.
5. light or dark?

then:

1. **find the real products.** read every one they named (question 3 and 4) with `ref-read.mjs`, one row each under `## sources`. question 4 is what to stay away from. a "just go" or no answer skips the questions, not the refs and not the looks: search the category yourself, open two or three similar products, read them, and offer the questions again after the first reaction.
2. **three live looks on one real screen** of the product, not a swatch page: a segmented control swaps them. each copies one read product or one of the user's pics, named on its option ("like <product>"), and is a full set (ground, ink, accent, face, radius). the neutral starter from [tokens.md](tokens.md) is used only when no browser can open anything, and then `brand.md` says `status: default, not chosen` until they pick.
   - the looks live in one file named `looks.css` (any `looks.*`). the brand check skips it in folder and git mode until the pick, so leave it out of any file list you pass by hand.
   - after the pick, move the winner's values into the token file and `brand.md`, then delete the losers and `looks.css`. `## allow` stays for third party literals only.
3. **the structure stays real too:** the screen under the looks copies the layout of the read product for that surface, not a stock layout.
4. **the pick goes into `brand.md`** as `confirmed <date>`, with their words under `## do and don't`.
5. **optional, a brand kit:** one page with the brand applied to three layouts (a landing hero, a dense list, a form), checked at a phone and a laptop width, before any repo change. the owner reads one page instead of a diff.

short beats complete. twenty literal lines the owner picked do more than a long book nobody read.

## gaps and drift

the rules are in [SKILL.md](../SKILL.md) section 1. how they land in the file:

- **a gap** is a row under `## proposed`: the role, a token name, the value derived from the nearest token (a hover one step darker than the accent, a warning from the error hue), why the screen needed it, and when the owner was asked. it moves into its table when they say yes.
- **drift** is a line under `## changes`: the date, the value, which side won (code or brand.md), who said so.
- **decided, not built:** the owner picked a new value but the code still ships the old one. the new value goes in the table, the old one under `## allow` with `until <what replaces it>`, and the line leaves when the code catches up.
- **how sure a rule is:** mark a line in `## do and don't` `(ruled)` when the owner decided it, `(shipped)` when it only describes what the code does, `(open)` when undecided: build on the default and ask before relying on it.
- **an allowed literal** (a payment widget's own color, used wherever checkout shows) goes under `## allow` with its reason. one line of someone else's brand gets `brand-check-ignore` instead ([SKILL.md](../SKILL.md) section 1).
