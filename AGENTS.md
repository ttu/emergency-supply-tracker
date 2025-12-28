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
- Jest 30 + React Testing Library (integration tests - 70%)
- Playwright 1.57 (E2E tests - 20%)
- react-i18next (English + Finnish)

**Key Features:**
- Track supplies across 9 categories (water, food, cooking, light, communication, medical, hygiene, tools, cash)
- Household configuration (adults, children, supply duration, freezer)
- 70 recommended items based on 72tuntia.fi guidelines
- Expiration tracking and alerts
- Product templates (built-in + custom) with barcode support
- Import/Export data (JSON)
- Shopping list export (TXT/Markdown/CSV)
- PWA with offline support

---

## Common Workflows

### 1. Adding a New Component

**Prompt Template:**
```
Create a new [component name] component following our architecture:
- Pure/presentational component in src/components/[Name]/
- Full TypeScript props interface
- Storybook stories with multiple states (Default, [State1], [State2])
- Integration tests using React Testing Library
- CSS Modules for styling

Component should:
[Describe what the component does]

Props needed:
[List required and optional props]

States to show in Storybook:
[List different visual states]
```

**Example:**
```
Create a new StatusBadge component following our architecture:
- Pure/presentational component in src/components/StatusBadge/
- Full TypeScript props interface
- Storybook stories with multiple states (OK, Warning, Critical)
- Integration tests using React Testing Library
- CSS Modules for styling

Component should:
Display a colored badge indicating item status with icon and optional label

Props needed:
- status: 'ok' | 'warning' | 'critical'
- showLabel?: boolean (default: true)
- size?: 'small' | 'medium' | 'large' (default: 'medium')

States to show in Storybook:
- All three status types
- With and without labels
- Different sizes
```

---

### 2. Implementing Business Logic

**Prompt Template:**
```
Implement [function/feature name] following our patterns:
- Pure utility function in src/utils/[module].ts
- Full TypeScript types
- Comprehensive unit tests (100% coverage for business logic)
- JSDoc comments explaining the logic

The function should:
[Describe the calculation/logic]

Inputs:
[List input parameters and types]

Expected behavior:
[Describe edge cases and examples]

Reference: See docs/specifications/[relevant-spec].md for requirements
```

**Example:**
```
Implement calculateRecommendedQuantity following our patterns:
- Pure utility function in src/utils/calculations.ts
- Full TypeScript types
- Comprehensive unit tests (100% coverage for business logic)
- JSDoc comments explaining the logic

The function should:
Calculate the recommended quantity for an item based on household configuration

Inputs:
- recommendedItem: RecommendedItemDefinition (includes baseQuantity, scaleWithPeople, scaleWithDays)
- household: HouseholdConfig (adults, children, supplyDurationDays)

Expected behavior:
- Base quantity for 1 adult for 3 days
- Adults multiply by 1.0, children by 0.75
- If scaleWithPeople=false, don't multiply by people count
- If scaleWithDays=false, don't multiply by duration
- Return rounded to 2 decimal places

Reference: See docs/specifications/DATA_SCHEMA.md for calculation formulas
```

---

### 3. Adding E2E Tests

**Prompt Template:**
```
Create Playwright E2E tests for [feature name]:
- Test file: e2e/[feature].spec.ts
- Test critical user flows
- Use localStorage setup in beforeEach for faster tests
- Test both desktop and mobile viewports if relevant

User flows to test:
1. [Flow 1 description]
2. [Flow 2 description]
3. [Edge case]

Reference implementation examples in docs/specifications/TESTING_STRATEGY.md
```

**Example:**
```
Create Playwright E2E tests for household configuration:
- Test file: e2e/household-config.spec.ts
- Test critical user flows
- Use localStorage setup in beforeEach for faster tests
- Test both desktop and mobile viewports

User flows to test:
1. User changes household size and sees updated recommendations
2. User changes supply duration and quantities recalculate
3. Changes persist after page reload
4. Invalid inputs show validation errors

Reference implementation examples in docs/specifications/TESTING_STRATEGY.md
```

---

### 4. Internationalization (i18n)

**Prompt Template:**
```
Add translations for [feature/component]:
- Update locales/en/[file].json
- Update locales/fi/[file].json
- Ensure translation keys follow our naming convention
- Update component to use translation keys

Texts to translate:
[List all user-facing strings]

Context:
[Explain where these appear in the UI]
```

**Example:**
```
Add translations for the AlertBanner component:
- Update locales/en/common.json (alerts section)
- Update locales/fi/common.json (alerts section)
- Ensure translation keys follow our naming convention
- Update AlertBanner to use useTranslation hook

Texts to translate:
- "Items expiring soon"
- "Expired items"
- "Missing critical items"
- "Low quantity warning"

Context:
These appear in dashboard alerts when users have supply issues
```

---

### 5. Refactoring

**Prompt Template:**
```
Refactor [component/module] to:
[Describe refactoring goal]

Requirements:
- Maintain all existing functionality
- Keep test coverage at current level or improve
- Update Storybook stories if needed
- Ensure TypeScript types are accurate
- Run tests to verify no regressions

Current issues:
[Describe what needs improvement]
```

---

### 6. Debugging

