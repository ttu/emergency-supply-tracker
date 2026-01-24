#!/bin/bash
# make_decision.sh - Generate session state before context compaction
# Hook type: PreCompact or manual
#
# Creates DECISION.md with current work state for session continuity.
# Run manually: ./scripts/ai/make_decision.sh

set -euo pipefail

# Read hook input from stdin if available (PreCompact provides JSON)
HOOK_INPUT=""
if [ ! -t 0 ]; then
  HOOK_INPUT=$(cat)
fi

# Use CLAUDE_PROJECT_DIR if available (hook mode), otherwise current dir
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
cd "$PROJECT_DIR"

OUT="DECISION.md"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Get trigger type from hook input
TRIGGER="manual"
if [ -n "$HOOK_INPUT" ]; then
  TRIGGER=$(echo "$HOOK_INPUT" | jq -r '.trigger // "unknown"' 2>/dev/null || echo "unknown")
fi

{
  echo "# Decision Log"
  echo
  echo "> Auto-generated before context compaction. Read this to continue the session."
  echo "> Generated: $TIMESTAMP (trigger: $TRIGGER)"
  echo

  # Current branch and status
  echo "## Current State"
  echo
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
  echo "- **Branch:** \`$BRANCH\`"

  # Check for uncommitted changes
  if git diff --quiet 2>/dev/null && git diff --cached --quiet 2>/dev/null; then
    echo "- **Uncommitted changes:** No"
  else
    echo "- **Uncommitted changes:** Yes"
  fi
  echo

  # Modified files
  echo "## Modified Files"
  echo
  echo '```'
  git status --short 2>/dev/null | head -30 || echo "No changes"
  echo '```'
  echo

  # Diff stats
  echo "## Changes Summary"
  echo
  echo '```'
  git diff --stat 2>/dev/null | head -25 || echo "No diff"
  echo '```'
  echo

  # Recent commits on this branch (if not main)
  if [ "$BRANCH" != "main" ] && [ "$BRANCH" != "master" ]; then
    echo "## Branch Commits"
    echo
    echo '```'
    git log --oneline main.."$BRANCH" 2>/dev/null | head -10 || \
    git log --oneline master.."$BRANCH" 2>/dev/null | head -10 || \
    git log --oneline -5 2>/dev/null || echo "No commits"
    echo '```'
    echo
  fi

  # Staged files (ready to commit)
  STAGED=$(git diff --cached --name-only 2>/dev/null)
  if [ -n "$STAGED" ]; then
    echo "## Staged for Commit"
    echo
    echo '```'
    echo "$STAGED"
    echo '```'
    echo
  fi

  # Recently modified files (by timestamp)
  echo "## Recently Modified"
  echo
  echo '```'
  find . -type f -mmin -60 \
    -not -path './node_modules/*' \
    -not -path './.git/*' \
    -not -path './dist/*' \
    -not -path './coverage/*' \
    -not -path './playwright-report/*' \
    -not -path './test-results/*' \
    -not -path './storybook-static/*' \
    -not -name '*.log' \
    -not -name 'AI_CONTEXT.md' \
    -not -name 'DECISION.md' \
    -not -name 'TEST_FAILURES.md' \
    2>/dev/null | head -20 || echo "None found"
  echo '```'
  echo

  # Next steps placeholder
  echo "## Next Steps"
  echo
  echo "<!-- Add context about what to do next -->"
  echo
  echo "1. Review modified files above"
  echo "2. Check if changes need to be committed"
  echo "3. Continue with the task in progress"
  echo

  # Key files hint
  echo "## Key Files to Review"
  echo
  echo "- Check \`git diff\` for detailed changes"
  echo "- Check \`AI_CONTEXT.md\` for project structure"
  echo "- Check \`TEST_FAILURES.md\` if tests were run"

} > "$OUT"

echo "Generated: $OUT" >&2
