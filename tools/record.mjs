// records a walk through a page to a video: proof of the real run that a screenshot cannot give.
//
//   node tools/record.mjs <url> [--size mac | phone | WxH] [--shot "<steps>"] [--seconds 40] [--pace 500] [--out <dir>] [--headed]
//     opens the url in chromium at 2x, waits for the page to settle, presses the most private button on a
//     cookie banner if one shows, then walks the page while the chrome devtools screencast hands every new
//     frame over as a jpeg. ffmpeg turns those into a constant 30 fps mp4.
//     the walk, with no --shot: the mouse wheel at --pace px a second, sent every 16 ms. a page that scrolls
//     is walked to its bottom. a page that does not (a scroll story that moves its scene on wheel events,
//     scrollHeight equal to the window) gets wheel until the picture stops moving, or --seconds at most.
//     a box with its own scroller that opens mid walk (a board, a modal) is put back at its top and the walk
//     ends there, so the video ends on the whole box, not scrolled past its header.
//     --shot: your own walk, steps split by ";": `drag 300,0 2s` (press in the middle, move by x,y, let go),
//     `wheel 1200 3s` (negative goes back up), `hold 2s`. for example, circle a scene, wheel in and back out:
//     --shot "drag 300,0 2s; wheel 1200 3s; hold 2s; wheel -1200 3s". clicks and hovers are not steps.
//     cookie banners: only a button inside a fixed, sticky or dialog box on screen that talks about cookies,
//     consent, privacy or tracking, and only reject, decline, opt out or necessary only. never accept, never
//     a link that leaves the page. it says where it landed when that is not the url it was given.
//     --size: mac is 1440x900 (the default), phone is 390x844, or any WxH. --out defaults to .claude/videos.
//     writes <out>/<host>-<path>[-q<hash of the query>]-<size>-<date>-<hhmm>.mp4, the master at 2x (1920 wide
//     at most), and <same>-web.mp4 at the window size, kept under 10 MB (github's limit for a video) when it can.
//     a second take in the same minute gets -2. sizes are printed, and a master over 10 MB is called out.
//     without ffmpeg it says so and falls back to playwright's own video: a .webm at about 1 Mbps vp8 that
//     starts at the blank load. fine as proof, soft for a launch post. it never installs anything.
//     then it reads the video back and samples frames: length, blank frames (one flat color), whether the
//     picture moved. it prints frames a second from the screencast, and the real px a second against --pace.
//     webgl: chromium's new headless mode draws on the gpu. where only the headless shell is installed it
//     falls back to software gl (swiftshader), which is slow on a heavy scene, and says so.
//     exits 0 when the video moves, 1 when it was written but nothing moved (no scroll, every frame the
//     same: a frozen recording), 2 on a usage error, a browser that will not start or a page that will not
//     open (or answers 400 or more).
//     --headed: a visible window.
//
//   node tools/record.mjs --self-test
//     (in the workflow repo only) serves tools/record-test/ on a local port and records a long page with a
//     planted cookie banner, a wheel scene that opens a scrolling panel, the same scene with a --shot, a page
//     whose footer has an opt out link, and a page where nothing moves, then checks each video.
//
// always chromium: the screencast is a chrome devtools feature. playwright is looked for like probe-test.mjs
// does: PLAYWRIGHT_MODULE, the project you run it from, next to this file, then the npx cache.

import { createServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync, createReadStream } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir, tmpdir } from 'node:os';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const USAGE = 'usage: node record.mjs <url> [--size mac | phone | WxH] [--shot "<steps>"] [--seconds 40] [--pace 500] [--out <dir>] [--headed]\n       node record.mjs --self-test';
const SIZES = { mac: [1440, 900], phone: [390, 844] };
const FPS = 30, MAX_EDGE = 1920, LIMIT = 10 * 1024 * 1024;
const SOFT_GL = ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'];

function die(msg) { console.error(msg); process.exit(2); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n) => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const hhmm = () => { const d = new Date(); return `${pad(d.getHours())}${pad(d.getMinutes())}`; };
const shown = (p) => { const r = relative(process.cwd(), p); return r && !r.startsWith('..') ? r : p; };
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const even = (n) => Math.round(n / 2) * 2;

// copied from probe-test.mjs on purpose: the installer copies single files, so no shared module.
async function launchBrowser({ headed = false } = {}) {
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
  if (!found.length) die('playwright not found. in your project: npm i -D playwright && npx playwright install chromium, then run this from the project root. or set PLAYWRIGHT_MODULE=/path/to/node_modules/playwright');
  let last;
  for (const pw of found) {
    // new headless (the full chromium build) draws webgl on the gpu. the headless shell has software gl only.
    // the screencast sends css pixels unless the whole browser runs at 2x, so the scale is forced at launch.
    for (const opts of [{ channel: 'chromium', args: ['--force-device-scale-factor=2'] }, { args: ['--force-device-scale-factor=2', ...SOFT_GL] }]) {
      try { return await pw.chromium.launch({ headless: !headed, ...opts }); } catch (e) { last = e; }
    }
  }
  die(`could not start chromium with any playwright found (npx playwright install chromium in your project): ${String(last && last.message || last).split('\n')[0]}`);
}

