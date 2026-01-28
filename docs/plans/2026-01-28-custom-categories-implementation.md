# Custom Categories Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable users to define custom categories in kit imports and manage them via a Settings UI.

**Architecture:** Extend existing `Category` type with localization fields. Add `categories` array to `RecommendedItemsFile`. Create new Settings section for category CRUD. Use existing patterns from `DisabledCategories` component.

**Tech Stack:** React 19, TypeScript, Vitest, CSS Modules, react-i18next

---

## Task 1: Extend Category Type

**Files:**

- Modify: `src/shared/types/index.ts`

**Step 1: Add ImportedCategory interface and extend Category**

Add after the existing `Category` interface (around line 135):

```typescript
// Add after existing LocalizedNames type (line 217)

/**
 * Category definition in imported kit files.
 * Used for custom categories defined in recommendation kits.
 */
export interface ImportedCategory {
  id: string;
  names: LocalizedNames;
  icon: string;
  description?: LocalizedNames;
  sortOrder?: number;
  color?: string;
}
```

Then update the existing `Category` interface (lines 130-135):

```typescript
// Category
export interface Category {
  id: CategoryId;
  name: string;
  names?: LocalizedNames; // NEW: Localized names for custom categories
  icon?: string;
  isCustom: boolean;
  description?: string; // NEW: Current language description
  descriptions?: LocalizedNames; // NEW: Localized descriptions
  sortOrder?: number; // NEW: Position in category lists
  color?: string; // NEW: Hex color for category accent
  sourceKitId?: KitId; // NEW: Which kit imported this category
}
```

**Step 2: Run type check to verify no breaks**

Run: `npm run type-check`
Expected: PASS (no type errors)

**Step 3: Commit**

```bash
git add src/shared/types/index.ts
git commit -m "feat: extend Category type with localization and import support"
```

---

## Task 2: Update RecommendedItemsFile Type

**Files:**

- Modify: `src/shared/types/index.ts`

**Step 1: Update RecommendedItemsFile interface**

Find the `RecommendedItemsFile` interface (around line 264) and add categories:

```typescript
// Recommended Items File (for import/export)
export interface RecommendedItemsFile {
  meta: RecommendedItemsFileMeta;
  categories?: ImportedCategory[]; // NEW: Custom category definitions
  items: ImportedRecommendedItem[];
}
```

**Step 2: Update ImportedRecommendedItem.category type**

Find `ImportedRecommendedItem` interface (around line 225) and change category field:

```typescript
export interface ImportedRecommendedItem {
  id: ProductTemplateId;
  i18nKey?: string;
  names?: LocalizedNames;
  category: StandardCategoryId | string; // CHANGED: Accept custom category IDs
  // ... rest unchanged
}
```

**Step 3: Run type check**

Run: `npm run type-check`
Expected: May have errors in validation file - that's expected, we fix next

**Step 4: Commit**

```bash
git add src/shared/types/index.ts
git commit -m "feat: add categories array to RecommendedItemsFile"
```

---

## Task 3: Add Category Validation Functions

**Files:**

- Modify: `src/shared/utils/validation/recommendedItemsValidation.ts`
- Create: `src/shared/utils/validation/categoryValidation.ts`
- Create: `src/shared/utils/validation/categoryValidation.test.ts`

**Step 1: Create categoryValidation.ts with tests first**

Create `src/shared/utils/validation/categoryValidation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  validateImportedCategory,
  validateImportedCategories,
  isValidCategoryId,
} from './categoryValidation';

describe('categoryValidation', () => {
  describe('isValidCategoryId', () => {
    it('accepts kebab-case ids', () => {
      expect(isValidCategoryId('camping-gear')).toBe(true);
      expect(isValidCategoryId('vehicle-kit')).toBe(true);
      expect(isValidCategoryId('my-custom-category')).toBe(true);
    });

    it('rejects invalid ids', () => {
      expect(isValidCategoryId('')).toBe(false);
      expect(isValidCategoryId('has spaces')).toBe(false);
      expect(isValidCategoryId('UPPERCASE')).toBe(false);
      expect(isValidCategoryId('has_underscore')).toBe(false);
    });

    it('rejects ids that are too short or too long', () => {
      expect(isValidCategoryId('ab')).toBe(false);
      expect(isValidCategoryId('a'.repeat(51))).toBe(false);
    });
  });

  describe('validateImportedCategory', () => {
    const validCategory = {
      id: 'camping-gear',
      names: { en: 'Camping Gear' },
      icon: '⛺',
    };

    it('accepts valid category', () => {
      const result = validateImportedCategory(validCategory, 0);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects missing id', () => {
      const result = validateImportedCategory({ ...validCategory, id: '' }, 0);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_CATEGORY_ID' }),
      );
    });

    it('rejects missing names.en', () => {
      const result = validateImportedCategory(
        { ...validCategory, names: { fi: 'Test' } },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'MISSING_CATEGORY_NAME' }),
      );
    });

    it('rejects invalid icon', () => {
      const result = validateImportedCategory(
        { ...validCategory, icon: 'not-emoji' },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_CATEGORY_ICON' }),
      );
    });

    it('rejects invalid color format', () => {
      const result = validateImportedCategory(
        { ...validCategory, color: 'red' },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_CATEGORY_COLOR' }),
      );
    });

    it('accepts valid hex colors', () => {
      expect(
        validateImportedCategory({ ...validCategory, color: '#fff' }, 0).errors,
      ).toHaveLength(0);
      expect(
        validateImportedCategory({ ...validCategory, color: '#ffffff' }, 0)
          .errors,
      ).toHaveLength(0);
    });
  });

  describe('validateImportedCategories', () => {
    it('detects duplicate category ids', () => {
      const categories = [
        { id: 'camping-gear', names: { en: 'Camping' }, icon: '⛺' },
        { id: 'camping-gear', names: { en: 'Camping 2' }, icon: '🏕️' },
      ];
      const result = validateImportedCategories(categories);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'DUPLICATE_CATEGORY_ID' }),
      );
    });

    it('detects conflict with standard categories', () => {
      const categories = [{ id: 'food', names: { en: 'My Food' }, icon: '🍕' }];
      const result = validateImportedCategories(categories);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'CATEGORY_CONFLICTS_STANDARD' }),
      );
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/shared/utils/validation/categoryValidation.test.ts`
Expected: FAIL (module not found)

**Step 3: Create categoryValidation.ts implementation**

Create `src/shared/utils/validation/categoryValidation.ts`:

