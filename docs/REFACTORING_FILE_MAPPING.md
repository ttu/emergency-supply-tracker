# Feature Slices Refactoring - File Mapping

This document provides a detailed mapping of current files to their new locations in the feature slices architecture.

## File Mapping Legend

- `→` = Move to
- `📁` = Directory
- `📄` = File

## Shared Code Migration

### Shared Components

| Current Location                              | New Location                                                   | Notes |
| --------------------------------------------- | -------------------------------------------------------------- | ----- |
| `components/common/Button.tsx`                | `shared/components/Button/Button.tsx`                          |       |
| `components/common/Button.module.css`         | `shared/components/Button/Button.module.css`                   |       |
| `components/common/Button.test.tsx`           | `shared/components/Button/Button.test.tsx`                     |       |
| `components/common/Button.stories.tsx`        | `shared/components/Button/Button.stories.tsx`                  |       |
| `components/common/Modal.tsx`                 | `shared/components/Modal/Modal.tsx`                            |       |
| `components/common/Modal.module.css`          | `shared/components/Modal/Modal.module.css`                     |       |
| `components/common/Modal.test.tsx`            | `shared/components/Modal/Modal.test.tsx`                       |       |
| `components/common/Modal.stories.tsx`         | `shared/components/Modal/Modal.stories.tsx`                    |       |
| `components/common/Input.tsx`                 | `shared/components/Input/Input.tsx`                            |       |
| `components/common/Input.module.css`          | `shared/components/Input/Input.module.css`                     |       |
| `components/common/Input.test.tsx`            | `shared/components/Input/Input.test.tsx`                       |       |
| `components/common/Input.stories.tsx`         | `shared/components/Input/Input.stories.tsx`                    |       |
| `components/common/Card.tsx`                  | `shared/components/Card/Card.tsx`                              |       |
| `components/common/Card.module.css`           | `shared/components/Card/Card.module.css`                       |       |
| `components/common/Card.test.tsx`             | `shared/components/Card/Card.test.tsx`                         |       |
| `components/common/Card.stories.tsx`          | `shared/components/Card/Card.stories.tsx`                      |       |
| `components/common/Badge.tsx`                 | `shared/components/Badge/Badge.tsx`                            |       |
| `components/common/Badge.module.css`          | `shared/components/Badge/Badge.module.css`                     |       |
| `components/common/Badge.test.tsx`            | `shared/components/Badge/Badge.test.tsx`                       |       |
| `components/common/Badge.stories.tsx`         | `shared/components/Badge/Badge.stories.tsx`                    |       |
| `components/common/Tooltip.tsx`               | `shared/components/Tooltip/Tooltip.tsx`                        |       |
| `components/common/Tooltip.module.css`        | `shared/components/Tooltip/Tooltip.module.css`                 |       |
| `components/common/Tooltip.test.tsx`          | `shared/components/Tooltip/Tooltip.test.tsx`                   |       |
| `components/common/Tooltip.stories.tsx`       | `shared/components/Tooltip/Tooltip.stories.tsx`                |       |
| `components/common/Select.tsx`                | `shared/components/Select/Select.tsx`                          |       |
| `components/common/Select.module.css`         | `shared/components/Select/Select.module.css`                   |       |
| `components/common/Select.test.tsx`           | `shared/components/Select/Select.test.tsx`                     |       |
| `components/common/Select.stories.tsx`        | `shared/components/Select/Select.stories.tsx`                  |       |
| `components/common/ErrorBoundary.tsx`         | `shared/components/ErrorBoundary/ErrorBoundary.tsx`            |       |
| `components/common/ErrorBoundary.module.css`  | `shared/components/ErrorBoundary/ErrorBoundary.module.css`     |       |
| `components/common/ErrorBoundary.test.tsx`    | `shared/components/ErrorBoundary/ErrorBoundary.test.tsx`       |       |
| `components/common/Navigation.tsx`            | `shared/components/Navigation/Navigation.tsx`                  |       |
| `components/common/Navigation.module.css`     | `shared/components/Navigation/Navigation.module.css`           |       |
| `components/common/Navigation.test.tsx`       | `shared/components/Navigation/Navigation.test.tsx`             |       |
| `components/common/Navigation.stories.tsx`    | `shared/components/Navigation/Navigation.stories.tsx`          |       |
| `components/common/LanguageSwitcher.tsx`      | `shared/components/LanguageSwitcher/LanguageSwitcher.tsx`      |       |
| `components/common/LanguageSwitcher.test.tsx` | `shared/components/LanguageSwitcher/LanguageSwitcher.test.tsx` |       |

