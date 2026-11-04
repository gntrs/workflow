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
 *   small        a control under 44 css px in either direction on a phone
 *                width (under 640), under 24 px above it. a link inside
 *                a sentence is type, not a target: counted.           fault
 *   tiny         text under 12 px on a phone width (under 640).       fault
 *   unreachable  a control outside the screen with no scroller between
 *                it and the page, or a fixed control off the glass.   fault
 *   cut off      text or an image crossing the screen edge with no sideways
 *                scroller to reach it: overflow-x hidden on the page or a
 *                wrapper hid the overflow instead of fixing it.       fault
 *   scroller     a box that scrolls sideways with content out of sight
 *                (a table squeezed into a wrapper). one meant to scroll, a
 *                chip row, a carousel, a board on a phone, carries
 *                data-probe-scroll.                                   fault
 *   THREW        a step or the boot never arrived at that size.       fault
 *   opacity 0    text and controls hidden only by opacity 0 (a reveal on scroll
 *                that has not run, a closed tooltip) are not measured, and are
 *                counted on the row. a section that fades in: walk it with steps.
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
const GUARD_MS = 1000;
const QUIET_MS = 400;
const QUIET_CAP_MS = 4000;
const guarded = new Set();
const redirected = new Map();
const PHONE_MAX = 640;
const MIN_TARGET = 44;
/* above PHONE_MAX a pointer is the input: 24 px is the floor (wcag 2.5.8), so a 36 px desktop button passes. */
const MIN_TARGET_WIDE = 24;
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
/* data that lands after load (a client fetch) changes the dom. wait at every size until nothing
   has been added or rewritten for QUIET_MS, capped, so a loading state is never what gets measured.
   attributes are not watched: an ambient animation rewriting a style would never go quiet. */
async function quiet(win) {
  let last = performance.now();
  const mo = new win.MutationObserver(() => { last = performance.now(); });
  mo.observe(win.document, { childList: true, subtree: true, characterData: true });
  const t0 = performance.now();
  while (performance.now() - last < QUIET_MS && performance.now() - t0 < QUIET_CAP_MS) await wait(50);
  mo.disconnect();
}

async function settled(doc, timeoutMs = 3000) {
  const ending = (doc.getAnimations ? doc.getAnimations() : [])
    .filter((a) => a.effect?.getTiming?.().iterations !== Infinity)
    /* a scroll driven animation never finishes on its own: waiting for it only costs time. */
    .filter((a) => !a.timeline || a.timeline === doc.timeline);
  const t0 = performance.now();
  let done = false;
  Promise.all(ending.map((a) => a.finished.catch(() => null))).then(() => { done = true; });
  while (!done && performance.now() - t0 < timeoutMs) await yieldNow();
}

const label = (el) => (el.getAttribute('aria-label') || el.textContent || (el.labels && el.labels[0] && el.labels[0].textContent) || el.getAttribute('placeholder') || el.getAttribute('name') || el.id || el.tagName)
  .trim().replace(/\s+/g, ' ').slice(0, 40);

