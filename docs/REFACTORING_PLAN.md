# Feature Slices Architecture Refactoring Plan

> **Status:** Planning Phase  
> **Created:** 2025-01-27  
> **Purpose:** Migrate from responsibility-based to feature slices architecture

## Executive Summary

The application has grown significantly, and the current responsibility-based structure (`components/`, `hooks/`, `utils/`, `contexts/`) is becoming difficult to maintain. This document outlines a plan to refactor to a **Feature Slices Architecture** (also known as Feature-Based Architecture or Feature Folders), which groups related code by business domain/feature rather than technical layer.

## Current Structure Analysis

### Current Organization (By Responsibility)

```
src/
├── components/          # UI components organized by feature area
│   ├── common/         # Shared UI components (Button, Modal, etc.)
│   ├── dashboard/      # Dashboard-specific components
│   ├── inventory/      # Inventory-specific components
│   ├── onboarding/     # Onboarding flow components
│   ├── settings/       # Settings page components
│   └── layout/         # Layout components (Header, Footer, Layout)
├── contexts/           # React contexts (Household, Inventory, Settings)
├── hooks/              # Custom React hooks
├── utils/              # Utility functions organized by domain
│   ├── analytics/      # Analytics and tracking
│   ├── calculations/   # Business logic calculations
│   ├── dashboard/      # Dashboard-specific utilities
│   ├── errorLogger/    # Error logging
│   ├── storage/        # LocalStorage utilities
│   └── test/           # Test utilities
├── pages/              # Page-level components
├── types/              # TypeScript type definitions
└── data/               # Static data (categories, recommended items)
```

### Problems with Current Structure

1. **Cross-cutting concerns**: Related code is scattered across multiple directories
   - Dashboard feature spans: `components/dashboard/`, `utils/dashboard/`, `pages/Dashboard.tsx`, `hooks/useAlerts.ts`
   - Inventory feature spans: `components/inventory/`, `contexts/InventoryContext.ts`, `hooks/useInventory.ts`, `utils/calculations/`

2. **Hard to locate feature code**: When working on a feature, developers must navigate multiple directories

3. **Tight coupling across layers**: Changes to a feature require edits in multiple locations

4. **Difficult to extract features**: Moving or extracting a feature requires finding all related files

5. **Context/hook organization**: Contexts and hooks are separated from the features they serve

## Target Architecture: Feature Slices

### Principles

1. **Feature Co-location**: All code related to a feature lives in one place
2. **Vertical Slicing**: Each feature slice contains its own components, hooks, utils, types, and tests
3. **Shared Code**: Common/shared code remains in a shared location
4. **Public API**: Each feature exposes a clear public API (index.ts) for imports

### Proposed Structure

```
src/
├── features/                    # Feature slices
│   ├── household/              # Household configuration
│   │   ├── components/         # Feature-specific components
│   │   ├── hooks/             # Feature-specific hooks
│   │   ├── utils/              # Feature-specific utilities
│   │   ├── types.ts            # Feature-specific types
│   │   ├── context.tsx         # Feature context (if needed)
│   │   └── index.ts            # Public API exports
│   ├── inventory/              # Inventory management
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── types.ts
│   │   ├── context.tsx
│   │   └── index.ts
│   ├── dashboard/               # Dashboard overview
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── types.ts
│   │   └── index.ts
│   ├── settings/                # User settings
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── types.ts
│   │   ├── context.tsx
│   │   └── index.ts
│   ├── onboarding/              # Onboarding flow
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── types.ts
│   │   └── index.ts
│   ├── alerts/                  # Alert system
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── types.ts
│   │   └── index.ts
│   ├── categories/              # Category management
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── types.ts
│   │   └── index.ts
│   └── templates/               # Product templates
│       ├── components/
│       ├── hooks/
│       ├── utils/
│       ├── types.ts
│       └── index.ts
├── shared/                      # Shared code across features
│   ├── components/             # Common UI components
│   │   ├── Button/
│   │   ├── Modal/
│   │   ├── Input/
│   │   ├── Card/
│   │   ├── Badge/
│   │   ├── Tooltip/
│   │   ├── Select/
│   │   ├── ErrorBoundary/
│   │   ├── Navigation/
│   │   ├── LanguageSwitcher/
│   │   └── index.ts
│   ├── hooks/                  # Shared hooks
│   │   ├── useKeyboardNavigation.ts
│   │   └── index.ts
│   ├── utils/                  # Shared utilities
│   │   ├── storage/            # LocalStorage abstraction
│   │   ├── analytics/          # Analytics (cross-cutting)
│   │   ├── errorLogger/        # Error logging (cross-cutting)
│   │   ├── test/               # Test utilities
│   │   └── index.ts
│   ├── types/                  # Shared types
│   │   └── index.ts
│   └── constants/              # Shared constants
│       └── index.ts
├── pages/                      # Page-level components (orchestration)
│   ├── Dashboard.tsx
│   ├── Inventory.tsx
│   ├── Settings.tsx
│   ├── Help.tsx
│   └── Onboarding.tsx
├── app/                        # App-level setup
│   ├── App.tsx
│   ├── providers.tsx           # All context providers
│   └── router.tsx              # Routing (if applicable)
├── data/                       # Static/reference data
│   ├── standardCategories.ts
│   ├── recommendedItems.ts
│   └── index.ts
└── i18n/                       # Internationalization
    └── config.ts
```

