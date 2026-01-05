# Design Doc: Status Calculation System

**Status:** Published  
**Last Updated:** 2025-01-23  
**Authors:** Development Team

---

## Summary

The Status Calculation System determines the status (OK/Warning/Critical) of inventory items and categories based on quantity and expiration date. Status drives visual indicators, alerts, and dashboard displays.

---

## Background

Users need quick visual feedback on their emergency supply status:

- Which items are sufficient (OK)
- Which items need attention (Warning)
- Which items are critical (Critical)

Status is calculated based on:

- Current quantity vs recommended quantity
- Expiration date (if applicable)
- User overrides (marked as enough)

---

## Goals and Non-Goals

### Goals

- ✅ Calculate item status (OK/Warning/Critical)
- ✅ Consider quantity and expiration
- ✅ Support user overrides (marked as enough)
- ✅ Aggregate category status
- ✅ Calculate preparedness score from status
- ✅ Consistent status logic across app
- ✅ Performance-optimized calculations

### Non-Goals

- ❌ Historical status tracking
- ❌ Status predictions (future expiration)
- ❌ Custom status rules
- ❌ Status notifications

---

## Design

### Status Types

```typescript
type ItemStatus = 'ok' | 'warning' | 'critical';
```

**Status Meanings:**

- **OK**: Sufficient quantity AND not expiring within 30 days
- **Warning**: Low quantity (<50% recommended) OR expiring soon (within 30 days)
- **Critical**: Missing (quantity = 0) OR already expired

### Status Calculation Priority

**Priority Order:**

1. **Expiration** (highest priority)
   - Expired → `critical`
   - Expiring within 30 days → `warning`
2. **Quantity**
   - Quantity = 0 → `critical`
   - Quantity < 50% recommended → `warning`
   - Otherwise → `ok`

**Special Cases:**

- `markedAsEnough=true` → `ok` (unless expired)
- `neverExpires=true` → Skip expiration checks

### Constants

See [Constants Reference](#constants-reference) section below for all defined constants.

**Note:** Alert thresholds are more aggressive than status thresholds. Items expiring within 7 days generate alerts, while status warnings appear for items expiring within 30 days.

### Item Status Calculation

**Location:** `src/features/inventory/utils/status.ts`

- `getItemStatus()` - Calculates status based on priority order
- Checks expiration first (highest priority), then quantity
- Handles special cases: `markedAsEnough`, `neverExpires`
- Returns `'ok' | 'warning' | 'critical'`

### Category Status Calculation

**Location:** `src/features/dashboard/utils/categoryStatus.ts`

- Aggregates item statuses within category
- Returns worst status (Critical > Warning > OK)
- Calculates percentage of items that are sufficient
- Used for category cards in Dashboard

### Preparedness Score from Status

**Location:** `src/features/dashboard/utils/preparedness.ts`

- Converts status to score (0-100)
- Item score = min((quantity / recommended) × 100, 100)
- Overall score = average of item scores
- Used for dashboard preparedness percentage

---

## Implementation Details

### Expiration Helpers

**Location:** `src/features/inventory/utils/status.ts`

- `getDaysUntilExpiration()` - Calculates days until expiration, returns null if never expires
- `isItemExpired()` - Boolean check if item is expired
- Uses ISO 8601 date parsing and comparison

### Status Variants for UI

**Location:** `src/features/inventory/utils/status.ts`

- `getStatusVariant()` - Maps ItemStatus to UI variant strings
- `'ok'` → `'success'`, `'warning'` → `'warning'`, `'critical'` → `'danger'`
- Used for CSS classes and component props

### Performance Optimization

- Memoized calculations using React `useMemo` and `useCallback` hooks
- Caching strategy for date calculations (avoid repeated date parsing)
- Performance target: <200ms for 200+ items
- Only recalculate when dependencies change (items, household, settings)
- Cached status per item to avoid redundant calculations

---

## Alternatives Considered

### Alternative 1: Binary Status

**Approach:** Only OK or Critical (no Warning).

**Rejected because:**

- Warning provides useful intermediate state
- Helps users prioritize (expiring soon, low quantity)
- Better UX with three states

### Alternative 2: More Status Levels

**Approach:** Add more levels (e.g., Excellent, Good, OK, Warning, Critical).

**Rejected because:**

- Three levels are sufficient
- More levels add complexity
- Current levels cover all cases

### Alternative 3: Percentage-Based Status

**Approach:** Use percentage thresholds (e.g., <25% = Critical, 25-50% = Warning).

**Rejected because:**

- Current approach (50% threshold) is simpler
- Expiration takes priority (more important than percentage)
- Clearer logic for users

---

## Risks and Mitigations

### Risk 1: Status Fluctuation

**Risk:** Small quantity changes cause status to flip frequently.

**Mitigation:**

- Status is based on clear thresholds (0, 50%, 100%)
- Rounding prevents minor fluctuations
- Users understand it's an approximation

### Risk 2: Expired Items Accumulation

**Risk:** Expired items remain in inventory with Critical status.

**Mitigation:**

- Expired items show Critical status (prominent)
- Dashboard alerts highlight expired items
- Users can manually delete expired items
- Future: Auto-hide or archive expired items

### Risk 3: Performance with Many Items

**Risk:** Calculating status for 200+ items could be slow.

**Mitigation:**

- Memoized calculations
- Only recalculate when data changes
- Efficient date comparisons
- Tested with 200+ items (acceptable performance)

---

## Open Questions

1. **Should we support custom status thresholds?**
   - Current: Fixed thresholds (50%, 30 days)
   - Future: Could allow user customization

2. **Should we show status history?**
   - Current: Current status only
   - Future: Could track status changes over time

3. **Should we support status predictions?**
   - Current: Current status only
   - Future: Could predict when items will expire

---

## Constants Reference

All constants are defined in `src/shared/utils/constants.ts`:

**Item Status:**

- `EXPIRING_SOON_DAYS_THRESHOLD = 30` - Days before expiration for status warning
- `LOW_QUANTITY_WARNING_RATIO = 0.5` - 50% of recommended quantity = warning

**Category Status:**

- `CRITICAL_PERCENTAGE_THRESHOLD = 30` - Category completion < 30% = critical
- `WARNING_PERCENTAGE_THRESHOLD = 70` - Category completion 30-70% = warning
- `OK_SCORE_THRESHOLD = 80` - Category completion ≥ 80% = ok
- `WARNING_SCORE_THRESHOLD = 50` - Category score threshold for warning

**Alert Thresholds (see [005-alert-system.md](./005-alert-system.md)):**

- `EXPIRING_SOON_ALERT_DAYS = 7` - Days before expiration for alerts (more urgent)
- `CRITICALLY_LOW_STOCK_PERCENTAGE = 25` - Stock < 25% = critical alert
- `LOW_STOCK_PERCENTAGE = 50` - Stock < 50% = low stock alert

**Preparedness Score:**

- `MAX_ITEM_SCORE = 100` - Maximum score for a single item
- `DEFAULT_FULL_PREPAREDNESS = 100` - Default score for categories with items but no recommendations
- `DEFAULT_EMPTY_PREPAREDNESS = 0` - Default score for empty categories

## References

- [002-inventory-management.md](./002-inventory-management.md) - Item status usage
- [004-dashboard-preparedness.md](./004-dashboard-preparedness.md) - Dashboard status
- [005-alert-system.md](./005-alert-system.md) - Alert generation (uses different thresholds)
- `src/features/inventory/utils/status.ts` - Implementation
- `src/features/dashboard/utils/categoryStatus.ts` - Category status
- `src/shared/utils/constants.ts` - All constants definitions
