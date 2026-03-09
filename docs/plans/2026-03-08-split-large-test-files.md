# Split Large Test Files Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split 6 test files (1500-3200+ lines each) into smaller, focused files (~300-800 lines) for easier LLM processing and maintainability.

**Architecture:** Each large test file is split by logical concern into co-located files with descriptive suffixes. Shared test helpers (mock factories, fixtures) are extracted into `__helpers__` files next to the test files. All imports are preserved; no behavior changes.

**Tech Stack:** Vitest, React Testing Library, TypeScript

---

## Naming Convention

Split files use descriptive suffixes: `<module>.<concern>.test.ts`

Example: `localStorage.test.ts` → `localStorage.core.test.ts`, `localStorage.import.test.ts`, etc.

## Shared Helpers Strategy

When a test file has local helper functions/fixtures (lines before the first `describe`), extract them to a `__helpers__/<module>.helpers.ts` file in the same directory. Each split file imports from the helpers file.

---

### Task 1: categoryPercentage.test.ts → 3 files + helpers

**Source:** `src/shared/utils/calculations/categoryPercentage.test.ts` (3233 lines)

**Files:**

- Create: `src/shared/utils/calculations/__helpers__/categoryPercentage.helpers.ts`
- Create: `src/shared/utils/calculations/categoryPercentage.categories.test.ts`
- Create: `src/shared/utils/calculations/categoryPercentage.edgeCases.test.ts`
- Create: `src/shared/utils/calculations/categoryPercentage.mutations.test.ts`
- Delete: `src/shared/utils/calculations/categoryPercentage.test.ts`

**Split plan:**

1. **Helpers file** (lines 13-253): `createMockInventoryItem` + all 9 `mock*RecommendedItems` arrays
2. **categories** (lines 255-1692): Main `describe('calculateCategoryPercentage')` with sub-describes for each category (food, tools-supplies, water-beverages, cooking-heat, light-power, communication-info, medical-health, hygiene-sanitation, cash-documents, disabled items, categories without recommendations)
3. **edgeCases** (lines 1693-1751): `describe('edge cases')`
4. **mutations** (lines 1752-3233): All `describe('mutation test: ...')` blocks (20+ mutation test groups)

**Step 1:** Create helpers file with extracted mock data
**Step 2:** Create `categoryPercentage.categories.test.ts` with lines 255-1692, importing from helpers
**Step 3:** Create `categoryPercentage.edgeCases.test.ts` with lines 1693-1751, importing from helpers
**Step 4:** Create `categoryPercentage.mutations.test.ts` with lines 1752-3233, importing from helpers
**Step 5:** Delete original file
**Step 6:** Run `npm run test -- --run src/shared/utils/calculations/categoryPercentage` to verify
**Step 7:** Commit: `test: split categoryPercentage.test.ts into focused test files`

---

### Task 2: localStorage.test.ts → 4 files + helpers

**Source:** `src/shared/utils/storage/localStorage.test.ts` (3228 lines)

**Files:**

- Create: `src/shared/utils/storage/__helpers__/localStorage.helpers.ts`
- Create: `src/shared/utils/storage/localStorage.core.test.ts`
- Create: `src/shared/utils/storage/localStorage.importExport.test.ts`
- Create: `src/shared/utils/storage/localStorage.multiInventory.test.ts`
- Create: `src/shared/utils/storage/localStorage.edgeCases.test.ts`
- Delete: `src/shared/utils/storage/localStorage.test.ts`

**Split plan:**

1. **Helpers file** (lines 45-55): `createTestExportMetadata` helper
2. **core** (lines 57-431): `createDefaultAppData`, basic CRUD within `describe('localStorage utilities')`
3. **importExport** (lines 432-1083): `error handling`, `exportToJSONSelective`, `parseImportJSON`, `mergeImportData`
4. **multiInventory** (lines 1084-1820): All `multi-inventory export/import` sub-describes
5. **edgeCases** (lines 1821-3228): `inventory set API`, `isTemplateId`, validation results, all edge case describes

Note: The outer `describe('localStorage utilities')` wraps everything. Each split file gets its own outer describe with a descriptive name.

**Step 1:** Create helpers file
**Step 2:** Create core, importExport, multiInventory, edgeCases files
**Step 3:** Delete original
**Step 4:** Run `npm run test -- --run src/shared/utils/storage/localStorage`
**Step 5:** Commit: `test: split localStorage.test.ts into focused test files`

---

### Task 3: categoryStatus.test.ts → 4 files

**Source:** `src/features/dashboard/utils/categoryStatus.test.ts` (2913 lines)

No local helpers to extract (uses shared factories).

**Files:**

- Create: `src/features/dashboard/utils/categoryStatus.core.test.ts`
- Create: `src/features/dashboard/utils/categoryStatus.shortages.test.ts`
- Create: `src/features/dashboard/utils/categoryStatus.displayStatus.test.ts`
- Create: `src/features/dashboard/utils/categoryStatus.edgeCases.test.ts`
- Delete: `src/features/dashboard/utils/categoryStatus.test.ts`

**Split plan:**

