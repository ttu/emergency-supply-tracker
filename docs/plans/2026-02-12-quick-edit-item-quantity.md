# Quick Edit Item Quantity - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add inline +/- stepper controls to ItemCard for quick quantity adjustments without opening the edit modal.

**Architecture:** New QuantityStepper presentational component integrated into ItemCard. Debounced onChange propagates through ItemList to Inventory page, which calls updateItem from context.

**Tech Stack:** React 19, TypeScript, CSS Modules, Vitest, React Testing Library, Storybook, Playwright

---

## Task 1: Add Translation Keys

**Files:**

- Modify: `public/locales/en/common.json`
- Modify: `public/locales/fi/common.json`

**Step 1: Add English translation keys**

In `public/locales/en/common.json`, add inside the `"inventory"` object (after `"sort"` section around line 541):

```json
    "quantityStepper": {
      "increase": "Increase quantity",
      "decrease": "Decrease quantity"
    }
```

**Step 2: Add Finnish translation keys**

In `public/locales/fi/common.json`, add the same structure:

```json
    "quantityStepper": {
      "increase": "Lisää määrää",
      "decrease": "Vähennä määrää"
    }
```

**Step 3: Commit**

```bash
git add public/locales/en/common.json public/locales/fi/common.json
git commit -m "feat: add i18n keys for quantity stepper"
```

---

## Task 2: Create QuantityStepper Component - Tests First

**Files:**

- Create: `src/features/inventory/components/QuantityStepper.test.tsx`

**Step 1: Write the failing tests**

Create the test file with all test cases:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuantityStepper } from './QuantityStepper';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'inventory.quantityStepper.increase': 'Increase quantity',
        'inventory.quantityStepper.decrease': 'Decrease quantity',
        pieces: 'pieces',
        liters: 'liters',
        kg: 'kg',
      };
      return translations[key] || key;
    },
  }),
}));

describe('QuantityStepper', () => {
  it('renders quantity and unit', () => {
    render(
      <QuantityStepper quantity={5} unit="pieces" onChange={vi.fn()} />,
    );
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('pieces')).toBeInTheDocument();
  });

  it('renders increase and decrease buttons', () => {
    render(
      <QuantityStepper quantity={5} unit="pieces" onChange={vi.fn()} />,
    );
    expect(
      screen.getByRole('button', { name: 'Increase quantity' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Decrease quantity' }),
    ).toBeInTheDocument();
  });

  it('calls onChange with incremented value when plus is clicked', () => {
    const onChange = vi.fn();
    render(<QuantityStepper quantity={5} unit="pieces" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    expect(onChange).toHaveBeenCalledWith(6);
  });

  it('calls onChange with decremented value when minus is clicked', () => {
    const onChange = vi.fn();
    render(<QuantityStepper quantity={5} unit="pieces" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Decrease quantity' }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('disables decrease button when quantity is at min (default 0)', () => {
    const onChange = vi.fn();
    render(<QuantityStepper quantity={0} unit="pieces" onChange={onChange} />);

    const decreaseBtn = screen.getByRole('button', {
      name: 'Decrease quantity',
    });
    expect(decreaseBtn).toBeDisabled();
    expect(decreaseBtn).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not call onChange when decrease is clicked at min', () => {
    const onChange = vi.fn();
    render(<QuantityStepper quantity={0} unit="pieces" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Decrease quantity' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('respects custom min value', () => {
    const onChange = vi.fn();
    render(
      <QuantityStepper quantity={1} unit="pieces" onChange={onChange} min={1} />,
    );

    const decreaseBtn = screen.getByRole('button', {
      name: 'Decrease quantity',
    });
    expect(decreaseBtn).toBeDisabled();
  });

  it('disables both buttons when disabled prop is true', () => {
    render(
      <QuantityStepper
        quantity={5}
        unit="pieces"
        onChange={vi.fn()}
        disabled
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Increase quantity' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Decrease quantity' }),
    ).toBeDisabled();
  });

  it('stops event propagation on button clicks', () => {
    const onChange = vi.fn();
    const parentClick = vi.fn();

    render(
      <div onClick={parentClick}>
        <QuantityStepper quantity={5} unit="pieces" onChange={onChange} />
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    expect(onChange).toHaveBeenCalled();
    expect(parentClick).not.toHaveBeenCalled();
  });

  it('shows pulse animation class when showPulse is true', () => {
    const { container } = render(
      <QuantityStepper
        quantity={5}
        unit="pieces"
        onChange={vi.fn()}
        showPulse
      />,
    );

    const stepper = container.firstChild as HTMLElement;
    expect(stepper.className).toContain('pulse');
  });

  it('renders decimal quantities correctly', () => {
    render(
      <QuantityStepper quantity={2.5} unit="kg" onChange={vi.fn()} />,
    );
    expect(screen.getByText('2.5')).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm run test -- src/features/inventory/components/QuantityStepper.test.tsx
```

Expected: FAIL - module not found

**Step 3: Commit failing tests**

```bash
git add src/features/inventory/components/QuantityStepper.test.tsx
git commit -m "test: add failing tests for QuantityStepper component"
```

---

## Task 3: Create QuantityStepper Component - Implementation

**Files:**

- Create: `src/features/inventory/components/QuantityStepper.tsx`
- Create: `src/features/inventory/components/QuantityStepper.module.css`

**Step 1: Create the component**

```typescript
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Unit } from '@/shared/types';
import styles from './QuantityStepper.module.css';

export interface QuantityStepperProps {
  quantity: number;
  unit: Unit;
  min?: number;
  onChange: (newQuantity: number) => void;
  disabled?: boolean;
  showPulse?: boolean;
}

const QuantityStepperComponent = ({
  quantity,
  unit,
  min = 0,
  onChange,
  disabled = false,
  showPulse = false,
}: QuantityStepperProps) => {
  const { t } = useTranslation(['common', 'units']);

  const isAtMin = quantity <= min;

  const handleDecrease = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isAtMin && !disabled) {
        onChange(quantity - 1);
      }
    },
    [quantity, isAtMin, disabled, onChange],
  );

  const handleIncrease = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!disabled) {
        onChange(quantity + 1);
      }
    },
    [quantity, disabled, onChange],
  );

  const containerClass = [styles.stepper, showPulse && styles.pulse]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClass}>
      <button
        type="button"
        className={styles.button}
        onClick={handleDecrease}
        disabled={isAtMin || disabled}
        aria-disabled={isAtMin || disabled}
        aria-label={t('inventory.quantityStepper.decrease')}
      >
        −
      </button>
      <span className={styles.quantity}>
        <span className={styles.value}>{quantity}</span>
        <span className={styles.unit}>{t(unit, { ns: 'units' })}</span>
      </span>
      <button
        type="button"
        className={styles.button}
        onClick={handleIncrease}
        disabled={disabled}
        aria-label={t('inventory.quantityStepper.increase')}
      >
        +
      </button>
    </div>
  );
};

