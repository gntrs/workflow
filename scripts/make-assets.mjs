// builds the readme images in assets/, light and dark. run: node scripts/make-assets.mjs
import { writeFileSync } from 'node:fs';

const themes = {
  light: { bg: '#ffffff', panel: '#f6f6f4', line: 'rgba(0,0,0,0.08)', t1: '#111111', t2: '#555555', t3: '#8a8a8a', accent: '#111111', accentText: '#ffffff' },
  dark:  { bg: '#0b0b0c', panel: '#141416', line: 'rgba(255,255,255,0.09)', t1: '#f2f2f2', t2: '#a6a6a6', t3: '#6b6b6b', accent: '#f2f2f2', accentText: '#0b0b0c' },
};
const sans = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`;
const mono = `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function hero(c) {
  const W = 1200, H = 520;
  const lines = [
    ['t1', '> /cook add a settings page with dark mode'],
    ['t3', ''],
    ['t2', 'lane: build, opus high, 2 helpers'],
    ['t3', '/goal tests green, sweep 0 overflow, /ship printed. stop.'],
    ['t3', ''],
    ['t2', 'plan read cold ............ ok, 2 notes folded in'],
    ['t2', 'builder 1  settings page .. landed, reviewed'],
    ['t2', 'builder 2  theme tokens ... landed, reviewed'],
    ['t2', 'real run, 10 sizes ........ 0 overflow, 0 under 44px'],
    ['t3', ''],
    ['t1', 'hand test: 1. open /settings  2. flip the theme  3. reload ...'],
    ['t1', '/ship  nothing leaves until you say yes.'],
  ];
  const x0 = 520, y0 = 92, lh = 30;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" rx="16" fill="${c.bg}"/>
<text x="64" y="150" font-family="${sans}" font-size="64" font-weight="500" letter-spacing="-2.5" fill="${c.t1}">workflow</text>
<text x="66" y="200" font-family="${sans}" font-size="22" fill="${c.t2}">one door for every task.</text>
<text x="66" y="232" font-family="${sans}" font-size="22" fill="${c.t2}">claude code skills that plan, build,</text>
<text x="66" y="264" font-family="${sans}" font-size="22" fill="${c.t2}">review earlier and stop for your yes.</text>
<rect x="66" y="330" width="232" height="48" rx="8" fill="${c.accent}"/>
<text x="182" y="360" text-anchor="middle" font-family="${mono}" font-size="16" fill="${c.accentText}">claude, set this up</text>
<text x="66" y="420" font-family="${sans}" font-size="15" fill="${c.t3}">macos · linux · windows · mit</text>
<rect x="480" y="48" width="672" height="424" rx="12" fill="${c.panel}" stroke="${c.line}"/>
${lines.map(([k, s], i) => `<text x="${x0}" y="${y0 + i * lh}" font-family="${mono}" font-size="15" fill="${c[k]}" xml:space="preserve">${esc(s)}</text>`).join('\n')}
</svg>`;
}

function loop(c) {
  const W = 1200, H = 510;
  const box = (x, y, w, h, title, sub, strong) => `
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${strong ? c.accent : c.panel}" stroke="${c.line}"/>
<text x="${x + w / 2}" y="${y + (sub ? h / 2 - 4 : h / 2 + 6)}" text-anchor="middle" font-family="${mono}" font-size="17" fill="${strong ? c.accentText : c.t1}">${esc(title)}</text>
${sub ? `<text x="${x + w / 2}" y="${y + h / 2 + 20}" text-anchor="middle" font-family="${sans}" font-size="13" fill="${strong ? c.accentText : c.t2}">${esc(sub)}</text>` : ''}`;
  const arrow = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c.t3}" stroke-width="1.5" marker-end="url(#a)"/>`;
  const ending = ['branch', 'real run', 'hand test', 'size sweep', 'notes'];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="${c.t3}"/></marker></defs>
<rect width="${W}" height="${H}" rx="16" fill="${c.bg}"/>
${box(60, 230, 150, 60, 'your task', '')}
${arrow(210, 260, 268, 260)}
${box(270, 230, 140, 60, '/cook', 'sizes it')}
${arrow(410, 252, 488, 110)}${arrow(410, 260, 488, 260)}${arrow(410, 268, 488, 410)}
${box(490, 70, 250, 80, 'quick', 'main thread, no agents')}
${box(490, 220, 250, 80, 'build', 'up to 2 helpers, plan read cold')}
${box(490, 370, 250, 80, '/deep', 'plan, your read, up to 4 agents')}
<text x="615" y="480" text-anchor="middle" font-family="${sans}" font-size="13" fill="${c.t3}">each lane reviewed as it lands, not at the end</text>
${arrow(740, 110, 818, 252)}${arrow(740, 260, 818, 260)}${arrow(740, 410, 818, 268)}
<rect x="820" y="60" width="150" height="400" rx="8" fill="${c.panel}" stroke="${c.line}"/>
<text x="895" y="96" text-anchor="middle" font-family="${sans}" font-size="13" fill="${c.t3}">every lane ends</text>
${ending.map((s, i) => `<text x="895" y="${150 + i * 64}" text-anchor="middle" font-family="${mono}" font-size="16" fill="${c.t1}">${s}</text>`).join('\n')}
${arrow(970, 260, 1018, 260)}
${box(1020, 200, 130, 60, '/review', 'predicts your no')}
${arrow(1085, 260, 1085, 318)}
${box(1020, 320, 130, 60, '/ship', 'your yes', true)}
</svg>`;
}

for (const [name, c] of Object.entries(themes)) {
  writeFileSync(new URL(`../assets/hero-${name}.svg`, import.meta.url), hero(c));
  writeFileSync(new URL(`../assets/loop-${name}.svg`, import.meta.url), loop(c));
}
console.log('assets written');
