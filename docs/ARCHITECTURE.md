# Architecture Overview

This document describes the application architecture using a **Feature Slice Architecture** pattern.

## Directory Structure

```
src/
├── features/              # Feature modules (domain-organized)
│   ├── alerts/            # Alert generation and display
│   ├── categories/        # Supply category definitions
│   ├── dashboard/         # Dashboard page and components
│   ├── household/         # Household configuration
│   ├── inventory/         # Inventory management
│   ├── onboarding/        # User onboarding flow
│   ├── settings/          # User settings
│   └── templates/         # Product templates (recommended items)
├── shared/                # Shared code across features
│   ├── components/        # Reusable UI components
│   ├── hooks/             # Shared custom hooks
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── pages/                 # Page components (composed from features)
├── components/            # App-level components (ThemeApplier)
├── i18n/                  # Internationalization configuration
└── locales/               # Translation files (en, fi)
```

## Feature Slices

Each feature slice is a self-contained module with its own:

- **Components** - UI components specific to the feature
- **Context/Provider** - State management for the feature
- **Hooks** - Custom hooks for accessing feature state
- **Utils** - Business logic and calculations
- **Types** - Feature-specific TypeScript types (re-exported via index.ts)

### Feature Structure

```
features/{feature-name}/
├── components/            # Feature-specific components
│   ├── ComponentName.tsx
│   ├── ComponentName.module.css
│   ├── ComponentName.stories.tsx
│   ├── ComponentName.test.tsx
│   └── index.ts           # Component exports
├── context/               # Feature context (optional)
│   └── index.ts
├── provider/              # Feature provider (optional)
│   └── index.ts
├── hooks/                 # Feature hooks (optional)
│   └── index.ts
├── utils/                 # Feature utilities (optional)
│   └── index.ts
└── index.ts               # Public API (barrel export)
```

### Public API (index.ts)

Each feature exports its public API through `index.ts`:

```typescript
// features/inventory/index.ts

// Context
export { InventoryContext } from './context';
export type { InventoryContextValue } from './context';

// Provider
export { InventoryProvider } from './provider';

// Hooks
export { useInventory } from './hooks';

// Utils
export { calculateItemStatus, getStatusFromPercentage } from './utils';

// Components
export { ItemCard, ItemList, ItemForm } from './components';
export type { ItemCardProps, ItemListProps, ItemFormProps } from './components';
```

## Feature Modules

### alerts

Alert generation and display for the dashboard.

- Components: `AlertBanner`, `HiddenAlerts`
- Utils: `generateDashboardAlerts`

### categories

Standard supply category definitions.

- Data: `STANDARD_CATEGORIES`
- Utils: `getCategoryById`

### dashboard

Dashboard page components and calculations.

- Components: `DashboardHeader`, `CategoryCard`, `CategoryGrid`
- Utils: `calculatePreparednessScore`, `calculateCategoryPreparedness`, backup reminder functions

### household

Household configuration state and calculations.

- Provider: `HouseholdProvider`
- Hooks: `useHousehold`
- Utils: `calculateRecommendedQuantity`, `calculateHouseholdMultiplier`

### inventory

Inventory management state and components.

- Provider: `InventoryProvider`
- Hooks: `useInventory`
- Components: `ItemCard`, `ItemList`, `ItemForm`, `CategoryNav`, `FilterBar`, `CategoryStatusSummary`
- Utils: Status calculations (`calculateItemStatus`, `isItemExpired`, etc.)

### onboarding

User onboarding flow.

- Components: `Onboarding`, `WelcomeScreen`, `HouseholdForm`, `QuickSetupScreen`, `HouseholdPresetSelector`

### settings

User settings state and components.

- Provider: `SettingsProvider`
- Hooks: `useSettings`
- Components: Various settings components (theme, language, import/export, etc.)

### templates

Product templates and recommended items management.

- Provider: `RecommendedItemsProvider`
- Hooks: `useRecommendedItems`
- Data: `RECOMMENDED_ITEMS`
- Components: `TemplateSelector`
- Utils: `getRecommendedItemById`, `getRecommendedItemsByCategory`

## Shared Module

The `shared/` directory contains code that is used across multiple features:

### components

Reusable UI components: `Button`, `Modal`, `Badge`, `Select`, `Navigation`, etc.

### hooks

Shared hooks:

- `useKeyboardNavigation` - Keyboard navigation utilities

### types

Shared TypeScript type definitions used across features.

### utils

Shared utility functions:

- `calculations/` - Calorie, water, household calculations
- `storage/` - LocalStorage operations
- `analytics/` - Usage tracking
- `errorLogger/` - Error logging
- `validation/` - Data validation

## Import Guidelines

### Feature-to-Feature Imports

Features can import from other features through their public API:

```typescript
// In features/dashboard/utils/categoryStatus.ts
import { calculateItemStatus } from '@/features/inventory';
import { STANDARD_CATEGORIES } from '@/features/categories';
```

### Shared Imports

All code can import from shared:

```typescript
import { Button } from '@/shared/components/Button';
import type { InventoryItem } from '@/shared/types';
```

### Page Imports

Pages compose features:

```typescript
// In pages/Dashboard.tsx
import { useInventory } from '@/features/inventory';
import { useHousehold } from '@/features/household';
import { DashboardHeader, CategoryGrid } from '@/features/dashboard';
```

## State Management

State is managed through React Context within feature providers:

1. **SettingsProvider** - User preferences (theme, language, nutrition settings)
2. **HouseholdProvider** - Household configuration (adults, children, supply days)
3. **InventoryProvider** - Inventory items and operations
4. **RecommendedItemsProvider** - Recommended items (built-in or custom)

Providers are composed in `App.tsx`:

```tsx
<SettingsProvider>
  <HouseholdProvider>
    <RecommendedItemsProvider>
      <InventoryProvider>
        <AppContent />
      </InventoryProvider>
    </RecommendedItemsProvider>
  </HouseholdProvider>
</SettingsProvider>
```

## Testing Strategy

See [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) for the complete testing approach.

- **Unit Tests** (10%): Pure utility functions
- **Integration Tests** (70%): Components with React Testing Library
- **E2E Tests** (20%): Critical user flows with Playwright

Test files are co-located with their source files:

- `ComponentName.test.tsx` for components
- `utils.test.ts` for utilities

## Future Considerations

1. **Feature Lazy Loading**: Features could be lazy-loaded for better initial bundle size.

2. **Feature Testing Isolation**: Each feature could have its own test setup for better isolation.
