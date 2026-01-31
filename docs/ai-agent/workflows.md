# AI Agent Workflow Templates

Copy-paste prompts for common tasks. Reference [docs/](.) for type definitions and architecture.

## 1. Adding a New Component

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

## 2. Implementing Business Logic

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

## 3. Adding E2E Tests

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

## 4. Internationalization (i18n)

```text
Add translations for AlertBanner component:
- Update public/locales/en/common.json (alerts section)
- Update public/locales/fi/common.json (alerts section)
- Update component to use useTranslation hook

Texts: "Items expiring soon", "Expired items", "Missing critical items", "Low quantity warning"
Context: Dashboard alerts when users have supply issues
```

## 5. Refactoring

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

## 6. Debugging

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
