#!/usr/bin/env bash
# Runs once after the container is created (see devcontainer.json).
set -euo pipefail

WORKSPACE=/workspaces/emergency-supply-tracker
cd "$WORKSPACE"

echo "==> Claude Code config"
sudo chown -R "$(id -u):$(id -g)" "$HOME/.claude"
if [ ! -f "$HOME/.claude.json" ]; then
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
# It is a named volume, so make it writable for browser additions below.
sudo chown -R "$(id -u):$(id -g)" "${PLAYWRIGHT_BROWSERS_PATH:-/ms-playwright}"
# No --with-deps: the base image already has every OS-level browser dependency.
npx playwright install chromium
# @playwright/mcp pins its own Playwright version, which may want a different
# browser build than the repo's (see .mcp.json).
npx --yes --package @playwright/mcp@latest -- playwright install chromium

echo "==> Pinning container to its own branch"
# The guardrail hook reads this file and refuses pushes to any other branch.
# It only exists inside the container, so host work is unaffected.
CONTAINER_BRANCH=$(git -C "$WORKSPACE" rev-parse --abbrev-ref HEAD)
if [ -z "$CONTAINER_BRANCH" ] || [ "$CONTAINER_BRANCH" = "HEAD" ]; then
  echo "FAIL: could not determine the current branch to pin to" >&2
  exit 1
fi
printf '%s\n' "$CONTAINER_BRANCH" > "$HOME/.devcontainer-allowed-branch"
echo "    pushes restricted to '$CONTAINER_BRANCH'"

echo "==> Verifying git guardrail hook is active"
GUARD="$WORKSPACE/.claude/hooks/block-dangerous-git.sh"
if [ ! -x "$GUARD" ]; then
  echo "FAIL: $GUARD missing or not executable" >&2
  exit 1
fi
# Must block a push...
set +e
printf '%s' '{"tool_input":{"command":"git push origin main"}}' | bash "$GUARD" >/dev/null 2>&1
blocked=$?
# ...and must not block a read-only command.
printf '%s' '{"tool_input":{"command":"git status"}}' | bash "$GUARD" >/dev/null 2>&1
allowed=$?
set -e
if [ "$blocked" -ne 2 ] || [ "$allowed" -ne 0 ]; then
  echo "FAIL: git guardrail self-test failed (block=$blocked want 2, allow=$allowed want 0)" >&2
  exit 1
fi
echo "    git guardrail OK (blocks push/commit, allows read-only git)"

echo "==> Node version"
echo "    node $(node -v) / npm $(npm -v)"

echo "==> Dev container ready"
