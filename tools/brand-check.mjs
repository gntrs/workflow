// the brand gate. flags colors, font families, radii and shadows in app code that are not in the brand.
//
//   node tools/brand-check.mjs <path/to/brand.md> [files or folders...]
//     with no files: checks what changed in the current git repo against its base
//     (merge base with origin/HEAD, origin/main, origin/master, main or master, else HEAD;
//     set BRAND_BASE=<ref> to pick one, a ref that does not exist exits 2) plus untracked files,
//     only those under the folder it runs from (one app of a monorepo), filtered to app code:
//     .css .scss .sass .less .html .astro .mdx .jsx .tsx .js .mjs .cjs .ts .vue .svelte.
//     skips node_modules (a folder walk also vendor, dist, build, .next), lock files, *.min.*, *.svg and the
//     token files themselves, the workflow's own tools (brand-check.mjs, probe-test.mjs,
//     responsive-probe.js, ref-read.mjs, ref-check.mjs, brand-test/, probe-test/, ref-test/) and a `looks.*` file holding the looks
//     not yet picked; in git mode every changed file it skips is named on stderr. a folder argument is walked with the same filter; the skipped folder
//     names count only below the folder you name. a file named on the command line is always
//     checked. a changed file is checked whole, not only its changed lines.
//     token files are trusted for app code, so they are checked themselves when they are in
//     the checked set (named on the command line, or changed in git mode): every color,
//     radius, shadow and font they define must be in brand.md's tables, `## allow` or
//     `## proposed`, never just in another token file. the whole file is checked, so a value
//     that was already there before the change still hits. off values print as
//     `file:line  token #abcdef in tokens.css not in brand.md` and are hits.
//     warns on stderr, not a hit, when brand.md has no `status:` or no `tokens:` line.
//     prints one line per hit, `file:line  color #3b82f6 not in brand`, then a summary.
//     a value that is only in `## proposed` prints as `proposed` and is not a hit.
//     exits 1 on any hit, 0 when clean or only proposed, 2 on a usage error.
//
//   node tools/brand-check.mjs <brand.md> --json [files...]
//     the same check, hits and proposed printed as json.
//
//   node tools/brand-check.mjs --audit [brand.md] [--json] <folders or files...>
//     a report for redesigning an inconsistent app, not a gate: exits 0 always. walks the
//     folders with the same filter and counts every distinct value per property: color
//     (normalised to hex, tailwind palette classes as blue-500), font family, radius (rem as
//     px, tailwind names as rounded-lg), shadow, font size (css font-size, js fontSize, a
//     bare number is px, tailwind text-[15px] and text-xs..9xl) and font weight (css
//     font-weight, js fontWeight, normal and bold as 400 and 700, tailwind font-thin..black
//     as 100..900). each value prints with its count and up to 3 file:line examples, most used
//     first. with brand.md each value is marked brand, proposed or off, and each property
//     ends with its share of uses off brand (proposed counts as off). font sizes and weights
//     come from the size and weight columns of `## type` and from text-sm / font-semibold
//     style keys in the token column or `## allow`. the last lines are one summary per
//     property: `radius: 25 distinct, 4 in brand, 61% of uses off brand`.
//
//   node tools/brand-check.mjs --self-test
//     (in the workflow repo only: a project copy has no tools/brand-test/)
//     runs against tools/brand-test/: every planted file must report exactly its planted
//     hits, proposed.css must report only proposed values, clean.css and clean.tsx nothing,
//     a planted token file must be caught and a clean one pass, a brand.md missing status:
//     and tokens: must warn twice, and the audit of brand-test/audit/ must count its
//     distinct values.
//     exits 0 only when all of that holds.
//
//   escape hatch: a line containing `brand-check-ignore` (in any comment) is skipped. a
//   comment line that holds only the marker skips the line below it too:
//     // brand-check-ignore: the partner logo color, fixed by contract
//     <Logo fill="#e4002b" />
//
// what counts as allowed:
//   colors   every color literal in the brand.md tables (`## color`, `## type`,
//            `## shape and space`), every color in the token files, and the first token of a
//            `## allow` line. a named css color matches its hex, so `white` passes when #ffffff
//            is in the brand.
//   fonts    the family column of `## type`, quoted names and `--*font*` / `font-family`
//            values in token files, allow lines, and generic families (sans-serif, system-ui,
//            -apple-system, BlinkMacSystemFont, ui-monospace...).
//   radii    only rows of the brand tables whose role or token mentions radius or rounded,
//            `--*radius*` / `$*radius*` / `*radius*:` entries and the `borderRadius` block in
//            token files, and px or rem allow lines. a spacing or type size never allows a
//            radius. 1rem and 16px count as the same value. tailwind `rounded-xl` style names
//            pass when the token files define that key (`--radius-xl`, `borderRadius: { xl }`);
//            rounded-none and rounded-full always pass, and so does a pill radius
//            (999px and up). the px offset in calc(var(--radius) - 2px) is not a radius.
//   shadows  rows whose role or token mentions shadow or elevation (the whole value, compared
//            after normalising colors, zeros and spaces), `--*shadow*` entries and the
//            `boxShadow` block in token files. `shadow-md` style names pass when the token
//            files define that key. none, and any value that uses var(), pass.
//   tailwind palette classes pass when the token files define that color: a `colors` block
//            key (`blue`, `blue: { 500 }`) or a `--color-blue-500` property. text-white and
//            bg-black style classes also pass when #ffffff or #000000 (or oklch(1 0 0) / oklch(0 0 0)) is in the brand.
//   proposed every value in the `## proposed` table (except its from, why and asked columns)
//            is reported as proposed instead of as a hit.
//   always   var(--x) refs, transparent, currentColor, inherit, initial, unset, none, 0.
//   token paths resolve against brand.md's folder, then the git root, then the current
//   folder. `tokens: none` is fine.
//
// what it reads in app code:
//   colors   hex, rgb() rgba() hsl() hsla() with literal args (compared as lowercase hex);
//            named css colors in color, background, border, outline, fill and stroke values,
//            but outside a stylesheet only inside a style context: <style> blocks, style=""
//            attributes, style / sx / css props and keys, css() / sx() calls, styled and css
//            template literals. plain js data ({ color: 'black' }) and jsx text are not read
//            for named colors. tailwind palette classes with bg, text,
//            border, ring, fill, stroke, outline, divide, shadow, from, via, to, decoration,
//            accent, caret, placeholder (any opacity suffix). oklch() oklab() lab() lch() hwb()
//            color() color-mix() with any literal inside are reported as `unchecked color
//            function` unless the same literal is in a token file. tailwind arbitrary values
//            read underscores as spaces, so bg-[oklch(0.6_0.12_170)] matches oklch(0.6 0.12 170).
//            a literal used as a var() fallback, var(--x, #000), is checked like any other.
//            in stylesheets a hex is a value unless the rest of its line opens a block (a
//            selector). everywhere else a hex counts only in a value position: after `:` `=`
//            a quote `[` `(` `,`, or after a border style or a length (`1px solid #ccc`).
//            `Order #123`, `issue #cafe`, `#add()` and `href="#top"` are not colors.
//   fonts    css `font-family:` and the family part of `font:`, js `fontFamily:` and `font:`
//            strings, tailwind `font-[...]`.
//            a stack that names a brand family (not a bare serif / sans-serif) passes whole:
//            the other names are its fallbacks. a stack with no brand family hits per name.
//   radii    css `border-*-radius:`, js `borderRadius:` (a bare number is px), tailwind
//            `rounded-[7px]` and `rounded-{xs,sm,md,lg,xl,2xl,3xl,4xl}` with any side.
//   shadows  css `box-shadow:`, js `boxShadow:`, tailwind `shadow-[...]` and
//            `shadow-{2xs,xs,sm,md,lg,xl,2xl,inner}`.
//   ignored  /* */ and // comments, <!-- -->, anything inside url(...), inline <svg>...</svg>.
//
// not supported, on purpose or not yet:
//   tailwind configs that import presets or compute values (only literals and keys written
//   in the file count); a `colors: { blue: colors.blue }` style key allows every shade.
//   custom tailwind names (bg-brand, rounded-card, font-display) are not checked: tailwind
//   only emits them when the config defines them. text-shadow, drop-shadow and filter values,
//   gradients' stop positions, scss/less maths, values built at runtime. a shadow that
//   contains any var() is not checked. a hex or rgb() literal is still read in plain js data
//   and in jsx text when it sits in a value position (`Color: #fff`). alpha
//   variants are their own values: #11111380 is not #111113. a hex at the start of a
//   stylesheet line with no `{` (indented .sass selectors) counts as a color. regex
//   literals in js can confuse the comment stripper.

