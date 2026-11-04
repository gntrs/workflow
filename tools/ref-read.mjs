// reads a reference and keeps the evidence: proof that a ref was opened, not remembered.
//
//   node tools/ref-read.mjs <url | file> [--surface <name>] [--storage state.json] [--out <dir>]
//     a url: headless playwright, viewport screenshots at 390x844 and 1440x900, computed styles at 1440
//     (body, h1 to h3, the first visible button and input, a list row, the first 1px border, the widest
//     content box; what the page lacks is recorded as missing) into <out>/<host>-<date>/ as 390.png,
//     1440.png and styles.json (url asked, url landed on, date). landing on another path (a login wall)
//     warns and says so in the row. another url on that host that day gets <host>-<date>-2.
//     --storage: a playwright storageState for a logged in app. local hosts (localhost, 127.0.0.1,
//     [::1], *.localhost, *.test) skip https errors. --out defaults to .claude/refs.
//     a file: copied to <out>/file-<name>-<date>/, `user pic` (an image) or `user file`, values inferred.
//     prints one row for brand.md's ## sources: | surface | ref | how | evidence | date | values |
//     exits 0 when read, 2 on a usage error, a browser that will not start or a page that will not open.
//
//   node tools/ref-read.mjs --self-test
//     (in the workflow repo only) serves tools/ref-test/site.html on a local port, reads it into a
//     temp folder and checks the planted values, the files, the login wall warning and a file copy.
//
// playwright is looked for like probe-test.mjs does: PLAYWRIGHT_MODULE, the project you run it from,
// next to this file, then the npx cache. PROBE_BROWSER=webkit (or firefox) picks the engine.

import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir, tmpdir } from 'node:os';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const USAGE = 'usage: node ref-read.mjs <url | image file> [--surface <name>] [--storage state.json] [--out <dir>]\n       node ref-read.mjs --self-test';
const IMAGES = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.heic', '.bmp', '.tif', '.tiff']);
const ENGINE = process.env.PROBE_BROWSER || 'chromium';

function die(msg) { console.error(msg); process.exit(2); }
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// copied from probe-test.mjs on purpose: the installer copies single files, so no shared module.
async function launchBrowser() {
  if (!['chromium', 'webkit', 'firefox'].includes(ENGINE)) die(`PROBE_BROWSER must be chromium, webkit or firefox, got "${ENGINE}"`);
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
  if (!found.length) die(`playwright not found. in your project: npm i -D playwright && npx playwright install ${ENGINE}, then run this from the project root. or set PLAYWRIGHT_MODULE=/path/to/node_modules/playwright`);
  let last;
  for (const pw of found) {
    try { return await pw[ENGINE].launch(); } catch (e) { last = e; }
  }
  die(`could not start ${ENGINE} with any playwright found (npx playwright install ${ENGINE} in your project): ${String(last && last.message || last).split('\n')[0]}`);
}

const isLocal = (host) => /^(localhost|127\.0\.0\.1|\[::1\])$/.test(host) || /\.(localhost|test)$/.test(host);
const trimPath = (p) => p.replace(/\/+$/, '') || '/';
const cell = (s) => String(s).replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
const shown = (dir) => { const r = relative(process.cwd(), dir); return r && !r.startsWith('..') ? r : dir; };

