# Mutation Testing Improvements Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve mutation test score from 66.5% to 80%+ by strengthening existing tests to catch survived mutants.

**Architecture:** Pure test improvements — no production code changes. Each phase targets files grouped by domain, adding assertions that catch mutant replacements (boundary conditions, return value checks, error paths).

**Tech Stack:** Vitest, Stryker mutation testing, TypeScript

---

## Current State

- **Score:** 66.5% (2084 killed + 5 timeout / 3143 testable)
- **Survived:** 829 mutants across 49 files
- **NoCoverage:** 223 mutants (mostly serviceWorker.ts — excluded from Stryker scope)
- **Target:** 80%+ score (need to kill ~425 more mutants)

## Priority Strategy

Files are prioritized by: (1) lowest kill rate, (2) highest survived count, (3) pure utils before hooks.

**Exclude from scope:**

- `src/shared/utils/test/factories.ts` (32 survived) — test helpers, not production code
- `src/shared/utils/test/faker-helpers.ts` (3 survived) — test helpers
- `src/shared/utils/serviceWorker.ts` (83 NoCoverage) — not in Stryker mutate scope

That removes 35 survived mutants, leaving ~794 to address. Need to kill ~390 of those.

---

## Phase 1: Validation Utils (186 survived, kill rate 38-75%)

These are pure functions with high survived counts — easiest to test thoroughly.

### Task 1.1: recommendedItemsValidation.ts (112 survived, 72.7% kill rate)

**Files:**

- Test: `src/shared/utils/validation/recommendedItemsValidation.test.ts`
- Source: `src/shared/utils/validation/recommendedItemsValidation.ts`

**Key survived mutant patterns:**

- **StringLiteral (66):** Error messages replaced with `""` — tests don't assert on specific error messages
- **ConditionalExpression (25):** Validation branches replaced with `true`/`false` — missing edge case tests
- **BooleanLiteral (7):** Boolean flags replaced — tests don't verify flag behavior
- **EqualityOperator (4):** `>` replaced with `>=` etc. — boundary conditions untested
- **LogicalOperator (3):** `&&` replaced with `||` — compound condition tests needed

**Step 1: Read source file and existing tests**

Read `src/shared/utils/validation/recommendedItemsValidation.ts` and its test file to understand all exported functions and which validations exist.

**Step 2: Add error message assertions**

For every validation function, ensure tests assert the specific error message string returned. Example pattern:

```typescript
expect(result.errors[0].message).toContain('expected specific text');
```

**Step 3: Add boundary condition tests**

For numeric validations (e.g., `caloriesPerUnit > 0`, `requiresWaterLiters >= 0`), test:

- Exactly 0
- Negative values
- Boundary value (e.g., -0.001, 0.001)

**Step 4: Add compound condition tests**

For `&&`/`||` conditions, test each operand independently to ensure both sides matter.

**Step 5: Run mutation tests on this file only**

```bash
npx stryker run --mutate 'src/shared/utils/validation/recommendedItemsValidation.ts'
```

**Step 6: Commit**

```bash
git add src/shared/utils/validation/recommendedItemsValidation.test.ts
git commit -m "test: strengthen recommendedItemsValidation mutation tests"
```

### Task 1.2: unitValidation.ts (8 survived, 38.5% kill rate)

**Files:**

- Test: `src/shared/utils/validation/unitValidation.test.ts`
- Source: `src/shared/utils/validation/unitValidation.ts`

**Step 1:** Read source and tests
**Step 2:** Add assertions for error messages, boundary values, and all validation branches
**Step 3:** Run targeted mutation test: `npx stryker run --mutate 'src/shared/utils/validation/unitValidation.ts'`
**Step 4:** Commit

### Task 1.3: appDataValidation.ts (38 survived, 74.8% kill rate)

**Files:**

- Test: `src/shared/utils/validation/appDataValidation.test.ts`
- Source: `src/shared/utils/validation/appDataValidation.ts`

**Step 1:** Read source and tests
**Step 2:** Focus on ConditionalExpression and StringLiteral mutants — add error message assertions and edge case tests
**Step 3:** Run targeted mutation test
**Step 4:** Commit

### Task 1.4: categoryValidation.ts (36 survived, 71.9% kill rate)

**Files:**

- Test: `src/shared/utils/validation/categoryValidation.test.ts`
- Source: `src/shared/utils/validation/categoryValidation.ts`

**Step 1:** Read source and tests
**Step 2:** Add assertions for all validation error messages and boundary conditions
**Step 3:** Run targeted mutation test
**Step 4:** Commit

---

## Phase 2: Error Logger & Storage (49 survived, kill rate 46-53%)

### Task 2.1: errorLogger/storage.ts (35 survived, 46.2% kill rate)

**Files:**

