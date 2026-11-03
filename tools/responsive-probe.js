/*
 * the size sweep.
 *
 * resizing a maximised browser window is silently ignored, with the call
 * reporting success, and a screenshot of one window says nothing about any
 * other size. jsdom has no layout. so this lays the page out in an iframe of
 * exactly each size and measures it.
 *
 * how to run it, in a browser console:
 *   1. start the dev server
 *   2. open it in chrome, in a tab that stays in front (a hidden tab runs no
 *      animation frames, so the probe refuses to start in one)
 *   3. paste this whole file into the devtools console
 *   4. report(await probeAll())                            every size, this path
 *      report(await probeAll({ paths: ['/', '/login'] }))  several paths
 *      report(await probeAll({ steps: STEPS }))            walk screens per size
 *
 * how to run it headless, with playwright:
 *   open any page of the app, add this file with page.addScriptTag({ path }),
 *   then page.evaluate(async () => report(await probeAll({ paths: ['/'] }))).
 *   tools/probe-test.mjs is a working example: node tools/probe-test.mjs
 *   if playwright already set the viewport, probeHere() measures the page
 *   itself with no iframe: page.evaluate(() => probeHere()).
 *
 * what it reports, per size. faults fail the size, the rest is counted:
 *   overflow     the page scrolls sideways. always a bug. the widest boxes
 *                sticking out are named under it.                     fault
 *   clipped      a leaf whose content does not fit its box and cannot be
 *                scrolled. the end of a word or a row is simply gone.  fault
 *   small        a control under 44 css px in either direction. a link
 *                inside a sentence is type, not a target: counted.    fault
 *   tiny         text under 12 px on a phone width (under 640).       fault
 *   unreachable  a control outside the screen with no scroller between
 *                it and the page, or a fixed control off the glass.   fault
 *   THREW        a step or the boot never arrived at that size.       fault
 *   below-fold   a control outside the screen but inside something that
 *                scrolls. reachable, so counted, not a fault.
 *
 * add data-probe-skip to anything the sweep should ignore (a decorative
 * layer, a visually hidden skip link) and say why in a comment next to it.
 *
 * edit SIZES to the devices this project actually runs on. phone first. real
 * viewports, not round numbers, and every phone twice: full height and with
 * the browser toolbar taking its bite, because a layout that only fits one of
 * the two breaks while it is being used.
 */
const SIZES = [
  [390, 844, 'iphone'],
  [390, 664, 'iphone, toolbar showing'],
  [430, 932, 'large iphone'],
  [360, 800, 'common android'],
  [360, 660, 'common android, toolbar showing'],
  [412, 915, 'large android'],
  [320, 690, 'smallest phone still carried'],
  [768, 1024, 'ipad portrait'],
  [1024, 768, 'ipad landscape'],
  [1280, 800, 'small laptop'],
  [1440, 900, 'laptop'],
  [1920, 1080, 'desktop'],
];

/*
 * optional screens to walk at every size, after the page boots. a screen that
 * is not walked has never been measured, which is where faults hide. each step
 * names what it waits for, never how long to sleep: a fixed sleep that is too
 * short measures the previous screen and calls it fine. example:
 *
 *   const STEPS = [
 *     { label: 'menu open', async run(doc) {
 *         doc.querySelector('[aria-label="menu"]').click();
 *         await until(() => doc.querySelector('nav[open]'), 'the menu opened');
 *     } },
 *   ];
 */

const CONTROLS = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="switch"], [role="checkbox"], [role="tab"], [tabindex]:not([tabindex="-1"])';
const SETTLE_MS = 120;
const PHONE_MAX = 640;
const MIN_TARGET = 44;
const MIN_TEXT = 12;

/*
 * a background tab clamps timers to one per second. a MessageChannel round
 * trip is not clamped, so waiting spins on it instead of setTimeout. both
 * ports are closed each time: an open channel per yield piles up live ports
 * over a long sweep and crashes the tab.
 */
function yieldNow() {
  return new Promise((resolve) => {
    const ch = new MessageChannel();
    ch.port1.onmessage = () => {
      ch.port1.close();
      ch.port2.close();
      resolve();
    };
    ch.port2.postMessage(0);
  });
}

async function wait(ms) {
  const t0 = performance.now();
  while (performance.now() - t0 < ms) await yieldNow();
}

/* spin until ready() is true. the timeout is a failure, not a fallback. */
async function until(ready, what, timeoutMs = 6000) {
  const t0 = performance.now();
  for (;;) {
    if (ready()) return;
    if (performance.now() - t0 > timeoutMs) throw new Error(`waited ${timeoutMs} ms and ${what} never happened`);
    await yieldNow();
  }
}

