# AI Agents & Workflows

## Overview

This document describes AI agent workflows and patterns used in the Emergency Supply Tracker project. These workflows help maintain consistency and efficiency when working with AI coding assistants.

---

## Project Context

### Quick Project Summary

**Emergency Supply Tracker** - A web-based application to track emergency preparedness supplies based on 72tuntia.fi guidelines.

**Tech Stack:**

- React 19 + TypeScript 5.9 + Vite 7
- LocalStorage (no backend)
- CSS Modules
- Storybook (component development & documentation)
- Vitest + React Testing Library (integration tests - 70%)
- Playwright 1.57 (E2E tests - 20%)
- react-i18next (English + Finnish)

**Key Features:**

- Track supplies across 10 categories (water-beverages, food, cooking-heat, light-power, communication-info, medical-health, hygiene-sanitation, tools-supplies, cash-documents, pets)
- Household configuration (adults, children, pets, supply duration, freezer)
- 81 recommended items based on 72tuntia.fi guidelines
- Expiration tracking and alerts
- Product templates (built-in + custom) with barcode support
- Import/Export data (JSON)
- Shopping list export (TXT/Markdown/CSV)
- PWA with offline support

---

## Common Workflows

### 1. Adding a New Component

```text
Create a new StatusBadge component following our architecture:
- Feature component in src/features/[feature]/components/ OR shared in src/shared/components/
- Full TypeScript props interface
- Storybook stories with multiple states
- Integration tests using React Testing Library
- CSS Modules for styling

Component should: Display a colored badge indicating item status with icon and optional label

Props needed:
- status: 'ok' | 'warning' | 'critical'
- showLabel?: boolean (default: true)
- size?: 'small' | 'medium' | 'large' (default: 'medium')

States to show in Storybook: All status types, with/without labels, different sizes
```

---

### 2. Implementing Business Logic

```text
Implement calculateRecommendedQuantity in src/shared/utils/calculations.ts:
- Pure utility function with full TypeScript types
- Comprehensive unit tests (100% coverage for business logic)
- JSDoc comments explaining the logic

Inputs:
- recommendedItem: RecommendedItemDefinition (baseQuantity, scaleWithPeople, scaleWithDays)
- household: HouseholdConfig (adults, children, supplyDurationDays)

Expected behavior:
- Base quantity for 1 adult for 3 days
- Adults multiply by 1.0, children by 0.75
- If scaleWithPeople=false, don't multiply by people count
- Return rounded up (Math.ceil)

Reference: docs/DATA_SCHEMA.md for type definitions
```

---

### 3. Adding E2E Tests

```text
Create Playwright E2E tests for household configuration:
- Test file: e2e/household-config.spec.ts
- Use localStorage setup in beforeEach for faster tests
- Test both desktop and mobile viewports

User flows to test:
1. User changes household size and sees updated recommendations
2. User changes supply duration and quantities recalculate
3. Changes persist after page reload
4. Invalid inputs show validation errors

Reference: docs/TESTING_STRATEGY.md for examples
```

---

### 4. Internationalization (i18n)

```text
Add translations for AlertBanner component:
- Update public/locales/en/common.json (alerts section)
- Update public/locales/fi/common.json (alerts section)
- Update component to use useTranslation hook

Texts: "Items expiring soon", "Expired items", "Missing critical items", "Low quantity warning"
Context: Dashboard alerts when users have supply issues
```

---

### 5. Refactoring

```text
Refactor [component/module] to: [Describe refactoring goal]

Requirements:
- Maintain all existing functionality
- Keep test coverage at current level or improve
- Update Storybook stories if needed
- Ensure TypeScript types are accurate
- Run tests to verify no regressions

Current issues: [Describe what needs improvement]
```

---

### 6. Debugging

```text
Debug issue: [Brief description]

Current behavior: [What's happening]
Expected behavior: [What should happen]

Steps to reproduce:
1. [Step 1]
2. [Step 2]

Relevant files: [File 1], [File 2]
Error message (if any): [Error text]
```

---

## Code Review Checklist

When asking AI to review code, use this checklist:

```text
Review the following code for:
✓ TypeScript types are correct and complete
✓ Follows our component architecture (presentational vs container)
✓ Has appropriate test coverage
✓ Accessible (WCAG 2.1 Level AA)
✓ Responsive (mobile and desktop)
✓ i18n - no hardcoded strings
✓ Performance - memoization where needed
✓ Error handling
✓ Storybook stories if it's a presentational component
✓ JSDoc comments for complex logic

Code:
[Paste code here]
```