```typescript
import type { ImportedCategory } from '@/shared/types';
import { VALID_CATEGORIES } from '@/shared/types';
import type {
  ValidationError,
  ValidationWarning,
} from './recommendedItemsValidation';

/**
 * Validates a category ID is kebab-case, 3-50 characters.
 */
export function isValidCategoryId(id: string): boolean {
  if (!id || id.length < 3 || id.length > 50) return false;
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id);
}

/**
 * Validates a hex color string (#RGB or #RRGGBB).
 */
export function isValidHexColor(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

/**
 * Validates an emoji icon (basic check).
 */
function isValidEmoji(icon: string): boolean {
  const emojiRegex =
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/u;
  return emojiRegex.test(icon);
}

export interface CategoryValidationResult {
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validates a single imported category.
 */
export function validateImportedCategory(
  category: unknown,
  index: number,
): CategoryValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const path = `categories[${index}]`;

  if (!category || typeof category !== 'object') {
    errors.push({
      path,
      message: 'Category must be an object',
      code: 'INVALID_CATEGORY',
    });
    return { errors, warnings };
  }

  const c = category as Record<string, unknown>;

  // Required: id (kebab-case, 3-50 chars)
  if (typeof c.id !== 'string' || !isValidCategoryId(c.id)) {
    errors.push({
      path: `${path}.id`,
      message: 'Category ID must be kebab-case, 3-50 characters',
      code: 'INVALID_CATEGORY_ID',
    });
  }

  // Required: names with at least 'en' key
  if (!c.names || typeof c.names !== 'object' || Array.isArray(c.names)) {
    errors.push({
      path: `${path}.names`,
      message: 'Category names must be an object',
      code: 'INVALID_CATEGORY_NAMES',
    });
  } else {
    const names = c.names as Record<string, unknown>;
    if (typeof names.en !== 'string' || names.en.trim() === '') {
      errors.push({
        path: `${path}.names.en`,
        message: 'Category must have names.en (English name)',
        code: 'MISSING_CATEGORY_NAME',
      });
    }
  }

  // Required: icon (emoji)
  if (typeof c.icon !== 'string' || !isValidEmoji(c.icon)) {
    errors.push({
      path: `${path}.icon`,
      message: 'Category icon must be a valid emoji',
      code: 'INVALID_CATEGORY_ICON',
    });
  }

  // Optional: color (hex format)
  if (c.color !== undefined) {
    if (typeof c.color !== 'string' || !isValidHexColor(c.color)) {
      errors.push({
        path: `${path}.color`,
        message: 'Category color must be valid hex format (#RGB or #RRGGBB)',
        code: 'INVALID_CATEGORY_COLOR',
      });
    }
  }

  // Optional: sortOrder (positive integer)
  if (c.sortOrder !== undefined) {
    if (
      typeof c.sortOrder !== 'number' ||
      !Number.isInteger(c.sortOrder) ||
      c.sortOrder < 0
    ) {
      warnings.push({
        path: `${path}.sortOrder`,
        message: 'sortOrder should be a non-negative integer',
        code: 'INVALID_SORT_ORDER',
      });
    }
  }

  return { errors, warnings };
}

/**
 * Validates an array of imported categories.
 * Checks for duplicates and conflicts with standard categories.
 */
export function validateImportedCategories(
  categories: unknown[],
): CategoryValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const seenIds = new Set<string>();

  categories.forEach((category, index) => {
    const result = validateImportedCategory(category, index);
    errors.push(...result.errors);
    warnings.push(...result.warnings);

    // Check for duplicate IDs
    if (category && typeof category === 'object') {
      const c = category as Record<string, unknown>;
      if (typeof c.id === 'string') {
        if (seenIds.has(c.id)) {
          errors.push({
            path: `categories[${index}].id`,
            message: `Duplicate category ID: ${c.id}`,
            code: 'DUPLICATE_CATEGORY_ID',
          });
        } else {
          seenIds.add(c.id);
        }

        // Check for conflict with standard categories
        if (VALID_CATEGORIES.includes(c.id as never)) {
          errors.push({
            path: `categories[${index}].id`,
            message: `Category ID '${c.id}' conflicts with standard category`,
            code: 'CATEGORY_CONFLICTS_STANDARD',
          });
        }
      }
    }
  });

  return { errors, warnings };
}

/**
 * Gets the set of valid category IDs from a kit file.
 * Includes both standard categories and custom categories defined in the file.
 */
export function getValidCategoryIds(
  customCategories: ImportedCategory[] | undefined,
): Set<string> {
  const validIds = new Set<string>(VALID_CATEGORIES);
  if (customCategories) {
    customCategories.forEach((cat) => validIds.add(cat.id));
  }
  return validIds;
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/shared/utils/validation/categoryValidation.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/shared/utils/validation/categoryValidation.ts src/shared/utils/validation/categoryValidation.test.ts
git commit -m "feat: add category validation functions with tests"
```

---

## Task 4: Update Kit Validation to Support Custom Categories

**Files:**

- Modify: `src/shared/utils/validation/recommendedItemsValidation.ts`
- Modify: `src/shared/utils/validation/recommendedItemsValidation.test.ts`

**Step 1: Add tests for category validation in kit files**

Add to `src/shared/utils/validation/recommendedItemsValidation.test.ts`:

```typescript
describe('validateRecommendedItemsFile with custom categories', () => {
  const validMeta = {
    name: 'Test Kit',
    version: '1.0.0',
    createdAt: '2026-01-28T00:00:00Z',
  };

  it('accepts items using custom categories defined in file', () => {
    const data = {
      meta: validMeta,
      categories: [
        { id: 'camping-gear', names: { en: 'Camping' }, icon: '⛺' },
      ],
      items: [
        {
          id: 'tent',
          names: { en: 'Tent' },
          category: 'camping-gear',
          baseQuantity: 1,
          unit: 'pieces',
          scaleWithPeople: false,
          scaleWithDays: false,
        },
      ],
    };
    const result = validateRecommendedItemsFile(data);
    expect(result.valid).toBe(true);
  });

  it('rejects items using undefined custom category', () => {
    const data = {
      meta: validMeta,
      items: [
        {
          id: 'tent',
          names: { en: 'Tent' },
          category: 'undefined-category',
          baseQuantity: 1,
          unit: 'pieces',
          scaleWithPeople: false,
          scaleWithDays: false,
        },
      ],
    };
    const result = validateRecommendedItemsFile(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'INVALID_CATEGORY' }),
    );
  });

  it('validates category definitions', () => {
    const data = {
      meta: validMeta,
      categories: [{ id: 'invalid id', names: { en: 'Test' }, icon: '⛺' }],
      items: [],
    };
    const result = validateRecommendedItemsFile(data);
    expect(result.valid).toBe(false);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/shared/utils/validation/recommendedItemsValidation.test.ts`
Expected: FAIL (tests fail because validation not updated)

**Step 3: Update validateRecommendedItemsFile to handle categories**

Modify `src/shared/utils/validation/recommendedItemsValidation.ts`:

1. Add import at top:

