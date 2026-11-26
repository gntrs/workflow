#!/usr/bin/env node
// four colors from one, by the golden ratio. no dependencies.
//   node palette.mjs <hex> [--accent-brightness N] [--css | --json]
//   node palette.mjs --self-test
// values are rounded the way a color picker shows them (hue to half a degree,
// saturation and brightness to a whole percent) so the output matches what
// someone gets doing the same steps by hand.

const PHI = (1 + Math.sqrt(5)) / 2;      // 1.618
const GOLDEN_ANGLE = 360 - 360 / PHI;    // 137.5 degrees
const SMALL = 2 - PHI;                   // 0.382
const SOFT_BRIGHTNESS = 81;              // fixed by the method
const MIN_SATURATION = 5;                // under these the four colors come out as one gray or one black
const MIN_BRIGHTNESS = 10;

export function parseHex(input) {
  if (typeof input !== 'string') throw new Error('give one hex color, like #00B2A9');
  let h = input.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.replace(/./g, (c) => c + c);
  if (!/^[0-9a-f]{6}$/i.test(h)) throw new Error(`not a hex color: ${input}`);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

export function toHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function rgbToHsb([r, g, b]) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return {
    h: (Math.round(h * 2) / 2) % 360,
    s: max === 0 ? 0 : Math.round((d / max) * 100),
    b: Math.round((max / 255) * 100),
  };
}

export function hsbToRgb({ h, s, b }) {
  const v = (b / 100) * 255, c = v * (s / 100), m = v - c;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const [r1, g1, b1] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(h / 60) % 6];
  return [r1, g1, b1].map((n) => Math.round(n + m));
}

function luminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function palette(hex, opts = {}) {
  const main = rgbToHsb(parseHex(hex));
  if (main.s < MIN_SATURATION || main.b < MIN_BRIGHTNESS) throw new Error(`${hex} has no hue to work with (a gray, a near black or a white: saturation ${main.s}, brightness ${main.b}). turning the wheel does nothing to it. pick a color.`);
  const ab = opts.accentBrightness;
  if (ab !== undefined && !(Number.isFinite(ab) && ab >= 0 && ab <= 100)) throw new Error('--accent-brightness takes a number from 0 to 100');
  const roles = {
    main,
    accent: { h: (Math.round((main.h - GOLDEN_ANGLE + 360) * 2) / 2) % 360, s: main.s, b: ab === undefined ? main.b : Math.round(ab) },
    complementary: { h: main.h, s: Math.round(main.s * SMALL), b: SOFT_BRIGHTNESS },
    contrast: { h: main.h, s: main.s, b: Math.round(main.b * SMALL) },
  };
  const out = {};
  for (const [name, hsb] of Object.entries(roles)) {
    const rgb = name === 'main' ? parseHex(hex) : hsbToRgb(hsb); // the main color is never rewritten by rounding
    out[name] = { hex: toHex(rgb), ...hsb, rgb };
  }
  const inks = [['contrast', out.contrast.rgb], ['complementary', out.complementary.rgb], ['white', [255, 255, 255]], ['black', [0, 0, 0]]];
  for (const [name, c] of Object.entries(out)) {
    const scored = inks.filter(([n]) => n !== name).map(([n, rgb]) => ({ name: n, hex: toHex(rgb), ratio: Math.round(contrastRatio(c.rgb, rgb) * 100) / 100 }));
    // a palette color that carries text wins. else whichever of white and black reads best.
    c.ink = scored.find((k) => k.ratio >= 4.5 && (k.name === 'contrast' || k.name === 'complementary')) || scored.filter((k) => k.name === 'white' || k.name === 'black').sort((a, b) => b.ratio - a.ratio)[0];
  }
  const names = Object.keys(out);
  const pairs = [];
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    const ratio = contrastRatio(out[names[i]].rgb, out[names[j]].rgb);
    pairs.push({ a: names[i], b: names[j], ratio: Math.round(ratio * 100) / 100, text: ratio >= 4.5 ? 'text' : ratio >= 3 ? 'large text only' : 'no text' });
  }
  return { colors: out, pairs };
}

