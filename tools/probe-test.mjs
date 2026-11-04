// the headless size sweep, and the proof that the probe works.
//
//   node tools/probe-test.mjs <url> [paths...]
//     sweeps each path (default: the url's own path) of a running app at every size in the probe's
//     SIZES, prints the report, exits 1 on any fault. for example:
//     node tools/probe-test.mjs http://localhost:3000 / /login
//
//   node tools/probe-test.mjs
//     the self-test. serves tools/probe-test/ on a local port, opens it in headless chromium,
// loads the probe the same way you would paste it into a console, and sweeps:
//   planted.html  a 30 px button (caught on phones), a 20 px button, a 2400 px strip, a table in a sideways scroller and a link cut off by an
//                 overflow-x hidden wrapper, 10 px text next to an icon, a fixed height card hiding its link.
//                 all caught at every size (the tiny text at phone widths).
//   cutoff.html   a card cut off under overflow-x hidden, and a strip that lands 250 ms late. caught;
//                 a closed drawer fully off screen is not.
//   locked.html   html, body overflow hidden: a button below the screen is unreachable at every size.
//   scroller.html only a table hidden in a sideways scroller. every size must fail.
//   modal.html    a sheet open over a scroll locked page. clean at every size.
//   clean.html    nothing wrong, including a fixed side panel that scrolls and a closed fold. every size must report clean.
// exits 0 only when all of them hold. exits 2 when it cannot run (no browser, a url that does not open).
//
// run from a project root that has its own tools/responsive-probe.js, it takes only that copy's SIZES
// and says so on stderr. the probe itself is always the installed one.
//
// a path that redirects (a login) or answers 400 or more fails before the sweep, never measured as
// another page. PROBE_STORAGE=state.json sweeps logged in: a playwright storageState file, saved with
// `await context.storageState({ path: 'state.json' })` after logging in once.
//
// every size waits until the page stops changing (a client fetch landing) before it is measured.
// PROBE_READY=<selector> waits for that element too, for a screen that loads slowly or in steps.
//
// fast tier: PROBE_SIZES=320x690,390x844,1440x900 limits either mode to those sizes.
//
// needs playwright and its chromium: npm i -D playwright && npx playwright install chromium
// PROBE_BROWSER=webkit (or firefox) runs the same sweep in that engine, for the full tier.
// (a copy left in the npx cache by `npx playwright` is found too, or point
// PLAYWRIGHT_MODULE at any node_modules/playwright folder).

