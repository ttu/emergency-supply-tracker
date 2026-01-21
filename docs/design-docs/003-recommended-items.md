# Design Doc: Recommended Items System

**Status:** Published  
**Last Updated:** 2025-01-23  
**Authors:** Development Team

---

## Summary

The Recommended Items system provides 81 built-in emergency supply recommendations based on 72tuntia.fi guidelines. It supports custom recommendation sets via import/export, multi-language item names, and flexible scaling rules for household personalization.

---

## Background

Emergency preparedness guidelines (like 72tuntia.fi) provide standard recommendations for emergency supplies. However, users may need:

- Country-specific recommendations
- Organization-specific kits
- Custom recommendations for special needs
- Multi-language support

The system must support both built-in recommendations and custom imports while maintaining data integrity and validation.

---

## Goals and Non-Goals

### Goals

- ✅ Provide 81 built-in recommended items based on 72tuntia.fi
- ✅ Support custom recommendation imports (JSON)
- ✅ Export current recommendations (built-in or custom)
- ✅ Multi-language item names (English, Finnish, etc.)
- ✅ Flexible scaling rules (scaleWithPeople, scaleWithDays)
- ✅ Validate imported recommendations
- ✅ Disable/enable individual recommendations
- ✅ Preserve user inventory when switching recommendations

### Non-Goals