### Shared Layout Components

| Current Location                       | New Location                                  | Notes |
| -------------------------------------- | --------------------------------------------- | ----- |
| `components/layout/Header.tsx`         | `shared/components/Header/Header.tsx`         |       |
| `components/layout/Header.module.css`  | `shared/components/Header/Header.module.css`  |       |
| `components/layout/Footer.tsx`         | `shared/components/Footer/Footer.tsx`         |       |
| `components/layout/Footer.module.css`  | `shared/components/Footer/Footer.module.css`  |       |
| `components/layout/Layout.tsx`         | `shared/components/Layout/Layout.tsx`         |       |
| `components/layout/Layout.module.css`  | `shared/components/Layout/Layout.module.css`  |       |
| `components/layout/Layout.test.tsx`    | `shared/components/Layout/Layout.test.tsx`    |       |
| `components/layout/Layout.stories.tsx` | `shared/components/Layout/Layout.stories.tsx` |       |

### Shared Utilities

| Current Location                     | New Location                                | Notes            |
| ------------------------------------ | ------------------------------------------- | ---------------- |
| `utils/storage/localStorage.ts`      | `shared/utils/storage/localStorage.ts`      |                  |
| `utils/storage/localStorage.test.ts` | `shared/utils/storage/localStorage.test.ts` |                  |
| `utils/analytics/*`                  | `shared/utils/analytics/*`                  | Entire directory |
| `utils/errorLogger/*`                | `shared/utils/errorLogger/*`                | Entire directory |
| `utils/test/factories.ts`            | `shared/utils/test/factories.ts`            |                  |
| `utils/test/factories.test.ts`       | `shared/utils/test/factories.test.ts`       |                  |
| `utils/urlLanguage.ts`               | `shared/utils/urlLanguage.ts`               |                  |
| `utils/urlLanguage.test.ts`          | `shared/utils/urlLanguage.test.ts`          |                  |
| `utils/version.ts`                   | `shared/utils/version.ts`                   |                  |
| `utils/serviceWorker.ts`             | `shared/utils/serviceWorker.ts`             |                  |

### Shared Types

| Current Location | New Location            | Notes                           |
| ---------------- | ----------------------- | ------------------------------- |
| `types/index.ts` | `shared/types/index.ts` | Core types used across features |

### Shared Constants

| Current Location          | New Location                | Notes       |
| ------------------------- | --------------------------- | ----------- |
| `utils/constants.ts`      | `shared/constants/index.ts` | Rename file |
| `constants/*` (if exists) | `shared/constants/*`        |             |

## Feature Migrations

### 1. Household Feature