/* a name a person can find in the source: tag, id, first class. */
function selector(el) {
  const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : '';
  return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls ? `.${cls}` : ''}`;
}

/* axis aware: overflow-x hidden makes overflow-y compute to auto, so a wrapper that only clips
   sideways must not count as a sideways scroller. axis 'x', 'y', or either when left out. */
function scrollable(el, axis) {
  const s = el.ownerDocument.defaultView.getComputedStyle(el);
  const x = /(auto|scroll)/.test(s.overflowX) && el.scrollWidth > el.clientWidth + 1;
  const y = /(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 1;
  return axis === 'x' ? x : axis === 'y' ? y : x || y;
}

function inScroller(el, axis) {
  for (let p = el.parentElement; p && p !== el.ownerDocument.body; p = p.parentElement) if (scrollable(p, axis)) return true;
  return false;
}

/* a scroller between the control and the fixed box it sits in, like a side panel's body. */
function scrollsInsideFixed(el) {
  const win = el.ownerDocument.defaultView;
  for (let p = el.parentElement; p && p !== el.ownerDocument.body; p = p.parentElement) {
    if (scrollable(p)) return true;
    if (/fixed|sticky/.test(win.getComputedStyle(p).position)) return false;
  }
  return false;
}

/* sticky scrolls with the page until it sticks, so only fixed is pinned to the glass. */
function isFixed(el) {
  const win = el.ownerDocument.defaultView;
  for (let n = el; n && n !== el.ownerDocument.body; n = n.parentElement) {
    if (win.getComputedStyle(n).position === 'fixed') return true;
  }
  return false;
}

/* hidden only by opacity 0 on itself or an ancestor, laid out and otherwise on the page. */
function faded(el) {
  const win = el.ownerDocument.defaultView;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return false;
  if (el.closest('[aria-hidden="true"], [data-probe-skip], [inert]') || srOnly(el)) return false;
  for (let p = el; p && p !== el.ownerDocument.body; p = p.parentElement) {
    const s = win.getComputedStyle(p);
    if (s.display === 'none' || s.visibility === 'hidden') return false;
    if (Number(s.opacity) === 0) return true;
  }
  return false;
}

/* visually hidden for screen readers (tailwind sr-only, a skip link until focused): clipped to
   nothing, or a 1 px box that hides its overflow. it is text for a screen reader, not a target. */
function srOnly(el) {
  const win = el.ownerDocument.defaultView;
  for (let n = el; n && n !== el.ownerDocument.body; n = n.parentElement) {
    const s = win.getComputedStyle(n);
    if (s.clip === 'rect(0px, 0px, 0px, 0px)' || /inset\(50%\)/.test(s.clipPath)) return true;
    const r = n.getBoundingClientRect();
    if (r.width <= 1 && r.height <= 1 && s.overflow !== 'visible') return true;
  }
  return false;
}

function visible(el) {
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return false;
  const s = el.ownerDocument.defaultView.getComputedStyle(el);
  if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) return false;
  for (let p = el.parentElement; p && p !== el.ownerDocument.body; p = p.parentElement) {
    if (Number(el.ownerDocument.defaultView.getComputedStyle(p).opacity) === 0) return false;
  }
  if (el.closest('[aria-hidden="true"], [data-probe-skip], [inert]')) return false;
  if (srOnly(el)) return false;
  /* inside a closed <details> only its own summary shows. */
  for (let d = el.closest('details:not([open])'); d; d = d.parentElement && d.parentElement.closest('details:not([open])')) {
    const summary = d.querySelector(':scope > summary');
    if (!summary || !summary.contains(el)) return false;
  }
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

/* the bug pattern is a box that clips only sideways (overflow-x hidden or clip, y left open), usually
   html, body or a layout wrapper. a box clipping both ways (a carousel viewport) is a frame on purpose. */
function xOnlyClip(el, win) {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const s = win.getComputedStyle(p);
    const x = /hidden|clip/.test(s.overflowX);
    const y = /hidden|clip/.test(s.overflowY);
    if (x && y) return p === el.ownerDocument.body || p === el.ownerDocument.documentElement;
    if (x) return true;
  }
  return false;
}

function offCanvas(el, win) {
  for (let p = el; p && p !== el.ownerDocument.body; p = p.parentElement) {
    const s = win.getComputedStyle(p);
    if (/^(fixed|absolute)$/.test(s.position) || (s.transform && s.transform !== 'none')) return true;
  }
  return false;
}

function measure(win, w, h, screen, issues, counts) {
  const doc = win.document;
  const root = doc.scrollingElement || doc.documentElement;
  if (root.scrollWidth > w + 1) {
    issues.push(`${screen}: overflow, page is ${root.scrollWidth}px wide in a ${w}px screen`);
    for (const c of widest(doc, w)) issues.push(`${screen}:   overflow by ${c}`);
  }
  /* overflow hidden on html (or on body while html is visible) locks the page: nothing past the
     bottom can be scrolled to, so it does not count as below the fold. */
  const hs = win.getComputedStyle(doc.documentElement), bs = win.getComputedStyle(doc.body);
  const viewportY = hs.overflowY !== 'visible' ? hs.overflowY : bs.overflowY;
  const locked = /hidden|clip/.test(viewportY);
  const pageScrolls = !locked && root.scrollHeight > h + 1;
  /* a locked page with an open dialog on top is the usual modal scroll lock: the page behind is not
     in use until the dialog closes, so only what is inside the dialog has to be reachable. */
  const modal = locked && [...doc.querySelectorAll('[role="dialog"], dialog[open], [aria-modal="true"]')].find((d) => visible(d) && isFixed(d));

  /* overflow-x: hidden on the page or a wrapper stops the page from scrolling sideways but leaves
     the content cut off at the edge. any text or image that crosses the edge with no sideways
     scroller between it and the page is cut off. fully off screen (a closed drawer) is left alone. */
  if (root.scrollWidth <= w + 1) {
    const cut = [];
    for (const el of doc.body.querySelectorAll('*')) {
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) || /^(IMG|VIDEO|CANVAS|SVG)$/i.test(el.tagName);
      if (!own || !visible(el) || el.closest('[data-probe-scroll]')) continue;
      if (/^IMG$/i.test(el.tagName) && el.getAttribute('alt') === '') continue;
      const r = el.getBoundingClientRect();
      /* fully off screen counts too, unless it sits in a positioned or moved box: a closed drawer. */
      const parked = !(r.left < w - 1 && r.right > 1) && offCanvas(el, win);
      const right = r.right > w + 1 && !parked;
      const left = r.left < -1 && !parked;
      if (!(right || left) || inScroller(el, 'x') || !xOnlyClip(el, win)) continue;
      if (cut.some((c) => c.contains(el))) continue;
      cut.push(el);
      issues.push(`${screen}: cut off "${label(el)}" ${right ? `ends ${Math.round(r.right - w)}px past the right edge` : `starts ${Math.round(-r.left)}px past the left edge`} (overflow-x hidden hides it, it does not fix it. meant to peek, like a carousel: data-probe-scroll. decoration: aria-hidden)`);
      if (cut.length === 3) break;
    }
  }

  /* a box that scrolls sideways hides what is past its edge: a table squeezed into a
     scroller reads as fine to the page check while half its columns are out of sight.
     an intended one (a carousel, a code block) says so with data-probe-scroll. */
  for (const el of doc.body.querySelectorAll('*')) {
    if (el.closest('[data-probe-scroll]') || !visible(el)) continue;
    if (/^(TEXTAREA|PRE|CODE|INPUT)$/i.test(el.tagName)) continue;
    const ox = win.getComputedStyle(el).overflowX;
    if (!/(auto|scroll)/.test(ox)) continue;
    const hidden = el.scrollWidth - el.clientWidth;
    if (hidden > 1) issues.push(`${screen}: sideways scroller hides ${hidden}px of ${selector(el)} (intended, like a chip row or a board on a phone: add data-probe-scroll)`);
  }

  for (const el of doc.body.querySelectorAll('*')) {
    /* text next to an icon or a <br> is still text: the size check reads any element with its own text. */
    const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (el.children.length > 0 && !ownText) continue;
    if (/^(INPUT|TEXTAREA|SELECT|OPTION|SCRIPT|STYLE|TEMPLATE|BR|IMG|SVG|CANVAS|VIDEO|IFRAME)$/i.test(el.tagName)) continue;
    if (!visible(el)) continue;
    const s = win.getComputedStyle(el);
    if (w < PHONE_MAX && ownText && parseFloat(s.fontSize) < MIN_TEXT) {
      issues.push(`${screen}: tiny ${s.fontSize} text "${label(el)}"`);
    }
    if (el.children.length > 0) continue;
    if (s.overflow === 'visible' || s.textOverflow === 'ellipsis' || (s.webkitLineClamp && s.webkitLineClamp !== 'none') || scrollable(el)) continue;
    if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) {
      issues.push(`${screen}: clipped "${label(el)}"`);
    }
  }

  /* opacity 0 (a reveal on scroll not yet revealed, a closed tooltip) is not measured. it is counted,
     so a section that fades in is never silently skipped: walk it with steps, or turn the reveal off. */
  for (const el of doc.body.querySelectorAll('*')) {
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) || el.matches(CONTROLS);
    if (!own || visible(el) || !faded(el)) continue;
    counts.faded += 1;
  }

  /* a fixed height box or an h-screen hero that hides its overflow cuts off what is inside it on a
     small phone. each control and each piece of text is checked against every box between it and
     its nearest scroller that clips on y. a fold collapsed to 0 height is closed, not cutting. */
  const cutters = new Set();
  for (const el of doc.body.querySelectorAll('*')) {
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) || el.matches(CONTROLS);
    if (!own || !visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.height === 0) continue;
    for (let p = el.parentElement; p && p !== doc.body && p !== doc.documentElement; p = p.parentElement) {
      if (scrollable(p, 'y')) break;
      const ps = win.getComputedStyle(p);
      if (ps.webkitLineClamp && ps.webkitLineClamp !== 'none') break;
      if (!/hidden|clip/.test(ps.overflowY)) continue;
      const pr = p.getBoundingClientRect();
      if (pr.height < 1) break;
      const below = r.bottom - pr.bottom, above = pr.top - r.top;
      if (below > 1 || above > 1) {
        if (!cutters.has(p) && cutters.size < 3) {
          cutters.add(p);
          issues.push(`${screen}: clipped "${label(el)}" by ${selector(p)}, ${Math.round(Math.max(below, above))}px of it hidden ${below > 1 ? 'below' : 'above'} the box`);
        }
        break;
      }
    }
  }

  for (const el of doc.querySelectorAll(CONTROLS)) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    const name = label(el);
    /* a checkbox or radio cannot be padded: its target is the label around or beside it. */
    let t = { width: r.width, height: r.height };
    if (el.labels && el.labels.length) {
      const boxes = [r, ...[...el.labels].filter(visible).map((l) => l.getBoundingClientRect())];
      const left = Math.min(...boxes.map((b) => b.left)), right = Math.max(...boxes.map((b) => b.right));
      const top = Math.min(...boxes.map((b) => b.top)), bottom = Math.max(...boxes.map((b) => b.bottom));
      t = { width: right - left, height: bottom - top };
    }
    /* half a px of slack: subpixel layout reports a 44 px box as 43.99. */
    const min = w < PHONE_MAX ? MIN_TARGET : MIN_TARGET_WIDE;
    if (t.width < min - 0.5 || t.height < min - 0.5) {
      if (inlineTextLink(el)) counts.inlineLinks += 1;
      else issues.push(`${screen}: small ${Math.round(r.width)}x${Math.round(r.height)} "${name}"`);
    }
    /* a closed drawer or a skip link parked above the page: wholly off the glass inside a
       positioned or moved box. it comes on screen when opened or focused. */
    const outside = r.right <= 1 || r.left >= w - 1 || r.bottom <= 1 || (r.top >= h - 1 && isFixed(el));
    if (outside && offCanvas(el, win)) continue;
    if (modal && !modal.contains(el)) continue;
    /* inside a box marked as meant to scroll or peek (a carousel moved by transform), it is reachable. */
    if (el.closest('[data-probe-scroll]') && (r.right > w + 1 || r.left < -1)) { counts.belowFold += 1; continue; }
    const sideways = r.right > w + 1 || r.left < -1;
    const offGlass = r.bottom > h + 1 || r.top < -1;
    if (sideways && !inScroller(el, 'x')) issues.push(`${screen}: unreachable "${name}"`);
    else if (offGlass && isFixed(el) && !scrollsInsideFixed(el)) issues.push(`${screen}: unreachable fixed "${name}"`);
    else if (sideways || offGlass) {
      if (!offGlass || pageScrolls || inScroller(el, 'y')) counts.belowFold += 1;
      else issues.push(`${screen}: unreachable "${name}"`);
    }
  }
}

async function measureAll(win, w, h, steps) {
  const doc = win.document;
  try { await doc.fonts.ready; } catch { /* no font api, still worth measuring */ }
  await quiet(win);
  await settled(doc);
  await wait(SETTLE_MS);
  const issues = [];
  const counts = { inlineLinks: 0, belowFold: 0, faded: 0 };
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
  /* a redirect (to a login, say) would measure some other page under this path's name. */
  const trim = (p) => p.replace(/\/+$/, '') || '/';
  const asked = trim(new URL(url, location.href).pathname);
  const landed = trim(win.location.pathname);
  if (asked !== landed) throw new Error(`asked for ${asked}, landed on ${landed}. a redirect, often a login: sweep logged in (probe-test.mjs: PROBE_STORAGE)`);
  /* an auth guard in the client fetches the session after load, then moves to the login. the first
     time a path is swept, watch its url for a second before measuring anything. */
  if (!guarded.has(asked)) {
    guarded.add(asked);
    const t0 = performance.now();
    while (performance.now() - t0 < GUARD_MS && trim(f.contentWindow.location.pathname) === asked) await wait(50);
  }
  const moved = redirected.get(asked) || trim(f.contentWindow.location.pathname);
  if (moved !== asked) redirected.set(asked, moved);
  if (moved !== asked) throw new Error(`asked for ${asked}, landed on ${moved} after load. a client side redirect, often a login: sweep logged in (probe-test.mjs: PROBE_STORAGE)`);
  await until(() => ready(win.document), `the page booted at ${w}x${h}`, 15000);
  const result = await measureAll(f.contentWindow, w, h, steps);
  /* a client side redirect (an auth guard that runs after load) moves the frame while it is measured. */
  const after = trim(f.contentWindow.location.pathname);
  if (after !== asked) throw new Error(`asked for ${asked}, landed on ${after} after load. a client side redirect, often a login: sweep logged in (probe-test.mjs: PROBE_STORAGE)`);
  return result;
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
          rows.push({ path, size: `${w}x${h}`, note, issues: [`THREW: ${(e && e.message) || e}${/cross-origin|Blocked a frame/i.test(String(e && e.message)) ? ' (the page refuses to load in an iframe: X-Frame-Options or a frame-ancestors csp. allow same origin in dev, or use probeHere())' : ''}`], counts: { inlineLinks: 0, belowFold: 0 } });
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

const FAULT = /overflow|clipped|cut off|unreachable|scroller hides|: small |: tiny |THREW/;

/* one line per size, faults expanded, everything else counted and left alone. */
function report(rows) {
  const out = [];
  let failed = 0;
  for (const row of rows) {
    const bad = [...new Set(row.issues.filter((i) => FAULT.test(i)))];
    const c = row.counts || { inlineLinks: 0, belowFold: 0, faded: 0 };
    if (bad.length) failed += 1;
    out.push(`${bad.length ? 'FAIL' : 'ok  '} ${row.path} ${row.size.padEnd(9)} ${row.note}  (${c.belowFold} below fold, ${c.inlineLinks} inline links${c.faded ? `, ${c.faded} at opacity 0 not measured` : ''})`);
    for (const issue of bad) out.push(`       ${issue}`);
  }
  out.push('', `${rows.length - failed}/${rows.length} sizes clean${rows.seconds === undefined ? '' : `, ${rows.seconds}s`}`);
  return out.join('\n');
}

Object.assign(globalThis, { probe, probeAll, probeHere, report, until, wait, settled, SIZES, FAULT });
console.log('probe ready. run: report(await probeAll())');