export function parseSize(s) {
  if (SIZES[s]) return { w: SIZES[s][0], h: SIZES[s][1], name: s };
  const m = /^(\d{2,4})x(\d{2,4})$/.exec(s || '');
  if (!m) return null;
  return { w: Number(m[1]), h: Number(m[2]), name: `${m[1]}x${m[2]}` };
}

// "drag 300,0 2s; wheel 1200 3s; hold 2s; wheel -1200 3s" into steps, or null when any step does not read.
export function parseShot(s) {
  const time = (t) => { const m = /^(\d+(?:\.\d+)?)(ms|s)$/.exec(t || ''); return m ? Number(m[1]) * (m[2] === 's' ? 1000 : 1) : NaN; };
  const steps = String(s || '').split(';').map((x) => x.trim()).filter(Boolean).map((x) => {
    const [op, a, b, extra] = x.split(/\s+/);
    if (extra !== undefined) return null;
    if (op === 'hold' && b === undefined) { const ms = time(a); return ms > 0 ? { op, ms } : null; }
    if (op === 'wheel') { const dy = Number(a), ms = time(b); return Number.isFinite(dy) && dy !== 0 && ms > 0 ? { op, dy, ms } : null; }
    if (op === 'drag') { const m = /^(-?\d+),(-?\d+)$/.exec(a || ''), ms = time(b); return m && ms > 0 ? { op, dx: Number(m[1]), dy: Number(m[2]), ms } : null; }
    return null;
  });
  return steps.length && steps.every(Boolean) ? steps : null;
}

export function findFfmpeg(bin = process.env.FFMPEG || 'ffmpeg') {
  const r = spawnSync(bin, ['-version'], { encoding: 'utf8' });
  return r.status === 0 ? bin : null;
}

// the most private choice first. accept, agree and allow are never pressed.
const PRIVATE = [/^reject all\b/i, /^(reject|decline|refuse|deny)( all| cookies| optional| non.?essential)?\b/i, /\bopt.?out\b/i,
  /^(only|use) (necessary|essential|required)/i, /^(necessary|essential|required)( cookies)? only/i, /^continue without/i];

