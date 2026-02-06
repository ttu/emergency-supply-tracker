# Remove Empty Items Button - Design

## Overview

Add a button to quickly remove all inventory items with 0 quantity. This helps users clear inventory when too many recommended items were added by accident.

## Behavior

### Location & Visibility

- Button appears in the `addItemRow` area, next to "Add from Template"
- Only visible when there are items with quantity = 0 in current scope
- Scope respects category filter: selected category only, or all items if "All Categories"

### User Flow

1. User clicks "Remove empty items" button
2. Native `confirm()` dialog shows: "Remove X items with 0 quantity?"
3. If confirmed, matching items are deleted
4. Notification shows: "X items removed"

## Implementation

### Files to Modify

1. **`src/features/inventory/context.ts`**
   - Add `deleteItems: (ids: ItemId[]) => void` to `InventoryContextValue`

2. **`src/features/inventory/provider.tsx`**
   - Add `deleteItems` callback (bulk delete with single notification)
   - Pattern matches existing `addItems` for bulk operations

3. **`src/features/inventory/pages/Inventory.tsx`**
   - Add computed `zeroQuantityItems` (filtered by current category scope)
   - Add "Remove empty items" button (conditionally rendered)
   - Add `handleRemoveEmptyItems` handler with confirmation

4. **`public/locales/en/common.json`**
   - `inventory.removeEmptyItems`: "Remove empty items"
   - `inventory.confirmRemoveEmpty`: "Remove {{count}} items with 0 quantity?"
   - `notifications.itemsBulkDeleted`: "{{count}} items removed"

5. **`public/locales/fi/common.json`**
   - Finnish translations for above keys

### Tests

1. **`src/features/inventory/provider.test.tsx`**
   - Test `deleteItems` removes multiple items
   - Test notification is shown once for bulk delete

2. **`src/features/inventory/pages/Inventory.test.tsx`**
   - Test button hidden when no 0-quantity items
   - Test button visible when 0-quantity items exist
   - Test confirmation flow
   - Test respects category filter

## Technical Notes

- Uses existing `confirm()` pattern from `handleDeleteItem`
- Single notification for bulk delete (matches `addItems` pattern)
- No analytics tracking added (can be added later if needed)
