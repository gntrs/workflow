#!/usr/bin/env bash
# a PreToolUse hook on Bash: install a project's dependencies before a command that needs
# them runs. it runs the project's own install (npm ci, pnpm install ...), postinstall scripts included. without this, a fresh clone answers "tsup: command not found",
# "vite: command not found", and so on, because the binary lives in
# node_modules/.bin and node_modules was never created.
#
# only fires when: the command looks like it needs a local js toolchain, the
# nearest package.json has no node_modules beside it, and a package manager is
# on PATH. otherwise it exits 0 and stays out of the way.

set -uo pipefail

input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // ""')
dir=$(printf '%s' "$input" | jq -r '.cwd // ""')
[ -n "$dir" ] && [ -d "$dir" ] || dir=$PWD

# the command has to be one that reaches for a locally installed binary.
printf '%s' "$cmd" | grep -Eq \
  '(^|[;&|(][[:space:]]*|[[:space:]])(npm|npx|pnpm|pnpx|yarn|tsc|tsup|tsx|vite|vitest|jest|eslint|prettier|next|astro|nest|storybook)([[:space:]]|$)' \
  || exit 0

# an install command is the thing we would run anyway. let it through.
printf '%s' "$cmd" | grep -Eq '(npm|pnpm|yarn|bun)[[:space:]]+(ci|i|install|add)([[:space:]]|$)' && exit 0

# walk up to the nearest package.json, stopping at home or root.
root=$dir
while [ ! -f "$root/package.json" ]; do
  parent=$(dirname "$root")
  [ "$parent" = "$root" ] && exit 0
  [ "$root" = "$HOME" ] && exit 0
  root=$parent
done

[ -d "$root/node_modules" ] && exit 0

# match the package manager to the lockfile that is actually committed.
if [ -f "$root/pnpm-lock.yaml" ] && command -v pnpm >/dev/null 2>&1; then
  install=(pnpm install --frozen-lockfile)
elif [ -f "$root/yarn.lock" ] && command -v yarn >/dev/null 2>&1; then
  install=(yarn install --frozen-lockfile)
elif [ -f "$root/bun.lockb" ] && command -v bun >/dev/null 2>&1; then
  install=(bun install --frozen-lockfile)
elif [ -f "$root/package-lock.json" ] && command -v npm >/dev/null 2>&1; then
  install=(npm ci)
elif command -v npm >/dev/null 2>&1; then
  install=(npm install)
else
  exit 0
fi

log=$(cd "$root" && "${install[@]}" 2>&1)
status=$?

# npm ci refuses when the lockfile drifted from package.json. a plain install
# fixes that and is still what a person would type next.
if [ $status -ne 0 ] && [ "${install[0]}" = "npm" ] && [ "${install[1]}" = "ci" ]; then
  log=$(cd "$root" && npm install 2>&1)
  status=$?
fi

if [ $status -eq 0 ]; then
  jq -n --arg r "$root" --arg c "${install[*]}" \
    '{systemMessage: ("node_modules was missing in " + $r + ", ran " + $c)}'
else
  tail=$(printf '%s' "$log" | tail -5)
  jq -n --arg r "$root" --arg t "$tail" \
    '{systemMessage: ("could not install dependencies in " + $r + "\n" + $t)}'
fi
exit 0
