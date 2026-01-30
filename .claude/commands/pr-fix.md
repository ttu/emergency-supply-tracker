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

3. Fetch CodeRabbit review comments from the PR:

   ```bash
   # Get CodeRabbit inline review comments (code suggestions)
   gh api "repos/ttu/emergency-supply-tracker/pulls/{pr_number}/comments" \
     --jq '[.[] | select(.user.login == "coderabbitai[bot]") | {path: .path, line: .line, body: .body}]'

   # Count total CodeRabbit comments
   gh api "repos/ttu/emergency-supply-tracker/pulls/{pr_number}/comments" \
     --jq '[.[] | select(.user.login == "coderabbitai[bot]")] | length'

   # Get CodeRabbit summary comment from issue comments
   gh api "repos/ttu/emergency-supply-tracker/issues/{pr_number}/comments" \
     --jq '[.[] | select(.user.login == "coderabbitai[bot]")] | .[0].body' | head -500
   ```

4. Parse the CodeRabbit comments and identify actionable issues:
   - Bot username is **"coderabbitai[bot]"** (not "coderabbitai")
   - Review comments are in PR comments API (`/pulls/{pr_number}/comments`)
   - Summary is in issue comments API (`/issues/{pr_number}/comments`)
   - Ignore comments where body contains "✅" as they are already resolved
   - Focus on issues marked with severity indicators:
     - 🟠 Major - Should fix
     - 🟡 Minor - Nice to fix
   - Look for `<details><summary>🛠️` sections for suggested fixes

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

   ```bash
   # List all commenters to identify humans vs bots
   gh api "repos/ttu/emergency-supply-tracker/issues/{pr_number}/comments" \
     --jq '[.[].user.login] | unique'

   # Get non-bot comments (filter out known bots)
   gh api "repos/ttu/emergency-supply-tracker/issues/{pr_number}/comments" \
     --jq '[.[] | select(.user.login | IN("coderabbitai[bot]", "codecov[bot]", "sonarqubecloud[bot]", "github-actions[bot]") | not)]'
   ```

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
