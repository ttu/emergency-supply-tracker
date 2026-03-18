# Mutation Testing: Kill Surviving Mutants Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kill surviving mutants to improve mutation testing score from 86.2% toward 90%+

**Architecture:** Add targeted tests to existing `.mutations.test.ts` files (or create new ones). Each test targets a specific surviving mutant by testing the exact behavior that would change if the mutation were applied.

**Tech Stack:** Vitest, TypeScript, React Testing Library (for hooks)

**Issue:** #271

---

## Strategy

### Mutation Types & How to Kill Them

| Mutation Type         | What It Does                              | How to Kill                                  |
| --------------------- | ----------------------------------------- | -------------------------------------------- |
| ConditionalExpression | Replaces condition with `true`/`false`    | Test both branches of the conditional        |
| EqualityOperator      | Changes `<` to `<=`, `===` to `!==`, etc. | Test boundary values (exact threshold)       |
| ArithmeticOperator    | Changes `*` to `/`, `+` to `-`, etc.      | Verify exact calculation results             |
| BlockStatement        | Removes block body `{}`                   | Verify side effects actually happen          |
| LogicalOperator       | Changes `&&` to `\|\|`, `!` removal       | Test each condition independently            |
| StringLiteral         | Replaces strings with `""`                | Assert exact string values                   |
| ArrayDeclaration      | Replaces `[]` with `["Stryker was here"]` | Assert array length/emptiness                |
| ObjectLiteral         | Replaces `{}` with empty                  | Assert object properties exist               |
| MethodExpression      | Removes method call (e.g., `.filter`)     | Assert filtered vs unfiltered results differ |
| BooleanLiteral        | Flips `true`/`false`                      | Assert exact boolean value                   |

### File Priority (by survivor count)

Files are grouped into 6 parallel batches for subagent execution:

---

## Batch 1: Storage & Validation (high-impact)

### Task 1: localStorage.ts (32 survivors)

**Files:**

- Source: `src/shared/utils/storage/localStorage.ts`
- Test: `src/shared/utils/storage/localStorage.mutations.test.ts`

Surviving mutants target:

- L289, L501, L516, L525, L562: BlockStatement `{}` - verify side effects in catch/error blocks
- L289, L400, L295, L428, L426 + 15 more: ConditionalExpression - test both branches
- L650, L850, L858, L873: StringLiteral - assert exact string content
- L1003: LogicalOperator - test `!exportedSet && setSelection.index < 0` independently
- L1005: EqualityOperator - test boundary `setSelection.index >= importData.inventorySets.length`

- [ ] **Step 1:** Read source file at mutant lines and existing mutation tests
- [ ] **Step 2:** Write new test cases targeting each surviving mutant
- [ ] **Step 3:** Run `npx vitest run src/shared/utils/storage/localStorage.mutations.test.ts` to verify tests pass
- [ ] **Step 4:** Commit: `test: kill surviving mutants in localStorage.ts`

### Task 2: unitValidation.ts (8 survivors) + appDataValidation.ts (6 survivors)

**Files:**

- Source: `src/shared/utils/validation/unitValidation.ts`, `src/shared/utils/validation/appDataValidation.ts`
- Test: `src/shared/utils/validation/unitValidation.mutations.test.ts`, `src/shared/utils/validation/appDataValidation.mutations.test.ts`

- [ ] **Step 1:** Read source files at mutant lines and existing mutation tests
- [ ] **Step 2:** Write tests for unitValidation L22 (5 ConditionalExpression, 2 LogicalOperator, 1 BlockStatement)
- [ ] **Step 3:** Write tests for appDataValidation L39-L58 (6 ConditionalExpression)
- [ ] **Step 4:** Run tests to verify they pass
- [ ] **Step 5:** Commit: `test: kill surviving mutants in validation utils`

---

## Batch 2: Dashboard Utils (high-impact)

### Task 3: categoryStatus.ts (31 survivors)

**Files:**

- Source: `src/features/dashboard/utils/categoryStatus.ts`
- Test: `src/features/dashboard/utils/categoryStatus.mutations.test.ts`

Surviving mutants target:

- L80: MethodExpression - `items.filter` replaced with `items` (no filtering)
- L84, L87: typeof checks replaced with true/false and negated
- L96: ArithmeticOperator - `adults * MULTIPLIER` changed to `/`
- L220: EqualityOperator - `recommendedQuantity > 0` boundary
- L317: ArithmeticOperator/MethodExpression - calorie subtraction
- L403: ArrayDeclaration `["Stryker was here"]`
- L439: EqualityOperator - `shortageInfo.totalNeeded > 0` boundary
- L469: BlockStatement/BooleanLiteral - isFood handling
- L132, L469: BlockStatement - empty block removal

