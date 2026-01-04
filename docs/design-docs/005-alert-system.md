# Design Doc: Alert System

**Status:** Published  
**Last Updated:** 2025-01-XX  
**Authors:** Development Team

---

## Summary

The Alert System generates and displays warnings about inventory issues (expired items, expiring soon, missing items, low quantity). Users can dismiss alerts, and dismissed alerts can be reactivated from Settings.

---

## Background

Users need to be notified about critical issues with their emergency supplies:

- Items that have expired
- Items expiring soon (within 30 days)
- Missing critical items (quantity = 0)
- Low quantity items (<50% of recommended)
- Water shortage (when food preparation requires more water than available)
- Backup reminder (if no backup in 30+ days)

The system must allow users to dismiss alerts they've already addressed or don't want to see.

---

## Goals and Non-Goals

### Goals

- ✅ Generate alerts for expired items
- ✅ Generate alerts for items expiring soon (30 days)
- ✅ Generate alerts for missing critical items
- ✅ Generate alerts for low quantity items
- ✅ Generate alerts for water shortage (if water tracking enabled)
- ✅ Generate backup reminder (monthly)
- ✅ Allow users to dismiss alerts
- ✅ Allow users to reactivate dismissed alerts
- ✅ Persist dismissed alerts in LocalStorage
- ✅ Show alert counts on dashboard

### Non-Goals

- ❌ Email/push notifications (browser-only app)
- ❌ Alert scheduling (future feature)
- ❌ Alert history/audit trail
- ❌ Custom alert rules (future feature)

---

## Design

### Alert Types

```typescript
type AlertType = 'critical' | 'warning' | 'info';

interface Alert {
  id: string; // Unique identifier
  type: AlertType; // Alert severity
  message: string; // Translated message
  itemName?: string; // Item name (if item-specific)
  categoryName?: string; // Category name (if category-specific)
}
```

### Alert Generation

**Location:** `src/features/alerts/utils/alerts.ts`

**Alert Types:**

1. **Expired Items** (`critical`)
   - Items with `expirationDate < today`
   - One alert per expired item
   - Message: "Item expired"

2. **Expiring Soon** (`warning`)
   - Items with `expirationDate` within 30 days
   - One alert per expiring item
   - Message: "Item expiring in X days"

3. **Missing Critical Items** (`critical`)
   - Items with `quantity = 0` and `recommendedQuantity > 0`
   - Aggregated by category (one alert per category)
   - Message: "Category out of stock"

4. **Low Quantity Items** (`warning`)
   - Items with `quantity < 50% of recommendedQuantity`
   - Aggregated by category (one alert per category)
   - Message: "Category running low (X%)"

5. **Water Shortage** (`warning`)
   - When food preparation requires more water than available
   - Only if water tracking is enabled
   - Message: "Need X more liters for food preparation"

6. **Backup Reminder** (`info`)
   - Shows if no backup in 30+ days AND data modified
   - Can be dismissed until first day of next month
   - Message: "Backup your data"

### Alert Dismissal

**Storage:** `AppData.dismissedAlertIds: string[]`

- Array of alert IDs that have been dismissed
- Persisted in LocalStorage
- Dismissed alerts don't appear in AlertBanner
- Can be reactivated from Settings → Hidden Alerts

### Alert Priority

**Sorting:**

1. Critical alerts first
2. Warning alerts second
3. Info alerts last

**Constants:**

```typescript
const ALERT_PRIORITY = {
  critical: 1,
  warning: 2,
  info: 3,
};
```

### Alert Display

**Location:** `src/features/alerts/components/AlertBanner.tsx`

- Shows up to 5 alerts (most critical)
- "Show all" link to view all alerts
- Dismiss button per alert
- Color-coded by type (red/yellow/blue)
- Icons per alert type

---

## Implementation Details

### Alert Generation Flow