async function dismissBanner(page) {
  for (const frame of page.frames()) {
    const hit = await frame.evaluate((sources) => {
      const pats = sources.map((s) => new RegExp(s, 'i'));
      const words = /cookie|consent|privacy|\btrack|gdpr|personal data/i;
      const onScreen = (r) => r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
      const vis = (el) => { const s = getComputedStyle(el); return onScreen(el.getBoundingClientRect()) && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0; };
      // a link that goes somewhere leaves the page being recorded, so only buttons and in page links count.
      const leaves = (el) => el.tagName === 'A' && el.hasAttribute('href') && !/^(#|javascript:)/i.test(el.getAttribute('href').trim());
      // a banner is a box pinned over the page (fixed, sticky, a dialog), on screen, about cookies or consent.
      // a consent manager in its own iframe counts when that iframe's text is about it.
      const inBanner = (el) => {
        for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
          const s = getComputedStyle(a);
          if (/^(fixed|sticky)$/.test(s.position) || /^(dialog|alertdialog)$/.test(a.getAttribute('role') || '') || a.getAttribute('aria-modal') === 'true' || a.tagName === 'DIALOG') {
            return onScreen(a.getBoundingClientRect()) && words.test(a.innerText || '');
          }
        }
        return window !== window.top && words.test(document.body ? document.body.innerText : '');
      };
      const els = [...document.querySelectorAll('button, a, [role=button], input[type=button], input[type=submit]')].filter((e) => vis(e) && !leaves(e));
      const label = (el) => (el.innerText || el.value || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
      for (const p of pats) {
        const el = els.find((e) => { const t = label(e); return t.length < 60 && p.test(t) && inBanner(e); });
        if (el) { el.setAttribute('data-record-dismiss', ''); return label(el); }
      }
      return null;
    }, PRIVATE.map((r) => r.source)).catch(() => null);
    if (hit) {
      await frame.click('[data-record-dismiss]', { timeout: 3000 }).catch(() => {});
      await frame.evaluate(() => document.querySelectorAll('[data-record-dismiss]').forEach((e) => e.removeAttribute('data-record-dismiss'))).catch(() => {});
      await page.waitForTimeout(700);
      return hit;
    }
  }
  return null;
}

// the scroll root: the document, or a box the size of the window that scrolls in its place. nested boxes that
// scroll during the walk are collected, so the walk can put them back and stop.
const setupScroll = (page) => page.evaluate(() => {
  const se = document.scrollingElement || document.documentElement;
  let root = se;
  if (se.scrollHeight - innerHeight <= 8) {
    for (let el = document.elementFromPoint(innerWidth / 2, innerHeight / 2); el && el !== document.body; el = el.parentElement) {
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      if (/auto|scroll/.test(s.overflowY) && el.scrollHeight - el.clientHeight > 8 && r.width >= innerWidth * 0.8 && r.height >= innerHeight * 0.8) { root = el; break; }
    }
  }
  if (root !== se) root.setAttribute('data-record-root', '');
  window.__recordNested = new Set();
  addEventListener('scroll', (e) => { const t = e.target; if (t instanceof Element && t !== se && t !== root && !t.contains(root)) window.__recordNested.add(t); }, true);
}).catch(() => {});
const scrollState = (page) => page.evaluate(() => {
  const el = document.querySelector('[data-record-root]') || document.scrollingElement || document.documentElement;
  const max = el === document.scrollingElement || el === document.documentElement ? el.scrollHeight - innerHeight : el.scrollHeight - el.clientHeight;
  return { y: Math.round(el.scrollTop), max: Math.max(0, Math.round(max)), nested: window.__recordNested ? window.__recordNested.size : 0 };
}).catch(() => ({ y: 0, max: 0, nested: 0 }));
const resetNested = (page) => page.evaluate(() => { for (const el of window.__recordNested || []) el.scrollTop = 0; }).catch(() => {});

// a frame shrunk to 96x60 grey levels. a mean change under 2 of 255 between two of them is codec noise or a
// flicker (a fire, a cursor), not the page moving.
const MOVED = 2, TW = 96, TH = 60;
const diff = (a, b) => (a && b && a.length === b.length ? a.reduce((s, x, i) => s + Math.abs(x - b[i]), 0) / a.length : 255);
const SHRINK = `(img) => { const c = document.createElement('canvas'); c.width = ${TW}; c.height = ${TH};
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, c.width, c.height);
  const d = g.getImageData(0, 0, c.width, c.height).data, out = [];
  for (let p = 0; p < d.length; p += 4) out.push(0.2126 * d[p] + 0.7152 * d[p + 1] + 0.0722 * d[p + 2]);
  return out; }`;

// the eye: a page in its own context, so looking never touches the page being recorded. it also says which gl
// the browser draws with.
async function eyeOn(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const gl = await page.evaluate(() => {
    const g = document.createElement('canvas').getContext('webgl');
    if (!g) return 'none';
    const e = g.getExtension('WEBGL_debug_renderer_info');
    return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'hidden';
  }).catch(() => 'unknown');
  const look = async (jpeg) => !jpeg ? null : page.evaluate(async ({ b64, shrink }) => {
    const img = new Image(); img.src = `data:image/jpeg;base64,${b64}`; await img.decode();
    return (0, eval)(shrink)(img);
  }, { b64: jpeg.toString('base64'), shrink: SHRINK }).catch(() => null);
  return { gl, look, page, close: () => context.close() };
}

// the capture. chromium hands over a jpeg whenever the picture changes; each one is repeated until the next
// arrives, by its own timestamp, so ffmpeg gets a constant 30 fps that plays at the real speed.
async function startCast(context, page, { ffmpeg, master, maxW, maxH }) {
  const cdp = await context.newCDPSession(page);
  let enc = null, encErr = '';
  if (ffmpeg) {
    enc = spawn(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', master],
    { stdio: ['pipe', 'ignore', 'pipe'] });
    enc.stderr.on('data', (d) => { encErr += d; });
    enc.stdin.on('error', () => {});
  }
  const st = { frames: 0, latest: null, t0: null, lastTs: 0, lastWall: 0, written: 0 };
  const put = (buf, upTo) => { if (enc) for (; st.written < upTo; st.written++) enc.stdin.write(buf); };
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    const buf = Buffer.from(data, 'base64');
    const ts = metadata && metadata.timestamp ? metadata.timestamp : Date.now() / 1000;
    if (st.t0 === null) st.t0 = ts; else put(st.latest, Math.round((ts - st.t0) * FPS));
    st.latest = buf; st.lastTs = ts; st.lastWall = Date.now(); st.frames++;
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: maxW, maxHeight: maxH, everyNthFrame: 1 });
  return {
    st,
    async stop() {
      await cdp.send('Page.stopScreencast').catch(() => {});
      const end = st.t0 === null ? 0 : st.lastTs + (Date.now() - st.lastWall) / 1000;
      if (st.latest) put(st.latest, Math.max(st.written + 1, Math.round((end - st.t0) * FPS)));
      await cdp.detach().catch(() => {});
      if (enc) {
        enc.stdin.end();
        const code = await new Promise((r) => enc.on('close', r));
        if (code !== 0 || !st.written) throw new Error(`ffmpeg could not write the video: ${encErr.split('\n')[0] || 'no frames came'}`);
      }
    },
  };
}

