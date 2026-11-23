#!/usr/bin/env bash
# installs the workflow into ~/.claude, and updates it. mac and linux (and wsl). windows: install.ps1.
#
#   bash install.sh                 asks before anything optional
#   bash install.sh --yes           defaults, no questions: rules, skills, the tools. nothing optional
#   --with-pstack                   also install the pstack plugin (needs the claude cli)
#   --with-brain                    also install /brain, /dream and create ~/vault from brain-template/
#   --with-permissions              also make claude code ask before every push, merge, pr, release and deploy command
#   --with-hooks                    also add the hook that installs missing node_modules (needs jq)
#   --gitignore                     also add the notes files to your global gitignore
#   an agent (no terminal) gets no prompts: pass every --with-*/--no-* flag you want.
#   --force                         replace files you edited too (your copy goes to ~/.claude/workflow-backups/)
#   --dry-run                       print what would happen, change nothing
#   --status                        what is installed, what is behind, what you edited. changes nothing
#   --uninstall                     move every file it installed and you did not edit to workflow-backups/
#
# run it again to update. a file you did not touch is replaced, a file you edited is kept and named.
# your own settings live in ~/.claude/RULES.local.md, which is created once and never written again.
# it never deletes (old copies are moved to workflow-backups/), never touches git history, never pushes.
set -euo pipefail

REPO_URL="${WORKFLOW_REPO:-https://github.com/gntrs/workflow.git}"
YES=0 FORCE=0 DRY=0 MODE=install PSTACK=ask BRAIN=ask GITIGNORE=ask PERMS=ask HOOKS=ask
for a in "$@"; do
  case "$a" in
    --yes|-y) YES=1 ;;
    --force) FORCE=1 ;;
    --dry-run) DRY=1 ;;
    --status) MODE=status ;;
    --uninstall) MODE=uninstall ;;
    --with-pstack) PSTACK=1 ;;
    --no-pstack) PSTACK=0 ;;
    --with-brain) BRAIN=1 ;;
    --no-brain) BRAIN=0 ;;
    --with-permissions) PERMS=1 ;;
    --no-permissions) PERMS=0 ;;
    --with-hooks) HOOKS=1 ;;
    --no-hooks) HOOKS=0 ;;
    --gitignore) GITIGNORE=1 ;;
    --no-gitignore) GITIGNORE=0 ;;
    -h|--help) sed -n 2,20p "$0"; exit 0 ;;
    *) echo "unknown flag: $a"; exit 2 ;;
  esac
done

# run from a clone, or fetch one (for curl | bash)
# piped (curl | bash): there is no script file, so never trust the current folder
SRC=""
if [ -n "${BASH_SOURCE[0]:-}" ] && [ -f "${BASH_SOURCE[0]}" ]; then
  SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi
if [ -z "$SRC" ] || [ ! -f "$SRC/rules/RULES.md" ] || [ ! -f "$SRC/SETUP.md" ]; then
  SRC="$HOME/.claude/workflow"
  if [ -d "$SRC/.git" ]; then git -C "$SRC" pull -q --ff-only || echo "could not update $SRC (git pull failed), using the copy that is there"
  else git clone -q --depth 1 "$REPO_URL" "$SRC"; fi
fi

# run from the clone the one line install made: get the newest version first, then start over from it.
# a clone anywhere else (a fork, a checkout you are working in) is used as it is
MAIN_VERSION=""
if [ "$SRC" = "$HOME/.claude/workflow" ] && [ -d "$SRC/.git" ] && [ -z "${WORKFLOW_PULLED:-}" ]; then
  if [ "$MODE" = install ] && [ $DRY -eq 0 ]; then
    if git -C "$SRC" pull -q --ff-only; then WORKFLOW_PULLED=1 exec bash "$SRC/install.sh" "$@"; fi
    echo "could not update $SRC (git pull failed), using the copy that is there"
  elif git -C "$SRC" fetch -q 2>/dev/null; then
    MAIN_VERSION="$(git -C "$SRC" show '@{u}:VERSION' 2>/dev/null || true)"
  fi
