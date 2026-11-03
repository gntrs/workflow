// builds the readme images in assets/, light and dark. run: node scripts/make-assets.mjs
// one font, figtree (assets/fonts, sil open font license), embedded so github's image proxy renders it.
// every image carries its own solid ground, so it reads on any site, not only github's light or dark page.
import { readFileSync, writeFileSync } from 'node:fs';

const here = (p) => new URL(`../${p}`, import.meta.url);
const font = (w) => readFileSync(here(`assets/fonts/figtree-latin-${w}-normal.woff2`)).toString('base64');
const FACE = `@font-face{font-family:f;font-weight:400;src:url(data:font/woff2;base64,${font(400)}) format('woff2')}
@font-face{font-family:f;font-weight:500;src:url(data:font/woff2;base64,${font(500)}) format('woff2')}
text{font-family:f,sans-serif}`;

const PHOTO = `data:image/jpeg;base64,${readFileSync(here('assets/let-him-cook.jpg')).toString('base64')}`;
const photo = (x, y, w, h, id) => `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18"/></clipPath><image href="${PHOTO}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`;
const MASCOT = process.env.MASCOT || 'chef';
const themes = {
  light: { t1: '#111111', t2: '#57575a', t3: '#6b6b70', bg: '#ffffff', panel: 'rgba(0,0,0,0.035)', line: 'rgba(0,0,0,0.08)', hat: '#ebe8e1', eye: '#141414', strong: '#111111', strongText: '#ffffff' },
  dark:  { t1: '#f0f0f0', t2: '#a8a8ad', t3: '#8f8f96', bg: '#0d1117', panel: 'rgba(255,255,255,0.045)', line: 'rgba(255,255,255,0.10)', hat: '#e9e6df', eye: '#141414', strong: '#f0f0f0', strongText: '#0d1117' },
};
const CLAY = '#d97757';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// the mascot: one soft shape, one flat color, pill eyes. sits and blinks, still under reduced motion.
function mascot(c, cx, cy, s, kind = MASCOT, fill = CLAY, cls = 'bob') {
  const k = (n) => +(n * s).toFixed(1);
  let body;
  if (kind === 'spark') {
    const pts = [];
    for (let i = 0; i <= 160; i++) {
      const a = (i / 160) * Math.PI * 2;
      const r = k(118) * (0.8 + 0.2 * Math.cos(4 * a + Math.PI / 4));
      pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
    }
    body = `<path d="M${pts.join('L')}Z" fill="${CLAY}"/>`;
  } else {
    body = `<path d="M${cx - k(120)},${cy + k(55)} C${cx - k(120)},${cy - k(85)} ${cx - k(70)},${cy - k(120)} ${cx},${cy - k(120)} C${cx + k(70)},${cy - k(120)} ${cx + k(120)},${cy - k(85)} ${cx + k(120)},${cy + k(55)} C${cx + k(120)},${cy + k(98)} ${cx + k(92)},${cy + k(110)} ${cx},${cy + k(110)} C${cx - k(92)},${cy + k(110)} ${cx - k(120)},${cy + k(98)} ${cx - k(120)},${cy + k(55)}Z" fill="${fill}"/>`;
  }
  const hat = kind === 'chef'
    ? `<path d="M${cx - k(52)},${cy - k(112)} L${cx - k(46)},${cy - k(150)} C${cx - k(92)},${cy - k(156)} ${cx - k(84)},${cy - k(214)} ${cx - k(40)},${cy - k(204)} C${cx - k(30)},${cy - k(240)} ${cx + k(30)},${cy - k(240)} ${cx + k(40)},${cy - k(204)} C${cx + k(84)},${cy - k(214)} ${cx + k(92)},${cy - k(156)} ${cx + k(46)},${cy - k(150)} L${cx + k(52)},${cy - k(112)} C${cx + k(20)},${cy - k(104)} ${cx - k(20)},${cy - k(104)} ${cx - k(52)},${cy - k(112)}Z" fill="${c.hat}"/>`
    : '';
  const eye = (x) => `<rect class="eye" x="${x - k(11)}" y="${cy - k(36)}" width="${k(22)}" height="${k(50)}" rx="${k(11)}" fill="${c.eye}"/>`;
  return `<g class="${cls}">${body}${hat}${eye(cx - k(36))}${eye(cx + k(36))}</g>`;
}
const MOTION = `.eye{transform-box:fill-box;transform-origin:center;animation:blink 5.2s infinite}
@keyframes blink{0%,91%,100%{transform:scaleY(1)}94%{transform:scaleY(.12)}}
@media (prefers-reduced-motion:reduce){.eye{animation:none}}`;