```typescript
import {
  validateImportedCategories,
  getValidCategoryIds,
} from './categoryValidation';
```

2. Update `isValidCategory` function to accept custom categories:

```typescript
function isValidCategory(
  value: unknown,
  validCategoryIds: Set<string>,
): boolean {
  return typeof value === 'string' && validCategoryIds.has(value);
}
```

3. Update `validateItem` to accept validCategoryIds parameter:

```typescript
function validateItem(
  item: unknown,
  index: number,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  validCategoryIds: Set<string>,
): void {
  // ... existing code ...

  // Required: category - update the check
  if (!isValidCategory(i.category, validCategoryIds)) {
    errors.push({
      path: `${path}.category`,
      message: `Invalid category: ${String(i.category)}. Must be a standard category or defined in categories array`,
      code: 'INVALID_CATEGORY',
    });
  }

  // ... rest unchanged
}
```

4. Update `validateRecommendedItemsFile`:

```typescript
export function validateRecommendedItemsFile(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // ... existing structure validation ...

  const d = data as Record<string, unknown>;

  // Validate meta
  validateMeta(d.meta, errors);

  // Validate categories array if present
  let validCategoryIds = new Set<string>(VALID_CATEGORIES);
  if (d.categories !== undefined) {
    if (!Array.isArray(d.categories)) {
      errors.push({
        path: 'categories',
        message: 'Categories must be an array',
        code: 'INVALID_CATEGORIES',
      });
    } else {
      const categoryResult = validateImportedCategories(d.categories);
      errors.push(...categoryResult.errors);
      warnings.push(...categoryResult.warnings);

      // Build valid category IDs including custom ones
      validCategoryIds = getValidCategoryIds(
        d.categories as ImportedCategory[],
      );
    }
  }

  // Validate items array
  if (!Array.isArray(d.items)) {
    // ... existing code ...
  } else if (d.items.length === 0) {
    // ... existing code ...
  } else {
    // ... duplicate ID check ...
    d.items.forEach((item, index) => {
      // ... duplicate check ...
      validateItem(item, index, errors, warnings, validCategoryIds);
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/shared/utils/validation/recommendedItemsValidation.test.ts`
Expected: PASS

**Step 5: Run all tests**

Run: `npm test`
Expected: PASS

**Step 6: Commit**

```bash
git add src/shared/utils/validation/recommendedItemsValidation.ts src/shared/utils/validation/recommendedItemsValidation.test.ts
git commit -m "feat: update kit validation to support custom categories"
```

---

## Task 5: Add Category Helper Functions

**Files:**

- Modify: `src/features/categories/data.ts`
- Modify: `src/features/categories/data.test.ts`

**Step 1: Add tests for new helper functions**

Add to `src/features/categories/data.test.ts`:

```typescript
import {
  getCategoryById,
  getAllCategories,
  getCategoryDisplayName,
  canDeleteCategory,
  STANDARD_CATEGORIES,
} from './data';
import type { AppData, Category, InventoryItem } from '@/shared/types';
import { createCategoryId, createItemId } from '@/shared/types';

describe('getAllCategories', () => {
  it('returns standard categories when no custom categories', () => {
    const appData = {
      customCategories: [],
      disabledCategories: [],
    } as unknown as AppData;

    const result = getAllCategories(appData);
    expect(result).toHaveLength(STANDARD_CATEGORIES.length);
  });

  it('includes custom categories', () => {
    const customCategory: Category = {
      id: createCategoryId('custom-cat'),
      name: 'Custom',
      icon: '⭐',
      isCustom: true,
    };
    const appData = {
      customCategories: [customCategory],
      disabledCategories: [],
    } as unknown as AppData;

    const result = getAllCategories(appData);
    expect(result).toHaveLength(STANDARD_CATEGORIES.length + 1);
    expect(result.find((c) => c.id === 'custom-cat')).toBeDefined();
  });

  it('filters out disabled standard categories', () => {
    const appData = {
      customCategories: [],
      disabledCategories: ['pets'],
    } as unknown as AppData;

    const result = getAllCategories(appData);
    expect(result).toHaveLength(STANDARD_CATEGORIES.length - 1);
    expect(result.find((c) => c.id === 'pets')).toBeUndefined();
  });
});

describe('getCategoryDisplayName', () => {
  it('returns localized name for custom category', () => {
    const category: Category = {
      id: createCategoryId('custom'),
      name: 'Default Name',
      names: { en: 'English Name', fi: 'Suomeksi' },
      icon: '⭐',
      isCustom: true,
    };

    expect(getCategoryDisplayName(category, 'en')).toBe('English Name');
    expect(getCategoryDisplayName(category, 'fi')).toBe('Suomeksi');
  });

  it('falls back to English if language not found', () => {
    const category: Category = {
      id: createCategoryId('custom'),
      name: 'Default',
      names: { en: 'English Only' },
      icon: '⭐',
      isCustom: true,
    };

    expect(getCategoryDisplayName(category, 'fi')).toBe('English Only');
  });

  it('falls back to name field for standard categories', () => {
    const category: Category = {
      id: createCategoryId('food'),
      name: 'Food',
      icon: '🍽️',
      isCustom: false,
    };

    expect(getCategoryDisplayName(category, 'en')).toBe('Food');
  });
});

describe('canDeleteCategory', () => {
  it('allows deletion when no items use category', () => {
    const result = canDeleteCategory(createCategoryId('custom'), []);
    expect(result.canDelete).toBe(true);
  });

  it('blocks deletion when items use category', () => {
    const items: InventoryItem[] = [
      {
        id: createItemId('item1'),
        name: 'Test Item',
        categoryId: createCategoryId('custom'),
        quantity: 1,
        unit: 'pieces',
        itemType: 'custom',
        createdAt: '',
        updatedAt: '',
      },
    ];

    const result = canDeleteCategory(createCategoryId('custom'), items);
    expect(result.canDelete).toBe(false);
    expect(result.blockingItems).toHaveLength(1);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/features/categories/data.test.ts`
Expected: FAIL

**Step 3: Add helper functions to data.ts**

Update `src/features/categories/data.ts`:

