# Normal Rotation Items - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to mark inventory items as "normal rotation" (pantry staples) with estimated quantities that don't require daily tracking.

**Architecture:** Adds three optional fields to `InventoryItem`: `isNormalRotation`, `estimatedQuantity`, and `excludeFromCalculations`. Updates form, display, status logic, and calculations to handle rotation items differently.

**Tech Stack:** React 19, TypeScript, CSS Modules, Vitest, react-i18next

---

## Task 1: Add Type Definitions

**Files:**

- Modify: `src/shared/types/index.ts:162-187` (InventoryItem interface)

**Step 1: Write the test for new type fields**

Create test file `src/shared/types/rotationItem.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { InventoryItem } from './index';
import { createItemId, createCategoryId } from './index';

describe('InventoryItem rotation fields', () => {
  it('should allow isNormalRotation field', () => {
    const item: InventoryItem = {
      id: createItemId('test-1'),
      name: 'Flour',
      itemType: 'custom',
      categoryId: createCategoryId('food'),
      quantity: 0,
      unit: 'kilograms',
      isNormalRotation: true,
      estimatedQuantity: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(item.isNormalRotation).toBe(true);
    expect(item.estimatedQuantity).toBe(2);
  });

  it('should allow excludeFromCalculations field for rotation items', () => {
    const item: InventoryItem = {
      id: createItemId('test-2'),
      name: 'Toilet Paper',
      itemType: 'custom',
      categoryId: createCategoryId('hygiene-sanitation'),
      quantity: 0,
      unit: 'rolls',
      isNormalRotation: true,
      excludeFromCalculations: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(item.excludeFromCalculations).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/shared/types/rotationItem.test.ts`
Expected: FAIL - TypeScript error "Object literal may only specify known properties"

**Step 3: Add fields to InventoryItem interface**

In `src/shared/types/index.ts`, add after line 184 (`markedAsEnough`):

```typescript
  /** Item is in normal household rotation (e.g., pantry staples) */
  isNormalRotation?: boolean;
  /** Average quantity typically on hand (used for calculations when isNormalRotation is true) */
  estimatedQuantity?: number;
  /** Don't count toward preparedness calculations (only valid when isNormalRotation is true) */
  excludeFromCalculations?: boolean;
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/shared/types/rotationItem.test.ts`
Expected: PASS

**Step 5: Run type check**

Run: `npm run type-check`
Expected: No errors

**Step 6: Commit**

```bash
git add src/shared/types/index.ts src/shared/types/rotationItem.test.ts
git commit -m "feat: add rotation item fields to InventoryItem type

Add isNormalRotation, estimatedQuantity, and excludeFromCalculations
fields to support marking items as normal household rotation."
```

---

## Task 2: Add Translation Keys

**Files:**

- Modify: `public/locales/en/common.json`
- Modify: `public/locales/fi/common.json`

**Step 1: Add English translations**

In `public/locales/en/common.json`, find the `itemForm` section and add after existing keys:

```json
  "rotation": {
    "label": "Item is in normal household rotation",
    "description": "For pantry staples you regularly use and restock (flour, toilet paper, etc.)",
    "estimatedQuantity": "Estimated average quantity",
    "estimatedQuantityHelp": "How much you typically have on hand",
    "excludeFromCalculations": "Don't include in preparedness calculations",
    "currentQuantity": "Current quantity (optional)",
    "badge": "In rotation",
    "notCounted": "Not counted",
    "estimated": "estimated"
  },
```

**Step 2: Add Finnish translations**

In `public/locales/fi/common.json`, find the `itemForm` section and add:

```json
  "rotation": {
    "label": "Tuote on normaalissa kiertokäytössä",
    "description": "Säännöllisesti käytettävät ja täydennettävät tuotteet (jauhot, wc-paperi jne.)",
    "estimatedQuantity": "Arvioitu keskimääräinen määrä",
    "estimatedQuantityHelp": "Kuinka paljon sinulla yleensä on",
    "excludeFromCalculations": "Älä sisällytä valmiuslaskelmiin",
    "currentQuantity": "Nykyinen määrä (valinnainen)",
    "badge": "Kiertokäytössä",
    "notCounted": "Ei lasketa",
    "estimated": "arvioitu"
  },
```