/*
 * a sheet that slides up for 0.3 s, measured mid slide, has its last row below
 * the frame and reads as unreachable. so wait for every animation that ends
 * (a looping shimmer never does) before measuring.
 */
async function settled(doc, timeoutMs = 3000) {
  const ending = (doc.getAnimations ? doc.getAnimations() : [])
    .filter((a) => a.effect?.getTiming?.().iterations !== Infinity);
  const t0 = performance.now();
  let done = false;
  Promise.all(ending.map((a) => a.finished.catch(() => null))).then(() => { done = true; });
  while (!done && performance.now() - t0 < timeoutMs) await yieldNow();
}

const label = (el) => (el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || el.tagName)
  .trim().replace(/\s+/g, ' ').slice(0, 40);

/* a name a person can find in the source: tag, id, first class. */
function selector(el) {
  const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : '';
  return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls ? `.${cls}` : ''}`;
}

function scrollable(el) {
  const s = el.ownerDocument.defaultView.getComputedStyle(el);
  return /(auto|scroll)/.test(s.overflowX + s.overflowY) &&
    (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1);
}

function inScroller(el) {
  for (let p = el.parentElement; p && p !== el.ownerDocument.body; p = p.parentElement) if (scrollable(p)) return true;
  return false;
}

function isFixed(el) {
  const win = el.ownerDocument.defaultView;
  for (let n = el; n && n !== el.ownerDocument.body; n = n.parentElement) {
    if (/fixed|sticky/.test(win.getComputedStyle(n).position)) return true;
  }
  return false;
}

function visible(el) {
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return false;
  const s = el.ownerDocument.defaultView.getComputedStyle(el);
  if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) return false;
  if (el.closest('[aria-hidden="true"], [data-probe-skip]')) return false;
  return true;
}

/* a link that sits inside a sentence is text, not a button. wcag exempts it, so does this. */
function inlineTextLink(el) {
  if (el.tagName !== 'A') return false;
  if (!el.ownerDocument.defaultView.getComputedStyle(el).display.startsWith('inline')) return false;
  const parent = el.parentElement;
  if (!parent) return false;
  for (const node of parent.childNodes) if (node !== el && node.nodeType === 3 && node.textContent.trim()) return true;
  return false;
}

/* what is sticking out, not just that something is. outermost boxes only, widest first. */
function widest(doc, w) {
  const out = [];
  for (const el of doc.body.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const over = Math.round(r.right - w);
    if (over > 1) out.push({ el, over });
  }
  out.sort((a, b) => b.over - a.over);
  const roots = [];
  for (const row of out) {
    if (roots.some((r) => r.el.contains(row.el))) continue;
    roots.push(row);
    if (roots.length === 3) break;
  }
  return roots.map((r) => `${selector(r.el)} runs ${r.over}px past the right edge`);
}

function measure(win, w, h, screen, issues, counts) {
  const doc = win.document;
  const root = doc.scrollingElement || doc.documentElement;
  if (root.scrollWidth > w + 1) {
    issues.push(`${screen}: overflow, page is ${root.scrollWidth}px wide in a ${w}px screen`);
    for (const c of widest(doc, w)) issues.push(`${screen}:   overflow by ${c}`);
  }
  const pageScrolls = root.scrollHeight > h + 1;

  for (const el of doc.body.querySelectorAll('*')) {
    if (el.children.length > 0) continue;
    if (/^(INPUT|TEXTAREA|SELECT|OPTION|SCRIPT|STYLE|TEMPLATE|BR|IMG|SVG|CANVAS|VIDEO|IFRAME)$/i.test(el.tagName)) continue;
    if (!visible(el)) continue;
    const s = win.getComputedStyle(el);
    if (w < PHONE_MAX && el.textContent.trim() && parseFloat(s.fontSize) < MIN_TEXT) {
      issues.push(`${screen}: tiny ${s.fontSize} text "${label(el)}"`);
    }
    if (s.overflow === 'visible' || s.textOverflow === 'ellipsis' || scrollable(el)) continue;
    if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) {
      issues.push(`${screen}: clipped "${label(el)}"`);
    }
  }

  for (const el of doc.querySelectorAll(CONTROLS)) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    const name = label(el);
    if (r.width < MIN_TARGET || r.height < MIN_TARGET) {
      if (inlineTextLink(el)) counts.inlineLinks += 1;
      else issues.push(`${screen}: small ${Math.round(r.width)}x${Math.round(r.height)} "${name}"`);
    }
    const sideways = r.right > w + 1 || r.left < -1;
    const offGlass = r.bottom > h + 1 || r.top < -1;
    if (sideways && !inScroller(el)) issues.push(`${screen}: unreachable "${name}"`);
    else if (offGlass && isFixed(el)) issues.push(`${screen}: unreachable fixed "${name}"`);
    else if (sideways || offGlass) {
      if (pageScrolls || inScroller(el)) counts.belowFold += 1;
      else issues.push(`${screen}: unreachable "${name}"`);
    }
  }
}

async function measureAll(win, w, h, steps) {
  const doc = win.document;
  try { await doc.fonts.ready; } catch { /* no font api, still worth measuring */ }
  await settled(doc);
  await wait(SETTLE_MS);
  const issues = [];
  const counts = { inlineLinks: 0, belowFold: 0 };
  measure(win, w, h, 'start', issues, counts);
  for (const step of steps) {
    await step.run(doc, win);
    await settled(doc);
    await wait(SETTLE_MS);
    measure(win, w, h, step.label, issues, counts);
  }
  return { issues, counts };
}

async function probe(url, w, h, steps, ready) {
  document.getElementById('probe-frame')?.remove();
  const f = document.createElement('iframe');
  f.id = 'probe-frame';
  f.style.cssText = `width:${w}px;height:${h}px;border:0;position:fixed;top:0;left:0;z-index:2147483647;background:#fff`;
  const loaded = new Promise((r) => f.addEventListener('load', r, { once: true }));
  f.src = url;
  document.body.appendChild(f);
  await loaded;
  const win = f.contentWindow;
  if (!win.document) throw new Error('the frame is cross origin, run the probe from a page on the same origin');
  await until(() => ready(win.document), `the page booted at ${w}x${h}`, 15000);
  return measureAll(win, w, h, steps);
}

