# Design Doc: Category Management

**Status:** Published  
**Last Updated:** 2025-01-23  
**Authors:** Development Team

---

## Summary

The Category Management system provides 10 standard emergency supply categories based on 72tuntia.fi guidelines, plus support for custom user-created categories. Categories organize items, provide visual indicators, and enable filtering and navigation.

---

## Background

Emergency supplies are organized into logical categories (water, food, medical, etc.). The application provides:

- 10 standard categories (based on 72tuntia.fi)
- Custom category creation for special needs
- Category-based navigation and filtering
- Visual category indicators (icons, colors)

---

## Goals and Non-Goals

### Goals

- ✅ 10 standard categories with icons
- ✅ Custom category creation
- ✅ Category-based item organization
- ✅ Category navigation (tabs, filters)
- ✅ Category status aggregation
- ✅ Category icons and metadata
- ✅ Persist custom categories in LocalStorage

### Non-Goals

- ❌ Category hierarchy/subcategories (future feature)
- ❌ Category colors (icons only)
- ❌ Category templates
- ❌ Category sharing

---

## Design

### Standard Categories

**Location:** `src/features/categories/data.ts`

```typescript
interface StandardCategory {
  id: StandardCategoryId;
  icon: string; // Emoji icon
  nameKey: string; // i18n key for name
  descriptionKey?: string; // i18n key for description
}

const STANDARD_CATEGORIES: StandardCategory[] = [
  { id: 'water-beverages', icon: '💧', nameKey: 'water-beverages' },
  { id: 'food', icon: '🍴', nameKey: 'food' },
  { id: 'cooking-heat', icon: '🔥', nameKey: 'cooking-heat' },
  { id: 'light-power', icon: '💡', nameKey: 'light-power' },
  { id: 'communication-info', icon: '📻', nameKey: 'communication-info' },
  { id: 'medical-health', icon: '🏥', nameKey: 'medical-health' },
  { id: 'hygiene-sanitation', icon: '🧼', nameKey: 'hygiene-sanitation' },
  { id: 'tools-supplies', icon: '🔧', nameKey: 'tools-supplies' },
  { id: 'cash-documents', icon: '💰', nameKey: 'cash-documents' },
  { id: 'pets', icon: '🐕', nameKey: 'pets' },
];
```

### Custom Categories

**Storage:** `AppData.customCategories: CustomCategory[]`

```typescript
interface CustomCategory {
  id: string; // UUID
  name: string; // User-provided name
  icon: string; // Emoji icon
  description?: string; // Optional description
  createdAt: string; // ISO timestamp
}
```

### Category Access

**Location:** `src/features/categories/data.ts`

- `getAllCategories()` - Returns combined array of standard and custom categories
- `getCategory(id)` - Finds category by ID from all categories, returns null if not found
- Standard categories always appear first, custom categories follow

### Category Usage

**Navigation:**

- Category tabs in Inventory page
- Category cards in Dashboard
- Category filter in item lists

**Status Aggregation:**

- Category status = worst item status in category
- Category preparedness = percentage of items sufficient
- Used in Dashboard category cards

**Filtering:**

- Filter items by category
- Show category-specific item lists
- Category-based search

---

## Implementation Details

### Category Navigation

**Location:** `src/features/inventory/components/CategoryNav.tsx`

- Horizontal tabs for categories
- Active category highlighting
- Scrollable on mobile
- Click to filter items

### Category Status

**Location:** `src/features/dashboard/utils/categoryStatus.ts`

- Aggregates item statuses within category
- Calculates category preparedness percentage
- Returns worst status (Critical > Warning > OK)

**Note:** Category status aggregation uses item statuses calculated per [012-status-calculation.md](./012-status-calculation.md). See that document for item status determination logic.

### Custom Category Creation

**Location:** `src/features/settings/components/CustomCategories.tsx`

- Form to create custom category
- Name, icon (emoji), description
- Validation (unique name, valid icon)
- Save to `customCategories`

---

## Alternatives Considered

### Alternative 1: No Custom Categories

**Approach:** Only support 10 standard categories.

**Rejected because:**

- Users may need special categories (hobbies, special equipment)
- Flexibility is valuable
- Easy to implement

### Alternative 2: Category Hierarchy

**Approach:** Support subcategories (e.g., Food → Canned, Food → Dry).

**Rejected because:**

- Adds complexity
- Not needed for current scope
- Can be added as enhancement

### Alternative 3: Category Colors

**Approach:** Assign colors to categories.

**Rejected because:**

- Icons are sufficient
- Colors could conflict with status colors
- Icons are more universal

---

## Risks and Mitigations

### Risk 1: Too Many Custom Categories

**Risk:** Users create many categories, cluttering UI.

**Mitigation:**

- Limit custom categories (e.g., max 10)
- Standard categories always shown first
- Can delete custom categories

### Risk 2: Category Deletion with Items

**Risk:** User deletes category that has items.

**Mitigation:**

- Warn before deletion
- Require moving items to another category
- Or prevent deletion if category has items

### Risk 3: Invalid Category References

**Risk:** Items reference deleted categories.

**Mitigation:**

- Validate category exists on item creation
- Show "Unknown Category" for missing categories
- Migration on import (map to standard category)

---

## Open Questions

1. **Should we support category icons (not just emoji)?**
   - Current: Emoji only
   - Future: Could support SVG icons

2. **Should we support category descriptions?**
   - Current: Optional description
   - Future: Could show in tooltips

3. **Should we support category ordering?**
   - Current: Standard first, then custom
   - Future: Could allow custom ordering

---

## References

- [004-dashboard-preparedness.md](./004-dashboard-preparedness.md) - Category status
- [002-inventory-management.md](./002-inventory-management.md) - Item categorization
- `src/features/categories/data.ts` - Category definitions
- `src/features/inventory/components/CategoryNav.tsx` - Navigation
