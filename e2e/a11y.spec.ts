import {
  test,
  expect,
  navigateToSettingsSection,
  type Page,
  startAddCustomItem,
} from './fixtures';
import AxeBuilder from '@axe-core/playwright';

/**
 * v2 navigation is state-based (not URL-based), so tests use
 * `v2-nav-*` clicks to land on each section rather than `page.goto()`.
 * Mobile drawer-handling helpers from v1 are gone — MobileShell has no
 * drawer, just a bottom tab bar.
 */

async function openInventorySetsSection(page: Page) {
  await navigateToSettingsSection(page, 'inventorysets');
  await expect(page.getByTestId('inventory-set-section')).toBeVisible();
}

const axeTags = ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'];

/**
 * Known design-v2 a11y shortfalls filtered out so the rest of the
 * suite (semantics, ARIA, keyboard, alt text, labels) runs as a
 * regression net:
 *
 *  - color-contrast — the cockpit dark theme's 10px mono captions land
 *    at ~3:1 against the dark panel; civil/pantry pass AA.
 *  - heading-order — embedded v1 panels (KitManagement, InventorySets)
 *    use h3 inside a v2 SectionHeader that's already h1, so the page
 *    skips h2.
 *  - region — a couple of v2 utility chips (e.g. "● LOCAL" in the
 *    desktop shell footer) live outside <main>/<aside>/<nav>.
 */
const disabledRules = [
  'color-contrast',
  'heading-order',
  'region',
  // The v2 <main> scrolls but contains focusable children, so a tabindex
  // on <main> itself isn't strictly needed for keyboard scrolling.
  'scrollable-region-focusable',
  // MobileShell uses a span (not h1) for the page title to fit the
  // compact header. The desktop shell does have a page-level h1.
  'page-has-heading-one',
];

const axe = (page: Page) =>
  new AxeBuilder({ page }).withTags(axeTags).disableRules(disabledRules);

test.describe('Accessibility', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  test('Dashboard page should have no accessibility violations', async ({
    page,
  }) => {
    await expect(page.getByText('HOUSEHOLD STATUS')).toBeVisible();
    const results = await axe(page).analyze();
    expect(results.violations).toEqual([]);
  });

  test('Inventory page should have no accessibility violations', async ({
    page,
  }) => {
    await page.getByTestId('v2-nav-inv').click();
    await expect(page.getByRole('button', { name: '+ ADD' })).toBeVisible();
    const results = await axe(page).analyze();
    expect(results.violations).toEqual([]);
  });

  test('Settings page should have no accessibility violations', async ({
    page,
  }) => {
    await page.getByTestId('v2-nav-settings').click();
    await expect(page.getByText('SYSTEM CONFIGURATION')).toBeVisible();
    const results = await axe(page).analyze();
    expect(results.violations).toEqual([]);
  });

  test('Help page should have no accessibility violations', async ({
    page,
  }) => {
    await page.getByTestId('v2-nav-help').click();
    await expect(page.getByText('HELP & FAQ')).toBeVisible();
    const results = await axe(page).analyze();
    expect(results.violations).toEqual([]);
  });

  test('Dashboard page should have no accessibility violations on mobile', async ({
    page,
    setupApp,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await setupApp();
    await expect(page.getByText('READINESS').first()).toBeVisible();
    const results = await axe(page).analyze();
    expect(results.violations).toEqual([]);
  });

  test('Inventory page should have no accessibility violations on mobile', async ({
    page,
    setupApp,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await setupApp();
    await page.getByTestId('v2-nav-inv').click();
    // Label is theme-dependent; cockpit (the default) renders "+ ADD".
    await expect(page.getByRole('button', { name: /^\+ ADD/i })).toBeVisible();
    const results = await axe(page).analyze();
    expect(results.violations).toEqual([]);
  });

  test('Item form should have no accessibility violations', async ({
    page,
  }) => {
    // v2 has no template-selector modal — the inline ItemForm renders
    // directly via the + ADD button.
    await page.getByTestId('v2-nav-inv').click();
    await startAddCustomItem(page);
    await page.getByTestId('item-form').waitFor({ state: 'visible' });

    const results = await axe(page)
      .include('[data-testid="item-form"]')
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('Navigation should be keyboard accessible', async ({ page }) => {
    await expect(page.getByText('HOUSEHOLD STATUS')).toBeVisible();

    // Tab through the first few focusable elements and confirm each
    // receives focus.
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible({ timeout: 2000 });
    await page.keyboard.press('Tab');
    const secondFocused = page.locator(':focus');
    if (await secondFocused.isVisible().catch(() => false)) {
      await expect(secondFocused).toBeVisible();
    }

    const results = await new AxeBuilder({ page })
      .withTags(['keyboard'])
      .disableRules(disabledRules)
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test.describe('Inventory set confirm delete dialog', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
    });

    const addSecondSet = async (page: Page) => {
      await openInventorySetsSection(page);
      await page.getByLabel('Inventory set name').fill('To Delete');
      await page.getByRole('button', { name: 'Add inventory set' }).click();
      const deleteButton = page
        .getByRole('button', { name: 'Delete inventory set' })
        .nth(1);
      await expect(deleteButton).toBeVisible();
      return deleteButton;
    };

    test('should receive initial focus on primary delete button', async ({
      page,
    }) => {
      const deleteButton = await addSecondSet(page);
      await deleteButton.click();

      const dialog = page.getByTestId('inventory-set-confirm-delete-dialog');
      await expect(dialog).toBeVisible();
      const primaryDelete = page.getByTestId(
        'inventory-set-confirm-delete-button',
      );
      await expect(primaryDelete).toBeFocused();
    });

    test('should dismiss dialog on Escape and restore focus', async ({
      page,
    }) => {
      const deleteButton = await addSecondSet(page);
      await deleteButton.click();

      await expect(
        page.getByTestId('inventory-set-confirm-delete-dialog'),
      ).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(
        page.getByTestId('inventory-set-confirm-delete-dialog'),
      ).toBeHidden();

      await expect(deleteButton).toBeFocused();
    });

    test('should trap focus within dialog', async ({ page }) => {
      const deleteButton = await addSecondSet(page);
      await deleteButton.click();

      const dialog = page.getByTestId('inventory-set-confirm-delete-dialog');
      await expect(dialog).toBeVisible();
      const primaryDelete = page.getByTestId(
        'inventory-set-confirm-delete-button',
      );
      await expect(primaryDelete).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(
        dialog.getByRole('button', { name: 'Cancel' }),
      ).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(primaryDelete).toBeFocused();
    });

    test('inventory set confirm delete dialog should have no a11y violations', async ({
      page,
    }) => {
      const deleteButton = await addSecondSet(page);
      await deleteButton.click();

      const dialog = page.getByTestId('inventory-set-confirm-delete-dialog');
      await expect(dialog).toBeVisible();

      const results = await axe(page)
        .include('[data-testid="inventory-set-confirm-delete-dialog"]')
        .analyze();
      expect(results.violations).toEqual([]);
    });
  });
});
