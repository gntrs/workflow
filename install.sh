#!/usr/bin/env bash
# installs the workflow into ~/.claude. mac and linux (and wsl). windows: install.ps1.
#
#   bash install.sh                 asks before anything optional
#   bash install.sh --yes           defaults, no questions: rules, skills, the probe and brand check. nothing optional
#   --with-pstack                   also install the pstack plugin (needs the claude cli)
#   --with-brain                    also install /brain, /dream and create ~/vault from brain-template/
#   --gitignore                     also add the notes files to your global gitignore
#   an agent (no terminal) gets no prompts: pass every --with-*/--no-* flag you want.
#   --force                         replace skills that already exist (old copy kept as <name>.bak-<date>)
#   --dry-run                       print what would happen, change nothing
#
# safe to run again. it never deletes, never touches git history, never pushes.
set -euo pipefail

REPO_URL="${WORKFLOW_REPO:-https://github.com/gntrs/workflow.git}"
YES=0 FORCE=0 DRY=0 PSTACK=ask BRAIN=ask GITIGNORE=ask
for a in "$@"; do
  case "$a" in
    --yes|-y) YES=1 ;;
    --force) FORCE=1 ;;
    --dry-run) DRY=1 ;;
    --with-pstack) PSTACK=1 ;;
    --no-pstack) PSTACK=0 ;;
    --with-brain) BRAIN=1 ;;
    --no-brain) BRAIN=0 ;;
    --gitignore) GITIGNORE=1 ;;
    --no-gitignore) GITIGNORE=0 ;;
    -h|--help) sed -n 2,12p "$0"; exit 0 ;;
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
  if [ -d "$SRC/.git" ]; then git -C "$SRC" pull -q --ff-only || true
  else git clone -q --depth 1 "$REPO_URL" "$SRC"; fi
fi

CLAUDE_DIR="$HOME/.claude"
STAMP="$(date +%Y%m%d-%H%M%S)"
did=() skipped=()

run() { if [ $DRY -eq 1 ]; then echo "would: $*"; else "$@"; fi; }
ask() { # ask "question" -> 0 for yes
  [ $YES -eq 1 ] && return 0
  [ -t 0 ] || return 1
  read -r -p "$1 [y/N] " r; [ "$r" = y ] || [ "$r" = Y ]
}
same() { diff -rq "$1" "$2" >/dev/null 2>&1; }

[ "$PSTACK" = ask ] && { if [ $YES -eq 0 ] && ask "install pstack, the plugin cook runs on (recommended)?"; then PSTACK=1; else PSTACK=0; fi; }
[ "$BRAIN" = ask ] && { if [ $YES -eq 0 ] && ask "install the brain (a notes vault at ~/vault, /brain and /dream)?"; then BRAIN=1; else BRAIN=0; fi; }
[ "$GITIGNORE" = ask ] && { if [ $YES -eq 0 ] && ask "add the per repo notes files (.claude/CLAUDE.md, log.md, tbd.md, plans/ ...) to your global gitignore?"; then GITIGNORE=1; else GITIGNORE=0; fi; }

run mkdir -p "$CLAUDE_DIR/skills" "$CLAUDE_DIR/tools"

# 1. rules
if [ -f "$CLAUDE_DIR/RULES.md" ] && ! same "$SRC/rules/RULES.md" "$CLAUDE_DIR/RULES.md"; then
  run cp "$CLAUDE_DIR/RULES.md" "$CLAUDE_DIR/RULES.md.bak-$STAMP"
fi
same "$SRC/rules/RULES.md" "$CLAUDE_DIR/RULES.md" || { run cp "$SRC/rules/RULES.md" "$CLAUDE_DIR/RULES.md"; did+=("RULES.md"); }

# 2. the import line, appended, never replacing anything
touch_claude() { [ -f "$CLAUDE_DIR/CLAUDE.md" ] || run touch "$CLAUDE_DIR/CLAUDE.md"; }
add_line() {
  touch_claude
  if ! grep -qxF "$1" "$CLAUDE_DIR/CLAUDE.md" 2>/dev/null; then
    if [ $DRY -eq 1 ]; then echo "would: append '$1' to CLAUDE.md"; else printf '\n%s\n' "$1" >> "$CLAUDE_DIR/CLAUDE.md"; fi
    did+=("CLAUDE.md: $1")
  fi
}
add_line "@RULES.md"

# 3. skills
for dir in "$SRC"/skills/*/; do
  name="$(basename "$dir")"
  case "$name" in brain|dream) [ "$BRAIN" = 1 ] || continue ;; esac
  dest="$CLAUDE_DIR/skills/$name"
  if [ -e "$dest" ]; then
    if same "$dir" "$dest"; then continue; fi
    if [ $FORCE -eq 1 ] || { [ $YES -eq 0 ] && ask "skills/$name already exists and differs. replace it (old copy kept)?"; }; then
      run mv "$dest" "$dest.bak-$STAMP"
    else skipped+=("skills/$name (exists, use --force)"); continue; fi
  fi
  run cp -R "$dir" "$dest"; did+=("skills/$name")
done

# 4. the size sweep probe, its runner and the brand check
for t in responsive-probe.js probe-test.mjs brand-check.mjs; do
  same "$SRC/tools/$t" "$CLAUDE_DIR/tools/$t" || { run cp "$SRC/tools/$t" "$CLAUDE_DIR/tools/"; did+=("tools/$t"); }
done

# 5. optional: keep the per repo notes files out of every repo. exact paths, never all of .claude/
NOTES=".claude/CLAUDE.md .claude/log.md .claude/tbd.md .claude/taste.md .claude/brand.md .claude/plans/ .claude/research/ .claude/sql/ .claude/run/"
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

# 6. optional: pstack
if [ "$PSTACK" = 1 ]; then
  same "$SRC/pstack" "$CLAUDE_DIR/skills/pstack" || { run mkdir -p "$CLAUDE_DIR/skills/pstack"; run cp -R "$SRC/pstack/." "$CLAUDE_DIR/skills/pstack/"; did+=("skills/pstack"); }
  if command -v claude >/dev/null; then run bash "$CLAUDE_DIR/skills/pstack/install.sh"
  else skipped+=("pstack plugin: no claude cli on PATH, run ~/.claude/skills/pstack/install.sh later"); fi
fi

# 7. optional: the brain
if [ "$BRAIN" = 1 ]; then
  if [ -e "$HOME/vault" ]; then skipped+=("~/vault exists, left as is")
  else run cp -R "$SRC/brain-template" "$HOME/vault"; did+=("~/vault"); fi
fi

echo
if [ $DRY -eq 1 ]; then echo "would install: ${did[*]:-nothing new}"; else echo "installed: ${did[*]:-nothing new}"; fi
[ ${#skipped[@]} -gt 0 ] && printf 'skipped: %s\n' "${skipped[@]}"
echo "next: restart claude code, then type /cook <a real task>."