fi

CLAUDE_DIR="$HOME/.claude"
MANIFEST="$CLAUDE_DIR/workflow-manifest"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$CLAUDE_DIR/workflow-backups/$STAMP"
VERSION="$(cat "$SRC/VERSION" 2>/dev/null || echo unknown)"
OURS="bbq brain cook deep design dream initiate playbook review ship status write"
did=() skipped=() moved=()
NEWMAN="$(mktemp)"; trap 'rm -f "$NEWMAN"' EXIT

run() { if [ $DRY -eq 1 ]; then echo "would: $*"; else "$@"; fi; }
ask() { # ask "question" -> 0 for yes
  [ $YES -eq 1 ] && return 0
  [ -t 0 ] || return 1
  read -r -p "$1 [y/N] " r; [ "$r" = y ] || [ "$r" = Y ]
}
opt() { # opt CURRENT "question" -> 1 or 0. --yes never turns an optional part on
  if [ "$1" != ask ]; then echo "$1"; elif [ $YES -eq 0 ] && ask "$2"; then echo 1; else echo 0; fi
}
sha() { if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1"; else shasum -a 256 "$1"; fi | cut -d' ' -f1; }
recorded() { [ -f "$MANIFEST" ] || return 0; awk -v p="$1" '$2==p{print $1; exit}' "$MANIFEST"; }
known() { [ -f "$SRC/setup/known-hashes.txt" ] && grep -qxF "$1" "$SRC/setup/known-hashes.txt"; }
installed_version() { [ -f "$MANIFEST" ] && sed -n 's/^# workflow //p' "$MANIFEST" | head -1; }
# state SRCFILE DESTFILE REL -> new | same | clean (yours matches a copy we shipped) | edited
state() {
  [ -e "$2" ] || { echo new; return; }
  local h; h="$(sha "$2")"
  if [ "$h" = "$(sha "$1")" ]; then echo same
  elif [ "$h" = "$(recorded "$3")" ] || known "$h"; then echo clean
  else echo edited; fi
}
linked() { # linked REL: true when REL or a folder above it inside ~/.claude is a symlink (your own copy, kept elsewhere)
  local p="$CLAUDE_DIR" part rest="$1"
  while [ -n "$rest" ]; do
    part="${rest%%/*}"; p="$p/$part"
    [ -L "$p" ] && return 0
    case "$rest" in */*) rest="${rest#*/}" ;; *) rest="" ;; esac
  done
  return 1
}
backup() { # backup REL: move ~/.claude/REL into this run's backup folder
  if [ $DRY -eq 1 ]; then return 0; fi
  mkdir -p "$BACKUP/$(dirname "$1")"; mv "$CLAUDE_DIR/$1" "$BACKUP/$1"
}
pairs_of() { # pairs_of SRC REL -> lines of "srcfile|rel" for a file or every file in a folder
  if [ -d "$1" ]; then (cd "$1" && find . -type f ! -name .DS_Store | sed 's|^\./||' | LC_ALL=C sort) | while IFS= read -r f; do echo "$1/$f|$2/$f"; done
  else echo "$1|$2"; fi
}
# install_group LABEL SRC REL: one skill folder or one file, all or nothing.
# a group with a file you edited is left alone and named, unless --force or you say yes.
install_group() {
  local label="$1" src="$2" rel="$3" pairs s d st edited="" changed=0 replace=0
  if linked "$rel"; then skipped+=("$label: a link to your own copy, left alone"); return 0; fi
  pairs="$(pairs_of "$src" "$rel")"
  while IFS='|' read -r s d; do
    [ "$(state "$s" "$CLAUDE_DIR/$d" "$d")" = edited ] && edited="$edited ${d#"$rel"/}"
  done <<< "$pairs"
  if [ -n "$edited" ]; then
    if [ $FORCE -eq 1 ] || { [ $YES -eq 0 ] && ask "$label has your edits (${edited# }). replace it? your copy goes to workflow-backups/"; }; then replace=1
    else skipped+=("$label: you edited${edited}. kept yours. --force replaces it, your copy goes to workflow-backups/"); return 0; fi
  fi
  while IFS='|' read -r s d; do
    st="$(state "$s" "$CLAUDE_DIR/$d" "$d")"
    case "$st" in
      same) ;;
      edited) backup "$d"; moved+=("$d"); changed=1 ;;
      *) changed=1 ;;
    esac
    if [ "$st" != same ] && [ $DRY -eq 0 ]; then mkdir -p "$(dirname "$CLAUDE_DIR/$d")"; cp "$s" "$CLAUDE_DIR/$d"; fi
    echo "$(sha "$s")  $d" >> "$NEWMAN"
  done <<< "$pairs"
  # a file we installed before that is gone from the source: move it out if you did not edit it
  if [ -d "$src" ] && [ -f "$MANIFEST" ]; then
    while read -r h d; do
      case "$d" in "$rel"/*) ;; *) continue ;; esac
      grep -qF "|$d" <<< "$pairs" && continue
      [ -f "$CLAUDE_DIR/$d" ] && [ "$(sha "$CLAUDE_DIR/$d")" = "$h" ] || continue
      backup "$d"; moved+=("$d (gone from the source)"); changed=1
    done < <(grep -v '^#' "$MANIFEST")
  fi
  [ $changed -eq 1 ] && did+=("$label")
  return 0
}
write_manifest() {
  [ $DRY -eq 1 ] && return 0
  local out="$MANIFEST.tmp"
  echo "# workflow $VERSION" > "$out"
  echo "# files this installer put in ~/.claude and their sha256. it uses this to tell your edits from its own old copies. do not edit." >> "$out"
  cat "$NEWMAN" >> "$out"
  if [ -f "$MANIFEST" ]; then
    while read -r h d; do
      awk -v p="$d" '$2==p{f=1} END{exit !f}' "$NEWMAN" && continue
      [ -f "$CLAUDE_DIR/$d" ] && echo "$h  $d" >> "$out"
    done < <(grep -v '^#' "$MANIFEST")
  fi
  mv "$out" "$MANIFEST"
}
groups() { # every "src|rel" the installer keeps up to date and that is installed here
  local dir name f
  echo "$SRC/rules/RULES.md|RULES.md"
  for dir in "$SRC"/skills/*/; do
    name="$(basename "$dir")"; [ -d "$CLAUDE_DIR/skills/$name" ] && pairs_of "${dir%/}" "skills/$name"
  done
  for f in responsive-probe.js probe-test.mjs brand-check.mjs ref-read.mjs ref-check.mjs record.mjs; do echo "$SRC/tools/$f|tools/$f"; done
  if [ -d "$CLAUDE_DIR/skills/pstack" ]; then for f in install.sh README.md; do echo "$SRC/pstack/$f|skills/pstack/$f"; done; fi
  [ -e "$CLAUDE_DIR/hooks/ensure-node-modules.sh" ] && echo "$SRC/setup/hooks/ensure-node-modules.sh|hooks/ensure-node-modules.sh"
  return 0
}
settings_merge() { # settings_merge LABEL FRAGMENT [KEY=VALUE]
  local label="$1" frag="$2" set="${3:-}" settings="$CLAUDE_DIR/settings.json" need
  if ! command -v node >/dev/null 2>&1; then skipped+=("$label: needs node to merge settings.json. add the block in $frag by hand"); return 0; fi
  need="$(node "$SRC/setup/merge-settings.mjs" "$settings" "$frag" --check ${set:+--set "$set"} 2>&1)" || { skipped+=("$label: $need"); return 0; }
  [ "$need" = same ] && return 0
  if [ $DRY -eq 0 ]; then
    if [ -f "$settings" ]; then mkdir -p "$BACKUP"; cp "$settings" "$BACKUP/settings.json"; fi
    node "$SRC/setup/merge-settings.mjs" "$settings" "$frag" ${set:+--set "$set"} >/dev/null
  fi
  did+=("$label")
}