```typescript
import type {
  Category,
  CategoryId,
  StandardCategoryId,
  AppData,
  InventoryItem,
} from '@/shared/types';
import { createCategoryId, VALID_CATEGORIES } from '@/shared/types';

// ... existing STANDARD_CATEGORIES ...

export function getCategoryById(id: StandardCategoryId): Category | undefined {
  return STANDARD_CATEGORIES.find((c) => c.id === id);
}

/**
 * Gets a category by ID from any source (standard or custom).
 */
export function getCategoryByIdFromAppData(
  id: CategoryId,
  appData: Pick<AppData, 'customCategories'>,
): Category | undefined {
  // Check standard categories first
  const standard = STANDARD_CATEGORIES.find((c) => c.id === id);
  if (standard) return standard;

  // Check custom categories
  return appData.customCategories.find((c) => c.id === id);
}

/**
 * Gets all active categories (standard + custom, minus disabled).
 */
export function getAllCategories(
  appData: Pick<AppData, 'customCategories' | 'disabledCategories'>,
): Category[] {
  const disabledSet = new Set(appData.disabledCategories);

  // Filter standard categories
  const activeStandard = STANDARD_CATEGORIES.filter(
    (c) => !disabledSet.has(c.id as StandardCategoryId),
  );

  // Combine with custom categories (custom categories cannot be disabled, only deleted)
  return [...activeStandard, ...appData.customCategories];
}

/**
 * Gets the localized display name for a category.
 * For custom categories, uses the names object.
 * For standard categories, returns the name field (translation handled by caller).
 */
export function getCategoryDisplayName(
  category: Category,
  language: 'en' | 'fi',
): string {
  if (category.names) {
    return category.names[language] || category.names.en || category.name;
  }
  return category.name;
}

/**
 * Checks if a category can be deleted.
 * Returns blocking items if any exist.
 */
export function canDeleteCategory(
  id: CategoryId,
  items: InventoryItem[],
): { canDelete: boolean; blockingItems?: InventoryItem[] } {
  const blockingItems = items.filter((item) => item.categoryId === id);

  if (blockingItems.length > 0) {
    return { canDelete: false, blockingItems };
  }

  return { canDelete: true };
}

/**
 * Checks if a category ID is a standard category.
 */
export function isStandardCategory(id: CategoryId): boolean {
  return (VALID_CATEGORIES as readonly string[]).includes(id);
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/features/categories/data.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/categories/data.ts src/features/categories/data.test.ts
git commit -m "feat: add category helper functions"
```

---

## Task 6: Update Inventory Context for Custom Categories

**Files:**

- Modify: `src/features/inventory/context.ts`
- Modify: `src/features/inventory/provider.tsx`
- Modify: `src/features/inventory/provider.test.tsx`

**Step 1: Add custom category methods to context**

Update `src/features/inventory/context.ts`:

```typescript
import { createContext } from 'react';
import type {
  InventoryItem,
  Category,
  ItemId,
  AlertId,
  ProductTemplateId,
  StandardCategoryId,
  CategoryId,
} from '@/shared/types';

export interface InventoryContextValue {
  items: InventoryItem[];
  categories: Category[];
  customCategories: Category[]; // NEW
  addItem: (
    item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>,
  ) => void;
  addItems: (items: InventoryItem[]) => void;
  updateItem: (id: ItemId, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: ItemId) => void;
  // Alert dismissal
  dismissedAlertIds: AlertId[];
  dismissAlert: (alertId: AlertId) => void;
  reactivateAlert: (alertId: AlertId) => void;
  reactivateAllAlerts: () => void;
  // Disabled recommended items
  disabledRecommendedItems: ProductTemplateId[];
  disableRecommendedItem: (itemId: ProductTemplateId) => void;
  enableRecommendedItem: (itemId: ProductTemplateId) => void;
  enableAllRecommendedItems: () => void;
  // Disabled categories
  disabledCategories: StandardCategoryId[];
  disableCategory: (categoryId: StandardCategoryId) => void;
  enableCategory: (categoryId: StandardCategoryId) => void;
  enableAllCategories: () => void;
  // Custom categories - NEW
  addCustomCategory: (category: Omit<Category, 'id'>) => void;
  updateCustomCategory: (id: CategoryId, updates: Partial<Category>) => void;
  deleteCustomCategory: (id: CategoryId) => {
    success: boolean;
    error?: string;
  };
}

export const InventoryContext = createContext<
  InventoryContextValue | undefined
>(undefined);
```

**Step 2: Add tests for custom category operations**

Add to `src/features/inventory/provider.test.tsx`:

```typescript
describe('custom category management', () => {
  it('adds a custom category', async () => {
    const { result } = renderHook(() => useInventory(), { wrapper });

    act(() => {
      result.current.addCustomCategory({
        name: 'Test Category',
        icon: '⭐',
        isCustom: true,
      });
    });

    expect(result.current.customCategories).toHaveLength(1);
    expect(result.current.customCategories[0].name).toBe('Test Category');
  });

  it('updates a custom category', async () => {
    const { result } = renderHook(() => useInventory(), { wrapper });

    act(() => {
      result.current.addCustomCategory({
        name: 'Original',
        icon: '⭐',
        isCustom: true,
      });
    });

    const categoryId = result.current.customCategories[0].id;

    act(() => {
      result.current.updateCustomCategory(categoryId, { name: 'Updated' });
    });

    expect(result.current.customCategories[0].name).toBe('Updated');
  });

  it('prevents deletion of category with items', async () => {
    const { result } = renderHook(() => useInventory(), { wrapper });

    act(() => {
      result.current.addCustomCategory({
        name: 'Used Category',
        icon: '⭐',
        isCustom: true,
      });
    });

    const categoryId = result.current.customCategories[0].id;

    act(() => {
      result.current.addItem({
        name: 'Test Item',
        categoryId,
        quantity: 1,
        unit: 'pieces',
        itemType: 'custom',
      });
    });

    let deleteResult: { success: boolean; error?: string };
    act(() => {
      deleteResult = result.current.deleteCustomCategory(categoryId);
    });

    expect(deleteResult!.success).toBe(false);
    expect(deleteResult!.error).toContain('items');
  });
});
```

**Step 3: Implement custom category methods in provider**

Update `src/features/inventory/provider.tsx` to add custom category state and methods:

```typescript
// Add state for custom categories
const [customCategories, setCustomCategories] = useLocalStorageSync(
  'customCategories',
  (data) => data?.customCategories || [],
);

// Combine categories
const categories = useMemo(() => {
  const disabledSet = new Set(disabledCategories);
  const activeStandard = STANDARD_CATEGORIES.filter(
    (c) => !disabledSet.has(c.id as StandardCategoryId),
  );
  return [...activeStandard, ...customCategories];
}, [disabledCategories, customCategories]);

// Add custom category
const addCustomCategory = useCallback(
  (input: Omit<Category, 'id'>) => {
    const newCategory = CategoryFactory.createCustom(input, customCategories);
    setCustomCategories((prev) => [...prev, newCategory]);
    showNotification(
      t('notifications.categoryAdded', { name: input.name }),
      'success',
    );
  },
  [customCategories, setCustomCategories, showNotification, t],
);

// Update custom category
const updateCustomCategory = useCallback(
  (id: CategoryId, updates: Partial<Category>) => {
    setCustomCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat)),
    );
  },
  [setCustomCategories],
);

// Delete custom category
const deleteCustomCategory = useCallback(
  (id: CategoryId): { success: boolean; error?: string } => {
    const result = canDeleteCategory(id, items);
    if (!result.canDelete) {
      return {
        success: false,
        error: t('settings.categories.deleteBlocked', {
          count: result.blockingItems?.length,
        }),
      };
    }

    setCustomCategories((prev) => prev.filter((cat) => cat.id !== id));
    showNotification(t('notifications.categoryDeleted'), 'success');
    return { success: true };
  },
  [items, setCustomCategories, showNotification, t],
);
```

