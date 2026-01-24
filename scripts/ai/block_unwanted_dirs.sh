#!/bin/bash
# block_unwanted_dirs.sh - Block reads from directories that bloat context
# Hook type: PreToolUse (Read, Glob, Grep)
#
# Prevents Claude from reading large generated directories that waste tokens.
# Configure BLOCKED_DIRS to customize which directories to block.

set -euo pipefail

# Directories to block (patterns)
BLOCKED_DIRS=(
    "node_modules"
    ".git"
    "dist"
    "build"
    "coverage"
    ".next"
    ".nuxt"
    ".output"
    ".cache"
    ".turbo"
    ".parcel-cache"
    ".vite"
    "storybook-static"
    ".storybook/static"
    "__pycache__"
    ".pytest_cache"
    "venv"
    ".venv"
    "vendor"
    ".terraform"
    ".serverless"
)

# Read the tool input from stdin
INPUT=$(cat)

# Extract the tool name and file path from JSON input
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')
PATTERN=$(echo "$INPUT" | jq -r '.tool_input.pattern // empty')

# Only check Read, Glob, Grep tools
case "$TOOL_NAME" in
    Read|Glob|Grep)
        ;;
    *)
        exit 0
        ;;
esac

# Determine the path to check
CHECK_PATH="${FILE_PATH:-$PATTERN}"

if [ -z "$CHECK_PATH" ]; then
    exit 0
fi

# Check if path contains any blocked directory
for blocked in "${BLOCKED_DIRS[@]}"; do
    if [[ "$CHECK_PATH" == *"/$blocked/"* ]] || [[ "$CHECK_PATH" == *"/$blocked" ]] || [[ "$CHECK_PATH" == "$blocked/"* ]] || [[ "$CHECK_PATH" == "$blocked" ]]; then
        cat <<EOF
{
  "decision": "block",
  "message": "Blocked: '$blocked' directory wastes context tokens. Use specific file paths or AI_CONTEXT.md instead."
}
EOF
        exit 0
    fi
done

# Allow the operation
exit 0