# ---- status: read only
if [ "$MODE" = status ]; then
  have="$(installed_version || true)"
  echo "installed: ${have:-none recorded (never installed, or installed before updates were tracked)}"
  echo "source:    $VERSION, $SRC"
  [ -n "$MAIN_VERSION" ] && echo "main:      $MAIN_VERSION$([ "$MAIN_VERSION" = "$VERSION" ] || echo ", newer than the source here. the installer pulls it")"
  behind=0 edited=0
  if [ -d "$CLAUDE_DIR" ]; then
    while IFS='|' read -r s d; do
      [ -e "$CLAUDE_DIR/$d" ] || { case "$d" in skills/*) behind=$((behind+1)) ;; esac; continue; }
      linked "$d" && continue
      case "$(state "$s" "$CLAUDE_DIR/$d" "$d")" in
        clean) behind=$((behind+1)) ;;
        edited) edited=$((edited+1)); echo "edited:    $d" ;;
      esac
    done <<< "$(groups)"
  fi
  echo "$behind files behind the source, $edited edited by you. run the installer to update the ones you did not edit."
  exit 0
fi

# ---- uninstall: moves, never deletes
if [ "$MODE" = uninstall ]; then
  [ -f "$MANIFEST" ] || { echo "nothing to uninstall: there is no $MANIFEST, so nothing here is tracked as installed."; exit 1; }
  kept=() n=0
  while read -r h d; do
    [ -f "$CLAUDE_DIR/$d" ] || continue
    if linked "$d"; then kept+=("$d (a link to your own copy)")
    elif [ "$(sha "$CLAUDE_DIR/$d")" = "$h" ]; then n=$((n+1)); backup "$d"
    else kept+=("$d"); fi
  done < <(grep -v '^#' "$MANIFEST")
  hook="$CLAUDE_DIR/hooks/ensure-node-modules.sh"
  if [ $DRY -eq 0 ]; then
    # the hook file is gone: take its entry out of settings.json too, or every command would call a missing file
    if [ ! -e "$hook" ] && [ -f "$CLAUDE_DIR/settings.json" ] && command -v node >/dev/null 2>&1 \
      && [ "$(node "$SRC/setup/merge-settings.mjs" "$CLAUDE_DIR/settings.json" "$SRC/setup/hooks.json" --remove --check --set "__HOOK__=$hook" 2>/dev/null)" = changed ]; then
      mkdir -p "$BACKUP"; cp "$CLAUDE_DIR/settings.json" "$BACKUP/settings.json"
      node "$SRC/setup/merge-settings.mjs" "$CLAUDE_DIR/settings.json" "$SRC/setup/hooks.json" --remove --set "__HOOK__=$hook" >/dev/null
    fi
    for dir in skills tools hooks; do
      [ -d "$CLAUDE_DIR/$dir" ] && find "$CLAUDE_DIR/$dir" -depth -type d -empty -exec rmdir {} \; 2>/dev/null || true
    done
    if [ -f "$CLAUDE_DIR/CLAUDE.md" ]; then
      mkdir -p "$BACKUP"; cp "$CLAUDE_DIR/CLAUDE.md" "$BACKUP/CLAUDE.md"
      grep -vxF -e "@RULES.md" -e "@RULES.local.md" "$BACKUP/CLAUDE.md" > "$CLAUDE_DIR/CLAUDE.md" || true
      grep -q '[^[:space:]]' "$CLAUDE_DIR/CLAUDE.md" || rm "$CLAUDE_DIR/CLAUDE.md"
    fi
    mkdir -p "$BACKUP"; mv "$MANIFEST" "$BACKUP/workflow-manifest"
  fi
  echo
  if [ $DRY -eq 1 ]; then echo "would move $n files to workflow-backups/ and take the two import lines out of CLAUDE.md. nothing changed."
  else echo "uninstalled. the $n files it moved are in $BACKUP"; fi
  [ ${#kept[@]} -gt 0 ] && printf 'kept, you edited it: %s\n' "${kept[@]}"
  echo "left alone: RULES.local.md (yours), the ask list in settings.json, skills/pstack/models.md, ~/vault, the pstack plugin (claude plugin uninstall pstack@open-pstack)."
  exit 0
fi

# ---- install or update
PSTACK="$(opt "$PSTACK" "install pstack, the plugin cook runs on (recommended)?")"
BRAIN="$(opt "$BRAIN" "install the brain (a notes vault at ~/vault, /brain and /dream)?")"
PERMS="$(opt "$PERMS" "make claude code ask before every push, merge, pr, release and deploy command (recommended)?")"
HOOKS="$(opt "$HOOKS" "add the hook that installs missing node_modules before a command needs them?")"
GITIGNORE="$(opt "$GITIGNORE" "add the per repo notes files (.claude/CLAUDE.md, log.md, tbd.md, plans/ ...) to your global gitignore?")"

run mkdir -p "$CLAUDE_DIR/skills" "$CLAUDE_DIR/tools"

# 0. older versions left <name>.bak-<date> copies inside skills/, where they can load as a second skill. move them out
for n in $OURS; do
  for old in "$CLAUDE_DIR/skills/$n".bak-*; do
    [ -e "$old" ] || continue
    backup "skills/$(basename "$old")"; moved+=("skills/$(basename "$old") (an old backup)")
  done
done
for old in "$CLAUDE_DIR"/RULES.md.bak-*; do
  [ -e "$old" ] || continue
  backup "$(basename "$old")"; moved+=("$(basename "$old") (an old backup)")
done

# 1. rules. yours to read, not to edit: what is personal goes in RULES.local.md
install_group "RULES.md" "$SRC/rules/RULES.md" "RULES.md"
if [ ! -e "$CLAUDE_DIR/RULES.local.md" ]; then
  run cp "$SRC/setup/RULES.local.md" "$CLAUDE_DIR/RULES.local.md"; did+=("RULES.local.md (yours from now on)")
fi

# 2. the import lines, appended, never replacing anything
add_line() {
  [ -f "$CLAUDE_DIR/CLAUDE.md" ] || run touch "$CLAUDE_DIR/CLAUDE.md"
  if ! grep -qxF "$1" "$CLAUDE_DIR/CLAUDE.md" 2>/dev/null; then
    if [ $DRY -eq 1 ]; then echo "would: append '$1' to $CLAUDE_DIR/CLAUDE.md"; elif [ -s "$CLAUDE_DIR/CLAUDE.md" ]; then printf '\n%s\n' "$1" >> "$CLAUDE_DIR/CLAUDE.md"; else printf '%s\n' "$1" > "$CLAUDE_DIR/CLAUDE.md"; fi
    did+=("CLAUDE.md: $1")
  fi
}
add_line "@RULES.md"
add_line "@RULES.local.md"

# 3. skills
for dir in "$SRC"/skills/*/; do
  name="$(basename "$dir")"
  case "$name" in brain|dream) [ "$BRAIN" = 1 ] || [ -d "$CLAUDE_DIR/skills/$name" ] || continue ;; esac
  install_group "skills/$name" "${dir%/}" "skills/$name"
