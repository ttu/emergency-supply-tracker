#!/bin/bash

# Create a new git worktree with the given branch name
# Usage: ./new-worktree.sh <branch-name>

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <branch-name>"
  echo "Example: $0 fix-store-selected-language"
  exit 1
fi

BRANCH_NAME="$1"
WORKTREE_DIR="../est-${BRANCH_NAME}"
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Creating worktree at ${WORKTREE_DIR} with branch ${BRANCH_NAME}..."
git worktree add "${WORKTREE_DIR}" -b "${BRANCH_NAME}"

# Copy AGENTS.local.md if it exists
if [ -f "${REPO_DIR}/AGENTS.local.md" ]; then
  echo "Copying AGENTS.local.md to worktree..."
  cp "${REPO_DIR}/AGENTS.local.md" "${WORKTREE_DIR}/AGENTS.local.md"
fi

echo ""
echo "Done! Worktree created at: ${WORKTREE_DIR}"
echo "To switch to it: cd ${WORKTREE_DIR}"
