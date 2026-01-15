---
description: Refine issue description by validating behavior against codebase
allowed-tools: Bash(gh:*), Read, CodebaseSearch, Grep, Glob
---

# Refine Issue Description

Refine the given issue description by validating the described behavior against the existing codebase. Focus on functional behavior alignment, not implementation fixes.

## Arguments

`$ARGUMENTS` - Issue number (e.g., `42`), GitHub URL (e.g., `https://github.com/owner/repo/issues/42`), or issue description text

## Instructions

1. **Parse the input**:
   - If `$ARGUMENTS` is a number, fetch the issue from GitHub using `gh issue view <number> --json title,body,labels,state,comments`
   - If `$ARGUMENTS` is a URL, extract the issue number and fetch it
   - If `$ARGUMENTS` is text, treat it as the issue description directly
   - If no argument provided, ask the user for the issue number, URL, or description

2. **Extract functional behavior** from the issue:
   - Identify what the system currently does (actual behavior)
   - Identify what the system should do (expected behavior, if different)
   - Focus on user-facing functionality, not technical implementation
   - Note any constraints, scope, or edge cases mentioned

3. **Validate against codebase**:
   - Use `codebase_search` to find relevant code that implements the described functionality
   - Search for components, hooks, utilities, and data structures related to the behavior
   - Read relevant source files to understand actual implementation
   - Compare described behavior with actual code behavior
   - Identify discrepancies between issue description and code reality

4. **Refine the issue description**:
   - Adjust the description to accurately reflect what the code actually does
   - Clarify ambiguous statements with concrete behavior descriptions
   - Add missing context about scope and constraints visible in the code
   - Separate "expected behavior" from "actual behavior" if they differ
   - Use plain, product-level language (avoid low-level technical details)
   - Ensure the description is clear and unambiguous

5. **Output the refined description**:
   - Present the refined issue description
   - Highlight what was changed and why
   - Note any assumptions made based on code inspection
   - Indicate if the issue describes a bug (actual ≠ expected) or a feature request

## Focus Areas

**What to validate:**

- Functional behavior (what happens when user does X)
- Data flow and state changes
- User interface behavior and interactions
- Business logic and calculations
- Edge cases and constraints
- Scope boundaries (what's included/excluded)

**What NOT to do:**

- ❌ Propose code fixes or refactoring
- ❌ Suggest architectural changes
- ❌ Recommend implementation approaches
- ❌ Discuss performance optimizations
- ❌ Address security considerations
- ❌ Provide technical solutions

## Output Format

```text
Refined Issue Description
=========================

[Refined issue title]

## Current Description
[Original issue description]

## Refined Description
[Refined version that matches actual codebase behavior]

## Changes Made
- [Change 1]: [Reason based on code inspection]
- [Change 2]: [Reason based on code inspection]
- ...

## Validation Notes
- **Code locations inspected**: [list relevant files/components]
- **Actual behavior found**: [what the code actually does]
- **Discrepancies identified**: [differences between description and code]
- **Assumptions made**: [any assumptions based on code analysis]

## Issue Type
- Bug: Actual behavior differs from expected
- Feature Request: New functionality needed
- Clarification: Description needed refinement to match reality
```

## Examples

### Example 1: Issue from GitHub

```
/issue-refine 42
```

Fetches issue #42, validates its description against codebase, and outputs refined version.

### Example 2: Direct Description

```
/issue-refine "The dashboard doesn't show expiring items when they're within 7 days"
```

Validates this description against dashboard and alert code, refines to match actual expiration logic.

### Example 3: GitHub URL

```
/issue-refine https://github.com/owner/repo/issues/123
```

Extracts issue number, fetches it, validates, and refines.

## Validation Strategy

1. **Identify key terms** in the issue (feature names, component names, actions)
2. **Search codebase** for related implementations:
   - Component names → `src/features/` or `src/shared/components/`
   - Feature names → `codebase_search` with semantic queries
   - Data structures → `src/shared/types/`
   - Business logic → `src/utils/` or `src/features/*/utils/`
3. **Read relevant files** to understand actual behavior
4. **Compare** described behavior with code implementation
5. **Refine** description to match reality

## Tips

- Use semantic search (`codebase_search`) for finding related functionality
- Read multiple files if behavior spans multiple components
- Check test files for additional context about expected behavior
- Reference documentation (`docs/`) for feature specifications
- When behavior is unclear from code, note assumptions in validation notes
- If issue describes a bug, clearly separate "expected" vs "actual" behavior

## Safety Rules

- **NEVER** modify code or propose fixes
- **NEVER** change the issue on GitHub (only output refined text)
- Focus on accuracy and clarity, not solutions
- If codebase behavior is unclear, note this in validation notes