| Current Location                                  | New Location                                              | Notes                                             |
| ------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------- |
| `contexts/HouseholdContext.ts`                    | `features/household/context.ts`                           | Rename file                                       |
| `contexts/HouseholdProvider.tsx`                  | `features/household/provider.tsx`                         | Rename file                                       |
| `hooks/useHousehold.ts`                           | `features/household/hooks/useHousehold.ts`                |                                                   |
| `utils/calculations/household.ts`                 | `features/household/utils/calculations.ts`                |                                                   |
| `utils/calculations/household.test.ts`            | `features/household/utils/calculations.test.ts`           |                                                   |
| `components/onboarding/HouseholdForm.tsx`         | `features/household/components/HouseholdForm.tsx`         |                                                   |
| `components/onboarding/HouseholdForm.module.css`  | `features/household/components/HouseholdForm.module.css`  |                                                   |
| `components/onboarding/HouseholdForm.test.tsx`    | `features/household/components/HouseholdForm.test.tsx`    |                                                   |
| `components/onboarding/HouseholdForm.stories.tsx` | `features/household/components/HouseholdForm.stories.tsx` |                                                   |
| `components/settings/HouseholdForm.tsx`           | `features/household/components/HouseholdForm.tsx`         | ⚠️ May need to merge or create separate component |
| `components/settings/HouseholdForm.module.css`    | `features/household/components/HouseholdForm.module.css`  |                                                   |
| `components/settings/HouseholdForm.test.tsx`      | `features/household/components/HouseholdForm.test.tsx`    |                                                   |
| `components/settings/HouseholdForm.stories.tsx`   | `features/household/components/HouseholdForm.stories.tsx` |                                                   |

**Create:**

- `features/household/types.ts` - Extract household-specific types
- `features/household/index.ts` - Public API

### 2. Inventory Feature

| Current Location                      | New Location                               | Notes                         |
| ------------------------------------- | ------------------------------------------ | ----------------------------- |
| `contexts/InventoryContext.ts`        | `features/inventory/context.ts`            | Rename file                   |
| `contexts/InventoryProvider.tsx`      | `features/inventory/provider.tsx`          | Rename file                   |
| `contexts/InventoryProvider.test.tsx` | `features/inventory/provider.test.tsx`     |                               |
| `hooks/useInventory.ts`               | `features/inventory/hooks/useInventory.ts` |                               |
| `components/inventory/*`              | `features/inventory/components/*`          | All inventory components      |
| `utils/calculations/status.ts`        | `features/inventory/utils/status.ts`       |                               |
| `utils/calculations/status.test.ts`   | `features/inventory/utils/status.test.ts`  |                               |
| `pages/Inventory.tsx`                 | `pages/Inventory.tsx`                      | Keep in pages, update imports |
| `pages/Inventory.module.css`          | `pages/Inventory.module.css`               |                               |
| `pages/Inventory.test.tsx`            | `pages/Inventory.test.tsx`                 |                               |
| `pages/Inventory.stories.tsx`         | `pages/Inventory.stories.tsx`              |                               |

**Create:**

- `features/inventory/types.ts` - Extract inventory-specific types
- `features/inventory/index.ts` - Public API

### 3. Dashboard Feature

| Current Location                         | New Location                                      | Notes                         |
| ---------------------------------------- | ------------------------------------------------- | ----------------------------- |
| `components/dashboard/*`                 | `features/dashboard/components/*`                 | All dashboard components      |
| `utils/dashboard/preparedness.ts`        | `features/dashboard/utils/preparedness.ts`        |                               |
| `utils/dashboard/preparedness.test.ts`   | `features/dashboard/utils/preparedness.test.ts`   |                               |
| `utils/dashboard/categoryStatus.ts`      | `features/dashboard/utils/categoryStatus.ts`      |                               |
| `utils/dashboard/categoryStatus.test.ts` | `features/dashboard/utils/categoryStatus.test.ts` |                               |
| `utils/dashboard/backupReminder.ts`      | `features/dashboard/utils/backupReminder.ts`      |                               |
| `utils/dashboard/backupReminder.test.ts` | `features/dashboard/utils/backupReminder.test.ts` |                               |
| `pages/Dashboard.tsx`                    | `pages/Dashboard.tsx`                             | Keep in pages, update imports |
| `pages/Dashboard.module.css`             | `pages/Dashboard.module.css`                      |                               |
| `pages/Dashboard.test.tsx`               | `pages/Dashboard.test.tsx`                        |                               |
| `pages/Dashboard.stories.tsx`            | `pages/Dashboard.stories.tsx`                     |                               |

**Create:**

- `features/dashboard/types.ts` - Extract dashboard-specific types
- `features/dashboard/index.ts` - Public API

### 4. Alerts Feature