**Step 3: Run i18n validation**

Run: `npm run validate:i18n`
Expected: PASS (if validation exists) or no errors

**Step 4: Commit**

```bash
git add public/locales/en/common.json public/locales/fi/common.json
git commit -m "feat: add rotation item translation keys

Add English and Finnish translations for normal rotation item
feature including labels, help text, and badges."
```

---

## Task 3: Update Factory Validation

**Files:**

- Modify: `src/features/inventory/factories/InventoryItemFactory.ts`
- Modify: `src/features/inventory/factories/InventoryItemFactory.test.ts`

**Step 1: Write failing tests for rotation validation**

Add to `src/features/inventory/factories/InventoryItemFactory.test.ts`:

```typescript
describe('rotation item validation', () => {
  it('should require estimatedQuantity when isNormalRotation is true and not excluded', () => {
    expect(() => {
      InventoryItemFactory.create({
        name: 'Flour',
        itemType: 'custom',
        categoryId: createCategoryId('food'),
        quantity: 0,
        unit: 'kilograms',
        isNormalRotation: true,
        // Missing estimatedQuantity
        neverExpires: true,
      });
    }).toThrow('estimatedQuantity is required when isNormalRotation is true');
  });

  it('should not require estimatedQuantity when excludeFromCalculations is true', () => {
    const item = InventoryItemFactory.create({
      name: 'Flour',
      itemType: 'custom',
      categoryId: createCategoryId('food'),
      quantity: 0,
      unit: 'kilograms',
      isNormalRotation: true,
      excludeFromCalculations: true,
      neverExpires: true,
    });
    expect(item.isNormalRotation).toBe(true);
    expect(item.excludeFromCalculations).toBe(true);
  });

  it('should clear expiration fields for rotation items', () => {
    const item = InventoryItemFactory.create({
      name: 'Flour',
      itemType: 'custom',
      categoryId: createCategoryId('food'),
      quantity: 0,
      unit: 'kilograms',
      isNormalRotation: true,
      estimatedQuantity: 2,
      expirationDate: createDateOnly('2026-12-31'),
      neverExpires: false,
    });
    expect(item.expirationDate).toBeUndefined();
    expect(item.neverExpires).toBeUndefined();
  });

  it('should ignore excludeFromCalculations when isNormalRotation is false', () => {
    const item = InventoryItemFactory.create({
      name: 'Flour',
      itemType: 'custom',
      categoryId: createCategoryId('food'),
      quantity: 5,
      unit: 'kilograms',
      isNormalRotation: false,
      excludeFromCalculations: true, // Should be ignored
      expirationDate: createDateOnly('2026-12-31'),
    });
    expect(item.excludeFromCalculations).toBeUndefined();
  });

  it('should validate estimatedQuantity is non-negative', () => {
    expect(() => {
      InventoryItemFactory.create({
        name: 'Flour',
        itemType: 'custom',
        categoryId: createCategoryId('food'),
        quantity: 0,
        unit: 'kilograms',
        isNormalRotation: true,
        estimatedQuantity: -1,
        neverExpires: true,
      });
    }).toThrow('estimatedQuantity must be non-negative');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/features/inventory/factories/InventoryItemFactory.test.ts`
Expected: FAIL - validation not implemented

**Step 3: Update validateItemInput function**

In `src/features/inventory/factories/InventoryItemFactory.ts`, add after existing validation:

```typescript
// Rotation item validation
if (input.isNormalRotation) {
  // Require estimatedQuantity unless excluded from calculations
  if (
    !input.excludeFromCalculations &&
    (input.estimatedQuantity === undefined || input.estimatedQuantity <= 0)
  ) {
    throw new InventoryItemValidationError(
      'estimatedQuantity is required when isNormalRotation is true and not excluded from calculations',
    );
  }
  validateNonNegative(input.estimatedQuantity, 'estimatedQuantity');
}
```

**Step 4: Update create method to handle rotation items**

In the `create` method, update the return statement:

