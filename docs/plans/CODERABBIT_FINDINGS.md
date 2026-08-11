# CodeRabbit findings — design-update, last 6 days

- **Range reviewed:** `db6b6451..202736b3` (50 commits, 413 changed files)
- **Tool:** `coderabbit review --agent --committed --base-commit db6b6451 --dir <chunk>` (CLI 0.7.2)
- **Why chunked:** the range exceeds CodeRabbit's 150-file cap, so it was split per directory; the free tier also rate-limits after a few chunks.

## Summary

| Severity  | Count  |
| --------- | ------ |
| major     | 39     |
| minor     | 43     |
| **total** | **82** |

### Coverage per chunk

| Chunk                     | Files reviewed | Findings |
| ------------------------- | -------------- | -------- |
| `.github`                 | 4              | 0        |
| `e2e`                     | 57             | 12       |
| `scripts`                 | 2              | 1        |
| `src/components`          | 4              | 0        |
| `src/features/alerts`     | 7              | 3        |
| `src/features/dashboard`  | 30             | 5        |
| `src/features/design`     | 7              | 1        |
| `src/features/help`       | 3              | 2        |
| `src/features/household`  | 3              | 1        |
| `src/features/inventory`  | 80             | 13       |
| `src/features/onboarding` | 37             | 17       |
| `src/features/settings`   | 75             | 15       |
| `src/features/templates`  | 7              | 0        |
| `src/shared`              | 62             | 10       |
| `src/styles`              | 4              | 2        |

`src/test` was also reviewed (3 files, 0 findings) before chunking began.

### Not reviewed

These changed files fall outside every chunk, so **no CodeRabbit finding below covers them**. Each extra chunk costs a full rate-limit window (~50 min), so they were left out; the notable ones if you want a second pass are `src/App.tsx` and the two locale files.

- `.claude/hooks/block-dangerous-git.sh`
- `.claude/settings.json`
- `.devcontainer/devcontainer-lock.json`
- `.devcontainer/devcontainer.json`
- `.devcontainer/docker-compose.yml`
- `.devcontainer/initialize.sh`
- `.devcontainer/post-create.sh`
- `.gitignore`
- `.mcp.json`
- `README.md`
- `docs/CODE_QUALITY.md`
- `docs/V2_RELEASE_TODO.md`
- `docs/design-docs/004-dashboard-preparedness.md`
- `docs/design-docs/2026-08-04-days-covered-design.md`
- `docs/plans/2026-07-31-v2-parity-gaps.md`
- `docs/plans/2026-08-07-v1-v2-parity-audit.md`
- `eslint.config.js`
- `index.html`
- `new-worktree.sh`
- `playwright.config.ts`
- `public/locales/en/common.json`
- `public/locales/fi/common.json`
- `src/App.test.tsx`
- `src/App.tsx`
- `tsconfig.node.json`

## How to work these

Findings come straight from CodeRabbit and are **not yet verified against current code**. Several commits landed after some were generated, so a finding may already be fixed. For each one: check the cited lines, fix if still valid, otherwise note why it was skipped. Keep changes minimal and run `npm run validate` before committing.

Per AGENTS.md: UI-affecting fixes require the `/visual-verify` loop; no `--no-verify` commits.

### Progress