| Current Location                               | New Location                                         | Notes |
| ---------------------------------------------- | ---------------------------------------------------- | ----- |
| `hooks/useAlerts.ts`                           | `features/alerts/hooks/useAlerts.ts`                 |       |
| `hooks/useAlerts.test.tsx`                     | `features/alerts/hooks/useAlerts.test.tsx`           |       |
| `components/dashboard/AlertBanner.tsx`         | `features/alerts/components/AlertBanner.tsx`         |       |
| `components/dashboard/AlertBanner.module.css`  | `features/alerts/components/AlertBanner.module.css`  |       |
| `components/dashboard/AlertBanner.test.tsx`    | `features/alerts/components/AlertBanner.test.tsx`    |       |
| `components/dashboard/AlertBanner.stories.tsx` | `features/alerts/components/AlertBanner.stories.tsx` |       |
| `utils/dashboard/alerts.ts`                    | `features/alerts/utils/alerts.ts`                    |       |
| `utils/dashboard/alerts.test.ts`               | `features/alerts/utils/alerts.test.ts`               |       |

**Create:**

- `features/alerts/types.ts` - Alert types (extract from AlertBanner)
- `features/alerts/index.ts` - Public API

### 5. Settings Feature

| Current Location                | New Location                             | Notes                                          |
| ------------------------------- | ---------------------------------------- | ---------------------------------------------- |
| `contexts/SettingsContext.ts`   | `features/settings/context.ts`           | Rename file                                    |
| `contexts/SettingsProvider.tsx` | `features/settings/provider.tsx`         | Rename file                                    |
| `hooks/useSettings.ts`          | `features/settings/hooks/useSettings.ts` |                                                |
| `components/settings/*`         | `features/settings/components/*`         | All settings components (except HouseholdForm) |
| `pages/Settings.tsx`            | `pages/Settings.tsx`                     | Keep in pages, update imports                  |
| `pages/Settings.module.css`     | `pages/Settings.module.css`              |                                                |
| `pages/Settings.test.tsx`       | `pages/Settings.test.tsx`                |                                                |
| `pages/Settings.stories.tsx`    | `pages/Settings.stories.tsx`             |                                                |

**Create:**

- `features/settings/types.ts` - Extract settings-specific types
- `features/settings/index.ts` - Public API

### 6. Onboarding Feature

| Current Location                                    | New Location                                                 | Notes                                            |
| --------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------ |
| `components/onboarding/*`                           | `features/onboarding/components/*`                           | All onboarding components (except HouseholdForm) |
| `components/onboarding/Onboarding.tsx`              | `features/onboarding/components/Onboarding.tsx`              |                                                  |
| `components/onboarding/WelcomeScreen.tsx`           | `features/onboarding/components/WelcomeScreen.tsx`           |                                                  |
| `components/onboarding/QuickSetupScreen.tsx`        | `features/onboarding/components/QuickSetupScreen.tsx`        |                                                  |
| `components/onboarding/HouseholdPresetSelector.tsx` | `features/onboarding/components/HouseholdPresetSelector.tsx` |                                                  |

**Create:**

- `features/onboarding/types.ts` - Extract onboarding-specific types
- `features/onboarding/index.ts` - Public API

### 7. Categories Feature

| Current Location                  | New Location                                          | Notes |
| --------------------------------- | ----------------------------------------------------- | ----- |
| `data/standardCategories.ts`      | `features/categories/data/standardCategories.ts`      |       |
| `data/standardCategories.test.ts` | `features/categories/data/standardCategories.test.ts` |       |

**Create:**

- `features/categories/types.ts` - Category types (may already be in shared/types)
- `features/categories/index.ts` - Public API

### 8. Templates Feature

| Current Location                                    | New Location                                                 | Notes |
| --------------------------------------------------- | ------------------------------------------------------------ | ----- |
| `data/recommendedItems.ts`                          | `features/templates/data/recommendedItems.ts`                |       |
| `components/inventory/TemplateSelector.tsx`         | `features/templates/components/TemplateSelector.tsx`         |       |
| `components/inventory/TemplateSelector.module.css`  | `features/templates/components/TemplateSelector.module.css`  |       |
| `components/inventory/TemplateSelector.test.tsx`    | `features/templates/components/TemplateSelector.test.tsx`    |       |
| `components/inventory/TemplateSelector.stories.tsx` | `features/templates/components/TemplateSelector.stories.tsx` |       |

