# Multi-Inventory Export/Import Design

## Overview

Update the export/import functionality to support the new multi-inventory feature. Users can select which inventory sets to include in exports, and choose which sets to import from files.

## Requirements

1. **Export**: Allow selecting which inventory sets to export with their sections
2. **Import**: Allow selecting which inventory sets to import from files
3. **Backwards Compatible**: Old single-set exports can still be imported
4. **Conflict Resolution**: Auto-rename imported sets if names conflict

## Data Model

### New Export Format

```typescript
interface MultiInventoryExportData {
  version: string;
  exportedAt: string;
  appVersion: string;

  // Global settings (shared across all sets)
  settings?: UserSettings;

  // Selected inventory sets with their data
  inventorySets: ExportedInventorySet[];
}

interface ExportedInventorySet {
  name: string;
  includedSections: InventorySetSection[];
  data: Partial<InventorySetData>;
}

type InventorySetSection =
  | 'items'
  | 'household'
  | 'customCategories'
  | 'customTemplates'
  | 'dismissedAlertIds'
  | 'disabledRecommendedItems'
  | 'customRecommendedItems';
```

## UI Design

### Export Modal

```
┌─────────────────────────────────────────────┐
│  Export Data                            [X] │
├─────────────────────────────────────────────┤
│                                             │
│  ☑ Global Settings                          │
│                                             │
│  ▼ ☑ Home Inventory (active)                │
│      ☑ Items (24)                           │
│      ☑ Household configuration              │
│      ☑ Custom categories (2)                │
│      ☐ Dismissed alerts                     │
│                                             │
│  ▶ ☑ Car Emergency Kit                      │
│                                             │
├─────────────────────────────────────────────┤
│          [Cancel]    [Export Selected]      │
└─────────────────────────────────────────────┘
```

### Import Modal

Same grouped structure, plus:

- Shows only sections that exist in the export file
- Warning when imported set name conflicts with existing
- Auto-generates unique names: "Name (imported)"

## Implementation

### Files to Change

1. `src/shared/types/exportImport.ts` - Add new types
2. `src/shared/utils/storage/localStorage.ts` - Add multi-inventory export/import functions
3. `src/features/settings/components/ExportSelectionModal/` - Refactor for grouped UI
4. `src/features/settings/components/ImportSelectionModal/` - Refactor for grouped UI
5. `src/features/settings/components/ExportButton.tsx` - Pass RootStorage
6. `src/features/settings/components/ImportButton.tsx` - Handle multi-inventory
7. `public/locales/en/common.json` - Add translations
8. `public/locales/fi/common.json` - Add translations

### New Components

- `InventorySetExportSection` - Expandable section for each inventory set

## Backwards Compatibility

- Detect old format: has `items` at root level, no `inventorySets` array
- Treat as single inventory set named "Imported Data"
