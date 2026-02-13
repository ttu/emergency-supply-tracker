# Onboarding Example Set Generation

## Overview

Add an option during onboarding to create a realistic example/demo inventory set. This helps users understand the app's features (alerts, expiration tracking, quantity management) without manually entering data.

## User Flow

1. User completes household setup (preset → household form)
2. User selects recommendation kit
3. On QuickSetupScreen, user sees three options:
   - **"Add Items"** - Current behavior (adds selected items with qty 0 or 1)
   - **"Create Example Set"** - NEW: generates varied realistic data
   - **"Skip"** - Current behavior (starts empty)

## Item State Distribution

| State            | % of Items | Description                                             |
| ---------------- | ---------- | ------------------------------------------------------- |
| Fully stocked    | ~40%       | Quantity meets or exceeds recommended, valid expiration |
| Partial quantity | ~25%       | Has 30-70% of recommended quantity                      |
| Missing          | ~20%       | Not added to inventory at all                           |
| Expiring soon    | ~10%       | Full/partial qty, expires within 7-30 days              |
| Already expired  | ~5%        | Full/partial qty, expired 1-60 days ago                 |

### Logic Details

- Items with `neverExpires: true` skip expiration variation (tools, cash, etc.)
- Expiration dates are calculated relative to "today" when generated
- Missing items are simply not created (not added to inventory)
- Distribution is applied per-category to ensure variety across all categories

## Implementation

### New Files

```
src/features/onboarding/utils/
  ├── generateExampleInventory.ts      # Core generation logic
  └── generateExampleInventory.test.ts # Unit tests
```

### Function Signature

```typescript
interface ExampleItemState {
  type: 'full' | 'partial' | 'expiring' | 'expired';
  quantityMultiplier: number; // 1.0 for full, 0.3-0.7 for partial
  expirationOffsetDays?: number; // positive = future, negative = past
}

function generateExampleInventory(
  recommendedItems: RecommendedItemDefinition[],
  household: HouseholdConfig,
  translateFn: (key: string) => string,
  seed?: number, // Optional seed for deterministic testing
): InventoryItem[];
```

### Algorithm

1. Filter items by household config (freezer, pets)
2. Shuffle items (seeded for reproducibility)
3. Assign each item to a bucket based on distribution:
   - First 40% → full
   - Next 25% → partial
   - Next 20% → skip (missing)
   - Next 10% → expiring
   - Last 5% → expired
4. For each non-missing item:
   - Calculate recommended quantity using existing logic
   - Apply quantity multiplier based on bucket
   - Calculate expiration date based on bucket
   - Create item using `InventoryItemFactory.createFromTemplate()`

### Modified Files

- `QuickSetupScreen.tsx` - Add button, handler
- `Onboarding.tsx` - Wire up callback
- `public/locales/en/common.json` - Add translations
- `public/locales/fi/common.json` - Add translations

## i18n Keys

```json
{
  "quickSetup.createExampleSet": "Create Example Set",
  "quickSetup.createExampleSetHint": "Try with demo data"
}
```

Finnish:

```json
{
  "quickSetup.createExampleSet": "Luo esimerkkisetti",
  "quickSetup.createExampleSetHint": "Kokeile esimerkki­tiedoilla"
}
```

## Testing

### Unit Tests

- Respects household filters (freezer, pets)
- Generates correct distribution percentages
- Expired items have past dates
- Expiring items have 7-30 day future dates
- Items with `neverExpires` don't get expiration variations
- Quantities scale correctly with household size
- Seeded random produces deterministic output

### Integration Tests

- Button renders on QuickSetupScreen
- Clicking calls `onAddItems` with generated items
- Button is always enabled

## Future Considerations

- Could add "Reset to Example" in settings for existing users
- Could allow customizing the distribution via advanced settings
