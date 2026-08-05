#!/bin/bash

# Create a new git worktree with the given branch name
# Usage: ./new-worktree.sh [--container] <branch-name>

set -e

usage() {
  echo "Usage: $0 [--container] <branch-name>"
  echo "Example: $0 fix-store-selected-language"
  echo "         $0 --container feat-new-thing"
  echo ""
  echo "  --container  Skip the host npm install. The dev container installs"
  echo "               dependencies into its own volume, which shadows any"
  echo "               node_modules created here, so installing twice is waste."
}

USE_CONTAINER=false
BRANCH_NAME=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --container)
      USE_CONTAINER=true
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    -*)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
    *)
      if [[ -n "$BRANCH_NAME" ]]; then
        echo "Unexpected argument: $1"
        usage
        exit 1
      fi
      BRANCH_NAME="$1"
      shift
      ;;
  esac
done

if [[ -z "$BRANCH_NAME" ]]; then
  usage
  exit 1
fi

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKTREE_DIR="${REPO_DIR}/.worktrees/${BRANCH_NAME}"

mkdir -p "${REPO_DIR}/.worktrees"
echo "Creating worktree at ${WORKTREE_DIR} with branch ${BRANCH_NAME}..."
git worktree add "${WORKTREE_DIR}" -b "${BRANCH_NAME}"

# Copy AGENTS.local.md if it exists
if [[ -f "${REPO_DIR}/AGENTS.local.md" ]]; then
  echo "Copying AGENTS.local.md to worktree..."
  cp "${REPO_DIR}/AGENTS.local.md" "${WORKTREE_DIR}/AGENTS.local.md"
fi

# Copy entire .claude directory if it exists (includes settings, agents, commands, etc.)
if [[ -d "${REPO_DIR}/.claude" ]]; then
  echo "Copying .claude directory to worktree..."
  # Remove destination if it exists to avoid nested directories
  [[ -d "${WORKTREE_DIR}/.claude" ]] && rm -rf "${WORKTREE_DIR}/.claude"
  cp -r "${REPO_DIR}/.claude" "${WORKTREE_DIR}/.claude"
fi

# Copy entire .cursor directory if it exists (includes rules, settings, etc.)
if [[ -d "${REPO_DIR}/.cursor" ]]; then
  echo "Copying .cursor directory to worktree..."
  # Remove destination if it exists to avoid nested directories
  [[ -d "${WORKTREE_DIR}/.cursor" ]] && rm -rf "${WORKTREE_DIR}/.cursor"
  cp -r "${REPO_DIR}/.cursor" "${WORKTREE_DIR}/.cursor"
fi

# Install dependencies (the dev container does its own install into a volume)
if [[ "$USE_CONTAINER" = true ]]; then
  echo "Skipping host npm install (--container)."
else
  echo "Installing dependencies..."
  cd "${WORKTREE_DIR}" && npm install
fi

echo ""
echo "Done! Worktree created at: ${WORKTREE_DIR}"
if [[ "$USE_CONTAINER" = true ]]; then
  echo "To open it in the dev container:"
  echo "  code ${WORKTREE_DIR}   # then: Reopen in Container"
else
  echo "To switch to it: cd ${WORKTREE_DIR}"
fi