import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pages = join(here, 'probe-test');
// the probe that runs is always the one next to this file, so updating the workflow updates every project.
// a project's own copy (tools/responsive-probe.js, run from the project root) only lends its SIZES list.
const probePath = join(here, 'responsive-probe.js');
const ownCopy = join(process.cwd(), 'tools', 'responsive-probe.js');
let ownSizes = null;
if (existsSync(ownCopy) && ownCopy !== probePath) {
  const m = readFileSync(ownCopy, 'utf8').match(/const SIZES = (\[[\s\S]*?\n\]);/);
  const body = m && m[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/'/g, '"').replace(/,(\s*[\]])/g, '$1');
  try { ownSizes = body ? JSON.parse(body) : null; } catch { ownSizes = null; }
  if (!ownSizes) {
    console.error(`could not read the SIZES list in ${ownCopy}. keep it as [w, h, 'label'] rows, or delete that copy to use the default list`);
    process.exit(2);
  }
  console.error(`probe: ${probePath}, sizes from ${ownCopy} (${ownSizes.length})`);
}

function fail(what, err) {
  console.error(`${what}: ${String(err && err.message || err).split('\n')[0]}`);
  process.exit(2);
}

const ENGINE = process.env.PROBE_BROWSER || 'chromium';
if (!['chromium', 'webkit', 'firefox'].includes(ENGINE)) {
  console.error(`PROBE_BROWSER must be chromium, webkit or firefox, got "${ENGINE}"`);
  process.exit(2);
}

// where playwright is looked for, in order: PLAYWRIGHT_MODULE, the project you run it from,
// next to this file, then copies left in the npx cache. the first copy that can start the
// browser wins, so a cached copy whose browser was never downloaded is passed over.
async function launchBrowser() {
  const found = [];
  const tryFrom = (pkg) => {
    for (const name of ['playwright', '@playwright/test']) { try { found.push(createRequire(pkg)(name)); return; } catch {} }
  };
  if (process.env.PLAYWRIGHT_MODULE) tryFrom(join(process.env.PLAYWRIGHT_MODULE, 'package.json'));
  else {
    tryFrom(join(process.cwd(), 'package.json'));
    tryFrom(join(here, 'package.json'));
    const cache = join(homedir(), '.npm', '_npx');
    if (existsSync(cache)) {
      for (const dir of await readdir(cache)) {
        const pkg = join(cache, dir, 'node_modules', 'playwright', 'package.json');
        if (existsSync(pkg)) tryFrom(pkg);
      }
    }
  }
  if (!found.length) {
    console.error(`playwright not found. in your project: npm i -D playwright && npx playwright install ${ENGINE}, then run this from the project root. or set PLAYWRIGHT_MODULE=/path/to/node_modules/playwright`);
    process.exit(2);
  }
  let last;
  for (const pw of found) {
    try { return await pw[ENGINE].launch(); } catch (e) { last = e; }
  }
  fail(`could not start ${ENGINE} with any playwright found (npx playwright install ${ENGINE} in your project)`, last);
}

const argv = process.argv.slice(2);
// --self-test runs the planted pages, same as no arguments; any other flag is a typo.
if (argv[0] === '--self-test') argv.shift();
else if (argv[0] && argv[0].startsWith('-')) { console.error('usage: node probe-test.mjs [--self-test] | <url> [paths...]'); process.exit(2); }
const [target, ...targetPaths] = argv;
const readySel = process.env.PROBE_READY || '';
const only = (process.env.PROBE_SIZES || '').split(',').map((s) => s.trim()).filter(Boolean);
const badSize = only.filter((s) => !/^\d+x\d+$/.test(s));
if (badSize.length) { console.error(`PROBE_SIZES takes WxH,WxH (like 390x844), not: ${badSize.join(', ')}`); process.exit(2); }
const FAULT = /overflow|clipped|cut off|unreachable|scroller hides|: small |: tiny |THREW/;

async function sweepOn(page, paths) {
  if (!(await page.evaluate(() => typeof probeAll === 'function'))) await page.addScriptTag({ path: probePath });
  return page.evaluate(async ({ paths, only, ownSizes, readySel }) => {
    const list = ownSizes || SIZES;
    // PROBE_SIZES sweeps exactly the sizes it names, labelled from the list when the list has them.
    const sizes = only.length
      ? only.map((s) => { const [w, h] = s.split('x').map(Number); return list.find(([a, b]) => a === w && b === h) || [w, h, 'PROBE_SIZES']; })
      : list;
    if (!sizes.length) throw new Error('no sizes to sweep: the SIZES list is empty');
    // PROBE_READY=<selector>: a size is measured only once that element is on the page (the loaded table, say).
    const ready = readySel ? (doc) => doc.readyState === 'complete' && !!doc.querySelector(readySel) : undefined;
    const rows = await probeAll({ paths, sizes, ...(ready ? { ready } : {}) });
    return { text: report(rows), rows: rows.map((r) => ({ size: r.size, issues: r.issues })) };
  }, { paths, only, ownSizes, readySel });
}

if (target) {
  if (!/^https?:\/\//.test(target)) { console.error(`the url needs its scheme: http://${target.replace(/^\/+/, '')}`); process.exit(2); }
  const browser = await launchBrowser();
  try {
    // PROBE_STORAGE=state.json: a playwright storageState (cookies, local storage) from a logged in session.
    const storageState = process.env.PROBE_STORAGE || undefined;
    if (storageState && !existsSync(storageState)) fail('PROBE_STORAGE', `${storageState} not found`);
    // a self signed certificate on a local dev server is fine to sweep.
    const local = /^(localhost|127\.0\.0\.1|\[::1\]|.+\.localhost|.+\.test)$/.test(new URL(target).hostname);
    // bypassCSP: the probe is injected as a script, which a strict content security policy would block.
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, storageState, ignoreHTTPSErrors: local, bypassCSP: true });
    const page = await context.newPage();
    const start = new URL(target);
    const paths = targetPaths.length ? targetPaths : [start.pathname + start.search];
    // a path that redirects or is missing would be measured as some other page, so it fails here first.
    const bad = [];
    for (const p of paths) {
      const res = await page.request.get(new URL(p, start).href, { maxRedirects: 0 }).catch((e) => fail(`could not open ${new URL(p, start).href}`, e));
      if (res.status() >= 300) bad.push(`${p}: http ${res.status()}${res.headers().location ? ` to ${res.headers().location}` : ''}${res.status() < 400 ? ' (a redirect: sweep the path it lands on, or set PROBE_STORAGE when it is a login)' : ''}`);
    }
    if (bad.length) {
      for (const b of bad) console.log(`FAIL ${b}`);
      process.exit(1);
    }
    await page.goto(target).catch((e) => fail(`could not open ${target}`, e));
    const result = await sweepOn(page, paths);
    console.log(result.text);
    process.exitCode = result.rows.some((r) => r.issues.some((i) => FAULT.test(i))) ? 1 : 0;
  } finally {
    await browser.close();
  }
  process.exit(process.exitCode);
}