export const QuantityStepper = memo(QuantityStepperComponent);
```

**Step 2: Create the CSS module**

```css
.stepper {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
  line-height: 1;
}

.button:hover:not(:disabled) {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-on-primary, #ffffff);
}

.button:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus);
  outline-offset: var(--focus-ring-offset);
}

.button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.quantity {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  min-width: 3rem;
  justify-content: center;
}

.value {
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-lg);
  color: var(--color-text);
}

.unit {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* Pulse animation for save feedback */
.pulse {
  animation: pulse-highlight 0.3s ease-out;
}

@keyframes pulse-highlight {
  0% {
    background-color: transparent;
  }
  50% {
    background-color: var(--color-success-light, rgba(34, 197, 94, 0.2));
  }
  100% {
    background-color: transparent;
  }
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .button {
    width: 2rem;
    height: 2rem;
  }

  .value {
    font-size: var(--font-size-md);
  }
}
```

**Step 3: Run tests to verify they pass**

```bash
npm run test -- src/features/inventory/components/QuantityStepper.test.tsx
```

Expected: All tests PASS

**Step 4: Commit implementation**

```bash
git add src/features/inventory/components/QuantityStepper.tsx src/features/inventory/components/QuantityStepper.module.css
git commit -m "feat: implement QuantityStepper component"
```

---

## Task 4: Create QuantityStepper Storybook Stories

**Files:**

- Create: `src/features/inventory/components/QuantityStepper.stories.tsx`

**Step 1: Create stories file**

```typescript
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { QuantityStepper } from './QuantityStepper';
import { AllProviders } from '@/shared/components/AllProviders';

const meta = {
  title: 'Components/Inventory/QuantityStepper',
  component: QuantityStepper,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <AllProviders>
        <Story />
      </AllProviders>
    ),
  ],
  argTypes: {
    onChange: { action: 'changed' },
  },
} satisfies Meta<typeof QuantityStepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    quantity: 5,
    unit: 'pieces',
  },
};