import { readFileSync, existsSync, statSync, readdirSync, realpathSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve, relative, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const CODE = new Set(['.css', '.scss', '.sass', '.less', '.html', '.astro', '.mdx', '.jsx', '.tsx', '.js', '.mjs', '.cjs', '.ts', '.vue', '.svelte']);
const STYLESHEET = new Set(['.css', '.scss', '.sass', '.less']);
const MARKUP = new Set(['.html', '.vue', '.svelte', '.astro', '.mdx']);
const SKIP_DIRS = new Set(['node_modules', 'vendor', 'dist', 'build', 'out', 'coverage', '.next', '.nuxt', '.output', '.svelte-kit', '.vercel', '.git', 'brand-test', 'probe-test', 'ref-test']);
// git mode trusts git to leave out build output, so a route folder named build or vendor is still checked.
const GIT_SKIP_DIRS = new Set(['node_modules', '.git', 'brand-test', 'probe-test', 'ref-test']);
// the workflow's own tools, copied into a project's tools/, and the looks file that holds the
// options not yet picked. a file named on the command line is always checked (token files excepted).
const SKIP_NAMES = new Set(['brand-check.mjs', 'probe-test.mjs', 'responsive-probe.js', 'ref-read.mjs', 'ref-check.mjs']);
const GENERIC = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-sans-serif',
  'ui-serif', 'ui-monospace', 'ui-rounded', '-apple-system', 'blinkmacsystemfont', 'emoji', 'math',
  'inherit', 'initial', 'unset', 'revert', 'none']);
