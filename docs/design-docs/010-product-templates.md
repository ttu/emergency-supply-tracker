# Design Doc: Product Templates System

**Status:** Published  
**Last Updated:** 2025-01-23  
**Authors:** Development Team

---

## Summary

The Product Templates system provides reusable templates for common emergency supply items. Templates include pre-filled data (name, category, unit, expiration period, etc.) that users can use to quickly add items to their inventory. Supports both built-in templates and custom user-created templates.

---

## Background

Users frequently add the same items to their inventory (e.g., "Bottled Water", "Canned Soup"). Instead of manually entering all details each time, templates provide:

- Pre-filled item data
- Consistent naming and categorization
- Optional barcode support (future)
- Quick item creation

---

## Goals and Non-Goals

### Goals

- ✅ Built-in templates for common items
- ✅ Custom template creation
- ✅ Template-based item creation
- ✅ Template search/filter
- ✅ Template metadata (name, category, unit, expiration)
- ✅ Barcode support (stored, not scanned yet)
- ✅ Persist custom templates in LocalStorage
- ✅ Export/import templates

### Non-Goals

- ❌ Barcode scanning (future feature)
- ❌ Online template catalog
- ❌ Template sharing between users
- ❌ Template versioning

---

## Design

### Template Data Model

```typescript
interface ProductTemplate {
  id: string; // Unique identifier
  name: string; // Template name
  categoryId: string; // Category reference
  unit: Unit; // Measurement unit
  expirationPeriodDays?: number; // Typical expiration period
  neverExpires?: boolean; // Non-expiring items
  barcode?: string; // EAN/UPC barcode (future)
  description?: string; // Optional description
  notes?: string; // Optional notes
  isCustom: boolean; // Built-in vs custom
}
```

### Built-in Templates

**Location:** `src/features/templates/data.ts`

- Templates for all 70 recommended items
- Linked to recommended items by ID
- Immutable (only changed via code updates)

### Custom Templates

**Storage:** `AppData.customTemplates: ProductTemplate[]`

- User-created templates
- Stored in LocalStorage
- Can be edited/deleted
- Can be exported/imported

### Template Usage

**Flow:**

1. User clicks "Add Item" → Select "From Template"
2. Template selector shows available templates
3. User selects template → Form pre-fills with template data
4. User can override any field
5. User saves → Item added to inventory

**Location:** `src/features/inventory/components/ItemForm.tsx`

- Loads template by ID using `getTemplate()`
- Pre-fills form with template data
- User can override any field before saving
- Creates InventoryItem from form data on save

### Template Creation

**Flow:**

1. User adds custom item to inventory
2. Option: "Save as Template"
3. System creates template from item data
4. Template saved to `customTemplates`
5. Template available for future use

---

## Implementation Details

### Template Access

**Location:** `src/features/templates/data.ts`

- `getTemplate(id)` - Checks custom templates first, then built-in, returns null if not found
- `getAllTemplates()` - Returns combined array of built-in and custom templates
- Custom templates take precedence over built-in with same ID

### Template Selector Component

**Location:** `src/features/templates/components/TemplateSelector.tsx`

- Search/filter templates
- Group by category
- Show template details
- Select template to use

### Barcode Support (Future)

**Storage:**

- Barcode stored in template
- Not yet used for scanning
- Future: Camera API for barcode scanning

---

## Alternatives Considered

### Alternative 1: No Templates

**Approach:** Users always enter items manually.

**Rejected because:**

- Templates save time
- Consistent data entry
- Better UX

### Alternative 2: Online Template Catalog

**Approach:** Host templates in cloud database.

**Rejected because:**

- Privacy requirement (local-only)
- No backend infrastructure
- Built-in templates sufficient

### Alternative 3: Template Inheritance

**Approach:** Templates can inherit from other templates.

**Rejected because:**

- Adds complexity
- Not needed for current scope
- Can be added as enhancement

---

## Risks and Mitigations

### Risk 1: Template Data Staleness

**Risk:** Built-in templates become outdated.

**Mitigation:**

- Templates are code-based (updated with app)
- Users can create custom templates
- Export/import allows sharing updated templates

### Risk 2: Duplicate Templates

**Risk:** Users create duplicate templates.

**Mitigation:**

- Search helps find existing templates
- Can merge/delete duplicates manually
- Future: Detect duplicates automatically

### Risk 3: Template Deletion

**Risk:** Users delete templates, lose data.

**Mitigation:**

- Deletion requires confirmation
- Inventory items not affected (only template deleted)
- Export/import backup available

---

## Open Questions

1. **Should we support template categories?**
   - Current: Templates linked to item categories
   - Future: Could add template-specific categories

2. **Should we support template sharing?**
   - Current: Export/import only
   - Future: Could add sharing mechanism

3. **Should we support template versioning?**
   - Current: No versioning
   - Future: Could track template changes

---

## References

- [002-inventory-management.md](./002-inventory-management.md) - Item creation
- [003-recommended-items.md](./003-recommended-items.md) - Recommended items
- `src/features/templates/data.ts` - Template definitions
- `src/features/templates/components/TemplateSelector.tsx` - UI component
