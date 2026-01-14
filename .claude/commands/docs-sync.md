---
description: Validate documentation matches codebase (types, components, design docs)
allowed-tools: Glob, Grep, Read, Edit, Bash(git log:*), Bash(git diff:*)
---

# Documentation Sync Validation

Validate that documentation in `/docs` and `/docs/design-docs/` accurately reflects the current codebase. Prevents outdated documentation that misleads developers.

## Why This Matters

Documentation drift is a common problem. When code changes but docs don't get updated:

- Developers waste time following outdated patterns
- New team members learn incorrect information
- AI assistants make wrong assumptions about the codebase

## Validation Checks

Run each check below and report discrepancies.

### 1. Type Definitions Sync

**Source of Truth:** `src/shared/types/index.ts`
**Documentation:** `docs/DATA_SCHEMA.md`

Verify these match:

- [ ] All TypeScript interfaces documented (`HouseholdConfig`, `InventoryItem`, `UserSettings`, `Category`, `ProductTemplate`, `RecommendedItemDefinition`, `AppData`, etc.)
- [ ] All type unions documented (`Unit`, `ItemStatus`, `StandardCategoryId`, `ProductKind`, `Theme`, `BatteryType`)
- [ ] Constants arrays (`VALID_UNITS`, `VALID_CATEGORIES`, `VALID_THEMES`)
- [ ] Type guards documented (`isFoodItem`, `isPowerItem`, `isFoodCategory`, `isPowerCategory`, etc.)
- [ ] Property names and types match exactly
- [ ] Optional vs required fields match (`?` in code vs "optional" in docs)
- [ ] JSDoc comments for category-specific properties reflected in docs

### 2. Recommended Items Sync

**Source of Truth:** `src/features/templates/data.ts` (or look for `recommendedItems` export)
**Documentation:** `docs/RECOMMENDED_ITEMS.md`

Verify these match:

- [ ] Total count of recommended items
- [ ] Item IDs match between code and docs
- [ ] Categories for each item match
- [ ] Base quantities match
- [ ] Units match
- [ ] Scaling flags (`scaleWithPeople`, `scaleWithDays`) match
- [ ] Calorie/nutrition data matches (for food items)
- [ ] Any new items in code are documented
- [ ] Any removed items are removed from docs

### 3. Categories Sync

**Source of Truth:** `src/features/categories/data.ts` (look for `STANDARD_CATEGORIES`)
**Documentation:** `docs/DATA_SCHEMA.md` (Standard Categories section)

Verify these match:

- [ ] All 9 standard category IDs listed
- [ ] Category names match
- [ ] Category icons match (if documented)
- [ ] Order matches (if relevant)

### 4. Component Architecture Sync

**Source of Truth:** `src/features/` and `src/shared/components/`
**Documentation:** `docs/ARCHITECTURE.md`

Verify these match:

