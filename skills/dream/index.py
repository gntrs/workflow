#!/usr/bin/env python3
"""rebuild the generated parts of the vault: each project hub's index block, now.md, HOME.md's lists.
usage: python3 -I index.py [vault]. the vault defaults to $VAULT, else ~/vault. only text between the <!-- auto --> markers is rewritten."""
import os, re, sys, datetime

V = os.path.expanduser(sys.argv[1] if len(sys.argv) > 1 else os.environ.get("VAULT", "~/vault"))
if not os.path.isdir(V):
    sys.exit(f"no vault at {V}. set VAULT or pass the path.")
P = os.path.join(V, "projects")
A, B = "<!-- auto:index -->", "<!-- /auto:index -->"
today = datetime.date.today().isoformat()

def put_block(path, body, title_if_new):
    s = open(path, encoding="utf-8").read() if os.path.exists(path) else f"# {title_if_new}\n"
    block = f"{A}\n{body.rstrip()}\n{B}"
    if A in s:
        s = re.sub(re.escape(A) + r".*?" + re.escape(B), lambda _: block, s, flags=re.S)
    else:
        s = s.rstrip() + "\n\n## index\n\n" + block + "\n"
    open(path, "w", encoding="utf-8").write(s)

def notes_under(d):
    out = []
    for root, ds, fs in os.walk(d):
        ds[:] = sorted(x for x in ds if not x.startswith("."))
        for f in sorted(fs):
            if f.endswith(".md"):
                out.append(os.path.relpath(os.path.join(root, f), d))
    return out

open_items, projects = [], []
for name in (sorted(os.listdir(P)) if os.path.isdir(P) else []):
    d = os.path.join(P, name)
    if not os.path.isdir(d): continue
    projects.append(name)
    hub = os.path.join(d, f"{name}.md")
    groups = {}
    for rel in notes_under(d):
        stem = os.path.basename(rel)[:-3]
        if stem in (name, f"{name}-log", f"{name}-tbd"): continue
        sect = rel.split("/")[0] if "/" in rel else "notes"
        groups.setdefault(sect, []).append(stem)
    body = f"log: [[{name}-log]] · open: [[{name}-tbd]] · home: [[HOME]]\n"
    for sect in sorted(groups):
        body += f"\n**{sect}**: " + " · ".join(f"[[{s}]]" for s in sorted(groups[sect], reverse=True)) + "\n"
    put_block(hub, body, name)
    for side in ("log", "tbd"):
        f = os.path.join(d, f"{name}-{side}.md")
        if not os.path.exists(f):
            open(f, "w", encoding="utf-8").write(f"# {name}, {side}\n\nhub: [[{name}]]\n")
    tbd = os.path.join(d, f"{name}-tbd.md")
    items = [l.strip() for l in open(tbd, encoding="utf-8") if l.strip().startswith("- [ ]")]
    if items:
        open_items.append((name, items))

now = f"# now\n\nopen items across every project, rebuilt by /dream from each `*-tbd.md`. last built {today}. edit the tbd, not this.\n\nhome: [[HOME]]\n"
for name, items in sorted(open_items, key=lambda x: -len(x[1])):
    now += f"\n## [[{name}]] ({len(items)})\n\n" + "\n".join(items[:3]) + ("\n- ... %d more in [[%s-tbd]]" % (len(items) - 3, name) if len(items) > 3 else "") + "\n"
open(os.path.join(V, "now.md"), "w", encoding="utf-8").write(now)

def listing(folder):
    fs = notes_under(os.path.join(V, folder)) if os.path.isdir(os.path.join(V, folder)) else []
    return " · ".join(f"[[{os.path.basename(f)[:-3]}]]" for f in sorted(fs, reverse=True)) or "none yet"

home_body = (f"**projects**: " + " · ".join(f"[[{p}]]" for p in projects) + "\n\n"
             f"**decisions**: {listing('decisions')}\n\n"
             f"**people**: {listing('people')}\n\n"
             f"**taste**: {listing('taste')}\n\n"
             f"**systems**: {listing('systems')}\n\n"
             f"**sessions**: {listing('sessions')}\n\n"
             f"**memory**: " + " · ".join(["[[MEMORY]]"] + [x for x in listing('memory').split(" · ") if x not in ("[[MEMORY]]", "none yet")]) + "\n")
put_block(os.path.join(V, "HOME.md"), home_body, "HOME")
print(f"hubs {len(projects)}, now.md {sum(len(i) for _, i in open_items)} open items")
