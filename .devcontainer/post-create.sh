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

echo "==> GitHub CLI (gh)"
# devcontainer.json forwards GH_EST_TOKEN specifically so `gh` can read/create
# PRs and issues; install it here since no devcontainer feature provides it.
if ! command -v gh >/dev/null 2>&1; then
  sudo apt-get update -qq && sudo apt-get install -y -qq gh
fi

echo "==> CodeRabbit CLI"
# Not a devcontainer feature; the official installer drops the binary (and its
# `cr` alias) into ~/.local/bin, which the base image already puts on PATH.
if ! command -v coderabbit >/dev/null 2>&1; then
  # CI=1 skips the installer's interactive "sign in now?" prompt (there's no
  # TTY in a non-interactive postCreateCommand); auth is handled explicitly
  # below instead, via the forwarded API key.
  CI=1 curl -fsSL https://cli.coderabbit.ai/install.sh | sh
fi
if [[ -n "${CODERABBIT_API_KEY:-}" ]]; then
  if coderabbit auth login --api-key "$CODERABBIT_API_KEY" >/dev/null 2>&1; then
    echo "    authenticated via CODERABBIT_API_KEY"
  else
    echo "FAIL: CODERABBIT_API_KEY is set but the CodeRabbit CLI rejected it." >&2
    echo "      Generate a fresh key at https://app.coderabbit.ai and re-export it." >&2
    exit 1
  fi
else
  echo "    CODERABBIT_API_KEY not set: 'coderabbit review' will prompt to sign in"
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
# @playwright/mcp is deliberately NOT pre-fetched here: pre-installing would
# mean executing its lifecycle scripts during container build. .mcp.json pins
# the version so `npx` resolves a reviewed release rather than whatever is
# newest; it downloads whatever browser build it needs on first use.

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

echo "==> Git identity (seeded from host, container-local only)"
# ~/.gitconfig isn't mounted into the container (see the note below on why git
# config here stays container-local), so commit identity would otherwise be
# unset. initialize.sh captured the host's effective user.name/email into
# .env; seed the container's own gitconfig from them once. Skipped if the
# container already has an identity (e.g. set manually after a rebuild) or if
# the host had none configured either.
if [[ -z "$(git config --global user.name 2>/dev/null || true)" && -n "${HOST_GIT_USER_NAME:-}" ]]; then
  git config --global user.name "$HOST_GIT_USER_NAME"
fi
if [[ -z "$(git config --global user.email 2>/dev/null || true)" && -n "${HOST_GIT_USER_EMAIL:-}" ]]; then
  git config --global user.email "$HOST_GIT_USER_EMAIL"
fi
if git config --global user.name >/dev/null 2>&1; then
  echo "    $(git config --global user.name) <$(git config --global user.email)>"
else
  echo "    no identity on host or in container; commits will fail until 'git config --global user.name/user.email' is set"
fi

echo "==> Git authentication (HTTPS via GH_EST_TOKEN, container-local only)"
# Route all github.com git traffic through HTTPS instead of the SSH agent VS
# Code would otherwise forward, so a token scoped to just this repo — not your
# SSH key's access to every repo you can reach — is what push/fetch actually
# use. `--global` writes to this container's own $HOME/.gitconfig, which is
# not bind-mounted anywhere, so the host's git config and remote stay
# untouched (unlike the shared .git this workspace mounts for worktrees).
git config --global --add url."https://github.com/".insteadOf "git@github.com:"
git config --global --add url."https://github.com/".insteadOf "ssh://git@github.com/"
# `gh`/its git credential helper only recognize the env var names GH_TOKEN or
# GITHUB_TOKEN — GH_EST_TOKEN is this repo's own name (chosen so it can't
# collide with another repo's devcontainer token on the same host), so bridge
# it into the name `gh` actually looks for.
if [[ -n "${GH_EST_TOKEN:-}" ]]; then
  export GH_TOKEN="$GH_EST_TOKEN"
fi
if command -v gh >/dev/null 2>&1 && [[ -n "${GH_TOKEN:-}" ]]; then
  gh auth setup-git
  # `ls-remote` would pass even with an invalid token, since this repo is
  # public and allows anonymous HTTPS reads. `push --dry-run` forces GitHub to
  # actually authenticate the token while still writing nothing, so a bad or
  # under-scoped token is caught here instead of at the first real push.
  if git -C "$WORKSPACE" push --dry-run origin \
      "HEAD:refs/heads/__devcontainer_auth_check__" >/dev/null 2>&1; then
    echo "    git authenticates via GH_EST_TOKEN (gh credential helper) — verified"
  else
    echo "FAIL: GH_EST_TOKEN is set but git could not authenticate to 'origin' over HTTPS." >&2
    echo "      Check the token has at least Contents: Read and write access to this repo." >&2
    exit 1
  fi
else
  echo "    GH_EST_TOKEN not set: git push/fetch to GitHub will fail until it is provided"
fi

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
# Derive a branch name guaranteed to differ from the pinned branch, and encode
# it with jq so the self-test can't break on branch names with special chars.
OFF_BRANCH="${CONTAINER_BRANCH}__guardrail_off_branch_test"
OFF_BRANCH_INPUT=$(jq -cn --arg branch "$OFF_BRANCH" \
  '{tool_input:{command:("git push origin " + $branch)}}')

set +e
# Must block a force-push...
printf '%s' '{"tool_input":{"command":"git push --force"}}' | bash "$GUARD" >/dev/null 2>&1
blocked=$?
# ...must block a push to a branch this container is not pinned to...
printf '%s' "$OFF_BRANCH_INPUT" | bash "$GUARD" >/dev/null 2>&1
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
