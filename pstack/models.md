# pstack model configuration

provider qualified per role choices for pstack's own roles only. the agents cook spawns itself take their models from cook's table. read the installed pstack provider dispatch reference before dispatching a configured role. every documented role stays present. `inherit-parent` uses the parent model and still counts as one panel lane.

fable lanes are optional: a second model family when available, never the only one. on a plan without fable, delete `, claude:fable@max` from each line that has it, or swap in another model you have. never leave a panel with only one model that can run out of credits. setup swaps every name here for what the user's plan has.

feature, refactoring: claude:opus@xhigh
bug-fix: claude:opus@xhigh
perf-issue: claude:opus@xhigh
hillclimb: claude:opus@xhigh
judgment and prose: claude:opus@xhigh
hardest tasks: claude:opus@xhigh
how explorer: inherit-parent
how explainer: inherit-parent
why investigators, synthesizer: inherit-parent
reflect tooling, judgment, divergent, synthesizer: inherit-parent
arena runners: claude:opus@xhigh, claude:fable@max
arena cross-judge pool: claude:opus@xhigh, claude:fable@max
swarm workers: claude:opus@xhigh
architect runners: claude:opus@xhigh, claude:fable@max
interrogate reviewers: claude:opus@xhigh, claude:fable@max
