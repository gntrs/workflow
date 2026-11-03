# debugging doctrine

part of `playbook`. pstack's `bug-fix` playbook and `principle-fix-root-causes` run the method when installed; without it, the method is: reproduce, split the symptom, test reality, fix the root, prove it on the real app. these are the traps that cost real time.

## learned the hard way

- **check the deploy first.** hours of "the fix did not work" can be a dead deploy hook serving week-old code.
- **curl the dependency with the real key** before blaming the code. a dead api key, a key owned by the wrong account, a model rejecting a language: all found this way.
- **split the symptom.** one visible failure is often several independent bugs. one agent per symptom.
- **a log line that says "retrying with default" is a bug report.** read the logs the user pastes.
- **run the baseline** before blaming your change. an intermittent bug was often there before.
- **`npm run build` in a repo with `next dev` running freezes that dev server, silently.** both write `.next`, so the dev server stops recompiling server components and serves the last thing it had, while css hot reload keeps working. tell: `find .next -newermt "-15 minutes"` returns nothing after an edit, and `.next` holds a production `BUILD_ID`. fix: restart the dev server. `ps -o ppid= -p <pid>` of 1 means nobody is watching that terminal.
- **a changed env var does nothing until a redeploy.** the running deployment keeps the values it was built with, so editing a variable then testing the old preview tests the old value. check the newest deployment's time against the edit before believing any env test. the flip side: a wrong value has not landed yet if nothing deployed since. narrowing a variable's scope in a host dashboard moves it, leaving the other environments with none: add a second row, then narrow.
- **a service worker can serve an old build** and cancel server checks (auth, redirects) on paths it already serves. date a screenshot against copy changed in the last push before fixing what it shows, and expose the running commit (a `/version.json`) so anyone can check.
- **a fresh clone has no `node_modules`**, so every npm script dies as "command not found". install from the lockfile first.
- **a file in a cloud synced folder can be evicted**, and a read returns `EDEADLK`. it reads as a fault in whatever library imported lazily. time the import: a minute at 0% cpu is a blocked read.
- **a packaged app is not its binary run from a terminal.** the terminal lends its privacy grants. launch it the way a person does.
- **absolute paths in repo scripts break on the next machine.** keep them relative or detected.

## browser traps

- **a hidden tab runs no frames.** a tab driven by an agent is usually not frontmost, so `document.hidden` is true, `requestAnimationFrame` delivers nothing, ResizeObserver never fires and transitions never advance. screenshots still work, which is what makes it convincing, and they can show a stale composite. check `document.hidden` and count frames in the same call; static geometry (`getBoundingClientRect`, computed styles) is still trustworthy. headless playwright at real device sizes runs frames normally.
- **`scrollTo` can stop dispatching scroll events** in a tab driven hard over CDP. register a control listener before believing a negative.
- **a heavy page (WebGL, many iframes) can wedge the renderer**, and every evaluate times out. retrying does not clear it, a fresh tab does.
- **resizing a maximised window is ignored.** measure narrow widths inside an exact size iframe or a headless browser at that size.
- **kill a test browser only by its own pid or temp profile.** matching the app name or binary path kills the user's own browser.

## verifying front end work with no browser

`design` holds the sweep. this is the fallback when no browser is available.

- **say which numbers were measured and which were derived, every time.** arithmetic against the tokens is evidence. presenting it as a rendered measurement is not.
- **assets can be measured for real** with an image library already in the repo (`sharp` or the like): lit bounding box, exact-black coverage, contrast ratios.
- **the served bundle is the truth.** `curl` the page, pull the css chunk out of the html and grep the compiled rule. that catches a rule that never fires, a value the minifier rewrote, and a change that never reached the build.
