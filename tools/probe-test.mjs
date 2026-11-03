// the headless size sweep, and the proof that the probe works.
//
//   node tools/probe-test.mjs <url> [paths...]
//     sweeps each path (default /) of a running app at every size in the probe's
//     SIZES, prints the report, exits 1 on any fault. for example:
//     node tools/probe-test.mjs http://localhost:3000 / /login
//
//   node tools/probe-test.mjs
//     the self-test. serves tools/probe-test/ on a local port, opens it in headless chromium,
// loads the probe the same way you would paste it into a console, and sweeps:
//   planted.html  a 30 px button and a 2400 px strip. both must be caught at every size.
//   clean.html    nothing wrong. every size must report clean.
// exits 0 only when all three hold.
//
// fast tier: PROBE_SIZES=320x690,390x844,1440x900 limits either mode to those sizes.
//
// needs playwright and its chromium: npm i -D playwright && npx playwright install chromium
// (a copy left in the npx cache by `npx playwright` is found too, or point
// PLAYWRIGHT_MODULE at any node_modules/playwright folder).

import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pages = join(here, 'probe-test');
const probePath = join(here, 'responsive-probe.js');

async function loadPlaywright() {
  // PLAYWRIGHT_MODULE=/path/to/node_modules/playwright picks a copy whose browsers are already downloaded.
  if (process.env.PLAYWRIGHT_MODULE) return createRequire(join(process.env.PLAYWRIGHT_MODULE, 'package.json'))('playwright');
  try {
    return await import('playwright');
  } catch {
    const cache = join(homedir(), '.npm', '_npx');
    if (existsSync(cache)) {
      for (const dir of await readdir(cache)) {
        const pkg = join(cache, dir, 'node_modules', 'playwright', 'package.json');
        if (existsSync(pkg)) return createRequire(pkg)('playwright');
      }
    }
    console.error('playwright not found. run: npm i -D playwright && npx playwright install chromium');
    process.exit(2);
  }
}

const [target, ...targetPaths] = process.argv.slice(2);
const only = (process.env.PROBE_SIZES || '').split(',').filter(Boolean);
const FAULT = /overflow|clipped|unreachable|: small |: tiny |THREW/;

async function sweepOn(page, paths) {
  if (!(await page.evaluate(() => typeof probeAll === 'function'))) await page.addScriptTag({ path: probePath });
  return page.evaluate(async ({ paths, only }) => {
    const sizes = only.length ? SIZES.filter(([w, h]) => only.includes(`${w}x${h}`)) : SIZES;
    const rows = await probeAll({ paths, sizes });
    return { text: report(rows), rows: rows.map((r) => ({ size: r.size, issues: r.issues })) };
  }, { paths, only });
}

if (target) {
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto(target);
    const result = await sweepOn(page, targetPaths.length ? targetPaths : ['/']);
    console.log(result.text);
    process.exitCode = result.rows.some((r) => r.issues.some((i) => FAULT.test(i))) ? 1 : 0;
  } finally {
    await browser.close();
  }
  process.exit(process.exitCode);
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

const { chromium } = await loadPlaywright();
const browser = await chromium.launch();
let failed = false;
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(`${origin}/host.html`);
  const sweep = (path) => sweepOn(page, [path]);

  const planted = await sweep('/planted.html');
  console.log('== planted.html\n' + planted.text + '\n');
  const missedButton = planted.rows.filter((r) => !r.issues.some((i) => /: small 30x30 /.test(i)));
  const missedOverflow = planted.rows.filter((r) => !r.issues.some((i) => /: overflow, page is/.test(i)));

  const clean = await sweep('/clean.html');
  console.log('== clean.html\n' + clean.text + '\n');
  const dirty = clean.rows.filter((r) => r.issues.some((i) => FAULT.test(i)));

  const check = (ok, what) => { console.log(`${ok ? 'pass' : 'FAIL'}  ${what}`); if (!ok) failed = true; };
  check(missedButton.length === 0, `30 px button caught at ${planted.rows.length - missedButton.length}/${planted.rows.length} sizes`);
  check(missedOverflow.length === 0, `sideways overflow caught at ${planted.rows.length - missedOverflow.length}/${planted.rows.length} sizes`);
  check(dirty.length === 0, `clean page clean at ${clean.rows.length - dirty.length}/${clean.rows.length} sizes`);
} finally {
  await browser.close();
  server.close();
}
process.exit(failed ? 1 : 0);
