# research

part of `playbook`. when the user asks for research, a verdict on an idea, or "look into X", run this. a run of about a dozen agents takes under half an hour and is worth it when a decision rides on it.

```
researchers, one disjoint beat each      pstack `swarm`, or plain agents, read only
  -> barrier, compile one dossier        main thread
3 judges, DISTINCT lenses                two model families when available
  -> 1 synthesiser                       writes the thing the user actually reads
```

the researchers run as a rolling window under the cap in `cook`, so it takes longer on a small machine; the shape does not change. `why` and `how` replace a researcher when the question is about the user's own code.

## measure what the user already has before searching the web

local ground truth beats any external source: the user's repos, archives, git log, analytics, the brain or `.claude/` notes. usage numbers on disk can show a feature was never used by its own author. git log can show a tool was built in one evening, which makes "throw it away" cost hours instead of months.

## force sourcing at the schema level, not in the prose

every finding is `{claim, evidence, source_url, date, confidence}` and the brief says to write the literal string NO SOURCE FOUND rather than estimate. estimates only when labelled ASSUMPTION with the inputs stated. a number without a link is worse than no number.

## three judges, three lenses, never three skeptics

for example: market skeptic, distribution realist, and opportunity cost against the user's other work. each gets the full dossier, each returns a verdict from a fixed enum plus `strongest_case_for` arguing against itself. report disagreement as disagreement, one line a side. do not fake consensus.

## verify the one claim that would change what you already shipped

when the swarm finds something that contradicts work already done (an existing product with the same name, a dead api), fetch and confirm it by hand before repeating it. load-bearing claims get checked personally, always.

## output, non negotiable

verdict in the first sentence, tables carry every number with a source column, zero em dashes, and exactly one closing section called "your move" with at most three things only the user can do this week. written per `write`.
