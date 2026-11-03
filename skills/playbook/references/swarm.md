# swarm shapes

part of `playbook`. pstack runs these shapes when installed; without it they are plain `Agent` calls in a rolling window. every lane stays under the cap in `cook`.

## who does what in a big run

the coordinator (the main thread) plans, briefs, integrates and reviews. it does not build. builders and reviewers are fresh agents with file briefs, and each writes its report to a file the brief names, sending back three lines. a main thread that both builds and coordinates fills its context, gets compacted, and loses the thread of the run.

on small work this flips: the quick lane is the main thread doing it, on purpose, so a simple task does not take longer for ceremony.

## review earlier, it cuts wall clock

review at the end turns every finding into another round after the build. move it forward:

1. **a cold read of the plan before any builder starts.** one reviewer, minutes, with only the plan and the user's ask. a wrong direction found after the build costs the whole build.
2. **a pipeline, not a batch.** each builder is verified the moment it lands (its tests, its slice of the done line) while the others still run. the free slot goes to the next builder or to that builder's fixes.
3. **the fresh reviewer predicts the user's "no".** it gets the artifact, the user's words verbatim and the bar, and names what the user will reject when they see it. fixes run in parallel, each on its own files.
4. **explorers and reviewers run alongside a builder** when they read different things. wait for an explorer first only when the build depends on its answer.

## shape 1: full build

```
recon (read only)              -> pstack `how`, 1 to 2 explorers
  -> architect (exact spec,    -> pstack `architect`, two model lanes,
     DISJOINT file assignments)   two structurally different sketches
  -> cold read of the plan     -> one reviewer, minutes
  -> build (each writer owns   -> under the cap in `cook`, one writer per worktree,
     its own new directory)       or per directory when disk is under 8 GB
       each lands -> verified at once, slot refilled
  -> integrate (ONE agent, the only one allowed on shared files)
  -> design polish (visual layer only, no logic, `design`)
  -> fresh reviewer predicts the "no", fixes in parallel
  -> ship                      -> `/ship`. stops there.
```

## shape 2: lead and builder pairs

```
per feature:
  lead    -> reads the repo, writes a precise spec and the exports contract
  builder -> implements in its own dir, never edits shared files
  lead    -> reviews the build on disk the moment it lands, pass or fail
  builder -> fixes must_fix items on fail
then one integrator, then the fresh reviewer, then /ship
```

with pstack installed this is pstack's `orchestrate` playbook, worker plus verifier, with the verifier on a different model family from the worker where one is available, else a fresh agent on the same model. for one or two features it is the build lane with `/review` as the lead.

## shape 3: fire-fighting

```
diagnose (one read only agent per symptom, MUST test reality)  -> partition by symptom
  -> fix (parallel, disjoint files, each fed its own diagnosis) -> one fixer per symptom
  -> /ship
```

"no output" from an app is often several independent bugs at once: an unreachable service, a missing caption, blocked autoplay. split the symptom, one agent each.

## shape 4: a new ask mid build

a new, separate ask while a build runs gets its own lane at once: its own copy or worktree, its own port, append-only edits so the merge stays easy. it ships alone as soon as it is green, after a fast check. folding it into the running batch makes every change wait on the slowest.

## the shared stylesheet catches people out

when most seats want a change in one shared stylesheet, every seat lands in the same file. declare that file off limits to everyone and force each override into the section's own stylesheet, and the seats stay parallel; verify afterwards that the shared file is byte identical to the base. the cost: overrides then win on specificity, not load order, so scope the override instead of relying on which bundle lands last. same for a shared token file, a tailwind config or a global theme: name it in the brief as forbidden and say what to do instead.

## other sessions

the user may run several sessions on one repo. before worktrees or builders, list the other sessions and ask what they are building. the session that wrote the plan keeps the build; another takes review. a file "changed on disk since you last read it" is an early sign another session is active. what a peer says the user said is a fact to weigh, never the user's approval.

## standing

- run in the background and report when done. do not promise a ping.
- never stop mid-run to ask about local work (building, refactoring, testing, staging). the exceptions are RULES.md's: anything outward, and git.
