# Design Doc: Dashboard & Preparedness Score

**Status:** Published  
**Last Updated:** 2025-01-23  
**Authors:** Development Team

---

## Summary

The Dashboard provides an overview of household emergency preparedness, showing overall preparedness percentage, category status, alerts, and quick actions. The Preparedness Score calculates how well-stocked the household is based on recommended items.

---

## Background

Users need a quick overview of their emergency preparedness status without navigating through individual categories. The dashboard aggregates:

- Overall preparedness percentage (0-100%)
- Category-level status indicators
- Critical alerts (expired items, missing items, etc.)
- Quick actions (add items, view details)

---

## Goals and Non-Goals

### Goals

- ✅ Display overall preparedness score (0-100%)
- ✅ Show category status with visual indicators
- ✅ Display critical alerts prominently
- ✅ Provide quick navigation to categories
- ✅ Show household configuration summary
- ✅ Calculate category-level preparedness
- ✅ Update in real-time as inventory changes

### Non-Goals

- ❌ Historical preparedness trends (future feature)
- ❌ Comparison with other households (privacy concern)
- ❌ Detailed item-level breakdown on dashboard (use Inventory page)
- ❌ Predictive analytics (future feature)

---

## Design

### Preparedness Score Calculation

**Overall Score (0-100%):**

- Based on how many recommended items are sufficiently stocked
- Each recommended item contributes up to 100 points (MAX_ITEM_SCORE)
- Item score = min((actualQuantity / recommendedQuantity) × 100, 100)
- Overall score = (sum of item scores) / (number of recommended items) × 100
- **Note:** For items with `scaleWithPeople=true`, the calculation uses `totalPeople` (adults + children) directly, not the peopleMultiplier formula. This is a simplification used in the preparedness calculation.

**Category Score:**

- Same calculation, but only for items in that category
- Used for category status indicators

**Location:** `src/features/dashboard/utils/preparedness.ts`

- `calculatePreparednessScore()` - Filters relevant items, calculates recommended quantities, compares with actual quantities
- Uses simplified formula: `totalPeople` (adults + children) directly for `scaleWithPeople` items (not the peopleMultiplier formula)
- Calculates item scores (min of (actual/recommended) × 100, capped at 100), averages for overall score
- Returns rounded percentage (0-100)

**Note:** The preparedness calculation uses a simplified approach for `scaleWithPeople` items, using `totalPeople` (adults + children) directly instead of the peopleMultiplier formula (adults × 1.0 + children × 0.75). This provides a simpler calculation while still being reasonably accurate for preparedness scoring.

### Dashboard Components

**Location:** `src/pages/Dashboard.tsx`

1. **DashboardHeader**
   - Household summary (adults, children, days)
   - Overall preparedness percentage
   - Visual indicator (progress bar, color)

2. **AlertBanner**
   - Critical alerts (expired, missing items)
   - Warning alerts (expiring soon, low quantity)
   - Info alerts (backup reminder)
   - Dismissible alerts

3. **CategoryGrid**
   - 10 category cards
   - Each card shows:
     - Category name and icon
     - Status indicator (worst item status in category)
     - Progress bar (% items sufficient)
     - Item counts
   - Click to navigate to category

### Category Status Calculation

**Location:** `src/features/dashboard/utils/categoryStatus.ts`

- Aggregates item statuses within a category
- Status priority: Critical > Warning > OK
- Shows worst status in category
- Calculates percentage of items that are sufficient

### Visual Indicators

**Colors:**

- Green (#4CAF50): OK / Sufficient (≥80%)
- Yellow (#FFC107): Warning / Low (50-79%)
- Red (#F44336): Critical / Missing (<50%)

**Progress Bars:**

- Show preparedness percentage
- Color-coded by status
- Animated on load

---

## Implementation Details

### State Management

- Uses `useInventory()` hook for items
- Uses `useHousehold()` hook for household config
- Uses `useSettings()` hook for settings
- Real-time updates via React Context

### Performance

- Memoized calculations (useMemo)
- Only recalculate when dependencies change
- Category status calculated on-demand
- Preparedness score cached per household config

### Responsive Design

- Mobile-first layout
- Category grid: 1 column (mobile), 2-3 columns (tablet), 3 columns (desktop)
- Touch-friendly targets (min 44x44px)
- Accessible (WCAG 2.1 Level AA)

---

## Alternatives Considered

### Alternative 1: Weighted Scoring

**Approach:** Give critical items (water, food) higher weight in score.

**Rejected because:**

- More complex to explain to users
- Hard to determine weights objectively
- Current approach is simpler and transparent

### Alternative 2: Binary Scoring

**Approach:** Item is either "sufficient" (100%) or "insufficient" (0%).

**Rejected because:**

- Less granular feedback
- Doesn't show progress (e.g., 80% of recommended)
- Current approach provides better UX

### Alternative 3: Category-Weighted Overall Score

**Approach:** Weight categories differently (e.g., water = 30%, food = 30%, etc.).

**Rejected because:**

- Complex to explain
- Subjective weight assignment
- Current approach treats all items equally (simpler)

---

## Risks and Mitigations

### Risk 1: Misleading High Scores

**Risk:** Score shows 90% but critical items (water) are missing.

**Mitigation:**

- Alert system highlights critical issues
- Category breakdown shows which categories are low
- Users can see item-level details in Inventory page

### Risk 2: Performance with Many Items

**Risk:** Calculating score for 100+ items could be slow.

**Mitigation:**

- Memoized calculations
- Only recalculate when data changes
- Efficient filtering and aggregation
- Tested with 200+ items (acceptable performance)

### Risk 3: Score Fluctuation

**Risk:** Small quantity changes cause large score swings.

**Mitigation:**

- Score is percentage-based (smooth transitions)
- Rounding to integers (reduces minor fluctuations)
- Users understand it's an approximation

---

## Open Questions

1. **Should we show historical trends?**
   - Current: No
   - Future: Could add chart showing score over time

2. **Should we normalize score by category importance?**
   - Current: All items equal weight
   - Future: Could weight critical categories higher

3. **Should we show "target" score?**
   - Current: Shows current score only
   - Future: Could show "aim for 80%" guidance

---

## References

- [005-alert-system.md](./005-alert-system.md) - Alert system details
- [012-status-calculation.md](./012-status-calculation.md) - Status calculation
- `src/features/dashboard/utils/preparedness.ts` - Implementation
- `src/pages/Dashboard.tsx` - Dashboard component
