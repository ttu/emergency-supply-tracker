#!/bin/bash
# PreToolUse(Bash) guardrail for Claude's Bash tool.
#
# Policy: the agent may do normal, reversible development work — commit, push a
# feature branch, rebase, open a PR. It may not do things that are destructive
# or hard to undo: force-pushing, pushing to main, discarding working-tree
# state, rewriting history, merging or releasing.
#
# This gates the agent only. Humans are unaffected and can run anything.
#
# Fails CLOSED: if the command cannot be parsed, the call is blocked rather
# than allowed. A guardrail that silently no-ops is worse than none.

set -uo pipefail

INPUT=$(cat)

# The dev container's base image has no jq, so fall back to node before giving up.
if command -v jq >/dev/null 2>&1; then
  COMMAND=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')
elif command -v node >/dev/null 2>&1; then
  COMMAND=$(printf '%s' "$INPUT" | node -e \
    'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).tool_input?.command??"")}catch{process.exit(3)}})')
else
  echo "BLOCKED: git guardrail cannot parse tool input (no jq or node available)." >&2
  exit 2
fi

# Empty command means the payload shape changed or parsing failed -> fail closed.
if [[ -z "$COMMAND" ]]; then
  echo "BLOCKED: git guardrail could not read the command; refusing to run it." >&2
  exit 2
fi

# Quoting and shell nesting would otherwise hide a command from the patterns
# below: `bash -c "git push --force"`, `$(git push --force)`, `eval 'git...'`.
# Scanning a copy with quotes stripped and shell metacharacters turned into
# spaces makes those forms match the same patterns as the plain command.
NORMALIZED=$(printf '%s' "$COMMAND" | tr -d '"'"'"'`' | tr '(){};&|<>' '          ')

DANGEROUS_PATTERNS=(
  # --- Destructive to working tree or history (not recoverable from reflog) ---
  'git[[:space:]]+reset[[:space:]]+--hard'
  'git[[:space:]]+clean[[:space:]]+-[a-z]*f'
  'git[[:space:]]+checkout[[:space:]]+\.'
  'git[[:space:]]+restore[[:space:]]+\.'
  'git[[:space:]]+branch[[:space:]]+-[a-z]*d'
  'git[[:space:]]+stash[[:space:]]+(drop|clear)'
  'git[[:space:]]+update-ref'
  'git[[:space:]]+filter-branch'
  'git[[:space:]]+reflog[[:space:]]+(delete|expire)'
  'git[[:space:]]+worktree[[:space:]]+remove'
  # In a worktree-based container only the current worktree is mounted at its
  # host path, so every OTHER worktree looks prunable. Pruning or gc'ing here
  # would delete their admin dirs and break them on the host.
  'git[[:space:]]+worktree[[:space:]]+prune'
  'git[[:space:]]+gc([[:space:]]|$)'
  'git[[:space:]]+prune([[:space:]]|$)'

  # --- Publishing that is hard to undo ---
  # Force-push in any spelling.
  'push[[:space:]].*--force'
  'push[[:space:]]+(.*[[:space:]]+)?-f([[:space:]]|$)'
  '--force-with-lease'
  # Push that targets the default branch, incl. refspec form (HEAD:main).
  'git[[:space:]]+push[[:space:]][^[:space:]]*.*[[:space:]](main|master)([[:space:]]|$)'
  'push[[:space:]].*:(main|master)([[:space:]]|$)'
  # Deleting a remote branch.
  'git[[:space:]]+push[[:space:]].*--delete'
  'git[[:space:]]+push[[:space:]].*[[:space:]]:[^[:space:]]'

  # --- gh: irreversible, or bypasses review ---
  'gh[[:space:]]+pr[[:space:]]+(merge|close)'
  'gh[[:space:]]+release[[:space:]]+(create|delete|edit|upload)'
  'gh[[:space:]]+repo[[:space:]]+(delete|edit|rename|archive|sync)'
  'gh[[:space:]]+workflow[[:space:]]+(run|disable|enable)'
  'gh[[:space:]]+secret[[:space:]]'
  'gh[[:space:]]+auth[[:space:]]+(login|logout|refresh)'
  # Generic API escape hatch: any mutating method, and the -f/-F/--field forms
  # which make `gh api` POST implicitly. `gh api /path` (GET) stays allowed.
  'gh[[:space:]]+api[[:space:]].*(-X|--method)[[:space:]=]*(POST|PUT|PATCH|DELETE)'
  'gh[[:space:]]+api[[:space:]].*[[:space:]](-f|-F|--field|--raw-field)[[:space:]=]'
)