**Step 4: Run tests**

Run: `npm test -- src/features/inventory/provider.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/inventory/context.ts src/features/inventory/provider.tsx src/features/inventory/provider.test.tsx
git commit -m "feat: add custom category CRUD to inventory context"
```

---

## Task 7: Add Translations

**Files:**

- Modify: `public/locales/en/common.json`
- Modify: `public/locales/fi/common.json`

**Step 1: Add English translations**

Add to `public/locales/en/common.json` in the settings section:

```json
{
  "settings": {
    "navigation": {
      "sections": {
        "customCategories": "Custom Categories"
      }
    },
    "categories": {
      "title": "Categories",
      "standardCategories": "Standard Categories",
      "customCategories": "Custom Categories",
      "addNew": "Add New",
      "empty": "No custom categories yet. Import a kit with custom categories or create one manually.",
      "source": "from {{kitName}}",
      "manuallyCreated": "manually created",
      "visible": "Visible",
      "hidden": "Hidden",
      "deleteBlocked": "Cannot delete: {{count}} item(s) use this category",
      "confirmDelete": "Delete category \"{{name}}\"?",
      "form": {
        "createTitle": "Create Custom Category",
        "editTitle": "Edit Category",
        "nameEn": "Name (English)",
        "nameFi": "Name (Finnish)",
        "icon": "Icon",
        "iconPlaceholder": "Enter an emoji",
        "descriptionEn": "Description (English)",
        "descriptionFi": "Description (Finnish)",
        "color": "Color",
        "sortOrder": "Sort Order",
        "idPreview": "ID: {{id}}"
      },
      "validation": {
        "nameRequired": "English name is required",
        "iconRequired": "Icon is required",
        "iconInvalid": "Icon must be a valid emoji",
        "idConflict": "A category with this ID already exists"
      }
    }
  },
  "notifications": {
    "categoryAdded": "Category \"{{name}}\" added",
    "categoryUpdated": "Category updated",
    "categoryDeleted": "Category deleted"
  }
}
```

**Step 2: Add Finnish translations**

Add corresponding translations to `public/locales/fi/common.json`:

```json
{
  "settings": {
    "navigation": {
      "sections": {
        "customCategories": "Mukautetut kategoriat"
      }
    },
    "categories": {
      "title": "Kategoriat",
      "standardCategories": "Vakiokategoriat",
      "customCategories": "Mukautetut kategoriat",
      "addNew": "Lisää uusi",
      "empty": "Ei mukautettuja kategorioita. Tuo paketti mukautetuilla kategorioilla tai luo uusi.",
      "source": "lähde: {{kitName}}",
      "manuallyCreated": "luotu manuaalisesti",
      "visible": "Näkyvissä",
      "hidden": "Piilotettu",
      "deleteBlocked": "Ei voi poistaa: {{count}} tuotetta käyttää tätä kategoriaa",
      "confirmDelete": "Poista kategoria \"{{name}}\"?",
      "form": {
        "createTitle": "Luo mukautettu kategoria",
        "editTitle": "Muokkaa kategoriaa",
        "nameEn": "Nimi (englanti)",
        "nameFi": "Nimi (suomi)",
        "icon": "Kuvake",
        "iconPlaceholder": "Syötä emoji",
        "descriptionEn": "Kuvaus (englanti)",
        "descriptionFi": "Kuvaus (suomi)",
        "color": "Väri",
        "sortOrder": "Järjestys"
      },
      "validation": {
        "nameRequired": "Englanninkielinen nimi vaaditaan",
        "iconRequired": "Kuvake vaaditaan",
        "iconInvalid": "Kuvakkeen on oltava kelvollinen emoji",
        "idConflict": "Tällä tunnuksella on jo kategoria"
      }
    }
  },
  "notifications": {
    "categoryAdded": "Kategoria \"{{name}}\" lisätty",
    "categoryUpdated": "Kategoria päivitetty",
    "categoryDeleted": "Kategoria poistettu"
  }
}
```

**Step 3: Validate translations**

Run: `npm run validate:i18n`
Expected: PASS

**Step 4: Commit**

```bash
git add public/locales/en/common.json public/locales/fi/common.json
git commit -m "feat: add translations for custom categories"
```

---

## Task 8: Create CategoryList Component

**Files:**

- Create: `src/features/settings/components/CategoryList/CategoryList.tsx`
- Create: `src/features/settings/components/CategoryList/CategoryList.module.css`
- Create: `src/features/settings/components/CategoryList/CategoryList.test.tsx`
- Create: `src/features/settings/components/CategoryList/index.ts`

**Step 1: Write tests first**

Create `src/features/settings/components/CategoryList/CategoryList.test.tsx`:

```typescript
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CategoryList } from './CategoryList';
import type { Category } from '@/shared/types';
import { createCategoryId } from '@/shared/types';
import { renderWithProviders } from '@/test/render';

const mockCategories: Category[] = [
  {
    id: createCategoryId('camping-gear'),
    name: 'Camping Gear',
    names: { en: 'Camping Gear', fi: 'Retkeilyvarusteet' },
    icon: '⛺',
    isCustom: true,
  },
  {
    id: createCategoryId('vehicle-kit'),
    name: 'Vehicle Kit',
    icon: '🚗',
    isCustom: true,
    sourceKitId: 'custom:abc123',
  },
];

describe('CategoryList', () => {
  it('renders list of categories', () => {
    renderWithProviders(
      <CategoryList
        categories={mockCategories}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Camping Gear')).toBeInTheDocument();
    expect(screen.getByText('Vehicle Kit')).toBeInTheDocument();
  });

  it('shows icons', () => {
    renderWithProviders(
      <CategoryList
        categories={mockCategories}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('⛺')).toBeInTheDocument();
    expect(screen.getByText('🚗')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <CategoryList
        categories={mockCategories}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />
    );

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    expect(onEdit).toHaveBeenCalledWith(mockCategories[0]);
  });

  it('calls onDelete when delete button clicked', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <CategoryList
        categories={mockCategories}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />
    );

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(onDelete).toHaveBeenCalledWith(mockCategories[0]);
  });

  it('shows empty message when no categories', () => {
    renderWithProviders(
      <CategoryList
        categories={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/no custom categories/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/features/settings/components/CategoryList/CategoryList.test.tsx`