## Feature Identification

### Core Features

1. **Household** (`features/household/`)
   - Household configuration (adults, children, duration, freezer)
   - Household context and provider
   - `useHousehold` hook
   - Household calculations
   - **Current locations:**
     - `contexts/HouseholdContext.ts`, `contexts/HouseholdProvider.tsx`
     - `hooks/useHousehold.ts`
     - `utils/calculations/household.ts`
     - `components/onboarding/HouseholdForm.tsx`
     - `components/settings/HouseholdForm.tsx`

2. **Inventory** (`features/inventory/`)
   - Item CRUD operations
   - Inventory context and provider
   - `useInventory` hook
   - Item status calculations
   - **Current locations:**
     - `contexts/InventoryContext.ts`, `contexts/InventoryProvider.tsx`
     - `hooks/useInventory.ts`
     - `components/inventory/*`
     - `utils/calculations/status.ts`
     - `pages/Inventory.tsx`

3. **Dashboard** (`features/dashboard/`)
   - Dashboard overview
   - Preparedness calculations
   - Category status calculations
   - Alert generation
   - **Current locations:**
     - `components/dashboard/*`
     - `utils/dashboard/*`
     - `hooks/useAlerts.ts`
     - `pages/Dashboard.tsx`

4. **Settings** (`features/settings/`)
   - User preferences (language, theme, advanced features)
   - Settings context and provider
   - `useSettings` hook
   - Export/import functionality
   - **Current locations:**
     - `contexts/SettingsContext.ts`, `contexts/SettingsProvider.tsx`
     - `hooks/useSettings.ts`
     - `components/settings/*`
     - `pages/Settings.tsx`

5. **Onboarding** (`features/onboarding/`)
   - Welcome screen
   - Quick setup
   - Household preset selection
   - **Current locations:**
     - `components/onboarding/*`
     - `pages/Onboarding.tsx` (if exists)

6. **Alerts** (`features/alerts/`)
   - Alert generation logic
   - Alert dismissal
   - Alert banner component
   - **Current locations:**
     - `hooks/useAlerts.ts`
     - `components/dashboard/AlertBanner.tsx`
     - `utils/dashboard/alerts.ts`
     - `utils/dashboard/backupReminder.ts`

7. **Categories** (`features/categories/`)
   - Category management
   - Standard categories data
   - Category utilities
   - **Current locations:**
     - `data/standardCategories.ts`
     - Category-related utilities in `utils/`

8. **Templates** (`features/templates/`)
   - Product template management
   - Recommended items data
   - Template utilities
   - **Current locations:**
     - `data/recommendedItems.ts`
     - Template-related utilities

### Shared/Cross-Cutting Concerns

1. **Storage** (`shared/utils/storage/`)
   - LocalStorage abstraction
   - Data persistence
   - **Current location:** `utils/storage/`