# --- Dev container only: confine the agent to the branch the container was
# created on. post-create.sh writes this file; on the host it does not exist and
# this whole block is skipped, so normal multi-branch work is unaffected.
BRANCH_PIN_FILE="${DEVCONTAINER_BRANCH_PIN:-$HOME/.devcontainer-allowed-branch}"
if [[ -f "$BRANCH_PIN_FILE" ]]; then
  PINNED=$(tr -d '[:space:]' < "$BRANCH_PIN_FILE")
  REPO="${CLAUDE_PROJECT_DIR:-$PWD}"

  # Operations that write refs other than the current branch. Blocking the push
  # target alone is not enough: these alter other branches locally.
  CONTAINER_PATTERNS=(
    # branch create / move / rename / copy (`--list`, `-a`, `-v` stay allowed)
    'git[[:space:]]+branch[[:space:]]+(-[a-z]*(f|m|c)([[:space:]]|$)|--force|--move|--copy)'
    # fetch/pull with a refspec writes local refs directly (origin main:main)
    'git[[:space:]]+(fetch|pull)[[:space:]].*[[:space:]][^[:space:]-][^[:space:]]*:[^[:space:]]'
    'git[[:space:]]+worktree[[:space:]]+(add|move)'
    'git[[:space:]]+symbolic-ref'
    'git[[:space:]]+remote[[:space:]]+(add|remove|rm|set-url|rename)'
  )
  for pattern in "${CONTAINER_PATTERNS[@]}"; do
    if printf '%s' "$COMMAND"    | grep -qEi "$pattern" ||
       printf '%s' "$NORMALIZED" | grep -qEi "$pattern"; then
      echo "BLOCKED: '$COMMAND' matches protected pattern '$pattern'." >&2
      echo "This dev container is confined to branch '$PINNED' and may not alter other branches or remotes." >&2
      exit 2
    fi
  done

  # Leaving the pinned branch would let the agent commit onto another branch.
  # Only ref arguments are blocked; `git checkout -- file` / a path stays fine.
  if printf '%s' "$NORMALIZED" | grep -qEi '(^|[[:space:]])git[[:space:]]+(checkout|switch)([[:space:]]|$)'; then
    if printf '%s' "$NORMALIZED" | grep -qEi '[[:space:]]-[bBcC]([[:space:]]|$)'; then
      echo "BLOCKED: creating a branch is not allowed; this dev container is confined to '$PINNED'." >&2
      exit 2
    fi
    REF=$(printf '%s' "$NORMALIZED" | awk '
      { for (i = 1; i <= NF; i++) if ($i == "checkout" || $i == "switch") { start = i + 1; break } }
      start { for (i = start; i <= NF; i++) { if ($i == "--") exit; if ($i ~ /^-/) continue; print $i; exit } }')
    # A ref that resolves to a commit and is not also an existing path means a
    # real branch switch, rather than `git checkout <file>`.
    if [[ -n "$REF" && "$REF" != "$PINNED" && ! -e "$REPO/$REF" ]] &&
       git -C "$REPO" rev-parse --verify --quiet "${REF}^{commit}" >/dev/null 2>&1; then
      echo "BLOCKED: switching to '$REF' is not allowed; this dev container is confined to '$PINNED'." >&2
      exit 2
    fi
  fi

  # Pull the branch out of the push command: drop `git push`, drop flags and
  # their values, drop the remote, keep what's left. Empty means a bare
  # `git push`, which targets the current branch.
  if printf '%s' "$NORMALIZED" | grep -qEi '(^|[[:space:]])git[[:space:]]+push([[:space:]]|$)'; then
    TARGET=$(printf '%s' "$NORMALIZED" | awk '
      { for (i = 1; i <= NF; i++) if ($i == "push") { start = i + 1; break } }
      start {
        n = 0
        for (i = start; i <= NF; i++) {
          if ($i ~ /^-/) continue   # flags and their values are irrelevant here
          n++
          if (n == 1) continue      # remote name
          print $i; exit
        }
      }')
    case "$TARGET" in
      # Refspec form (HEAD:branch, src:dst) -> the destination is what matters.
      *:*) TARGET=${TARGET##*:} ;;
      # Plain branch name, or empty for a bare `git push`; handled below.
      *) ;;
    esac
    if [[ -z "$TARGET" || "$TARGET" == "HEAD" ]]; then
      TARGET=$(git -C "$REPO" rev-parse --abbrev-ref HEAD 2>/dev/null)
    fi

    if [[ -z "$TARGET" ]]; then
      echo "BLOCKED: could not determine the push target branch; refusing (dev container is pinned to '$PINNED')." >&2
      exit 2
    fi
    if [[ "$TARGET" != "$PINNED" ]]; then
      echo "BLOCKED: this dev container may only push to '$PINNED', but the command targets '$TARGET'." >&2
      echo "Ask the user to push other branches from the host." >&2
      exit 2
    fi
  fi
fi

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  # -i: case-insensitive, so `-X post` / `GIT PUSH --FORCE` cannot slip past.
  if printf '%s' "$COMMAND"    | grep -qEi "$pattern" ||
     printf '%s' "$NORMALIZED" | grep -qEi "$pattern"; then
    echo "BLOCKED: '$COMMAND' matches protected pattern '$pattern'." >&2
    echo "This operation is destructive or hard to undo, and you do not have authority to run it. Ask the user to run it themselves." >&2
    exit 2
  fi
done

exit 0