export const ZeroQuantity: Story = {
  args: {
    quantity: 0,
    unit: 'pieces',
  },
};

export const Liters: Story = {
  args: {
    quantity: 12,
    unit: 'liters',
  },
};

export const Kilograms: Story = {
  args: {
    quantity: 2.5,
    unit: 'kg',
  },
};

export const Disabled: Story = {
  args: {
    quantity: 5,
    unit: 'pieces',
    disabled: true,
  },
};

export const WithPulse: Story = {
  args: {
    quantity: 5,
    unit: 'pieces',
    showPulse: true,
  },
};

export const Interactive: Story = {
  render: function InteractiveStepper() {
    const [quantity, setQuantity] = useState(5);
    return (
      <QuantityStepper
        quantity={quantity}
        unit="pieces"
        onChange={setQuantity}
      />
    );
  },
};

export const InCard: Story = {
  render: function StepperInCard() {
    const [quantity, setQuantity] = useState(10);
    return (
      <div
        style={{
          padding: '1rem',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface)',
          cursor: 'pointer',
        }}
        onClick={() => console.log('Card clicked')}
      >
        <h3 style={{ margin: '0 0 0.5rem' }}>Bottled Water</h3>
        <QuantityStepper
          quantity={quantity}
          unit="liters"
          onChange={setQuantity}
        />
      </div>
    );
  },
};
```

**Step 2: Run Storybook to verify**

```bash
npm run storybook
```

Navigate to Components/Inventory/QuantityStepper and verify all stories render correctly.

**Step 3: Commit stories**

```bash
git add src/features/inventory/components/QuantityStepper.stories.tsx
git commit -m "docs: add Storybook stories for QuantityStepper"
```

---

## Task 5: Export QuantityStepper from index

**Files:**

- Modify: `src/features/inventory/components/index.ts`

**Step 1: Add export**

Add after the CategoryStatusSummary export (around line 25):

```typescript
export { QuantityStepper } from './QuantityStepper';
export type { QuantityStepperProps } from './QuantityStepper';
```

**Step 2: Commit**

```bash
git add src/features/inventory/components/index.ts
git commit -m "feat: export QuantityStepper from inventory components"
```

---

## Task 6: Update ItemCard - Add Tests First

**Files:**

- Modify: `src/features/inventory/components/ItemCard.test.tsx`

**Step 1: Add new tests for quantity stepper integration**

Add a new describe block at the end of the file (before the closing `})`):

```typescript
describe('quantity stepper', () => {
  it('renders quantity stepper with current quantity', () => {
    renderWithProviders(<ItemCard item={baseItem} />);
    // Stepper buttons should be present
    expect(
      screen.getByRole('button', { name: /increase/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /decrease/i }),
    ).toBeInTheDocument();
  });

  it('calls onQuantityChange when stepper is used', () => {
    const onQuantityChange = vi.fn();
    renderWithProviders(
      <ItemCard item={baseItem} onQuantityChange={onQuantityChange} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /increase/i }));
    expect(onQuantityChange).toHaveBeenCalledWith(baseItem, 21);
  });

  it('does not trigger onItemClick when stepper buttons are clicked', () => {
    const onItemClick = vi.fn();
    const onQuantityChange = vi.fn();
    renderWithProviders(
      <ItemCard
        item={baseItem}
        onItemClick={onItemClick}
        onQuantityChange={onQuantityChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /increase/i }));
    expect(onQuantityChange).toHaveBeenCalled();
    expect(onItemClick).not.toHaveBeenCalled();
  });

  it('shows stepper even when onQuantityChange is not provided', () => {
    renderWithProviders(<ItemCard item={baseItem} />);
    expect(
      screen.getByRole('button', { name: /increase/i }),
    ).toBeInTheDocument();
  });

  it('disables decrease button when quantity is 0', () => {
    const zeroItem = { ...baseItem, quantity: createQuantity(0) };
    renderWithProviders(<ItemCard item={zeroItem} />);

    const decreaseBtn = screen.getByRole('button', { name: /decrease/i });
    expect(decreaseBtn).toBeDisabled();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm run test -- src/features/inventory/components/ItemCard.test.tsx
```

Expected: FAIL - onQuantityChange prop doesn't exist

**Step 3: Commit failing tests**

```bash
git add src/features/inventory/components/ItemCard.test.tsx
git commit -m "test: add failing tests for ItemCard quantity stepper integration"
```

---

## Task 7: Update ItemCard - Implementation

**Files:**

- Modify: `src/features/inventory/components/ItemCard.tsx`
- Modify: `src/features/inventory/components/ItemCard.module.css`

**Step 1: Import QuantityStepper and update props interface**

At the top of ItemCard.tsx, add import:

```typescript
import { QuantityStepper } from './QuantityStepper';
```

Update the ItemCardProps interface:

```typescript
export interface ItemCardProps {
  item: InventoryItem;
  allItems?: InventoryItem[];
  onItemClick?: (item: InventoryItem) => void;
  onQuantityChange?: (item: InventoryItem, newQuantity: number) => void;
}
```

Update the component signature:

```typescript
const ItemCardComponent = ({
  item,
  allItems,
  onItemClick,
  onQuantityChange,
}: ItemCardProps) => {
```

**Step 2: Add handleQuantityChange callback**

After the `handleClick` callback, add:

```typescript
const handleQuantityChange = useCallback(
  (newQuantity: number) => {
    onQuantityChange?.(item, newQuantity);
  },
  [onQuantityChange, item],
);
```

**Step 3: Replace static quantity display with QuantityStepper**

Replace the quantity div (around lines 79-82):

```typescript
<div className={styles.quantity}>
  <span className={styles.current}>{item.quantity}</span>
  <span className={styles.unit}>{t(item.unit, { ns: 'units' })}</span>
</div>
```

With:

```typescript
<div className={styles.quantityRow}>
  <QuantityStepper
    quantity={item.quantity}
    unit={item.unit}
    onChange={handleQuantityChange}
  />
</div>
```

**Step 4: Update CSS module**

In ItemCard.module.css, replace the `.quantity`, `.current`, and `.unit` styles with:

```css
.quantityRow {
  display: flex;
  align-items: center;
}

/* Remove old .quantity, .current, .unit styles - they're now in QuantityStepper */
```

Note: Keep the other styles intact.

**Step 5: Run tests to verify they pass**

```bash
npm run test -- src/features/inventory/components/ItemCard.test.tsx
```

Expected: All tests PASS

**Step 6: Commit implementation**

```bash
git add src/features/inventory/components/ItemCard.tsx src/features/inventory/components/ItemCard.module.css
git commit -m "feat: integrate QuantityStepper into ItemCard"
```

---

## Task 8: Update ItemList

**Files:**

- Modify: `src/features/inventory/components/ItemList.tsx`
- Modify: `src/features/inventory/components/ItemList.test.tsx`

**Step 1: Update ItemList props and pass through onQuantityChange**

In ItemList.tsx, update the interface:

```typescript
export interface ItemListProps {
  items: InventoryItem[];
  onItemClick?: (item: InventoryItem) => void;
  onQuantityChange?: (item: InventoryItem, newQuantity: number) => void;
  emptyMessage?: string;
}
```

Update the component signature and ItemCard usage:

```typescript
export const ItemList = ({
  items,
  onItemClick,
  onQuantityChange,
  emptyMessage,
}: ItemListProps) => {
  // ... existing code ...

  return (
    <div className={styles.list}>
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          allItems={items}
          onItemClick={onItemClick}
          onQuantityChange={onQuantityChange}
        />
      ))}
    </div>
  );
};
```

**Step 2: Add test for onQuantityChange passthrough**

In ItemList.test.tsx, add a test:

```typescript
it('should pass onQuantityChange to ItemCards', () => {
  const onQuantityChange = vi.fn();
  renderWithProviders(
    <ItemList items={[mockItem]} onQuantityChange={onQuantityChange} />,
  );

  fireEvent.click(screen.getByRole('button', { name: /increase/i }));
  expect(onQuantityChange).toHaveBeenCalled();
});
```

**Step 3: Run tests**

```bash
npm run test -- src/features/inventory/components/ItemList.test.tsx
```

**Step 4: Commit**

```bash
git add src/features/inventory/components/ItemList.tsx src/features/inventory/components/ItemList.test.tsx
git commit -m "feat: pass onQuantityChange through ItemList to ItemCard"
```

---

## Task 9: Update Inventory Page with Debounced Handler

**Files:**

- Modify: `src/features/inventory/pages/Inventory.tsx`

**Step 1: Add debounce utility import or create inline**

At the top of Inventory.tsx, add a ref for debouncing:

```typescript
const quantityDebounceRef = useRef<{
  timeoutId: ReturnType<typeof setTimeout> | null;
  pendingUpdates: Map<string, number>;
}>({ timeoutId: null, pendingUpdates: new Map() });
```

**Step 2: Create debounced handleQuantityChange**

Add after the other handlers (around line 295):

```typescript
const handleQuantityChange = useCallback(
  (item: InventoryItem, newQuantity: number) => {
    const ref = quantityDebounceRef.current;
    ref.pendingUpdates.set(item.id, newQuantity);

    if (ref.timeoutId) {
      clearTimeout(ref.timeoutId);
    }

    ref.timeoutId = setTimeout(() => {
      ref.pendingUpdates.forEach((qty, id) => {
        updateItem(createItemId(id), { quantity: createQuantity(qty) });
      });
      ref.pendingUpdates.clear();
      ref.timeoutId = null;
    }, 500);
  },
  [updateItem],
);
```

**Step 3: Pass handler to ItemList**

Update the ItemList component usage (around line 629):

```typescript
<ItemList
  items={filteredItems}
  onItemClick={handleEditItem}
  onQuantityChange={handleQuantityChange}
