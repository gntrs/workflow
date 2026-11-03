#!/usr/bin/env python3
"""vault link check: broken wikilinks, orphans, duplicate basenames, dataless files.
usage: python3 -I linkcheck.py [vault] [-v] [--extra <dir>...]. the vault defaults to $VAULT, else ~/vault.
read only. exit 1 if anything is broken."""
import os, re, sys, collections

first = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("-") else os.environ.get("VAULT", "~/vault")
root = os.path.abspath(os.path.expanduser(first))
if not os.path.isdir(root):
    sys.exit(f"no vault at {root}. set VAULT or pass the path.")
extra = sys.argv[sys.argv.index("--extra") + 1:] if "--extra" in sys.argv else []
LINK = re.compile(r"\[\[([^\]|#^]+)(?:[#^][^\]|]*)?(?:\|[^\]]*)?\]\]|\]\((?!https?:)([^)\s]+\.md)\)")
FENCE = re.compile(r"```.*?```|`[^`\n]*`", re.S)

notes, names, dataless = {}, collections.defaultdict(list), []
for base in [root] + extra:
    for d, dirs, files in os.walk(base):
        dirs[:] = [x for x in dirs if not x.startswith(".")]
        for f in files:
            p = os.path.join(d, f)
            if getattr(os.stat(p), "st_flags", 0) & 0x40000000:  # SF_DATALESS, macOS cloud-evicted file
                dataless.append(p)
                continue
            stem = os.path.splitext(f)[0]
            names[stem.lower()].append(p)
            names[f.lower()].append(p)
            if f.endswith(".md"):
                notes[p] = stem

inbound = collections.Counter()
broken = []
for p, stem in notes.items():
    text = FENCE.sub("", open(p, encoding="utf-8", errors="replace").read())
    for m in LINK.finditer(text):
        t = (m.group(1) or m.group(2)).strip()
        key = os.path.basename(t).lower()
        key = key[:-3] if key.endswith(".md") else key
        if key in names:
            for q in set(names[key]):
                inbound[q] += 1
        else:
            broken.append((os.path.relpath(p, root), t))

dupes = {k: v for k, v in names.items() if not k.endswith(".md") and len(set(v)) > 1
         and all(x.endswith(".md") for x in v)}
orphans = [os.path.relpath(p, root) for p in notes if inbound[p] == 0
           and os.path.basename(p) not in ("HOME.md", "MEMORY.md")]

print(f"notes {len(notes)}  broken {len(broken)}  orphans {len(orphans)}  dupes {len(dupes)}  dataless {len(dataless)}")
for s, t in broken: print(f"  broken  {s} -> [[{t}]]")
for k, v in dupes.items(): print(f"  dupe    {k}: " + ", ".join(os.path.relpath(x, root) for x in v))
if "-v" in sys.argv:
    for o in sorted(orphans): print(f"  orphan  {o}")
for p in dataless: print(f"  dataless {p}")
sys.exit(1 if broken or dupes or dataless else 0)
