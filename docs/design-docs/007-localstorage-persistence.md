# Design Doc: LocalStorage Persistence Architecture

**Status:** Published  
**Last Updated:** 2025-01-23  
**Authors:** Development Team

---

## Summary

The LocalStorage Persistence system manages all application data storage in the browser's LocalStorage. It provides a unified interface for reading/writing data, handles data migration, and ensures data integrity.

---

## Background

The application stores all data locally in the browser (no backend). LocalStorage is the primary storage mechanism, providing:

- Persistent storage across sessions
- No server required (privacy-first)
- Simple API
- 5-10MB storage limit (sufficient for our use case)

The system must handle:

- Data structure changes (migration)
- Error recovery
- Data validation
- Performance optimization

---

## Goals and Non-Goals

### Goals

- ✅ Store all app data in LocalStorage
- ✅ Provide unified read/write interface
- ✅ Handle data migration between versions
- ✅ Validate data on read/write
- ✅ Handle storage errors gracefully
- ✅ Support data export/import
- ✅ Maintain backward compatibility

### Non-Goals

- ❌ IndexedDB (LocalStorage is sufficient)
- ❌ Cloud sync (privacy requirement)
- ❌ Data encryption (user can encrypt exports)
- ❌ Multi-browser sync (not possible with LocalStorage)

---

## Design

### Storage Key

```typescript
const STORAGE_KEY = 'emergencySupplyTracker';
```

Single key stores all application data as JSON.

### Data Structure

**Root Object:** `AppData`

```typescript
interface AppData {
  version: string; // Data format version (current: "1.1.0")
  household: HouseholdConfig; // Household configuration
  settings: UserSettings; // User settings
  items: InventoryItem[]; // Inventory items
  customCategories: CustomCategory[]; // Custom categories
  customTemplates: ProductTemplate[]; // Custom templates
  customRecommendedItems: CustomRecommendations | null; // Custom recommendations
  disabledRecommendedItems: string[]; // Disabled recommendation IDs
  dismissedAlertIds: string[]; // Dismissed alert IDs
  lastModified: string; // ISO 8601 timestamp (e.g., "2025-01-23T12:00:00.000Z")
  lastBackupDate?: string; // Last backup timestamp (ISO 8601 format)
}
```

**Current Version:** 1.1.0 (as of 2025-01-23)

**Date Format:** All dates and timestamps use ISO 8601 format:

- Dates: `YYYY-MM-DD` (e.g., "2025-01-23")
- Timestamps: `YYYY-MM-DDTHH:mm:ss.sssZ` (e.g., "2025-01-23T12:00:00.000Z")

### Storage Operations

**Location:** `src/shared/utils/storage/localStorage.ts`

**Read:**

- `getAppData()` - Reads from LocalStorage, parses JSON, applies migration if needed
- Returns `AppData | null` (null if no data or parse error)
- Handles errors gracefully with fallback to null

**Write:**

- `saveAppData(data)` - Serializes to JSON, updates `lastModified` timestamp
- Handles `QuotaExceededError` with user-friendly message
- Throws error on failure for caller to handle

### Data Migration

**Version Handling:**

- Each data export includes `version` field
- On read, `migrateDataIfNeeded()` checks version and applies migration functions
- Migration functions transform old format to new format
- Current version: 1.1.0 (supports migration from 1.0.0)

**Migration Strategy:**

- Check version on read
- Apply migration functions sequentially
- Add new fields with defaults
- Preserve existing data
- Update version field

### Error Handling

**Storage Quota Exceeded:**

- Catch `QuotaExceededError`
- Show user-friendly error message
- Suggest exporting and clearing data

**Invalid Data:**

- Validate on read
- Fallback to defaults if invalid
- Log error for debugging

**Corrupted Data:**

- Try to recover valid fields
- Show warning to user
- Suggest importing backup

### Performance Optimization

**Batching:**

- Multiple writes in quick succession are batched
- Debounce auto-save operations
- Use `requestIdleCallback` for non-critical saves

**Size Optimization:**

- Remove unused fields on save
- Compress large arrays if needed
- Monitor storage usage

---

## Implementation Details

### Provider Integration

**Location:** `src/features/*/provider.tsx`

- Context Providers manage feature-specific state
- Auto-save to LocalStorage via `useEffect` hooks
- Merge feature state with full AppData on save
- Each provider handles its own state slice

### Default Data

**Location:** `src/shared/utils/storage/localStorage.ts`

- `createDefaultAppData()` - Returns AppData with default values
- Uses constants for defaults (HOUSEHOLD_DEFAULTS, DEFAULT_SETTINGS, etc.)
- Sets current version and initial timestamp

### Legacy Data Migration

**Item Type Migration:**

- Old data used translated names in `itemType` field
- New data uses template IDs
- `LEGACY_ITEM_TYPE_MAP` maps old names to new IDs
- Migration function applies mapping during data load

**Location:** `src/shared/utils/storage/localStorage.ts`

---

## Alternatives Considered

### Alternative 1: IndexedDB

**Approach:** Use IndexedDB instead of LocalStorage.

**Rejected because:**

- LocalStorage is simpler (synchronous API)
- Our data fits in LocalStorage (typically <100KB)
- No need for complex queries (we load all data)
- IndexedDB adds complexity without benefit

### Alternative 2: Multiple Storage Keys

**Approach:** Split data across multiple LocalStorage keys.

**Rejected because:**

- Single key is simpler
- Easier to export/import (one file)
- Atomic operations (all or nothing)
- No benefit to splitting

### Alternative 3: Compression

**Approach:** Compress JSON before storing.

**Rejected because:**

- Adds complexity
- LocalStorage limit not a concern
- JSON is human-readable (users can inspect)
- Compression overhead not worth it

---

## Risks and Mitigations

### Risk 1: Storage Quota Exceeded

**Risk:** Very large inventories exceed LocalStorage limit (5-10MB).

**Mitigation:**

- Monitor storage usage
- Warn users if approaching limit
- Suggest exporting and clearing old data
- Test with 1000+ items (acceptable size)

### Risk 2: Data Corruption

**Risk:** LocalStorage data becomes corrupted.

**Mitigation:**

- Validate on read
- Fallback to defaults if invalid
- Export/import backup available
- Error logging for debugging

### Risk 3: Browser Clear

**Risk:** Users clear browser data, lose all data.

**Mitigation:**

- Export/import feature for backups
- Backup reminder system
- Clear warnings in UI
- Documentation on backing up

### Risk 4: Migration Failures

**Risk:** Data migration fails, breaks app.

**Mitigation:**

- Comprehensive migration tests
- Graceful fallback (keep old format)
- Version checking
- User can export before upgrade

---

## Open Questions

1. **Should we support data compression?**
   - Current: No
   - Future: Could compress if storage becomes issue

2. **Should we support data encryption?**
   - Current: No
   - Future: Could add optional encryption

3. **Should we support incremental saves?**
   - Current: Full save on each change
   - Future: Could batch changes for performance

---

## References

- [DATA_SCHEMA.md](../DATA_SCHEMA.md) - Data structure definitions
- [006-data-import-export.md](./006-data-import-export.md) - Import/export details
- `src/shared/utils/storage/localStorage.ts` - Implementation
- `src/shared/types/index.ts` - Type definitions
