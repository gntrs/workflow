#!/usr/bin/env bash
# the installer's own tests. every case runs in a throwaway home, nothing touches yours.
#   bash scripts/test-install.sh          tests install.sh
#   bash scripts/test-install.sh ps1      tests install.ps1 (needs pwsh on PATH)
# the upgrade cases install an old commit with its own installer first, so they need the git history (not a shallow clone).
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INSTALLER="${1:-sh}"
OLD_COMMITS="${OLD_COMMITS:-76f27ac e942460}"
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
pass=0 fail=0
sha() { if command -v sha256sum >/dev/null 2>&1; then sha256sum "$@"; else shasum -a 256 "$@"; fi; }
native() { if command -v cygpath >/dev/null 2>&1; then cygpath -w "$1"; else echo "$1"; fi; }
ok() { # ok "what" command...
  local what="$1"; shift
  if "$@" >/dev/null 2>&1; then pass=$((pass+1)); echo "ok    $what"; else fail=$((fail+1)); echo "FAIL  $what"; fi
}
no() { local what="$1"; shift; if "$@" >/dev/null 2>&1; then fail=$((fail+1)); echo "FAIL  $what"; else pass=$((pass+1)); echo "ok    $what"; fi; }
newhome() { local h; h="$(mktemp -d "$WORK/home.XXXXXX")"; echo "$h"; }
tree() { (cd "$1" && find . -type f ! -path './.claude/workflow-backups/*' | LC_ALL=C sort | while IFS= read -r f; do echo "$f $(sha "$f" | cut -d' ' -f1)"; done | sha | cut -d' ' -f1); }
copy_source() { # a copy of the source we can change
  local d; d="$(mktemp -d "$WORK/src.XXXXXX")"
  (cd "$ROOT" && cp -R rules skills tools pstack setup brain-template install.sh install.ps1 SETUP.md VERSION "$d/")
  echo "$d"
}
# inst SRC HOME flags...: run the installer under test from SRC into HOME
inst() {
  local src="$1" h="$2"; shift 2
  if [ "$INSTALLER" = ps1 ]; then
    local a=() f
    for f in "$@"; do case "$f" in
      --yes) a+=(-Yes) ;; --force) a+=(-Force) ;; --dry-run) a+=(-DryRun) ;; --status) a+=(-Status) ;; --uninstall) a+=(-Uninstall) ;;
      --with-brain) a+=(-WithBrain) ;; --with-permissions) a+=(-WithPermissions) ;; --with-hooks) a+=(-WithHooks) ;; --with-pstack) a+=(-WithPstack) ;;
      --no-*) ;; *) a+=("$f") ;; esac; done
    WORKFLOW_HOME="$(native "$h")" pwsh -NoProfile -ExecutionPolicy Bypass -File "$(native "$src/install.ps1")" "${a[@]}" 2>&1
  else HOME="$h" bash "$src/install.sh" "$@" 2>&1 </dev/null; fi
}
old_install() { # old_install COMMIT HOME: install that commit with its own installer
  local d; d="$(mktemp -d "$WORK/old.XXXXXX")"
  git -C "$ROOT" archive "$1" | tar -x -C "$d" || return 1
  HOME="$2" bash "$d/install.sh" --yes >/dev/null 2>&1 </dev/null
}
matches_source() { # every installed core file equals the source
  local h="$1" src="${2:-$ROOT}" f
  for f in $(cd "$src" && find skills -type f ! -name .DS_Store ! -path 'skills/brain/*' ! -path 'skills/dream/*'); do
    cmp -s "$src/$f" "$h/.claude/$f" || { echo "differs: $f"; return 1; }
  done
  cmp -s "$src/rules/RULES.md" "$h/.claude/RULES.md" || { echo "differs: RULES.md"; return 1; }
  for f in responsive-probe.js probe-test.mjs brand-check.mjs ref-read.mjs ref-check.mjs record.mjs; do
    cmp -s "$src/tools/$f" "$h/.claude/tools/$f" || { echo "differs: tools/$f"; return 1; }
  done
}
no_baks_in_skills() { [ -z "$(find "$1/.claude/skills" -maxdepth 1 -name '*.bak-*' 2>/dev/null)" ]; }

echo "# installer under test: install.$INSTALLER"

