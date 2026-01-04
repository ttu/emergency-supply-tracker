# Design Doc: Data Import/Export System

**Status:** Published  
**Last Updated:** 2025-01-XX  
**Authors:** Development Team

---

## Summary

The Data Import/Export system allows users to backup and restore their emergency supply data via JSON files. It also supports exporting shopping lists in multiple formats (TXT, Markdown, CSV) and importing/exporting custom recommendation sets.

---

## Background

Since the application stores all data in browser LocalStorage, users need a way to:

- Backup their data (prevent data loss)
- Restore data (after browser clear, device change)
- Share data with family members
- Export shopping lists for shopping trips
- Import/export custom recommendation sets

---

## Goals and Non-Goals

### Goals

- ✅ Export full data as JSON
- ✅ Import full data from JSON with validation
- ✅ Export shopping list (items needing restock) in multiple formats
- ✅ Export recommendations as JSON
- ✅ Import custom recommendations with validation
- ✅ Validate imported data structure
- ✅ Preview data before import
- ✅ Handle data migration/versioning
- ✅ Preserve data integrity on import

### Non-Goals

- ❌ Cloud sync (privacy requirement: local-only)
- ❌ Automatic backups (user-initiated only)
- ❌ Incremental backups (full export only)
- ❌ Data encryption (user can encrypt files themselves)
- ❌ Online sharing (user handles file sharing)

---

## Design

### Data Export Format

**Full Data Export:**

```json
{
  "version": "1.0.0",
  "household": {
    "adults": 2,
    "children": 2,
    "supplyDurationDays": 7,
    "useFreezer": false
  },
  "settings": {
    "language": "en",
    "theme": "auto",
    "enableCalorieTracking": false,
    "enablePowerManagement": false,
    "enableWaterTracking": false
    // ... more settings
  },
  "items": [
    {
      "id": "uuid",
      "name": "Bottled Water",
      "categoryId": "water-beverages",
      "quantity": 20,
      "unit": "liters",
      "recommendedQuantity": 21
      // ... more fields
    }
  ],
  "customCategories": [],
  "customTemplates": [],
  "customRecommendedItems": null,
  "disabledRecommendedItems": [],
  "dismissedAlertIds": [],
  "lastModified": "2025-01-01T12:00:00Z",
  "lastBackupDate": "2025-01-01T12:00:00Z"
}
```

### Import Process

1. **User uploads JSON file** → File input
2. **System reads file** → FileReader API
3. **System validates structure** → Check required fields
4. **System validates data types** → Type checking
5. **System shows preview** → Item counts, household config
6. **User confirms** → Replace existing data
7. **System saves to LocalStorage** → Persist
8. **System reloads app** → Refresh state

### Validation Rules

**Required Fields:**

- `version` - Data format version
- `household` - Household configuration
- `settings` - User settings
- `items` - Inventory items array

**Optional Fields:**

- `customCategories` - Custom categories
- `customTemplates` - Custom templates
- `customRecommendedItems` - Custom recommendations
- `disabledRecommendedItems` - Disabled item IDs
- `dismissedAlertIds` - Dismissed alert IDs

**Validation Checks:**

- Version compatibility (warn if version mismatch)
- Required fields present
- Data types correct
- Item structure valid
- Category IDs valid
- No duplicate item IDs

### Shopping List Export

**Formats:**

- **Plain Text (TXT)**: Simple text list
- **Markdown (MD)**: Formatted with headers, lists
- **CSV**: Spreadsheet-compatible

**Content:**

- Items with `quantity < recommendedQuantity`
- Grouped by category
- Shows quantity needed (recommended - current)
- Includes category icons (in Markdown)
- Generated timestamp

**Example (Markdown):**

```markdown
# Shopping List

Generated: 2025-01-01 12:00:00

## 💧 Water & Beverages

- Bottled Water: Need 5 liters

## 🍴 Food

- Canned Soup: Need 3 cans
- Pasta: Need 2 packages
```

