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
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKTREE_DIR="${REPO_DIR}/.worktrees/${BRANCH_NAME}"

mkdir -p "${REPO_DIR}/.worktrees"
echo "Creating worktree at ${WORKTREE_DIR} with branch ${BRANCH_NAME}..."
git worktree add "${WORKTREE_DIR}" -b "${BRANCH_NAME}"

# Copy AGENTS.local.md if it exists
if [ -f "${REPO_DIR}/AGENTS.local.md" ]; then
  echo "Copying AGENTS.local.md to worktree..."
  cp "${REPO_DIR}/AGENTS.local.md" "${WORKTREE_DIR}/AGENTS.local.md"
fi

# Copy entire .claude directory if it exists (includes settings, agents, commands, etc.)
if [ -d "${REPO_DIR}/.claude" ]; then
  echo "Copying .claude directory to worktree..."
  # Remove destination if it exists to avoid nested directories
  [ -d "${WORKTREE_DIR}/.claude" ] && rm -rf "${WORKTREE_DIR}/.claude"
  cp -r "${REPO_DIR}/.claude" "${WORKTREE_DIR}/.claude"
fi

# Copy entire .cursor directory if it exists (includes rules, settings, etc.)
if [ -d "${REPO_DIR}/.cursor" ]; then
  echo "Copying .cursor directory to worktree..."
  # Remove destination if it exists to avoid nested directories
  [ -d "${WORKTREE_DIR}/.cursor" ] && rm -rf "${WORKTREE_DIR}/.cursor"
  cp -r "${REPO_DIR}/.cursor" "${WORKTREE_DIR}/.cursor"
fi

# Install dependencies
echo "Installing dependencies..."
cd "${WORKTREE_DIR}" && npm install

echo ""
echo "Done! Worktree created at: ${WORKTREE_DIR}"
echo "To switch to it: cd ${WORKTREE_DIR}"