```typescript
// Handle rotation items
const isRotation = input.isNormalRotation === true;

return {
  ...input,
  id: createItemId(crypto.randomUUID()),
  name: input.name.trim(),
  categoryId: createCategoryId(input.categoryId),
  createdAt: now,
  updatedAt: now,
  // For rotation items: clear expiration fields
  expirationDate: isRotation
    ? undefined
    : input.neverExpires
      ? undefined
      : input.expirationDate,
  neverExpires: isRotation ? undefined : input.neverExpires,
  // For non-rotation items: clear rotation-specific fields
  isNormalRotation: isRotation ? true : undefined,
  estimatedQuantity: isRotation ? input.estimatedQuantity : undefined,
  excludeFromCalculations: isRotation
    ? input.excludeFromCalculations
    : undefined,
  // Ensure optional fields are undefined if not provided
  location: input.location?.trim() || undefined,
  notes: input.notes?.trim() || undefined,
};
```

**Step 5: Run tests to verify they pass**

Run: `npm test -- src/features/inventory/factories/InventoryItemFactory.test.ts`
Expected: PASS

**Step 6: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 7: Commit**

```bash
git add src/features/inventory/factories/InventoryItemFactory.ts src/features/inventory/factories/InventoryItemFactory.test.ts
git commit -m "feat: add validation for rotation items in factory

- Require estimatedQuantity when item is in rotation (unless excluded)
- Clear expiration fields for rotation items
- Clear rotation fields for non-rotation items
- Validate estimatedQuantity is non-negative"
```

---

## Task 4: Update Status Logic

**Files:**

- Modify: `src/features/inventory/utils/status.ts`
- Modify: `src/features/inventory/utils/status.test.ts`

**Step 1: Write failing tests for rotation item status**

Add to `src/features/inventory/utils/status.test.ts`:

```typescript
describe('rotation item status', () => {
  it('should return ok for rotation items regardless of quantity', () => {
    const status = getItemStatus(
      0, // currentQuantity
      10, // recommendedQuantity
      undefined, // expirationDate
      undefined, // neverExpires
      undefined, // markedAsEnough
      true, // isNormalRotation
    );
    expect(status).toBe('ok');
  });

  it('should return ok for excluded rotation items', () => {
    const status = getItemStatus(
      0,
      10,
      undefined,
      undefined,
      undefined,
      true, // isNormalRotation
      true, // excludeFromCalculations
    );
    expect(status).toBe('ok');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/features/inventory/utils/status.test.ts`
Expected: FAIL - getItemStatus doesn't accept rotation parameters

**Step 3: Update getItemStatus function signature and logic**

In `src/features/inventory/utils/status.ts`:

```typescript
export function getItemStatus(
  currentQuantity: number,
  recommendedQuantity: number,
  expirationDate?: DateOnly,
  neverExpires?: boolean,
  markedAsEnough?: boolean,
  isNormalRotation?: boolean,
  excludeFromCalculations?: boolean,
): ItemStatus {
  // Rotation items always return 'ok' - they don't trigger warnings
  if (isNormalRotation) {
    return 'ok';
  }

  // Check expiration first (expiration always takes precedence)
  // ... rest of existing logic
```

**Step 4: Update calculateItemStatus to pass rotation fields**

```typescript
export function calculateItemStatus(
  item: InventoryItem,
  recommendedQuantity: number,
): ItemStatus {
  return getItemStatus(
    item.quantity,
    recommendedQuantity,
    item.expirationDate,
    item.neverExpires,
    item.markedAsEnough,
    item.isNormalRotation,
    item.excludeFromCalculations,
  );
}
```

**Step 5: Run tests to verify they pass**

Run: `npm test -- src/features/inventory/utils/status.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/features/inventory/utils/status.ts src/features/inventory/utils/status.test.ts
git commit -m "feat: rotation items always return ok status

Rotation items don't trigger low-quantity or expiration warnings
since they are managed through normal household consumption."
```

---

## Task 5: Add getEffectiveQuantity Utility

**Files:**

- Create: `src/shared/utils/calculations/effectiveQuantity.ts`
- Create: `src/shared/utils/calculations/effectiveQuantity.test.ts`

**Step 1: Write tests for getEffectiveQuantity**

