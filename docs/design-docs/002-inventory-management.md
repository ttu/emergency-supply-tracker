# Design Doc: Inventory Management System

**Status:** Published  
**Last Updated:** 2025-01-XX  
**Authors:** Development Team

---

## Summary

The Inventory Management system handles CRUD operations for emergency supply items. It manages item data (quantities, expiration dates, locations, notes), calculates item status, and provides filtering and sorting capabilities.

---

## Background

Users need to track their emergency supplies with details like:

- Current quantity vs recommended quantity
- Expiration dates for perishable items
- Storage locations
- Notes and custom metadata
- Status indicators (OK/Warning/Critical)

The system must support adding items from recommendations, creating custom items, editing existing items, and deleting items.

---

## Goals and Non-Goals

### Goals

- ✅ Add items to inventory (from recommendations or custom)
- ✅ Edit item properties (quantity, expiration, location, notes)
- ✅ Delete items with confirmation
- ✅ Calculate item status based on quantity and expiration
- ✅ Filter items by category and status
- ✅ Sort items by name, expiration, status
- ✅ Persist inventory in LocalStorage
- ✅ Support bulk operations (future: bulk delete, bulk edit)

### Non-Goals

- ❌ Item history/audit trail (future feature)
- ❌ Barcode scanning (future feature)
- ❌ Multi-location inventory (future feature)
- ❌ Item photos (future feature)
- ❌ Sharing inventory with others (future feature)

---

## Design

### Data Model

```typescript
interface InventoryItem {
  id: string; // UUID
  name: string; // Item name
  categoryId: string; // Category reference
  quantity: number; // Current quantity owned
  unit: Unit; // Measurement unit
  recommendedQuantity: number; // Calculated recommended amount
  expirationDate?: string; // ISO date (YYYY-MM-DD)
  neverExpires?: boolean; // Flag for non-expiring items
  location?: string; // Storage location
  notes?: string; // User notes
  productTemplateId?: string; // Reference to product template
  weightGrams?: number; // Total weight (for calorie calc)
  caloriesPerUnit?: number; // Calories per unit
  markedAsEnough?: boolean; // User override: mark as sufficient
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}
```

### Item Status Calculation

Status is determined by quantity and expiration:

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

**Location:** `src/features/inventory/utils/status.ts`

```typescript
export function getItemStatus(
  currentQuantity: number,
  recommendedQuantity: number,
  expirationDate?: string,
  neverExpires?: boolean,
  markedAsEnough?: boolean,
): ItemStatus {
  // Check expiration first
  if (!neverExpires && expirationDate) {
    const daysUntil = getDaysUntilExpiration(expirationDate, neverExpires);
    if (daysUntil !== null) {
      if (daysUntil < 0) return 'critical'; // Expired
      if (daysUntil <= 30) return 'warning'; // Expiring soon
    }
  }

  // If marked as enough, treat as ok (unless expired)
  if (markedAsEnough) return 'ok';

  // Check quantity
  if (currentQuantity === 0) return 'critical';
  if (currentQuantity < recommendedQuantity * 0.5) return 'warning';

  return 'ok';
}
```

### Constants

```typescript
const EXPIRING_SOON_DAYS_THRESHOLD = 30; // Days before expiration to show warning
const LOW_QUANTITY_WARNING_RATIO = 0.5; // 50% of recommended = warning
```

---

## Implementation Details

### State Management

**Location:** `src/features/inventory/provider.tsx`

- React Context Provider manages inventory state
- Auto-saves to LocalStorage on changes
- Provides `useInventory()` hook

**Key Operations:**

- `addItem(itemData)` - Add new item
- `updateItem(id, updates)` - Update existing item
- `deleteItem(id)` - Delete item
- `getItemsByCategory(categoryId)` - Filter by category
- `getItemsByStatus(status)` - Filter by status

### UI Components

**Location:** `src/features/inventory/components/`

- `ItemForm.tsx` - Add/edit item form
- `ItemCard.tsx` - Display single item
- `ItemList.tsx` - List of items with filtering
- `CategoryNav.tsx` - Category navigation tabs
- `FilterBar.tsx` - Status filter buttons

### Adding Items

**Methods:**

1. **From Recommendations**
   - Browse recommended items
   - Quick Add (defaults) or Full Add (form)
   - Auto-fills name, category, recommended quantity

2. **From Product Template**
   - Select template
   - Auto-fills template data
   - User can override

3. **Custom Item**
   - Manual form entry
   - All fields required
   - Can save as template

### Editing Items

- Click item card → Opens edit form
- Pre-filled with current values
- Validation on save
- Updates `updatedAt` timestamp

### Deleting Items

- Click delete button → Confirmation dialog
- Removes from inventory
- No undo (future: soft delete?)

---

## Alternatives Considered

### Alternative 1: Soft Delete

**Approach:** Mark items as deleted instead of removing them.

**Rejected because:**

- Adds complexity (filtering, UI)
- Users can re-add items if needed
- LocalStorage space is limited

### Alternative 2: Item History

**Approach:** Track all changes to items over time.

**Rejected because:**

- Not in scope for v1
- Adds storage overhead
- Can be added later if needed

### Alternative 3: Batch Operations

**Approach:** Support selecting multiple items for bulk operations.

**Rejected because:**

- Not in scope for v1
- Can be added as enhancement
- Mobile UI complexity

---

## Risks and Mitigations

### Risk 1: Data Loss on Delete

**Risk:** Users accidentally delete items.

**Mitigation:**

- Confirmation dialog required
- Export/import backup available
- Clear delete button styling (danger color)

### Risk 2: Expired Items Accumulation

**Risk:** Expired items remain in inventory indefinitely.

**Mitigation:**

- Expired items show critical status
- Dashboard alerts highlight expired items
- Users can manually delete expired items
- Future: Auto-hide or archive expired items

### Risk 3: Performance with Large Inventories

**Risk:** Filtering/sorting many items could be slow.

**Mitigation:**

- Use React memoization
- Filter at provider level (not in render)
- Virtual scrolling for large lists (future)

### Risk 4: Invalid Data

**Risk:** Users enter invalid quantities, dates, etc.

**Mitigation:**

- Form validation (min/max, date format)
- TypeScript types prevent invalid states
- Default values for optional fields

---

## Open Questions

1. **Should we support item photos?**
   - Current: No
   - Future: Could add image upload (LocalStorage limit concern)

2. **Should we support item locations (map)?**
   - Current: Text location field only
   - Future: Could add geolocation

3. **Should we support item sharing/export?**
   - Current: Full data export only
   - Future: Export individual items as JSON

4. **Should we support item templates from inventory?**
   - Current: Templates are separate
   - Future: "Save as template" from inventory item

---

## References

- [DATA_SCHEMA.md](../DATA_SCHEMA.md) - Data structure definitions
- [012-status-calculation.md](./012-status-calculation.md) - Status calculation details
- `src/features/inventory/provider.tsx` - Implementation
- `src/features/inventory/utils/status.ts` - Status calculation
