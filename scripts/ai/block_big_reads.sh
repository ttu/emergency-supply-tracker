#!/bin/bash
# block_big_reads.sh - Stop token explosions from large file reads
# Hook type: PreToolUse (Read)
#
# Blocks reading files that are too large and would waste context tokens.
# Configure MAX_LINES and MAX_SIZE_KB to customize thresholds.

set -euo pipefail

# Thresholds
MAX_LINES="${MAX_LINES:-2000}"          # Max lines to allow
MAX_SIZE_KB="${MAX_SIZE_KB:-100}"       # Max file size in KB
WARN_LINES="${WARN_LINES:-500}"         # Warn above this many lines

# File types that are always blocked (binary, generated, etc.)
BLOCKED_EXTENSIONS=(
    ".min.js"
    ".min.css"
    ".map"
    ".lock"
    ".svg"
    ".png"
    ".jpg"
    ".jpeg"
    ".gif"
    ".ico"
    ".woff"
    ".woff2"
    ".ttf"
    ".eot"
    ".pdf"
    ".zip"
    ".tar"
    ".gz"
    ".exe"
    ".dll"
    ".so"
    ".dylib"
)

# Files that are always blocked by name
BLOCKED_FILES=(
    "package-lock.json"
    "yarn.lock"
    "pnpm-lock.yaml"
    "composer.lock"
    "Cargo.lock"
    "Gemfile.lock"
    "poetry.lock"
)

# Read the tool input from stdin
INPUT=$(cat)

# Extract tool info
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only check Read tool
if [ "$TOOL_NAME" != "Read" ] || [ -z "$FILE_PATH" ]; then
    exit 0
fi

# Check blocked extensions
for ext in "${BLOCKED_EXTENSIONS[@]}"; do
    if [[ "$FILE_PATH" == *"$ext" ]]; then
        cat <<EOF
{
  "decision": "block",
  "message": "Blocked: '$ext' files are binary/generated. Use a specific tool or skip."
}
EOF
        exit 0
    fi
done

# Check blocked files by name
FILENAME=$(basename "$FILE_PATH")
for blocked in "${BLOCKED_FILES[@]}"; do
    if [ "$FILENAME" = "$blocked" ]; then
        cat <<EOF
{
  "decision": "block",
  "message": "Blocked: '$blocked' is a lock file with thousands of lines. Not useful for context."
}
EOF
        exit 0
    fi
done

# Check if file exists
if [ ! -f "$FILE_PATH" ]; then
    exit 0  # Let the tool handle non-existent files
fi

# Check file size
FILE_SIZE_KB=$(du -k "$FILE_PATH" 2>/dev/null | cut -f1 || echo "0")
if [ "$FILE_SIZE_KB" -gt "$MAX_SIZE_KB" ]; then
    cat <<EOF
{
  "decision": "block",
  "message": "Blocked: File is ${FILE_SIZE_KB}KB (max: ${MAX_SIZE_KB}KB). Use 'Read' with offset/limit."
}
EOF
    exit 0
fi

# Check line count
LINE_COUNT=$(wc -l < "$FILE_PATH" 2>/dev/null | tr -d ' ' || echo "0")
if [ "$LINE_COUNT" -gt "$MAX_LINES" ]; then
    cat <<EOF
{
  "decision": "block",
  "message": "Blocked: File has ${LINE_COUNT} lines (max: ${MAX_LINES}). Use 'Read' with offset/limit."
}
EOF
    exit 0
fi

# Allow the read
exit 0