Create `src/shared/utils/calculations/effectiveQuantity.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getEffectiveQuantity } from './effectiveQuantity';
import type { InventoryItem } from '@/shared/types';
import { createItemId, createCategoryId } from '@/shared/types';

const createTestItem = (
  overrides: Partial<InventoryItem> = {},
): InventoryItem => ({
  id: createItemId('test-1'),
  name: 'Test Item',
  itemType: 'custom',
  categoryId: createCategoryId('food'),
  quantity: 5,
  unit: 'pieces',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('getEffectiveQuantity', () => {
  it('should return quantity for regular items', () => {
    const item = createTestItem({ quantity: 10 });
    expect(getEffectiveQuantity(item)).toBe(10);
  });

  it('should return estimatedQuantity for rotation items', () => {
    const item = createTestItem({
      quantity: 3,
      isNormalRotation: true,
      estimatedQuantity: 5,
    });
    expect(getEffectiveQuantity(item)).toBe(5);
  });

  it('should return 0 for excluded rotation items', () => {
    const item = createTestItem({
      quantity: 3,
      isNormalRotation: true,
      estimatedQuantity: 5,
      excludeFromCalculations: true,
    });
    expect(getEffectiveQuantity(item)).toBe(0);
  });

  it('should return 0 for rotation items without estimatedQuantity', () => {
    const item = createTestItem({
      quantity: 3,
      isNormalRotation: true,
    });
    expect(getEffectiveQuantity(item)).toBe(0);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/shared/utils/calculations/effectiveQuantity.test.ts`
Expected: FAIL - module not found

**Step 3: Implement getEffectiveQuantity**

Create `src/shared/utils/calculations/effectiveQuantity.ts`:

```typescript
import type { InventoryItem } from '@/shared/types';

/**
 * Get the effective quantity for an inventory item.
 *
 * For regular items: returns quantity
 * For rotation items: returns estimatedQuantity (or 0 if excluded)
 *
 * @param item - The inventory item
 * @returns The quantity to use for calculations
 */
export function getEffectiveQuantity(item: InventoryItem): number {
  if (item.isNormalRotation) {
    if (item.excludeFromCalculations) {
      return 0;
    }
    return item.estimatedQuantity ?? 0;
  }
  return item.quantity;
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/shared/utils/calculations/effectiveQuantity.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/shared/utils/calculations/effectiveQuantity.ts src/shared/utils/calculations/effectiveQuantity.test.ts
git commit -m "feat: add getEffectiveQuantity utility

Returns estimatedQuantity for rotation items, 0 for excluded
rotation items, and regular quantity for normal items."
```

---

## Task 6: Update Category Percentage Calculations

**Files:**

- Modify: `src/shared/utils/calculations/categoryPercentage.ts`
- Modify: `src/shared/utils/calculations/categoryPercentage.test.ts`

**Step 1: Write failing tests for rotation items in calculations**

Add to `src/shared/utils/calculations/categoryPercentage.test.ts`:

```typescript
describe('rotation items in category percentage', () => {
  it('should use estimatedQuantity for rotation items', () => {
    const items: InventoryItem[] = [
      createTestItem({
        categoryId: createCategoryId('hygiene-sanitation'),
        itemType: createProductTemplateId('toilet-paper'),
        quantity: 2, // Actual (should be ignored)
        isNormalRotation: true,
        estimatedQuantity: 6, // Should be used
        unit: 'rolls',
      }),
    ];

    const result = calculateCategoryPercentage(
      'hygiene-sanitation',
      items,
      defaultHousehold,
      [],
      RECOMMENDED_ITEMS,
    );

    // estimatedQuantity (6) should contribute to calculation
    expect(result.totalActual).toBeGreaterThan(0);
  });

  it('should return 0 for excluded rotation items', () => {
    const items: InventoryItem[] = [
      createTestItem({
        categoryId: createCategoryId('hygiene-sanitation'),
        itemType: createProductTemplateId('toilet-paper'),
        quantity: 2,
        isNormalRotation: true,
        estimatedQuantity: 6,
        excludeFromCalculations: true,
        unit: 'rolls',
      }),
    ];

    const result = calculateCategoryPercentage(
      'hygiene-sanitation',
      items,
      defaultHousehold,
      [],
      RECOMMENDED_ITEMS,
    );

    // Excluded rotation item should contribute 0
    expect(result.totalActual).toBe(0);
  });
});
```

