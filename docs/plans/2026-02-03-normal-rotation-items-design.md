# Design: Normal Rotation Items

> **Created:** 2026-02-03
> **Status:** Ready for implementation

## Problem

Many emergency-relevant items (flour, toilet paper, pasta, batteries) are part of normal household consumption. Users:

- Already have these items in their pantry
- Don't want to track exact quantities daily
- Want credit toward emergency preparedness

## Solution

A "normal rotation" mode for inventory items that:

- Uses an **average estimated quantity** for calculations
- **Skips expiration tracking** (natural rotation handles freshness)
- Can optionally be **excluded from calculations** entirely
- Optionally allows **snapshot quantities** when users want to update

## User Flow

1. User marks an item as "in normal rotation" when adding/editing
2. User specifies "estimated average" (e.g., "usually around 5 rolls")
3. User can optionally check "don't include in preparedness calculations"
4. App uses the estimate for calculations (unless excluded)
5. Item shows as "in rotation" with visual distinction from regular items

## Data Model

Add to `InventoryItem` type in `src/shared/types/index.ts`:

```typescript
interface InventoryItem {
  // ... existing fields ...

  // Normal rotation fields
  isNormalRotation?: boolean; // Item is in normal household rotation
  estimatedQuantity?: number; // Average quantity typically on hand
  excludeFromCalculations?: boolean; // Don't count toward preparedness (rotation items only)
}
```

### Field Behavior

- When `isNormalRotation: true`:
  - `estimatedQuantity` is used for calculations (instead of `quantity`)
  - `expirationDate` is hidden/ignored in UI
  - `quantity` becomes optional snapshot field
- When `excludeFromCalculations: true`:
  - Item contributes 0 to preparedness calculations
  - Still visible in inventory for reference
- `excludeFromCalculations` is only valid when `isNormalRotation: true`

## Validation Rules

```typescript
// Validation for rotation items
if (isNormalRotation) {
  if (!excludeFromCalculations) {
    // Must have estimatedQuantity when counting toward preparedness
    require(estimatedQuantity > 0);
  }
  // Expiration fields are ignored/cleared
  expirationDate = undefined;
  neverExpires = undefined;
}

// excludeFromCalculations only valid for rotation items
if (excludeFromCalculations && !isNormalRotation) {
  invalid(); // or just ignore the flag
}
```

### On Save Behavior

- When marking as rotation: clear `expirationDate`, set `neverExpires` to undefined
- When unmarking rotation: `estimatedQuantity` and `excludeFromCalculations` are cleared, regular `quantity` is required again

## UI Changes

### Item Form

**Add/Edit Item form modifications:**

1. **New toggle:** "Item is in normal household rotation"
   - When ON, shows rotation-specific fields
   - When OFF, shows standard fields (quantity, expiration)

2. **Rotation mode fields:**
   - "Estimated average quantity" (number input) - required unless excluded
   - "Don't include in preparedness calculations" (checkbox)
   - "Current quantity (optional)" - for snapshot updates

3. **Hidden when rotation:**
   - Expiration date picker
   - "Never expires" toggle

**Visual mockup:**

```
┌─────────────────────────────────────────┐
│ ☑ Item is in normal household rotation  │
├─────────────────────────────────────────┤
│ Estimated average quantity: [___5___]   │
│                                         │
│ ☐ Don't include in calculations         │
│                                         │
│ Current quantity (optional): [_______]  │
└─────────────────────────────────────────┘
```

### Inventory List Display

**Regular item:**

```
┌────────────────────────────────────────┐
│ 🧻 Toilet Paper              [OK ✓]   │
│ 6 / 10 rolls · Expires: Mar 2026      │
└────────────────────────────────────────┘
```

**Rotation item (counted):**

```
┌────────────────────────────────────────┐
│ 🧻 Toilet Paper         [In rotation] │
│ ~5 rolls (estimated) · In pantry      │
└────────────────────────────────────────┘
```

**Rotation item (excluded):**

```
┌────────────────────────────────────────┐
│ 🧻 Toilet Paper         [In rotation] │
│ Not counted · In pantry               │
└────────────────────────────────────────┘
```

**Key differences:**

- Badge shows "In rotation" instead of OK/Warning/Critical
- Quantity shows with `~` prefix to indicate estimate
- No expiration date shown
- "Not counted" label when excluded from calculations

## Calculation Logic

### Effective Quantity

```typescript
function getEffectiveQuantity(item: InventoryItem): number {
  if (item.isNormalRotation) {
    if (item.excludeFromCalculations) {
      return 0; // Don't count
    }
    return item.estimatedQuantity ?? 0;
  }
  return item.quantity;
}
```

### Status Logic

- Rotation items always return `'ok'` status (they don't trigger warnings)
- Exception: if `excludeFromCalculations`, they contribute nothing but don't warn

### Category Percentage

- Rotation items with estimates contribute their `estimatedQuantity` toward the total
- Excluded rotation items contribute 0

## Interactions with Existing Features

### "Mark as enough" (`markedAsEnough`)

- This existing feature marks an item as "sufficient regardless of quantity"
- Rotation items don't need this - they handle sufficiency differently
- When `isNormalRotation: true`, `markedAsEnough` is ignored/cleared

### Alerts & Dashboard

- Rotation items don't appear in "low quantity" or "expiring soon" alerts
- They do contribute to category completion percentages (unless excluded)

### Shopping List Export

- Rotation items are **excluded** from shopping list export
- These items are managed through normal household shopping, not emergency restocking

## Implementation Scope

### Files to Modify

| Area          | Files                                                      |
| ------------- | ---------------------------------------------------------- |
| Types         | `src/shared/types/index.ts`                                |
| Validation    | `src/features/inventory/factories/InventoryItemFactory.ts` |
| Status logic  | `src/features/inventory/utils/status.ts`                   |
| Calculations  | `src/shared/utils/calculations.ts` (or similar)            |
| Item form     | `src/features/inventory/components/ItemForm/`              |
| Item display  | `src/features/inventory/components/ItemCard/`              |
| Shopping list | Shopping list export utility                               |
| i18n          | `public/locales/en/common.json`, `fi/common.json`          |
| Tests         | Unit + integration tests for all above                     |

### New Translation Keys

```json
{
  "inventory.rotation.label": "Item is in normal household rotation",
  "inventory.rotation.estimatedQuantity": "Estimated average quantity",
  "inventory.rotation.excludeFromCalculations": "Don't include in preparedness calculations",
  "inventory.rotation.currentQuantity": "Current quantity (optional)",
  "inventory.rotation.badge": "In rotation",
  "inventory.rotation.notCounted": "Not counted",
  "inventory.rotation.estimated": "estimated"
}
```

## Open Questions

None - design is complete and ready for implementation.
