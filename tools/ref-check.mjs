// the reference gate. proves a brand is built from real refs and its kit from real code or refs.
//
//   node tools/ref-check.mjs <brand.md> [--ship]
//     reads brand.md only, no browser and no app code:
//     status:        `default, not chosen` warns, and fails with --ship.
//     ## sources     | surface | ref | how | evidence | date | values |
//                    how is read, user pic, user file or unread. no real row fails: no reference
//                    behind the brand. a row that is not unread needs evidence that exists (a path
//                    absolute, from the folder you run it in, or from brand.md's folder). an unread
//                    row warns, a surface whose every row is unread fails.
//     ## components  | element | use | where | from | recipe |
//                    from is a file that exists, or a ## sources surface or ref. empty or neither
//                    fails. no rows at all only warns (a new product).
//     rows whose every cell is an unfilled `<...>` placeholder are skipped.
//     prints `ref-check: <fail or warn> <what>  <brand.md:line>` per finding, then a summary.
//     exits 0 when clean (warnings allowed), 1 on any fail, 2 on a usage error or a missing file.
//
//   node tools/ref-check.mjs --self-test
//     (in the workflow repo only) runs the fixtures in tools/ref-test/: each must report exactly
//     its planted fails and warns, and the cli must exit 0, 1 and 2 where it should.

import { existsSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { homedir, tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const USAGE = 'usage: node ref-check.mjs <brand.md> [--ship]\n       node ref-check.mjs --self-test';
const SOURCES = ['surface', 'ref', 'how', 'evidence', 'date', 'values'];
const COMPONENTS = ['element', 'use', 'where', 'from', 'recipe'];
const HOWS = new Set(['read', 'user pic', 'user file', 'unread']);

const placeholder = (c) => c === '' || /^<.*>$/.test(c);
const norm = (s) => s.toLowerCase().replace(/\/+$/, '').trim();

// the tables under one ## heading, rows keyed by header name, with their line numbers.
function tables(lines, heading) {
  const rows = [], headers = [];
  let inside = false, header = null;
  lines.forEach((line, i) => {
    if (/^##\s/.test(line)) { inside = new RegExp(`^##\\s+${heading}\\b`, 'i').test(line); header = null; return; }
    if (!inside) return;
    if (/^###\s/.test(line)) { header = null; return; }
    const t = line.trim();
    if (!t.startsWith('|')) return;
    const cells = t.replace(/^\||\|$/g, '').split('|').map((c) => c.replace(/`/g, '').trim());
    if (cells.every((c) => /^:?-*:?$/.test(c))) return;
    if (!header) { header = cells.map((c) => c.toLowerCase()); headers.push({ header, line: i + 1 }); return; }
    if (cells.every(placeholder)) return;
    const row = { line: i + 1 };
    header.forEach((h, k) => { row[h] = cells[k] || ''; });
    rows.push(row);
  });
  return { rows, headers, found: lines.some((l) => new RegExp(`^##\\s+${heading}\\b`, 'i').test(l)) };
}

export function check(brandPath, { ship = false, cwd = process.cwd() } = {}) {
  const lines = readFileSync(brandPath, 'utf8').split(/\r?\n/);
  const out = [];
  const at = (line) => `${brandPath}:${line}`;
  const fail = (what, line) => out.push({ level: 'fail', what, where: at(line) });
  const warn = (what, line) => out.push({ level: 'warn', what, where: at(line) });
  const exists = (p) => {
    const q = p.replace(/^~(?=\/)/, homedir());
    return isAbsolute(q) ? existsSync(q) : existsSync(resolve(cwd, q)) || existsSync(resolve(dirname(brandPath), q));
  };

  const firstSection = lines.findIndex((l) => /^##\s/.test(l));
  lines.slice(0, firstSection < 0 ? lines.length : firstSection).forEach((l, i) => {
    const m = /^\s*status\s*:\s*(.*)$/i.exec(l);
    if (m && /^default,\s*not chosen/i.test(m[1].trim())) {
      (ship ? fail : warn)(`status is default, not chosen: nobody picked this brand${ship ? '' : ' (fails with --ship)'}`, i + 1);
    }
  });

  const src = tables(lines, 'sources');
  for (const h of src.headers) {
    const lacks = SOURCES.filter((c) => !h.header.includes(c));
    if (lacks.length) fail(`## sources header lacks ${lacks.join(', ')}: use | ${SOURCES.join(' | ')} |`, h.line);
  }
  const good = src.headers.length && src.headers.every((h) => SOURCES.every((c) => h.header.includes(c)));
  const sources = good ? src.rows : [];
  if (!sources.length) fail('no real reference behind this brand: ## sources has no rows. read one with ref-read.mjs', src.found ? lines.findIndex((l) => /^##\s+sources\b/i.test(l)) + 1 : 1);
  const bySurface = new Map();
  for (const r of sources) {
    const how = r.how.toLowerCase();
    const key = norm(r.surface);
    if (!bySurface.has(key)) bySurface.set(key, { name: r.surface, line: r.line, rows: 0, unread: 0 });
    bySurface.get(key).rows++;
    if (!HOWS.has(how)) { fail(`how "${r.how}" is not read, user pic, user file or unread (surface ${r.surface || 'empty'})`, r.line); continue; }
    if (how === 'unread') { bySurface.get(key).unread++; warn(`unread ref ${r.ref || '(no ref)'} for ${r.surface || 'no surface'}: ask for screenshots or a logged in storage state`, r.line); continue; }
    const paths = r.evidence.split(/,\s*/).filter(Boolean);
    if (!paths.length || placeholder(r.evidence)) fail(`no evidence for ${r.ref || 'a ref'} (surface ${r.surface}): ref-read.mjs saves it`, r.line);
    else for (const p of paths) if (!exists(p)) fail(`evidence ${p} not found (surface ${r.surface})`, r.line);
  }
  for (const s of bySurface.values()) if (s.unread === s.rows) fail(`surface ${s.name || '(empty)'} has only unread refs: no real reference behind it`, s.line);

  const comp = tables(lines, 'components');
  for (const h of comp.headers) if (!h.header.includes('from')) fail(`## components has no from column: use | ${COMPONENTS.join(' | ')} |`, h.line);
  const known = new Set(sources.flatMap((r) => [norm(r.surface), norm(r.ref)]).filter(Boolean));
  if (!comp.rows.length) warn('no ## components rows: fine for a new product, each element gets its row as the first screen ships it', comp.found ? lines.findIndex((l) => /^##\s+components\b/i.test(l)) + 1 : 1);
  for (const r of comp.rows) {
    const from = (r.from || '').trim();
    const name = r.element || 'an element';
    if (placeholder(from)) { fail(`${name} has no from: no ref or code behind this element`, r.line); continue; }
    for (const p of from.split(/,\s*/)) {
      if (!exists(p) && !known.has(norm(p))) fail(`${name} from "${p}" is not a file, a ## sources surface or a ref`, r.line);
    }
  }
  return { findings: out, sources: sources.length, components: comp.rows.length };
}

function report({ findings, sources, components }) {
  for (const f of findings) console.log(`ref-check: ${f.level} ${f.what}  ${f.where}`);
  const fails = findings.filter((f) => f.level === 'fail').length;
  console.log(`ref-check: ${fails} fail, ${findings.length - fails} warn (${sources} sources, ${components} components)${fails ? '' : ', clean'}`);
  return fails ? 1 : 0;
}

function selfTest() {
  const dir = join(here, 'ref-test');
  if (!existsSync(join(dir, 'brand-clean.md'))) {
    console.error('the self-test needs a clone of the workflow repo (tools/ref-test/ is not here). to check a brand: node ref-check.mjs <brand.md>');
    return 2;
  }
  const repo = dirname(here);
  let failed = false;
  const line = (ok, what) => { console.log(`${ok ? 'pass' : 'FAIL'}  ${what}`); if (!ok) failed = true; };
  const cases = [
    ['brand-clean.md', {}, 0, 0, null, 'real evidence by path from brand.md and from the run folder, from by file, surface and ref'],
    ['brand-empty-sources.md', {}, 1, 0, /no real reference/, 'only placeholder sources rows'],
    ['brand-missing-evidence.md', {}, 3, 0, /evidence .* not found/, 'missing evidence path, empty evidence, an unknown how'],
    ['brand-unread.md', {}, 1, 3, /only unread refs/, 'unread rows warn, a surface with only unread fails'],
    ['brand-no-from.md', {}, 2, 0, /no ref or code behind/, 'a kit row with no from, and one from nothing real'],
    ['brand-default.md', {}, 0, 2, /default, not chosen/, 'default, not chosen and no kit warn'],
    ['brand-default.md', { ship: true }, 1, 1, /default, not chosen/, 'default, not chosen fails with --ship'],
  ];
  for (const [file, opts, wantFail, wantWarn, match, label] of cases) {
    const r = check(relative(process.cwd(), join(dir, file)) || join(dir, file), { ...opts, cwd: repo });
    console.log(`== ${file}${opts.ship ? ' --ship' : ''}`); report(r); console.log('');
    const fails = r.findings.filter((f) => f.level === 'fail');
    const warns = r.findings.length - fails.length;
    const hit = !match || r.findings.some((f) => match.test(f.what));
    line(fails.length === wantFail && warns === wantWarn && hit, `${file}${opts.ship ? ' --ship' : ''}: ${label}, ${fails.length}/${wantFail} fail, ${warns}/${wantWarn} warn`);
  }
  const tmp = mkdtempSync(join(tmpdir(), 'ref-check-'));
  const abs = join(tmp, 'brand.md');
  const shot = join(dir, 'refs', 'file-shot-2026-11-04', 'shot.png');
  writeFileSync(abs, `status: confirmed\n\n## sources\n| surface | ref | how | evidence | date | values |\n|---|---|---|---|---|---|\n| list | shot.png | user pic | ${shot} | 2026-11-04 | inferred, read by eye |\n\n## components\n| element | use | where | from | recipe |\n|---|---|---|---|---|\n| row | li | list.tsx | list | 48px |\n`);
  const a = check(abs, { cwd: tmp });
  line(a.findings.length === 0, `an absolute evidence path is found: ${a.findings.length} findings`);
  const cli = (args, cwd = repo) => spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...args], { encoding: 'utf8', cwd }).status;
  const codes = [cli([join(dir, 'brand-clean.md')]), cli([join(dir, 'brand-missing-evidence.md')]), cli([join(dir, 'brand-default.md')]),
    cli([join(dir, 'brand-default.md'), '--ship']), cli([join(dir, 'nope.md')]), cli([]), cli(['--wat', join(dir, 'brand-clean.md')])];
  line(codes.join(' ') === '0 1 0 1 2 2 2', `cli exits clean 0, fail 1, warn only 0, --ship 1, missing file 2, no args 2, bad flag 2: ${codes.join(' ')}`);
  rmSync(tmp, { recursive: true, force: true });
  return failed ? 1 : 0;
}

// ---------- cli

const argv = process.argv.slice(2);
if (argv[0] === '--self-test') process.exit(selfTest());
if (argv.includes('-h') || argv.includes('--help')) { console.log(USAGE); process.exit(0); }
const bad = argv.filter((a) => a.startsWith('-') && a !== '--ship');
const pos = argv.filter((a) => !a.startsWith('-'));
if (bad.length || pos.length !== 1) { console.error(bad.length ? `unknown flag ${bad[0]}\n${USAGE}` : USAGE); process.exit(2); }
if (!existsSync(pos[0])) { console.error(`ref-check: ${pos[0]} not found`); process.exit(2); }
process.exit(report(check(pos[0], { ship: argv.includes('--ship') })));