done

# 4. the size sweep probe, its runner, the brand check, the ref reader and its gate, and the recorder
for t in responsive-probe.js probe-test.mjs brand-check.mjs ref-read.mjs ref-check.mjs record.mjs; do
  install_group "tools/$t" "$SRC/tools/$t" "tools/$t"
done

# 5. optional: keep the per repo notes files out of every repo. exact paths, never all of .claude/
NOTES=".claude/CLAUDE.md .claude/log.md .claude/tbd.md .claude/taste.md .claude/brand.md .claude/plans/ .claude/research/ .claude/sql/ .claude/run/ .claude/videos/"
if [ "$GITIGNORE" = 1 ] && command -v git >/dev/null; then
  gi="$(git config --global core.excludesFile || true)"
  [ -z "$gi" ] && gi="$HOME/.gitignore_global"
  gi="${gi/#\~/$HOME}"
  [ -n "$(git config --global core.excludesFile || true)" ] || run git config --global core.excludesFile "$gi"
  for n in $NOTES; do
    grep -qxF "$n" "$gi" 2>/dev/null && continue
    if [ $DRY -eq 1 ]; then echo "would: append $n to $gi"; else printf '%s\n' "$n" >> "$gi"; fi
    added=1
  done
  [ "${added:-0}" = 1 ] && did+=("global gitignore: notes files")