---

## Project-Specific Conventions

### Component Naming

- **Feature Components**: `ItemCard`, `CategoryGrid`, `AlertBanner` (in `src/features/[feature]/components/`)
- **Shared Components**: `Button`, `Modal`, `Badge`, `Input` (in `src/shared/components/`)
- **Layout Components**: `Header`, `Footer`, `Layout` (in `src/components/layout/`)
- **Pages**: `Dashboard`, `Inventory`, `Settings` (in `src/features/[feature]/pages/`)
- **Hooks**: `useInventory`, `useHousehold`, `useSettings` (in `src/features/[feature]/hooks/`)

### File Organization

The project uses **Feature Slice Architecture**:

```text
src/
├── features/                    # Feature slices (domain-driven)
│   └── [feature]/
│       ├── components/          # Feature-specific components
│       │   ├── [Component].tsx
│       │   ├── [Component].stories.tsx
│       │   ├── [Component].test.tsx
│       │   └── [Component].module.css
│       ├── hooks/               # Feature-specific hooks
│       ├── utils/               # Feature-specific utilities
│       ├── context.ts           # Feature context (if needed)
│       ├── provider.tsx         # Feature provider (if needed)
│       └── index.ts             # Public API
├── shared/
│   ├── components/              # Reusable UI components (Button, Modal, etc.)
│   ├── hooks/                   # Shared hooks
│   ├── utils/                   # Shared utilities
│   ├── contexts/                # Shared contexts
│   └── types/                   # Shared TypeScript types
└── components/layout/           # Layout components (Header, Footer)
```

**Example feature structure** (`src/features/inventory/`):

```text
inventory/
├── components/
│   ├── ItemCard.tsx
│   ├── ItemCard.stories.tsx
│   ├── ItemCard.test.tsx
│   └── ItemCard.module.css
├── hooks/
│   └── useInventory.ts
├── context.ts
├── provider.tsx
└── index.ts
```

### Test Naming

- Unit tests: `[function].test.ts`
- Component tests: `[Component].test.tsx`
- E2E tests: `[feature].spec.ts`

### Translation Keys

Pattern: `category.subcategory.key`

```json
{
  "dashboard": {
    "title": "Dashboard",
    "alerts": {
      "expiring": "Items expiring soon"
    }
  }
}
```

---

## Documentation Reference

### Current Documentation (USE THESE)

The `docs/` folder contains up-to-date documentation that reflects the actual implementation:

| Document                                                   | Description                                   |
| ---------------------------------------------------------- | --------------------------------------------- |
| **[docs/DATA_SCHEMA.md](docs/DATA_SCHEMA.md)**             | TypeScript types and data structures          |
| **[docs/FUNCTIONAL_SPEC.md](docs/FUNCTIONAL_SPEC.md)**     | Features, workflows, and UI components        |
| **[docs/RECOMMENDED_ITEMS.md](docs/RECOMMENDED_ITEMS.md)** | All 81 recommended items with current data    |
| **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**           | React component structure                     |
| **[docs/TECHNICAL_SPEC.md](docs/TECHNICAL_SPEC.md)**       | Technology stack and configuration            |
| **[docs/TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md)**   | Testing approach, Vitest, Playwright          |
| **[docs/TRANSLATION_GUIDE.md](docs/TRANSLATION_GUIDE.md)** | Internationalization (i18n)                   |
| **[docs/CODE_QUALITY.md](docs/CODE_QUALITY.md)**           | ESLint, Prettier, CI/CD                       |
| **[docs/CODE_COVERAGE.md](docs/CODE_COVERAGE.md)**         | Coverage thresholds, Codecov, PR requirements |

**Design Documentation:** Feature-specific design documents are available in `docs/design-docs/` covering implementation details for household configuration, inventory management, recommended items, dashboard, alerts, and other features.

### Keeping Documentation Updated

> **Important:** When implementing new features or making changes, update the corresponding documentation in `docs/` to keep it in sync with the code. This includes updating types in DATA_SCHEMA.md, new components in ARCHITECTURE.md, etc.

### Documentation Organization

> **Important:** When creating implementation plans, memos, or other planning documents, place them in `docs/plans/`. This keeps planning documents organized and separate from reference documentation.

---

## Tips for Effective AI Collaboration

### 1. Provide Context

Always mention which part of the project you're working on:

```
"I'm working on the Dashboard page, which shows household summary, alerts, and category status..."
```

### 2. Reference Specifications

Point to relevant documentation:

```
"According to DATA_SCHEMA.md, the household multiplier formula is..."
```

### 3. Show Examples

Include existing code patterns:

```
"Similar to how ItemCard is structured, create..."
```

### 4. Be Specific About Testing

```
"Write integration tests that verify the component displays correct data when household changes"
```

(Not just "add tests")

### 5. Iterate Incrementally

Break large features into smaller tasks:

```
"First, create the presentational component with Storybook"
"Then, create the container component that connects to state"
"Finally, add E2E tests for the complete flow"
```

---

## Common Pitfalls to Avoid

### ❌ Don't Ask For:

- "Create the entire app" - Use IMPLEMENTATION_PLAN.md step-by-step instead
- Backend features - This is a frontend-only app
- IndexedDB - We use LocalStorage (simpler for our needs)
- Complex state management libraries - We use Context API
- CSS-in-JS or Tailwind - We use CSS Modules
- Unit tests for every function - We use Testing Diamond (70% integration, 20% E2E, 10% unit)

### ✅ Do Ask For:

- Step-by-step implementation from IMPLEMENTATION_PLAN.md (e.g., "Implement Step 5")
- Specific components following our architecture
- Storybook stories for presentational components
- Business logic with comprehensive tests
- Integration tests for components (70% of test suite)
- E2E tests for critical user flows (20% of test suite)
- Translations for new features (English + Finnish)
- PWA features (manifest, service worker, offline support)

---

## Version Control Integration

**Note for AI agents in Cursor:** When creating commits or PRs, use `required_permissions: ['all']` for git operations (`git commit`, `git push`) and GitHub CLI commands (`gh pr create`) to bypass sandbox restrictions. These operations require git write and network access.

### Commit Message Format

```
type: description

- Detail 1
- Detail 2

Refs: #issue-number
```

> **Note:** Do NOT add "Co-Authored-By" or "Generated with" footers to commit messages. Keep commits clean and simple. Do NOT use scopes in commit messages (e.g., use `feat:` not `feat(scope):`).

**Types:**

- `feat`: New features or functionality
- `fix`: Bug fixes
- `refactor`: Code refactoring without changing behavior
- `test`: Adding or updating tests
- `docs`: Documentation changes
- `style`: Code style/formatting (Prettier, etc.)
- `chore`: Dependencies, tooling, misc tasks
- `ci`: CI/CD configuration changes
- `build`: Build system or external dependencies
- `perf`: Performance improvements

**Examples:**

```
feat: add expiring items alert to dashboard

- Create AlertBanner component
- Add Storybook stories
- Integrate with Dashboard
- Add Finnish translations

Refs: #12
```

```
test: add E2E tests for item management

- Test adding items from recommendations
- Test editing item quantities
- Test deleting items
- Test multiple instances with different expirations

Refs: #15
```

### Implementation Steps Commits

When following IMPLEMENTATION_PLAN.md, use conventional commits **instead of** "Step X:" format:

❌ **Don't use:**

```
Step 0: Initialize Vite + React + TypeScript project
Step 4: Configure ESLint
Step 11: Create TypeScript interfaces
```

✅ **Do use:**

```
chore: initialize Vite + React + TypeScript project
chore: configure ESLint
feat: add TypeScript interfaces for data models
```

**Type selection guide for implementation steps:**

- Setup/tooling → `chore`
- New functionality → `feat`
- Tests → `test`
- Documentation → `docs`
- Formatting → `style`

### Creating PR from Cursor Worktree

**Note:** This section applies specifically to Cursor worktrees. Worktrees created with the `new-worktree.sh` script work fine with standard git/gh commands.

**Important - Sandbox Restrictions:** When creating commits or PRs in Cursor, commands that require network access (git push, gh pr create) or git write operations must bypass the sandbox. Always use `required_permissions: ['all']` for these operations to avoid permission errors.

When working in a Cursor worktree, follow these steps to create a PR:

1. **Ensure you're on a branch** (not detached HEAD):

   ```bash
   git checkout -b your-branch-name
   ```

2. **Stage, commit, and push your changes**:

   ```bash
   git add .
   git commit -m "type: description"
   git push -u origin your-branch-name
   ```

   **Note for AI agents:** When running `git push` or `gh pr create` commands, use `required_permissions: ['all']` to bypass Cursor's sandbox restrictions. These operations require network and git write access.

3. **Verify the remote branch has your commits**:

   ```bash
   git log --oneline origin/your-branch-name -1
   # Should show your commit, not the base commit
   ```