/* one sweep at a time: two share the one frame and remove each other's iframe. */
let running = false;

const defaultReady = (doc) => doc.readyState === 'complete' && doc.body && doc.body.children.length > 0;

async function probeAll({
  paths = [location.pathname + location.search],
  sizes = SIZES,
  steps = [],
  ready = defaultReady,
} = {}) {
  if (running) throw new Error('a sweep is already running in this tab');
  if (document.visibilityState !== 'visible') {
    throw new Error('this tab is hidden. a hidden tab runs no animation frames, so every measurement would be of a frozen page. bring it to the front and run again');
  }
  running = true;
  const rows = [];
  const t0 = performance.now();
  try {
    for (const path of paths) {
      for (const [w, h, note] of sizes) {
        const url = new URL(path, location.href).href;
        try {
          rows.push({ path, size: `${w}x${h}`, note, ...(await probe(url, w, h, steps, ready)) });
        } catch (e) {
          // a size that could not be walked fails that size, not the sweep.
          rows.push({ path, size: `${w}x${h}`, note, issues: [`THREW: ${(e && e.message) || e}`], counts: { inlineLinks: 0, belowFold: 0 } });
        }
      }
    }
  } finally {
    running = false;
    document.getElementById('probe-frame')?.remove();
  }
  rows.seconds = +((performance.now() - t0) / 1000).toFixed(1);
  globalThis.probeRows = rows;
  return rows;
}

/* headless front end: the viewport is already the size, so measure this page as it is. */
async function probeHere({ steps = [] } = {}) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const rows = [{ path: location.pathname, size: `${w}x${h}`, note: 'this viewport', ...(await measureAll(window, w, h, steps)) }];
  globalThis.probeRows = rows;
  return rows;
}

const FAULT = /overflow|clipped|unreachable|: small |: tiny |THREW/;

/* one line per size, faults expanded, everything else counted and left alone. */
function report(rows) {
  const out = [];
  let failed = 0;
  for (const row of rows) {
    const bad = [...new Set(row.issues.filter((i) => FAULT.test(i)))];
    const c = row.counts || { inlineLinks: 0, belowFold: 0 };
    if (bad.length) failed += 1;
    out.push(`${bad.length ? 'FAIL' : 'ok  '} ${row.path} ${row.size.padEnd(9)} ${row.note}  (${c.belowFold} below fold, ${c.inlineLinks} inline links)`);
    for (const issue of bad) out.push(`       ${issue}`);
  }
  out.push('', `${rows.length - failed}/${rows.length} sizes clean${rows.seconds === undefined ? '' : `, ${rows.seconds}s`}`);
  return out.join('\n');
}

Object.assign(globalThis, { probe, probeAll, probeHere, report, until, wait, settled, SIZES, FAULT });
console.log('probe ready. run: report(await probeAll())');