**Step 2: Run tests to verify current behavior**

Run: `npm test -- src/shared/utils/calculations/categoryPercentage.test.ts`
Expected: FAIL or incorrect behavior

**Step 3: Update calculateQuantityCategoryPercentage to use effective quantity**

Import and use `getEffectiveQuantity` in `categoryPercentage.ts`:

```typescript
import { getEffectiveQuantity } from './effectiveQuantity';

// In calculateQuantityCategoryPercentage:
const actualQty = matchingItems.reduce(
  (sum, item) => sum + getEffectiveQuantity(item),
  0,
);
```

**Step 4: Update calculateFoodCategoryPercentage similarly**

```typescript
// In calculateFoodCategoryPercentage:
const itemCalories = matchingItems.reduce((sum, item) => {
  // Skip excluded rotation items
  if (item.isNormalRotation && item.excludeFromCalculations) {
    return sum;
  }

  // Use effective quantity for rotation items
  const effectiveQty = getEffectiveQuantity(item);

  if (item.caloriesPerUnit != null && Number.isFinite(item.caloriesPerUnit)) {
    return sum + effectiveQty * item.caloriesPerUnit;
  }
  const calsPerUnit = recItem.caloriesPerUnit ?? 0;
  return sum + effectiveQty * calsPerUnit;
}, 0);
```

**Step 5: Run tests to verify they pass**

Run: `npm test -- src/shared/utils/calculations/categoryPercentage.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/shared/utils/calculations/categoryPercentage.ts src/shared/utils/calculations/categoryPercentage.test.ts
git commit -m "feat: use effective quantity for rotation items in calculations

Rotation items contribute estimatedQuantity to category percentage.
Excluded rotation items contribute 0."
```

---

## Task 7: Update Shopping List Export

**Files:**

- Modify: `src/features/settings/hooks/useShoppingListExport.ts`
- Modify: `src/features/settings/components/ShoppingListExport.test.tsx`

**Step 1: Write failing test for rotation item exclusion**

Add to `ShoppingListExport.test.tsx`:

```typescript
it('should exclude rotation items from shopping list', () => {
  // Setup mock with rotation item that has low quantity
  const rotationItem = createTestItem({
    isNormalRotation: true,
    estimatedQuantity: 2,
    quantity: 1,
  });

  // Verify rotation item is not in itemsToRestock
  // (Test implementation depends on existing test structure)
});
```

**Step 2: Run tests to verify current behavior**

Run: `npm test -- src/features/settings/components/ShoppingListExport.test.tsx`

**Step 3: Update useShoppingListExport to exclude rotation items**

In `src/features/settings/hooks/useShoppingListExport.ts`:

```typescript
const itemsToRestock = useMemo(() => {
  return items.filter((item) => {
    // Skip items marked as enough
    if (item.markedAsEnough) {
      return false;
    }
    // Skip rotation items (managed through normal shopping)
    if (item.isNormalRotation) {
      return false;
    }
    const recommendedQuantity = getRecommendedQuantityForItem(
      item,
      household,
      recommendedItems,
      childrenMultiplier,
    );
    return item.quantity < recommendedQuantity;
  });
}, [items, household, recommendedItems, childrenMultiplier]);
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/features/settings/components/ShoppingListExport.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/settings/hooks/useShoppingListExport.ts src/features/settings/components/ShoppingListExport.test.tsx
git commit -m "feat: exclude rotation items from shopping list export

Rotation items are managed through normal household shopping,
not emergency supply restocking."
```

---

## Task 8: Update ItemForm Component

**Files:**

- Modify: `src/features/inventory/components/ItemForm.tsx`
- Modify: `src/features/inventory/components/ItemForm.test.tsx`
- Modify: `src/features/inventory/components/ItemForm.module.css`

**Step 1: Write integration tests for rotation form fields**

Add to `ItemForm.test.tsx`:

```typescript
describe('rotation item fields', () => {
  it('should show rotation toggle', () => {
    render(<ItemForm {...defaultProps} />);
    expect(screen.getByLabelText(/normal household rotation/i)).toBeInTheDocument();
  });

  it('should show rotation fields when toggle is checked', async () => {
    render(<ItemForm {...defaultProps} />);
    const toggle = screen.getByLabelText(/normal household rotation/i);
    await userEvent.click(toggle);

    expect(screen.getByLabelText(/estimated average quantity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/don't include in preparedness/i)).toBeInTheDocument();
  });

  it('should hide expiration fields when rotation is enabled', async () => {
    render(<ItemForm {...defaultProps} />);
    const toggle = screen.getByLabelText(/normal household rotation/i);
    await userEvent.click(toggle);

    expect(screen.queryByLabelText(/expiration date/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/never expires/i)).not.toBeInTheDocument();
  });

  it('should require estimatedQuantity when rotation is enabled and not excluded', async () => {
    render(<ItemForm {...defaultProps} />);
    // Enable rotation
    await userEvent.click(screen.getByLabelText(/normal household rotation/i));
    // Fill required fields
    await userEvent.type(screen.getByLabelText(/name/i), 'Flour');
    await userEvent.selectOptions(screen.getByLabelText(/category/i), 'food');
    // Don't fill estimatedQuantity
    await userEvent.click(screen.getByTestId('save-item-button'));

    expect(screen.getByText(/estimated quantity is required/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/features/inventory/components/ItemForm.test.tsx`
Expected: FAIL

**Step 3: Update FormData interface and initial state**

In `ItemForm.tsx`:

```typescript
interface FormData {
  // ... existing fields ...
  isNormalRotation: boolean;
  estimatedQuantity: string;
  excludeFromCalculations: boolean;
}

const [formData, setFormData] = useState<FormData>(() => {
  return {
    // ... existing fields ...
    isNormalRotation: item?.isNormalRotation ?? false,
    estimatedQuantity: item?.estimatedQuantity?.toString() || '',
    excludeFromCalculations: item?.excludeFromCalculations ?? false,
  };
});
```

**Step 4: Update validation**

```typescript
const validate = (): boolean => {
  const newErrors: FormErrors = {};
  // ... existing validation ...

  // Rotation item validation
  if (formData.isNormalRotation && !formData.excludeFromCalculations) {
    if (
      !formData.estimatedQuantity ||
      Number.parseFloat(formData.estimatedQuantity) <= 0
    ) {
      newErrors.estimatedQuantity = t(
        'itemForm.rotation.errors.estimatedQuantityRequired',
      );
    }
  }

  // Non-rotation items require expiration
  if (
    !formData.isNormalRotation &&
    !formData.neverExpires &&
    !formData.expirationDate
  ) {
    newErrors.expirationDate = t('itemForm.errors.expirationRequired');
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

**Step 5: Update handleSubmit**

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!validate()) return;

  onSubmit({
    // ... existing fields ...
    isNormalRotation: formData.isNormalRotation || undefined,
    estimatedQuantity:
      formData.isNormalRotation && formData.estimatedQuantity
        ? Number.parseFloat(formData.estimatedQuantity)
        : undefined,
    excludeFromCalculations:
      formData.isNormalRotation && formData.excludeFromCalculations
        ? true
        : undefined,
    // Clear expiration for rotation items
    neverExpires: formData.isNormalRotation ? undefined : formData.neverExpires,
    expirationDate: formData.isNormalRotation
      ? undefined
      : formData.neverExpires
        ? undefined
        : formData.expirationDate
          ? createDateOnly(formData.expirationDate)
          : undefined,
  });
};
```

**Step 6: Add rotation toggle and conditional fields to JSX**