4. **If the remote branch doesn't have your commit, push again**:

   ```bash
   git push origin your-branch-name --force-with-lease
   ```

5. **Create the PR using GitHub CLI with explicit flags**:

   ```bash
   gh pr create \
     --repo ttu/emergency-supply-tracker \
     --title "type: description" \
     --body "PR description" \
     --base main \
     --head your-branch-name
   ```

   **Important:**
   - Always specify `--repo`, `--base`, and `--head` flags when working from a worktree, as the GitHub CLI may not correctly detect the branch relationship otherwise.
   - **For AI agents:** Use `required_permissions: ['all']` when running `gh pr create` to bypass sandbox restrictions.

**Alternative:** If the CLI fails, use the web interface:

```
https://github.com/ttu/emergency-supply-tracker/pull/new/your-branch-name
```

### Checking PR Review Comments and Status

**Note:** If GitHub MCP is available, use MCP tools instead of CLI commands for better integration.

To check PR review comments and status:

- **CI/CD checks:** `gh pr checks <PR_NUMBER> --repo ttu/emergency-supply-tracker`
- **Review comments:** `gh api repos/ttu/emergency-supply-tracker/pulls/<PR_NUMBER>/comments`
- **PR summary:** `gh pr view <PR_NUMBER> --repo ttu/emergency-supply-tracker --json comments,reviews`
- **SonarCloud issues:** Check the SonarCloud link from `gh pr checks` output, or visit `https://sonarcloud.io/project/issues?id=ttu_emergency-supply-tracker&pullRequest=<PR_NUMBER>`
- **Codecov coverage:** Check the Codecov link from `gh pr checks` output for coverage reports and any coverage regressions
- **View in browser:** `gh pr view <PR_NUMBER> --repo ttu/emergency-supply-tracker --web`

**When fixing a PR, check these in order:**

1. CI/CD checks (must all pass)
2. CodeRabbit review comments (address all non-nitpick issues)
3. SonarCloud issues (fix code smells, bugs, security issues)
4. Codecov (ensure coverage thresholds are met)
5. Human reviewer comments (if any)

**Tip:** CodeRabbit resolved issues are marked with "✅ Addressed". Verify all actionable feedback is addressed before re-review.

---

## Getting Help

### When Stuck

1. Check documentation in `docs/` (DATA_SCHEMA.md, ARCHITECTURE.md, etc.)
2. Review existing similar components
3. Run Storybook to see component examples
4. Check test files for usage patterns
5. Ask AI with specific context

### Project-Specific Questions

- "How should I structure a new category component?"
  → Reference ARCHITECTURE.md
- "What's the calculation for recommended quantities?"
  → Reference DATA_SCHEMA.md
- "How do I test LocalStorage persistence?"
  → Reference TESTING_STRATEGY.md (Playwright examples)

---

## Quick Commands Reference

```bash
# Development
npm run dev                    # Start dev server
npm run storybook              # Start Storybook component explorer

# Testing
npm run test                   # Run Vitest tests
npm run test:watch             # Watch mode
npm run test:coverage          # Coverage report
npm run test:e2e               # Run Playwright tests
npm run test:e2e:ui            # Run Playwright tests with UI
npm run test:storybook         # Test Storybook stories
npm run test:a11y              # Run accessibility tests
npm run test:mutation          # Run mutation testing
npm run test:all               # Run all test types

# Type Checking
npm run type-check             # Run TypeScript type checking

# Quality
npm run lint                   # Run ESLint
npm run lint:fix               # Fix ESLint issues
npm run format                 # Format with Prettier
npm run format:check           # Check formatting

# Validation
npm run validate               # Run all validations
npm run validate:all           # Comprehensive validation (lint, types, tests, build)
npm run validate:i18n          # Validate i18n translation keys

# Build & Deploy
npm run build                  # Production build
npm run preview                # Preview production build
npm run build-storybook        # Build Storybook static site

# Quality Gates (run before commit)
npm run validate:all

# Claude Code Commands (slash commands)
/verify                       # Run lint, type-check, tests, build
/docs-sync                    # Validate documentation matches codebase
/docs-sync quick              # Quick check (types, items, categories only)
/pr-create                    # Create a pull request
/pr-fix                       # Fix PR review issues (CodeRabbit, reviewers, CI failures)
/issue-implement <number>     # Implement a GitHub issue
/issue-refine <number|text>   # Refine issue description by validating against codebase
```

---

**Document Version**: 1.2
**Last Updated**: 2026-01-15
**Purpose**: Guide AI-assisted development workflows for Emergency Supply Tracker