**Create:**

- `features/templates/types.ts` - Template types (may already be in shared/types)
- `features/templates/index.ts` - Public API

## Calculation Utilities Distribution

These calculation utilities are used by multiple features. Decision needed on where to place them:

| Current Location                      | Options                                                                       | Recommendation                                                      |
| ------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `utils/calculations/calories.ts`      | `features/inventory/utils/` or `features/dashboard/utils/` or `shared/utils/` | `shared/utils/calculations/` (used by both inventory and dashboard) |
| `utils/calculations/calories.test.ts` | Same as above                                                                 | Same as above                                                       |
| `utils/calculations/water.ts`         | `features/inventory/utils/` or `features/dashboard/utils/` or `shared/utils/` | `shared/utils/calculations/` (used by both inventory and dashboard) |
| `utils/calculations/water.test.ts`    | Same as above                                                                 | Same as above                                                       |

## Files to Keep in Place

| Location                 | Reason                                                        |
| ------------------------ | ------------------------------------------------------------- |
| `pages/*`                | Page components orchestrate features, keep at root level      |
| `app/` or root `App.tsx` | App-level setup                                               |
| `i18n/config.ts`         | Internationalization config                                   |
| `data/`                  | May keep as-is or move to features (see Categories/Templates) |

## Import Path Updates

### Before → After Examples

```typescript
// Shared Components
import { Button } from '../components/common/Button';
→ import { Button } from '@/shared/components';

// Feature Hooks
import { useInventory } from '../hooks/useInventory';
→ import { useInventory } from '@/features/inventory';

// Feature Contexts
import { InventoryProvider } from '../contexts/InventoryProvider';
→ import { InventoryProvider } from '@/features/inventory';

// Feature Components
import { ItemList } from '../components/inventory/ItemList';
→ import { ItemList } from '@/features/inventory';

// Feature Utils
import { calculateItemStatus } from '../utils/calculations/status';
→ import { calculateItemStatus } from '@/features/inventory/utils';

// Shared Utils
import { getAppData } from '../utils/storage/localStorage';
→ import { getAppData } from '@/shared/utils/storage';

// Shared Types
import type { InventoryItem } from '../types';
→ import type { InventoryItem } from '@/shared/types';
```

## Notes

1. **Component Index Files**: Each component directory should have an `index.ts` that exports the component
2. **Feature Index Files**: Each feature should have an `index.ts` that exports the public API
3. **Shared Index Files**: `shared/components/index.ts` should re-export all shared components
4. **Type Extraction**: Some types may need to be extracted from `shared/types/index.ts` to feature-specific `types.ts` files
5. **Test Files**: All test files move with their corresponding source files
6. **Storybook Files**: All `.stories.tsx` files move with their corresponding components

## Migration Checklist

Use this checklist to track progress:

- [ ] Phase 1: Preparation
  - [ ] Create directory structure
  - [ ] Set up path aliases in tsconfig.json and vite.config.ts
  - [ ] Document all current imports

- [ ] Phase 2: Shared Code
  - [ ] Move shared components
  - [ ] Move shared utilities
  - [ ] Move shared types
  - [ ] Move shared constants
  - [ ] Update all imports
  - [ ] Run tests

- [ ] Phase 3: Feature Migration
  - [ ] Household feature
  - [ ] Categories feature
  - [ ] Templates feature
  - [ ] Alerts feature
  - [ ] Inventory feature
  - [ ] Dashboard feature
  - [ ] Settings feature
  - [ ] Onboarding feature

- [ ] Phase 4: Cleanup
  - [ ] Remove empty directories
  - [ ] Update documentation
  - [ ] Update Storybook config (if needed)
  - [ ] Final test run
  - [ ] Code review