```tsx
{/* Rotation toggle - after category selector */}
<div className={styles.formGroup}>
  <label className={styles.checkboxLabel}>
    <input
      type="checkbox"
      checked={formData.isNormalRotation}
      onChange={(e) => handleChange('isNormalRotation', e.target.checked)}
    />
    {t('itemForm.rotation.label')}
  </label>
  <p className={styles.helpText}>{t('itemForm.rotation.description')}</p>
</div>

{formData.isNormalRotation ? (
  {/* Rotation-specific fields */}
  <>
    <div className={styles.formGroup}>
      <Input
        id="estimatedQuantity"
        label={t('itemForm.rotation.estimatedQuantity')}
        type="number"
        value={formData.estimatedQuantity}
        onChange={(e) => handleChange('estimatedQuantity', e.target.value)}
        error={errors.estimatedQuantity}
        min="0"
        step="1"
        required={!formData.excludeFromCalculations}
      />
      <p className={styles.helpText}>{t('itemForm.rotation.estimatedQuantityHelp')}</p>
    </div>

    <div className={styles.formGroup}>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={formData.excludeFromCalculations}
          onChange={(e) => handleChange('excludeFromCalculations', e.target.checked)}
        />
        {t('itemForm.rotation.excludeFromCalculations')}
      </label>
    </div>

    <div className={styles.formGroup}>
      <Input
        id="quantity"
        label={t('itemForm.rotation.currentQuantity')}
        type="number"
        value={formData.quantity}
        onChange={(e) => handleChange('quantity', e.target.value)}
        min="0"
        step="1"
      />
    </div>
  </>
) : (
  {/* Standard fields - existing quantity/expiration fields */}
  // ... existing JSX for quantity, neverExpires, expirationDate
)}
```

**Step 7: Run tests to verify they pass**

Run: `npm test -- src/features/inventory/components/ItemForm.test.tsx`
Expected: PASS

**Step 8: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 9: Commit**

```bash
git add src/features/inventory/components/ItemForm.tsx src/features/inventory/components/ItemForm.test.tsx src/features/inventory/components/ItemForm.module.css
git commit -m "feat: add rotation item fields to ItemForm

- Toggle for 'Item is in normal household rotation'
- Estimated average quantity field
- Exclude from calculations checkbox
- Hide expiration fields for rotation items
- Validation for rotation item requirements"
```

---

## Task 9: Update ItemCard Display

**Files:**

- Modify: `src/features/inventory/components/ItemCard.tsx`
- Modify: `src/features/inventory/components/ItemCard.test.tsx`
- Modify: `src/features/inventory/components/ItemCard.module.css`

**Step 1: Write tests for rotation item display**

Add to `ItemCard.test.tsx`:

```typescript
describe('rotation item display', () => {
  it('should show "In rotation" badge for rotation items', () => {
    const item = createTestItem({
      isNormalRotation: true,
      estimatedQuantity: 5,
    });
    render(<ItemCard item={item} />);
    expect(screen.getByText(/in rotation/i)).toBeInTheDocument();
  });

  it('should show estimated quantity with tilde prefix', () => {
    const item = createTestItem({
      isNormalRotation: true,
      estimatedQuantity: 5,
      unit: 'rolls',
    });
    render(<ItemCard item={item} />);
    expect(screen.getByText(/~5/)).toBeInTheDocument();
    expect(screen.getByText(/estimated/i)).toBeInTheDocument();
  });

  it('should show "Not counted" for excluded rotation items', () => {
    const item = createTestItem({
      isNormalRotation: true,
      excludeFromCalculations: true,
    });
    render(<ItemCard item={item} />);
    expect(screen.getByText(/not counted/i)).toBeInTheDocument();
  });

  it('should not show expiration for rotation items', () => {
    const item = createTestItem({
      isNormalRotation: true,
      estimatedQuantity: 5,
      expirationDate: createDateOnly('2026-03-15'),
    });
    render(<ItemCard item={item} />);
    expect(screen.queryByText(/expires/i)).not.toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/features/inventory/components/ItemCard.test.tsx`
Expected: FAIL

**Step 3: Update ItemCard JSX for rotation items**

```tsx
const ItemCardComponent = ({ item, allItems, onItemClick }: ItemCardProps) => {
  // ... existing code ...

  const content = (
    <>
      <div className={styles.header}>
        <h3 className={styles.name}>{item.name}</h3>
        {item.isNormalRotation ? (
          <span className={styles.rotationBadge}>
            {t('itemForm.rotation.badge')}
          </span>
        ) : (
          <span className={styles.itemType}>
            {t(item.itemType, { ns: 'products' })}
          </span>
        )}
      </div>

      <div className={styles.body}>
        {item.isNormalRotation ? (
          {/* Rotation item display */}
          <>
            {item.excludeFromCalculations ? (
              <div className={styles.notCounted}>
                {t('itemForm.rotation.notCounted')}
              </div>
            ) : (
              <div className={styles.quantity}>
                <span className={styles.estimated}>
                  ~{item.estimatedQuantity}
                </span>
                <span className={styles.unit}>
                  {t(item.unit, { ns: 'units' })} ({t('itemForm.rotation.estimated')})
                </span>
              </div>
            )}
            {item.location && (
              <div className={styles.location}>📍 {item.location}</div>
            )}
          </>
        ) : (
          {/* Regular item display - existing code */}
          // ... existing quantity, expiration, missing quantity display
        )}
      </div>
    </>
  );
  // ... rest of component
};
```

