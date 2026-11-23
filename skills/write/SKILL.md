---
name: write
description: How to write anything a person reads, one plain register, the tells of machine text, a method. Invoke before a brief, spec, readme, message, commit or pr body, release note, or on "rewrite this", "sounds like ai", "make it plainer".
---

# write

plainer than anything a model writes by default. one register for everything a person reads, then the tells list over it before it goes out.

the user's own voice, if they described one, lives in `~/.claude/RULES.local.md` and wins over the register below. the tells list holds either way. a new voice rule goes there, never into this file: updates replace it.

commit messages: `playbook` `references/deploy.md`.

every reaction the user gives to copy ("sounds like ai", "too long", "this, exactly") goes into the taste file under `## copy`, verbatim and dated, the way `design` section 4 logs it. the same complaint twice is a rule for this user.

## the register

plain, lowercase, direct. capitals only for code, file names, and names of products and people quoted exactly.

**for docs** (briefs, specs, handovers, READMEs, setup steps, definitions of done):

- **headings are the question the reader has.** "why we're doing this", "what we're building", "how to build it", "edge cases", "definition of done". not "overview", "background", "objectives".
- **open with why.** the first section says what is wrong today, naming each manual step, not "the current process is inefficient".
- **the end state in one line.** a reader can quote it back.
- **numbered steps for anything sequential.** one action per line, present tense.
- **an opinion and a fallback.** "preferred route: x. fallback: y." never three options with equal weight left for the reader to pick.
- **specific to the point of naming things.** the exact file, path, folder, address, person. vagueness is the failure this register exists to prevent.
- **bold the lead-in of a list item, then explain.** "**multiple signers:** all of them sign, not just one."
- **say what you do not know**, with how to find out. honest uncertainty beats a confident guess.
- **end with a definition of done** as checkboxes, each one checkable by someone else.
- **no adjectives doing persuasion.** nothing is powerful, seamless or robust. things are slow, manual, error-prone, done, or not done.

**for messages the user sends as themselves:**

- the ask in the first line. no preamble, no "hope you're well, i wanted to reach out about".
- one idea per line. line breaks over long paragraphs.
- a concrete ask with a name on it: who does it, what it unblocks.
- the risk said plainly when there is one.
- no hedging stacks ("i think maybe we could possibly"). say it or do not.
- never oversell. let the numbers talk.

write it so the user can paste it without editing. a decision they have not made is a marked blank, never invented.

**text they will copy goes as plain lines or a code block, never a blockquote.** a message draft, a command, a reply: the `>` bars come along with the copy and land in what they send.

**the user's own words stay theirs.** when cleaning up a page or a doc, cut chrome, labels and filler freely, but anything they wrote in the first person is kept word for word, typos and caps included. new copy you had to add is short and flagged as yours so they can swap it.

**no invented story.** a name, a mascot, a product origin: the true origin in one or two plain lines, or nothing. no slogans, no tagline cadence, no "same x, bigger y".

## the tells, cut every one

**em dashes and en dashes. zero.** comma, full stop, colon, or two sentences. the single most reliable machine tell.

**words that mark it instantly:** delve, leverage, robust, seamless, streamline, elevate, empower, unlock, harness, foster, navigate (figurative), landscape (figurative), realm, testament, tapestry, cutting-edge, game-changer, best-in-class, comprehensive, holistic, myriad, plethora, crucial, vital, pivotal, ensure that, it is important to note, at the end of the day.

**shapes:**
- "it's not just x, it's y"
- "in today's fast-paced world"
- three-item lists everywhere, three adjectives in a row
- a closing paragraph that restates what was just said
- "let's dive in", "let's break it down", "i hope this helps"
- rhetorical questions as headings
- bold on whole sentences instead of the two words that matter
- emoji in anything professional
- every section the same length, every list the same shape
- introducing a document by describing the document
- explaining what you are about to explain
- symmetry for its own sake
- a summary table restating the prose right above it

**punctuation:** straight apostrophes and quotes, not typographic curls, unless quoting a document that uses them.

## method

1. write the thing.
2. read it back and delete every sentence that says nothing new. usually the first and the last.
3. check for dashes: `perl -CSD -ne 'print "$.: $_" if /[\x{2013}\x{2014}]/' file`. zero hits or fix it.
4. scan for the word list.
5. could someone who was not in the conversation read this and act on it? if not, it needs the missing fact, not more words.

## before and after

machine:

> This document provides a comprehensive overview of the onboarding automation initiative. Our goal is to streamline the existing manual process and deliver a seamless experience, ensuring that new accounts are set up efficiently and without friction.

plain:

> right now onboarding is manual: copy the details from the form into the admin, create the account, email the login by hand. it's slow, error-prone, and it leaves a gap between "customer says yes" and "customer can log in".
>
> end state: the form submits, the account exists, the login email sends. nobody touches it.

half the words, twice the information, and a line worth quoting.