function hero(c) {
  const W = 1200, H = 580;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" rx="16" fill="${c.bg}"/>
<style>${FACE}</style>
<text x="40" y="266" font-size="96" font-weight="500" letter-spacing="-4" fill="${c.t1}">let him /cook<tspan dx="18" font-size="34" font-weight="400" letter-spacing="0" fill="${c.t3}">workflow</tspan></text>
<text x="44" y="332" font-size="30" fill="${c.t2}">agent skills that plan, build,</text>
<text x="44" y="374" font-size="30" fill="${c.t2}">review early and stop for your yes.</text>
${photo(808, 26, 360, 528, 'p')}
</svg>`;
}

function heroPhone(c) {
  const W = 600, H = 710;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" rx="16" fill="${c.bg}"/>
<style>${FACE}</style>
${photo(150, 16, 300, 440, 'p')}
<text x="300" y="546" text-anchor="middle" font-size="78" font-weight="500" letter-spacing="-3" fill="${c.t1}">let him /cook</text>
<text x="300" y="582" text-anchor="middle" font-size="26" fill="${c.t3}">workflow</text>
<text x="300" y="632" text-anchor="middle" font-size="30" fill="${c.t2}">agent skills that plan, build,</text>
<text x="300" y="672" text-anchor="middle" font-size="30" fill="${c.t2}">review early and stop for your yes.</text>
</svg>`;
}

