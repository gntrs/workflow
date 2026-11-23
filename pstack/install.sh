#!/usr/bin/env bash
# installs open-pstack (MIT, github.com/ericlitman/open-pstack) as a claude code plugin, pinned to one tag.
# optional: every skill in this repo says what it does without pstack. safe to run again.
set -euo pipefail
TAG="v1.21.0"
command -v claude >/dev/null 2>&1 || { echo "claude cli not found, install Claude Code first" >&2; exit 1; }
# an install from an older pin keeps its marketplace entry, and add alone would leave it there: drop the entry, add it at this tag
if claude plugin marketplace list 2>/dev/null | grep -q open-pstack; then
  claude plugin marketplace remove open-pstack || true
fi
claude plugin marketplace add "https://github.com/ericlitman/open-pstack.git#${TAG}"
claude plugin install pstack@open-pstack
claude plugin update pstack@open-pstack || true
# setup copies models.md to ~/.claude/skills/pstack/models.md. CLAUDE.md imports it as @skills/pstack/models.md
mkdir -p "$HOME/.claude"
touch "$HOME/.claude/CLAUDE.md"
grep -q '@skills/pstack/models.md' "$HOME/.claude/CLAUDE.md" || printf '\n@skills/pstack/models.md\n' >> "$HOME/.claude/CLAUDE.md"
claude plugin list 2>/dev/null | grep -i pstack
