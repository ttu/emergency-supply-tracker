---
description: Fix CodeRabbit review issues from the current PR
allowed-tools: Bash(git:*), Bash(gh:*), Read, Edit, Write, Glob, Grep
---

# Fix PR Review Issues

Read CodeRabbit review comments from the current PR and fix the issues.

## Instructions

1. Get the current branch and find the associated PR:
   ```bash
   git branch --show-current
   gh pr view --json number,url
   ```

2. Fetch all review comments from the PR:
   ```bash
   gh api repos/{owner}/{repo}/pulls/{pr_number}/comments
   ```

3. Also check the PR reviews for inline comments:
   ```bash
   gh pr view {pr_number} --json reviews,comments
   ```

4. Parse the CodeRabbit comments and identify actionable issues:
   - Look for comments from "coderabbitai" or containing CodeRabbit suggestions
   - Ignore comments marked with "✅ Addressed" as they are already resolved
   - Focus on unresolved issues that require code changes

5. For each issue:
   - Read the relevant file
   - Understand the suggested fix
   - Apply the fix
   - Mark the issue as addressed in your response

6. After fixing all issues:
   - Run `/verify quick` to check lint and types
   - Commit the fixes with message: `fix: address CodeRabbit review feedback`
   - Optionally run `/verify` for full verification if requested

## Safety Rules

- **NEVER** perform git write operations on `main` branch
- Always verify changes don't break existing functionality
- If a suggestion seems wrong or would break functionality, explain why and skip it

## Notes

- Group related fixes into logical commits if there are many changes
- If `$ARGUMENTS` contains a PR number, use that instead of the current branch's PR
- Report which issues were fixed and which were skipped (with reasons)