function hex(c) {
  const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(c || '');
  if (!m) return c || 'missing';
  if (m[4] !== undefined && Number(m[4]) < 1) return Number(m[4]) === 0 ? 'transparent' : c;
  return '#' + m.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, '0')).join('');
}
const face = (f) => (f || '').split(',')[0].replace(/["']/g, '').trim();

// runs in the page. everything is read off computed styles, nothing is guessed.
function readStyles() {
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const first = (sel) => [...document.querySelectorAll(sel)].find(vis) || null;
  const four = (s, f) => { const v = ['top', 'right', 'bottom', 'left'].map((d) => s.getPropertyValue(f(d))); return v.every((x) => x === v[0]) ? v[0] : v.join(' '); };
  const corners = (s) => { const v = ['top-left', 'top-right', 'bottom-right', 'bottom-left'].map((c) => s.getPropertyValue(`border-${c}-radius`)); return v.every((x) => x === v[0]) ? v[0] : v.join(' '); };
  const side = (s, d) => `${s.getPropertyValue(`border-${d}-width`)} ${s.getPropertyValue(`border-${d}-style`)} ${s.getPropertyValue(`border-${d}-color`)}`;
  const h = (el) => `${Math.round(el.getBoundingClientRect().height)}px`;
  const heading = (tag) => { const el = first(tag); if (!el) return 'missing'; const s = getComputedStyle(el); return { family: s.fontFamily, size: s.fontSize, weight: s.fontWeight, letterSpacing: s.letterSpacing }; };
  const control = (el) => {
    if (!el) return 'missing';
    const s = getComputedStyle(el);
    const border = ['top', 'right', 'bottom', 'left'].map((d) => side(s, d));
    return { tag: el.tagName.toLowerCase(), background: s.backgroundColor, color: s.color, border: border.every((b) => b === border[0]) ? border[0] : border.join(', '),
      radius: corners(s), height: h(el), padding: four(s, (d) => `padding-${d}`), fontSize: s.fontSize };
  };
  const b = getComputedStyle(document.body);
  const transparent = (c) => c === 'rgba(0, 0, 0, 0)' || c === 'transparent';
  const body = { background: transparent(b.backgroundColor) ? getComputedStyle(document.documentElement).backgroundColor : b.backgroundColor,
    backgroundFrom: transparent(b.backgroundColor) ? 'html' : 'body', color: b.color, family: b.fontFamily, size: b.fontSize, lineHeight: b.lineHeight };
  const rowEl = first('li, tr, [role=row]');
  const row = rowEl ? { tag: rowEl.tagName.toLowerCase(), height: h(rowEl), borderBottom: side(getComputedStyle(rowEl), 'bottom') } : 'missing';
  let hairline = 'missing';
  for (const el of document.body.querySelectorAll('*')) {
    const s = getComputedStyle(el);
    const d = ['top', 'right', 'bottom', 'left'].find((x) => s.getPropertyValue(`border-${x}-width`) === '1px' && !/none|hidden/.test(s.getPropertyValue(`border-${x}-style`)));
    if (d && vis(el)) { hairline = { tag: el.tagName.toLowerCase(), side: d, color: s.getPropertyValue(`border-${d}-color`) }; break; }
  }
  // the content width: the widest visible box with a max-width, else the widest box narrower than the window.
  const root = first('main, [role=main]') || document.body;
  const media = /^(img|video|svg|canvas|picture|iframe)$/i;
  const boxes = [root, ...root.querySelectorAll('*')].filter((el) => !media.test(el.tagName) && vis(el))
    .map((el) => ({ el, w: Math.round(el.getBoundingClientRect().width), max: getComputedStyle(el).maxWidth }));
  const capped = boxes.filter((x) => /px$/.test(x.max) && x.w > 200).sort((a, z) => z.w - a.w)[0];
  const inset = boxes.filter((x) => x.w > 200 && x.w < innerWidth - 1).sort((a, z) => z.w - a.w)[0];
  const pickW = capped || inset || { el: root, w: Math.round(root.getBoundingClientRect().width), max: 'none' };
  const width = { width: `${pickW.w}px`, maxWidth: pickW.max, tag: pickW.el.tagName.toLowerCase(), how: capped ? 'max-width' : inset ? 'narrower than the window' : 'whole root' };
  const button = control(first('button, [role=button], input[type=submit], input[type=button]'));
  const input = control(first('input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=color]), textarea'));
  return { body, h1: heading('h1'), h2: heading('h2'), h3: heading('h3'), button, input, row, hairline, width };
}

function summary(st) {
  const h1 = st.h1 === 'missing' ? null : st.h1;
  const btn = st.button === 'missing' ? null : st.button;
  const radius = btn ? btn.radius : st.input === 'missing' ? 'missing' : st.input.radius;
  return [`face ${face(h1 ? h1.family : st.body.family)}`, `body ${face(st.body.family)} ${st.body.size}`, `ground ${hex(st.body.background)}`,
    `button ${btn ? hex(btn.background) : 'missing'}`, `radius ${radius}`, `row ${st.row === 'missing' ? 'missing' : st.row.height}`].join(', ');
}

function folderFor(out, name, url) {
  for (let n = 1; ; n++) {
    const dir = join(out, n === 1 ? name : `${name}-${n}`);
    const prev = join(dir, 'styles.json');
    if (!existsSync(prev)) return dir;
    try { if (JSON.parse(readFileSync(prev, 'utf8')).url === url) return dir; } catch {}
  }
}

export async function readUrl(browser, url, { surface, storage, out = '.claude/refs', warn = console.error } = {}) {
  const asked = new URL(url);
  const context = await browser.newContext({ ignoreHTTPSErrors: isLocal(asked.hostname), ...(storage ? { storageState: storage } : {}) });
  try {
    const page = await context.newPage();
    const open = async (w, hgt) => {
      await page.setViewportSize({ width: w, height: hgt });
      const res = await page.goto(url, { waitUntil: 'load', timeout: 45000 }).catch((e) => { throw new Error(`could not open ${url}: ${String(e.message).split('\n')[0]}`); });
      // the quiet wait: the network settles, finite intro animations end (3 s at most), then a beat.
      await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
      await page.evaluate(() => Promise.race([new Promise((r) => setTimeout(r, 3000)), Promise.all(document.getAnimations()
        .filter((a) => a.effect && a.effect.getComputedTiming().endTime !== Infinity).map((a) => a.finished.catch(() => {})))])).catch(() => {});
      await page.waitForTimeout(300);
      return res;
    };
    const res = await open(1440, 900);
    const landed = page.url();
    const styles = await page.evaluate(readStyles);
    const date = today();
    const dir = folderFor(out, `${asked.host.replace(/[:[\]]/g, '-').replace(/-+$/, '')}-${date}`, url);
    mkdirSync(dir, { recursive: true });
    await page.screenshot({ path: join(dir, '1440.png') });
    await open(390, 844);
    await page.screenshot({ path: join(dir, '390.png') });
    const notes = [];
    const to = new URL(landed);
    if (trimPath(to.pathname) !== trimPath(asked.pathname)) {
      notes.push(`landed on ${to.pathname}, not ${asked.pathname} (a login wall?)`);
      warn(`ref-read: asked for ${url}, landed on ${landed}. a login wall reads the wrong page: pass --storage state.json or ask for screenshots`);
    }
    if (res && res.status() >= 400) { notes.push(`http ${res.status()}`); warn(`ref-read: ${url} answered ${res.status()}`); }
    writeFileSync(join(dir, 'styles.json'), JSON.stringify({ url, landed, date, engine: ENGINE, viewport: '1440x900', notes, styles }, null, 2) + '\n');
    const name = surface || (trimPath(asked.pathname) === '/' ? 'home' : trimPath(asked.pathname).split('/').filter(Boolean).pop());
    const values = (notes.length ? notes.join(', ') + ': ' : '') + summary(styles);
    return { dir, styles, landed, notes, row: `| ${[name, url, 'read', shown(dir), date, values].map(cell).join(' | ')} |` };
  } finally { await context.close(); }
}

export function readFileRef(file, { surface, out = '.claude/refs' } = {}) {
  const date = today();
  const dir = join(out, `file-${basename(file, extname(file))}-${date}`);
  mkdirSync(dir, { recursive: true });
  const to = join(dir, basename(file));
  if (resolve(file) !== resolve(to)) copyFileSync(file, to);
  const how = IMAGES.has(extname(file).toLowerCase()) ? 'user pic' : 'user file';
  return { dir, to, row: `| ${[surface || 'screen', basename(file), how, shown(to), date, 'inferred, read by eye'].map(cell).join(' | ')} |` };
}

async function selfTest() {
  const site = join(here, 'ref-test', 'site.html');
  if (!existsSync(site)) die('the self-test needs a clone of the workflow repo (tools/ref-test/ is not here). to read a ref: node ref-read.mjs <url> --surface <name>');
  const html = await readFile(site);
  const server = createServer((req, res) => req.url === '/account'
    ? res.writeHead(302, { location: '/login' }).end() : res.writeHead(200, { 'content-type': 'text/html' }).end(html));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const tmp = mkdtempSync(join(tmpdir(), 'ref-read-'));
  const browser = await launchBrowser();
  let failed = false;
  const line = (ok, what) => { console.log(`${ok ? 'pass' : 'FAIL'}  ${what}`); if (!ok) failed = true; };
  const pngWidth = (p) => existsSync(p) ? readFileSync(p).readUInt32BE(16) : 0;
  try {
    const warns = [], lw = [];
    const a = await readUrl(browser, `${base}/`, { surface: 'home', out: tmp, warn: (w) => warns.push(w) });
    console.log(a.row);
    const s = a.styles;
    line(pngWidth(join(a.dir, '390.png')) === 390 && pngWidth(join(a.dir, '1440.png')) === 1440 && existsSync(join(a.dir, 'styles.json')), '390.png, 1440.png and styles.json written at their sizes');
    const saved = JSON.parse(readFileSync(join(a.dir, 'styles.json'), 'utf8'));
    line(saved.url === `${base}/` && saved.landed === `${base}/` && /^\d{4}-\d\d-\d\d$/.test(saved.date) && !warns.length, 'styles.json holds the url asked, the url landed on and the date, no warning');
    const checks = [
      ['body', s.body.background === 'rgb(250, 250, 247)' && s.body.size === '17px' && s.body.lineHeight === '26px' && /Planted Text/.test(s.body.family)],
      ['h1', s.h1.size === '44px' && s.h1.weight === '700' && /Planted Display/.test(s.h1.family)],
      ['h2', s.h2.size === '28px' && s.h2.weight === '600' && s.h2.letterSpacing === '-0.5px'],
      ['h3 missing', s.h3 === 'missing'],
      ['first visible button', s.button.background === 'rgb(31, 111, 235)' && s.button.radius === '7px' && s.button.height === '40px' && s.button.padding === '0px 18px 0px 18px'],
      ['input', s.input.border === '1px solid rgb(200, 200, 192)' && s.input.radius === '5px' && s.input.height === '38px'],
      ['row', s.row.height === '48px' && s.row.borderBottom === '1px solid rgb(229, 229, 224)'],
      ['hairline', s.hairline.color === 'rgb(221, 220, 213)' && s.hairline.tag === 'header'],
      ['content width', s.width.width === '1080px'],
    ];
    const bad = checks.filter(([, ok]) => !ok).map(([n]) => n);
    line(!bad.length, `planted styles captured ${checks.length - bad.length}/${checks.length}${bad.length ? `, wrong: ${bad.join(', ')}` : ''}`);
    const cells = a.row.split('|').slice(1, -1).map((c) => c.trim());
    line(cells.length === 6 && cells[0] === 'home' && cells[2] === 'read' && existsSync(cells[3]) && /Planted Display.*17px.*#1f6feb.*7px.*48px/.test(cells[5]), 'the row has 6 cells, how read, real evidence, the planted values');
    const b = await readUrl(browser, `${base}/account`, { out: tmp, warn: (w) => lw.push(w) });
    console.log(b.row);
    line(lw.some((w) => /landed on/.test(w)) && /landed on \/login/.test(b.row) && b.dir !== a.dir, 'a login wall warns, says so in the row, and gets its own folder');
    const c = readFileRef(join(a.dir, '390.png'), { surface: 'phone', out: tmp });
    console.log(c.row);
    line(existsSync(c.to) && /file-390-/.test(c.dir) && /\| user pic \|.*\| inferred, read by eye \|$/.test(c.row), 'an image file is copied and marked user pic, inferred');
    const cli = (args) => spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...args], { encoding: 'utf8' }).status;
    const codes = [cli([]), cli(['no-such-thing']), cli(['--storage', join(tmp, 'none.json'), `${base}/`]), cli(['--wat', `${base}/`])];
    line(codes.every((x) => x === 2), `usage errors exit 2: ${codes.join(' ')}`);
  } finally {
    await browser.close(); server.close();
    if (!failed) rmSync(tmp, { recursive: true, force: true }); else console.log(`kept ${tmp}`);
  }
  return failed ? 1 : 0;
}

// ---------- cli

const argv = process.argv.slice(2);
if (argv[0] === '--self-test') process.exit(await selfTest());
const opts = {}, pos = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '-h' || a === '--help') { console.log(USAGE); process.exit(0); }
  if (['--surface', '--storage', '--out'].includes(a)) {
    if (!argv[i + 1] || argv[i + 1].startsWith('--')) die(`${a} needs a value\n${USAGE}`);
    opts[a.slice(2)] = argv[++i];
  } else if (a.startsWith('-')) die(`unknown flag ${a}\n${USAGE}`);
  else pos.push(a);
}
const [target] = pos;
if (pos.length !== 1) die(USAGE);
if (opts.storage && !existsSync(opts.storage)) die(`ref-read: storage state ${opts.storage} not found. save one after logging in: await context.storageState({ path: 'state.json' })`);
if (/^https?:\/\//i.test(target)) {
  try { new URL(target); } catch { die(`ref-read: ${target} is not a valid url`); }
  const browser = await launchBrowser();
  try { console.log((await readUrl(browser, target, opts)).row); } catch (e) { await browser.close(); die(`ref-read: ${e.message}`); }
  await browser.close();
} else if (existsSync(target) && statSync(target).isFile()) {
  console.log(readFileRef(target, opts).row);
} else die(`ref-read: ${target} is not a url (https://...) or a file\n${USAGE}`);