2. **Analytics** (`shared/utils/analytics/`)
   - Analytics tracking
   - **Current location:** `utils/analytics/`

3. **Error Logging** (`shared/utils/errorLogger/`)
   - Error logging
   - **Current location:** `utils/errorLogger/`

4. **Calculations** (Distributed to features)
   - `utils/calculations/calories.ts` → `features/inventory/utils/` or `features/dashboard/utils/`
   - `utils/calculations/water.ts` → `features/inventory/utils/` or `features/dashboard/utils/`
   - `utils/calculations/status.ts` → `features/inventory/utils/`
   - `utils/calculations/household.ts` → `features/household/utils/`

## Migration Strategy

### Phase 1: Preparation (No Code Changes)

1. ✅ **Document current structure** (this document)
2. **Create feature slice directories** (empty structure)
3. **Update import paths mapping** (document what needs to change)
4. **Create migration checklist** (track progress)

### Phase 2: Shared Code First

1. **Move shared components** to `shared/components/`
   - Button, Modal, Input, Card, Badge, Tooltip, Select, ErrorBoundary, Navigation, LanguageSwitcher
   - Update imports across codebase

2. **Move shared utilities** to `shared/utils/`
   - Storage utilities
   - Analytics
   - Error logger
   - Test utilities
   - Update imports

3. **Move shared types** to `shared/types/`
   - Core types that are used across features
   - Update imports

4. **Move constants** to `shared/constants/`
   - Update imports

### Phase 3: Feature Migration (One Feature at a Time)

For each feature, follow this order:

1. **Create feature directory structure**
2. **Move components** from `components/{feature}/` to `features/{feature}/components/`
3. **Move hooks** from `hooks/` to `features/{feature}/hooks/`
4. **Move contexts** from `contexts/` to `features/{feature}/`
5. **Move utilities** from `utils/` to `features/{feature}/utils/`
6. **Move types** (extract feature-specific types) to `features/{feature}/types.ts`
7. **Create public API** (`features/{feature}/index.ts`)
8. **Update imports** across codebase
9. **Run tests** to ensure nothing broke
10. **Update page components** to use new imports

**Recommended order:**

1. Household (simplest, few dependencies)
2. Categories (data-focused)
3. Templates (data-focused)
4. Alerts (used by dashboard)
5. Inventory (core feature, many dependencies)
6. Dashboard (depends on inventory, alerts)
7. Settings (depends on household, inventory)
8. Onboarding (depends on household)

### Phase 4: Cleanup

1. **Remove empty directories**
2. **Update documentation**
3. **Update import paths in tests**
4. **Verify all tests pass**
5. **Update Storybook stories** (if applicable)

## Detailed Migration Steps

### Step 1: Create Directory Structure

```bash
mkdir -p src/features/{household,inventory,dashboard,settings,onboarding,alerts,categories,templates}/{components,hooks,utils}
mkdir -p src/shared/{components,hooks,utils,types,constants}
```

### Step 2: Move Shared Components

**Example: Button component**

```
Before: src/components/common/Button.tsx
After:  src/shared/components/Button/Button.tsx
        src/shared/components/Button/Button.module.css
        src/shared/components/Button/Button.test.tsx
        src/shared/components/Button/Button.stories.tsx
        src/shared/components/Button/index.ts
```

**Update imports:**

```typescript
// Before
import { Button } from '../components/common/Button';

// After
import { Button } from '@/shared/components';
```

### Step 3: Move Feature Code

**Example: Household feature**

1. Move `contexts/HouseholdContext.ts` → `features/household/context.ts`
2. Move `contexts/HouseholdProvider.tsx` → `features/household/provider.tsx`
3. Move `hooks/useHousehold.ts` → `features/household/hooks/useHousehold.ts`
4. Move `utils/calculations/household.ts` → `features/household/utils/calculations.ts`
5. Move `components/onboarding/HouseholdForm.tsx` → `features/household/components/HouseholdForm.tsx`
6. Move `components/settings/HouseholdForm.tsx` → `features/household/components/HouseholdForm.tsx` (or create separate component)