const TW_PALETTE = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const TW_SIZES = new Set(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl']);
const TW_WEIGHTS = { thin: '100', extralight: '200', light: '300', normal: '400', medium: '500', semibold: '600', bold: '700', extrabold: '800', black: '900' };
const px = (norm) => (norm.endsWith('rem') ? `${parseFloat(norm) * 16}px` : norm);
const TW_SHADOWS = new Set(['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', 'inner']);

const NAMED = Object.fromEntries(('aliceblue f0f8ff antiquewhite faebd7 aqua 00ffff aquamarine 7fffd4 azure f0ffff beige f5f5dc ' +
  'bisque ffe4c4 black 000000 blanchedalmond ffebcd blue 0000ff blueviolet 8a2be2 brown a52a2a burlywood deb887 ' +
  'cadetblue 5f9ea0 chartreuse 7fff00 chocolate d2691e coral ff7f50 cornflowerblue 6495ed cornsilk fff8dc crimson dc143c ' +
  'cyan 00ffff darkblue 00008b darkcyan 008b8b darkgoldenrod b8860b darkgray a9a9a9 darkgreen 006400 darkgrey a9a9a9 ' +
  'darkkhaki bdb76b darkmagenta 8b008b darkolivegreen 556b2f darkorange ff8c00 darkorchid 9932cc darkred 8b0000 ' +
  'darksalmon e9967a darkseagreen 8fbc8f darkslateblue 483d8b darkslategray 2f4f4f darkslategrey 2f4f4f ' +
  'darkturquoise 00ced1 darkviolet 9400d3 deeppink ff1493 deepskyblue 00bfff dimgray 696969 dimgrey 696969 ' +
  'dodgerblue 1e90ff firebrick b22222 floralwhite fffaf0 forestgreen 228b22 fuchsia ff00ff gainsboro dcdcdc ' +
  'ghostwhite f8f8ff gold ffd700 goldenrod daa520 gray 808080 green 008000 greenyellow adff2f grey 808080 honeydew f0fff0 ' +
  'hotpink ff69b4 indianred cd5c5c indigo 4b0082 ivory fffff0 khaki f0e68c lavender e6e6fa lavenderblush fff0f5 ' +
  'lawngreen 7cfc00 lemonchiffon fffacd lightblue add8e6 lightcoral f08080 lightcyan e0ffff lightgoldenrodyellow fafad2 ' +
  'lightgray d3d3d3 lightgreen 90ee90 lightgrey d3d3d3 lightpink ffb6c1 lightsalmon ffa07a lightseagreen 20b2aa ' +
  'lightskyblue 87cefa lightslategray 778899 lightslategrey 778899 lightsteelblue b0c4de lightyellow ffffe0 lime 00ff00 ' +
  'limegreen 32cd32 linen faf0e6 magenta ff00ff maroon 800000 mediumaquamarine 66cdaa mediumblue 0000cd ' +
  'mediumorchid ba55d3 mediumpurple 9370db mediumseagreen 3cb371 mediumslateblue 7b68ee mediumspringgreen 00fa9a ' +
  'mediumturquoise 48d1cc mediumvioletred c71585 midnightblue 191970 mintcream f5fffa mistyrose ffe4e1 moccasin ffe4b5 ' +
  'navajowhite ffdead navy 000080 oldlace fdf5e6 olive 808000 olivedrab 6b8e23 orange ffa500 orangered ff4500 ' +
  'orchid da70d6 palegoldenrod eee8aa palegreen 98fb98 paleturquoise afeeee palevioletred db7093 papayawhip ffefd5 ' +
  'peachpuff ffdab9 peru cd853f pink ffc0cb plum dda0dd powderblue b0e0e6 purple 800080 rebeccapurple 663399 red ff0000 ' +
  'rosybrown bc8f8f royalblue 4169e1 saddlebrown 8b4513 salmon fa8072 sandybrown f4a460 seagreen 2e8b57 seashell fff5ee ' +
  'sienna a0522d silver c0c0c0 skyblue 87ceeb slateblue 6a5acd slategray 708090 slategrey 708090 snow fffafa ' +
  'springgreen 00ff7f steelblue 4682b4 tan d2b48c teal 008080 thistle d8bfd8 tomato ff6347 turquoise 40e0d0 ' +
  'violet ee82ee wheat f5deb3 white ffffff whitesmoke f5f5f5 yellow ffff00 yellowgreen 9acd32')
  .split(' ').reduce((acc, w, i, a) => (i % 2 ? acc : [...acc, [a[i], '#' + a[i + 1]]]), []));

const sets = () => ({
  colors: new Set(), fonts: new Set(), radii: new Set(), shadows: new Set(), colorFuncs: new Set(),
  colorNames: new Set(), radiusKeys: new Set(), shadowKeys: new Set(),
  sizes: new Set(), sizeKeys: new Set(), weights: new Set(),
});

// ---------- values

const HEX = /#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![0-9a-z_-])/gi;
const FUNC = /\b(rgba?|hsla?)\(\s*([^()]*?)\s*\)/gi;
const LEN = /(-?\d*\.?\d+)(px|rem)\b/gi;
const WIDE = /(?<![\w.-])(oklch|oklab|lab|lch|hwb|color-mix|color)\(/gi;
const SPACES = /^\s*(srgb|srgb-linear|display-p3|a98-rgb|prophoto-rgb|rec2020|xyz|xyz-d50|xyz-d65)\b/i;

function normHex(h) {
  h = h.toLowerCase().replace(/^#/, '');
  if (h.length <= 4) h = [...h].map((c) => c + c).join('');
  if (h.length === 8 && h.endsWith('ff')) h = h.slice(0, 6);
  return '#' + h;
}

const byte = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');

function normFunc(name, args) {
  args = args.replace(/_/g, ' ');
  const raw = `${name.toLowerCase()}(${args.replace(/\s+/g, ' ').trim()})`;
  const parts = args.trim().split(/\s*[,/]\s*|\s+/).filter(Boolean);
  if (parts.length < 3 || parts.length > 4) return raw;
  const num = (s, pctScale) => {
    const m = /^(-?\d*\.?\d+)(%|deg)?$/.exec(s);
    if (!m) return NaN;
    return m[2] === '%' ? (parseFloat(m[1]) / 100) * pctScale : parseFloat(m[1]);
  };
  let rgb;
  if (name.toLowerCase().startsWith('rgb')) {
    rgb = parts.slice(0, 3).map((p) => num(p, 255));
  } else {
    const h = (((num(parts[0], 360) % 360) + 360) % 360) / 360;
    const s = num(parts[1], 1), l = num(parts[2], 1);
    const k = (n) => (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    rgb = [0, 8, 4].map((n) => (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))) * 255);
  }
  if (rgb.some(Number.isNaN)) return raw;
  let hex = '#' + rgb.map(byte).join('');
  if (parts[3] !== undefined) {
    const alpha = num(parts[3], 1);
    if (Number.isNaN(alpha)) return raw;
    if (alpha < 1) hex += byte(alpha * 255);
  }
  return hex;
}

// shadcn and tailwind v4 write white and black as oklch(1 0 0) / oklch(0 0 0), so text-white
// passes when the brand holds either spelling.
function pureWide(S, name) {
  const want = name === 'white' ? /^okl(ch|ab)\((1|1\.0+|100%) 0 0(\/.*)?\)$/ : /^okl(ch|ab)\((0|0%) 0 0(\/.*)?\)$/;
  for (const c of S.colorFuncs) if (want.test(String(c).replace(/\s+/g, ' '))) return true;
  return false;
}

function colorsIn(text) {
  const out = [];
  for (const m of text.matchAll(HEX)) out.push({ index: m.index, raw: m[0], norm: normHex(m[0]) });
  for (const m of text.matchAll(FUNC)) out.push({ index: m.index, raw: m[0], norm: normFunc(m[1], m[2]) });
  return out;
}

// oklch(), color-mix() and friends, with balanced parens. literal is true when anything but
// var() refs, the interpolation space, percentages and transparent / currentColor is inside.
function wideColorsIn(text) {
  const out = [];
  for (const m of text.matchAll(WIDE)) {
    const open = m.index + m[0].length - 1;
    let depth = 0, end = open;
    for (; end < text.length; end++) {
      if (text[end] === '(') depth++;
      else if (text[end] === ')' && --depth === 0) break;
    }
    const inner = text.slice(open + 1, end);
    if (m[1].toLowerCase() === 'color' && !SPACES.test(inner)) continue;
    let rest = inner;
    while (/var\([^()]*\)/.test(rest)) rest = rest.replace(/var\([^()]*\)/g, ' ');
    rest = rest.replace(/_/g, ' ').replace(/^\s*in\s+[\w-]+(\s+(shorter|longer|increasing|decreasing)\s+hue)?\s*,?/i, ' ')
      .replace(/\b(transparent|currentcolor|none)\b/gi, ' ').replace(/-?\d*\.?\d+%/g, ' ').replace(/[\s,/]+/g, '');
    const raw = text.slice(m.index, end + 1).replace(/_/g, ' ').replace(/\s+/g, ' ');
    const norm = raw.toLowerCase().replace(/\s*([(),/])\s*/g, '$1').trim();
    out.push({ index: m.index, raw, norm, literal: rest.length > 0, mix: /^color/i.test(m[1]) || /var\(/i.test(inner) });
  }
  return out;
}

// calc(var(--radius) - 2px) is the token minus an offset, not a 2px radius.
const dropTokenCalc = (v) => v.replace(/calc\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\)/gi, (m) => (/var\(/i.test(m) ? ' ' : m));

function normLen(n, unit) { return `${parseFloat(n)}${unit.toLowerCase()}`; }

function lengthsIn(text) {
  return [...text.matchAll(LEN)].map((m) => ({ index: m.index, raw: m[0], norm: normLen(m[1], m[2]) }));
}

function normShadow(v) {
  return v.replace(/!important/i, '').trim().toLowerCase()
    .replace(FUNC, (m, n, a) => normFunc(n, a))
    .replace(HEX, (m) => normHex(m))
    .replace(/(-?\d*\.?\d+)(px|rem)\b/g, (m, n, u) => (parseFloat(n) === 0 ? '0' : `${parseFloat(n)}${u}`))
    .replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ');
}

const unquote = (s) => s.trim().replace(/^[`'"]+|[`'"]+$/g, '').trim();
function familiesIn(list) {
  return list.split(',').map(unquote).filter(Boolean);
}

// `600 15px/1.4 "Inter", sans-serif` -> the family part, after the size.
function shorthandFamilies(v) {
  const m = /(?:^|\s)(?:\d*\.?\d+(?:px|rem|em|%|pt|vw|vh|ch|ex)|xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large|smaller|larger)(?:\s*\/\s*\S+)?\s+(.+)$/i.exec(v.trim());
  return m ? familiesIn(m[1]) : [];
}

function addColors(text, S) {
  for (const c of colorsIn(text)) S.colors.add(c.norm);
  for (const c of wideColorsIn(text)) S.colorFuncs.add(c.norm);
  const word = text.trim().toLowerCase();
  if (NAMED[word]) S.colors.add(NAMED[word]);
}

// ---------- brand

function sectionKind(title) {
  if (/^allow/.test(title)) return 'allow';
  if (/^proposed/.test(title)) return 'proposed';
  if (/colou?r/.test(title)) return 'color';
  if (/type|typo|font/.test(title)) return 'type';
  if (/shape|space|radi|spacing|shadow|elevation/.test(title)) return 'shape';
  return null;
}

// a tailwind key named in brand.md: rounded-lg, shadow-sm, bg-blue-600, blue-600, text-white.
// in a radius or shadow row a bare size (lg, sm) counts too. returns true when it was one.
const TW_UTIL = 'bg|text|border(?:-[xytrblse])?|ring(?:-offset)?|fill|stroke|outline|divide|shadow|from|via|to|decoration|accent|caret|placeholder';
function twKey(word, S, row = '') {
  const w = word.replace(/`/g, '').trim().toLowerCase().replace(/[,;:]$/, '');
  const color = new RegExp(`^(?:(?:${TW_UTIL})-)?(?:((?:${TW_PALETTE})-(?:50|[1-9]00|950))|(black|white))(?:/\\S+)?$`).exec(w);
  if (color && (color[1] || /^(?:[a-z-]+)-(?:black|white)/.test(w))) { S.colorNames.add(color[1] || color[2]); return true; }
  const radius = /^rounded(?:-(?:[trblse]|tl|tr|br|bl|ss|se|es|ee))?(?:-(\w+))?$/.exec(w);
  if (radius) { S.radiusKeys.add(radius[1] || 'DEFAULT'); return true; }
  const shadow = /^shadow(?:-(\w+))?$/.exec(w);
  if (shadow && (!shadow[1] || TW_SHADOWS.has(shadow[1]))) { S.shadowKeys.add(shadow[1] || 'DEFAULT'); return true; }
  const size = /^text-(xs|sm|base|lg|xl|[2-9]xl)$/.exec(w);
  if (size) { S.sizeKeys.add(w); return true; }
  if (/^font-[a-z]+$/.test(w) && TW_WEIGHTS[w.slice(5)]) { S.weights.add(TW_WEIGHTS[w.slice(5)]); return true; }
  if (/radi|rounded/.test(row) && TW_SIZES.has(w)) { S.radiusKeys.add(w); return true; }
  if (/shadow|elevation/.test(row) && TW_SHADOWS.has(w)) { S.shadowKeys.add(w); return true; }
  return false;
}

function addRow(cells, header, S, skipCols) {
  const col = (name, fallback) => { const i = header.findIndex((h) => h === name); return i >= 0 ? i : fallback; };
  const ri = col('role', 0), ti = col('token', 1);
  const label = `${cells[ri] || ''} ${cells[ti] || ''}`.toLowerCase();
  for (const w of (cells[ti] || '').split(/[\s,]+/)) if (w) twKey(w, S, label);
  cells.forEach((cell, i) => {
    if (skipCols.test(header[i] || '') || !cell) return;
    addColors(cell, S);
    if (/family|font/.test(header[i] || '')) for (const f of familiesIn(cell)) if (!/^-?\d|^#|\(/.test(f)) S.fonts.add(f.toLowerCase());
    if (/^size/.test(header[i] || '')) for (const l of lengthsIn(cell)) S.sizes.add(px(l.norm));
    if (/^weight/.test(header[i] || '')) for (const w of cell.match(/\b[1-9]00\b/g) || []) S.weights.add(w);
    if (i === ri || i === ti) return;
    if (/radi|rounded/.test(label)) for (const l of lengthsIn(cell)) S.radii.add(l.norm);
    if (/shadow|elevation/.test(label)) S.shadows.add(normShadow(cell));
  });
}

export function parseBrand(text) {
  const allowed = sets(), proposed = sets();
  let tokens = [], hasStatus = false, hasTokens = false;
  let kind = null, inSections = false, header = null;
  for (const line of text.split(/\r?\n/)) {
    const h = /^#{1,3}\s+(.+?)\s*$/.exec(line);
    if (h) {
      // a ### sub heading (one table per surface) stays in its ## section, only the table header resets.
      if (/^###\s/.test(line)) { header = null; continue; }
      if (line.startsWith('##')) { inSections = true; kind = sectionKind(h[1].toLowerCase()); header = null; }
      continue;
    }
    if (!inSections) {
      if (/^\s*status\s*:/i.test(line)) hasStatus = true;
      const t = /^\s*tokens\s*:\s*(.*)$/i.exec(line);
      if (t) hasTokens = true;
      // an unfilled template (`<comma separated paths ...>`) names no files.
      if (t) tokens = /^\s*</.test(t[1]) ? [] : t[1].replace(/`/g, '').split(/\s*,\s*|\s+/).filter((x) => x && x.toLowerCase() !== 'none');
      continue;
    }
    if (!kind) continue;
    const trimmed = line.trim();
    if (kind !== 'allow' && trimmed.startsWith('|')) {
      const cells = trimmed.replace(/^\||\|$/g, '').split('|').map((c) => c.replace(/`/g, '').trim());
      if (cells.every((c) => /^:?-*:?$/.test(c))) continue;
      if (!header) { header = cells.map((c) => c.toLowerCase()); continue; }
      if (kind === 'proposed') addRow(cells, header, proposed, /^(from|why|asked|reason|note)/);
      else addRow(cells, header, allowed, /^(contrast)/);
      continue;
    }
    if (kind === 'allow') {
      const item = /^\s*[-*+]\s+(.*)$/.exec(line);
      if (!item) continue;
      const body = item[1].replace(/`/g, '').trim();
      const q = /^(['"])(.*?)\1/.exec(body);
      const first = q ? q[2] : body.split(/\s+/)[0].replace(/[,;:]$/, '');
      if (!first || twKey(first, allowed)) continue;
      const before = allowed.colors.size + allowed.colorFuncs.size + allowed.radii.size;
      addColors(first, allowed);
      for (const l of lengthsIn(first)) allowed.radii.add(l.norm);
      if (allowed.colors.size + allowed.colorFuncs.size + allowed.radii.size === before) allowed.fonts.add(first.toLowerCase());
    }
  }
  return { allowed, proposed, tokens, hasStatus, hasTokens };
}

function gitRoot(cwd) {
  try { return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return null; }
}

// the {...} that starts at src[open].
function block(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return src.slice(open, i + 1);
  }
  return src.slice(open);
}

// leaf key paths of a js object literal: { blue: { 500: '#..' }, ink: '#..' } -> blue-500, ink.
function leafKeys(obj) {
  const out = new Set();
  const path = [];
  let depth = 0;
  for (const m of obj.matchAll(/(['"]?)([\w-]+)\1\s*:|[{}]/g)) {
    if (m[0] === '{') { depth++; continue; }
    if (m[0] === '}') { depth--; continue; }
    path[depth] = m[2];
    path.length = depth + 1;
    const after = obj.slice(m.index + m[0].length).trimStart();
    if (!after.startsWith('{')) out.add(path.slice(1).filter((k) => k !== 'DEFAULT').join('-'));
  }
  out.delete('');
  return out;
}

function readTokens(file, S) {
  const src = stripComments(readFileSync(file, 'utf8'), extname(file));
  for (const c of colorsIn(src)) S.colors.add(c.norm);
  for (const c of wideColorsIn(src)) S.colorFuncs.add(c.norm);
  for (const m of src.matchAll(/(['"`])([^'"`\n]{1,80})\1/g)) for (const f of familiesIn(m[2])) S.fonts.add(f.toLowerCase());
  for (const m of src.matchAll(/(?:--[\w-]*font[\w-]*|font-family)\s*:\s*([^;{}]+)/gi)) for (const f of familiesIn(m[1])) S.fonts.add(f.toLowerCase());
  // css custom properties and scss variables, tailwind v4 @theme included.
  for (const m of src.matchAll(/(--[\w-]+|\$[\w-]+)\s*:\s*([^;{}\n]+)/g)) {
    const [name, value] = [m[1].toLowerCase(), m[2]];
    for (const c of hslChannels(value)) S.colors.add(c.norm);
    if (/radius|rounded/.test(name)) {
      for (const l of lengthsIn(dropTokenCalc(value))) S.radii.add(l.norm);
      const key = /^--radius-([\w-]+)$/.exec(name);
      if (key) S.radiusKeys.add(key[1]);
      if (name === '--radius') S.radiusKeys.add('DEFAULT');
    }
    if (/shadow/.test(name)) {
      S.shadows.add(normShadow(value));
      const key = /^--shadow-([\w-]+)$/.exec(name);
      if (key) S.shadowKeys.add(key[1]);
      if (name === '--shadow') S.shadowKeys.add('DEFAULT');
    }
    const color = /^--color-([\w-]+)$/.exec(name);
    if (color) S.colorNames.add(color[1]);
  }
  // js / json: tailwind config blocks, and any *radius* key with a literal value.
  for (const m of src.matchAll(/(['"]?)(colors|borderRadius|boxShadow)\1\s*:\s*\{/g)) {
    const obj = block(src, m.index + m[0].length - 1);
    const keys = leafKeys(obj);
    if (/(['"]?)DEFAULT\1\s*:/.test(obj)) keys.add('DEFAULT');
    if (m[2] === 'colors') for (const k of keys) S.colorNames.add(k);
    if (m[2] === 'borderRadius') { for (const k of keys) S.radiusKeys.add(k); for (const l of lengthsIn(dropTokenCalc(obj))) S.radii.add(l.norm); }
    if (m[2] === 'boxShadow') {
      for (const k of keys) S.shadowKeys.add(k);
      for (const s of obj.matchAll(/(['"`])([^'"`\n]*)\1\s*[,}\n]/g)) S.shadows.add(normShadow(s[2]));
    }
  }
  for (const m of src.matchAll(/[\w-]*radius[\w-]*['"]?\s*:\s*(['"`]?)([^'"`,}\n]+)\1/gi)) for (const l of lengthsIn(dropTokenCalc(m[2]))) S.radii.add(l.norm);
}

export function loadBrand(brandPath, warn = () => {}) {
  const brandDir = dirname(resolve(brandPath));
  const text = readFileSync(brandPath, 'utf8');
  const { allowed, proposed, tokens, hasStatus, hasTokens } = parseBrand(text);
  if (!hasStatus) warn(`brand-check: ${brandPath} has no status: line, it may be a draft nobody confirmed`);
  if (!hasTokens) warn(`brand-check: ${brandPath} has no tokens: line, write tokens: none if there are none`);
  const root = gitRoot(brandDir);
  const tokenFiles = [];
  for (const t of tokens) {
    const found = [brandDir, root, process.cwd()].filter(Boolean).map((d) => resolve(d, t)).find((p) => existsSync(p));
    if (!found) { warn(`brand-check: token file ${t} not found, its values are not counted`); continue; }
    tokenFiles.push(found);
    readTokens(found, allowed);
  }
  // brandOnly: the tables, ## allow and nothing else, to check the token files themselves against.
  return { allowed, proposed, tokenFiles, brandOnly: parseBrand(text).allowed };
}

// ---------- scanning

const blank = (s) => s.replace(/[^\n]/g, ' ');

export function stripComments(text, ext) {
  text = text.replace(/<svg\b[\s\S]*?<\/svg\s*>/gi, blank);
  text = text.replace(/url\([^)]*\)/gi, blank);
  text = text.replace(/data:image\/svg\+xml[^'"`)\s]*/gi, blank);
  if (MARKUP.has(ext)) text = text.replace(/<!--[\s\S]*?-->/g, blank);
  if (ext === '.css') return text.replace(/\/\*[\s\S]*?\*\//g, blank);
  // js, ts, scss and friends: walk it so quotes protect // and /* inside strings.
  let out = '', q = null, i = 0;
  while (i < text.length) {
    const c = text[i], n = text[i + 1];
    if (q === "'" || q === '"') {
      out += c;
      if (c === '\\') { out += n ?? ''; i += 2; continue; }
      if (c === q || c === '\n') q = null;
      i++; continue;
    }
    if (c === '/' && n === '*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end < 0 ? text.length : end + 2;
      out += blank(text.slice(i, stop)); i = stop; continue;
    }
    if (q === '`') {
      out += c;
      if (c === '\\') { out += n ?? ''; i += 2; continue; }
      if (c === '`') q = null;
      i++; continue;
    }
    if (c === '/' && n === '/' && text[i - 1] !== ':') {
      const end = text.indexOf('\n', i);
      const stop = end < 0 ? text.length : end;
      out += blank(text.slice(i, stop)); i = stop; continue;
    }
    if (c === "'" || c === '"' || c === '`') q = c;
    out += c; i++;
  }
  return out;
}

function lineAt(starts, index) {
  let lo = 0, hi = starts.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= index) lo = mid; else hi = mid - 1; }
  return lo + 1;
}

const radiusOk = (S, norm) => {
  const v = parseFloat(norm);
  if (v === 0 || S.radii.has(norm)) return true;
  if ((norm.endsWith('px') && v >= 999) || (norm.endsWith('rem') && v >= 62)) return true; // a pill, like rounded-full
  return S.radii.has(norm.endsWith('rem') ? `${v * 16}px` : `${v / 16}rem`);
};
// the bare css generics are everyone's last fallback, so they never vouch for a stack.
// ui-sans-serif, system-ui and the like do: a system stack is a brand choice.
const BARE = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'math', 'emoji', 'fangsong']);
// "Inter Variable" (the fontsource variable build) is the brand's Inter.
const fam = (f) => f.toLowerCase().replace(/\s+variable$/, '');
const stackOk = (S, list) => list.some((g) => !BARE.has(g.toLowerCase()) && (S.fonts.has(g.toLowerCase()) || S.fonts.has(fam(g))));
const fontOk = (S, f) => GENERIC.has(f.toLowerCase()) || S.fonts.has(f.toLowerCase()) || S.fonts.has(fam(f)) || /var\(|\$\{|^\$|^@/.test(f);
const shadowOk = (S, v) => /var\(|\$\{/.test(v) || /^(none|inherit|initial|unset|revert)$/i.test(v.trim()) || S.shadows.has(normShadow(v));

// a hex outside a stylesheet counts only where a value goes.
function valuePosition(src, index) {
  if (/(?:href|to|id)=["']$/i.test(src.slice(Math.max(0, index - 6), index))) return false;
  const before = src.slice(Math.max(0, index - 40), index).replace(/[ \t]+$/, '');
  if (/[:='"`[(,]$/.test(before)) return true;
  return /(?:\b(?:solid|dashed|dotted|double|groove|ridge|inset|outset)|\d(?:px|rem|em|%)|(?<![\w.])0)$/i.test(before);
}

// where a named color like `red` is a css value outside a stylesheet: <style> blocks, style=""
// attributes, style / sx / css props and keys, css() and sx() calls, styled and css template literals.
function styleRanges(src) {
  const ranges = [];
  const until = (from, close) => { const i = src.indexOf(close, from); return i < 0 ? src.length : i; };
  for (const m of src.matchAll(/<style\b[^>]*>/gi)) ranges.push([m.index, until(m.index, '</style')]);
  for (const m of src.matchAll(/\b(?:style|sx|css)\s*=\s*(["'])/g)) ranges.push([m.index, until(m.index + m[0].length, m[1])]);
  for (const m of src.matchAll(/\b(?:style|sx|css)\s*(?:=\s*\{?|:|\(\s*)\s*\{/g)) {
    const open = m.index + m[0].length - 1;
    ranges.push([m.index, open + block(src, open).length]);
  }
  for (const m of src.matchAll(/\b(?:styled(?:\.\w+|\([^)]*\))(?:\.attrs\([^)]*\))?|css|keyframes|createGlobalStyle|injectGlobal)\s*`/g)) {
    ranges.push([m.index, until(m.index + m[0].length, '`')]);
  }
  return ranges;
}

// a line with `brand-check-ignore` in it is skipped; a comment line holding it also skips the next line.
function ignoredLines(text) {
  const out = new Set();
  text.split('\n').forEach((line, i) => {
    if (!/brand-check-ignore/.test(line)) return;
    out.add(i + 1);
    if (/^\s*(?:\/\/|\/\*|\{\s*\/\*|<!--|\*)/.test(line)) out.add(i + 2);
  });
  return out;
}

export function scan(text, ext, A, P = sets(), collect = null) {
  const src = stripComments(text, ext);
  const starts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') starts.push(i + 1);
  const hits = [], proposed = [];
  const values = [];
  const judge = (index, kind, value, ok, note = 'not in brand', key = value) => {
    if (collect) values.push({ line: lineAt(starts, index), kind, key, status: ok(A) ? 'brand' : ok(P) ? 'proposed' : 'off' });
    if (ok(A)) return;
    (ok(P) ? proposed : hits).push({ line: lineAt(starts, index), kind, value, note: ok(P) ? 'in ## proposed, not confirmed' : note });
  };

  // colors
  for (const m of src.matchAll(HEX)) {
    if (/[\w&.$-]/.test(src[m.index - 1] || '')) continue;
    if (STYLESHEET.has(ext)) {
      const nl = src.indexOf('\n', m.index);
      const rest = src.slice(m.index + m[0].length, nl < 0 ? undefined : nl);
      const stop = rest.search(/[;}]/), brace = rest.indexOf('{');
      if (brace >= 0 && (stop < 0 || brace < stop)) continue; // a selector, not a value
    } else if (!valuePosition(src, m.index)) continue;
    const norm = normHex(m[0]);
    judge(m.index, 'color', m[0], (S) => S.colors.has(norm), undefined, norm);
  }
  for (const m of src.matchAll(FUNC)) {
    if (/var\(|calc\(|\$\{/.test(m[2])) continue;
    const norm = normFunc(m[1], m[2]);
    judge(m.index, 'color', m[0].replace(/\s+/g, ' '), (S) => S.colors.has(norm), undefined, norm);
  }
  for (const c of wideColorsIn(src)) {
    // an all literal oklch() lab() and so on is just an off brand color; a mix or a var() inside is not resolved.
    if (c.literal) judge(c.index, 'color', c.raw, (S) => S.colorFuncs.has(c.norm), c.mix ? 'unchecked color function' : 'not in brand', c.norm);
  }
  const styled = STYLESHEET.has(ext) ? null : styleRanges(src);
  const named = (index, value) => {
    if (styled && !styled.some(([a, b]) => index >= a && index < b)) return;
    for (const w of value.matchAll(/(?<![\w#.$-])([a-z]+)(?![\w(-])/gi)) {
      const name = w[1].toLowerCase();
      if (NAMED[name]) judge(index, 'color', name, (S) => S.colors.has(NAMED[name]), undefined, NAMED[name]);
    }
  };
  for (const m of src.matchAll(/(?<![\w-])(?:color|background(?:-color)?|border(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?(?:-color)?|outline(?:-color)?|fill|stroke|text-decoration-color|caret-color|accent-color)\s*:\s*(?![\s'"`])([^;{}\n]+)/gi)) {
    named(m.index, m[1]);
  }
  for (const m of src.matchAll(/\b(?:color|background(?:Color)?|border\w*Color|border|outline(?:Color)?|fill|stroke)\s*[:=]\s*\{?\s*(['"`])([^'"`\n]*)\1/g)) {
    named(m.index, m[2]);
  }
  const twColor = new RegExp(`(?<![\\w-])(?:bg|text|border(?:-[xytrblse])?|ring(?:-offset)?|fill|stroke|outline|divide|shadow|from|via|to|decoration|accent|caret|placeholder)-(?:(${TW_PALETTE})-(50|[1-9]00|950)|(black|white))(?:\\/[\\w.\\[\\]%]+)?(?![\\w-])`, 'g');
  for (const m of src.matchAll(twColor)) {
    const name = m[1] || m[3], shade = m[2];
    judge(m.index, 'color', m[0], (S) => S.colorNames.has(name) || (shade && S.colorNames.has(`${name}-${shade}`)) || (!shade && (S.colors.has(NAMED[name]) || pureWide(S, name))), undefined, shade ? `${name}-${shade}` : NAMED[name]);
  }

  // fonts loaded by import, where the family name lives only in the import: next/font/google
  // (Playfair_Display is "Playfair Display"), @fontsource and @fontsource-variable packages,
  // and the family= of a google fonts link.
  for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]next\/font\/google['"]/g)) {
    for (const n of m[1].split(',')) {
      const name = n.trim().split(/\s+as\s+/)[0].replace(/_/g, ' ').trim();
      if (name) judge(m.index, 'font', name, (S) => fontOk(S, name), undefined, name.toLowerCase());
    }
  }
  for (const m of src.matchAll(/['"]@fontsource(?:-variable)?\/([\w-]+)/g)) {
    const name = m[1].replace(/-/g, ' ');
    judge(m.index, 'font', name, (S) => fontOk(S, name), undefined, name);
  }
  for (const m of src.matchAll(/fonts\.googleapis\.com\/css2?\?[^'"\s>]*/g)) {
    for (const f of m[0].matchAll(/family=([^:&'"]+)/g)) {
      const name = decodeURIComponent(f[1].replace(/\+/g, ' '));
      judge(m.index, 'font', name, (S) => fontOk(S, name), undefined, name.toLowerCase());
    }
  }

  // fonts
  // a stack that holds a brand family passes whole: the other names are its fallbacks
  const fonts = (index, list) => { for (const f of list) if (!/var\(/.test(f)) judge(index, 'font', f, (S) => fontOk(S, f) || stackOk(S, list), undefined, f.toLowerCase()); };
  for (const m of src.matchAll(/(?<![\w-])font-family\s*:\s*([^;{}\n]+)/gi)) fonts(m.index, familiesIn(m[1].replace(/!important/i, '')));
  for (const m of src.matchAll(/(?<![\w-])font\s*:\s*(?![\s'"`])([^;{}\n]+)/gi)) fonts(m.index, shorthandFamilies(m[1].replace(/!important/i, '')));
  for (const m of src.matchAll(/\bfont\s*:\s*(['"`])([^'"`\n]*)\1/g)) fonts(m.index, shorthandFamilies(m[2]));
  for (const m of src.matchAll(/\bfontFamily\s*:\s*(\[[^\]]*\]|(['"`])(?:(?!\2)[^\n])*\2)/g)) {
    for (const s of m[1].matchAll(/(['"`])((?:(?!\1)[^\n])*)\1/g)) fonts(m.index, familiesIn(s[2]));
  }
  for (const m of src.matchAll(/(?<![\w-])font-\[([^\]\s]+)\]/g)) {
    const v = m[1].replace(/_/g, ' ').replace(/^family-name:/, '');
    if (/^\d+$|var\(/.test(v)) continue;
    fonts(m.index, familiesIn(v));
  }

  // radii
  const radii = (index, value) => { for (const l of lengthsIn(dropTokenCalc(value))) judge(index, 'radius', l.raw, (S) => radiusOk(S, l.norm), undefined, px(l.norm)); };
  for (const m of src.matchAll(/(?<![\w-])border(?:-[a-z]+){0,2}-radius\s*:\s*([^;{}\n]+)/gi)) radii(m.index, m[1]);
  for (const m of src.matchAll(/\bborder\w*Radius\s*:\s*([^,}\n]+)/g)) {
    const v = m[1].trim();
    if (/^-?\d*\.?\d+$/.test(v)) { const px = `${parseFloat(v)}px`; judge(m.index, 'radius', px, (S) => radiusOk(S, px)); continue; }
    if (/^['"`]/.test(v)) radii(m.index, v);
  }
  for (const m of src.matchAll(/(?<![\w-])rounded(?:-(?:[trblse]|tl|tr|br|bl|ss|se|es|ee))?-\[([^\]\s]+)\]/g)) radii(m.index, m[1]);
  for (const m of src.matchAll(/(?<![\w-])rounded(?:-(?:[trblse]|tl|tr|br|bl|ss|se|es|ee))?-([\w]+)(?![\w-])/g)) {
    if (TW_SIZES.has(m[1])) judge(m.index, 'radius', m[0], (S) => S.radiusKeys.has(m[1]), undefined, `rounded-${m[1]}`);
  }

  // bare rounded, rounded-t and shadow, read only inside class strings and @apply so a comment
  // saying "rounded corners" is not a hit. they use the DEFAULT key.
  for (const m of src.matchAll(/(?:(?:\bclass(?:Name)?\s*=\s*\{?|\b(?:cn|clsx|cva|twMerge|classNames|tw)\s*\(\s*(?:[^()]*?,\s*)?)\s*(["'`])([^"'`]*)\1)|(?:@apply\s+([^;\n]+))/g)) {
    const body = m[2] ?? m[3] ?? '';
    const at = m.index + m[0].indexOf(body);
    for (const t of body.matchAll(/\S+/g)) {
      const cls = t[0].split(':').pop().replace(/^!/, '');
      if (/^rounded(?:-(?:[trblse]|tl|tr|br|bl|ss|se|es|ee))?$/.test(cls)) judge(at + t.index, 'radius', cls, (S) => S.radiusKeys.has('DEFAULT'), undefined, 'rounded');
      else if (cls === 'shadow') judge(at + t.index, 'shadow', cls, (S) => S.shadowKeys.has('DEFAULT'));
    }
  }

  // shadows
  for (const m of src.matchAll(/(?<![\w-])box-shadow\s*:\s*([^;{}\n]+)/gi)) judge(m.index, 'shadow', m[1].trim(), (S) => shadowOk(S, m[1]), undefined, normShadow(m[1]));
  for (const m of src.matchAll(/\bboxShadow\s*:\s*(['"`])([^'"`\n]*)\1/g)) judge(m.index, 'shadow', m[2], (S) => shadowOk(S, m[2]), undefined, normShadow(m[2]));
  for (const m of src.matchAll(/(?<![\w-])shadow-\[([^\]\s]+)\]/g)) {
    const v = m[1].replace(/_/g, ' ');
    if (!lengthsIn(v).length && !/^0\b/.test(v)) continue; // a color, checked as one
    judge(m.index, 'shadow', v, (S) => shadowOk(S, v), undefined, normShadow(v));
  }
  for (const m of src.matchAll(/(?<![\w-])shadow-([\w]+)(?![\w-])/g)) {
    if (TW_SHADOWS.has(m[1])) judge(m.index, 'shadow', m[0], (S) => S.shadowKeys.has(m[1]));
  }

  // font sizes and weights: counted in audit mode, never a hit.
  if (collect) {
    const note = (index, kind, key, ok) => values.push({ line: lineAt(starts, index), kind, key, status: ok(A) ? 'brand' : ok(P) ? 'proposed' : 'off' });
    const size = (index, v) => { for (const l of lengthsIn(dropTokenCalc(v))) { const k = px(l.norm); note(index, 'font-size', k, (S) => S.sizes.has(k)); } };
    for (const m of src.matchAll(/(?<![\w-])font-size\s*:\s*([^;{}\n]+)/gi)) size(m.index, m[1]);
    for (const m of src.matchAll(/\bfontSize\s*:\s*(['"`]?)([^,}\n'"`]+)\1/g)) {
      if (/^\d*\.?\d+$/.test(m[2].trim())) { const k = `${parseFloat(m[2])}px`; note(m.index, 'font-size', k, (S) => S.sizes.has(k)); } else size(m.index, m[2]);
    }
    for (const m of src.matchAll(/(?<![\w-])text-\[(\d*\.?\d+(?:px|rem))\]/g)) size(m.index, m[1]);
    for (const m of src.matchAll(/(?<![\w-])text-(xs|sm|base|lg|xl|[2-9]xl)(?![\w-])/g)) note(m.index, 'font-size', m[0], (S) => S.sizeKeys.has(m[0]));
    const KW = { normal: '400', bold: '700' };
    const weight = (index, w) => { const k = KW[w] || w; note(index, 'font-weight', k, (S) => S.weights.has(k)); };
    for (const m of src.matchAll(/(?<![\w-])font-weight\s*:\s*([1-9]00|normal|bold)\b/gi)) weight(m.index, m[1].toLowerCase());
    for (const m of src.matchAll(/\bfontWeight\s*:\s*['"`]?([1-9]00|normal|bold)\b/g)) weight(m.index, m[1]);
    // the font: shorthand, `500 15px/1.4 var(--font)`: the weight before the size, then the size.
    const shorthand = (index, v) => {
      const m = /^(?:(?:normal|italic|oblique|small-caps)\s+)*(?:([1-9]00|bold|normal)\s+)?(?:(?:normal|italic|small-caps)\s+)*(\d*\.?\d+(?:px|rem))\b/i.exec(v.trim());
      if (!m) return;
      if (m[1]) weight(index, m[1].toLowerCase());
      size(index, m[2]);
    };
    for (const m of src.matchAll(/(?<![\w-])font\s*:\s*(?![\s'"`])([^;{}\n]+)/gi)) shorthand(m.index, m[1]);
    for (const m of src.matchAll(/\bfont\s*:\s*(['"`])([^'"`\n]*)\1/g)) shorthand(m.index, m[2]);
    for (const m of src.matchAll(/(?<![\w-])font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)(?![\w-])/g)) weight(m.index, TW_WEIGHTS[m[1]]);
  }

  const ignored = ignoredLines(text);
  const keep = (h) => !ignored.has(h.line);
  const order = (a, b) => a.line - b.line;
  return { hits: hits.filter(keep).sort(order), proposed: proposed.filter(keep).sort(order), values: values.filter(keep) };
}

// a token file is trusted for app code, so when it changes it is checked itself: every color,
// radius, shadow and font it defines must be in brand.md's tables, ## allow or ## proposed.
// shadcn on tailwind v3 writes a color token as bare hsl channels: --primary: 222.2 47.4% 11.2%.
function hslChannels(value) {
  const m = /^\s*(-?[\d.]+(?:deg)?)\s+([\d.]+%)\s+([\d.]+%)(\s*\/\s*[\d.]+%?)?\s*$/.exec(value);
  if (!m) return [];
  const raw = `hsl(${value.trim()})`;
  return colorsIn(raw).map((c) => ({ ...c, raw }));
}

export function checkTokenFile(path, B, P) {
  const src = stripComments(readFileSync(path, 'utf8'), extname(path).toLowerCase());
  const starts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') starts.push(i + 1);
  const name = basename(path);
  const hits = [], proposed = [];
  const seen = new Set();
  const judge = (index, value, ok) => {
    const line = lineAt(starts, index);
    if (ok(B) || seen.has(`${line} ${value}`)) return;
    seen.add(`${line} ${value}`);
    if (ok(P)) proposed.push({ line, kind: 'token', value, note: `in ${name}, in ## proposed, not confirmed` });
    else hits.push({ line, kind: 'token', value, note: `in ${name} not in brand.md` });
  };
  const fontList = (index, list) => {
    for (const f of list) if (!/^[\d.#-]|var\(|\(/.test(f)) judge(index, f, (S) => fontOk(S, f) || stackOk(S, list));
  };
  for (const c of colorsIn(src)) judge(c.index, c.raw, (S) => S.colors.has(c.norm));
  for (const c of wideColorsIn(src)) if (c.literal) judge(c.index, c.raw, (S) => S.colorFuncs.has(c.norm));
  for (const m of src.matchAll(/(--[\w-]+|\$[\w-]+)\s*:\s*([^;{}\n]+)/g)) {
    const [prop, value] = [m[1].toLowerCase(), m[2]];
    for (const c of hslChannels(value)) judge(m.index, c.raw, (S) => S.colors.has(c.norm));
    if (/radius|rounded/.test(prop)) for (const l of lengthsIn(dropTokenCalc(value))) judge(m.index, l.raw, (S) => radiusOk(S, l.norm));
    if (/shadow/.test(prop) && !/var\(/.test(value)) judge(m.index, value.trim(), (S) => shadowOk(S, value));
    if (/font/.test(prop) && !/size|weight|height|leading|tracking|spacing/.test(prop)) fontList(m.index, familiesIn(value));
    const word = value.trim().toLowerCase();
    if (NAMED[word]) judge(m.index, word, (S) => S.colors.has(NAMED[word]));
  }
  for (const m of src.matchAll(/(?<![\w-])font-family\s*:\s*([^;{}\n]+)/gi)) fontList(m.index, familiesIn(m[1]));
  for (const m of src.matchAll(/(['"]?)(borderRadius|boxShadow|fontFamily)\1\s*:\s*\{/g)) {
    const open = m.index + m[0].length - 1;
    const obj = block(src, open);
    for (const s of obj.matchAll(/(['"`])([^'"`\n]*)\1/g)) {
      const at = open + s.index;
      if (m[2] === 'borderRadius') for (const l of lengthsIn(dropTokenCalc(s[2]))) judge(at, l.raw, (S) => radiusOk(S, l.norm));
      if (m[2] === 'boxShadow' && lengthsIn(s[2]).length) judge(at, s[2], (S) => shadowOk(S, s[2]));
      if (m[2] === 'fontFamily') fontList(at, familiesIn(s[2]));
    }
  }
  const order = (a, b) => a.line - b.line;
  return { hits: hits.sort(order), proposed: proposed.sort(order) };
}

// ---------- files

// root: the folder the walk started from. skip folders count only below it, so naming
// a skipped folder on purpose (brand-test/audit) still walks it.
export function wanted(path, tokenSet = new Set(), root = null, dirs = SKIP_DIRS) {
  const parts = (root ? relative(root, path) : path).split(/[\\/]/);
  if (parts.some((p) => dirs.has(p))) return false;
  const name = basename(path);
  if (!CODE.has(extname(name).toLowerCase())) return false;
  if (/\.min\./.test(name) || /^(package-lock|pnpm-lock|yarn|bun)\b|\.lock$/i.test(name)) return false;
  if (SKIP_NAMES.has(name) || /^looks\./i.test(name)) return false;
  return !tokenSet.has(resolve(path));
}

function walk(dir, out) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
}

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

function changedFiles(cwd, warn = () => {}) {
  const root = gitRoot(cwd);
  if (!root) throw new Error('not in a git repo, pass files instead');
  let base = process.env.BRAND_BASE || null;
  if (base) {
    try { git(['rev-parse', '--verify', '--quiet', `${base}^{commit}`], root); }
    catch { throw new Error(`BRAND_BASE=${base} is not a commit or branch in this repo`); }
  }
  let hasHead = true;
  try { git(['rev-parse', '--verify', '--quiet', 'HEAD'], root); } catch { hasHead = false; }
  if (!base && hasHead) {
    for (const ref of ['origin/HEAD', 'origin/main', 'origin/master', 'main', 'master']) {
      try { base = git(['merge-base', 'HEAD', ref], root).trim(); break; } catch {}
    }
    if (!base) warn('brand-check: no origin/HEAD, origin/main, main or master here, so only uncommitted changes are checked. set BRAND_BASE=<your base branch> to check the commits too');
  }
  let tracked = '';
  // -c core.quotePath=false keeps a path like app/café/page.tsx as it is instead of a quoted octal escape.
  tracked = hasHead
    ? git(['-c', 'core.quotePath=false', 'diff', '--name-only', base || 'HEAD'], root)
    : git(['-c', 'core.quotePath=false', 'diff', '--name-only', '--cached'], root); // no commits yet
  const untracked = git(['-c', 'core.quotePath=false', 'ls-files', '--others', '--exclude-standard'], root);
  const names = [...new Set((tracked + '\n' + untracked).split('\n').filter(Boolean))];
  return names.map((n) => join(root, n)).filter((p) => existsSync(p));
}

export function check(brandPath, args, { cwd = process.cwd(), warn = () => {} } = {}) {
  const { allowed, proposed: prop, tokenFiles, brandOnly } = loadBrand(brandPath, warn);
  const tokenSet = new Set([...tokenFiles, resolve(brandPath)]);
  const isToken = (p) => tokenFiles.includes(resolve(p));
  let files = [], tokens = [];
  if (args.length) {
    for (const a of args) {
      const p = resolve(cwd, a);
      if (!existsSync(p)) { warn(`brand-check: ${a} not found`); continue; }
      if (statSync(p).isDirectory()) { const all = []; walk(p, all); files.push(...all.filter((f) => wanted(f, tokenSet, p))); }
      else if (isToken(p)) tokens.push(p);
      else if (!tokenSet.has(p)) files.push(p);
    }
  } else {
    // run from a subfolder (one app in a monorepo), only the files under it are checked.
    const here = realpathSync(cwd);
    const changed = changedFiles(cwd, warn).filter((f) => !relative(here, realpathSync(f)).startsWith('..'));
    const root = gitRoot(cwd);
    files = changed.filter((f) => wanted(f, tokenSet, root, GIT_SKIP_DIRS));
    const left = changed.filter((f) => !files.includes(f) && !isToken(f) && CODE.has(extname(f).toLowerCase()) && !tokenSet.has(resolve(f)));
    for (const f of left) warn(`brand-check: skipped ${relative(cwd, f) || f} (the workflow's own tools, a looks.* file, a lock or .min. file, or node_modules)`);
    tokens = changed.filter(isToken);
  }
  const hits = [], proposed = [];
  for (const f of tokens) {
    const r = checkTokenFile(f, brandOnly, prop);
    const file = relative(cwd, f) || f;
    for (const h of r.hits) hits.push({ file, ...h });
    for (const h of r.proposed) proposed.push({ file, ...h });
  }
  for (const f of files) {
    const r = scan(readFileSync(f, 'utf8'), extname(f).toLowerCase(), allowed, prop);
    const file = relative(cwd, f) || f;
    for (const h of r.hits) hits.push({ file, ...h });
    for (const h of r.proposed) proposed.push({ file, ...h });
  }
  if (!files.length && !tokens.length) warn('brand-check: 0 files checked. nothing changed, or nothing matched the app code filter (web and react native source only)');
  return { hits, proposed, checked: files.length + tokens.length };
}

// ---------- audit

const AUDIT_KINDS = ['color', 'font', 'radius', 'shadow', 'font-size', 'font-weight'];

export function audit(brandPath, args, { cwd = process.cwd(), warn = () => {} } = {}) {
  let A = sets(), P = sets(), tokenSet = new Set();
  if (brandPath) {
    const b = loadBrand(brandPath, warn);
    [A, P] = [b.allowed, b.proposed];
    tokenSet = new Set([...b.tokenFiles, resolve(brandPath)]);
  }
  const files = [];
  for (const a of args) {
    const p = resolve(cwd, a);
    if (!existsSync(p)) { warn(`brand-check: ${a} not found`); continue; }
    if (statSync(p).isDirectory()) { const all = []; walk(p, all); files.push(...all.filter((f) => wanted(f, tokenSet, p))); }
    else if (!tokenSet.has(p)) files.push(p);
  }
  const by = new Map(AUDIT_KINDS.map((k) => [k, new Map()]));
  for (const f of files) {
    const file = relative(cwd, f) || f;
    for (const v of scan(readFileSync(f, 'utf8'), extname(f).toLowerCase(), A, P, true).values) {
      const m = by.get(v.kind);
      const e = m.get(v.key) || { value: v.key, count: 0, status: v.status, examples: [] };
      e.count++;
      if (e.examples.length < 3) e.examples.push(`${file}:${v.line}`);
      m.set(v.key, e);
    }
  }
  const properties = {};
  for (const [kind, m] of by) {
    const values = [...m.values()].sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
    const uses = values.reduce((n, v) => n + v.count, 0);
    const offUses = values.filter((v) => v.status !== 'brand').reduce((n, v) => n + v.count, 0);
    properties[kind] = {
      distinct: values.length, uses,
      ...(brandPath ? { inBrand: values.filter((v) => v.status === 'brand').length, offShare: uses ? Math.round((offUses / uses) * 100) : 0 } : {}),
      values: values.map((v) => (brandPath ? v : { value: v.value, count: v.count, examples: v.examples })),
    };
  }
  return { brand: brandPath || null, checked: files.length, properties };
}

const auditLine = (kind, p, withBrand) => `${kind}: ${p.distinct} distinct, ${withBrand ? `${p.inBrand} in brand, ${p.offShare}% of uses off brand` : `${p.uses} uses`}`;

function auditReport(r) {
  console.log(`brand-check audit: ${r.checked} files${r.brand ? ` against ${r.brand}` : ''}\n`);
  for (const [kind, p] of Object.entries(r.properties)) {
    console.log(`== ${auditLine(kind, p, r.brand)}`);
    const w = Math.min(48, Math.max(8, ...p.values.map((v) => v.value.length)));
    for (const v of p.values) {
      const value = v.value.length > w ? v.value.slice(0, w - 1) + '~' : v.value.padEnd(w);
      console.log(`  ${value}  ${String(v.count).padStart(4)}${r.brand ? `  ${v.status.padEnd(8)}` : ''}  ${v.examples.join(', ')}`);
    }
    console.log('');
  }
  for (const [kind, p] of Object.entries(r.properties)) console.log(auditLine(kind, p, r.brand));
}

function report({ hits, proposed, checked }) {
  for (const h of hits) console.log(`${h.file}:${h.line}  ${h.kind} ${h.value} ${h.note}`);
  for (const h of proposed) console.log(`${h.file}:${h.line}  proposed ${h.kind} ${h.value} ${h.note}`);
  const files = new Set(hits.map((h) => h.file)).size;
  console.log(`brand-check: ${hits.length} hits in ${files} files (${checked} checked)${proposed.length ? `, ${proposed.length} proposed` : ''}`);
}

// ---------- self test

function selfTest() {
  const dir = join(here, 'brand-test');
  if (!existsSync(join(dir, 'brand.md'))) {
    console.error('the self-test needs a clone of the workflow repo (tools/brand-test/ is not here). to check your app: node brand-check.mjs <brand.md> [files]');
    return 2;
  }
  const run = (names, brandFile = 'brand.md') => check(join(dir, brandFile), names.map((n) => join(dir, n)), { warn: console.error });
  let failed = false;
  const line = (ok, what) => { console.log(`${ok ? 'pass' : 'FAIL'}  ${what}`); if (!ok) failed = true; };
  const results = [];
  const planted = [
    ['planted.css', 'planted', [['color', '#3b82f6'], ['font', 'Comic Sans MS'], ['radius', '7px']]],
    ['planted-radius.css', 'a spacing, type or token spacing px is not a radius:', [['radius', '24px'], ['radius', '16px'], ['radius', '20px'], ['radius', 'rounded-xl']]],
    ['planted-more.css', 'named color, font shorthand, unchecked functions, shadow:', [
      ['color', 'red'], ['font', 'Papyrus'], ['color', 'oklch(0.7 0.1 200)'], ['color', 'color-mix(in srgb, var(--ink) 50%, #ff00aa)'],
      ['color', '#ff00aa'], ['shadow', '0 10px 30px rgba(0, 0, 0, 0.08)']]],
    ['planted-tw.tsx', 'tailwind, js values, value position hex:', [
      ['color', 'bg-blue-500'], ['color', 'text-red-600/50'], ['color', 'border-zinc-200'], ['font', 'Comic Sans MS'], ['radius', 'rounded-xl'],
      ['shadow', 'shadow-lg'], ['shadow', '0 8px 24px rgba(0,0,0,0.08)'], ['color', 'red'], ['font', 'Papyrus'],
      ['color', 'oklch(0.7 0.1 200)'], ['color', '#ff00aa'], ['shadow', '0 10px 30px rgba(0, 0, 0, 0.08)']]],
    ['planted-font.tsx', 'fonts loaded by import (next/font, @fontsource, a google fonts link):', [['font', 'Playfair Display'], ['font', 'lobster'], ['font', 'Pacifico']]],
    ['planted.astro', 'new extensions are scanned, only the value hex counts:', [['color', '#ff00aa']]],
    ['planted-context.tsx', 'named colors in style contexts, a var() fallback and a plain calc offset still count:', [
      ['color', 'red'], ['color', 'tomato'], ['color', 'navy'], ['color', 'orange'], ['color', 'purple'], ['radius', '3px'], ['color', '#3b82f6']]],
    ['stock.tsx', 'stock tailwind classes hit when brand.md does not name them (brand-stock-none.md):', [
      ['radius', 'rounded-lg'], ['shadow', 'shadow-sm'], ['color', 'bg-blue-600'], ['color', 'text-white'], ['radius', 'rounded-sm'], ['color', 'bg-emerald-700/90'], ['radius', 'rounded'], ['shadow', 'shadow'], ['radius', 'rounded-t'], ['radius', 'rounded'], ['shadow', 'shadow']],
      'brand-stock-none.md'],
  ];
  for (const [file, label, expect, brandFile] of planted) {
    const r = run([file], brandFile);
    console.log(`== ${file}${brandFile ? ` against ${brandFile}` : ''}`); report(r); console.log('');
    const left = [...r.hits];
    let caught = 0;
    for (const [k, v] of expect) {
      const i = left.findIndex((h) => h.kind === k && h.value === v);
      if (i >= 0) { left.splice(i, 1); caught++; }
    }
    const extra = left.length ? `, plus ${left.length} unexpected` : '';
    results.push(() => line(caught === expect.length && left.length === 0, `${label} ${label === 'planted' ? '' : file + ' '}caught ${caught}/${expect.length}${extra}`));
  }

  const prop = run(['proposed.css']);
  console.log('== proposed.css'); report(prop); console.log('');
  results.push(() => line(prop.hits.length === 0 && prop.proposed.length === 2,
    `proposed values are reported, not hits: ${prop.proposed.length}/2 proposed, ${prop.hits.length} hits`));

  const exts = ['.astro', '.mdx', '.less', '.sass', '.mjs', '.cjs'];
  const extOk = exts.filter((e) => wanted(`src/a${e}`)).length;
  results.push(() => line(extOk === exts.length && !wanted('src/a.svg') && !wanted('node_modules/x/a.css'),
    `scanned extensions ${extOk}/${exts.length}, svg and node_modules still skipped`));
  const named = ['src/CodeBlock.tsx', 'src/Clock.tsx', 'src/blocks.css'];
  const namedOk = named.filter((f) => wanted(f)).length;
  const underBuild = wanted('/home/me/build/app/src/a.css', new Set(), '/home/me/build/app');
  const routes = ['/r/app/build/page.tsx', '/r/app/vendor/orders/page.tsx'].filter((f) => wanted(f, new Set(), '/r', GIT_SKIP_DIRS)).length;
  results.push(() => line(namedOk === named.length && underBuild && !wanted('/home/me/build/app/dist/a.css', new Set(), '/home/me/build/app') && routes === 2,
    `names holding "lock" checked ${namedOk}/${named.length}, a repo under a build folder still checked, its own dist skipped, git mode checks route folders named build and vendor ${routes}/2`));
  const skipped = ['tools/brand-check.mjs', 'tools/probe-test.mjs', 'tools/responsive-probe.js', 'tools/brand-test/a.css', 'tools/probe-test/clean.html', 'css/looks.css'];
  const skipOk = skipped.filter((f) => !wanted(f)).length;
  results.push(() => line(skipOk === skipped.length && wanted('css/app.css'),
    `own tools and the looks file are skipped in folder and git mode: ${skipOk}/${skipped.length}, app css still checked`));

  const cleanFiles = ['clean.css', 'clean.tsx'];
  const clean = run(cleanFiles);
  console.log('== clean.css, clean.tsx'); report(clean); console.log('');
  const cleanCount = cleanFiles.filter((n) => !clean.hits.some((h) => h.file.endsWith(n)) && !clean.proposed.some((h) => h.file.endsWith(n))).length;
  results.push(() => line(cleanCount === cleanFiles.length && clean.checked === cleanFiles.length, `clean files clean ${cleanCount}/${cleanFiles.length}`));

  const stock = run(['stock.tsx'], 'brand-stock.md');
  console.log('== stock.tsx against brand-stock.md'); report(stock); console.log('');
  results.push(() => line(stock.hits.length === 0 && stock.checked === 1,
    `stock tailwind classes pass when the token column or ## allow names them: ${stock.hits.length} hits`));

  // token files named on the command line are checked against brand.md alone.
  const tokPlanted = run(['tokens-planted.js'], 'brand-tokens.md');
  console.log('== tokens-planted.js against brand-tokens.md'); report(tokPlanted); console.log('');
  const tokHsl = run(['tokens-hsl.css'], 'brand-tokens.md');
  console.log('== tokens-hsl.css against brand-tokens.md'); report(tokHsl); console.log('');
  results.push(() => line(tokHsl.hits.length === 1 && tokHsl.hits[0].value === 'hsl(330 90% 55%)', `bare hsl channel tokens (shadcn on tailwind v3) are read: tokens-hsl.css caught ${tokHsl.hits.length}/1`));
  const tokClean = run(['tokens-clean.css'], 'brand-tokens.md');
  console.log('== tokens-clean.css against brand-tokens.md'); report(tokClean); console.log('');
  const newValue = tokPlanted.hits.filter((h) => h.kind === 'token' && h.value === '#abcdef').length;
  results.push(() => line(newValue === 1 && tokPlanted.hits.length === 1, `a changed token file is checked against brand.md: tokens-planted.js caught ${newValue}/1${tokPlanted.hits.length > 1 ? `, plus ${tokPlanted.hits.length - 1} unexpected` : ''}`));
  results.push(() => line(tokClean.hits.length === 0 && tokClean.proposed.length === 1, `a token file inside brand.md passes: tokens-clean.css ${tokClean.hits.length} hits, ${tokClean.proposed.length}/1 proposed`));

  const warns = [];
  check(join(dir, 'brand-bare.md'), [join(dir, 'clean.css')], { warn: (w) => warns.push(w) });
  const warned = ['status:', 'tokens:'].filter((k) => warns.some((w) => w.includes(`no ${k} line`))).length;
  const quiet = [];
  check(join(dir, 'brand.md'), [join(dir, 'clean.css')], { warn: (w) => quiet.push(w) });
  results.push(() => line(warned === 2 && quiet.length === 0, `brand.md without status: or tokens: warns ${warned}/2, a complete one warns ${quiet.length}`));

  // audit: distinct values per property on the audit/ folder.
  const au = audit(join(dir, 'brand.md'), [join(dir, 'audit')]);
  const want = { color: 4, font: 3, radius: 3, shadow: 2, 'font-size': 4, 'font-weight': 4 };
  const got = Object.entries(want).filter(([k, n]) => au.properties[k].distinct === n).length;
  const shares = au.properties.radius.inBrand === 2 && au.properties.radius.offShare === 40;
  console.log('== audit of audit/ against brand.md');
  for (const [k, p] of Object.entries(au.properties)) console.log(auditLine(k, p, true));
  console.log('');
  results.push(() => line(got === Object.keys(want).length && shares && au.checked === 2,
    `audit counts distinct values ${got}/${Object.keys(want).length} properties, radius 2 in brand and 40% off`));

  for (const r of results) r();
  return failed ? 1 : 0;
}

// ---------- cli

const argv = process.argv.slice(2);
if (argv.includes('--self-test')) process.exit(selfTest());
const json = argv.includes('--json');
if (argv.includes('--audit')) {
  const pos = argv.filter((a) => a !== '--json' && a !== '--audit');
  const brandArg = pos[0] && /\.md$/i.test(pos[0]) && existsSync(pos[0]) && statSync(pos[0]).isFile() ? pos.shift() : null;
  if (!pos.length) { console.error('usage: node tools/brand-check.mjs --audit [brand.md] <folders or files...>'); process.exit(2); }
  const r = audit(brandArg, pos, { warn: console.error });
  if (json) console.log(JSON.stringify(r, null, 2)); else auditReport(r);
  process.exit(0);
}
const [brand, ...rest] = argv.filter((a) => a !== '--json');
if (!brand || brand === '-h' || brand === '--help') {
  console.error('usage: node tools/brand-check.mjs <brand.md> [--json] [files or folders...]\n       node tools/brand-check.mjs --audit [brand.md] [--json] <folders or files...>\n       node tools/brand-check.mjs --self-test');
  process.exit(2);
}
if (!existsSync(brand)) { console.error(`brand-check: ${brand} not found`); process.exit(2); }
const missing = rest.filter((a) => !existsSync(a));
if (missing.length) { for (const a of missing) console.error(`brand-check: ${a} not found`); process.exit(2); }
let result;
try { result = check(brand, rest, { warn: console.error }); }
catch (e) { console.error(`brand-check: ${e.message}`); process.exit(2); }
if (json) console.log(JSON.stringify(result, null, 2));
else report(result);
process.exit(result.hits.length ? 1 : 0);
