# mistakes already made, do not repeat

part of `playbook`. the one ledger. each of these cost real time. one line of what happened, one line of the rule. add to it when a mistake costs real time and would again; a lesson goes here, not into a second file. traps with a how-to live in `debugging.md` and `deploy.md` instead.

1. **under-specced a builder model.**
   happened: a builder got a cheaper model to save quota, and the rework cost more.
   rule: never downgrade a builder silently, the floor is in `cook`'s table.

2. **broke interpolation in a prompt template.**
   happened: an escaped placeholder sent the next agent the literal text `${JSON.stringify(x)}` instead of the report.
   rule: never escape a placeholder meant to interpolate. build long prompts by concatenation.

3. **nearly undid something the user was asking about.**
   happened: a precautionary delete while they were mid question about it.
   rule: reversible is not free. say what you would do and wait.

4. **"fixed" that was still broken, many times over.**
   happened: the most common correction across weeks of work, mostly UI rounds judged off a screenshot.
   rule: prove it on the real app, on the surface the user uses, before the word fixed. say what ran and what was only read.

5. **ran the machine out of RAM and killed several sessions.**
   happened: parallel lanes plus a docker vm plus a dev server passed the machine's memory.
   rule: the cap in `cook`, every fan-out.

6. **a panel died when one model's credits ran out.**
   happened: every seat of a panel was on the same model.
   rule: a second model family beside a primary lane, never the only one.

7. **a hand test pointed at the wrong app.**
   happened: the steps named `localhost:3000`, which another repo's dev server owned, and both steps 404ed.
   rule: check which process owns a port (`lsof -nP -iTCP:<port> -sTCP:LISTEN`) or start on a named free port, and run the url once yourself.

8. **two sessions built in one tree.**
   happened: two sessions on one repo started builders on the same branch names, and builders landed in each other's directories.
   rule: list other sessions and ask before worktrees or builders.

9. **rewrote the user's own lines.**
   happened: a page cleanup replaced their first person intro with a tidier sentence they hated.
   rule: cut chrome freely, keep their words verbatim (`write`).

10. **a timer job restarted from zero every failure.**
    happened: a scheduled pipeline broke five days running, and each rerun started over.
    rule: anything on a timer records the step it reached, resumes from there, and alerts before the user finds it.

11. **a cross build was called done.**
    happened: a build made for another OS compiled and was never run there.
    rule: run it on every OS you target. a cross build proves it compiles.