**Pass 1** (14 commits): the 24 correctness/logic findings (#10, #14, #19–21,
#24, #26–28, #30, #33–34, #38–39, #45, #51, #62, #66, #70, #74, #77, #79,
#81–82). Ran `/visual-verify`, which caught and fixed one real regression
introduced during this pass (a missing themeKey suffix on the new onboarding
water-formula translation keys — see the OnboardHousehold commit).

**Pass 2** (11 commits): remaining logic/behavior findings not needing CSS
work (#36, #43, #44, #53, #59, #60, #65, #69) and all e2e reliability
findings (#1–9, #11–12). Verified against live Playwright runs, not just
type-checking — this surfaced and fixed a stale e2e assertion left over from
pass 1 (onboarding.spec.ts's backup-import accept-attribute check).

Remaining and not yet started: the CSS-module extraction findings (#13, #15,
#16, #18, #23, #25, #29, #31, #32, #40, #41, #42, #47, #49), new-test-suite
additions (#22, #46, #48, #50, #52, #54–58, #61, #63–64, #67–68, #71–73,
#75–76, #78, #80), and #17 (support-links flex-wrap).

## Findings

### `e2e/advanced-features.spec.ts`

#### 1. [major] — lines 22–25

- [x] Replace one-time getAttribute checks for aria-checked with Playwright’s retrying expect(toggle).toHaveAttribute assertion in the toggle flows shown around the existing toggle.click logic, including the repeated cases in advanced-features.spec.ts and theme-switching.spec.ts. Preserve the conditional click behavior while ensuring the post-click checked-state validation waits for the attribute to become true.

#### 2. [major] — line 58

- [x] Replace the fixed 500 ms wait in the test flow with the exported waitForStoredData helper, importing it from ./fixtures alongside the existing fixtures. Wait for the setting to be persisted before reloading, preserving the test’s existing behavior.

<details><summary>CodeRabbit suggested code</summary>

```tsx
await waitForStoredData(page, (raw) => raw.includes('"calorieTracking":true'));
```

</details>

#### 3. [minor] — lines 8–16

- [x] Add a Playwright test in the “Advanced Features” suite that uses a viewport narrower than 768px and invokes the existing section helper to verify the advanced settings section is reached and visible. Keep the current beforeEach setup and desktop coverage intact, and exercise the mobile branch of navigateToSettingsSection.

### `e2e/fixtures.ts`

#### 4. [major] — lines 203–208

- [x] Replace the fixed waitForTimeout calls in navigateV2 and the settings-navigation helpers with state-based assertions: verify the clicked navigation item has aria-current="page", and verify the settings section is visible where applicable. Preserve the existing navigation and click flow while removing the timing-based sleeps.

#### 5. [major] — lines 264–268

- [x] Update navigateToSettingsSection’s page.evaluate scroll path to require the sec-${id} element and throw a clear error when document.getElementById cannot find it, rather than silently skipping scrollIntoView. Preserve the existing scroll behavior when the element exists.

<details><summary>CodeRabbit suggested code</summary>

```tsx
// Mobile (or rail hidden): scroll the target section directly.
await page.evaluate((id) => {
  const el = document.getElementById(`sec-${id}`);
  if (!el) throw new Error(`Settings section "sec-${id}" not found`);
  el.scrollIntoView({ block: 'start' });
}, sectionId);
await page.waitForTimeout(150);
```

</details>

### `e2e/onboarding.spec.ts`

#### 6. [major] — line 71

- [x] Replace the unguarded five-click loop in the onboarding test with a reusable advanceToQuickSetup helper that clicks continue and asserts the expected STEP 02 / 06 through STEP 06 / 06 marker after each transition. Reuse the helper at the other locations currently repeating the literal 5, preserving the step progression and ensuring each rendered step is confirmed before the next click.

### `e2e/shopping-list-export.spec.ts`

#### 7. [major] — lines 112–135

- [x] Update the third export test around the exportButton interaction to remove any conditional download guard. Await the download event unconditionally, trigger the export, and perform the existing download assertions so the test fails when no download fires, matching the pattern used by the second test.

### `e2e/theme-switching.spec.ts`

#### 8. [major] — lines 33–35

- [x] Replace the fixed wait and page.waitForLoadState('networkidle') in the theme-switching test with waitForStoredData from ./fixtures, importing it alongside the existing fixture helpers. Await the observable localStorage write before reloading, while preserving the existing reload behavior.

#### 9. [minor] — lines 118–133

- [x] Add a mobile-viewport variant of the v2 theme application test in the existing theme-switching suite, using a viewport below 768px so the bottom tab bar and scroll-by-id navigation path are exercised. Reuse the existing theme setup and assertions for the home, inventory, and settings pages, while preserving the desktop coverage.

### `e2e/v2-actions.spec.ts`

#### 10. [major] — lines 507–521

- [x] Update the household stepper test to capture household.adults from storage before clicking the increase button, then poll or otherwise wait for storage to reflect the post-click update and assert that the value is greater than the captured baseline. Ensure the assertion verifies an actual increment and does not read storage only once immediately after plus.click().

<details><summary>CodeRabbit suggested code</summary>

```tsx
test('household steppers update the computed targets', async ({ page }) => {
  await boot(page);
  await gotoSettings(page);
  await page.locator('#sec-household').scrollIntoViewIfNeeded();

  const plus = page
    .locator('#sec-household')
    .getByRole('button', { name: /increase|^\+$/i })
    .first();

  const adults = async () => {
    const root = await storage(page);
    return root.inventorySets[root.activeInventorySetId].household.adults;
  };
  const before = await adults();

  await plus.click();
  await expect.poll(adults).toBe(before + 1);
});
```

</details>

#### 11. [minor] — lines 69–83

- [x] Add a mobile Playwright test case in this file, preferably covering the inventory filter flow, and invoke boot with viewport set to 'mobile'. Follow the mobile navigation path using the bottom tab bar rather than the desktop left rail, while preserving existing desktop coverage and boot initialization.

#### 12. [minor] — lines 487–505

- [x] Update the switch iteration in the settings-page test to snapshot each switch’s accessible name before toggling, then locate each control by its captured name rather than using switches.nth(i) on the live locator. Preserve the existing before-state capture, click, and aria-checked flip assertion for every named switch.

### `src/features/alerts/components/v2/AlertBanner.tsx`

#### 13. [major] — lines 18–108

- [ ] Move the style rules defined by CONTAINER_STYLE, ROW_BASE_STYLE, MESSAGE_BASE_STYLE, PILL_BUTTON_STYLE, DISMISS_BUTTON_STYLE, MESSAGE_BUTTON_STYLE, ROW_STYLE, and TOGGLE_ROW_STYLE into AlertBanner.module.css, including severity-specific stripe styling from STRIPE_COLOR. Update the AlertBanner component to apply the corresponding CSS Module class names instead of inline CSSProperties, then run /visual-verify to confirm the UI remains unchanged.

#### 14. [minor] — lines 164–171

- [x] Update the AccentTextButton toggle in the alert banner to include aria-expanded={expanded}, exposing the current expanded or collapsed state while preserving its existing click behavior and labels.

<details><summary>CodeRabbit suggested code</summary>

```tsx
<AccentTextButton
  onClick={() => setExpanded((v) => !v)}
  aria-expanded={expanded}
  data-testid="v2-alert-toggle"
>
  {expanded
    ? t(`v2.alerts.showLess.${themeKey}`)
    : t(`v2.alerts.showMore.${themeKey}`, { count: overflowCount })}
</AccentTextButton>
```

</details>

### `src/features/dashboard/components/v2/PriorityQueue.tsx`

#### 15. [major] — lines 28–115

- [ ] Move all inline presentation rules in the PriorityQueue component into scoped classes in a new PriorityQueue.module.css file, including the panel header, view-all button, empty state, priority row, item details, metadata, and border variants. Import the module and replace each style object with the corresponding className, preserving the existing dynamic last-row border behavior through conditional classes or CSS module variants.

### `src/features/help/components/v2/Guide.tsx`

#### 16. [major] — lines 42–160

- [ ] Replace the inline style objects in the Guide component, including the outer layout, section rows, typography, support panel, and links, with named classes from Guide.module.css. Add the corresponding CSS Module rules and update the JSX to use the module class names, preserving the current visual behavior and responsive/interactive styling. Ensure the component continues using complete TypeScript props and CSS Module imports.

#### 17. [major] — lines 138–159

- [ ] Update the support-links flex container in Guide to allow wrapping on narrow viewports by adding the appropriate flex-wrap styling, while preserving the existing layout, spacing, and link styles.

<details><summary>CodeRabbit suggested code</summary>

```tsx
<div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
  <a
    href={`mailto:${CONTACT_EMAIL}`}
    style={{
      fontSize: 13,
      color: 'var(--color-accent)',
    }}
  >
    {CONTACT_EMAIL}
  </a>
  <a
    href="https://github.com/ttu/emergency-supply-tracker"
    target="_blank"
    rel="noopener noreferrer"
    style={{
      fontSize: 13,
      color: 'var(--color-accent)',
    }}
  >
    {t('help.githubLink')}
  </a>
</div>
```

</details>

### `src/features/inventory/components/v2/InventoryFilterStrip.tsx`

#### 18. [major] — lines 7–16

- [ ] Move the styles defined by SELECT_STYLE and the referenced inline style objects in InventoryFilterStrip into InventoryFilterStrip.module.css, then import the module in InventoryFilterStrip and replace style props with className usage. Preserve the active chip styling through a dedicated modifier class combined with the base chip class.

### `src/features/inventory/components/v2/MobileInventory.tsx`

#### 19. [major] — lines 53–56

- [x] Wrap MobileInventory’s handleQuantityChange callback in useCallback so its identity remains stable across parent renders, while preserving the existing createItemId, createQuantity, and updateItem behavior. Verify that updateItem from useInventory is stable; if it is not, use the appropriate stable dependency or exposed updater so memoized MobileInventoryRow props remain stable.

#### 20. [major] — line 41

- [x] Replace the locally declared FilterKey union in MobileInventory with the exported InventoryStatusFilter type from useInventoryFilters.ts, adding the appropriate type import and updating references as needed. Preserve the existing filter chip and setFilters({ status: k }) behavior while ensuring future status additions remain shared.

<details><summary>CodeRabbit suggested code</summary>

```tsx
import {
  useInventoryFilters,
  type InventoryStatusFilter,
} from '../../hooks/useInventoryFilters';

type FilterKey = InventoryStatusFilter;
```

</details>

#### 21. [minor] — lines 174–197

- [x] Update the location-filter controls in MobileInventory and the corresponding InventoryFilterStrip so a persisted locationFilter remains clearable when locations is empty: either render the select whenever locationFilter is set or clear the filter when it no longer matches available suggestions. Preserve the existing empty-option behavior and filtering semantics.

<details><summary>CodeRabbit suggested code</summary>

```tsx
{
  (locations.length > 0 || locationFilter !== undefined) && (
    <select
      // Empty option, not a magic "all", so a location named "all"
      // remains selectable. See InventoryFilters.location.
      value={locationFilter ?? ''}
      onChange={(e) => setFilters({ location: e.target.value || undefined })}
      aria-label={t(`v2.inventory.locationAria.${themeKey}`)}
      style={MOBILE_SELECT_STYLE}
    >
      <option value="">{t(`v2.inventory.allLocations.${themeKey}`)}</option>
      <option value={LOCATION_FILTER_NONE}>
        {t(`v2.inventory.noLocation.${themeKey}`)}
      </option>
      {locations.map((l) => (
        <option key={l} value={l}>
          {l}
        </option>
      ))}
    </select>
  );
}
```

</details>

### `src/features/inventory/components/v2/useRemoveEmptyItems.ts`

#### 22. [major] — lines 27–68

- [ ] Add unit tests for useRemoveEmptyItems covering zero-quantity filtering, categoryId scoping, the zero-count handleOpen path, handleCancel closing confirmation state, and handleConfirm passing only the selected item IDs to deleteItems. Mock useInventory, translation, and theme dependencies, and verify the hook’s returned count and confirmation state transitions.

### `src/features/onboarding/components/v2/OnboardComplete.tsx`

#### 23. [major] — lines 45–128

- [ ] Move the inline layout and visual styles from the OnboardComplete component into an imported OnboardComplete.module.css, replacing the style props with CSS Module class names. Define classes for the viewport, content, completion label, subtitle, summary grid, and action area, preserving the existing appearance while enabling responsive rules; leave component-specific dynamic values and child component props unchanged.

#### 24. [minor] — lines 100–106

- [x] Update the tone selection in the NumberDisplay within OnboardComplete so readiness equal to 100 uses the success tone, while zero remains critical and other non-zero values remain warning.

<details><summary>CodeRabbit suggested code</summary>

```tsx
          <SummaryStat caption={t(`v2.voice.readiness.${themeKey}`)}>
            <NumberDisplay
              value={readiness}
              suffix="%"
              size={36}
              tone={
                readiness === 0 ? 'crit' : readiness === 100 ? 'ok' : 'warn'
              }
            />
```

</details>

### `src/features/onboarding/components/v2/OnboardHousehold.tsx`

#### 25. [major] — lines 46–107

- [ ] Replace the static inline style objects in OnboardHouse, including the household water and kcal panels and the referenced day-option and two-panel layouts, with className values backed by OnboardHouse.module.css. Keep only genuinely value-dependent declarations inline, and preserve the existing visual styling while enabling responsive media-query rules for the layouts.

#### 26. [minor] — lines 71–81

- [x] Update the formula rendering in OnboardHousehold to use an interpolated translation key instead of literal “=”, “3 L”, and “× 0.75” text. Derive the displayed adult volume and child factor from the same constants or source used by computeOnboardingTargets, then pass those values along with household counts and duration to the translation.

#### 27. [minor] — line 94

- [x] Update the useTranslation() destructuring in OnboardHousehold to obtain i18n, then pass i18n.language to targets.kcal.toLocaleString() in the NumberDisplay value so formatting follows the active application locale.

#### 28. [minor] — line 164

- [x] Replace the hardcoded `{n}D` label in the `OnboardHousehold` component with a translated string using the component’s `useTranslation` hook and a translation key that interpolates the day-count value. Add or reuse the appropriate locale entries so Finnish and other supported languages receive the localized suffix.

<details><summary>CodeRabbit suggested code</summary>

```tsx
{
  t(`v2.onboarding.household.dayOption.${themeKey}`, {
    count: n,
  });
}
```

</details>

### `src/features/onboarding/components/v2/OnboardKit.tsx`

#### 29. [major] — lines 68–303

- [ ] The OnboardKit component currently uses inline styles, including the card, grid, upload control, and focus-related styling. Create or update OnboardKit.module.css with class names for these styles, replace the inline style objects in the kit card and upload/grid elements with CSS Module className references, and preserve the existing selected-state visuals and focus-visible behavior.

#### 30. [major] — lines 38–63

- [x] Track whether handleFile has an active asynchronous upload, setting the state before awaiting file.text() and clearing it on every success, parse failure, validation failure, or stale-request exit. Disable or block the Continue action while that state is active so navigation cannot proceed with the previous kit, and add a test that keeps file.text() pending while Continue is attempted and verifies navigation is prevented.

### `src/features/onboarding/components/v2/OnboardLayout.tsx`

#### 31. [major] — lines 76–224

- [ ] Move the shared visual and layout styles from OnboardLayout’s inline style objects into an imported OnboardLayout.module.css, including viewport scrolling, grid columns, responsive padding, content/footer placement, and sidebar presentation. Replace the affected style props with CSS Module class names, using the existing sideBeside and sideStacked conditions to select responsive layout classes while preserving current behavior.

### `src/features/onboarding/components/v2/OnboardPreset.tsx`

#### 32. [major] — lines 39–50

- [ ] Replace the inline style objects in OnboardPreset, including linkStyle and the preset grid styles, with classes defined in a colocated CSS Module. Update the component’s className usage accordingly, preserving the current visual styling while adding responsive media-query adjustments for the fixed padding and font sizes.

#### 33. [major] — lines 61–74

- [x] Replace the hard-coded 'P-04' check in OnboardPreset’s onContinue handler with an explicit appliesHousehold flag defined on each onboardingPresets entry. Set the start-from-scratch preset’s flag to false and the other presets to true, then apply the household only when preset.appliesHousehold is true while preserving unrecognized-code handling and the existing onNext call.

#### 34. [minor] — lines 218–226

- [x] Update the file input in OnboardPreset to use the same accept value as the kit upload input: include both the application/json MIME type and the .json extension, while leaving the other input attributes unchanged.

<details><summary>CodeRabbit suggested code</summary>

```tsx
<input
  ref={fileInputRef}
  type="file"
  accept="application/json,.json"
  onChange={handleFileChange}
  hidden
  aria-label={t('onboarding.import.button')}
  data-testid="v2-import-file-input"
/>
```

</details>

### `src/features/onboarding/components/v2/OnboardQuickSetup.tsx`

#### 35. [major] — lines 66–169

- [ ] Move the inline styles in the quick-setup component, including the additional styles in the referenced lower section, into an OnboardQuickSetup.module.css file. Import the module and replace each style prop with descriptive module class names, preserving layout, responsive behavior, checkbox states, button states, and theme-specific styling through appropriate classes or modifiers.

#### 36. [minor] — lines 238–239

- [x] Update toggleSelected and the “deselect all” handler to remove deselected IDs from ownedIds, clearing ownedIds when all items are deselected. Keep ownedIds restricted to currently selected items so the owned summary and onAddItems receive consistent data, and add regression coverage for both transitions.

### `src/features/onboarding/components/v2/OnboardWelcome.tsx`

#### 37. [major] — lines 57–172

- [ ] Extract the inline style objects in OnboardWelcome, including the side panel, output rows, and language button/selection elements, into a colocated CSS Module and import its classes. Preserve the current visual states and layout while adding responsive media-query rules so the 40px output grid and 60px/1fr/24px language grid adapt appropriately on narrow screens; keep TypeScript props unchanged and complete.

#### 38. [major] — lines 29–34

- [x] Update setLang so updateSettings({ language: lang }) runs only after i18n.changeLanguage(lang) resolves; handle the rejected promise by surfacing the failure instead of silently ignoring it, while preserving the existing language choices.

<details><summary>CodeRabbit suggested code</summary>

```tsx
const setLang = (lang: 'en' | 'fi') => {
  i18n
    .changeLanguage(lang)
    .then(() => updateSettings({ language: lang }))
    .catch((error: unknown) => {
      console.error('Failed to switch language', error);
    });
};
```

</details>

### `src/features/settings/components/LanguageSelector.tsx`

#### 39. [major] — lines 9–18

- [x] Update handleLanguageChange so overlapping i18n.changeLanguage requests cannot persist an outdated selection: track the latest request and only call updateSettings for the most recently requested language when its promise resolves, while preserving error handling. Add a deferred-promise test that selects fi then en and resolves them in reverse order, asserting only en is persisted.

### `src/features/settings/components/v2/AboutSection.tsx`

#### 40. [major] — lines 37–42

- [ ] Replace the inline grid styling in the AboutSection component with a CSS Module class, preserving the two-column layout by default and switching to a single column at the appropriate narrow-viewport breakpoint. Apply the module class to the container holding the description and link panels.

### `src/features/settings/components/v2/SettingsRows.tsx`

#### 41. [major] — lines 20–344

- [ ] The shared layout and visual styles in PanelHeader, Toggle, ToggleRow, StepperRow, ReadField, and stepperButtonStyle should be moved into SettingsRows.module.css. Replace duplicated static inline style objects with CSS Module class names, retaining only dynamic state-dependent values such as toggle position/color or conditional borders via CSS custom properties or minimal inline styles, while preserving the existing TypeScript props and component behavior.

### `src/features/settings/components/v2/ThemePicker.tsx`

#### 42. [major] — lines 115–117

- [ ] Update the non-list layout in ThemePicker’s containerStyle to use the component’s CSS Module and a responsive grid that reduces columns on narrow panels, such as auto-fit with an appropriate minimum card width or a breakpoint. Preserve the existing list layout and spacing while ensuring cards do not become too narrow or overflow.

#### 43. [major] — lines 120–144

- [x] Update the ThemePicker radio group to implement complete keyboard behavior: use native radio inputs or add roving tabIndex with ArrowLeft/Right/Up/Down navigation, focus movement, and selection updates across DESIGN_V2_THEMES. Replace the unconditional outline removal for unselected buttons with a visible :focus-visible indicator while preserving selected styling and click behavior.

#### 44. [minor] — lines 31–84

- [x] Update PREVIEWS to store translation keys instead of hardcoded theme names, then use useTranslation in ThemePicker to translate each card name and the radiogroup aria-label at render time. Ensure all visible theme names and the “Theme” group label go through the existing translation mechanism.

### `src/shared/components/DataErrorPage.tsx`

#### 45. [major] — lines 55–57

- [x] Validate the result of JSON.parse in the DataErrorPage export flow before spreading it: only use the parsed value as exportData when it is a non-null, non-array object. For null, arrays, strings, and other JSON values, preserve the raw-data fallback, while retaining the existing parse-error handling; add coverage for these three cases.

<details><summary>CodeRabbit suggested code</summary>

```tsx
      const parsedData: unknown = JSON.parse(rawJson);
      if (
        parsedData === null ||
        typeof parsedData !== 'object' ||
        Array.isArray(parsedData)
      ) {
        const filename = generateDateFilename(EXPORT_BASENAME_RAW);
        downloadFile(rawJson, filename);
        return;
      }
      const rawData = parsedData as Record<string, unknown>;
      const exportData = {
        ...rawData,
```

</details>

### `src/shared/components/design-v2/ConfirmDialog.tsx`

#### 46. [major] — lines 35–205

- [ ] Add a ConfirmDialog.test.tsx suite covering the closed state, Escape-triggered onCancel, Tab and Shift+Tab focus trapping, focus restoration after close or unmount, and restoration of body overflow during cleanup. Exercise the rendered ConfirmDialog behavior with appropriate mocks for translation, theme, portal, and callbacks while preserving the existing component API.

#### 47. [major] — lines 115–201

- [ ] Move the inline layout and visual styles in ConfirmDialog’s dialogContent markup into classes defined in ConfirmDialog.module.css, then apply those classes through the CSS Module import. Preserve the existing CSS-variable-based theme values and all current sizing, spacing, positioning, and accessibility behavior; keep only genuinely dynamic values in inline styles if needed.

### `src/shared/components/design-v2/Shell.tsx`

#### 48. [major] — lines 38–341

- [ ] Add unit tests covering both DesktopShell and MobileShell, rendering each variant with representative props and verifying all navigation buttons invoke onNav with the selected NAV id, only the active page has aria-current="page", and both shell layouts render their expected content and navigation controls.

#### 49. [major] — lines 48–339

- [ ] Move the presentation rules in the desktop shell and MobileShell from inline style objects into scoped CSS Module classes, including layout, spacing, typography, borders, and responsive structure. Preserve CSS custom properties such as var(--color-bg) and var(--font-body) for theme tokens, while retaining dynamic state-dependent values like active navigation styling through appropriate class composition or CSS variables. Keep the existing Shell and MobileShell props and behavior unchanged.

### `src/shared/hooks/useDesignData.ts`

#### 50. [major] — lines 59–143

- [ ] The new useDesignData hook lacks unit-test coverage for its derived dashboard behavior. Add a useDesignData.test.ts suite that mocks the five provider hooks and verifies recommendation mapping, category applicability, readiness, expiration counts, and daysCovered/daysCoveredDetail output, using complete typed fixtures and covering the key boundary cases.

### `src/shared/types/exportImport.ts`

#### 51. [major] — lines 299–306

- [x] Update the MultiInventoryExportData type guard around the inventorySets and metadata checks so both exportedAt and appVersion are required for every payload, including non-empty inventorySets arrays. Remove the length-based exception and add coverage for a populated inventorySets payload missing metadata, ensuring it is rejected.

<details><summary>CodeRabbit suggested code</summary>

```tsx
  data: unknown,
): data is MultiInventoryExportData {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    Array.isArray(d.inventorySets) &&
    typeof d.exportedAt === 'string' &&
    typeof d.appVersion === 'string'
  );
```

</details>

### `src/shared/utils/designStatus.ts`

#### 52. [major] — lines 13–115

- [ ] Add a designStatus.test.ts suite covering toDesignStatus and ALERT_TYPE_TO_DESIGN_STATUS mappings, statusOf/categoryStats item counts, non-applicable category handling, and coverageCounts totals excluding inapplicable categories. Use complete typed fixtures and assert both per-status counts and aggregate coverage results.

### `scripts/ai/block_big_reads.sh`

#### 53. [minor] — lines 78–84

- [x] Add .webp to BLOCKED_EXTENSIONS so webp files outside the directories exempted by the screenshot-path check are blocked, while preserving the existing screenshot exemption logic.

### `src/features/alerts/components/v2/AlertBanner.test.tsx`

#### 54. [minor] — lines 147–155

- [ ] Add item-level alert coverage to the AlertBanner tests by creating an alert fixture with an itemId, then trigger both the message action and the Resolve action and assert each invokes onItemSelect with that itemId. Keep the existing category-selection test unchanged and use the suite’s established setup and querying patterns.

### `src/features/dashboard/components/v2/MobileDashboard.test.tsx`

#### 55. [minor] — lines 93–96

- [ ] Update the test named “surfaces the alert banner above the KPIs” to locate the readiness KPI element and assert that the v2-alert-banner appears before it in the rendered DOM order. Keep the existing presence assertion and ensure the test fails when the banner renders below the readiness KPI.

<details><summary>CodeRabbit suggested code</summary>

```tsx
it('surfaces the alert banner above the KPIs', async () => {
  setup([missing]);
  const banner = await screen.findByTestId('v2-alert-banner');
  const readinessKpi = screen.getByText('v2.voice.readiness.cockpit');

  expect(
    banner.compareDocumentPosition(readinessKpi) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
});
```

</details>

### `src/features/dashboard/hooks/useSeenNotifications.behaviors.test.ts`

#### 56. [minor] — line 66

- [ ] Move the behavior cases from useSeenNotifications.behaviors.test.ts into the canonical useSeenNotifications.test.ts file, preserving their assertions and setup. Remove the nonconforming behavior test file so the suite follows the required [function].test.ts naming convention.

### `src/features/dashboard/utils/preparedness.score.test.ts`

#### 57. [minor] — lines 2–14

- [ ] Rename the test file to calculatePreparednessScore.test.ts because the suite exercises calculatePreparednessScore, including its deprecated wrapper. Keep the existing tests together unless they target additional functions, in which case split those suites into their respective [function].test.ts files.

### `src/features/dashboard/utils/priorityRows.test.ts`

#### 58. [minor] — lines 1–61

- [ ] Split the tests in priorityRows.test.ts by exported function: move the selectPriorityRows describe suite into selectPriorityRows.test.ts and the critFirst describe suite into critFirst.test.ts. Update each new file’s imports to include only the function it tests, and remove the original combined test file.

### `src/features/design/navMapping.test.ts`

#### 59. [minor] — lines 9–39

- [x] Split the tests in navMapping.test.ts into function-specific files named navIdForPage.test.ts and pageForNavId.test.ts, placing each mapping’s direct and round-trip coverage with its corresponding function while preserving all existing assertions and behavior.

### `src/features/household/constants.test.ts`

#### 60. [minor] — lines 10–16

- [x] Update the DEFAULT_HOUSEHOLD assertion in the constants test to use the concrete intended values: adults 1, children 0, pets 0, supplyDurationDays 3, and useFreezer false, rather than referencing HOUSEHOLD_DEFAULTS.

### `src/features/inventory/components/v2/CategoryRecommendedPanel.test.tsx`

#### 61. [minor] — lines 117–126

- [ ] The test currently uses a weak count comparison that is always true because mark-enough actions are inside recommended rows. Update the test around setup, expand, and row queries to assert that at least one `v2-recommended-row` does not contain a `v2.inventory.markEnough.cockpit` action, while retaining the requirement that at least one markable action exists.

<details><summary>CodeRabbit suggested code</summary>

```tsx
it('only offers to accept the quantity on hand where there is one', async () => {
  const { user } = setup('water-beverages', { items: [shortWater()] });
  await expand(user);
  const rows = screen.getAllByTestId('v2-recommended-row');
  const markable = screen.getAllByLabelText('v2.inventory.markEnough.cockpit');
  expect(markable.length).toBeGreaterThan(0);
  expect(markable.length).toBeLessThan(rows.length);
});
```

</details>

### `src/features/inventory/components/v2/CategorySummaryPanel.tsx`

#### 62. [minor] — lines 76–77

- [x] Update CategorySummaryPanel’s unit-label logic to translate the food unit through the existing useTranslation setup and units namespace instead of hard-coding “kcal”. Preserve the current translatedUnit behavior for non-food items and ensure locale resources control the displayed food label.

### `src/features/inventory/components/v2/ItemDetail.test.tsx`

#### 63. [minor] — lines 112–146

- [ ] Extend the test “DELETE opens a themed confirm dialog and only deletes when confirmed” to click the dialog’s themed confirm button after verifying the cancel behavior, then assert the deletion outcome and any expected navigation callback. Import and use within to target the confirm button inside the alertdialog, preserving the existing themed dialog and cancel-path assertions.

### `src/features/inventory/components/v2/MobileItemDetail.test.tsx`

#### 64. [minor] — lines 46–60

- [ ] Update the test around MobileItemDetail to match the NEW_ITEM_ID flow: either assert that NewItemTemplateStep’s picker is rendered initially, or interact with the picker to advance before asserting the embedded ItemForm and its save button. Remove the misleading form-rendering comments and retain the not-found assertion only if it remains relevant.

<details><summary>CodeRabbit suggested code</summary>

```tsx
it('shows the product picker first in NEW mode', async () => {
  renderWithProviders(
    <MobileItemDetail itemId={NEW_ITEM_ID} onBack={vi.fn()} />,
    {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
      }),
    },
  );
  expect(
    await screen.findByRole('button', { name: /custom/i }),
  ).toBeInTheDocument();
  expect(document.querySelector('#name')).not.toBeInTheDocument();
});
```

</details>

### `src/features/inventory/components/v2/ProductPicker.module.css`

#### 65. [minor] — lines 40–49

- [x] Update the .search:focus styling in ProductPicker.module.css to add the same visible outline treatment already used by the :focus-visible rules for the chip, row, and custom button, while preserving the existing border-color change. Ensure the search input has a non-color-only focus indicator despite the base outline: none.

### `src/features/inventory/components/v2/ProductPicker.tsx`

#### 66. [minor] — line 66

- [x] Update the product sorting callbacks near the existing lang declaration to pass i18n.language (or the derived lang value) as the locale argument to both localeCompare calls. Remove the unsound 'en' | 'fi' cast or normalize region-tagged values such as en-US and fi-FI to supported locales, and add the locale dependency to both relevant dependency arrays.

### `src/features/inventory/components/v2/useCategoryCoverage.test.ts`

#### 67. [minor] — lines 1–141

- [ ] Rename the test file for the useCategoryCoverage hook from the current JSX-oriented suffix to useCategoryCoverage.test.ts, preserving its existing test contents and behavior.

### `src/features/inventory/hooks/useInventoryFilters.test.tsx`

#### 68. [minor] — lines 1–109

- [ ] Rename the test file for the useInventoryFilters suite from the JSX-oriented .test.tsx suffix to useInventoryFilters.test.ts, preserving its existing test contents and behavior.

### `src/features/onboarding/components/v2/OnboardHousehold.stories.tsx`

#### 69. [minor] — lines 17–21

- [x] Remove the no-op onHouseholdChange, onNext, and onBack callback entries from the args objects in the OnboardHousehold stories and the Family story so the argTypes action handlers are used. Verify that satisfies Meta<typeof OnboardHousehold> still type-checks without these args; if required by the Storybook version, preserve type correctness while avoiding overrides that disable the declared actions.

### `src/features/settings/components/v2/AppearanceSection.tsx`

#### 70. [minor] — lines 66–69

- [x] Update the language options mapped in AppearanceSection to use useTranslation and translated keys for both labels instead of hardcoded “English” and “Suomi”; preserve the existing language codes and selection behavior.

### `src/features/settings/components/v2/HouseholdSection.test.tsx`

#### 71. [minor] — lines 49–75

- [ ] Update the test case “states the arithmetic that produced the figure, children included” to assert the rendered formula includes the daily amount, effective household count including the child multiplier, and supply duration (for example, the expected “2 L x 3.5 PEOPLE x 14 D” operands), rather than only checking the translation key. Keep the existing 98 total assertion.

### `src/features/settings/components/v2/NotificationsSection.tsx`

#### 72. [minor] — lines 136–154

- [ ] Add focused unit tests for NotificationsSection hidden-alert behavior, covering zero hidden alerts, reactivateAlert restoring one alert, and reactivateAllAlerts restoring all alerts. Mock or provide the relevant useInventory, useNotificationPrefs, alert-generation, and household dependencies so tests exercise the hiddenAlerts computation and restoration actions rather than only asserting the section header.

### `src/features/settings/components/v2/NutritionSection.test.tsx`

#### 73. [minor] — lines 12–48

- [ ] Expand the NutritionSection tests to interact with every StepperRow and verify each control calls updateSettings with the expected values, covering calorie and water bounds plus child-percentage limits of 0 and 100. Reuse the existing renderWithProviders setup and assert the settings update path for each nutrition control rather than only checking labels.

### `src/features/settings/components/v2/NutritionSection.tsx`

#### 74. [minor] — line 45

- [x] Update NutritionSection to use useTranslation for the user-facing suffixes currently hardcoded as “kcal”, “L”, and “%” at the referenced fields. Add corresponding translation resources or include each unit in its translated value template, then pass the localized strings to the rendered values while preserving the existing nutrition display behavior.

### `src/features/settings/components/v2/SettingsFull.test.tsx`

#### 75. [minor] — lines 18–22

- [ ] Update the test case “renders the page title and lead copy in cockpit voice” so its second assertion targets the lead-copy translation key rather than repeating “v2.settings.title.cockpit”; keep the existing title assertion unchanged.

<details><summary>CodeRabbit suggested code</summary>

```tsx
it('renders the page title and lead copy in cockpit voice', () => {
  setup();
  expect(screen.getByText('v2.settings.title.cockpit')).toBeInTheDocument();
  expect(screen.getByText('v2.settings.intro.cockpit')).toBeInTheDocument();
});
```

</details>

### `src/features/settings/components/v2/SettingsRows.test.tsx`

#### 76. [minor] — lines 79–121

- [ ] Extend the StepperRow tests around the existing increment and decrement cases to cover both clamped calculations: verify incrementing a value near max calls onChange with max, and verify decrementing a value above min calls onChange with min. Keep the assertions focused on the resulting onChange values and preserve the existing disabled-button test for values already at the boundary.

### `src/features/settings/hooks/useDesignPref.ts`

#### 77. [minor] — lines 76–83

- [x] Update the updatePref callback in useDesignPref so its functional setPrefs updater only computes and returns the next preferences state without calling save. Add or use a post-commit effect to persist the current prefs after state changes, preserving the functional update behavior for concurrent preference changes.

### `src/features/settings/hooks/useSettingsScrollSpy.test.ts`

#### 78. [minor] — lines 51–60

- [ ] Update the test setup around beforeEach and afterEach to capture the original property descriptors for Element.prototype.scrollIntoView and Element.prototype.scrollTo before replacing them, then restore those descriptors during cleanup after each test. Keep the existing global unstubbing and document cleanup behavior.

### `src/shared/utils/calculations/daysCovered.ts`

#### 79. [minor] — lines 134–136

- [x] Update the supplyDurationDays validation in the days-covered calculation to reject negative values as well as zero and non-finite values. Ensure inputs such as -7 return NOTHING_COVERED and no coverage result can be negative.

<details><summary>CodeRabbit suggested code</summary>

```tsx
if (supplyDurationDays <= 0 || !Number.isFinite(supplyDurationDays)) {
  return NOTHING_COVERED;
}
```

</details>

### `src/shared/utils/serviceWorker.test.ts`

#### 80. [minor] — lines 35–37

- [ ] Update the test setup around register() to capture each test’s added window load callback, and change triggerLoad() to invoke only that captured callback instead of dispatching a global load event. Reset the captured callback between tests so stale listeners cannot execute or cause duplicate registrations.

### `src/styles/design-themes.css`

#### 81. [minor] — lines 16–22

- [x] Update the document-lock selector in the theme styles to also match :root when its data-theme is cockpit, civil, or pantry, while preserving the existing descendant-theme matches and overflow/viewport declarations.

<details><summary>CodeRabbit suggested code</summary>

```tsx
:root:is(
  [data-theme='cockpit'],
  [data-theme='civil'],
  [data-theme='pantry']
),
:where(html, body):has(
  :where([data-theme='cockpit'], [data-theme='civil'], [data-theme='pantry'])
) {
  overflow: hidden;
  height: 100vh;
  height: 100dvh;
}
```

</details>

### `src/styles/viewportHeight.test.ts`

#### 82. [minor] — lines 34–47

- [x] Update the document-lock assertion in the viewport-height test to require the declarations under the :root[data-theme='…'] selector, while preserving the existing overflow and viewport-height checks. In the inline-height assertion, reject both single-quoted and double-quoted 100vh values.

<details><summary>CodeRabbit suggested code</summary>

```tsx
  it('locks the document to the dynamic viewport too', () => {
    const css = read('styles/design-themes.css');
    expect(css).toMatch(
      /:root[^{}]*\[data-theme='cockpit'\][^{}]*\{[^}]*height:\s*100dvh/,
    );
    expect(css).toMatch(
      /overflow:\s*hidden;\s*height:\s*100vh;\s*height:\s*100dvh/,
    );
  });

  it.each([
    ['shared/components/design-v2/Shell.tsx', 2],
    ['features/onboarding/components/v2/OnboardLayout.tsx', 1],
    ['features/onboarding/components/v2/OnboardComplete.tsx', 1],
  ])('%s uses the class rather than an inline 100vh', (file, expected) => {
    const source = read(file);
    expect(source).not.toMatch(/height\s*:\s*['"]100vh['"]/);
```

</details>