// the default walk, wheel at a steady pace on the wall clock. a check runs beside it four times a second: the
// scroll position and a nested box scrolling; once a second also the cookie banner back and the picture moving.
async function walk(page, cast, eye, { w, h, seconds, pace, log }) {
  await page.mouse.move(Math.round(w / 2), Math.round(h / 2));
  await setupScroll(page);
  const start = await scrollState(page);
  const mode = start.max > 8 ? 'page' : 'wheel';
  const t0 = Date.now(), f0 = cast.st.frames;
  let stop = false, byScroll = false, nested = false, top = start.y, sent = 0, again = 0, reached = 0;
  const check = (async () => {
    let prev = await eye.look(cast.st.latest), same = 0, atBottom = 0;
    for (let tick = 1; !stop; tick++) {
      await sleep(250);
      if (stop) break;
      const s = await scrollState(page);
      top = Math.max(top, s.y);
      if (s.nested && !nested) {
        nested = true;
        if (mode === 'wheel') { stop = true; log(`record: a box with its own scroller opened after ${Math.round((Date.now() - t0) / 1000)} s, put it back at its top and stopped`); break; }
        await resetNested(page);
        byScroll = true; // a page that scrolls goes on by scrolling the page itself, not the box under the mouse
      }
      if (mode === 'page') {
        atBottom = s.y >= s.max - 2 ? atBottom + 1 : 0;
        if (atBottom === 1) reached = Date.now();
        if (atBottom >= 3) { stop = true; break; }
      }
      if (tick % 4) continue;
      if (await dismissBanner(page)) again++;
      const now = await eye.look(cast.st.latest);
      same = diff(prev, now) <= MOVED ? same + 1 : 0;
      prev = now;
      if (mode === 'wheel' && same >= 3) { log(`record: the picture stopped moving after ${Math.round((Date.now() - t0) / 1000)} s, stopped`); stop = true; }
    }
  })();
  let last = Date.now();
  while (!stop && Date.now() - t0 < seconds * 1000) {
    await sleep(16);
    const now = Date.now(), d = pace * (now - last) / 1000;
    last = now;
    if (byScroll) await page.evaluate((d) => (document.querySelector('[data-record-root]') || document.scrollingElement).scrollBy(0, d), d).catch(() => {});
    else await page.mouse.wheel(0, d).catch(() => {});
    sent += d;
  }
  const stopped = Date.now();
  stop = true;
  await check;
  // a box that opened mid walk goes back to its top once the wheel has stopped and its own scroll has settled.
  if (nested) { await sleep(300); await resetNested(page); }
  await page.waitForTimeout(1200);
  const end = await scrollState(page);
  const scrolled = Math.max(top, end.y) - start.y;
  const moving = ((mode === 'page' && reached ? reached : stopped) - t0) / 1000;
  return { mode, scrolled, max: end.max, sent: Math.round(sent), walked: (stopped - t0) / 1000, nested, again,
    speed: Math.round((mode === 'page' ? scrolled : sent) / moving), fps: (cast.st.frames - f0) / ((stopped - t0) / 1000) };
}

// a --shot, step by step, each spread over its time on the wall clock.
async function shoot(page, cast, eye, steps, { w, h }) {
  const cx = Math.round(w / 2), cy = Math.round(h / 2);
  await page.mouse.move(cx, cy);
  await setupScroll(page);
  const start = await scrollState(page);
  const t0 = Date.now(), f0 = cast.st.frames;
  let stop = false, again = 0, top = start.y, sent = 0;
  const check = (async () => { while (!stop) { await sleep(1000); if (!stop && await dismissBanner(page)) again++; top = Math.max(top, (await scrollState(page)).y); } })();
  const ramp = async (ms, fn) => { const s = Date.now(); for (let f = 0; f < 1;) { await sleep(16); f = Math.min(1, (Date.now() - s) / ms); await fn(f); } };
  for (const step of steps) {
    if (step.op === 'hold') await sleep(step.ms);
    if (step.op === 'drag') {
      await page.mouse.move(cx, cy); await page.mouse.down();
      await ramp(step.ms, (f) => page.mouse.move(Math.round(cx + step.dx * f), Math.round(cy + step.dy * f)));
      await page.mouse.up(); await page.mouse.move(cx, cy);
    }
    if (step.op === 'wheel') {
      // wheeling in, a box that opens with its own scroller (a board, a modal) ends the step and goes back to its
      // top, so the shot shows the whole box instead of draining it past its header.
      let done = 0, n = 0, opened = false;
      await ramp(step.ms, async (f) => {
        if (opened) return;
        if (step.dy > 0 && ++n % 4 === 0 && (await scrollState(page)).nested) { opened = true; return; }
        const d = step.dy * f - done; done += d; sent += Math.abs(d); await page.mouse.wheel(0, d).catch(() => {});
      });
      if (opened) { await sleep(300); await resetNested(page); await sleep(100); await page.evaluate(() => window.__recordNested && window.__recordNested.clear()).catch(() => {}); }
    }
  }
  const walked = (Date.now() - t0) / 1000;
  stop = true;
  await check;
  await page.waitForTimeout(1200);
  const end = await scrollState(page);
  return { mode: 'shot', scrolled: Math.max(top, end.y) - start.y, max: end.max, sent: Math.round(sent), walked, nested: false, again,
    speed: Math.round(sent / walked), fps: (cast.st.frames - f0) / walked };
}