- ❌ Online recommendation catalog/database
- ❌ Recommendation versioning/history
- ❌ Recommendation ratings/reviews
- ❌ Automatic recommendation updates
- ❌ Recommendation merging (import replaces, doesn't merge)

---

## Design

### Data Model

**Built-in Recommendations:**

- Stored in `src/data/recommendedItems.ts`
- TypeScript constants
- Includes i18n keys for translations

**Custom Recommendations:**

- JSON file format
- Imported via Settings → Recommended Items → Import
- Replaces built-in recommendations

**Recommended Item Definition:**

```typescript
interface RecommendedItemDefinition {
  id: string; // Unique identifier
  i18nKey?: string; // Translation key (for built-in)
  names?: Record<string, string>; // Multi-language names (for custom)
  category: StandardCategoryId; // Category reference
  baseQuantity: number; // Base quantity (for 1 adult, 3 days)
  unit: Unit; // Measurement unit
  scaleWithPeople: boolean; // Scale with household size
  scaleWithDays: boolean; // Scale with supply duration
  description?: string; // Optional description
  notes?: string; // Optional notes
}
```

### Custom Recommendations JSON Format

```json
{
  "meta": {
    "name": "Finnish Family Kit",
    "version": "1.0.0",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "items": [
    {
      "id": "water-example",
      "names": { "en": "Drinking Water", "fi": "Juomavesi" },
      "category": "water-beverages",
      "baseQuantity": 3,
      "unit": "liters",
      "scaleWithPeople": true,
      "scaleWithDays": true
    }
  ]
}
```

**Date Format:** All timestamps use ISO 8601 format (`YYYY-MM-DDTHH:mm:ss.sssZ`).

### Import/Export Behavior

**Import:**

1. User uploads JSON file
2. System validates structure and required fields
3. Shows validation errors/warnings
4. Preview item count and metadata
5. User confirms → Replaces current recommendations
6. User's inventory items preserved
7. Disabled recommendations list cleared (IDs may not exist)

**Export:**

1. User clicks Export button
2. System exports current recommendations (built-in or custom)
3. Includes metadata and all item definitions
4. Downloads as JSON file

**Reset to Default:**

1. User clicks "Reset to Default" button
2. System restores built-in 81-item recommendations
3. User's inventory items preserved
4. Disabled recommendations list preserved (if IDs still exist)

### Validation Rules

**Required Fields:**

- `meta.name` - Recommendation set name
- `meta.version` - Version string
- `meta.createdAt` - ISO timestamp
- `items` - Array of items

**Required Item Fields:**

- `id` - Unique identifier (string)
- `category` - Valid category ID
- `baseQuantity` - Number > 0
- `unit` - Valid unit type
- `scaleWithPeople` - Boolean
- `scaleWithDays` - Boolean
- Either `i18nKey` OR `names.en` (English name required)

**Validation Warnings:**

- Empty name values in `names` object
- Missing optional fields (description, notes)
- Duplicate item IDs
- Invalid category IDs (warn but allow custom categories - custom categories are supported)

**Note:** Custom category IDs are allowed in imported recommendations. The system will warn if a category ID doesn't match a standard category, but will still accept the import. Users can create custom categories in Settings if needed.

---

## Implementation Details

### Built-in Recommendations

**Location:** `src/data/recommendedItems.ts`

- 81 items across 10 categories
- Uses i18n keys for translations
- Hardcoded TypeScript constants
- Immutable (only changed via code updates)

### Custom Recommendations Storage

**Location:** `AppData.customRecommendedItems`

```typescript
interface AppData {
  // ... other fields
  customRecommendedItems: {
    meta: RecommendationMeta;
    items: RecommendedItemDefinition[];
  } | null;
}
```

### Recommendation Access

**Location:** `src/features/inventory/provider.tsx`

- `getRecommendedItems()` - Returns custom recommendations if available, otherwise built-in
- Checks `AppData.customRecommendedItems` first, falls back to `BUILT_IN_RECOMMENDED_ITEMS`

### Import Validation

**Location:** `src/shared/utils/validation/recommendedItems.ts`

- Validates JSON structure
- Validates required fields
- Checks item definitions
- Returns validation result with errors/warnings

### Disabled Recommendations

**Location:** `AppData.disabledRecommendedItems`

- Array of item IDs to hide
- Stored in LocalStorage
- Managed in Settings → Disabled Recommendations
- Affects:
  - Recommendations display (hidden from list)
  - Shortage calculations (not counted as missing)

---

## Alternatives Considered

### Alternative 1: Merge Custom with Built-in

**Approach:** Allow importing custom items that merge with built-in items.

**Rejected because:**

- Complex merge logic (conflicts, duplicates)
- Unclear which items to keep
- Simpler to replace entirely
- Users can export built-in, modify, and re-import

### Alternative 2: Online Recommendation Catalog

**Approach:** Host recommendations in a cloud database.

**Rejected because:**

- Privacy concern (no external services)
- Offline-first requirement
- LocalStorage-only architecture
- Adds complexity (authentication, sync)

### Alternative 3: Recommendation Versioning

**Approach:** Track versions of recommendation sets.

**Rejected because:**

- Not needed for v1
- Adds complexity
- Can be added later if needed

### Alternative 4: Recommendation Ratings

**Approach:** Allow users to rate/review recommendations.

**Rejected because:**

- Requires backend/cloud storage
- Privacy concern
- Not in scope for v1

---

## Risks and Mitigations

### Risk 1: Invalid Import Data

**Risk:** Users import malformed JSON that breaks the app.

**Mitigation:**

- Comprehensive validation before import
- Show errors/warnings clearly
- Preview before confirming
- Fallback to built-in if import fails

### Risk 2: Lost Recommendations on Import

**Risk:** User imports invalid data, loses access to recommendations.

**Mitigation:**

- Always keep built-in recommendations in code
- "Reset to Default" button always available
- Export before import (recommended in UI)

### Risk 3: Inventory Items Reference Missing Recommendations

**Risk:** User switches recommendations, inventory items reference IDs that no longer exist.

**Mitigation:**

- Inventory items store `productTemplateId` (optional)
- Missing recommendations don't break inventory
- Items still display, just can't match to recommendations
- User can manually update or re-import original recommendations

### Risk 4: Large Custom Recommendation Files

**Risk:** Very large JSON files could cause performance issues.

**Mitigation:**

- Validate file size (warn if > 1MB)
- Parse and validate incrementally
- Show progress during import
- Limit item count (warn if > 200 items)

---

## Open Questions

1. **Should we support recommendation merging?**
   - Current: Replace only
   - Future: Could add merge mode

2. **Should we support recommendation updates/patches?**
   - Current: Full replace
   - Future: Could support partial updates

3. **Should we validate category IDs strictly?**
   - Current: Warn but allow custom categories
   - Future: Could enforce standard categories only

4. **Should we support recommendation templates?**
   - Current: Manual JSON creation
   - Future: Could provide template generator UI

---

## References

- [RECOMMENDED_ITEMS.md](../RECOMMENDED_ITEMS.md) - Complete list of 81 items
- [DATA_SCHEMA.md](../DATA_SCHEMA.md) - Data structure definitions
- [FUNCTIONAL_SPEC.md](../FUNCTIONAL_SPEC.md) - Functional requirements
- `src/data/recommendedItems.ts` - Built-in recommendations
- `src/shared/utils/validation/recommendedItems.ts` - Validation logic