fi

# 6. optional: ask before anything leaves. merged into settings.json, the old file goes to workflow-backups/
[ "$PERMS" = 1 ] && settings_merge "settings.json: ask before push, merge, pr, release, deploy" "$SRC/setup/permissions.json"

# 7. optional: the node_modules hook
if [ "$HOOKS" = 1 ]; then
  if ! command -v jq >/dev/null 2>&1; then skipped+=("the node_modules hook: needs jq on PATH")
  else
    install_group "hooks/ensure-node-modules.sh" "$SRC/setup/hooks/ensure-node-modules.sh" "hooks/ensure-node-modules.sh"
    [ $DRY -eq 1 ] || chmod +x "$CLAUDE_DIR/hooks/ensure-node-modules.sh" 2>/dev/null || true
    settings_merge "settings.json: the node_modules hook" "$SRC/setup/hooks.json" "__HOOK__=$CLAUDE_DIR/hooks/ensure-node-modules.sh"
  fi
fi

# 8. optional: pstack
if [ "$PSTACK" = 1 ] || [ -d "$CLAUDE_DIR/skills/pstack" ]; then
  for f in install.sh README.md; do
    install_group "skills/pstack/$f" "$SRC/pstack/$f" "skills/pstack/$f"
  done
  # models.md holds your model names: created once, never written again
  if [ ! -e "$CLAUDE_DIR/skills/pstack/models.md" ]; then
    run cp "$SRC/pstack/models.md" "$CLAUDE_DIR/skills/pstack/models.md"; did+=("skills/pstack/models.md (yours from now on)")
  fi
