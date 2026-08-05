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
