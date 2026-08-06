#!/usr/bin/env bash
# Runs on the HOST before the container is created (devcontainer.json
# "initializeCommand"), with the workspace folder as cwd.
#
# Purpose: make git work when the workspace is a git worktree. A worktree's
# .git is a file holding an absolute path into the main repo's .git, which
# would not exist inside the container. We write those host paths to
# .devcontainer/.env so docker-compose can bind-mount them at the *same*
# absolute paths, leaving the host repo completely untouched.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE="$(cd "$HERE/.." && pwd)"

if ! git -C "$WORKSPACE" rev-parse --git-dir >/dev/null 2>&1; then
  echo "initialize.sh: $WORKSPACE is not a git repository" >&2
  exit 1
fi

# Absolute path of the shared .git (for a worktree this is the MAIN repo's).
GIT_COMMON_DIR="$(cd "$(git -C "$WORKSPACE" rev-parse --git-common-dir)" && pwd)"

# The host's effective commit identity (usually from ~/.gitconfig, which is
# NOT mounted into the container — see post-create.sh for why). Forwarded so
# post-create.sh can seed the container's own gitconfig with it once; empty if
# the host has none configured, which post-create.sh treats as a no-op.
HOST_GIT_USER_NAME="$(git -C "$WORKSPACE" config --get user.name || true)"
HOST_GIT_USER_EMAIL="$(git -C "$WORKSPACE" config --get user.email || true)"

# The worktree also has to be visible at its original host path: the main repo
# records that path in .git/worktrees/<name>/gitdir, and if it cannot be found
# git treats the worktree as prunable — `git gc` would then delete the shared
# admin directory and break the worktree on the host too.
{
  printf 'GIT_COMMON_DIR=%s\n' "$GIT_COMMON_DIR"
  printf 'LOCAL_WORKSPACE_FOLDER=%s\n' "$WORKSPACE"
  printf 'HOST_GIT_USER_NAME=%s\n' "$HOST_GIT_USER_NAME"
  printf 'HOST_GIT_USER_EMAIL=%s\n' "$HOST_GIT_USER_EMAIL"
} > "$HERE/.env"

# Browsers are shared across every container for this repo, so a new worktree
# does not re-download ~500MB. Creating an existing volume is a no-op.
docker volume create est-playwright-browsers >/dev/null

echo "initialize.sh: git common dir -> $GIT_COMMON_DIR"