fi
if [ "$PSTACK" = 1 ]; then
  if command -v claude >/dev/null; then run bash "$CLAUDE_DIR/skills/pstack/install.sh"
  else skipped+=("pstack plugin: no claude cli on PATH, run ~/.claude/skills/pstack/install.sh later"); fi
fi

# 9. optional: the brain
if [ "$BRAIN" = 1 ]; then
  if [ -e "$HOME/vault" ]; then skipped+=("~/vault exists, left as is")
  else run cp -R "$SRC/brain-template" "$HOME/vault"; did+=("~/vault"); fi
fi

had="$(installed_version || true)"
write_manifest

echo
if [ $DRY -eq 1 ]; then echo "would install or update: ${did[*]:-nothing, all up to date}"; else echo "installed or updated: ${did[*]:-nothing, all up to date}"; fi
[ ${#skipped[@]} -gt 0 ] && printf 'skipped: %s\n' "${skipped[@]}"
if [ ${#moved[@]} -gt 0 ]; then
  if [ $DRY -eq 1 ]; then printf 'would move to workflow-backups/: %s\n' "${moved[@]}"; else printf 'moved to %s: %s\n' "$BACKUP" "${moved[*]}"; fi
fi
if [ -n "$had" ] && [ "$had" != "$VERSION" ]; then echo "version: $had to $VERSION. what changed: $SRC/CHANGELOG.md"; else echo "version: $VERSION"; fi
echo "next: restart claude code, then type /cook <a real task>."
