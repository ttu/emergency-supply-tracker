# Design Doc: Household Configuration & Calculation System

**Status:** Published  
**Last Updated:** 2025-01-XX  
**Authors:** Development Team

---

## Summary

The Household Configuration system allows users to configure their household size (adults, children) and supply duration to get personalized supply recommendations. The system calculates recommended quantities for items based on these parameters using a multiplier formula.

---

## Background

Emergency preparedness recommendations are typically based on a standard household (e.g., 1 adult for 3 days). However, real households vary in size and desired supply duration. The application needs to scale recommendations dynamically based on:

- Number of adults (1.0x multiplier per adult)
- Number of children (0.75x multiplier per child)
- Desired supply duration (scales with days)
- Living situation (freezer availability affects item visibility)

---

## Goals and Non-Goals

### Goals

- ✅ Calculate personalized recommended quantities based on household configuration
- ✅ Support flexible household sizes (1+ adults, 0+ children)
- ✅ Support flexible supply durations (3+ days)
- ✅ Apply scaling rules per item (some items scale with people, some with days, some with both)
- ✅ Persist household configuration in LocalStorage
- ✅ Recalculate recommendations when household changes

### Non-Goals

- ❌ Pet support (future feature)
- ❌ Multi-location support (future feature)
- ❌ Historical household changes tracking
- ❌ Complex nutritional calculations (handled separately)

---

## Design

### Data Model

```typescript
interface HouseholdConfig {
  adults: number; // Number of adults (default: 2)
  children: number; // Number of children (default: 0)
  supplyDurationDays: number; // Days of supplies (default: 7)
  useFreezer: boolean; // Whether user has freezer (default: false)
}
```

### Calculation Formula

**Base Formula:**

```
People Multiplier = (adults × 1.0) + (children × 0.75)
Total Multiplier = People Multiplier × (days ÷ 3)
```

**For Recommended Items:**

```
Recommended Quantity = baseQuantity × [peopleMultiplier if scaleWithPeople] × [daysMultiplier if scaleWithDays]
```

**Example:**

- 2 adults + 2 children for 7 days
- People Multiplier = (2 × 1.0) + (2 × 0.75) = 3.5
- For item with baseQuantity=3, scaleWithPeople=true, scaleWithDays=true:
  - Recommended = 3 × 3.5 × (7 ÷ 3) = 3 × 3.5 × 2.33 = 24.5 → 25 (rounded up)

### Scaling Rules

Items can have different scaling behaviors:

1. **Scale with People Only** (`scaleWithPeople=true`, `scaleWithDays=false`)
   - Example: Headlamp (1 per person, regardless of days)
   - Formula: `baseQuantity × peopleMultiplier`

2. **Scale with Days Only** (`scaleWithPeople=false`, `scaleWithDays=true`)
   - Example: Daily medication (same per person, scales with days)
   - Formula: `baseQuantity × (days ÷ 3)`

3. **Scale with Both** (`scaleWithPeople=true`, `scaleWithDays=true`)
   - Example: Water (3L per person per day)
   - Formula: `baseQuantity × peopleMultiplier × (days ÷ 3)`

4. **No Scaling** (`scaleWithPeople=false`, `scaleWithDays=false`)
   - Example: First aid kit (1 per household)
   - Formula: `baseQuantity` (unchanged)

### Constants

```typescript
const ADULT_REQUIREMENT_MULTIPLIER = 1.0;
const CHILDREN_REQUIREMENT_MULTIPLIER = 0.75;
const BASE_SUPPLY_DURATION_DAYS = 3; // Base recommendations are for 3 days
```

---

## Implementation Details

### Core Functions

**Location:** `src/features/household/utils/calculations.ts`

```typescript
/**
 * Calculate household multiplier based on adults, children, and supply duration.
 */
export function calculateHouseholdMultiplier(
  config: HouseholdConfig,
  childrenMultiplier: number = CHILDREN_REQUIREMENT_MULTIPLIER,
): number {
  const peopleMultiplier =
    config.adults * ADULT_REQUIREMENT_MULTIPLIER +
    config.children * childrenMultiplier;
  return peopleMultiplier * config.supplyDurationDays;
}

/**
 * Calculate recommended quantity for an item based on household configuration.
 */
export function calculateRecommendedQuantity(
  item: RecommendedItemDefinition,
  household: HouseholdConfig,
  childrenMultiplier: number = CHILDREN_REQUIREMENT_MULTIPLIER,
): number {
  let qty = item.baseQuantity;

  if (item.scaleWithPeople) {
    const peopleMultiplier =
      household.adults * ADULT_REQUIREMENT_MULTIPLIER +
      household.children * childrenMultiplier;
    qty *= peopleMultiplier;
  }

  if (item.scaleWithDays) {
    qty *= household.supplyDurationDays;
  }

  return Math.ceil(qty); // Always round up
}
```

### State Management

**Location:** `src/features/household/provider.tsx`

- Uses React Context API to manage household state
- Auto-saves to LocalStorage on changes
- Provides `useHousehold()` hook for components

### UI Components

**Location:** `src/features/settings/components/HouseholdForm.tsx`

- Form inputs for adults, children, supply duration
- Freezer toggle
- Validation (min values, max values)
- Real-time preview of multiplier

---

## Alternatives Considered

### Alternative 1: Fixed Multiplier Tables

**Approach:** Pre-calculate multipliers for common household configurations.

**Rejected because:**

- Less flexible (can't support arbitrary durations)
- Requires maintaining lookup tables
- Doesn't scale well for custom durations

### Alternative 2: Percentage-Based Scaling

**Approach:** Use percentage multipliers instead of fixed values.

**Rejected because:**

- Less intuitive for users
- Harder to explain (e.g., "150% of base" vs "1.5x multiplier")
- More complex calculations

### Alternative 3: Separate Adult/Child Base Quantities

**Approach:** Define separate `baseQuantityAdult` and `baseQuantityChild` for each item.

**Rejected because:**

- Doubles the data model complexity
- Most items use simple 0.75x multiplier anyway
- Harder to maintain recommendation lists

---

## Risks and Mitigations

### Risk 1: Rounding Errors

**Risk:** Rounding up individual items may lead to slight over-estimation.

**Mitigation:**

- Use `Math.ceil()` for individual items (conservative approach)
- Document that recommendations are guidelines, not exact requirements
- Users can adjust quantities manually

### Risk 2: Performance with Large Households

**Risk:** Calculating recommendations for many items with large multipliers could be slow.

**Mitigation:**

- Calculations are pure functions (fast)
- Only recalculate when household changes (not on every render)
- Use React memoization for expensive calculations

### Risk 3: Invalid Configurations

**Risk:** Users might enter invalid values (e.g., 0 adults, negative children).

**Mitigation:**

- Form validation (min: 1 adult, 0+ children, 3+ days)
- TypeScript types prevent invalid states
- Default values on first load

---

## Open Questions

1. **Should we support fractional days?** (e.g., 3.5 days)
   - Current: No, integer days only
   - Future: Could support for precision

2. **Should children multiplier be configurable?**
   - Current: Fixed at 0.75
   - Future: Could allow user customization in settings

3. **Should we track household changes over time?**
   - Current: No history
   - Future: Could track changes for analytics

---

## References

- [DATA_SCHEMA.md](../DATA_SCHEMA.md) - Data structure definitions
- [FUNCTIONAL_SPEC.md](../FUNCTIONAL_SPEC.md) - Functional requirements
- `src/features/household/utils/calculations.ts` - Implementation