1. **core** (lines 39-796): `calculateCategoryStatus` + `calculateAllCategoryStatuses` + `calculateCategoryShortages` (water calculation)
2. **shortages** (lines 797-1661): inventory-based status, disabled items, communication-info, item matching logic
3. **displayStatus** (lines 1662-2531): `getCategoryDisplayStatus`, mixed units, progress consistency
4. **edgeCases** (lines 2532-2913): pets, bug fixes, precision, hasRecommendations, arithmetic, no recommendations

**Step 1-4:** Create 4 files with respective describe blocks
**Step 5:** Delete original
**Step 6:** Run `npm run test -- --run src/features/dashboard/utils/categoryStatus`
**Step 7:** Commit: `test: split categoryStatus.test.ts into focused test files`

---

### Task 4: Inventory.test.tsx → 3 files

**Source:** `src/features/inventory/pages/Inventory.test.tsx` (2115 lines)

Shared: vi.mock for react-i18next (lines 28-32) — duplicate in each file.

**Files:**

- Create: `src/features/inventory/pages/Inventory.core.test.tsx`
- Create: `src/features/inventory/pages/Inventory.items.test.tsx`
- Create: `src/features/inventory/pages/Inventory.features.test.tsx`
- Delete: `src/features/inventory/pages/Inventory.test.tsx`

**Split plan:**

1. **core** (lines 34-973): `Inventory Page` (empty state, basic rendering) + `Inventory Page with items` (CRUD, display)
2. **items** (lines 974-1475): Template conversion, recommended items filtering, mark as enough, resolveItemName
3. **features** (lines 1476-2115): Custom templates, location filter, quick edit quantity, remove empty items, initial item from alert

Each file gets its own copy of the `vi.mock('react-i18next')` block and imports.

**Step 1-3:** Create 3 files
**Step 4:** Delete original
**Step 5:** Run `npm run test -- --run src/features/inventory/pages/Inventory`
**Step 6:** Commit: `test: split Inventory.test.tsx into focused test files`

---

### Task 5: recommendedItemsValidation.test.ts → 3 files + helpers

**Source:** `src/shared/utils/validation/recommendedItemsValidation.test.ts` (2014 lines)

**Files:**

- Create: `src/shared/utils/validation/__helpers__/recommendedItemsValidation.helpers.ts`
- Create: `src/shared/utils/validation/recommendedItemsValidation.core.test.ts`
- Create: `src/shared/utils/validation/recommendedItemsValidation.parsing.test.ts`
- Create: `src/shared/utils/validation/recommendedItemsValidation.kits.test.ts`
- Delete: `src/shared/utils/validation/recommendedItemsValidation.test.ts`

**Split plan:**

1. **Helpers** (lines 17-54): `createValidFile` + `createValidItem` factories
2. **core** (lines 56-1328): `validateRecommendedItemsFile` — valid files, invalid structure, meta validation, items validation, warnings
3. **parsing** (lines 1329-1456): `parseRecommendedItemsFile` + `convertToRecommendedItemDefinitions`
4. **kits** (lines 1457-2014): custom categories, disabledCategories, example recommendation kits

**Step 1:** Create helpers
**Step 2-4:** Create 3 test files
**Step 5:** Delete original
**Step 6:** Run `npm run test -- --run src/shared/utils/validation/recommendedItemsValidation`
**Step 7:** Commit: `test: split recommendedItemsValidation.test.ts into focused test files`

---

### Task 6: preparedness.test.ts → 2 files

**Source:** `src/features/dashboard/utils/preparedness.test.ts` (1524 lines)

No local helpers to extract.

**Files:**

- Create: `src/features/dashboard/utils/preparedness.score.test.ts`
- Create: `src/features/dashboard/utils/preparedness.category.test.ts`
- Delete: `src/features/dashboard/utils/preparedness.test.ts`

**Split plan:**

1. **score** (lines 20-1141): `calculatePreparednessScoreFromCategoryStatuses` + `calculatePreparednessScore` (including item matching logic)
2. **category** (lines 1142-1524): `calculateCategoryPreparedness`

**Step 1-2:** Create 2 files
**Step 3:** Delete original
**Step 4:** Run `npm run test -- --run src/features/dashboard/utils/preparedness`
**Step 5:** Commit: `test: split preparedness.test.ts into focused test files`

---

### Task 7: Final verification

**Step 1:** Run `npm run test -- --run` (full test suite)
**Step 2:** Run `npm run type-check:test` (TypeScript)
**Step 3:** Run `npm run lint` (ESLint)
**Step 4:** Fix any issues
**Step 5:** Final commit if needed

---

## Summary

| Original File                      | Lines | Split Into  | Approx Lines Each   |
| ---------------------------------- | ----- | ----------- | ------------------- |
| categoryPercentage.test.ts         | 3233  | 3 + helpers | 1440, 60, 1480      |
| localStorage.test.ts               | 3228  | 4 + helpers | 375, 650, 740, 1410 |
| categoryStatus.test.ts             | 2913  | 4           | 760, 860, 870, 380  |
| Inventory.test.tsx                 | 2115  | 3           | 940, 500, 640       |
| recommendedItemsValidation.test.ts | 2014  | 3 + helpers | 1275, 130, 560      |
| preparedness.test.ts               | 1524  | 2           | 1120, 380           |

**Total: 6 files → 19 files + 3 helper files = 22 files**