7. Create `features/household/index.ts`:

```typescript
export { HouseholdProvider, useHousehold } from './provider';
export { HouseholdForm } from './components/HouseholdForm';
export type { HouseholdConfig } from './types';
```

8. Update imports:

```typescript
// Before
import { useHousehold } from '../hooks/useHousehold';
import { HouseholdProvider } from '../contexts/HouseholdProvider';

// After
import { useHousehold, HouseholdProvider } from '@/features/household';
```

### Step 4: Update Path Aliases

Update `tsconfig.json` and `vite.config.ts` to support path aliases:

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/features/*": ["./src/features/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/pages/*": ["./src/pages/*"],
      "@/data/*": ["./src/data/*"]
    }
  }
}
```

## Import Path Strategy

### Before (Responsibility-based)

```typescript
import { Button } from '../components/common/Button';
import { useInventory } from '../hooks/useInventory';
import { InventoryProvider } from '../contexts/InventoryProvider';
import { calculateItemStatus } from '../utils/calculations/status';
```

### After (Feature slices)

```typescript
import { Button } from '@/shared/components';
import { useInventory, InventoryProvider } from '@/features/inventory';
import { calculateItemStatus } from '@/features/inventory/utils';
```

## Benefits

1. **Easier Navigation**: All code for a feature is in one place
2. **Better Encapsulation**: Features are self-contained
3. **Easier Testing**: Feature tests are co-located
4. **Easier Refactoring**: Changes are localized to one feature
5. **Clearer Dependencies**: Feature dependencies are explicit
6. **Easier Onboarding**: New developers can understand features independently
7. **Better Scalability**: Adding new features doesn't affect existing structure

## Risks and Mitigation

### Risk 1: Breaking Changes During Migration

**Mitigation:**

- Migrate one feature at a time
- Run full test suite after each migration
- Use TypeScript to catch import errors
- Consider feature flags if needed

### Risk 2: Circular Dependencies

**Mitigation:**

- Define clear feature boundaries
- Use shared code for common functionality
- Avoid feature-to-feature imports (use shared or pass data via props)

### Risk 3: Large PR/Commit

**Mitigation:**

- Break migration into phases
- Create separate PRs for each feature
- Use automated refactoring tools where possible

### Risk 4: Import Path Updates

**Mitigation:**

- Use find/replace with careful review
- Use TypeScript compiler to find all usages
- Consider using codemods for automated migration

## Testing Strategy

1. **Unit Tests**: Ensure all feature tests pass after migration
2. **Integration Tests**: Verify features work together
3. **E2E Tests**: Run Playwright tests to ensure UI works
4. **Manual Testing**: Test critical user flows

## Timeline Estimate

- **Phase 1 (Preparation)**: 1-2 days
- **Phase 2 (Shared Code)**: 2-3 days
- **Phase 3 (Feature Migration)**: 1-2 days per feature × 8 features = 8-16 days
- **Phase 4 (Cleanup)**: 2-3 days

**Total: 13-24 days** (depending on feature complexity and testing)

## Success Criteria

1. ✅ All tests pass
2. ✅ No broken imports
3. ✅ All features work as before
4. ✅ Code is easier to navigate
5. ✅ Documentation is updated
6. ✅ Import paths use aliases consistently

## Next Steps

1. **Review this plan** with the team
2. **Get approval** to proceed
3. **Create feature branch** for migration
4. **Start with Phase 1** (preparation)
5. **Begin Phase 2** (shared code migration)

## Questions to Resolve

1. Should we use path aliases (`@/features/*`) or relative paths?
2. Should each feature have its own `types.ts` or use shared types?
3. How to handle cross-feature dependencies? (e.g., Dashboard needs Inventory)
4. Should we create a `lib/` folder for pure utility functions?
5. How to handle Storybook stories? Keep in feature folders or separate?

## References

- [Feature-Sliced Design](https://feature-sliced.design/)
- [React Folder Structure Best Practices](https://www.robinwieruch.de/react-folder-structure/)
- [Feature-Based Architecture](https://kentcdodds.com/blog/colocation)