- [ ] **Step 1:** Read source file at mutant lines and existing mutation tests
- [ ] **Step 2:** Write new test cases targeting each surviving mutant
- [ ] **Step 3:** Run tests to verify they pass
- [ ] **Step 4:** Commit: `test: kill surviving mutants in categoryStatus.ts`

### Task 4: preparedness.ts (12 survivors)

**Files:**

- Source: `src/features/dashboard/utils/preparedness.ts`
- Test: `src/features/dashboard/utils/preparedness.mutations.test.ts`

Surviving mutants target:

- L29, L71: BlockStatement/ConditionalExpression - empty block and false replacement
- L141: MethodExpression - items filter removal
- L144, L147: typeof checks for categoryId and item.category

- [ ] **Step 1:** Read source file at mutant lines and existing mutation tests
- [ ] **Step 2:** Write new test cases
- [ ] **Step 3:** Run tests to verify they pass
- [ ] **Step 4:** Commit: `test: kill surviving mutants in preparedness.ts`

---

## Batch 3: Calculations (high-impact)

### Task 5: categoryPercentage.ts (21 survivors)

**Files:**

- Source: `src/shared/utils/calculations/categoryPercentage.ts`
- Test: `src/shared/utils/calculations/categoryPercentage.mutations.test.ts` or `categoryPercentage.mutations2.test.ts`

Surviving mutants target:

- L86: ArrayDeclaration `["Stryker was here"]`
- L99, L102: typeof checks and ConditionalExpression
- L111: ArithmeticOperator `adults * MULTIPLIER` → `/`
- L199: LogicalOperator and BlockStatement for food calorie check
- L309: ArithmeticOperator for pets multiplier
- L379: LogicalOperator for caloriesPerUnit null check

- [ ] **Step 1:** Read source file and existing mutation tests
- [ ] **Step 2:** Write new test cases
- [ ] **Step 3:** Run tests to verify they pass
- [ ] **Step 4:** Commit: `test: kill surviving mutants in categoryPercentage.ts`

### Task 6: water.ts (8 survivors) + calories.ts (3 survivors) + itemStatus.ts (3 survivors)

**Files:**

- Source: `src/shared/utils/calculations/water.ts`, `calories.ts`, `itemStatus.ts`
- Test: corresponding `.mutations.test.ts` files

- [ ] **Step 1:** Read source files and existing mutation tests
- [ ] **Step 2:** Write tests for water.ts (L78 LogicalOperator, L84 EqualityOperator, L117 ConditionalExpression, L181 ArithmeticOperator)
- [ ] **Step 3:** Write tests for calories.ts (L46 EqualityOperator, L93 ConditionalExpression/BlockStatement)
- [ ] **Step 4:** Write tests for itemStatus.ts (L29 ArithmeticOperator, L79 ConditionalExpression/LogicalOperator)
- [ ] **Step 5:** Run tests to verify they pass
- [ ] **Step 6:** Commit: `test: kill surviving mutants in calculation utils`

---

## Batch 4: Inventory & Alerts

### Task 7: status.ts (21 survivors)

**Files:**

- Source: `src/features/inventory/utils/status.ts`
- Test: `src/features/inventory/utils/status.mutations.test.ts`

Surviving mutants target:

- L29: ArithmeticOperator `month + 1`
- L79: ConditionalExpression/LogicalOperator - neverExpires check
- L202, L204, L208, L248: ConditionalExpression/LogicalOperator/EqualityOperator
- L260, L292, L295: BlockStatement/EqualityOperator

- [ ] **Step 1:** Read source file and existing mutation tests
- [ ] **Step 2:** Write new test cases
- [ ] **Step 3:** Run tests to verify they pass
- [ ] **Step 4:** Commit: `test: kill surviving mutants in inventory status.ts`

### Task 8: alerts.ts (11 survivors)

**Files:**

- Source: `src/features/alerts/utils/alerts.ts`
- Test: `src/features/alerts/utils/alerts.mutations.test.ts`

Surviving mutants target:

- L34: ConditionalExpression/LogicalOperator - templateId and CUSTOM_ITEM_TYPE checks
- L62: ConditionalExpression/LogicalOperator/BlockStatement - neverExpires check
- L204: ConditionalExpression/BlockStatement
- L237-L238: LogicalOperator/EqualityOperator - water requirements check

- [ ] **Step 1:** Read source file and existing mutation tests
- [ ] **Step 2:** Write new test cases
- [ ] **Step 3:** Run tests to verify they pass
- [ ] **Step 4:** Commit: `test: kill surviving mutants in alerts.ts`