- Test: `src/shared/utils/errorLogger/storage.test.ts`
- Source: `src/shared/utils/errorLogger/storage.ts`

**Key patterns:** ConditionalExpression, BlockStatement (empty block replacements), StringLiteral

**Step 1:** Read source and tests
**Step 2:** Add tests for error paths, storage full scenarios, and log rotation behavior
**Step 3:** Assert on specific stored values and error messages
**Step 4:** Run targeted mutation test, commit

### Task 2.2: errorLogger/logger.ts (14 survived, 53.3% kill rate)

**Files:**

- Test: `src/shared/utils/errorLogger/logger.test.ts`
- Source: `src/shared/utils/errorLogger/logger.ts`

**Step 1:** Read source and tests
**Step 2:** Add tests for log level filtering, message formatting, ID generation
**Step 3:** Run targeted mutation test, commit

### Task 2.3: errorLogger/export.ts (6 survived, 33.3% kill rate)

**Files:**

- Test: `src/shared/utils/errorLogger/export.test.ts`
- Source: `src/shared/utils/errorLogger/export.ts`

**Step 1:** Read source and tests
**Step 2:** Add tests for export formatting and edge cases
**Step 3:** Run targeted mutation test, commit

---

## Phase 3: Calculation Utils (102 survived, kill rate 63-79%)

### Task 3.1: categoryPercentage.ts (61 survived, 71.0% kill rate)

**Files:**

- Test: `src/shared/utils/calculations/categoryPercentage.test.ts`
- Source: `src/shared/utils/calculations/categoryPercentage.ts`

**Step 1:** Read source and tests
**Step 2:** Add boundary condition tests for percentage calculations — zero items, 100% fulfilled, partial fulfillment at boundaries
**Step 3:** Test that different categories produce different results (not just truthy checks)
**Step 4:** Run targeted mutation test, commit

### Task 3.2: water.ts (20 survived, 77.5% kill rate)

**Files:**

- Test: `src/shared/utils/calculations/water.test.ts`
- Source: `src/shared/utils/calculations/water.ts`

**Step 1:** Read source and tests
**Step 2:** Add tests for: items with `requiresWaterLiters >= 0` boundary, custom vs template items, freezer water logic
**Step 3:** Run targeted mutation test, commit

### Task 3.3: strategies/food.ts (15 survived, 72.7% kill rate)

**Files:**

- Test: `src/shared/utils/calculations/strategies/food.test.ts`
- Source: `src/shared/utils/calculations/strategies/food.ts`

**Step 1:** Read source and tests
**Step 2:** Add tests for: calorie-per-unit null checks, food vs non-food item handling, compound condition testing
**Step 3:** Run targeted mutation test, commit

### Task 3.4: recommendedQuantity.ts (7 survived, 65.0% kill rate)

Test: `src/shared/utils/calculations/recommendedQuantity.test.ts`

### Task 3.5: itemStatus.ts (7 survived, 85.7% kill rate)

Test: `src/shared/utils/calculations/itemStatus.test.ts`

### Task 3.6: strategies/water.ts (7 survived, 80.6% kill rate)

Test: `src/shared/utils/calculations/strategies/water.test.ts`

_Tasks 3.4-3.6: Same pattern — read, add boundary/edge case tests, run targeted mutation test, commit._

---

## Phase 4: Dashboard Utils (89 survived, kill rate 59-68%)

### Task 4.1: categoryStatus.ts (61 survived, 59.1% kill rate)

**Files:**

- Test: `src/features/dashboard/utils/categoryStatus.test.ts`
- Source: `src/features/dashboard/utils/categoryStatus.ts`

**Key patterns:** ConditionalExpression (31), EqualityOperator (11), BlockStatement (4)

**Step 1:** Read source and tests
**Step 2:** Add tests for: category ID type checking, quantity boundary conditions (0, negative, exact match), disabled item filtering
**Step 3:** Assert specific return values rather than just truthiness
**Step 4:** Run targeted mutation test, commit

### Task 4.2: preparedness.ts (28 survived, 67.8% kill rate)

**Files:**

- Test: `src/features/dashboard/utils/preparedness.test.ts`
- Source: `src/features/dashboard/utils/preparedness.ts`

**Step 1:** Read source and tests
**Step 2:** Add tests for: empty category statuses, totalNeeded boundary, freezer settings, recommended item filtering
**Step 3:** Run targeted mutation test, commit

---

## Phase 5: Feature Utils (95 survived, kill rate 62-77%)

### Task 5.1: localStorage.ts (81 survived, 68.2% kill rate)

**Files:**

- Test: `src/shared/utils/storage/localStorage.test.ts`
- Source: `src/shared/utils/storage/localStorage.ts`

**Key patterns:** ConditionalExpression (39), LogicalOperator (13), BlockStatement (12)

