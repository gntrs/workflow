---
name: brain
description: Optional, only if the brain is installed. A second brain in an Obsidian style vault (`$VAULT`, default `~/vault`). Answers "what's open", "what did we decide", "what do i like", "what do we know about X" from the vault with [[links]] and sources, or files what the user says into the right typed folder. Invoke on /brain, "ask the brain", "what did we decide on", "remember this", "note this", "put this in the vault", "file this", or at the start of a session on a repo when the open items are not already in context.
---

# brain

optional: only if the brain is installed. without it, notes live in each repo's gitignored `.claude/` (`playbook`, `references/notes.md`) and this skill has nothing to do.

the vault is `$VAULT` if set, else `~/vault`. it is the one place that knows what is open, what was decided and what the user likes. a fresh one is made from this repo's `brain-template/`.

## first

`test -d "${VAULT:-$HOME/vault}"`. missing: say "no vault on this machine" in one line. do not guess from memory, do not answer from general knowledge. offer setup once: copy `brain-template/` to `~/vault` (or a path the user names, then `VAULT` points there). nothing is created without their yes.

## answering

read in this order, stop when the answer is found:

1. `HOME.md`, the map
2. `now.md`, open items across every project
3. `projects/<repo>/<repo>.md` and `<repo>-tbd.md`, the repo from `git remote -v` or the one the user names
4. `decisions/`, newest first, grep the topic
5. `taste/` for anything visual or copy
6. `memory/` for gotchas, machines, how people work

answer shape:

- the answer first, one to five lines.
- every fact carries its source as a `[[note]]` link, and a date if it can be stale.
- two notes disagree: say so, name both, say which is newer. never pick silently.
- a note about code (a bug is live, a trap exists) is checked against the code before it is repeated. the code wins, and the note gets fixed.
- not in the vault: say "not in the vault" and stop.

## filing

when the user says remember, note, file, or gives a fact worth keeping:

| it is | goes to |
|---|---|
| a decision, what and why | `decisions/YYYY-MM-DD-<slug>.md` |
| a reaction to a design or copy | `taste/` |
| a machine, account, infra gotcha | `systems/` |
| how a person works: role, how they review | `people/<name>.md` |
| a project fact, plan, open item | `projects/<repo>/`, the hub or the tbd |
| a lesson for future sessions | `memory/`, with a line in `MEMORY.md` |
| not sure | `inbox/`, /dream files it later |

folders that do not exist yet are created on first use.

every note:

- frontmatter: `type`, `project`, `date`, `status`. nothing else required. `memory/` keeps its own format (see `memory/MEMORY.md` in the vault).
- synthesis on top, rewritten when it changes. a `## timeline` below it, append only, newest first, one dated line per entry.
- links both ways. the new note links its hub, and the hub gets a line linking back.
- a unique basename. never `plan.md`, `log.md`, `notes.md`: Obsidian resolves a bare `[[log]]` to whichever it finds first. dated notes keep their date prefix.
- say where it went in one line: `filed: [[2026-01-15-drop-the-legacy-api]], linked from [[_example]]`.

## per repo, as the work happens

cook writes these, not the user: `projects/<repo>/<repo>-log.md` (newest first: date, branch, what changed, what is open) and `<repo>-tbd.md` (checkboxes grouped by who moves next, `## cooking` on top while a task is live). a repo without a folder gets one copied from `projects/_example/`, renamed.

## never

- secrets. no keys, tokens, passwords, recovery codes, not even a prefix. a pasted secret gets "not filed, that is a secret" and nothing written.
- personal data about other people beyond work context. role, projects, how they review: yes. emails, phone numbers, private profiles, scraped lists: no.
- rewording the user's own first person lines. quote them as written.
- deleting a note. something superseded moves to `archive/` with a link from what replaced it.
