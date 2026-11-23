#!/usr/bin/env bash
# writes setup/known-hashes.txt: the sha256 of every version of every installable file that was ever on main.
# the installer uses it to recognise a copy from before installs were tracked (no manifest) as one of its own,
# so an old untouched install updates instead of being skipped as "edited". run it before a release.
set -euo pipefail
cd "$(dirname "$0")/.."
ref="${1:-HEAD}"
sha() { if command -v sha256sum >/dev/null 2>&1; then sha256sum; else shasum -a 256; fi | cut -d' ' -f1; }
git rev-list "$ref" -- skills rules tools pstack | while read -r c; do
  git ls-tree -r "$c" -- skills rules/RULES.md tools pstack | awk '$2=="blob"{print $3}'
done | LC_ALL=C sort -u | while read -r blob; do git cat-file blob "$blob" | sha; done | LC_ALL=C sort -u > setup/known-hashes.txt
wc -l < setup/known-hashes.txt
