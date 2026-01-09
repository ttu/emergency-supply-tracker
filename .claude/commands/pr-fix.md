---
description: Fix CodeRabbit review issues from the current PR
allowed-tools: Bash(git:*), Bash(gh:*), Read, Edit, Write, Glob, Grep, WebFetch
---

# Fix PR Review Issues

Read CodeRabbit review comments, Codecov coverage reports, and SonarQube issues from the current PR and fix them.

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

5. Check Codecov coverage comments:
   - Look for comments from "codecov" bot
   - Identify files with decreased coverage or uncovered lines
   - Check if new code needs additional tests

6. Check SonarQube issues:
   - Look for comments from "sonarcloud" or "sonarqube" bot
   - Check the SonarQube dashboard link if provided in PR checks
   - Run `gh pr checks {pr_number}` to find SonarQube status and links
   - Identify code smells, bugs, security hotspots, and coverage issues

7. For each issue:
   - Read the relevant file
   - Understand the suggested fix
   - Apply the fix
   - Mark the issue as addressed in your response

8. After fixing all issues:
   - Run `/verify quick` to check lint and types
   - Commit the fixes with appropriate message:
     - `fix: address CodeRabbit review feedback` for CodeRabbit issues
     - `test: improve coverage for <area>` for Codecov issues
     - `fix: address SonarQube issues` for SonarQube issues
     - Or combine: `fix: address review feedback` if fixing multiple sources
   - Optionally run `/verify` for full verification if requested

## Safety Rules

- **NEVER** perform git write operations on `main` branch
- Always verify changes don't break existing functionality
- If a suggestion seems wrong or would break functionality, explain why and skip it

## Notes

- Group related fixes into logical commits if there are many changes
- If `$ARGUMENTS` contains a PR number, use that instead of the current branch's PR
- Report which issues were fixed and which were skipped (with reasons)