Expected: FAIL (module not found)

**Step 3: Create component implementation**

Create `src/features/settings/components/CategoryList/CategoryList.tsx`:

```typescript
import { useTranslation } from 'react-i18next';
import type { Category } from '@/shared/types';
import { Button } from '@/shared/components/Button';
import { getCategoryDisplayName } from '@/features/categories';
import styles from './CategoryList.module.css';

export interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoryList({ categories, onEdit, onDelete }: CategoryListProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as 'en' | 'fi';

  if (categories.length === 0) {
    return (
      <div className={styles.empty}>
        <p>{t('settings.categories.empty')}</p>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {categories.map((category) => (
        <li key={category.id} className={styles.item}>
          <div className={styles.content}>
            <span className={styles.icon}>{category.icon}</span>
            <div className={styles.details}>
              <span className={styles.name}>
                {getCategoryDisplayName(category, language)}
              </span>
              {category.sourceKitId && (
                <span className={styles.source}>
                  {t('settings.categories.source', { kitName: 'Custom Kit' })}
                </span>
              )}
              {!category.sourceKitId && (
                <span className={styles.source}>
                  {t('settings.categories.manuallyCreated')}
                </span>
              )}
            </div>
          </div>
          <div className={styles.actions}>
            <Button
              variant="secondary"
              size="small"
              onClick={() => onEdit(category)}
              aria-label={`${t('common.edit')}: ${category.name}`}
            >
              {t('common.edit')}
            </Button>
            <Button
              variant="danger"
              size="small"
              onClick={() => onDelete(category)}
              aria-label={`${t('common.delete')}: ${category.name}`}
            >
              {t('common.delete')}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
```

Create `src/features/settings/components/CategoryList/CategoryList.module.css`:

```css
.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  gap: var(--space-3);
}

.content {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  min-width: 0;
}

.icon {
  font-size: var(--text-xl);
  flex-shrink: 0;
}

.details {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.name {
  font-weight: var(--font-medium);
  color: var(--color-text);
}

.source {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.actions {
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
}

.empty {
  padding: var(--space-4);
  text-align: center;
  color: var(--color-text-muted);
}

@media (max-width: 640px) {
  .item {
    flex-direction: column;
    align-items: stretch;
  }

  .actions {
    margin-top: var(--space-2);
    justify-content: flex-end;
  }
}
```

Create `src/features/settings/components/CategoryList/index.ts`:

```typescript
export { CategoryList } from './CategoryList';
export type { CategoryListProps } from './CategoryList';
```

**Step 4: Run tests**

Run: `npm test -- src/features/settings/components/CategoryList/CategoryList.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/settings/components/CategoryList/
git commit -m "feat: add CategoryList component"
```

---

## Task 9: Create CategoryForm Component

**Files:**

- Create: `src/features/settings/components/CategoryForm/CategoryForm.tsx`
- Create: `src/features/settings/components/CategoryForm/CategoryForm.module.css`
- Create: `src/features/settings/components/CategoryForm/CategoryForm.test.tsx`
- Create: `src/features/settings/components/CategoryForm/index.ts`

**Step 1: Write tests first**

Create `src/features/settings/components/CategoryForm/CategoryForm.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CategoryForm } from './CategoryForm';
import type { Category } from '@/shared/types';
import { createCategoryId } from '@/shared/types';
import { renderWithProviders } from '@/test/render';

describe('CategoryForm', () => {
  it('renders create form when no initial category', () => {
    renderWithProviders(
      <CategoryForm onSubmit={vi.fn()} onCancel={vi.fn()} />
    );

    expect(screen.getByText(/create custom category/i)).toBeInTheDocument();
  });

  it('renders edit form with initial values', () => {
    const category: Category = {
      id: createCategoryId('test-cat'),
      name: 'Test Category',
      names: { en: 'Test Category', fi: 'Testikategoria' },
      icon: '⭐',
      isCustom: true,
    };

    renderWithProviders(
      <CategoryForm
        initialCategory={category}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText(/edit category/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Category')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Testikategoria')).toBeInTheDocument();
    expect(screen.getByDisplayValue('⭐')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(
      <CategoryForm onSubmit={onSubmit} onCancel={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
  });

  it('submits valid form data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(
      <CategoryForm onSubmit={onSubmit} onCancel={vi.fn()} />
    );

    await user.type(screen.getByLabelText(/name \(english\)/i), 'New Category');
    await user.type(screen.getByLabelText(/icon/i), '🎯');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        names: expect.objectContaining({ en: 'New Category' }),
        icon: '🎯',
      })
    );
  });

  it('calls onCancel when cancel clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    renderWithProviders(
      <CategoryForm onSubmit={vi.fn()} onCancel={onCancel} />
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalled();
  });

  it('generates ID from English name', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <CategoryForm onSubmit={vi.fn()} onCancel={vi.fn()} />
    );

    await user.type(screen.getByLabelText(/name \(english\)/i), 'My Custom Category');

    expect(screen.getByText(/id: my-custom-category/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/features/settings/components/CategoryForm/CategoryForm.test.tsx`
Expected: FAIL

**Step 3: Create component**

Create `src/features/settings/components/CategoryForm/CategoryForm.tsx`:

```typescript
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Category, LocalizedNames } from '@/shared/types';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import styles from './CategoryForm.module.css';

export interface CategoryFormData {
  names: LocalizedNames;
  icon: string;
  descriptions?: LocalizedNames;
  color?: string;
  sortOrder?: number;
}

export interface CategoryFormProps {
  initialCategory?: Category;
  onSubmit: (data: CategoryFormData) => void;
  onCancel: () => void;
  existingIds?: string[];
}

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function isValidEmoji(str: string): boolean {
  const emojiRegex =
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/u;
  return emojiRegex.test(str);
}

export function CategoryForm({
  initialCategory,
  onSubmit,
  onCancel,
  existingIds = [],
}: CategoryFormProps) {
  const { t } = useTranslation();
  const isEditing = !!initialCategory;

  const [nameEn, setNameEn] = useState(initialCategory?.names?.en || '');
  const [nameFi, setNameFi] = useState(initialCategory?.names?.fi || '');
  const [icon, setIcon] = useState(initialCategory?.icon || '');
  const [descEn, setDescEn] = useState(initialCategory?.descriptions?.en || '');
  const [descFi, setDescFi] = useState(initialCategory?.descriptions?.fi || '');
  const [color, setColor] = useState(initialCategory?.color || '');
  const [sortOrder, setSortOrder] = useState(initialCategory?.sortOrder?.toString() || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const generatedId = useMemo(() => toKebabCase(nameEn), [nameEn]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!nameEn.trim()) {
      newErrors.nameEn = t('settings.categories.validation.nameRequired');
    }

    if (!icon.trim()) {
      newErrors.icon = t('settings.categories.validation.iconRequired');
    } else if (!isValidEmoji(icon)) {
      newErrors.icon = t('settings.categories.validation.iconInvalid');
    }

    if (!isEditing && generatedId && existingIds.includes(generatedId)) {
      newErrors.nameEn = t('settings.categories.validation.idConflict');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const data: CategoryFormData = {
      names: { en: nameEn.trim() },
      icon: icon.trim(),
    };

    if (nameFi.trim()) {
      data.names.fi = nameFi.trim();
    }

    if (descEn.trim() || descFi.trim()) {
      data.descriptions = {};
      if (descEn.trim()) data.descriptions.en = descEn.trim();
      if (descFi.trim()) data.descriptions.fi = descFi.trim();
    }

    if (color.trim()) {
      data.color = color.trim();
    }

    if (sortOrder.trim()) {
      data.sortOrder = parseInt(sortOrder, 10);
    }

    onSubmit(data);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.title}>
        {isEditing
          ? t('settings.categories.form.editTitle')
          : t('settings.categories.form.createTitle')}
      </h3>

      <div className={styles.row}>
        <div className={styles.field}>
          <Input
            label={t('settings.categories.form.icon')}
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder={t('settings.categories.form.iconPlaceholder')}
            error={errors.icon}
            maxLength={4}
          />
        </div>
        <div className={styles.field}>
          <Input
            type="color"
            label={t('settings.categories.form.color')}
            value={color || '#3498db'}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.field}>
        <Input
          label={t('settings.categories.form.nameEn')}
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          error={errors.nameEn}
          required
        />
      </div>

      <div className={styles.field}>
        <Input
          label={t('settings.categories.form.nameFi')}
          value={nameFi}
          onChange={(e) => setNameFi(e.target.value)}
        />
      </div>

      {!isEditing && generatedId && (
        <p className={styles.idPreview}>
          {t('settings.categories.form.idPreview', { id: generatedId })}
        </p>
      )}

      <div className={styles.field}>
        <Input
          label={t('settings.categories.form.descriptionEn')}
          value={descEn}
          onChange={(e) => setDescEn(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <Input
          label={t('settings.categories.form.descriptionFi')}
          value={descFi}
          onChange={(e) => setDescFi(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <Input
          type="number"
          label={t('settings.categories.form.sortOrder')}
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          min={0}
        />
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary">
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}
```

Create `src/features/settings/components/CategoryForm/CategoryForm.module.css`:

```css
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.title {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
}

.row {
  display: flex;
  gap: var(--space-4);
}

.row > .field {
  flex: 1;
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.idPreview {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-2);
}
```

Create `src/features/settings/components/CategoryForm/index.ts`:

```typescript
export { CategoryForm } from './CategoryForm';
export type { CategoryFormProps, CategoryFormData } from './CategoryForm';
```

**Step 4: Run tests**

Run: `npm test -- src/features/settings/components/CategoryForm/CategoryForm.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/settings/components/CategoryForm/
git commit -m "feat: add CategoryForm component"
```

---

## Task 10: Create CategoriesSection Component

**Files:**

- Create: `src/features/settings/components/CategoriesSection/CategoriesSection.tsx`
- Create: `src/features/settings/components/CategoriesSection/CategoriesSection.module.css`
- Create: `src/features/settings/components/CategoriesSection/CategoriesSection.test.tsx`
- Create: `src/features/settings/components/CategoriesSection/index.ts`

**Step 1: Write tests**

Create `src/features/settings/components/CategoriesSection/CategoriesSection.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CategoriesSection } from './CategoriesSection';
import { renderWithProviders } from '@/test/render';

describe('CategoriesSection', () => {
  it('renders standard and custom categories sections', () => {
    renderWithProviders(<CategoriesSection />);

    expect(screen.getByText(/standard categories/i)).toBeInTheDocument();
    expect(screen.getByText(/custom categories/i)).toBeInTheDocument();
  });

  it('shows add button for custom categories', () => {
    renderWithProviders(<CategoriesSection />);

    expect(screen.getByRole('button', { name: /add new/i })).toBeInTheDocument();
  });

  it('opens form when add button clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoriesSection />);

    await user.click(screen.getByRole('button', { name: /add new/i }));

    expect(screen.getByText(/create custom category/i)).toBeInTheDocument();
  });
});
```

**Step 2: Create component**

Create `src/features/settings/components/CategoriesSection/CategoriesSection.tsx`:

```typescript
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInventory } from '@/features/inventory';
import { STANDARD_CATEGORIES } from '@/features/categories';
import type { Category, StandardCategoryId } from '@/shared/types';
import { Button } from '@/shared/components/Button';
import { Modal } from '@/shared/components/Modal';
import { CategoryList } from '../CategoryList';
import { CategoryForm, type CategoryFormData } from '../CategoryForm';
import styles from './CategoriesSection.module.css';

export function CategoriesSection() {
  const { t } = useTranslation(['common', 'categories']);
  const {
    customCategories,
    disabledCategories,
    disableCategory,
    enableCategory,
    addCustomCategory,
    updateCustomCategory,
    deleteCustomCategory,
  } = useInventory();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleAdd = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = (category: Category) => {
    setDeleteError(null);
    setDeleteConfirm(category);
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;

    const result = deleteCustomCategory(deleteConfirm.id);
    if (!result.success) {
      setDeleteError(result.error || 'Delete failed');
    } else {
      setDeleteConfirm(null);
    }
  };

  const handleFormSubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCustomCategory(editingCategory.id, {
        ...data,
        name: data.names.en,
      });
    } else {
      addCustomCategory({
        ...data,
        name: data.names.en,
        isCustom: true,
      });
    }
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  const existingIds = [
    ...STANDARD_CATEGORIES.map((c) => c.id),
    ...customCategories.map((c) => c.id),
  ];

  return (
    <div className={styles.container}>
      {/* Standard Categories */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          {t('settings.categories.standardCategories')}
        </h3>
        <ul className={styles.standardList}>
          {STANDARD_CATEGORIES.map((category) => {
            const isDisabled = disabledCategories.includes(
              category.id as StandardCategoryId
            );
            return (
              <li key={category.id} className={styles.standardItem}>
                <div className={styles.standardContent}>
                  <span className={styles.icon}>{category.icon}</span>
                  <span className={styles.name}>
                    {t(category.id, { ns: 'categories' })}
                  </span>
                </div>
                <Button
                  variant={isDisabled ? 'secondary' : 'primary'}
                  size="small"
                  onClick={() =>
                    isDisabled
                      ? enableCategory(category.id as StandardCategoryId)
                      : disableCategory(category.id as StandardCategoryId)
                  }
                >
                  {isDisabled
                    ? t('settings.categories.hidden')
                    : t('settings.categories.visible')}
                </Button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Custom Categories */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            {t('settings.categories.customCategories')}
          </h3>
          <Button variant="primary" size="small" onClick={handleAdd}>
            {t('settings.categories.addNew')}
          </Button>
        </div>
        <CategoryList
          categories={customCategories}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </section>

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCategory(null);
        }}
        title=""
      >
        <CategoryForm
          initialCategory={editingCategory || undefined}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingCategory(null);
          }}
          existingIds={editingCategory ? [] : existingIds}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => {
          setDeleteConfirm(null);
          setDeleteError(null);
        }}
        title={t('settings.categories.confirmDelete', {
          name: deleteConfirm?.name,
        })}
      >
        <div className={styles.deleteModal}>
          {deleteError && <p className={styles.error}>{deleteError}</p>}
          <div className={styles.deleteActions}>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteConfirm(null);
                setDeleteError(null);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
```