echo "## fresh install"
h="$(newhome)"; out="$(inst "$ROOT" "$h" --yes --dry-run)"
ok "dry run on an empty home writes nothing" test ! -e "$h/.claude/skills/cook"
out="$(inst "$ROOT" "$h" --yes)"
ok "installs every core file" matches_source "$h"
ok "writes the manifest with the version" grep -q "^# workflow $(cat "$ROOT/VERSION")" "$h/.claude/workflow-manifest"
ok "creates RULES.local.md" test -f "$h/.claude/RULES.local.md"
ok "imports RULES.md" grep -qx '@RULES.md' "$h/.claude/CLAUDE.md"
ok "imports RULES.local.md after it" test "$(grep -n '@RULES' "$h/.claude/CLAUDE.md" | tr -d '\r' | tr '\n' ' ')" = "1:@RULES.md 3:@RULES.local.md "
no "does not install brain without the flag" test -e "$h/.claude/skills/brain"
no "does not write settings.json without the flag" test -e "$h/.claude/settings.json"
before="$(tree "$h")"; out="$(inst "$ROOT" "$h" --yes)"
ok "a second run changes nothing" test "$before" = "$(tree "$h")"
ok "a second run says so" grep -q "nothing, all up to date" <<< "$out"
no "a second run makes no backup folder" test -e "$h/.claude/workflow-backups"

echo "## an existing CLAUDE.md is appended to, never replaced"
h="$(newhome)"; mkdir -p "$h/.claude"; printf 'my own line\n' > "$h/.claude/CLAUDE.md"
out="$(inst "$ROOT" "$h" --yes)"
ok "keeps the line that was there" grep -qx 'my own line' "$h/.claude/CLAUDE.md"
ok "adds both imports" test "$(grep -c '^@RULES' "$h/.claude/CLAUDE.md")" = 2

for c in $OLD_COMMITS; do
  echo "## upgrade from $c, untouched"
  h="$(newhome)"
  if ! old_install "$c" "$h"; then echo "skip  cannot build $c (shallow clone?)"; fail=$((fail+1)); continue; fi
  no "the old install differs from the source (the test means something)" matches_source "$h"
  before="$(tree "$h")"; out="$(inst "$ROOT" "$h" --yes --dry-run)"
  ok "dry run changes nothing" test "$before" = "$(tree "$h")"
  out="$(inst "$ROOT" "$h" --yes)"
  ok "every file now equals the source" matches_source "$h"
  no "nothing was skipped" grep -q '^skipped' <<< "$out"
  ok "no backup copies inside skills/" no_baks_in_skills "$h"
  ok "RULES.local.md created on upgrade" test -f "$h/.claude/RULES.local.md"

  echo "## upgrade from $c, with edits"
  h="$(newhome)"; old_install "$c" "$h"
  echo "my edit" >> "$h/.claude/skills/cook/SKILL.md"; echo "my rule" >> "$h/.claude/RULES.md"
  out="$(inst "$ROOT" "$h" --yes)"
  ok "the edited skill is kept" grep -qx 'my edit' "$h/.claude/skills/cook/SKILL.md"
  ok "the edited RULES.md is kept" grep -qx 'my rule' "$h/.claude/RULES.md"
  ok "both are named as skipped" test "$(grep -c '^skipped: \(skills.cook\|RULES.md\)' <<< "$out")" = 2
  ok "an untouched skill still updated" cmp -s "$ROOT/skills/ship/SKILL.md" "$h/.claude/skills/ship/SKILL.md"
  out="$(inst "$ROOT" "$h" --yes --force)"
  ok "--force replaces them" matches_source "$h"
  ok "the edited skill went to workflow-backups" test -n "$(grep -rlx 'my edit' "$h/.claude/workflow-backups" 2>/dev/null)"
  ok "the edited RULES.md went to workflow-backups" test -n "$(grep -rlx 'my rule' "$h/.claude/workflow-backups" 2>/dev/null)"
  ok "no backup copies inside skills/" no_baks_in_skills "$h"
done

