---
name: dream
description: Optional, only if the brain is installed. Maintenance for the vault (`$VAULT`, default `~/vault`). Fixes broken links and missing backlinks, finds orphans and duplicate names, lints frontmatter, regenerates now.md from every tbd, checks memory claims against the code, flags secret shaped strings by path only, files inbox/. Writes a report to sessions/. Invoke on /dream, "clean the vault", "tidy the brain", "fix the links", or at the end of a long day of sessions.
---

# dream

optional: only if the brain is installed. keeps the vault honest. edits vault files only. never deletes: anything dead moves to `archive/` with a link from what replaced it.

the vault is `$VAULT` if set, else `~/vault`. below, `V` means that path.

## first

- `test -d "$V"`. missing: say "no vault on this machine", do not guess, offer to set one up from this repo's `brain-template/` (the `brain` skill has the step), and stop.
- no other session is writing the vault right now. if one is, do the read only checks and stop before the passes that write.

## the two scripts, run them first

both are plain python 3, no packages, beside this file.

- `python3 -I <this skill>/linkcheck.py "$V" -v`: broken links, duplicate names, orphans, cloud-evicted files. read only, exit 1 if anything is broken.
- `python3 -I <this skill>/index.py "$V"`: rewrites only the `<!-- auto:index -->` blocks in every hub and `HOME.md`, and `now.md`. creates a missing log or tbd beside a hub.

`<this skill>` is the folder holding this file, usually `~/.claude/skills/dream`.

## passes, in order

1. **links.** every `[[x]]` resolves to exactly one file. broken: fix it when the target is obvious (renamed, moved), else list it.
2. **duplicate basenames.** two files with the same name: list both. rename the newer one only when nothing links it by the bare name yet.
3. **backlinks.** a note links a hub, the hub links it back. add the missing line on the hub.
4. **orphans.** notes with no inbound link. link them from their project hub or `HOME.md` when the home is obvious, else list.
5. **frontmatter.** every note has `type`, `project`, `date`, `status`. fill what can be read from the path and file name. `memory/` keeps its own format: lint it, do not reshape it.
6. **now.md.** rebuilt by `index.py` from every `projects/*/*-tbd.md`: the open `- [ ]` items grouped by project, each linking its tbd. overwrite only `now.md`.
7. **memory claims.** for each memory file:
   - a git sha: `git -C <repo> cat-file -e <sha>`, and whether it is still the branch head it claims.
   - a path: exists or not.
   - a claim about code (a bug is live, a function exists): read the code.
   - wrong: fix the line and add `checked YYYY-MM-DD`.
   - not checkable: add `as of YYYY-MM-DD` if it has no date.
8. **secrets.** grep for key shapes: `sk-`, `sk_live_`, `ghp_`, `github_pat_`, `xox[bp]-`, `AKIA`, `eyJ` jwt bodies, `-----BEGIN`, `password\s*[:=]`, recovery code blocks. flag the **path and line number only**. never quote the match, never print any part of it, never edit it out on your own. the user decides.
9. **inbox.** each note in `inbox/` goes to its typed folder per `brain`'s table, with links both ways. not sure: it stays and is listed.
10. **logs.** two entries with the same heading in one log (two sessions wrote at once): merge them under one heading, keep every line.

## report

`sessions/YYYY-MM-DD-dream.md`, frontmatter `type: session`, linked from `HOME.md` (index.py lists it).

```
## fixed
- 6 broken links, 4 backlinks, 12 frontmatter blocks, now.md (41 items, 9 projects)
## for the user
- secret shape in projects/x/research/notes.md:14, look at it
- duplicate name: export-plan.md in two folders
- 3 orphans with no obvious home: [[a]], [[b]], [[c]]
## memory
- a project note claimed main was <old sha>, it is <new sha>, fixed
- a note said a bug was live, the code has the fix, note fixed
```

then three lines in chat: what was fixed, how many items wait on the user, the report link.

## never

- deletes, `rm`, or anything outside the vault.
- commits or pushes the vault. if it is a git repo, say what changed and stop.
- quotes a secret, even partly.
- rewords the user's first person lines.