### Recommendations Import/Export

**Export:**

- Exports current recommendations (built-in or custom)
- Includes metadata (name, version, description)
- Includes all item definitions
- JSON format

**Import:**

- Validates structure (meta, items)
- Validates item definitions (required fields)
- Shows preview (item count, metadata)
- Replaces current recommendations
- Preserves user inventory

---

## Implementation Details

### Export Functions

**Location:** `src/shared/utils/storage/localStorage.ts`

```typescript
export function exportAppData(): string {
  const data = getAppData();
  return JSON.stringify(data, null, 2);
}

export function downloadJSON(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

### Import Functions

**Location:** `src/shared/utils/storage/localStorage.ts`

```typescript
export async function importAppData(file: File): Promise<AppData> {
  const text = await file.text();
  const data = JSON.parse(text) as AppData;
  validateAppData(data);
  return data;
}

function validateAppData(data: unknown): asserts data is AppData {
  // Validation logic
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data format');
  }
  // ... more validation
}
```

### Shopping List Export

**Location:** `src/shared/utils/export/shoppingList.ts`

- Filters items needing restock
- Groups by category
- Formats based on export type (TXT/MD/CSV)
- Generates download

### Data Migration

**Version Handling:**

- Current version stored in exported data
- Import checks version compatibility
- Warns if version mismatch
- Future: Migration functions for version upgrades

---

## Alternatives Considered

### Alternative 1: Binary Format

**Approach:** Use binary format (e.g., MessagePack) for smaller files.

**Rejected because:**

- JSON is human-readable (users can inspect/edit)
- JSON is standard (easy to parse/validate)
- File size not a concern (typically <100KB)

### Alternative 2: Incremental Backups

**Approach:** Only export changes since last backup.

**Rejected because:**

- Complex to implement (requires change tracking)
- Full export is simpler
- File size is small anyway
- Users can export manually when needed

### Alternative 3: Cloud Sync

**Approach:** Automatically sync to cloud storage.

**Rejected because:**

- Privacy requirement (local-only)
- No backend infrastructure
- Users can use their own cloud storage if desired

### Alternative 4: Encrypted Exports

**Approach:** Encrypt exported files with password.

**Rejected because:**

- Adds complexity
- Users can encrypt files themselves if needed
- Not a core requirement

---

## Risks and Mitigations

### Risk 1: Data Loss on Import

**Risk:** Importing invalid data overwrites good data.

**Mitigation:**

- Comprehensive validation before import
- Preview before confirming
- Warn user that import replaces existing data
- Recommend exporting before importing

### Risk 2: Version Incompatibility

**Risk:** Importing data from future version breaks app.

**Mitigation:**

- Version checking on import
- Warn if version mismatch
- Graceful degradation (keep compatible fields)
- Migration functions for version upgrades

### Risk 3: Large File Sizes

**Risk:** Very large inventories could create huge JSON files.

**Mitigation:**

- Validate file size (warn if >5MB)
- Efficient JSON serialization
- Tested with 500+ items (acceptable size)

### Risk 4: Malformed JSON

**Risk:** User edits JSON file incorrectly, breaks import.

**Mitigation:**

- Comprehensive validation
- Clear error messages
- JSON parsing with try/catch
- Show validation errors before import

---

## Open Questions

1. **Should we support partial imports?**
   - Current: Full replace only
   - Future: Could support merging specific sections

2. **Should we support export formats other than JSON?**
   - Current: JSON only
   - Future: Could support CSV, XML

3. **Should we support automatic backups?**
   - Current: Manual only
   - Future: Could auto-export on changes (LocalStorage limit concern)

---

## References

- [DATA_SCHEMA.md](../DATA_SCHEMA.md) - Data structure definitions
- [003-recommended-items.md](./003-recommended-items.md) - Recommendations import/export
- `src/shared/utils/storage/localStorage.ts` - Implementation
- `src/shared/utils/export/shoppingList.ts` - Shopping list export
