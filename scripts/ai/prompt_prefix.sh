#!/bin/bash
# prompt_prefix.sh - Auto-prepend instructions to user prompts
# Hook type: UserPromptSubmit
#
# Outputs context to be added to the conversation.
# Plain text stdout is added as context when exit code is 0.

set -euo pipefail

# Output plain text - this gets added as context
cat <<'EOF'
Before doing anything: read AI_CONTEXT.md and, if tests are involved, read TEST_FAILURES.md. Do not read coverage/, playwright-report/, test-results/, node_modules/, or lockfiles unless explicitly required.
EOF