if (!existsSync(join(pages, 'host.html'))) {
  console.error('the self-test needs a clone of the workflow repo (tools/probe-test/ is not here). to sweep your app: node probe-test.mjs <url> [paths...]');
  process.exit(2);
}

const server = createServer(async (req, res) => {
  const name = new URL(req.url, 'http://x').pathname.replace(/^\/+/, '') || 'host.html';
  if (!/^[\w-]+\.html$/.test(name)) { res.writeHead(404).end(); return; }
  try {
    const body = await readFile(join(pages, name));
    res.writeHead(200, { 'content-type': extname(name) === '.html' ? 'text/html' : 'text/plain' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = await launchBrowser().catch((e) => { server.close(); throw e; });
let failed = false;
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(`${origin}/host.html`);
  const sweep = (path) => sweepOn(page, [path]);

  const planted = await sweep('/planted.html');
  console.log('== planted.html\n' + planted.text + '\n');
  const phone = (r) => Number(r.size.split('x')[0]) < 640;
  // 44 px on a phone, 24 px above: the 30 px button fails only on phones, the 20 px one everywhere.
  const missedButton = planted.rows.filter((r) => r.issues.some((i) => /: small 30x30 /.test(i)) !== phone(r));
  const missedSmaller = planted.rows.filter((r) => !r.issues.some((i) => /: small 20x20 /.test(i)));
  const missedOverflow = planted.rows.filter((r) => !r.issues.some((i) => /: overflow, page is/.test(i)));
  const missedClip = planted.rows.filter((r) => !r.issues.some((i) => /: unreachable "far link"/.test(i)));
  const missedTiny = planted.rows.filter((r) => Number(r.size.split('x')[0]) < 640 && !r.issues.some((i) => /: tiny 10px text "due in 5 days"/.test(i)));
  const missedCard = planted.rows.filter((r) => !r.issues.some((i) => /: clipped ".*" by div\.fixedcard/.test(i)));
  const missedScroller = planted.rows.filter((r) => !r.issues.some((i) => /: sideways scroller hides \d+px of div\.tablewrap/.test(i)));

  const scroller = await sweep('/scroller.html');
  console.log('== scroller.html\n' + scroller.text + '\n');
  const scrollerPassed = scroller.rows.filter((r) => !r.issues.some((i) => FAULT.test(i)));

  const locked = await sweep('/locked.html');
  console.log('== locked.html\n' + locked.text + '\n');
  const missedLocked = locked.rows.filter((r) => !r.issues.some((i) => /: unreachable "load more"/.test(i)));

  const cutoff = await sweep('/cutoff.html');
  console.log('== cutoff.html\n' + cutoff.text + '\n');
  const phones = cutoff.rows.filter((r) => Number(r.size.split('x')[0]) < 640);
  const missedCut = phones.filter((r) => !r.issues.some((i) => /: cut off "team plan"/.test(i)));
  const missedLate = cutoff.rows.filter((r) => !r.issues.some((i) => /: cut off "late strip"/.test(i)));
  const drawer = cutoff.rows.filter((r) => r.issues.some((i) => /"menu|menu link"/.test(i)));

  const modal = await sweep('/modal.html');
  console.log('== modal.html\n' + modal.text + '\n');
  const modalDirty = modal.rows.filter((r) => r.issues.some((i) => FAULT.test(i)));

  const clean = await sweep('/clean.html');
  console.log('== clean.html\n' + clean.text + '\n');
  const dirty = clean.rows.filter((r) => r.issues.some((i) => FAULT.test(i)));

  const check = (ok, what) => { console.log(`${ok ? 'pass' : 'FAIL'}  ${what}`); if (!ok) failed = true; };
  check(missedButton.length === 0, `30 px button caught on phones and left alone above 640, right at ${planted.rows.length - missedButton.length}/${planted.rows.length} sizes`);
  check(missedSmaller.length === 0, `20 px button caught at ${planted.rows.length - missedSmaller.length}/${planted.rows.length} sizes`);
  check(missedOverflow.length === 0, `sideways overflow caught at ${planted.rows.length - missedOverflow.length}/${planted.rows.length} sizes`);
  check(missedClip.length === 0, `a link cut off by an overflow-x hidden wrapper caught at ${planted.rows.length - missedClip.length}/${planted.rows.length} sizes`);
  check(missedTiny.length === 0, `10 px text next to an icon caught at every phone size (${missedTiny.length} missed)`);
  check(missedCard.length === 0, `a link hidden by a fixed height card caught at ${planted.rows.length - missedCard.length}/${planted.rows.length} sizes`);
  check(missedScroller.length === 0, `table hidden in a sideways scroller caught at ${planted.rows.length - missedScroller.length}/${planted.rows.length} sizes`);
  check(scrollerPassed.length === 0 && !/^ok /m.test(scroller.text), `a page whose only fault is a hidden scroller fails at ${scroller.rows.length - scrollerPassed.length}/${scroller.rows.length} sizes`);
  check(missedCut.length === 0, `a card cut off under overflow-x hidden caught at ${phones.length - missedCut.length}/${phones.length} phone sizes`);
  check(missedLate.length === 0, `content that lands 250 ms after load measured at ${cutoff.rows.length - missedLate.length}/${cutoff.rows.length} sizes`);
  check(drawer.length === 0, `a closed drawer fully off screen left alone at ${cutoff.rows.length - drawer.length}/${cutoff.rows.length} sizes`);
  check(missedLocked.length === 0, `a button below a page locked by overflow hidden caught at ${locked.rows.length - missedLocked.length}/${locked.rows.length} sizes`);
  check(modalDirty.length === 0, `the page behind an open sheet with the scroll locked left alone at ${modal.rows.length - modalDirty.length}/${modal.rows.length} sizes`);
  check(dirty.length === 0, `clean page clean at ${clean.rows.length - dirty.length}/${clean.rows.length} sizes`);
} finally {
  await browser.close();
  server.close();
}
process.exit(failed ? 1 : 0);