- [ ] Feature slice directories exist (`alerts`, `dashboard`, `household`, `inventory`, `settings`, `onboarding`, `templates`, `categories`, `help`)
- [ ] Components listed in docs exist in codebase
- [ ] Directory structure diagram matches actual structure
- [ ] Hook names match (`useInventory`, `useHousehold`, `useSettings`)
- [ ] Context/Provider names match
- [ ] No phantom components (documented but don't exist)
- [ ] No undocumented major components

### 5. Design Docs Implementation Status

**Location:** `docs/design-docs/`

For each design doc, verify:

- [ ] Features described are actually implemented
- [ ] Code locations referenced in design docs exist
- [ ] If design doc mentions "planned" or "future", check if it's now implemented
- [ ] API/interface contracts in design docs match actual implementation

Design docs to check:

- 001-household-configuration.md
- 002-inventory-management.md
- 003-recommended-items.md
- 004-dashboard-preparedness.md
- 005-alert-system.md
- 006-data-import-export.md
- 007-localstorage-persistence.md
- 008-onboarding-flow.md
- 009-settings-management.md
- 010-product-templates.md
- 011-category-management.md
- 012-status-calculation.md
- 013-internationalization.md

### 6. File References Validation

Check that documentation links point to existing files:

- [ ] `docs/DATA_SCHEMA.md` source of truth path is correct
- [ ] `docs/ARCHITECTURE.md` source of truth paths are correct
- [ ] Any `src/` paths in docs point to existing files
- [ ] Import statements shown in docs would work

### 7. Code Examples Validation

For code examples in documentation:

- [ ] TypeScript interfaces compile (match actual types)
- [ ] Import paths would resolve
- [ ] Function signatures match actual functions
- [ ] Example usage would work with current API

### 8. Git History Analysis

Check git history for documentation drift signals:

**Source vs Docs modification dates:**

```bash
# Check when source files were last modified vs their docs
git log -1 --format="%ci" -- src/shared/types/index.ts
git log -1 --format="%ci" -- docs/DATA_SCHEMA.md
```

Verify:

- [ ] `src/shared/types/index.ts` not modified more recently than `docs/DATA_SCHEMA.md` (or within same commit)
- [ ] `src/features/templates/data.ts` not modified more recently than `docs/RECOMMENDED_ITEMS.md`
- [ ] `src/features/categories/data.ts` not modified more recently than docs mentioning categories
- [ ] `src/features/` structure changes reflected in `docs/ARCHITECTURE.md`

**Recent commits touching source without docs:**

```bash
# Find commits that modified types but not DATA_SCHEMA.md
git log --oneline --since="3 months ago" -- src/shared/types/index.ts
git log --oneline --since="3 months ago" -- docs/DATA_SCHEMA.md
```

Flag commits where:

- [ ] Types file changed but DATA_SCHEMA.md didn't change in same or following commit
- [ ] Recommended items data changed but RECOMMENDED_ITEMS.md wasn't updated
- [ ] New features added to `src/features/` without corresponding design doc updates

**Staleness thresholds:**

- ⚠️ Warning: Doc not updated in 30+ days while source changed
- ❌ Critical: Doc not updated in 90+ days while source changed multiple times

## Output Format

Report results in this format:

```text
Documentation Sync Validation Results
=====================================

1. Type Definitions Sync
   - DATA_SCHEMA.md → src/shared/types/index.ts
   - Status: ✅ In Sync / ⚠️ Discrepancies Found
   - Issues: [list any mismatches]

2. Recommended Items Sync
   - RECOMMENDED_ITEMS.md → src/features/templates/data.ts
   - Status: ✅ In Sync / ⚠️ Discrepancies Found
   - Code count: X items | Docs count: X items
   - Issues: [list any mismatches]

3. Categories Sync
   - Status: ✅ In Sync / ⚠️ Discrepancies Found
   - Issues: [list any mismatches]

4. Component Architecture Sync
   - Status: ✅ In Sync / ⚠️ Discrepancies Found
   - Missing from docs: [components in code but not docs]
   - Phantom in docs: [components in docs but not code]

5. Design Docs Implementation Status
   - [doc-name]: ✅ Implemented / ⚠️ Partially / ❌ Not Implemented
   - Issues: [list any gaps]

6. File References
   - Status: ✅ All Valid / ⚠️ Broken Links Found
   - Broken: [list broken paths]

7. Code Examples
   - Status: ✅ Valid / ⚠️ Issues Found
   - Issues: [list invalid examples]

8. Git History Analysis
   - Status: ✅ In Sync / ⚠️ Drift Detected / ❌ Stale Docs
   - Source files modified after docs:
     - [file]: last source change [date], last doc change [date]
   - Commits needing doc updates: [list commit hashes]

Summary
-------
- Total checks: X
- Passed: X
- Issues: X

Recommended Actions:
1. [Most critical fix]
2. [Second priority]
...
```

## Arguments

- No arguments: Run all checks and report discrepancies
- `quick`: Only run checks 1-3 (types, items, categories)
- `types`: Only check type definitions sync
- `items`: Only check recommended items sync
- `architecture`: Only check component architecture
- `design-docs`: Only check design docs implementation status
- `git`: Only check git history for drift signals
- `fix`: **Run checks AND automatically fix discrepancies** in documentation files

## Fix Mode Behavior

When `fix` argument is provided, after identifying discrepancies:

1. **Automatically update documentation files** using the Edit tool to match the source code
2. **Fix source paths** - Update incorrect `Source of Truth` paths in doc headers
3. **Sync type definitions** - Update interfaces, types, and constants in DATA_SCHEMA.md
4. **Sync recommended items** - Update base quantities, add missing items, fix counts in RECOMMENDED_ITEMS.md
5. **Update architecture docs** - Add missing feature slices, fix directory structures
6. **Report all changes made** with before/after summary

**What fix mode will NOT do:**

- Change source code (only documentation is updated)
- Delete documentation sections (only updates existing content)
- Modify design docs (these are historical records)

## Tips

1. **Start with quick mode** for regular validation during development
2. **Run full validation** before major releases or documentation updates
3. **Use fix mode** to automatically correct documentation drift
4. **Check design docs** when implementing features to ensure alignment
5. **Review changes** after fix mode - verify updates are correct before committing
