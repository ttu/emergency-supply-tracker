# Design v2 — closing the five parity gaps with v1

Implementation plan. Each feature below is self-contained: read the shared
context once, then a feature section, and you have everything needed to build
it without re-deriving the audit.

- **Branch:** `design-update` (PR #279, based on `origin/main`)
- **Audit date:** 2026-07-31
- **Evidence screenshots:** `verification-sessions/v1-v2-parity/` (gitignored)

---

## Shared context

### What v2 is

`design-update` replaces the classic (v1) app shell with a themed v2 shell for
three themes — `cockpit`, `civil`, `pantry`. `App.tsx` picks the shell with
`isDesignV2Theme(settings.theme)`; the eight classic themes still render the v1
shell, so **both surfaces ship simultaneously** and must both keep working.

v2 navigation is deliberately four destinations — Overview, Inventory, Help,
Settings — matching v1. Alerts live on the dashboard as a banner; the shopping
list is an export under Settings → Data & backup.

### Where things live

| Concern           | v1                                                   | v2                                               |
| ----------------- | ---------------------------------------------------- | ------------------------------------------------ |
| Shell             | `src/App.tsx` + `shared/components/Navigation`       | `shared/components/design-v2/Shell.tsx`          |
| Router            | `App.tsx` `renderPage()`                             | `features/design/DesignApp.tsx`                  |
| Inventory page    | `features/inventory/pages/Inventory.tsx`             | `features/inventory/components/v2/Inventory.tsx` |
| Inventory filters | `features/inventory/components/FilterBar.tsx`        | `.../v2/InventoryFilterStrip.tsx`                |
| Item rows         | `.../components/ItemList.tsx`                        | `.../v2/InventoryTable.tsx` + `InventoryRow.tsx` |
| Item add/edit     | `.../pages/Inventory.tsx` modal + `ItemForm`         | `.../v2/ItemDetail.tsx` + shared `ItemForm`      |
| Category summary  | `.../components/CategoryStatusSummary.tsx`           | _(no equivalent)_                                |
| Template picker   | `features/templates/components/TemplateSelector.tsx` | _(no equivalent)_                                |
| Data for v2 views | —                                                    | `shared/hooks/useDesignData.ts`                  |

`ItemForm` (`features/inventory/components/ItemForm.tsx`) is **shared** by both
designs. Changing it affects v1 — run both suites.

### The root cause behind gaps 1 and 5

`shared/hooks/useDesignData.ts` builds its rows as:

```ts
const rows: DesignItemRow[] = items.map((item) => { ... });
```

Only **owned** items. Recommended items the household does not yet have never
enter any v2 view. v1 instead derives shortages from the recommendation set, so
it can show what is missing.

### Conventions (read before committing)

- **Commits:** `type: description`, no scopes (AGENTS.md). Types: `feat`, `fix`,
  `refactor`, `test`, `docs`, `style`, `chore`, `ci`, `build`, `perf`. No
  `Co-Authored-By` / `Generated-with` trailers.
- **TDD:** tests first (AGENTS.local.md).
- **Never** `git commit --no-verify`.
- **i18n:** every v2 string goes through `t('v2.…')` with per-theme variants
  `{ cockpit, civil, pantry }`, in **both** `public/locales/en/common.json` and
  `fi/common.json`. Verify with `npm run validate:i18n`.
- **Testing diamond:** 70% integration, 20% E2E, 10% unit.
- Storybook stories for presentational components.

### Running things

```bash
# Unit/lint/type/build. The thread cap avoids timeout flakes under load.
VITEST_MAX_THREADS=2 VITEST_MIN_THREADS=1 npm run validate

# E2E. Port 5199 avoids a collision with another project on 5173, and
# playwright.config uses reuseExistingServer, which silently attaches to
# whatever is on 5173.
npm run dev -- --port 5199 --strictPort &
PLAYWRIGHT_BASE_URL=http://localhost:5199 ./node_modules/.bin/playwright test --project=chromium --workers=2
PLAYWRIGHT_BASE_URL=http://localhost:5199 RUN_A11Y_TESTS=1 ./node_modules/.bin/playwright test --project=chromium --workers=2
PLAYWRIGHT_BASE_URL=http://localhost:5199 RUN_VISUAL_TESTS=1 ./node_modules/.bin/playwright test --project=chromium --workers=2
```

Invoke playwright as `./node_modules/.bin/playwright` — a shell hook rewrites
bare `npx playwright` and swallows the reporter output.

**Visual baselines** will need regenerating for any inventory/dashboard change:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:5199 RUN_VISUAL_TESTS=1 \
  ./node_modules/.bin/playwright test --project=chromium --update-snapshots   # darwin
npm run test:e2e:visual:docker:update                                          # linux/CI
npm install   # ⚠ REQUIRED after the docker run — it overwrites node_modules
              #   with Linux binaries and Vite will not start until you do
```

### Gotchas that cost time already

- In **unit** tests the translator returns the key, so accessible names are
  i18n keys (`v2.voice.addItem.cockpit`). In **E2E** they are real strings, and
  CSS `text-transform: uppercase` means the _rendered_ text is uppercase while
  the _accessible name_ is not — `getByRole('button', { name: 'Save' })`, not
  `'SAVE'`.
- `createMockAppData` randomises the household (adults/children/days), so
  never assert on absolute recommended quantities.
- Item factories default `itemType` to a random word. Category coverage matches
  on `itemMatchesRecommendedId`, so use real ids
  (`createProductTemplateId('bottled-water')`) or every category reads 0%.
- Playwright assertions auto-wait — do not add `waitForTimeout`; SonarQube
  flags fixed waits.
- `expirationDate` is required in `ItemForm` unless "Never Expires" is ticked.

---

## Gap 1 — Recommended items are undiscoverable _(blocker)_

### What v1 does

Selecting a category on the inventory page renders `CategoryStatusSummary`,
which shows `RECOMMENDED:` and a **"Show {{count}} recommended items"** toggle
(`inventory.showRecommended`) listing what the household is short of, each with
an add affordance. Screenshot: `v1-inventory-category.png`.

### What v2 does

Nothing. `useDesignData` maps owned items only. After v2 onboarding the
inventory is empty (step 5 toggles _categories_, not items — see
`OnboardStep05Items.tsx`), so a new user has no route to the 81-item baseline
that is the app's core value.

### Build

1. Extend `useDesignData` (or add a sibling hook, e.g.
   `useMissingRecommendedItems`) that returns recommended items with
   `calculateRecommendedQuantity(...) > 0` for the household which have **no
   matching owned item**. Reuse:
   - `calculateRecommendedQuantity` — `shared/utils/calculations/recommendedQuantity`
   - `itemMatchesRecommendedId` / `findMatchingItemsByType` — `shared/utils/calculations/itemMatching`
   - filter out `disabledRecommendedItems` (from `useInventory`)
2. Surface them in v2 Inventory as a distinct section or filter — suggested: a
   `MISSING` / "Not stocked" chip in `InventoryFilterStrip` alongside
   ALL/CRIT/WARN/OK/EXP, rendering rows with the recommended quantity as the
   target and an **Add** action.
3. Adding pre-fills from the template (see Gap 2) and lands in `ItemDetail`.
4. Mirror in `MobileInventory`.

### Acceptance

- A household with an empty inventory can find and add recommended items.
- Disabled recommendations and zero-quantity items (e.g. pet items with
  `pets: 0`) are excluded.
- Adding one makes it disappear from the missing list and appear as a normal row.

### Tests

- Unit: the missing-items selector — excludes owned, excludes disabled,
  excludes zero-quantity, scales with household.
- Integration: `Inventory` + `MobileInventory` render missing items and fire add.
- E2E in `e2e/v2-actions.spec.ts`: empty inventory → add a recommended item →
  it persists.

---

## Gap 2 — No template-based item creation _(blocker)_

### What v1 does

"Add Item" opens a modal with `TemplateSelector` (`inventory.selectTemplate`)
listing applicable recommended products plus custom templates; picking one
pre-fills unit, weight, calories and default expiry. "Custom item" opens the
blank form.

```ts
export interface TemplateSelectorProps {
  templates: RecommendedItemDefinition[];
  categories: Category[];
  onSelectTemplate: (template: RecommendedItemDefinition) => void;
  onSelectCustom: () => void;
  initialCategoryId?: string;
  customTemplates?: ProductTemplate[];
  onSelectCustomTemplate?: (template: ProductTemplate) => void;
}
```

v1 computes `applicableRecommendedItems` by filtering
`calculateRecommendedQuantity(item, household, childrenMultiplier) > 0`
(`Inventory.tsx` ~line 190) and handles selection in `handleSelectTemplate`
(~line 401) — reuse that logic rather than reinventing it.

### What v2 does

`+ ADD` goes straight to `ItemDetail` with `NEW_ITEM_ID` and a blank `ItemForm`.
`TemplateSelector` appears nowhere under `components/v2/`.

### Build

Insert a template-choice step before the blank form. Either wrap the existing
`TemplateSelector` in a v2 panel (as `InventorySetsSection` wraps the classic
inventory-sets component, using `className="design-v2-embed"` for token
inheritance), or build a v2-native picker. Wrapping is cheaper and keeps one
source of truth.

`ItemForm` already accepts `templateWeightGramsPerUnit`,
`templateCaloriesPer100g`, `templateRequiresWaterLiters` — feed these from the
chosen template so the pre-fill works.

### Acceptance

- `+ ADD` offers the recommended products and a "custom item" escape hatch.
- Choosing a template pre-fills type, unit, weight, calories and default expiry.
- Custom items still work exactly as now.
- Works on mobile (`MobileItemDetail`).

### Tests

- Integration: picking a template pre-fills; picking custom does not.
- E2E: add via template, assert stored `itemType` is the template id.

---

## Gap 3 — No sorting

v1 `FilterBar` exposes `sortBy: SortBy` where
`export type SortBy = 'name' | 'quantity' | 'expiration'`
(`FilterBar.tsx:12`), labels `inventory.sort.*`.

v2's `InventoryFilterStrip` has no sort control (grep for `sort` returns
nothing across `Inventory.tsx`, `InventoryFilterStrip.tsx`, `InventoryTable.tsx`).

**Build:** add a sort control to `InventoryFilterStrip`, sort in `Inventory`
before rendering `InventoryTable`, mirror in `MobileInventory`. Reuse the `SortBy`
type exported from `FilterBar` — main's #281 deliberately made that the single
export; do not redeclare it. Consider making the table headers clickable, which
suits the v2 table better than a dropdown.

**i18n:** reuse `inventory.sort.*` or add `v2.inventory.sort*` per-theme keys.

**Tests:** integration for each sort key incl. items without expiry; E2E asserting
row order.

---

## Gap 4 — No location filter

v1 `FilterBar` has `locationFilter` + `locations: string[]`, populated from the
distinct locations across items. v2 offers status + category + search only.

**Build:** derive the distinct location list (see `useLocationSuggestions`,
`features/inventory/hooks/useLocationSuggestions.ts`), add a select to
`InventoryFilterStrip`, apply in `Inventory` and `MobileInventory`.

**Note:** the v2 table already has a `LOC` column, so this completes an
existing affordance rather than adding a new concept.

**Tests:** integration (filter narrows; "all" restores); E2E.

---

## Gap 5 — No per-category requirement breakdown

### What v1 does

`CategoryStatusSummary` shows, for the selected category: status pill, progress
(`6 / 80 liters`), a requirement breakdown (`Water for people: 60 liters`,
`Total required: 80 liters`), per-item shortfall (`54 liters missing`) and a
**Disable Category** action. It takes:

```ts
export interface CategoryShortage {
  itemId: string;
  itemName: string;
  actual: number;
  needed: number;
  unit: Unit;
  missing: number;
}
export interface CategoryStatusSummaryProps {
  categoryId: string;
  status: ItemStatus;
  completionPercentage: number;
  totalActual: number;
  totalNeeded: number;
  primaryUnit?: string;
  shortages?: CategoryShortage[];
  totalActualCalories?: number;
  totalNeededCalories?: number;
  missingCalories?: number;
  drinkingWaterNeeded?: number;
  preparationWaterNeeded?: number;
}
```

Shortages come from `useCategoryStatuses` →
`calculateAllCategoryStatuses` (`features/dashboard/utils`).

### What v2 does

`CoverageMatrix` shows `ok/total` and a status bar; the table's Qty/Rec columns
give the numbers but not the derivation, and there is no per-item "missing"
readout.

**Build:** when a category filter is active in v2 Inventory, render a v2-styled
summary panel above the table fed by `useCategoryStatuses`. Category
enable/disable already lives in Settings §8 — do **not** duplicate it here.

**Tests:** integration (panel appears only with a category selected; totals and
shortages render; food shows calories, water shows the drink/prep split).

---

## Suggested order

1. **Gap 1** — the missing-items selector is the foundation.
2. **Gap 2** — template add; consumes Gap 1's applicable-template logic.
3. **Gap 5** — category summary; also derives from recommendations.
4. **Gaps 3 and 4** — filter-strip work, naturally one commit each.

Each gap is its own commit (or a small series). Keep every commit green.

## Definition of done (all five)

- [ ] `VITEST_MAX_THREADS=2 npm run validate` passes
- [ ] `npm run validate:i18n` passes (EN + FI)
- [ ] E2E, a11y and visual suites pass; baselines regenerated for both platforms
      (then `npm install` after the docker run)
- [ ] `npm run test:storybook` passes
- [ ] Codecov patch coverage ≥ 80%
- [ ] v1 shell still works — it ships alongside v2
- [ ] `docs/V2_RELEASE_TODO.md` updated
