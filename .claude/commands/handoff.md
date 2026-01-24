---
description: Create handoff document for session continuity
allowed-tools: Read, Write, Glob, Grep, Bash(git status:*), Bash(git log:*), Bash(git diff:*)
---

# Handoff Document Generator

Write or update a handoff document so the next agent with fresh context can continue this work.

## Instructions

### Step 1: Check for Existing Handoff

First, check if `HANDOFF.md` already exists in the project root:

```bash
ls -la HANDOFF.md 2>/dev/null
```

If it exists, read it first to understand prior context before updating. This helps preserve history and avoid losing valuable information about what didn't work.

### Step 2: Gather Context

Collect information about the current session:

1. **Check git status** for current changes:

   ```bash
   git status
   git diff --stat
   ```

2. **Review recent conversation context** - What was the user trying to accomplish? What files were modified?

3. **If existing HANDOFF.md**, note what has changed since the last handoff

### Step 3: Create/Update HANDOFF.md

Create or update the document with these sections:

```markdown
# Handoff Document

> Auto-generated session handoff. Start your next session by reading this file.

## Goal

[What we're trying to accomplish - the high-level objective]

## Current Progress

[What's been done so far - be specific about completed tasks]

- ✅ [Completed task 1]
- ✅ [Completed task 2]
- 🔄 [In-progress task]
- ⬜ [Not started yet]

## What Worked

[Approaches that succeeded - so they can be built upon]

- [Successful approach 1]
- [Successful approach 2]

## What Didn't Work

[Approaches that failed - so they're not repeated]

- ❌ [Failed approach 1] - [Why it failed]
- ❌ [Failed approach 2] - [Why it failed]

## Current State

[The state of the codebase/files right now]

- Modified files: [list]
- Uncommitted changes: [yes/no]
- Current branch: [branch name]

## Next Steps

[Clear action items for continuing - prioritized]

1. [Most important next step]
2. [Second priority]
3. [Third priority]

## Key Files

[Files that are most relevant to this work]

- `path/to/file1` - [why it's relevant]
- `path/to/file2` - [why it's relevant]

## Notes

[Any other context that would help the next session]
```

### Step 4: Save and Report

1. Save the document as `HANDOFF.md` in the project root
2. Tell the user: "Handoff document saved to `HANDOFF.md`. Start your next session with: 'Continue from HANDOFF.md'"

## Guidelines

- **Be concise but complete** - Include enough context to resume without re-exploring
- **Prioritize actionable information** - What does the next agent need to DO?
- **Preserve failure history** - Don't lose knowledge about what didn't work
- **Include file paths** - Make it easy to navigate to relevant code
- **Note blockers** - If something is blocked on user input or external factors, say so

## Arguments

- No arguments: Create/update handoff document based on current session
- `$ARGUMENTS` can include specific notes to add to the handoff

## Example Output

After running `/handoff`:

```
Handoff document saved to `HANDOFF.md`

Summary:
- Goal: Implement user authentication
- Progress: 3/5 tasks complete
- Next: Add session timeout handling

Start your next session with: "Continue from HANDOFF.md"
```