function loop(c) {
  const W = 1200, H = 500;
  const box = (x, y, w, h, title, sub, strong) => `
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${strong ? c.strong : c.panel}" stroke="${strong ? 'none' : c.line}"/>
<text x="${x + w / 2}" y="${y + (sub ? h / 2 - 3 : h / 2 + 7)}" text-anchor="middle" font-size="20" font-weight="500" fill="${strong ? c.strongText : c.t1}">${esc(title)}</text>
${sub ? `<text x="${x + w / 2}" y="${y + h / 2 + 21}" text-anchor="middle" font-size="14" fill="${strong ? c.strongText : c.t2}">${esc(sub)}</text>` : ''}`;
  const arrow = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c.t3}" stroke-width="1.5" marker-end="url(#a)"/>`;
  const ending = ['branch', 'real run', 'hand test', 'size sweep', 'notes'];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" rx="16" fill="${c.bg}"/>
<style>${FACE}${MOTION}</style>
<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="${c.t3}"/></marker></defs>
${box(40, 220, 160, 60, 'recipe', 'your task')}
${arrow(200, 250, 258, 250)}
${box(260, 220, 150, 60, '/cook', 'sizes it')}
${mascot(c, 335, 186, 0.3)}
${arrow(410, 242, 488, 100)}${arrow(410, 250, 488, 250)}${arrow(410, 258, 488, 400)}
${box(490, 60, 250, 80, 'microwave', 'quick, no subagents')}
${box(490, 210, 250, 80, 'stove', 'build, up to 2 helpers')}
${box(490, 360, 250, 80, 'slow cook', '/deep, plan then up to 4 agents')}
<text x="615" y="472" text-anchor="middle" font-size="14" fill="${c.t3}">each lane reviewed as it lands, not at the end</text>
${arrow(740, 100, 818, 242)}${arrow(740, 250, 818, 250)}${arrow(740, 400, 818, 258)}
<rect x="820" y="50" width="150" height="400" rx="10" fill="${c.panel}" stroke="${c.line}"/>
<text x="895" y="88" text-anchor="middle" font-size="14" fill="${c.t3}">on the plate</text>
${ending.map((s, i) => `<text x="895" y="${142 + i * 64}" text-anchor="middle" font-size="19" fill="${c.t1}">${s}</text>`).join('\n')}
${arrow(970, 250, 1018, 250)}
${box(1020, 190, 140, 60, 'taste test', '/review')}
${arrow(1090, 250, 1090, 308)}
${box(1020, 310, 140, 60, 'serve', '/ship, your yes', true)}
</svg>`;
}

function loopPhone(c) {
  const W = 600, H = 820;
  const box = (x, y, w, h, title, subs, strong) => `
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${strong ? c.strong : c.panel}" stroke="${strong ? 'none' : c.line}"/>
<text x="${x + w / 2}" y="${y + 34}" text-anchor="middle" font-size="26" font-weight="500" fill="${strong ? c.strongText : c.t1}">${esc(title)}</text>
${subs.map((t, i) => `<text x="${x + w / 2}" y="${y + 62 + i * 24}" text-anchor="middle" font-size="21" fill="${strong ? c.strongText : c.t2}">${esc(t)}</text>`).join('')}`;
  const arrow = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c.t3}" stroke-width="2" marker-end="url(#a)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" rx="16" fill="${c.bg}"/>
<style>${FACE}${MOTION}</style>
<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="${c.t3}"/></marker></defs>
${box(170, 24, 260, 76, 'recipe', ['your task'])}
${arrow(300, 100, 300, 132)}
${box(170, 136, 260, 76, '/cook', ['sizes it'])}
${mascot(c, 112, 182, 0.27)}
${arrow(260, 212, 105, 250)}${arrow(300, 212, 300, 250)}${arrow(340, 212, 495, 250)}
${box(16, 254, 178, 104, 'microwave', ['quick,', 'no subagents'])}
${box(211, 254, 178, 104, 'stove', ['build,', 'up to 2 helpers'])}
${box(406, 254, 178, 104, 'slow cook', ['/deep,', 'up to 4 agents'])}
${arrow(105, 358, 260, 398)}${arrow(300, 358, 300, 398)}${arrow(495, 358, 340, 398)}
<rect x="40" y="402" width="520" height="132" rx="12" fill="${c.panel}" stroke="${c.line}"/>
<text x="300" y="436" text-anchor="middle" font-size="21" fill="${c.t3}">on the plate</text>
<text x="300" y="474" text-anchor="middle" font-size="24" fill="${c.t1}">branch · real run · hand test</text>
<text x="300" y="512" text-anchor="middle" font-size="24" fill="${c.t1}">size sweep · notes</text>
${arrow(300, 534, 300, 566)}
${box(170, 570, 260, 76, 'taste test', ['/review'])}
${arrow(300, 646, 300, 678)}
${box(170, 682, 260, 76, 'serve', ['/ship, your yes'], true)}
<text x="300" y="796" text-anchor="middle" font-size="21" fill="${c.t3}">each lane reviewed as it lands</text>
</svg>`;
}

const out = process.env.OUT ? new URL(`file://${process.env.OUT}/`) : here('assets/');
for (const [name, c] of Object.entries(themes)) {
  writeFileSync(new URL(`hero-${name}.svg`, out), hero(c));
  writeFileSync(new URL(`hero-phone-${name}.svg`, out), heroPhone(c));
  writeFileSync(new URL(`loop-${name}.svg`, out), loop(c));
  writeFileSync(new URL(`loop-phone-${name}.svg`, out), loopPhone(c));
}
console.log('assets written', MASCOT);
