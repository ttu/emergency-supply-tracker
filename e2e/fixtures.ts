import {
  test as base,
  expect,
  type Page,
  type Locator,
} from '@playwright/test';
import { createMockAppData } from '../src/shared/utils/test/factories';
import {
  STORAGE_KEY,
  buildRootStorageFromAppData,
} from '../src/shared/utils/storage/localStorage';
import type { AppData } from '../src/shared/types';

/**
 * The app's own URL, with the root gate's bypass applied.
 *
 * `/` shows the static landing page to anyone with no stored data (see the
 * gate script in index.html), and a spec starting from a clean profile looks
 * exactly like that first-time visitor. `?app=1` is the same bypass the
 * landing page's CTAs use, so specs exercise the app rather than the pitch.
 */
export const APP_URL = '/?app=1';

/** Set localStorage to RootStorage built from AppData (for E2E fixtures). */
export async function setAppStorage(
  page: Page,
  appData: AppData,
): Promise<void> {
  const root = buildRootStorageFromAppData(appData);
  await page.evaluate(
    ({ root, key }) => {
      localStorage.setItem(key, JSON.stringify(root));
    },
    { root, key: STORAGE_KEY },
  );
}

/**
 * Wait until every notification toast has dismissed itself.
 *
 * Saving, deleting and importing all raise a toast that overlays the top of
 * the page, and it intercepts clicks on whatever sits underneath. Waiting on
 * the toasts being gone is the observable condition; sleeping for "about as
 * long as a toast lasts" is both slower and flakier.
 */
export async function waitForToastsToClear(page: Page): Promise<void> {
  const toasts = page.locator('[data-testid^="notification-item-"]');
  // The toast raised by the action just performed may not have rendered yet.
  // Asserting the count is zero straight away then passes against a page the
  // toast is about to cover, which is the race this helper exists to avoid.
  // A toast that already came and went simply never appears here, and the
  // clear-check below passes immediately — hence the tolerant catch.
  await toasts
    .first()
    .waitFor({ state: 'visible', timeout: 2000 })
    .catch(() => {});
  await expect(toasts).toHaveCount(0, { timeout: 10_000 });
}

/**
 * Wait until the app has written a change through to localStorage.
 *
 * A setting only survives a reload once it is on disk, and the write lands an
 * effect after the render that shows it — so asserting on the rendered value
 * is not the same condition as "safe to reload now".
 */
export async function waitForStoredData(
  page: Page,
  matches: (raw: string) => boolean,
): Promise<void> {
  await expect
    .poll(
      async () =>
        matches(
          await page.evaluate(
            (key) => localStorage.getItem(key) ?? '',
            STORAGE_KEY,
          ),
        ),
      { timeout: 5000 },
    )
    .toBe(true);
}

// Helper to wait for element count to change
export async function waitForCountChange(
  locator: Locator,
  initialCount: number,
  options: { timeout?: number; decrease?: boolean } = {},
) {
  const { timeout = 5000, decrease = true } = options;
  const expectedCount = decrease ? initialCount - 1 : initialCount + 1;
  await expect(locator).toHaveCount(expectedCount, { timeout });
}

// Default app data with onboarding completed. Theme defaults to `cockpit`
// (design v2) — matches the production first-run theme that real users see.
export const defaultAppData = createMockAppData({
  settings: {
    onboardingCompleted: true,
    language: 'en',
    theme: 'cockpit',
    highContrast: false,
    advancedFeatures: {
      calorieTracking: false,
      powerManagement: false,
      waterTracking: false,
    },
  },
  household: {
    adults: 2,
    children: 0,
    pets: 0,
    supplyDurationDays: 3,
    useFreezer: true,
  },
  items: [],
  customCategories: [],
});

// Helper function to expand recommended items
// Uses consistent locator pattern to find button with text matching "Show X recommended items"
// The button text is generated from translation: "Show {{count}} recommended items"
//
// Implementation note: We use XPath to find the button that follows "Recommended:" in the DOM
// rather than text matching, as it's more reliable across different rendering scenarios.
// The button text pattern is "Show X recommended items" where X is a number.
export async function expandRecommendedItems(page: Page) {
  // Wait for recommended items section to appear
  await expect(page.locator('text=Recommended:')).toBeVisible();

  // Find and click the expand button
  // Use XPath to reliably locate the button following "Recommended:" label
  // This is equivalent to the pattern: .locator('button', { hasText: /Show \d+ recommended items/ })
  // but more reliable for e2e tests
  const expandButton = page
    .locator('text=Recommended:')
    .locator('xpath=following::button[1]');
  await expect(expandButton).toBeVisible({ timeout: 5000 });
  await expandButton.click();

  // Wait for the recommended items list to be visible after expanding
  await expect(page.locator('[class*="missingItemText"]').first()).toBeVisible({
    timeout: 5000,
  });
}

