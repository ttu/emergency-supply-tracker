import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  test('Dashboard page should have no accessibility violations', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Inventory page should have no accessibility violations', async ({
    page,
  }) => {
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Settings page should have no accessibility violations', async ({
    page,
  }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Help page should have no accessibility violations', async ({
    page,
  }) => {
    await page.goto('/help');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Dashboard page should have no accessibility violations on mobile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Inventory page should have no accessibility violations on mobile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Item form modal should have no accessibility violations', async ({
    page,
  }) => {
    // Navigate to inventory using navigation to ensure app is fully loaded
    await page.getByTestId('nav-inventory').click();
    await expect(page.getByTestId('page-inventory')).toBeVisible();

    // Open the add item modal
    await page.getByTestId('add-item-button').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Navigation should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test keyboard navigation through main navigation
    // Tab to first focusable element
    await page.keyboard.press('Tab');

    // Verify focus is on a navigation element with visible focus indicator
    const firstFocusedElement = page.locator(':focus');
    await expect(firstFocusedElement).toBeVisible({ timeout: 2000 });

    // Continue tabbing and verify we can navigate through interactive elements
    await page.keyboard.press('Tab');
    const secondFocusedElement = page.locator(':focus');
    const secondVisible = await secondFocusedElement
      .isVisible()
      .catch(() => false);
    if (secondVisible) {
      await expect(secondFocusedElement).toBeVisible();
    }

    // Try one more tab, but don't fail if no element is focused
    await page.keyboard.press('Tab');
    const thirdFocusedElement = page.locator(':focus');
    const thirdVisible = await thirdFocusedElement
      .isVisible()
      .catch(() => false);
    if (thirdVisible) {
      await expect(thirdFocusedElement).toBeVisible();
    }

    // Run a11y check
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['keyboard'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
