# the whiteboard: let the user pick by marking

people pick faster than they describe. so before a look gets built, show many real options at once and let the user mark each one right or wrong. their marks, not your read of their words, become the brief. it runs before [three directions](loop.md#two-nos-three-directions) on any screen with no agreed look, and it replaces step 3 of the loop (2 or 3 live options) when the question is too open for three.

this is not a mood board. a mood board of ten refs averages into nothing ([inspo.md](inspo.md#what-past-rounds-teach)). the board holds many refs so the user can throw most of them out. only what they mark right goes into the brief.

## the pipeline

1. **refs, read with tools.** a pin search first, then real products.
2. **one private board.** every card has right, wrong and a note, saved to a store you can read back.
3. **the user marks it,** on their phone, in their own time.
4. **read the marks back.** never from memory of the chat.
5. **a brief that quotes the marks verbatim.**
6. **three builders on three compositions** from that one brief.
7. **a fresh reviewer picks one** and prefires the user's "no".
8. **one fix round** on the pick.
9. **the user sees one.**
10. **the size sweep,** on a spare machine.

steps 6 to 9 are [three directions](loop.md#two-nos-three-directions). this file covers 1 to 5 and 10.

## 1. refs, read with tools

- **pinterest first.** 6 to 10 searches named for the screen, the way a person would type them: "kpi dashboard minimal", "weekly report ui", "habit tracker streak app", "mobile dashboard dark". the browser tools, a new tab, no login, nothing saved to an account. close the tab after.
- **then real products,** when a pin wall runs thin: public demo pages, marketing screenshots, docs with real screens. read them with `ref-read.mjs` like any other ref ([inspo.md](inspo.md)).
- **20 to 40 images,** saved to the private notes (`.claude/refs/<topic>-board/` or the brain), with a `refs.md`: file, source url, what to take, what to avoid. a private reference only, never shipped, never committed.
- the user's own saves and screens go on the board too, marked as theirs.

## 2. the board

one private page the user opens on their phone. it needs a store you can read back after they mark it: a hosted page with its own small database, a form, a doc with checkboxes. a page that keeps marks only in the browser's local storage is not enough, you cannot read it.

- **clusters, in this order:** the ref wall first, then a few idea cards per part of the screen (each a small html or svg mock on invented data), then 3 candidate compositions that differ in what the page is, each at phone and desktop.
- **every card:** a **right** button, a **wrong** button and a note field. saved per card: the card id, the verdict, the note, the time.
- a running count on top: "n right, n wrong, n left", and a filter for unmarked cards.
- on a phone it opens as a list, one card per row. a board view with pinch zoom sits behind a segmented control.
- invented data only. never a real company's numbers, never anyone's real name.
- the board is front end work too: the sweep runs on it (chromium and webkit) before the user sees the link.

keep the idea cards few. in the round this was learned from, the user marked only the refs: one right, a dozen notes, two dozen wrong. the idea cards and compositions went unmarked. the refs carry the decision.

## 3. the user marks it

send the link with one line: what the board is for and that a note counts. then wait. do not build while the marks are coming in, the marks are what the build is for.

## 4. read the marks back

read the store, not the chat. sort into three piles:

- **right.** the verdict says right.
- **close.** a note with no verdict, or a note that hedges a verdict: "close", "almost", "kinda", "sick but too colorful". weigh a close above a silent card. keep the note word for word.
- **wrong.** the verdict says wrong.

open every right and close image yourself before writing anything. a pattern across the wrong pile ("icons in every tile", "colored pills", "donuts") is worth naming, and it is your read, so it says so.

## 5. the brief, from the marks

the [directions brief](loop.md#directions-brief) gets one more block, above "what they said about the look":

```
what they marked on the board, <date>, verbatim:
  right:
    - <ref file> "<their note, if any>"
  close:
    - <ref file> "<their note>"
  wrong (the avoid list):
    - <ref file> "<their note, if any>"
my read of the pattern, not their words:
  <one paragraph>
```

- the right pile first, then close, with each note exactly as written, typos and caps kept.
- the wrong pile is the avoid list. every builder and the reviewer get it.
- your read of the pattern is labeled as yours, so a builder can tell their words from your guess.
- the three directions each take one ref from the right or close pile as their structure. a direction with no marked ref behind it is a guess.

## 10. the sweep, on a spare machine

three builders, three dev servers and two browser engines fill a laptop's memory. run the sweep on a spare machine when there is one (a desktop, a home server, a cloud box), not the laptop the user is working on. serve the pick there, or point the probe at its url.

- chromium and webkit, every size in the probe's list.
- page overflow 0.
- targets under 44 px on phones 0.
- text under 12 px 0.
- say which numbers were measured on which engine. no spare machine: run it locally, one engine at a time, and say so.

the probe and the thresholds: [verify.md](verify.md).