**Step 4: Add CSS styles for rotation badge**

In `ItemCard.module.css`:

```css
.rotationBadge {
  background-color: var(--color-info-bg, #e3f2fd);
  color: var(--color-info-text, #1565c0);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.notCounted {
  color: var(--color-text-muted);
  font-style: italic;
}

.estimated {
  font-weight: 600;
}
```

**Step 5: Run tests to verify they pass**

Run: `npm test -- src/features/inventory/components/ItemCard.test.tsx`
Expected: PASS

**Step 6: Commit**

```bash
git add src/features/inventory/components/ItemCard.tsx src/features/inventory/components/ItemCard.test.tsx src/features/inventory/components/ItemCard.module.css
git commit -m "feat: display rotation items differently in ItemCard

- Show 'In rotation' badge instead of status
- Display estimated quantity with ~ prefix
- Show 'Not counted' for excluded items
- Hide expiration information for rotation items"
```

---

## Task 10: Update Storybook Stories

**Files:**

- Modify: `src/features/inventory/components/ItemForm.stories.tsx`
- Modify: `src/features/inventory/components/ItemCard.stories.tsx`

**Step 1: Add rotation item stories to ItemForm**

```typescript
export const RotationItem: Story = {
  args: {
    item: {
      ...defaultItem,
      isNormalRotation: true,
      estimatedQuantity: 5,
      quantity: 3,
    },
  },
};

export const RotationItemExcluded: Story = {
  args: {
    item: {
      ...defaultItem,
      isNormalRotation: true,
      excludeFromCalculations: true,
    },
  },
};
```

**Step 2: Add rotation item stories to ItemCard**

```typescript
export const RotationItem: Story = {
  args: {
    item: {
      ...defaultItem,
      name: 'Toilet Paper',
      isNormalRotation: true,
      estimatedQuantity: 5,
      unit: 'rolls',
    },
  },
};

export const RotationItemExcluded: Story = {
  args: {
    item: {
      ...defaultItem,
      name: 'Flour',
      isNormalRotation: true,
      excludeFromCalculations: true,
    },
  },
};
```

**Step 3: Run Storybook build**

Run: `npm run build-storybook`
Expected: No errors

**Step 4: Commit**

```bash
git add src/features/inventory/components/ItemForm.stories.tsx src/features/inventory/components/ItemCard.stories.tsx
git commit -m "docs: add Storybook stories for rotation items

Add stories showing rotation item form fields and card display
for both counted and excluded rotation items."
```

---

## Task 11: Run Full Validation

**Step 1: Run full validation suite**

Run: `npm run validate:all`
Expected: All checks pass (format, type-check, lint, tests, build, storybook, e2e)

**Step 2: Fix any issues found**

If any issues, fix them and re-run validation.

**Step 3: Final commit if needed**

```bash
git add -A
git commit -m "fix: address validation issues"
```

---

## Summary

This plan implements the normal rotation items feature in 11 tasks:

1. **Type definitions** - Add fields to InventoryItem
2. **Translations** - EN/FI translation keys
3. **Factory validation** - Validate rotation item rules
4. **Status logic** - Rotation items return 'ok' status
5. **Effective quantity** - Utility for calculations
6. **Category percentage** - Use effective quantity
7. **Shopping list** - Exclude rotation items
8. **ItemForm** - Add rotation toggle and fields
9. **ItemCard** - Display rotation items differently
10. **Storybook** - Add stories for documentation
11. **Validation** - Run full test suite

Each task follows TDD (write failing test first, then implement).
