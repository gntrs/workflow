# memory

home: [[HOME]]

the index of lessons for future sessions, one line per file. Claude Code can write its auto memory here if you point `autoMemoryDirectory` at this folder. keep this file short; the depth is in each file.

## format

one line per memory:

```
- [[file-name]] : one line hook, what to remember
```

each memory file:

```
---
name: file-name
description: one line, specific enough to decide whether to read it
metadata:
  type: feedback | reference | project | user
---

the rule or fact, in one or two lines.

**Why:** what happened, in one sentence.

**How to apply:** when it matters, and what to do.
```

- `feedback`: a correction or a confirmed way of working.
- `reference`: a technical gotcha, a tool, where something lives.
- `project`: a fact about one project that will not be obvious from its code.
- `user`: who you are and how you like to work.

## memories

none yet.