function render(p, mode) {
  if (mode === 'json') {
    const colors = Object.fromEntries(Object.entries(p.colors).map(([k, { hex, h, s, b, ink }]) => [k, { hex, h, s, b, ink }]));
    return JSON.stringify({ colors, pairs: p.pairs }, null, 2);
  }
  if (mode === 'css') {
    return [':root {', ...Object.entries(p.colors).map(([k, c]) => `  --${k}: ${c.hex};`), '}'].join('\n');
  }
  const lines = Object.entries(p.colors).map(([k, c]) => `${k.padEnd(14)} ${c.hex}   h ${String(c.h).padStart(5)}  s ${String(c.s).padStart(3)}  b ${String(c.b).padStart(3)}`);
  lines.push('', 'text on each:');
  for (const [k, c] of Object.entries(p.colors)) lines.push(`${k.padEnd(14)} ${c.ink.hex} (${c.ink.name})  ${c.ink.ratio.toFixed(2)}`);
  lines.push('', 'contrast between each pair (4.5 for text, 3 for large text):');
  for (const q of p.pairs) lines.push(`${(q.a + ' / ' + q.b).padEnd(28)} ${q.ratio.toFixed(2).padStart(5)}  ${q.text}`);
  return lines.join('\n');
}

function selfTest() {
  let failed = 0;
  const check = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (!ok) failed++;
    console.log(`${ok ? 'pass' : 'FAIL'}  ${label}${ok ? '' : `: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
  };
  const throws = (label, fn, part) => {
    let msg = null;
    try { fn(); } catch (e) { msg = e.message; }
    check(label, msg !== null && msg.includes(part), true);
  };

  // the worked example the method comes from
  const ref = palette('#00B2A9', { accentBrightness: 95 });
  check('main reads as h 177 s 100 b 70', [ref.colors.main.h, ref.colors.main.s, ref.colors.main.b], [177, 100, 70]);
  check('accent lands on 39.5 degrees', ref.colors.accent.h, 39.5);
  check('accent at brightness 95 is #F29F00', ref.colors.accent.hex, '#F29F00');
  check('complementary is #80CFCB', ref.colors.complementary.hex, '#80CFCB');
  check('contrast is #004541', ref.colors.contrast.hex, '#004541');
  check('main comes back as itself', ref.colors.main.hex, '#00B2A9');
  check('an odd main comes back as itself', palette('#3b5bdb').colors.main.hex, '#3B5BDB');

  check('accent keeps the main brightness by default', palette('#00B2A9').colors.accent.b, 70);
  check('hue wraps below zero', palette('#FF0000').colors.accent.h, 222.5);
  check('three digit hex, no hash, lowercase', palette('f00').colors.main.hex, '#FF0000');
  check('six pairs for four colors', ref.pairs.length, 6);
  check('black on white is 21', Math.round(contrastRatio([0, 0, 0], [255, 255, 255])), 21);
  check('a color against itself is 1', contrastRatio([10, 20, 30], [10, 20, 30]), 1);
  const cc = ref.pairs.find((q) => q.a === 'complementary' && q.b === 'contrast');
  check('contrast on complementary carries text', cc.text, 'text');
  const ma = ref.pairs.find((q) => q.a === 'main' && q.b === 'accent');
  check('main on accent is flagged no text', ma.text, 'no text');

  // every rgb value survives the round trip through whole rgb -> hex -> rgb
  check('hex round trip', toHex(parseHex('#0a1B2c')), '#0A1B2C');
  const primaries = { 0: '#FF0000', 60: '#FFFF00', 120: '#00FF00', 180: '#00FFFF', 240: '#0000FF', 300: '#FF00FF' };
  for (const [h, want] of Object.entries(primaries)) {
    check(`full color at hue ${h} is ${want}`, toHex(hsbToRgb({ h: Number(h), s: 100, b: 100 })), want);
    check(`${want} reads back as hue ${h}`, rgbToHsb(parseHex(want)).h, Number(h));
  }
  check('a hue that rounds up to 360 reads as 0', rgbToHsb(parseHex('#FF0001')).h, 0);
  check('and its accent still lands on 222.5', palette('#FF0001').colors.accent.h, 222.5);
  check('half a degree survives', rgbToHsb(hsbToRgb({ h: 39.5, s: 100, b: 95 })).h, 39.5);
  check('accent brightness 0 is black', palette('#00B2A9', { accentBrightness: 0 }).colors.accent.hex, '#000000');
  check('accent brightness 100 is the full color', palette('#00B2A9', { accentBrightness: 100 }).colors.accent.hex, '#FFA800');
  check('text on the tint is the contrast color', ref.colors.complementary.ink.name, 'contrast');
  check('text on the dark is the tint', ref.colors.contrast.ink.name, 'complementary');
  check('text on the bright accent is the contrast color', [ref.colors.accent.ink.name, ref.colors.accent.ink.ratio >= 4.5], ['contrast', true]);
  check('a color never names itself as its text', Object.entries(ref.colors).every(([k, c]) => c.ink.name !== k), true);
  const lowAccent = palette('#00B2A9').colors.accent;
  check('an accent the dark cannot sit on falls back to white or black', [lowAccent.ink.name, lowAccent.ink.ratio >= 4.5], ['black', true]);

  throws('gray is refused', () => palette('#808080'), 'no hue');
  throws('white is refused', () => palette('#FFFFFF'), 'no hue');
  throws('black is refused', () => palette('#000'), 'no hue');
  throws('a near gray is refused', () => palette('#7F8080'), 'no hue');
  throws('a near black is refused', () => palette('#010000'), 'no hue');
  check('a dim, barely colored main at the floor is let through', palette('#1A1818').colors.main.hex, '#1A1818');
  throws('empty input is refused', () => palette(''), 'not a hex color');
  throws('a word is refused', () => palette('teal'), 'not a hex color');
  throws('five digits is refused', () => palette('#12345'), 'not a hex color');
  throws('eight digits is refused', () => palette('#00B2A9FF'), 'not a hex color');
  throws('a missing argument is refused', () => palette(undefined), 'give one hex');
  throws('accent brightness over 100 is refused', () => palette('#00B2A9', { accentBrightness: 101 }), '0 to 100');
  throws('accent brightness that is not a number is refused', () => palette('#00B2A9', { accentBrightness: NaN }), '0 to 100');

  const css = render(ref, 'css');
  check('css output has the four properties', ['--main: #00B2A9;', '--accent: #F29F00;', '--complementary: #80CFCB;', '--contrast: #004541;'].every((l) => css.includes(l)), true);
  check('json output parses back', JSON.parse(render(ref, 'json')).colors.contrast.hex, '#004541');

  // the command line: every exit code and which stream it writes to
  const run = (...argv) => { const io = { out: [], err: [], log(m) { this.out.push(m); }, error(m) { this.err.push(m); } }; const code = main(argv, io); return { code, out: io.out.join('\n'), err: io.err.join('\n') }; };
  check('a color alone exits 0 with a table', [run('#00B2A9').code, run('#00B2A9').out.includes('text on each:')], [0, true]);
  check('the flag before the color works', run('--accent-brightness', '95', '#00B2A9', '--css').out.includes('--accent: #F29F00;'), true);
  check('no arguments prints usage and exits 2', [run().code, run().err.startsWith('usage:')], [2, true]);
  check('--css with --json is refused', [run('#00B2A9', '--css', '--json').code, run('#00B2A9', '--json', '--css').code], [2, 2]);
  check('two colors are refused', run('#00B2A9', '#FF0000').code, 2);
  check('an unknown flag is refused', [run('#00B2A9', '--scss').code, run('#00B2A9', '--scss').err], [2, 'unknown option --scss']);
  for (const v of ['', '0x5f', '1e1', '-5', 'abc', '101', undefined]) {
    const r = v === undefined ? run('#00B2A9', '--accent-brightness') : run('#00B2A9', '--accent-brightness', v);
    check(`--accent-brightness ${v === undefined ? 'with nothing after it' : JSON.stringify(v)} is refused`, [r.code, r.out], [2, '']);
  }
  check('--accent-brightness 62.5 is taken', run('#00B2A9', '--accent-brightness', '62.5').code, 0);
  check('a bad color exits 2 and prints nothing to stdout', [run('teal').code, run('teal').out], [2, '']);

  console.log(failed ? `${failed} failed` : 'all passed');
  return failed ? 1 : 0;
}

function main(argv, io = console) {
  if (argv.includes('--self-test')) return selfTest();
  const usage = 'usage: node palette.mjs <hex> [--accent-brightness N] [--css | --json]\n       node palette.mjs --self-test';
  let hex, accentBrightness, mode;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--css' || a === '--json') {
      if (mode) { io.error('--css or --json, not both'); return 2; }
      mode = a.slice(2);
    } else if (a === '--accent-brightness') {
      const v = argv[++i];
      if (v === undefined || !/^\d{1,3}(\.\d+)?$/.test(v)) { io.error('--accent-brightness takes a number from 0 to 100'); return 2; }
      accentBrightness = Number(v);
    } else if (a.startsWith('--')) { io.error(`unknown option ${a}`); return 2; }
    else if (hex === undefined) hex = a;
    else { io.error('one color at a time'); return 2; }
  }
  if (hex === undefined) { io.error(usage); return 2; }
  try {
    io.log(render(palette(hex, { accentBrightness }), mode || 'table'));
    return 0;
  } catch (e) {
    io.error(e.message);
    return 2;
  }
}

import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