function stats(frames) {
  const blank = frames.filter((lum) => { const m = lum.reduce((a, b) => a + b, 0) / lum.length; return Math.sqrt(lum.reduce((a, b) => a + (b - m) ** 2, 0) / lum.length) < 2; }).length;
  const steps = frames.slice(1).map((f, i) => diff(frames[i], f));
  return { blank, sampled: frames.length, moving: steps.filter((s) => s > MOVED).length, steps: steps.length, endsDiffer: diff(frames[0], frames[frames.length - 1]) > MOVED };
}

// reads an mp4 back with ffmpeg: its size and length from the header, then frames as raw grey pixels.
export function checkMp4(ffmpeg, file, { samples = 8 } = {}) {
  const info = spawnSync(ffmpeg, ['-hide_banner', '-i', file], { encoding: 'utf8' }).stderr || '';
  const d = /Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/.exec(info), wh = /Video: .*?(\d{2,5})x(\d{2,5})/.exec(info);
  const duration = d ? Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3]) : 0;
  const frames = [];
  for (let i = 0; i < samples; i++) {
    const t = Math.max(0, (duration - 0.2) * (i / (samples - 1)));
    const r = spawnSync(ffmpeg, ['-loglevel', 'error', '-ss', t.toFixed(2), '-i', file, '-frames:v', '1', '-vf', `scale=${TW}:${TH},format=gray`, '-f', 'rawvideo', '-'], { maxBuffer: 1 << 20 });
    if (r.stdout && r.stdout.length === TW * TH) frames.push([...r.stdout]);
  }
  return { duration: Math.round(duration * 10) / 10, size: wh ? `${wh[1]}x${wh[2]}` : 'unknown', ...stats(frames.length > 1 ? frames : [[0], [0]]) };
}

// reads a webm back in a page that does not record (chromium plays vp8 but not h264, hence two readers).
export async function checkWebm(browser, file, { from = 0, samples = 8 } = {}) {
  const server = createServer((req, res) => {
    const size = statSync(file).size;
    const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    if (!m) { res.writeHead(200, { 'content-type': 'video/webm', 'content-length': size, 'accept-ranges': 'bytes' }); return createReadStream(file).pipe(res); }
    const a = m[1] ? Number(m[1]) : 0, z = m[2] ? Number(m[2]) : size - 1;
    res.writeHead(206, { 'content-type': 'video/webm', 'content-length': z - a + 1, 'content-range': `bytes ${a}-${z}/${size}`, 'accept-ranges': 'bytes' });
    createReadStream(file, { start: a, end: z }).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(`${base}/`, { timeout: 15000 }).catch(() => {});
    const r = await page.evaluate(async ({ src, from, samples, SHRINK }) => {
      const v = document.createElement('video');
      v.muted = true; v.preload = 'auto'; v.src = src;
      document.body.append(v);
      const once = (ev) => new Promise((ok, no) => { v.addEventListener(ev, ok, { once: true }); v.addEventListener('error', () => no(new Error('the video will not decode')), { once: true }); });
      await once('loadeddata');
      // a webm without a duration in its header reports Infinity until the end has been seen.
      if (!Number.isFinite(v.duration)) { v.currentTime = 1e9; await once('seeked'); }
      const duration = v.duration, shrink = (0, eval)(SHRINK), frames = [];
      const start = Math.min(Math.max(0, from), Math.max(0, duration - 0.5));
      for (let i = 0; i < samples; i++) {
        v.currentTime = Math.max(0, start + (duration - 0.15 - start) * (i / (samples - 1))); await once('seeked');
        frames.push(shrink(v));
      }
      return { duration: Math.round(duration * 10) / 10, size: `${v.videoWidth}x${v.videoHeight}`, frames };
    }, { src: `${base}/v.webm`, from, samples, SHRINK });
    return { duration: r.duration, size: r.size, ...stats(r.frames) };
  } finally { await context.close(); server.close(); }
}

// the web copy: the window size, crf 23, and when that is still over 10 MB, a bitrate that fits.
function webCopy(ffmpeg, master, to, { w, h, duration }) {
  const enc = (rate) => spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', master, '-vf', `scale=${even(w)}:${even(h)}:flags=lanczos`, '-c:v', 'libx264', '-preset', 'slow',
    ...rate, '-pix_fmt', 'yuv420p', '-movflags', '+faststart', to], { encoding: 'utf8' });
  let r = enc(['-crf', '23']);
  if (r.status === 0 && statSync(to).size > LIMIT && duration > 0) {
    const kbps = Math.floor(LIMIT * 8 * 0.9 / duration / 1000);
    r = enc(['-b:v', `${kbps}k`, '-maxrate', `${kbps}k`, '-bufsize', `${kbps * 2}k`]);
  }
  return r.status === 0 && existsSync(to) ? to : null;
}

function nameFor(out, u, size) {
  const slug = (u.host + (u.pathname.replace(/\/+$/, '') || '')).replace(/[^a-z0-9.]+/gi, '-').replace(/^-|-$/g, '');
  const q = u.search ? `-q${createHash('md5').update(u.search).digest('hex').slice(0, 6)}` : '';
  const base = join(out, `${slug}${q}-${size.name}-${today()}-${hhmm()}`);
  for (let n = 1; ; n++) {
    const b = n === 1 ? base : `${base}-${n}`;
    if (!['.mp4', '-web.mp4', '.webm'].some((x) => existsSync(b + x))) return b;
  }
}