// Helper to close any open modals
// This ensures tests start with a clean state
async function closeAnyOpenModals(page: Page) {
  // Check if there's a modal open
  const dialog = page.locator('[role="dialog"]').first();
  const isOpen = await dialog.isVisible().catch(() => false);

  if (isOpen) {
    // Try pressing Escape to close
    await page.keyboard.press('Escape');
    // Wait for the dialog to be hidden
    await dialog.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});

    // If still open, try clicking the close button
    const stillOpen = await dialog.isVisible().catch(() => false);
    if (stillOpen) {
      const closeButton = page.locator('button[aria-label*="close" i]').first();
      const closeVisible = await closeButton.isVisible().catch(() => false);
      if (closeVisible) {
        await closeButton.click({ timeout: 1000 }).catch(() => {});
        await dialog
          .waitFor({ state: 'hidden', timeout: 2000 })
          .catch(() => {});
      }
    }
  }
}

// Helper to ensure no modals are blocking interactions
// More reliable than checking visibility + timeout
export async function ensureNoModals(page: Page) {
  const dialog = page.locator('[role="dialog"]').first();
  const isOpen = await dialog.isVisible().catch(() => false);
  if (isOpen) {
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
  }
}

// Extended test with setup helper
export const test = base.extend<{
  setupApp: () => Promise<void>;
}>({
  setupApp: async ({ page }, use) => {
    const setup = async () => {
      await page.goto(APP_URL);
      // Close any modals that might be open
      await closeAnyOpenModals(page);
      await setAppStorage(page, defaultAppData);
      await page.reload({ waitUntil: 'domcontentloaded' });
      // Close any modals after reload
      await closeAnyOpenModals(page);
    };
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(setup);
  },
});

/**
 * Design-v2 top-nav targets. The v2 shell uses a left rail (desktop) or
 * bottom tab bar (mobile); both expose the same data-testid per item.
 */
export type V2NavId = 'home' | 'inv' | 'help' | 'settings';

/** Click a top-level v2 nav item. Works on desktop rail + mobile tab bar. */
export async function navigateV2(page: Page, id: V2NavId) {
  const nav = page.getByTestId(`v2-nav-${id}`);
  await expect(nav).toBeVisible({ timeout: 5000 });
  await nav.click();
  await expect(nav).toHaveAttribute('aria-current', 'page');
}

/**
 * Start adding an item in the v2 shell.
 *
 * "+ ADD" opens the product picker first (recommended products, or a custom
 * item). Specs that fill the blank form want the custom branch.
 */
export async function startAddCustomItem(page: Page) {
  await page.getByRole('button', { name: '+ ADD' }).click();
  await page.getByRole('button', { name: /custom item/i }).click();
}

/**
 * V2 settings section ids exposed by the SettingsRail. Pass these to
 * `navigateToSettingsSection`. Old v1 ids (e.g. 'backupTransfer') no
 * longer exist — use the v2 equivalents below.
 */
export type V2SettingsSectionId =
  | 'appearance'
  | 'household'
  | 'inventorysets'
  | 'nutrition'
  | 'advanced'
  | 'notifications'
  | 'recommendations'
  | 'categories'
  | 'data'
  | 'about'
  | 'danger';

/**
 * Navigate to a section in the v2 Settings page. Ensures we are on the
 * settings route first, then clicks the SettingsRail entry which scrolls
 * the section into view.
 *
 * On mobile the rail is hidden; the function falls back to scrolling the
 * section into view via its DOM id (`sec-<sectionId>`).
 */
export async function navigateToSettingsSection(
  page: Page,
  sectionId: V2SettingsSectionId,
) {
  // Ensure we're on the settings page.
  await navigateV2(page, 'settings');

  const viewport = page.viewportSize();
  const isMobile = viewport && viewport.width < 768;
  const rail = page.getByTestId(`v2-settings-section-${sectionId}`);
  const section = page.locator(`#sec-${sectionId}`);

  if (!isMobile && (await rail.isVisible().catch(() => false))) {
    await rail.click();
    await expect(section).toBeInViewport();
    return;
  }

  // Mobile (or rail hidden): scroll the target section directly.
  await page.evaluate((id) => {
    const el = document.getElementById(`sec-${id}`);
    if (!el) throw new Error(`Settings section "sec-${id}" not found`);
    el.scrollIntoView({ block: 'start' });
  }, sectionId);
  await expect(section).toBeInViewport();
}

/**
 * Select a category in the v2 Inventory page using the filter strip's
 * category dropdown. Ensures we are on the inventory route first.
 */
export async function selectInventoryCategory(page: Page, categoryId: string) {
  await navigateV2(page, 'inv');
  // Category is picked from the rail beside the table (desktop) — the old
  // dropdown is gone. "all" is the row that clears the filter.
  const row = page.getByTestId(`v2-category-row-${categoryId}`);
  await expect(row).toBeVisible({ timeout: 5000 });
  await row.click();
  await expect(row).toHaveAttribute('aria-current', 'true');
}

/**
 * Format a Date as YYYY-MM-DD using local timezone.
 *
 * Copy of src/shared/utils/date.ts formatLocalDate — duplicated here because
 * e2e tests cannot import from src/. Keep in sync with the production version.
 */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export { expect, type Page } from '@playwright/test';
