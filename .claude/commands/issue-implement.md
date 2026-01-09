---
description: Implement a GitHub issue (accepts issue number or URL)
allowed-tools: Bash(git:*), Bash(gh:*), Read, Edit, Write, Glob, Grep, Task, WebFetch
---

# Implement GitHub Issue

Analyze and implement a GitHub issue. Accepts either an issue number or full GitHub URL.

## Arguments

`$ARGUMENTS` - Issue number (e.g., `42`) or GitHub URL (e.g., `https://github.com/owner/repo/issues/42`)

## Instructions

1. **Parse the input** to extract the issue number:
   - If `$ARGUMENTS` is a number, use it directly
   - If `$ARGUMENTS` is a URL, extract the issue number from the path
   - If no argument provided, ask the user for the issue number

2. **Fetch issue details** using GitHub CLI:

   ```bash
   gh issue view <issue_number> --json title,body,labels,state,comments
   ```

3. **Analyze the issue**:
   - Understand what needs to be implemented
   - Identify relevant files in the codebase
   - Plan the implementation approach

4. **Implement the solution**:
   - Make necessary code changes
   - Follow project conventions (see AGENTS.md)
   - Write tests if applicable
   - Update documentation if needed

5. **Verify the implementation**:
   - Run `/verify` to check lint, tests, and build

6. **Stage and summarize changes**:
   - Stage all changes with `git add -A`
   - Provide a summary of what was done to implement the issue

7. **Reference the issue properly**:
   - Use closing keywords in commit messages: `Closes #<number>` or `Fixes #<number>`
   - Valid closing keywords: `close`, `closes`, `closed`, `fix`, `fixes`, `fixed`, `resolve`, `resolves`, `resolved`
   - When creating a PR for this issue, include the same closing keyword in the PR body

## Safety Rules

- **NEVER** perform git write operations on `main` branch
- Run verification before considering the implementation complete

## Notes

- If the issue is unclear, read comments for additional context
- Use closing keywords (`Closes #<number>`) instead of just `Refs: #<number>` to auto-close the issue when merged
- If the implementation requires multiple steps, use TodoWrite to track progress
- For complex issues, consider using EnterPlanMode first