---

## Batch 5: Remaining Utils

### Task 9: generateExampleInventory.ts (15 survivors) + errorLogger/storage.ts (9 survivors)

**Files:**

- Source: `src/features/onboarding/utils/generateExampleInventory.ts`, `src/shared/utils/errorLogger/storage.ts`
- Test: corresponding `.mutations.test.ts` files

- [ ] **Step 1:** Read source files and existing mutation tests
- [ ] **Step 2:** Write tests for generateExampleInventory (ArithmeticOperator, EqualityOperator, ConditionalExpression, BlockStatement, Regex)
- [ ] **Step 3:** Write tests for errorLogger/storage (ConditionalExpression, LogicalOperator, StringLiteral, MethodExpression, EqualityOperator)
- [ ] **Step 4:** Run tests to verify they pass
- [ ] **Step 5:** Commit: `test: kill surviving mutants in onboarding and error logger`

### Task 10: migrations.ts (5) + urlLanguage.ts (6) + recommendedItemsValidation.ts (8)

**Files:**

- Source: `src/shared/utils/storage/migrations.ts`, `src/shared/utils/urlLanguage.ts`, `src/shared/utils/validation/recommendedItemsValidation.ts`
- Test: corresponding `.mutations.test.ts` files

- [ ] **Step 1:** Read source files and existing mutation tests
- [ ] **Step 2:** Write tests for migrations (L112-L114 EqualityOperator boundary, L134/L251 ConditionalExpression)
- [ ] **Step 3:** Write tests for urlLanguage (L36/L42/L44 ConditionalExpression, L42 EqualityOperator, L93 StringLiteral)
- [ ] **Step 4:** Write tests for recommendedItemsValidation (ConditionalExpression, StringLiteral)
- [ ] **Step 5:** Run tests to verify they pass
- [ ] **Step 6:** Commit: `test: kill surviving mutants in migrations, urlLanguage, recommendedItemsValidation`

---

## Batch 6: Hooks & Small Files

### Task 11: Hooks (useKeyboardNavigation 5, useImportData 5, useLocationSuggestions 4, useCategoryStatuses 3)

**Files:**

- Source: various hook files
- Test: corresponding `.mutations.test.ts(x)` files

- [ ] **Step 1:** Read source files and existing mutation tests
- [ ] **Step 2:** Write tests for each hook targeting surviving mutants
- [ ] **Step 3:** Run tests to verify they pass
- [ ] **Step 4:** Commit: `test: kill surviving mutants in hooks`

### Task 12: Small files (remaining ~30 survivors across 15+ files)

**Files:** Various files with 1-4 survivors each:

- `src/shared/utils/calculations/strategies/food.ts` (5)
- `src/shared/utils/formatting/baseQuantity.ts` (4)
- `src/shared/utils/calculations/strategies/water.ts` (4)
- `src/shared/utils/storage/storageUsage.ts` (3)
- `src/features/household/utils/calculations.ts` (3)
- `src/shared/utils/calculations/recommendedQuantity.ts` (3)
- `src/features/settings/hooks/useShoppingListExport.ts` (3)
- `src/features/dashboard/hooks/useDashboardAlerts.ts` (2)
- `src/shared/utils/analytics/storage.ts` (2)
- `src/features/dashboard/hooks/useBackupTracking.ts` (2)
- `src/shared/utils/validation/categoryValidation.ts` (2)
- `src/shared/utils/calculations/itemMatching.ts` (2)
- `src/shared/utils/calculations/strategies/communication.ts` (2)
- `src/features/dashboard/hooks/useSeenNotifications.ts` (1)
- `src/shared/hooks/useLocalStorageSync.ts` (1)
- `src/features/dashboard/utils/backupReminder.ts` (1)
- `src/shared/utils/errorLogger/export.ts` (1)
- `src/shared/utils/calculations/strategies/common.ts` (1)
- `src/shared/utils/kitMeta.ts` (1)
- `src/shared/hooks/useDataValidation.ts` (1)

- [ ] **Step 1:** Read each source file at mutant lines and existing mutation tests
- [ ] **Step 2:** Write tests for each file targeting surviving mutants
- [ ] **Step 3:** Run tests to verify they pass
- [ ] **Step 4:** Commit: `test: kill surviving mutants in remaining small files`

---

## Final Verification

### Task 13: Full test suite verification

- [ ] **Step 1:** Run `npm run test` to verify all tests pass
- [ ] **Step 2:** Run `npm run type-check` to verify no type errors
- [ ] **Step 3:** Run `npm run lint` to verify no lint errors
- [ ] **Step 4:** Stage all changes with `git add -A`
