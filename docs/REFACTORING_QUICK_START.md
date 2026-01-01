# Feature Slices Refactoring - Quick Start Guide

This is a quick reference for developers working on the refactoring. For detailed information, see:

- [REFACTORING_PLAN.md](./REFACTORING_PLAN.md) - Complete plan and strategy
- [REFACTORING_FILE_MAPPING.md](./REFACTORING_FILE_MAPPING.md) - Detailed file mappings

## Setup Path Aliases

### 1. Update `tsconfig.json`

Add path aliases to `compilerOptions`:

```json
{
  "compilerOptions": {
    // ... existing options ...
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/features/*": ["./src/features/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/pages/*": ["./src/pages/*"],
      "@/data/*": ["./src/data/*"],
      "@/i18n/*": ["./src/i18n/*"]
    }
  }
}
```

### 2. Update `vite.config.ts`

Add resolve alias:

```typescript
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // ... existing config ...
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
      '@/features': path.resolve(dirname, './src/features'),
      '@/shared': path.resolve(dirname, './src/shared'),
      '@/pages': path.resolve(dirname, './src/pages'),
      '@/data': path.resolve(dirname, './src/data'),
      '@/i18n': path.resolve(dirname, './src/i18n'),
    },
  },
});
```

### 3. Update ESLint (if needed)

If using ESLint with import rules, update `.eslintrc` or `eslint.config.js`:

```javascript
settings: {
  'import/resolver': {
    alias: {
      map: [
        ['@', './src'],
        ['@/features', './src/features'],
        ['@/shared', './src/shared'],
        ['@/pages', './src/pages'],
        ['@/data', './src/data'],
        ['@/i18n', './src/i18n'],
      ],
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
  },
},
```

## Migration Order

Follow this order to minimize breaking changes:

1. **Shared Code** (Phase 2)
   - Shared components
   - Shared utilities
   - Shared types
   - Shared constants

2. **Features** (Phase 3) - One at a time:
   1. Household (simplest)
   2. Categories (data-only)
   3. Templates (data-only)
   4. Alerts (used by dashboard)
   5. Inventory (core feature)
   6. Dashboard (depends on inventory, alerts)
   7. Settings (depends on household, inventory)
   8. Onboarding (depends on household)

## Feature Structure Template

Each feature should follow this structure:

```
features/{feature-name}/
├── components/          # Feature-specific components
│   ├── ComponentName/
│   │   ├── ComponentName.tsx
│   │   ├── ComponentName.module.css
│   │   ├── ComponentName.test.tsx
│   │   ├── ComponentName.stories.tsx
│   │   └── index.ts
│   └── index.ts        # Re-export all components
├── hooks/              # Feature-specific hooks
│   ├── useFeatureHook.ts
│   └── index.ts
├── utils/              # Feature-specific utilities
│   ├── utility.ts
│   ├── utility.test.ts
│   └── index.ts
├── types.ts            # Feature-specific types
├── context.tsx         # Context (if needed)
├── provider.tsx        # Provider (if needed)
└── index.ts            # Public API exports
```

## Public API Pattern

Each feature's `index.ts` should export only the public API:

```typescript
// features/inventory/index.ts

// Components
export { ItemList } from './components/ItemList';
export { ItemForm } from './components/ItemForm';
// ... other components

// Hooks
export { useInventory } from './hooks/useInventory';

// Context/Provider
export { InventoryProvider } from './provider';
export type { InventoryContextValue } from './context';

// Types
export type { InventoryItem } from './types';

// Utils (if needed externally)
export { calculateItemStatus } from './utils/status';
```

## Import Pattern Examples

### Before (Responsibility-based)

```typescript
import { Button } from '../components/common/Button';
import { useInventory } from '../hooks/useInventory';
import { InventoryProvider } from '../contexts/InventoryProvider';
import { calculateItemStatus } from '../utils/calculations/status';
import type { InventoryItem } from '../types';
```

### After (Feature slices)

```typescript
import { Button } from '@/shared/components';
import { useInventory, InventoryProvider } from '@/features/inventory';
import { calculateItemStatus } from '@/features/inventory/utils';
import type { InventoryItem } from '@/shared/types';
```

## Testing After Migration

After migrating each feature:

1. **Run unit tests:**

   ```bash
   npm test
   ```

2. **Run type check:**

   ```bash
   npm run type-check  # or tsc --noEmit
   ```

3. **Run linter:**

   ```bash
   npm run lint
   ```

4. **Run E2E tests:**

   ```bash
   npm run test:e2e
   ```

5. **Manual testing:**
   - Test the feature in the browser
   - Verify all imports work
   - Check Storybook stories (if applicable)

## Common Issues & Solutions

### Issue: Circular Dependencies

**Problem:** Feature A imports from Feature B, and Feature B imports from Feature A.

**Solution:**

- Move shared code to `shared/`
- Pass data via props instead of direct imports
- Use dependency injection pattern

### Issue: Type Errors After Migration

**Problem:** TypeScript can't find types after moving files.

**Solution:**

- Ensure `tsconfig.json` paths are correct
- Restart TypeScript server in IDE
- Check that types are exported from feature's `index.ts`

### Issue: Import Path Not Resolved

**Problem:** Vite can't resolve `@/features/*` imports.

**Solution:**

- Verify `vite.config.ts` resolve.alias is configured
- Restart dev server
- Check that path is correct (relative to project root)

### Issue: Test Files Can't Find Imports

**Problem:** Tests fail after migration due to import errors.

**Solution:**

- Update test file imports to use new paths
- Ensure test setup files use correct paths
- Check Vitest/Jest configuration for path resolution

## Checklist for Each Feature Migration

- [ ] Create feature directory structure
- [ ] Move components
- [ ] Move hooks
- [ ] Move contexts/providers
- [ ] Move utilities
- [ ] Extract feature-specific types
- [ ] Create public API (`index.ts`)
- [ ] Update all imports in codebase
- [ ] Update imports in tests
- [ ] Update imports in Storybook stories
- [ ] Run tests (unit, integration, E2E)
- [ ] Manual testing
- [ ] Update documentation

## Git Workflow

1. **Create feature branch:**

   ```bash
   git checkout -b refactor/feature-slices
   ```

2. **Work in phases:**
   - Commit after each phase
   - Use descriptive commit messages
   - Example: `refactor: move shared components to shared/`

3. **Create PR after each feature:**
   - Small, reviewable PRs
   - Or one large PR with clear sections

4. **Merge strategy:**
   - Squash commits or keep history (team decision)
   - Ensure CI passes before merging

## Questions?

- See [REFACTORING_PLAN.md](./REFACTORING_PLAN.md) for detailed strategy
- See [REFACTORING_FILE_MAPPING.md](./REFACTORING_FILE_MAPPING.md) for file locations
- Check existing codebase for patterns