Create CSS and index files similarly.

**Step 3: Run tests**

Run: `npm test -- src/features/settings/components/CategoriesSection/`
Expected: PASS

**Step 4: Commit**

```bash
git add src/features/settings/components/CategoriesSection/
git commit -m "feat: add CategoriesSection component"
```

---

## Task 11: Integrate CategoriesSection into Settings Page

**Files:**

- Modify: `src/features/settings/pages/Settings.tsx`
- Modify: `src/features/settings/index.ts`

**Step 1: Export new components from settings index**

Update `src/features/settings/index.ts`:

```typescript
// Add exports
export { CategoriesSection } from './components/CategoriesSection';
export { CategoryForm } from './components/CategoryForm';
export { CategoryList } from './components/CategoryList';
```

**Step 2: Add section to Settings page**

Update `src/features/settings/pages/Settings.tsx`:

1. Add to SettingsSection type:

```typescript
type SettingsSection =
  | 'appearance'
  | 'household'
  | 'nutrition'
  | 'hiddenAlerts'
  | 'disabledRecommendations'
  | 'disabledCategories'
  | 'customCategories' // NEW
  | 'overriddenRecommendations'
  | 'recommendationKits'
  | 'dataManagement'
  | 'about'
  | 'dangerZone';
```

2. Add menu item after disabledCategories:

```typescript
{
  id: 'customCategories',
  label: t('settings.navigation.sections.customCategories'),
},
```

3. Add case in renderSection:

```typescript
case 'customCategories':
  return (
    <Section
      testId="section-custom-categories"
      titleKey="settings.navigation.sections.customCategories"
    >
      <CategoriesSection />
    </Section>
  );
```

4. Add import:

```typescript
import { CategoriesSection } from '@/features/settings';
```

**Step 3: Run Settings tests**

Run: `npm test -- src/features/settings/pages/Settings.test.tsx`
Expected: PASS

**Step 4: Run all tests and type check**

Run: `npm run validate:all`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/settings/
git commit -m "feat: integrate custom categories into Settings page"
```

---

## Task 12: Update Item Form Category Dropdown

**Files:**

- Modify: `src/features/inventory/components/ItemForm.tsx`
- Modify: `src/features/inventory/components/ItemForm.test.tsx`

**Step 1: Update ItemForm to include custom categories**

The ItemForm currently uses STANDARD_CATEGORIES. Update it to use the combined categories from context:

```typescript
// Change import
import { useInventory } from '@/features/inventory';

// In component, use categories from context
const { categories } = useInventory();

// Use categories instead of STANDARD_CATEGORIES in the select
```

**Step 2: Add test for custom category in dropdown**

**Step 3: Run tests**

Run: `npm test -- src/features/inventory/components/ItemForm.test.tsx`
Expected: PASS

**Step 4: Commit**

```bash
git add src/features/inventory/components/ItemForm.tsx src/features/inventory/components/ItemForm.test.tsx
git commit -m "feat: include custom categories in item form dropdown"
```

---

## Task 13: E2E Tests for Custom Categories

**Files:**

- Modify: `e2e/custom-categories.spec.ts`

**Step 1: Add E2E tests for custom category management**

Update `e2e/custom-categories.spec.ts` with new tests:

```typescript
test('should create a custom category from settings', async ({ page }) => {
  // Navigate to Settings -> Custom Categories
  await page.getByTestId('nav-settings').click();
  await navigateToSettingsSection(page, 'customCategories');

  // Click Add New
  await page.click('button:has-text("Add New")');

  // Fill form
  await page.fill('input[name="nameEn"]', 'Camping Gear');
  await page.fill('input[name="icon"]', '⛺');
  await page.click('button:has-text("Save")');

  // Verify category appears in list
  await expect(page.getByText('Camping Gear')).toBeVisible();
});

test('should use custom category when adding item', async ({ page }) => {
  // Setup with custom category...
  // Add item and select custom category from dropdown
  // Verify item is created with custom category
});
```

**Step 2: Run E2E tests**

Run: `npm run test:e2e -- --grep "custom categories"`
Expected: PASS

**Step 3: Commit**

```bash
git add e2e/custom-categories.spec.ts
git commit -m "test: add E2E tests for custom category management"
```

---

## Task 14: Final Verification and Documentation

**Step 1: Run full test suite**

Run: `npm run validate:all`
Expected: All tests pass, no type errors, build succeeds

**Step 2: Manual testing checklist**

- [ ] Create custom category from Settings
- [ ] Edit custom category
- [ ] Delete custom category (verify blocked when items exist)
- [ ] Import kit with custom categories
- [ ] Add item to custom category
- [ ] Custom category appears on Dashboard
- [ ] Custom category appears in Inventory sidebar
- [ ] Hide/show standard categories

**Step 3: Update documentation**

Update `docs/DATA_SCHEMA.md` with new types.

**Step 4: Final commit**

```bash
git add docs/
git commit -m "docs: update DATA_SCHEMA with custom category types"
```

---

## Summary

| Task | Description                        | Estimated Complexity |
| ---- | ---------------------------------- | -------------------- |
| 1    | Extend Category type               | Low                  |
| 2    | Update RecommendedItemsFile type   | Low                  |
| 3    | Add category validation functions  | Medium               |
| 4    | Update kit validation              | Medium               |
| 5    | Add category helper functions      | Low                  |
| 6    | Update Inventory Context           | Medium               |
| 7    | Add translations                   | Low                  |
| 8    | Create CategoryList component      | Medium               |
| 9    | Create CategoryForm component      | Medium               |
| 10   | Create CategoriesSection component | Medium               |
| 11   | Integrate into Settings            | Low                  |
| 12   | Update Item Form                   | Low                  |
| 13   | E2E tests                          | Medium               |
| 14   | Final verification                 | Low                  |

**Total: 14 tasks**
