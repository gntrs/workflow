#!/usr/bin/env node
// merges a fragment into a claude code settings.json without losing anything already there.
//   node merge-settings.mjs <settings.json> <fragment.json> [--check] [--set KEY=VALUE]
// permissions.allow, .ask and .deny are unioned. a hook entry is added only when none of its commands is already
// registered for that event. every other key in the settings file is left exactly as it was.
// --remove takes the fragment's hook entries back out (by command) and leaves permissions alone.
// --check writes nothing and prints "same" or "changed". exit 3: the settings file is not valid json, nothing written.
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const paths = [];
let check = false;
let remove = false;
let set = null;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--check') check = true;
  else if (args[i] === '--remove') remove = true;
  else if (args[i] === '--set') set = args[++i];
  else paths.push(args[i]);
}
const [settingsPath, fragmentPath] = paths;
if (!settingsPath || !fragmentPath) { console.error('usage: merge-settings.mjs <settings.json> <fragment.json> [--check] [--set KEY=VALUE]'); process.exit(2); }

let fragmentText = readFileSync(fragmentPath, 'utf8');
if (set) {
  const eq = set.indexOf('=');
  fragmentText = fragmentText.split(set.slice(0, eq)).join(JSON.stringify(set.slice(eq + 1)).slice(1, -1));
}
const fragment = JSON.parse(fragmentText);

let settings = {};
if (existsSync(settingsPath)) {
  const raw = readFileSync(settingsPath, 'utf8');
  if (raw.trim()) {
    try { settings = JSON.parse(raw); } catch (e) { console.log(`${settingsPath} is not valid json (${e.message}). left untouched`); process.exit(3); }
    if (settings === null || typeof settings !== 'object' || Array.isArray(settings)) { console.log(`${settingsPath} is not a json object. left untouched`); process.exit(3); }
  }
}
const before = JSON.stringify(settings);
const list = (v) => (Array.isArray(v) ? v : []);
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

if (remove) {
  for (const [event, entries] of Object.entries(obj(fragment.hooks))) {
    if (!Array.isArray(settings.hooks?.[event])) continue;
    const gone = new Set(list(entries).flatMap((e) => list(e.hooks).map((h) => h.command)));
    settings.hooks[event] = settings.hooks[event]
      .map((e) => (Array.isArray(e?.hooks) ? { ...e, hooks: e.hooks.filter((h) => !gone.has(h?.command)) } : e))
      .filter((e) => !Array.isArray(e?.hooks) || e.hooks.length);
    if (!settings.hooks[event].length) delete settings.hooks[event];
  }
  if (settings.hooks && !Object.keys(settings.hooks).length) delete settings.hooks;
} else {
  for (const kind of ['allow', 'ask', 'deny']) {
    const add = list(fragment.permissions?.[kind]);
    if (!add.length) continue;
    settings.permissions = obj(settings.permissions);
    const have = list(settings.permissions[kind]);
    settings.permissions[kind] = [...have, ...add.filter((r) => !have.includes(r))];
  }
  for (const [event, entries] of Object.entries(obj(fragment.hooks))) {
    settings.hooks = obj(settings.hooks);
    const have = list(settings.hooks[event]);
    const commands = new Set(have.flatMap((e) => list(e?.hooks).map((h) => h?.command)));
    const add = list(entries).filter((e) => !list(e.hooks).some((h) => commands.has(h.command)));
    if (add.length) settings.hooks[event] = [...have, ...add];
  }
  if (settings.hooks && !Object.keys(settings.hooks).length) delete settings.hooks;
}

const changed = JSON.stringify(settings) !== before;
if (check) { console.log(changed ? 'changed' : 'same'); process.exit(0); }
if (changed) {
  mkdirSync(dirname(settingsPath), { recursive: true });
  const tmp = `${settingsPath}.tmp-${process.pid}`;
  writeFileSync(tmp, JSON.stringify(settings, null, 2) + '\n');
  renameSync(tmp, settingsPath);
}
console.log(changed ? 'changed' : 'same');
