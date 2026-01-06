---
description: Create a pull request for the current branch
allowed-tools: Bash(git:*), Bash(gh:*), Read, Glob, Grep
---

# Create Pull Request

Create a pull request for the current branch following our project conventions.

## Instructions

1. First, gather information about the current branch:
   - Run `git status` to check for uncommitted changes
   - Run `git branch --show-current` to get the current branch name
   - Run `git log --oneline main..HEAD` to see all commits on this branch
   - Run `git diff --stat main...HEAD` to see the scope of changes

2. If there are uncommitted changes, warn the user and ask if they want to commit first.

3. Push the branch to origin if not already pushed:
   - Run `git push -u origin <branch-name>`

4. Create the PR using GitHub CLI with this format:
   ```bash
   gh pr create --repo ttu/emergency-supply-tracker \
     --title "<type>: <description>" \
     --body "$(cat <<'EOF'
   ## Summary
   <bullet points summarizing the changes>

   ## Changes
   <grouped list of specific changes>

   ## Test plan
   - [ ] All tests pass
   - [ ] TypeScript type-check passes
   - [ ] Production build succeeds
   - [ ] Lint passes

   EOF
   )" \
     --base main \
     --head <branch-name>
   ```

5. Use conventional commit types for the title:
   - `feat`: New features
   - `fix`: Bug fixes
   - `refactor`: Code refactoring
   - `docs`: Documentation changes
   - `test`: Test changes
   - `chore`: Maintenance tasks
   - `ci`: Continuous integration tasks

6. Return the PR URL when done.

## Safety Rules

- **NEVER** perform git write operations (push, commit, etc.) on `main` branch
- If on `main` branch, abort and ask user to create a feature branch first
- Always verify the current branch before any push operation

## Notes

- Analyze ALL commits on the branch, not just the latest one
- Group related changes in the PR body
- Use the commit messages to understand the scope of changes
- If `$ARGUMENTS` is provided, use it as additional context for the PR description
