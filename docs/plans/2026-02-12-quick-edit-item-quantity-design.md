# Quick Edit Item Quantity - Design Document

## Overview

Add inline quantity editing to inventory items via stepper controls (+/- buttons), enabling quick quantity adjustments without opening the full edit modal.

## User Interaction

The quantity display on ItemCard transforms into an inline stepper control:

```
┌─────────────────────────────────────────┐
│  🥫 Canned Beans                        │
│                                         │
│     [−]  5 pieces  [+]                  │
│                                         │
│  📅 Expires: 2025-03-15                 │
│  📍 Kitchen pantry                      │
└─────────────────────────────────────────┘
```

### Behavior

- **Plus/Minus buttons**: Single increment/decrement per click
- **Minus disabled at 0**: Prevents negative quantities
- **Card click**: Still opens full edit modal (unchanged behavior)
- **Button clicks**: Don't propagate to card (no accidental modal opens)

### Scope

- Available on all ItemCard instances (inventory list, category views)
- Not applicable to dashboard (uses CategoryCard, not ItemCard)

## Save Behavior

### Debounced Auto-Save

- Changes trigger a 500ms debounce timer
- Rapid clicks batch into a single save operation
- After debounce completes, `updateItem()` called via InventoryContext

### Visual Feedback

- On save complete: Brief color pulse animation (~300ms) on the quantity area
- CSS animation that subtly highlights then fades back to normal

### Error Handling

- LocalStorage saves are synchronous and reliable
- No additional error state needed (context already handles storage)

## Component Architecture

### New Component: QuantityStepper

**Location**: `src/features/inventory/components/QuantityStepper.tsx`

```typescript
interface QuantityStepperProps {
  quantity: number;
  unit: Unit;
  min?: number; // Default: 0
  onChange: (newQuantity: number) => void;
  disabled?: boolean;
}
```

Presentational component with:

- CSS Module: `QuantityStepper.module.css`
- Storybook stories: `QuantityStepper.stories.tsx`
- Tests: `QuantityStepper.test.tsx`

### ItemCard Changes

- Replace static quantity display with `QuantityStepper`
- Add `onQuantityChange?: (item: InventoryItem, newQuantity: number) => void` prop
- Stop event propagation on stepper button clicks

### ItemList Changes

- Accept and pass `onQuantityChange` callback to each ItemCard

### Inventory Page Changes

- Implement debounced `handleQuantityChange` function
- Calls `updateItem(id, { quantity })` after debounce completes

## Accessibility (WCAG 2.1 AA)

- Buttons have descriptive `aria-label`: "Decrease quantity" / "Increase quantity"
- Minus button has `aria-disabled="true"` when quantity is 0
- Quantity changes announced via `aria-live="polite"` region
- Full keyboard support: Tab to buttons, Enter/Space to activate

## Testing Strategy

### Unit Tests

- `QuantityStepper.test.tsx`: renders correctly, increments, decrements, disables at min, calls onChange

### Integration Tests

- `ItemCard.test.tsx`: stepper callbacks work, event propagation stopped, card click still works

### Storybook Stories

- Default state
- Zero quantity (minus disabled)
- Disabled state
- Pulse animation demo

### E2E Tests

- Quick edit flow in `inventory.spec.ts`: increment/decrement items, verify persistence

## Internationalization

New translation keys (EN/FI):

```json
{
  "inventory": {
    "quantityStepper": {
      "increase": "Increase quantity",
      "decrease": "Decrease quantity"
    }
  }
}
```

## Files to Create/Modify

### New Files

- `src/features/inventory/components/QuantityStepper.tsx`
- `src/features/inventory/components/QuantityStepper.module.css`
- `src/features/inventory/components/QuantityStepper.stories.tsx`
- `src/features/inventory/components/QuantityStepper.test.tsx`

### Modified Files

- `src/features/inventory/components/ItemCard.tsx` - integrate QuantityStepper
- `src/features/inventory/components/ItemCard.module.css` - adjust quantity row styling
- `src/features/inventory/components/ItemCard.test.tsx` - add stepper integration tests
- `src/features/inventory/components/ItemList.tsx` - pass onQuantityChange prop
- `src/features/inventory/components/ItemList.test.tsx` - update tests
- `src/features/inventory/pages/Inventory.tsx` - add debounced handler
- `src/features/inventory/components/index.ts` - export QuantityStepper
- `public/locales/en/common.json` - add translation keys
- `public/locales/fi/common.json` - add translation keys
- `e2e/inventory.spec.ts` - add E2E tests for quick edit