echo "## update from this version to a later one"
h="$(newhome)"; out="$(inst "$ROOT" "$h" --yes)"
src="$(copy_source)"
echo "a later line" >> "$src/skills/cook/SKILL.md"; echo "a later line" >> "$src/skills/design/SKILL.md"; echo "a later rule" >> "$src/rules/RULES.md"
echo "new file" > "$src/skills/cook/new.md"; rm "$src/skills/playbook/SKILL.md"; echo "replaced" > "$src/skills/playbook/OTHER.md"
echo 9.9.9 > "$src/VERSION"
echo "my edit" >> "$h/.claude/skills/design/SKILL.md"; echo "mine" > "$h/.claude/skills/cook/my-notes.md"; echo "my settings" >> "$h/.claude/RULES.local.md"
out="$(inst "$src" "$h" --yes)"
ok "an untouched skill gets the new text" grep -qx 'a later line' "$h/.claude/skills/cook/SKILL.md"
ok "a new file in an existing skill arrives" test -f "$h/.claude/skills/cook/new.md"
ok "a file you added to a skill stays" grep -qx mine "$h/.claude/skills/cook/my-notes.md"
ok "the skill you edited is kept" grep -qx 'my edit' "$h/.claude/skills/design/SKILL.md"
no "the skill you edited did not get the new text" grep -qx 'a later line' "$h/.claude/skills/design/SKILL.md"
ok "it is named as skipped" grep -q '^skipped: skills.design' <<< "$out"
ok "untouched RULES.md updates" grep -qx 'a later rule' "$h/.claude/RULES.md"
ok "RULES.local.md is never written again" grep -qx 'my settings' "$h/.claude/RULES.local.md"
no "a file removed from the source leaves the skill" test -e "$h/.claude/skills/playbook/SKILL.md"
ok "and goes to workflow-backups" test -n "$(find "$h/.claude/workflow-backups" -path '*skills/playbook/SKILL.md')"
ok "the version change is printed" grep -q "version: $(cat "$ROOT/VERSION") to 9.9.9" <<< "$out"
out="$(inst "$src" "$h" --status)"
ok "--status names the edited file" grep -q 'edited: *skills.design.SKILL.md' <<< "$out"
out="$(inst "$src" "$h" --yes --force)"
ok "--force keeps RULES.local.md too" grep -qx 'my settings' "$h/.claude/RULES.local.md"
ok "--force replaces the edited skill" grep -qx 'a later line' "$h/.claude/skills/design/SKILL.md"

echo "## old backup folders inside skills/ are moved out"
h="$(newhome)"; mkdir -p "$h/.claude/skills/cook.bak-20250101-000000" "$h/.claude/skills/mine.bak-1"
echo x > "$h/.claude/skills/cook.bak-20250101-000000/SKILL.md"; echo x > "$h/.claude/skills/mine.bak-1/SKILL.md"; echo x > "$h/.claude/RULES.md.bak-20250101-000000"
out="$(inst "$ROOT" "$h" --yes)"
no "cook.bak is gone from skills/" test -e "$h/.claude/skills/cook.bak-20250101-000000"
ok "it is in workflow-backups" test -n "$(find "$h/.claude/workflow-backups" -name 'cook.bak-20250101-000000')"
no "RULES.md.bak is gone from ~/.claude" test -e "$h/.claude/RULES.md.bak-20250101-000000"
ok "a folder that is not ours is left alone" test -e "$h/.claude/skills/mine.bak-1/SKILL.md"

echo "## brain and pstack"
h="$(newhome)"; out="$(inst "$ROOT" "$h" --yes --with-brain)"
ok "--with-brain installs brain and dream" test -f "$h/.claude/skills/brain/SKILL.md" -a -f "$h/.claude/skills/dream/SKILL.md"
ok "--with-brain creates the vault" test -f "$h/vault/HOME.md"
echo "mine" > "$h/vault/HOME.md"; out="$(inst "$ROOT" "$h" --yes --with-brain)"
ok "an existing vault is left as is" grep -qx mine "$h/vault/HOME.md"
h="$(newhome)"; mkdir -p "$h/.claude/skills/pstack"; out="$(inst "$ROOT" "$h" --yes)"
ok "an installed pstack folder is kept up to date without the flag" cmp -s "$ROOT/pstack/README.md" "$h/.claude/skills/pstack/README.md"
ok "models.md is created" cmp -s "$ROOT/pstack/models.md" "$h/.claude/skills/pstack/models.md"
echo "my models" >> "$h/.claude/skills/pstack/models.md"; out="$(inst "$ROOT" "$h" --yes --force)"
ok "models.md is never written again, even with --force" grep -qx 'my models' "$h/.claude/skills/pstack/models.md"
no "and is not named as skipped" grep -q 'models.md' <<< "$out"

