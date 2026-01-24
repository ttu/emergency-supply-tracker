#!/bin/bash
# make_ai_context.sh - Generate a tiny repo summary for AI context
# Hook type: SessionStart or manual
#
# Creates AI_CONTEXT.md with essential project info to reduce exploration.
# Run manually: ./scripts/ai/make_ai_context.sh

set -euo pipefail

# Use CLAUDE_PROJECT_DIR if available (hook mode), otherwise current dir
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
cd "$PROJECT_DIR"

OUT="AI_CONTEXT.md"

{
  echo "# AI Context (auto-generated)"
  echo
  echo "## Repo"
  echo "- Root: $(pwd)"
  echo "- Default branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
  echo
  echo "## Recent changes"
  echo '```'
  git --no-pager diff --stat 2>/dev/null | head -20 || echo "No changes"
  echo '```'
  echo

  # Key scripts from package.json
  if [ -f "package.json" ]; then
    echo "## Key scripts"
    echo '```'
    jq -r '.scripts | to_entries | .[:12] | .[] | "\(.key): \(.value | .[0:50])"' package.json 2>/dev/null || echo "No scripts"
    echo '```'
    echo
  fi

  # Testing layout
  echo "## Testing layout"
  echo "- Config files:"
  ls -1 vitest.config.* jest.config.* playwright.config.* 2>/dev/null | sed 's/^/  /' || echo "  None found"
  echo

  # Directory structure (compact)
  echo "## Structure"
  echo '```'
  if command -v tree &>/dev/null; then
    tree -L 2 -d --noreport -I 'node_modules|.git|dist|build|coverage|.next|storybook-static|playwright-report|test-results' 2>/dev/null || echo "."
  else
    find . -maxdepth 2 -type d \( -name node_modules -o -name .git -o -name dist -o -name coverage \) -prune -o -type d -print 2>/dev/null | head -25
  fi
  echo '```'
  echo

  # Features (if feature-slice architecture)
  if [ -d "src/features" ]; then
    echo "## Features"
    for f in src/features/*/; do
      [ -d "$f" ] && echo "- $(basename "$f")"
    done
    echo
  fi

  # Guidance
  echo "## Guidance"
  echo "- **Prefer reading:** AI_CONTEXT.md, TEST_FAILURES.md, DECISIONS.md"
  echo "- **Avoid reading:** node_modules, lockfiles, coverage, playwright-report, test-results"

} > "$OUT"

echo "Generated: $OUT" >&2