1. **Dashboard loads** → Calls `generateDashboardAlerts()`
2. **Function iterates items** → Generates expiration alerts
3. **Function aggregates by category** → Generates stock alerts
4. **Function checks water requirements** → Generates water shortage alerts
5. **Function checks backup status** → Generates backup reminder
6. **Function filters dismissed alerts** → Removes dismissed IDs
7. **Function sorts by priority** → Critical first
8. **Returns alert array** → Displayed in AlertBanner

### Alert Dismissal Flow

1. **User clicks dismiss** → Calls `dismissAlert(alertId)`
2. **Function adds ID to dismissedAlertIds** → Updates state
3. **State persists to LocalStorage** → Auto-save
4. **Alert removed from display** → Re-render

### Alert Reactivation Flow

1. **User navigates to Settings → Hidden Alerts**
2. **Component shows list of dismissed alerts**
3. **User clicks "Reactivate"** → Calls `reactivateAlert(alertId)`
4. **Function removes ID from dismissedAlertIds** → Updates state
5. **State persists to LocalStorage** → Auto-save
6. **Alert reappears on dashboard** → Next refresh

### Backup Reminder Logic

**Location:** `src/features/dashboard/utils/backupReminder.ts`

- Checks `lastBackupDate` in AppData
- If `lastBackupDate` is null or >30 days ago → Show reminder
- If `backupReminderDismissedUntil` is set and not expired → Hide reminder
- Dismissal sets `backupReminderDismissedUntil` to first day of next month

---

## Alternatives Considered

### Alternative 1: Per-Item Alerts Only

**Approach:** Show one alert per item (not aggregated by category).

**Rejected because:**

- Too many alerts (could be 50+ items)
- Overwhelming for users
- Category aggregation provides better overview

### Alternative 2: Alert Expiration

**Approach:** Alerts automatically expire after X days.

**Rejected because:**

- Users might miss important alerts
- Manual dismissal gives users control
- Simpler to let users manage

### Alternative 3: Alert Categories

**Approach:** Group alerts by category in UI.

**Rejected because:**

- Current flat list is simpler
- Priority sorting is more important than grouping
- Can be added as enhancement

---

## Risks and Mitigations

### Risk 1: Alert Fatigue

**Risk:** Too many alerts overwhelm users.

**Mitigation:**

- Limit display to 5 most critical alerts
- "Show all" link for complete list
- Category aggregation reduces alert count
- Users can dismiss alerts they've addressed

### Risk 2: Missing Critical Alerts

**Risk:** Users dismiss alerts and forget about them.

**Mitigation:**

- Dismissed alerts can be reactivated
- Settings page shows all dismissed alerts
- Critical alerts are prominent (red, top of list)

### Risk 3: Performance with Many Items

**Risk:** Generating alerts for 200+ items could be slow.

**Mitigation:**

- Efficient filtering and aggregation
- Memoized calculations
- Only generate on data changes
- Tested with 200+ items (acceptable performance)

### Risk 4: Stale Dismissed Alerts

**Risk:** Dismissed alert IDs reference items that no longer exist.

**Mitigation:**

- Alert IDs are stable (based on item ID or category ID)
- Cleanup on import (clear dismissed alerts if IDs don't exist)
- Reactivation UI shows only valid alerts

---

## Open Questions

1. **Should we support alert rules?**
   - Current: Fixed alert types
   - Future: Could allow custom rules (e.g., "alert if quantity < X")

2. **Should we show alert history?**
   - Current: No history
   - Future: Could track when alerts were generated/dismissed

3. **Should we support alert notifications?**
   - Current: In-app only
   - Future: Browser notifications (requires permission)

---

## References

- [004-dashboard-preparedness.md](./004-dashboard-preparedness.md) - Dashboard integration
- [012-status-calculation.md](./012-status-calculation.md) - Status calculation
- `src/features/alerts/utils/alerts.ts` - Implementation
- `src/features/alerts/components/AlertBanner.tsx` - UI component