const same = (a, b) => { const x = new URL(a), y = new URL(b); return x.origin + (x.pathname.replace(/\/+$/, '') || '/') + x.search === y.origin + (y.pathname.replace(/\/+$/, '') || '/') + y.search; };

export async function record(browser, url, { size = parseSize('mac'), shot = null, seconds = 40, pace = 500, out = '.claude/videos', ffmpeg = findFfmpeg(), probe = null, log = console.error } = {}) {
  const u = new URL(url);
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(u.hostname) || /\.(localhost|test)$/.test(u.hostname);
  mkdirSync(out, { recursive: true });
  const base = nameFor(out, u, size);
  const tmp = mkdtempSync(join(tmpdir(), 'record-'));
  // without ffmpeg there is no encoder for the screencast, so playwright's own (vp8, about 1 Mbps) records instead.
  const context = await browser.newContext({ viewport: { width: size.w, height: size.h }, deviceScaleFactor: 2, ignoreHTTPSErrors: local,
    ...(size.w < 600 ? { isMobile: true, hasTouch: true } : {}),
    ...(ffmpeg ? {} : { recordVideo: { dir: tmp, size: { width: size.w, height: size.h } } }) });
  const page = await context.newPage();
  const born = Date.now();
  const eye = await eyeOn(browser);
  let walked, banner, cast, offset = 0, probed, landed;
  try {
    const res = await page.goto(url, { waitUntil: 'load', timeout: 45000 }).catch((e) => { throw new Error(`could not open ${url}: ${String(e.message).split('\n')[0]}`); });
    if (res && res.status() >= 400) throw new Error(`${url} answered ${res.status()}`);
    // the settle: the network goes quiet, fonts land, frames are running, intro animations end (4 s at most).
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await page.evaluate(() => Promise.race([new Promise((r) => setTimeout(r, 4000)), (async () => {
      await document.fonts.ready;
      await new Promise((r) => { let n = 0; const f = () => (++n >= 30 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
      await Promise.all(document.getAnimations().filter((a) => a.effect && a.effect.getComputedTiming().endTime !== Infinity).map((a) => a.finished.catch(() => {})));
    })()])).catch(() => {});
    banner = await dismissBanner(page);
    await page.waitForTimeout(800);
    offset = Math.max(0, (Date.now() - born) / 1000 - 0.3);
    cast = await startCast(context, page, { ffmpeg, master: `${base}.mp4`, maxW: Math.min(MAX_EDGE, size.w * 2), maxH: Math.min(MAX_EDGE, size.h * 2) });
    await sleep(400);
    const opts = { w: size.w, h: size.h, seconds, pace, log };
    walked = shot ? await shoot(page, cast, eye, shot, opts) : await walk(page, cast, eye, opts);
    await cast.stop();
    landed = page.url();
    if (probe) probed = await page.evaluate(probe).catch((e) => ({ error: e.message }));
  } catch (e) {
    await context.close().catch(() => {}); await eye.close().catch(() => {});
    rmSync(tmp, { recursive: true, force: true });
    throw e;
  }
  await eye.close();
  const video = page.video();
  await context.close();
  let master = null, web = null, note = null, check;
  if (ffmpeg) {
    master = `${base}.mp4`;
    check = checkMp4(ffmpeg, master);
    web = webCopy(ffmpeg, master, `${base}-web.mp4`, { w: size.w, h: size.h, duration: check.duration });
    if (!web) note = 'ffmpeg could not write the web copy';
  } else {
    master = `${base}.webm`;
    await video.saveAs(master);
    check = await checkWebm(browser, master, { from: offset });
    note = 'no ffmpeg on the PATH: fell back to playwright\'s own video, a .webm at about 1 Mbps vp8 that starts at the blank load. fine as proof, soft for a launch post. with ffmpeg it writes a sharp 2x mp4';
  }
  rmSync(tmp, { recursive: true, force: true });
  const frozen = walked.scrolled === 0 && check.moving === 0 && !check.endsDiffer;
  return { master, web, note, banner, gl: eye.gl, ...walked, check, frozen, landed, left: !same(url, landed), probe: probed,
    bytes: statSync(master).size, webBytes: web ? statSync(web).size : 0 };
}

function line(r, pace) {
  const c = r.check;
  const speed = r.mode === 'page' ? `scrolled ${r.scrolled} of ${r.max} px at ${r.speed} px/s against --pace ${pace}`
    : r.mode === 'wheel' ? `wheel scene, page did not scroll, ${r.sent} px of wheel in ${r.walked.toFixed(1)} s, ${r.speed} px/s against --pace ${pace}`
      : `shot, ${r.sent} px of wheel in ${r.walked.toFixed(1)} s`;
  return [`recorded ${shown(r.master)} (${c.size}, ${mb(r.bytes)})${r.web ? ` and ${shown(r.web)} (${mb(r.webBytes)})` : ''}`,
    `${c.duration} s, ${r.fps.toFixed(1)} frames/s from the screencast`, speed,
    `${c.moving} of ${c.steps} sampled steps moving, ${c.blank} of ${c.sampled} frames blank`,
    r.banner || r.again ? `cookie banner: pressed "${r.banner || 'it'}"${r.again ? `, and again ${r.again}x when it came back` : ''}` : 'no cookie banner pressed'].join(', ');
}

function warnings(r, log) {
  if (r.note) log(`record: ${r.note}`);
  if (r.left) log(`record: landed on ${r.landed}, not the url asked for. the video may show the wrong page`);
  if (/swiftshader/i.test(r.gl)) log('record: webgl is software (swiftshader) here, so a heavy scene records slowly. `npx playwright install chromium` gets the full build that draws on the gpu');
  if (r.bytes > LIMIT) log(`record: the master is ${mb(r.bytes)}, over github's 10 MB for a video. ${r.web ? `use the -web copy (${mb(r.webBytes)})` : 'trim it or shorten the walk'}`);
  if (r.web && r.webBytes > LIMIT) log(`record: the web copy is still ${mb(r.webBytes)}. shorten the walk with --seconds or --shot`);
  if (r.check.blank) log(`record: ${r.check.blank} of ${r.check.sampled} sampled frames are one flat color. a scene that will not draw: try --headed`);
  if (r.frozen) log('record: nothing moved. the page did not scroll and every sampled frame is the same: a frozen recording, not proof');
}

async function selfTest() {
  const dir = join(here, 'record-test');
  if (!existsSync(dir)) die('the self-test needs a clone of the workflow repo (tools/record-test/ is not here). to record: node record.mjs <url>');
  const server = createServer(async (req, res) => {
    const f = join(dir, (req.url.split('?')[0].replace(/^\/+/, '') || 'page.html'));
    if (extname(f) !== '.html' || !existsSync(f)) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': 'text/html' }).end(await readFile(f));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const tmp = mkdtempSync(join(tmpdir(), 'record-test-'));
  const browser = await launchBrowser();
  const ff = findFfmpeg();
  let failed = false;
  const ok = (good, what) => { console.log(`${good ? 'pass' : 'FAIL'}  ${what}`); if (!good) failed = true; };
  const quiet = () => {};
  try {
    if (!ff) console.log('no ffmpeg here: the mp4 lines check the webm fallback instead');
    const a = await record(browser, `${base}/page.html`, { seconds: 15, pace: 800, out: tmp, ffmpeg: ff, log: quiet });
    console.log(line(a, 800));
    ok(ff ? a.check.size === '1920x1200' && !!a.web && a.webBytes > 1000 && a.webBytes < a.bytes : /\.webm$/.test(a.master), ff ? `a 2x master (${a.check.size}, ${mb(a.bytes)}) and a smaller web copy (${mb(a.webBytes)}) were written` : 'the webm fallback was written');
    ok(a.check.duration > 1 && a.check.blank === 0, `it plays: ${a.check.duration} s, ${a.check.blank} blank frames of ${a.check.sampled}`);
    ok(a.mode === 'page' && a.scrolled >= a.max - 2 && a.max > 2000, `a long page is scrolled to its bottom: ${a.scrolled} of ${a.max} px`);
    ok(a.check.endsDiffer && a.check.moving >= 2, `the picture moves: first and last frame differ, ${a.check.moving} of ${a.check.steps} steps moving`);
    ok(a.speed > 800 * 0.8 && a.speed < 800 * 1.2, `the walk keeps its pace: ${a.speed} px/s against --pace 800`);
    ok(a.fps >= 20, `smooth: ${a.fps.toFixed(1)} frames/s came from the screencast while it scrolled`);
    ok(a.banner === 'Reject all', `the cookie banner got reject, not accept or settings: pressed "${a.banner}"`);
    const panel = () => ({ progress: window.__progress, top: document.getElementById('panel').scrollTop, open: document.getElementById('panel').style.display === 'block', drag: window.__drag, max: window.__maxProgress });
    const b = await record(browser, `${base}/scene.html`, { seconds: 15, pace: 800, out: tmp, ffmpeg: null, probe: panel, log: quiet });
    console.log(line(b, 800));
    ok(b.mode === 'wheel' && b.scrolled === 0 && b.sent > 0 && b.check.endsDiffer && b.check.moving > 0 && !b.frozen, `a wheel scene is walked by wheel, the page never scrolls, the scene moves (${b.check.moving} of ${b.check.steps} steps)`);
    ok(b.nested && b.probe.open && b.probe.top === 0, `the panel that opened at the end is left at its top, and the walk stopped there (scrollTop ${b.probe.top})`);
    ok(/\.webm$/.test(b.master) && b.check.size === '1440x900' && /no ffmpeg/.test(b.note), `without ffmpeg: the webm fallback (${b.check.size}), and it says so`);
    ok(b.banner === null, `an "opt out" link outside a cookie box is left alone: ${b.banner === null ? 'nothing pressed' : `pressed "${b.banner}"`}`);
    const s = await record(browser, `${base}/scene.html`, { shot: parseShot('drag 300,0 1s; wheel 2000 1.5s; hold 500ms; wheel -2000 1.5s'), out: tmp, ffmpeg: ff, probe: panel, log: quiet });
    console.log(line(s, 500));
    ok(s.probe.drag >= 250 && s.probe.max >= 0.4 && s.probe.max <= 0.6 && s.probe.progress <= 0.05 && s.check.moving > 0, `--shot drags (${s.probe.drag} px), wheels in 2000 px (the scene got ${Math.round(s.probe.max * 4000)}) and back out (to ${s.probe.progress.toFixed(2)})`);
    const s2 = await record(browser, `${base}/scene.html`, { shot: parseShot('wheel 6000 2s'), out: tmp, ffmpeg: null, probe: panel, log: quiet });
    ok(s2.probe.open && s2.probe.top === 0, `a --shot that wheels into a panel stops there and leaves it at its top (scrollTop ${s2.probe.top})`);
    const f = await record(browser, `${base}/footer.html`, { seconds: 10, pace: 1500, out: tmp, ffmpeg: null, log: quiet });
    console.log(line(f, 1500));
    ok(f.banner === null && f.again === 0 && !f.left && f.scrolled >= f.max - 2, `a footer "Opt out of sale" link is never pressed, the page is not left: landed on ${new URL(f.landed).pathname}`);
    const c = await record(browser, `${base}/still.html`, { seconds: 6, out: tmp, ffmpeg: null, log: quiet });
    const c2 = await record(browser, `${base}/still.html`, { seconds: 4, out: tmp, ffmpeg: null, log: quiet });
    console.log(line(c, 500));
    ok(c.frozen && c.check.blank === 0, 'a page where nothing moves is called frozen, not blank');
    ok(c.master !== c2.master && existsSync(c.master) && existsSync(c2.master), `a second take keeps the first: ${c.master.split('/').pop()}, ${c2.master.split('/').pop()}`);
    // async on purpose: a blocking spawn would stall this process's own server while the child asks it for pages.
    const cli = (args) => new Promise((done) => {
      const child = spawn(process.execPath, [fileURLToPath(import.meta.url), ...args], { env: { ...process.env, FFMPEG: 'no-such-ffmpeg' } });
      let out = '';
      child.stdout.on('data', (d) => { out += d; }); child.stderr.resume();
      child.on('close', (code) => done({ code, out }));
    });
    const d = await cli([`${base}/still.html?take=3`, '--size', 'phone', '--seconds', '4', '--out', tmp]);
    ok(d.code === 1 && /390x844/.test(d.out) && /still\.html-q[0-9a-f]{6}-phone-/.test(d.out), `the cli exits 1 on a frozen recording, --size phone records at 390x844, the query is in the name: exit ${d.code}`);
    const codes = (await Promise.all([[], ['not-a-url'], ['--size', 'huge', `${base}/`], ['--seconds', 'x', `${base}/`], ['--wat', `${base}/`],
      ['--shot', 'spin 3s', `${base}/`], ['--shot', 'wheel 100', `${base}/`], [`${base}/missing.html`]].map(cli))).map((r) => r.code);
    ok(codes.every((x) => x === 2), `usage errors, a bad --shot and a page that answers 404 exit 2: ${codes.join(' ')}`);
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
  if (a === '--headed') opts.headed = true;
  else if (['--size', '--seconds', '--pace', '--out', '--shot'].includes(a)) {
    if (!argv[i + 1] || argv[i + 1].startsWith('--')) die(`${a} needs a value\n${USAGE}`);
    opts[a.slice(2)] = argv[++i];
  } else if (a.startsWith('-')) die(`unknown flag ${a}\n${USAGE}`);
  else pos.push(a);
}
if (pos.length !== 1 || !/^https?:\/\//i.test(pos[0])) die(USAGE);
try { new URL(pos[0]); } catch { die(`record: ${pos[0]} is not a valid url`); }
const size = parseSize(opts.size || 'mac');
if (!size) die(`record: --size takes mac, phone or WxH (like 1280x800), not "${opts.size}"`);
const shot = opts.shot === undefined ? null : parseShot(opts.shot);
if (opts.shot !== undefined && !shot) die(`record: --shot takes steps like "drag 300,0 2s; wheel 1200 3s; hold 2s; wheel -1200 3s", not "${opts.shot}"`);
const num = (v, d, name) => { if (v === undefined) return d; const n = Number(v); if (!(n > 0)) die(`record: ${name} takes a positive number, not "${v}"`); return n; };
const seconds = num(opts.seconds, 40, '--seconds'), pace = num(opts.pace, 500, '--pace');
const browser = await launchBrowser({ headed: !!opts.headed });
let r;
try {
  r = await record(browser, pos[0], { size, shot, seconds, pace, out: opts.out || '.claude/videos' });
} catch (e) { await browser.close(); die(`record: ${e.message}`); }
await browser.close();
console.log(line(r, pace));
console.error(`record: gl ${r.gl}`);
warnings(r, console.error);
if (r.frozen) process.exit(1);