**Step 1:** Read source and tests
**Step 2:** Focus on import/export paths — test section selection logic, custom categories handling, data validation during import
**Step 3:** Test error recovery paths (corrupted data, missing fields)
**Step 4:** Run targeted mutation test, commit

### Task 5.2: inventory/utils/status.ts (31 survived, 76.5% kill rate)

**Files:**

- Test: `src/features/inventory/utils/status.test.ts`
- Source: `src/features/inventory/utils/status.ts`

**Step 1:** Read source and tests
**Step 2:** Add tests for: expiration boundary (exactly 0 days, exactly threshold), quantity ratio boundary, neverExpires flag
**Step 3:** Run targeted mutation test, commit

### Task 5.3: alerts/utils/alerts.ts (28 survived, 68.5% kill rate)

**Files:**

- Test: `src/features/alerts/utils/alerts.test.ts`
- Source: `src/features/alerts/utils/alerts.ts`

**Step 1:** Read source and tests
**Step 2:** Add tests for: custom vs template items, alert message content, alert priority ordering
**Step 3:** Run targeted mutation test, commit

### Task 5.4: generateExampleInventory.ts (36 survived, 62.1% kill rate)

**Files:**

- Test: `src/features/onboarding/utils/generateExampleInventory.test.ts`
- Source: `src/features/onboarding/utils/generateExampleInventory.ts`

**Step 1:** Read source and tests
**Step 2:** Add tests for: generated item properties, quantity calculations, category coverage
**Step 3:** Run targeted mutation test, commit

---

## Phase 6: Hooks (74 survived, kill rate 33-80%)

### Task 6.1: useShoppingListExport.ts (34 survived, 33.3% kill rate)

**Files:**

- Test: Create `src/features/settings/hooks/useShoppingListExport.test.ts` (if not exists)
- Source: `src/features/settings/hooks/useShoppingListExport.ts`

**Step 1:** Read source and check for existing tests
**Step 2:** Add comprehensive hook tests using renderHook — test export formatting, section generation, quantity calculations
**Step 3:** Run targeted mutation test, commit

### Task 6.2: useKeyboardNavigation.ts (16 survived, 75.4% kill rate)

Test: `src/shared/hooks/useKeyboardNavigation.test.tsx`

### Task 6.3: useDashboardAlerts.ts (14 survived, 80.6% kill rate)

Test: `src/features/dashboard/hooks/useDashboardAlerts.test.ts`

### Task 6.4: useBackupTracking.ts (13 survived, 70.5% kill rate)

Test: `src/features/dashboard/hooks/useBackupTracking.test.ts`

_Tasks 6.2-6.4: Same pattern — read, strengthen assertions, add edge cases, run targeted mutation test, commit._

---

## Phase 7: Remaining Small Files (~65 survived)

### Task 7.1: Batch small files (1-6 survived each)

Handle remaining files with <7 survived mutants in a single pass:

- `src/shared/utils/calculations/strategies/common.ts` (6)
- `src/shared/utils/urlLanguage.ts` (6)
- `src/features/household/utils/calculations.ts` (6)
- `src/shared/utils/analytics/tracking.ts` (4)
- `src/shared/utils/analytics/storage.ts` (4)
- `src/shared/utils/calculations/calories.ts` (4)
- `src/shared/utils/calculations/itemRecommendedQuantity.ts` (4)
- `src/shared/utils/formatting/baseQuantity.ts` (4)
- `src/features/inventory/hooks/useLocationSuggestions.ts` (4)
- `src/shared/hooks/useLocalStorageSync.ts` (5)
- `src/shared/hooks/useImportData.ts` (5)
- `src/shared/utils/calculations/itemMatching.ts` (5)
- And remaining files with 1-3 survived mutants

For each: read source + test, add targeted assertions, commit.

---

## Verification

After all phases, run full mutation test suite:

```bash
npm run test:mutation
```

**Target:** 80%+ mutation score (from 66.5%)

---

## Estimated Impact

| Phase            | Survived | Est. Kills | Notes                                           |
| ---------------- | -------- | ---------- | ----------------------------------------------- |
| 1. Validation    | 186      | ~130       | Highest ROI — pure functions, string assertions |
| 2. Error Logger  | 49       | ~30        | Low kill rate, needs error path tests           |
| 3. Calculations  | 102      | ~60        | Boundary conditions focus                       |
| 4. Dashboard     | 89       | ~55        | Return value assertions                         |
| 5. Feature Utils | 176      | ~100       | Mixed — localStorage is complex                 |
| 6. Hooks         | 74       | ~40        | Harder to test, lower expected gains            |
| 7. Small files   | ~65      | ~40        | Quick wins, 1-6 each                            |
| **Total**        | **~794** | **~455**   | **Target: 80%+ score**                          |
