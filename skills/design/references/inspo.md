# inspo: finding, reading and recording real products

every new surface copies the structure of one real product. the brand gives the values, the ref gives the layout. nothing is drawn from memory.

## where refs come from, in order

1. **what the user gave you:** a link, a screenshot, a file, a board, their live site, their other apps, a screen they liked. those beat any outside ref.
2. **what they saved:** a moodboard, liked posts, bookmarks, links from an earlier conversation.
3. **competitors and similar software, found by you.** ask once: "what do your users use today, or who are your closest competitors?". no answer, or "just go":
   - search the category: a web search for "<what it does> app", the app store's top results, the user's links and their links.
   - open two or three, pick the one that does each surface best (the list from one, the editor from another).
   - write the query and the pick under `## sources`, marked as yours, so the user can swap it.

## read it, keep the evidence

`node ~/.claude/tools/ref-read.mjs <url> --surface <name>`:

- opens it headless at 390 and 1440, saves both screenshots and the computed styles (body, headings, the first button and input, a list row, a hairline, the content width) to `.claude/refs/<host>-<date>/`
- prints the row for `## sources`
- behind a login: save a playwright storage state from a logged in session and pass `--storage state.json`
- a screenshot or file the user gave: `ref-read.mjs <file> --surface <name>` copies it into `.claude/refs/` and marks it `user pic`, values inferred by eye. pics count as real, they are the user's own pick
- motion: record frames (a screen recording or per frame screenshots), save them in the same folder, read timing and overshoot off them
- a ref you could not open stays `unread`, and the user is asked for screenshots or a logged in session. never a row for a ref nobody read
- open source refs: read the license. AGPL means look only, never copy code. MIT can be copied with the notice

## the row

one schema, in `brand.md` under `## sources`:

| surface | ref | how | evidence | date | values |
|---|---|---|---|---|---|
| people list | https://example.com/app | read | .claude/refs/example.com-2026-11-04 | 2026-11-04 | rows 40px, hairline alpha 0.08, Inter 14px |

- **how:** `read` (ref-read ran), `user pic`, `user file`, or `unread`.
- **evidence:** the folder or file it saved. `ref-check.mjs` fails a row whose evidence is missing.

the user's reaction to a ref goes into the taste file, verbatim and dated.

## what past rounds teach

- a first round that misses on fonts and background together means the refs were not read. go back to the brand and section 2 of the skill.
- one ref per surface beats a mood board of ten. ten refs average into nothing.
- a phone layout squeezed from desktop is rejected on sight.
- a live shader background lost to a baked image of the same thing. premium reads calm.
- a first build full of info gets called useless. cut it to what is used.