**Prompt Template:**
```
Debug issue: [Brief description]

Current behavior:
[What's happening]

Expected behavior:
[What should happen]

Steps to reproduce:
1. [Step 1]
2. [Step 2]

Relevant files:
- [File 1]
- [File 2]

Error message (if any):
[Error text]
```

---

## Code Review Checklist

When asking AI to review code, use this checklist:

```
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
- **Presentational**: `ItemCard`, `StatusBadge`, `AlertBanner`
- **Container**: `ItemCardContainer`, `DashboardContainer`
- **Pages**: `Dashboard`, `Inventory`, `Settings`
- **Hooks**: `useInventory`, `useHousehold`, `useItemStatus`

### File Organization
```
src/components/[ComponentName]/
  ├── [ComponentName].tsx
  ├── [ComponentName].stories.tsx
  ├── [ComponentName].test.tsx
  └── [ComponentName].module.css
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

| Document | Description |
|----------|-------------|
| **[docs/DATA_SCHEMA.md](docs/DATA_SCHEMA.md)** | TypeScript types and data structures |
| **[docs/FUNCTIONAL_SPEC.md](docs/FUNCTIONAL_SPEC.md)** | Features, workflows, and UI components |
| **[docs/RECOMMENDED_ITEMS.md](docs/RECOMMENDED_ITEMS.md)** | All 70 recommended items with current data |
| **[docs/COMPONENT_ARCHITECTURE.md](docs/COMPONENT_ARCHITECTURE.md)** | React component structure |
| **[docs/TECHNICAL_SPEC.md](docs/TECHNICAL_SPEC.md)** | Technology stack and configuration |
| **[docs/TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md)** | Testing approach, Jest, Playwright |
| **[docs/TRANSLATION_GUIDE.md](docs/TRANSLATION_GUIDE.md)** | Internationalization (i18n) |
| **[docs/CODE_QUALITY.md](docs/CODE_QUALITY.md)** | ESLint, Prettier, CI/CD |

### Keeping Documentation Updated

> **Important:** When implementing new features or making changes, update the corresponding documentation in `docs/` to keep it in sync with the code. This includes updating types in DATA_SCHEMA.md, new components in COMPONENT_ARCHITECTURE.md, etc.

### Original Specifications (DO NOT USE)

> **Important:** Files in `docs/specifications/` contain the original pre-implementation specifications. These are outdated and should NOT be used unless explicitly asked. The implementation has diverged from these original specs.

Only reference `docs/specifications/` files when:
- Explicitly asked to compare spec vs implementation
- Asked to review original design decisions
- Working on implementation progress tracking (`PROGRESS.md`)

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

### Commit Message Format
```
type(scope): description

- Detail 1
- Detail 2

Refs: #issue-number
```

> **Note:** Do NOT add "Co-Authored-By" or "Generated with" footers to commit messages. Keep commits clean and simple.

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

**Scopes (optional):** dashboard, inventory, settings, types, storage, utils, data, ci, deploy, lint

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
chore(lint): configure ESLint
feat(types): add TypeScript interfaces for data models
```

**Type selection guide for implementation steps:**
- Setup/tooling → `chore` (or `chore(scope)`)
- New functionality → `feat(scope)`
- Tests → `test` (or `test(scope)`)
- Documentation → `docs`
- Formatting → `style`

---

## Getting Help

### When Stuck
1. Check specifications in `docs/specifications/`
2. Review existing similar components
3. Run Storybook to see component examples
4. Check test files for usage patterns
5. Ask AI with specific context

### Project-Specific Questions
- "How should I structure a new category component?"
  → Reference COMPONENT_ARCHITECTURE.md
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
npm run test                  # Run Jest tests
npm run test:watch            # Watch mode
npm run test:coverage         # Coverage report
npm run test:e2e              # Run Playwright tests (install Playwright first)

# Quality
npm run lint                  # Run ESLint
npm run lint:fix              # Fix ESLint issues
npm run format                # Format with Prettier
npm run format:check          # Check formatting

# Build & Deploy
npm run build                 # Production build
npm run preview               # Preview production build
npm run build-storybook       # Build Storybook static site

# Quality Gates (run before commit)
npm run lint && npm test && npm run build
```

---

---

## Implementation Workflow

For step-by-step implementation, see **[IMPLEMENTATION_PLAN.md](docs/specifications/IMPLEMENTATION_PLAN.md)**.

### Using This Plan with AI Agents

**Basic prompt:**
```
Implement Step X from IMPLEMENTATION_PLAN.md.

Read the step details from docs/specifications/IMPLEMENTATION_PLAN.md, then:
1. Complete all tasks listed in the step
2. Run verification commands
3. Ensure all quality gates pass

When done, tell me the commit message to use.
```

**Quality gates before each commit:**
```bash
npm run lint        # Must pass
npm test           # Must pass
npm run build      # Must succeed
npm run dev        # App must run without errors
```

See the full guide in [IMPLEMENTATION_PLAN.md - How to Use This Plan with AI Agents](docs/specifications/IMPLEMENTATION_PLAN.md#how-to-use-this-plan-with-ai-agents)

---

**Document Version**: 1.1
**Last Updated**: 2025-12-23
**Purpose**: Guide AI-assisted development workflows for Emergency Supply Tracker
