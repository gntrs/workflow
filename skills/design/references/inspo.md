# inspo: finding, measuring and recording refs

## check these first

1. what the user already owns: their live site, their other apps, a screen of theirs they liked. those beat any outside ref.
2. what they saved: a moodboard (an image tool's uploads, a board, a folder), liked posts, bookmarks, links they sent in this or an earlier conversation.
3. only then, outside refs you pick. mark them as yours.

## measure, do not eyeball

open each ref in a real browser and read computed styles off real elements. per ref, one row:

| ref | body face / size / line height | display size / weight / tracking | radius | hairline | button height | spacing steps | motion (ease, ms) |
|---|---|---|---|---|---|---|---|

- for motion, record frames (a screen recording or per frame screenshots) and read timing and overshoot off them.
- a ref you could not open (a code sandbox that blocks fetch, a login wall) is written down as unread, and the user is asked to paste it. never describe a ref you did not see.
- open source refs: read the license. AGPL means look only, never copy code. MIT can be copied with the notice.

## kinds of ref that have paid off

- high craft indie app pages, textures behind ui, pages alive without reveal on scroll.
- liquid glass done well on the web, for chrome only.
- section galleries for a single part of a page: navbar, hero, footer galleries.
- a one inset sheet layout, a page with no nav at all, 3 percent grain, a restrained glass header pill.
- the minimal pro tools people already trust (calm greys, one radius, weight 500 headings with negative tracking, 8 percent hairlines) when the ask is "clean, professional".

## how to record a ref

one line per ref, newest first, in the taste file (the brain if installed, `~/vault/taste/`, else `.claude/taste.md` in the repo):

| date | ref | what it was for | the user's word | measured values or where they live |
|---|---|---|---|---|

"they sent" and "they liked" are the user's. "I picked" is yours and is marked as yours.

## what past reactions teach

- a first round that misses on fonts and background together means the refs were not read. go back to section 1 of the skill.
- reveal on scroll and phone layouts squeezed from desktop get rejected on sight.
- a live shader background lost to a baked image of the same thing. premium reads calm.
- many small cutouts scattered around read as clutter. keep two, by the thing that matters.
- a first build full of info gets called useless. cut it to what is used.
- simpler pages, aligned boxes, a readable round font, clean on first sight: the default ask for any dashboard.