if command -v node >/dev/null 2>&1; then
  echo "## permissions"
  h="$(newhome)"; out="$(inst "$ROOT" "$h" --yes --with-permissions)"
  ok "creates settings.json with the ask list" grep -q '"Bash(git push:\*)"' "$h/.claude/settings.json"
  before="$(sha "$h/.claude/settings.json")"; out="$(inst "$ROOT" "$h" --yes --with-permissions)"
  ok "a second run leaves it byte for byte" test "$before" = "$(sha "$h/.claude/settings.json")"
  h="$(newhome)"; mkdir -p "$h/.claude"
  printf '{"model":"x","permissions":{"allow":["Bash(ls:*)"],"ask":["Bash(git push:*)","Bash(mine:*)"]},"hooks":{"Stop":[{"hooks":[{"type":"command","command":"mine.sh"}]}]}}' > "$h/.claude/settings.json"
  out="$(inst "$ROOT" "$h" --yes --with-permissions)"
  q() { node -e 'const s=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));process.exit(eval(process.argv[2])?0:1)' "$h/.claude/settings.json" "$1"; }
  ok "keeps the other keys" q 's.model==="x" && s.permissions.allow[0]==="Bash(ls:*)" && s.hooks.Stop[0].hooks[0].command==="mine.sh"'
  ok "keeps the user's own ask rule" q 's.permissions.ask.includes("Bash(mine:*)")'
  ok "adds ours once, no duplicate" q 's.permissions.ask.filter(r=>r==="Bash(git push:*)").length===1 && s.permissions.ask.includes("Bash(gh pr merge:*)")'
  ok "the old settings.json is in workflow-backups" test -n "$(find "$h/.claude/workflow-backups" -name settings.json)"
  h="$(newhome)"; mkdir -p "$h/.claude"; printf '{ not json' > "$h/.claude/settings.json"
  out="$(inst "$ROOT" "$h" --yes --with-permissions)"
  ok "a broken settings.json is left untouched" test "$(cat "$h/.claude/settings.json")" = '{ not json'
  ok "and named as skipped" grep -q '^skipped: settings.json.*not valid json' <<< "$out"
  ok "the rest of the install still ran" test -f "$h/.claude/skills/cook/SKILL.md"

  if [ "$INSTALLER" = sh ] && command -v jq >/dev/null 2>&1; then
    echo "## the node_modules hook"
    h="$(newhome)"; out="$(inst "$ROOT" "$h" --yes --with-hooks)"
    q() { node -e 'const s=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));process.exit(eval(process.argv[2])?0:1)' "$h/.claude/settings.json" "$1"; }
    ok "installs the hook file, executable" test -x "$h/.claude/hooks/ensure-node-modules.sh"
    ok "registers it with its full path" q "s.hooks.PreToolUse[0].hooks[0].command==='$h/.claude/hooks/ensure-node-modules.sh'"
    out="$(inst "$ROOT" "$h" --yes --with-hooks --with-permissions)"
    ok "a second run does not register it twice" q 's.hooks.PreToolUse.length===1 && s.permissions.ask.length>5'
    p="$(mktemp -d "$WORK/proj.XXXXXX")"; printf '{"name":"t","version":"1.0.0"}' > "$p/package.json"
    hook_out="$(printf '{"tool_input":{"command":"npx vite"},"cwd":"%s"}' "$p" | bash "$h/.claude/hooks/ensure-node-modules.sh")"
    ok "the hook answers a command that needs node_modules" grep -q 'node_modules was missing' <<< "$hook_out"
    hook_out="$(printf '{"tool_input":{"command":"ls"},"cwd":"%s"}' "$p" | bash "$h/.claude/hooks/ensure-node-modules.sh")"
    ok "the hook stays silent for any other command" test -z "$hook_out"
    out="$(inst "$ROOT" "$h" --uninstall)"
    no "uninstall takes the hook file" test -e "$h/.claude/hooks/ensure-node-modules.sh"
    ok "and its entry out of settings.json, the ask list stays" q '!s.hooks && s.permissions.ask.length>5'
  fi
fi

