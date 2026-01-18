---
description: Fix PR review issues (CodeRabbit, reviewers, CI failures)
allowed-tools: Bash(git:*), Bash(gh:*), Read, Edit, Write, Glob, Grep, WebFetch
---

# Fix PR Review Issues

Fix all issues from the current PR: CI/CD failures, CodeRabbit comments, SonarCloud issues, Codecov coverage, and human reviewer feedback.

## Order of Checking

When fixing a PR, check these in order:

1. **CI/CD checks** (must all pass)
2. **CodeRabbit review comments** (address all non-nitpick issues)
3. **SonarCloud issues** (fix code smells, bugs, security issues)
4. **Codecov** (ensure coverage thresholds are met)
5. **Human reviewer comments** (if any)

## Instructions

1. Get the current branch and find the associated PR:

   ```bash
   git branch --show-current
   gh pr view --json number,url
   ```

2. Check CI/CD status first:

   ```bash
   gh pr checks {pr_number} --repo ttu/emergency-supply-tracker
   ```

3. Fetch all review comments from the PR:

   ```bash
   gh api repos/ttu/emergency-supply-tracker/pulls/{pr_number}/comments
   gh pr view {pr_number} --json reviews,comments
   ```

4. Parse the CodeRabbit comments and identify actionable issues:
   - Look for comments from "coderabbitai" or containing CodeRabbit suggestions
   - Ignore comments marked with "✅ Addressed" as they are already resolved
   - Focus on unresolved issues that require code changes

5. Check SonarCloud issues:
   - Check the SonarCloud link from `gh pr checks` output
   - Or visit: `https://sonarcloud.io/project/issues?id=ttu_emergency-supply-tracker&pullRequest={pr_number}`
   - Identify code smells, bugs, security hotspots

6. Check Codecov coverage:
   - Check the Codecov link from `gh pr checks` output
   - Look for comments from "codecov" bot
   - Identify files with decreased coverage or uncovered lines
   - Check if new code needs additional tests

7. Check human reviewer comments:
   - Look for comments not from bots (coderabbitai, codecov, sonarcloud)
   - Address requested changes from human reviewers

8. For each issue:
   - Read the relevant file
   - Understand the suggested fix
   - Apply the fix
   - Mark the issue as addressed in your response

9. After fixing all issues:
   - Run `/verify quick` to check lint and types
   - Commit the fixes with appropriate message:
     - `fix: address CodeRabbit review feedback` for CodeRabbit issues
     - `test: improve coverage for <area>` for Codecov issues
     - `fix: address SonarCloud issues` for SonarCloud issues
     - `fix: address review feedback` if fixing multiple sources
   - Optionally run `/verify` for full verification if requested

## Safety Rules

- **NEVER** perform git write operations on `main` branch
- Always verify changes don't break existing functionality
- If a suggestion seems wrong or would break functionality, explain why and skip it

## Notes

- Group related fixes into logical commits if there are many changes
- If `$ARGUMENTS` contains a PR number, use that instead of the current branch's PR
- Report which issues were fixed and which were skipped (with reasons)
