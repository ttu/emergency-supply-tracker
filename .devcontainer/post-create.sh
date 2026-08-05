#!/usr/bin/env bash
# Runs once after the container is created (see devcontainer.json).
set -euo pipefail

WORKSPACE=/workspaces/emergency-supply-tracker
cd "$WORKSPACE"

echo "==> Claude Code config"
sudo chown -R "$(id -u):$(id -g)" "$HOME/.claude"
if [[ ! -f "$HOME/.claude.json" ]]; then
  echo '{"hasCompletedOnboarding":true,"theme":"dark"}' > "$HOME/.claude.json"
fi

echo "==> jq (primary JSON parser for the git guardrail hook)"
# The hook falls back to node, but keep jq present so the fast path works even
# if node is not on PATH in a non-interactive hook shell.
if ! command -v jq >/dev/null 2>&1; then
  sudo apt-get update -qq && sudo apt-get install -y -qq jq
fi

echo "==> Playwright browsers"
# The base image ships browsers at $PLAYWRIGHT_BROWSERS_PATH (/ms-playwright).
# It is a named volume, so make it writable in case a browser is added later.
sudo chown -R "$(id -u):$(id -g)" "${PLAYWRIGHT_BROWSERS_PATH:-/ms-playwright}"
# Run the locally installed binary rather than `npx`, which would happily fetch
# and execute an arbitrary remote package. Usually a no-op: the image tag is
# pinned to the same Playwright version as package.json, so the browser is
# already present. No --with-deps either; the image has the OS-level deps.
./node_modules/.bin/playwright install chromium
# @playwright/mcp is deliberately NOT pre-fetched here: .mcp.json resolves it as
# `@latest` at runtime, so pre-installing would mean executing an unpinned
# package's lifecycle scripts during container build. It downloads whatever
# browser build it needs on first use. Pin the version in .mcp.json if you want
# that to be deterministic.

echo "==> Verifying git works (worktrees need the mounts from initialize.sh)"
if ! git -C "$WORKSPACE" rev-parse --git-dir >/dev/null 2>&1; then
  echo "FAIL: git is not usable inside the container." >&2
  echo "      If this workspace is a git worktree, its .git file points at a host" >&2
  echo "      path that must be bind-mounted. Check that .devcontainer/.env exists" >&2
  echo "      and rebuild the container so initialize.sh runs." >&2
  exit 1
fi
# If this checkout is a worktree, the main repo records a back-pointer to its
# host path. When that path is not visible here git treats the worktree as
# prunable, and a gc would delete the shared admin dir — breaking it on the host
# too. Check only THIS worktree: the repo's other worktrees are legitimately not
# mounted, which is why gc is disabled via GIT_CONFIG_* in devcontainer.json.
ADMIN_DIR=$(git -C "$WORKSPACE" rev-parse --absolute-git-dir)
if [[ -f "$ADMIN_DIR/gitdir" ]]; then
  BACK_POINTER=$(cat "$ADMIN_DIR/gitdir")
  if [[ ! -e "$BACK_POINTER" ]]; then
    echo "FAIL: this worktree is not visible at its recorded path:" >&2
    echo "        $BACK_POINTER" >&2
    echo "      The LOCAL_WORKSPACE_FOLDER bind mount is missing, so git would treat" >&2
    echo "      this worktree as prunable and a gc could corrupt it on the host." >&2
    echo "      Check .devcontainer/.env and rebuild the container." >&2
    exit 1
  fi
  echo "    worktree back-pointer OK"
fi
echo "    git OK ($(git -C "$WORKSPACE" rev-parse --git-common-dir))"

echo "==> Pinning container to its own branch"
# The guardrail hook reads this file and refuses to touch any other branch.
# It only exists inside the container, so host work is unaffected.
CONTAINER_BRANCH=$(git -C "$WORKSPACE" rev-parse --abbrev-ref HEAD)
if [[ -z "$CONTAINER_BRANCH" || "$CONTAINER_BRANCH" == "HEAD" ]]; then
  echo "FAIL: could not determine the current branch to pin to" >&2
  exit 1
fi
printf '%s\n' "$CONTAINER_BRANCH" > "$HOME/.devcontainer-allowed-branch"
echo "    confined to branch '$CONTAINER_BRANCH'"

echo "==> Verifying git guardrail hook is active"
GUARD="$WORKSPACE/.claude/hooks/block-dangerous-git.sh"
if [[ ! -x "$GUARD" ]]; then
  echo "FAIL: $GUARD missing or not executable" >&2
  exit 1
fi
set +e
# Must block a force-push...
printf '%s' '{"tool_input":{"command":"git push --force"}}' | bash "$GUARD" >/dev/null 2>&1
blocked=$?
# ...must block a push to a branch this container is not pinned to...
printf '%s' '{"tool_input":{"command":"git push origin some-other-branch"}}' | bash "$GUARD" >/dev/null 2>&1
off_branch=$?
# ...and must still allow ordinary read-only work.
printf '%s' '{"tool_input":{"command":"git status"}}' | bash "$GUARD" >/dev/null 2>&1
allowed=$?
set -e
if [[ "$blocked" -ne 2 || "$off_branch" -ne 2 || "$allowed" -ne 0 ]]; then
  echo "FAIL: git guardrail self-test failed (force-push=$blocked want 2," >&2
  echo "      off-branch push=$off_branch want 2, read-only=$allowed want 0)" >&2
  exit 1
fi
echo "    git guardrail OK (blocks force-push and off-branch push, allows read-only)"

echo "==> Node version"
echo "    node $(node -v) / npm $(npm -v)"

echo "==> Dev container ready"