echo "## --status counts every kind of file"
h="$(newhome)"; out="$(inst "$ROOT" "$h" --yes)"; src="$(copy_source)"
echo "// later" >> "$src/tools/record.mjs"; echo "later" >> "$src/skills/ship/SKILL.md"
out="$(inst "$src" "$h" --status)"
ok "a newer tool and a newer skill are both behind" grep -q '^2 files behind' <<< "$out"
echo "// mine" >> "$h/.claude/tools/record.mjs"; out="$(inst "$src" "$h" --status)"
ok "an edited tool is named" grep -q 'edited: *tools.record.mjs' <<< "$out"

if [ "$INSTALLER" = sh ]; then
  echo "## a skill folder that is a link to your own copy"
  h="$(newhome)"; mine="$(mktemp -d "$WORK/mine.XXXXXX")"; mkdir -p "$h/.claude/skills"
  echo "my own cook" > "$mine/SKILL.md"; ln -s "$mine" "$h/.claude/skills/cook"
  out="$(inst "$ROOT" "$h" --yes --force)"
  ok "is left alone, even with --force" test "$(cat "$mine/SKILL.md")" = "my own cook"
  ok "and named" grep -q '^skipped: skills/cook: a link' <<< "$out"
  ok "the other skills still install" test -f "$h/.claude/skills/ship/SKILL.md"
  cp "$ROOT/skills/cook/SKILL.md" "$mine/SKILL.md"; out="$(inst "$ROOT" "$h" --uninstall)"
  ok "uninstall does not empty the linked folder" cmp -s "$ROOT/skills/cook/SKILL.md" "$mine/SKILL.md"
fi

echo "## uninstall"
h="$(newhome)"; mkdir -p "$h/.claude"; printf 'my own line\n' > "$h/.claude/CLAUDE.md"
out="$(inst "$ROOT" "$h" --yes)"
echo "my edit" >> "$h/.claude/skills/ship/SKILL.md"; echo "my settings" >> "$h/.claude/RULES.local.md"
before="$(tree "$h")"; out="$(inst "$ROOT" "$h" --uninstall --dry-run)"
ok "uninstall dry run changes nothing" test "$before" = "$(tree "$h")"
ok "and says would, not uninstalled" grep -q '^would move [0-9]* files' <<< "$out"
no "and does not claim it uninstalled" grep -q '^uninstalled' <<< "$out"
out="$(inst "$ROOT" "$h" --uninstall)"
no "an untouched skill is gone" test -e "$h/.claude/skills/cook"
no "RULES.md is gone" test -e "$h/.claude/RULES.md"
ok "the skill you edited stays" grep -qx 'my edit' "$h/.claude/skills/ship/SKILL.md"
ok "and is named" grep -q 'kept, you edited it: skills.ship.SKILL.md' <<< "$out"
ok "RULES.local.md stays" grep -qx 'my settings' "$h/.claude/RULES.local.md"
ok "the imports are gone, your line stays" test "$(grep -v '^$' "$h/.claude/CLAUDE.md" | tr -d '\r')" = "my own line"
ok "everything it moved is in workflow-backups" test -n "$(find "$h/.claude/workflow-backups" -path '*skills/cook/SKILL.md')"
no "the manifest is gone" test -e "$h/.claude/workflow-manifest"
no "an emptied tools folder is gone" test -e "$h/.claude/tools"
out="$(inst "$ROOT" "$h" --uninstall)"; rc=$?
ok "a second uninstall says nothing is installed and fails" test "$rc" != 0 -a -n "$(grep 'nothing to uninstall' <<< "$out")"
out="$(inst "$ROOT" "$h" --yes)"
ok "installing again after an uninstall works" test -f "$h/.claude/skills/cook/SKILL.md"

echo "## edges"
h="$WORK/a home with spaces"; mkdir -p "$h"; out="$(inst "$ROOT" "$h" --yes)"
ok "a home folder with spaces in its name" matches_source "$h"
h="$(newhome)"; out="$(inst "$ROOT" "$h" --nope)"; rc=$?
ok "an unknown flag is refused" test "$rc" != 0
no "and installs nothing" test -e "$h/.claude/skills/cook"
h="$(newhome)"; out="$(inst "$ROOT" "$h" --status)"
ok "--status on an empty home says none recorded" grep -q 'installed: *none recorded' <<< "$out"
no "--status writes nothing" test -e "$h/.claude"

echo
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
