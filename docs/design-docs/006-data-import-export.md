# Design Doc: Data Import/Export System

**Status:** Published
**Last Updated:** 2026-02-12
**Authors:** Development Team

---

## Summary

The Data Import/Export system allows users to backup and restore their emergency supply data via JSON files. It supports multi-inventory exports where users can select which inventory sets and sections to include. It also supports exporting shopping lists in multiple formats (TXT, Markdown, CSV) and importing/exporting custom recommendation sets.

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

**Multi-Inventory Export (Current):**

The export format supports multiple inventory sets with selective section export:

```json
{
  "version": "1.1.0",
  "exportedAt": "2026-02-12T12:00:00.000Z",
  "appVersion": "1.0.0",
  "settings": {
    "language": "en",
    "theme": "auto",
    "enableCalorieTracking": false
  },
  "inventorySets": [
    {
      "name": "Home Inventory",
      "includedSections": ["items", "household", "customCategories"],
      "data": {
        "id": "uuid",
        "name": "Home Inventory",
        "lastModified": "2026-02-12T12:00:00.000Z",
        "items": [...],
        "household": {...},
        "customCategories": [...]
      }
    },
    {
      "name": "Car Emergency Kit",
      "includedSections": ["items", "household"],
      "data": {
        "id": "uuid",
        "name": "Car Emergency Kit",
        "lastModified": "2026-02-12T12:00:00.000Z",
        "items": [...],
        "household": {...}
      }
    }
  ]
}
```

**Available Inventory Set Sections:**

| Section                    | Description                    |
| -------------------------- | ------------------------------ |
| `items`                    | Inventory items array          |
| `household`                | Household configuration        |
| `customCategories`         | User-defined categories        |
| `customTemplates`          | User-defined product templates |
| `dismissedAlertIds`        | Dismissed alert IDs            |
| `disabledRecommendedItems` | Disabled recommended item IDs  |
| `disabledCategories`       | Disabled category IDs          |
| `customRecommendedItems`   | Custom recommendations file    |

**Global Settings** (shared across all inventory sets) can optionally be included in the export.

**Legacy Single-Set Export (Backwards Compatible):**

Older exports without `inventorySets` array are automatically converted to multi-inventory format on import, with the data assigned to a set named "Imported Data".

### Export Process

1. **User clicks Export** → Opens ExportSelectionModal
2. **User selects data** → Choose global settings, inventory sets, and per-set sections
3. **User confirms** → Click "Export Selected"
4. **System creates JSON** → Only includes selected sections
5. **Browser downloads file** → File with timestamp in name

### Import Process

1. **User uploads JSON file** → File input
2. **System reads file** → FileReader API
3. **System detects format** → Multi-inventory or legacy
4. **System converts if legacy** → Wraps in multi-inventory format
5. **System validates structure** → Check required fields
6. **System shows ImportSelectionModal** → Preview available sets/sections
7. **User selects what to import** → Choose sets and sections
8. **System checks name conflicts** → Auto-generates unique names if needed
9. **System merges data** → Creates new inventory sets
10. **System reloads app** → Refresh state

### Validation Rules

**Multi-Inventory Format Required Fields:**

- `version` - Data format version
- `exportedAt` - Export timestamp
- `appVersion` - App version that created export
- `inventorySets` - Array of exported inventory sets

**Per Inventory Set Required Fields:**

- `name` - Set name
- `includedSections` - Array of included section names
- `data` - Partial inventory set data

**Legacy Format Required Fields:**

- `version` - Data format version
- `items` - Inventory items array (at root level, indicates legacy format)

**Validation Checks:**

- Version compatibility (warn if version mismatch)
- Required fields present
- Data types correct
- Item structure valid
- Category IDs valid
- No duplicate item IDs within a set

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

### Export Types

**Location:** `src/shared/types/exportImport.ts`

```typescript
type InventorySetSection =
  | 'items'
  | 'household'
  | 'customCategories'
  | 'customTemplates'
  | 'dismissedAlertIds'
  | 'disabledRecommendedItems'
  | 'disabledCategories'
  | 'customRecommendedItems';

interface MultiInventoryExportSelection {
  includeSettings: boolean;
  inventorySets: {
    id: InventorySetId;
    sections: InventorySetSection[];
  }[];
}

interface MultiInventoryExportData {
  version: string;
  exportedAt: string;
  appVersion: string;
  settings?: UserSettings;
  inventorySets: ExportedInventorySet[];
}
```

### Export Functions

**Location:** `src/shared/utils/storage/localStorage.ts`

- `exportMultiInventoryData(root, selection)` - Creates multi-inventory export JSON
- `getInventorySetExportInfo(root)` - Gets export info for all inventory sets
- `downloadJSON()` - Creates blob and triggers browser download

### Import Functions

**Location:** `src/shared/utils/storage/localStorage.ts`

- `parseMultiInventoryImport(json)` - Parses JSON, auto-detects format, returns unified format
- `importMultiInventoryData(root, importData, selection)` - Merges selected data into storage
- `generateUniqueInventorySetName(name, existingNames)` - Generates unique name for conflicts

### UI Components

**Location:** `src/features/settings/components/`

- `ExportSelectionModal` - Modal for selecting what to export
- `ImportSelectionModal` - Modal for selecting what to import
- `InventorySetExportSection` - Expandable section for per-set selection

### Shopping List Export

**Location:** `src/shared/utils/export/shoppingList.ts`

- Filters items with `quantity < recommendedQuantity`
- Groups by category
- Formats based on export type (TXT/MD/CSV)
- Generates downloadable file with timestamp

### Data Migration

**Version Handling:**

- Current version: **1.1.0** (as of 2025-01-23)
- Version stored in exported data
- Import checks version compatibility
- Warns if version mismatch
- Supported versions: 1.0.0, 1.1.0
- Future: Migration functions for version upgrades

**Date Format:**

- All dates use ISO 8601 format
- Dates: `YYYY-MM-DD` (e.g., "2025-01-23")
- Timestamps: `YYYY-MM-DDTHH:mm:ss.sssZ` (e.g., "2025-01-23T12:00:00.000Z")

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

1. ~~**Should we support partial imports?**~~
   - ✅ **Implemented:** Users can select which inventory sets and sections to import

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
