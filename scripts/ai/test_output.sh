#!/bin/bash
# test_output.sh - Generate TEST_FAILURES.md from test output
# Hook type: PostToolUse (Bash) or manual
#
# Parses test output and generates a structured markdown file with failures.
# Usage:
#   As hook: Auto-runs after test commands
#   Manual:  npm test 2>&1 | ./scripts/ai/test_output.sh
#
# NOTE: For playwright tests, pipe the output to ensure the hook receives it:
#   npx playwright test ... 2>&1 | cat

set -uo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
cd "$PROJECT_DIR" || exit 0

OUT="TEST_FAILURES.md"
MAX_LINES=200

# Read input
INPUT=$(cat 2>/dev/null || true)

# Check if input is JSON (hook mode)
if echo "$INPUT" | jq -e '.tool_name' &>/dev/null; then
    COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
    # Claude Code hooks use tool_response, not tool_output
    STDOUT=$(echo "$INPUT" | jq -r '.tool_response.stdout // empty')
    STDERR=$(echo "$INPUT" | jq -r '.tool_response.stderr // empty')

    # Only process test commands
    if ! echo "$COMMAND" | grep -qE "npm (test|run test)|vitest|jest|playwright"; then
        exit 0
    fi

    TEST_OUTPUT="${STDOUT}${STDERR}"

    # No exit_code available in hook response, detect failure from content
    # If no failure indicators found, assume tests passed
    if ! echo "$TEST_OUTPUT" | grep -qiE "fail|error|✕|×|[0-9]+ failed"; then
        rm -f "$OUT"
        exit 0
    fi
else
    # Manual mode - raw test output
    TEST_OUTPUT="$INPUT"
fi

# No input
if [ -z "$TEST_OUTPUT" ]; then
    echo "Usage: npm test 2>&1 | ./scripts/ai/test_output.sh" >&2
    exit 0
fi

# Check for failures
if ! echo "$TEST_OUTPUT" | grep -qiE "fail|error|✕|×|[0-9]+ failed"; then
    rm -f "$OUT"
    exit 0
fi

# Start the file
{
    echo "# Test Failures"
    echo
    echo "Generated: $(date -Iseconds)"
    echo
} > "$OUT"

# Detect and parse by test runner
parse_vitest() {
    local output="$1"
    echo "## Vitest Failures" >> "$OUT"
    echo >> "$OUT"

    # Extract failed test files
    echo "### Failed Files" >> "$OUT"
    echo "$output" | grep -E "^ FAIL " | while read -r line; do
        echo "- \`${line#* FAIL }\`" >> "$OUT"
    done
    echo >> "$OUT"

    # Extract error details
    echo "### Error Details" >> "$OUT"
    echo '```' >> "$OUT"
    echo "$output" | grep -A 20 "AssertionError\|Error:\|Expected\|Received\|✕" | head -100 >> "$OUT"
    echo '```' >> "$OUT"
    echo >> "$OUT"
}

parse_jest() {
    local output="$1"
    echo "## Jest Failures" >> "$OUT"
    echo >> "$OUT"

    # Extract failed tests
    echo "### Failed Tests" >> "$OUT"
    echo "$output" | grep -E "^.*FAIL.*\.(test|spec)\.(ts|tsx|js|jsx)" | while read -r line; do
        echo "- \`$line\`" >> "$OUT"
    done
    echo >> "$OUT"

    # Extract error details
    echo "### Error Details" >> "$OUT"
    echo '```' >> "$OUT"
    echo "$output" | grep -A 15 "● \|Expected\|Received\|Error:" | head -100 >> "$OUT"
    echo '```' >> "$OUT"
    echo >> "$OUT"
}

parse_playwright() {
    local output="$1"
    echo "## Playwright Failures" >> "$OUT"
    echo >> "$OUT"

    # Extract failed tests
    echo "### Failed Tests" >> "$OUT"
    echo "$output" | grep -E "^\s*\d+\).*›|failed" | while read -r line; do
        echo "- $line" >> "$OUT"
    done
    echo >> "$OUT"

    # Extract error details
    echo "### Error Details" >> "$OUT"
    echo '```' >> "$OUT"
    echo "$output" | grep -A 10 "Error:\|Timeout\|Expected\|Received\|Locator\|strict mode violation" | head -100 >> "$OUT"
    echo '```' >> "$OUT"
    echo >> "$OUT"

    # Extract failed test locations
    echo "### Failed Locations" >> "$OUT"
    echo '```' >> "$OUT"
    echo "$output" | grep -E "at .*\.spec\.(ts|js):\d+" | head -20 >> "$OUT"
    echo '```' >> "$OUT"
    echo >> "$OUT"
}

parse_generic() {
    local output="$1"
    echo "## Test Output (last $MAX_LINES lines)" >> "$OUT"
    echo >> "$OUT"
    echo '```' >> "$OUT"
    echo "$output" | tail -n "$MAX_LINES" >> "$OUT"
    echo '```' >> "$OUT"
    echo >> "$OUT"
}

# Detect runner and parse
PARSED=false

if echo "$TEST_OUTPUT" | grep -qE "FAIL.*vitest|vitest.*FAIL"; then
    parse_vitest "$TEST_OUTPUT"
    PARSED=true
fi

if echo "$TEST_OUTPUT" | grep -qE "Jest|FAIL.*\.(test|spec)\.(ts|tsx|js|jsx)"; then
    parse_jest "$TEST_OUTPUT"
    PARSED=true
fi

if echo "$TEST_OUTPUT" | grep -qE "playwright|Running.*tests.*using|\.spec\.ts"; then
    parse_playwright "$TEST_OUTPUT"
    PARSED=true
fi

# Fallback to generic if no specific runner detected
if [ "$PARSED" = "false" ]; then
    parse_generic "$TEST_OUTPUT"
fi

# Add footer
{
    echo "---"
    echo "Fix the failures above, then re-run tests."
} >> "$OUT"

echo "Test failures saved to: $OUT" >&2
exit 0