/>
```

**Step 4: Add cleanup for debounce on unmount**

Add useEffect for cleanup:

```typescript
useEffect(() => {
  return () => {
    const ref = quantityDebounceRef.current;
    if (ref.timeoutId) {
      clearTimeout(ref.timeoutId);
      // Flush pending updates on unmount
      ref.pendingUpdates.forEach((qty, id) => {
        updateItem(createItemId(id), { quantity: createQuantity(qty) });
      });
    }
  };
}, [updateItem]);
```

**Step 5: Run validation**

```bash
npm run validate
```

**Step 6: Commit**

```bash
git add src/features/inventory/pages/Inventory.tsx
git commit -m "feat: add debounced quantity change handler to Inventory page"
```

---

## Task 10: Add E2E Tests

**Files:**

- Modify: `e2e/inventory.spec.ts`

**Step 1: Add E2E test for quick quantity edit**

Add a new test block:

```typescript
test.describe('Quick quantity edit', () => {
  test('should increment item quantity using stepper', async ({ page }) => {
    // Setup: Add an item first
    await page.click('[data-testid="add-item-button"]');
    // Select a template and add item with quantity 5
    // ... (follow existing pattern for adding items)

    // Find the item card and click the increase button
    const increaseButton = page
      .getByRole('button', { name: /increase quantity/i })
      .first();
    await increaseButton.click();

    // Wait for debounce and verify quantity increased
    await page.waitForTimeout(600);
    await expect(page.getByText('6')).toBeVisible();
  });

  test('should decrement item quantity using stepper', async ({ page }) => {
    // Similar to above but with decrement
  });

  test('should not decrement below 0', async ({ page }) => {
    // Add item with quantity 0 and verify decrease button is disabled
  });

  test('should persist quantity changes after page reload', async ({
    page,
  }) => {
    // Increment, wait for debounce, reload, verify persistence
  });
});
```

**Step 2: Run E2E tests**

```bash
npm run test:e2e -- inventory.spec.ts
```

**Step 3: Commit**

```bash
git add e2e/inventory.spec.ts
git commit -m "test: add E2E tests for quick quantity edit"
```

---

## Task 11: Final Validation and Storybook Update

**Files:**

- Modify: `src/features/inventory/components/ItemCard.stories.tsx`

**Step 1: Add story showing quantity stepper in action**

Add new stories to ItemCard.stories.tsx:

```typescript
export const WithQuantityStepper: Story = {
  args: {
    item: baseItem,
    onQuantityChange: (item, qty) =>
      console.log(`Changed ${item.name} to ${qty}`),
  },
};
```

**Step 2: Run full validation**

```bash
npm run validate:all
```

**Step 3: Commit stories update**

```bash
git add src/features/inventory/components/ItemCard.stories.tsx
git commit -m "docs: add ItemCard story with quantity stepper"
```

---

## Task 12: Final Commit and PR Preparation

**Step 1: Verify all tests pass**

```bash
npm run validate:all
```

**Step 2: Review all changes**

```bash
git log --oneline feat-quick-edit-item-quantity ^main
git diff main...HEAD --stat
```

**Step 3: Create PR using /pr-create skill**

Use the `/pr-create` skill to create the pull request.

---

## Summary

After completing all tasks, you will have:

1. ✅ New `QuantityStepper` component with full test coverage
2. ✅ Storybook stories for QuantityStepper
3. ✅ ItemCard integration with inline quantity editing
4. ✅ ItemList prop passthrough
5. ✅ Debounced save handler in Inventory page
6. ✅ i18n translations (EN/FI)
7. ✅ E2E tests for the feature
8. ✅ All existing tests still passing
