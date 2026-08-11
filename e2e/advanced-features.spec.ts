import {
  test,
  expect,
  navigateToSettingsSection,
  waitForStoredData,
} from './fixtures';

/**
 * v2 puts the capability toggles in Settings → §5 Advanced (not §4 Nutrition).
 * They render as role="switch" with aria-label = the row's label.
 */

test.describe('Advanced Features', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  const section = async (page: import('@playwright/test').Page) => {
    await navigateToSettingsSection(page, 'advanced');
    await expect(page.getByText('ADVANCED FEATURES')).toBeVisible();
  };

  test('should enable calorie tracking', async ({ page }) => {
    await section(page);
    const toggle = page.getByRole('switch', { name: /CALORIE TRACKING/i });
    await expect(toggle).toBeVisible();
    if ((await toggle.getAttribute('aria-checked')) !== 'true') {
      await toggle.click();
    }
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  test('should enable power management', async ({ page }) => {
    await section(page);
    const toggle = page.getByRole('switch', { name: /POWER MANAGEMENT/i });
    await expect(toggle).toBeVisible();
    if ((await toggle.getAttribute('aria-checked')) !== 'true') {
      await toggle.click();
    }
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  test('should toggle calorie tracking on and off', async ({ page }) => {
    await section(page);
    const toggle = page.getByRole('switch', { name: /CALORIE TRACKING/i });
    const initial = (await toggle.getAttribute('aria-checked')) === 'true';
    await toggle.click();
    await expect(toggle).toHaveAttribute(
      'aria-checked',
      initial ? 'false' : 'true',
    );
    await toggle.click();
    await expect(toggle).toHaveAttribute(
      'aria-checked',
      initial ? 'true' : 'false',
    );
  });

  test('should persist advanced features after reload', async ({ page }) => {
    await section(page);
    const toggle = page.getByRole('switch', { name: /CALORIE TRACKING/i });
    if ((await toggle.getAttribute('aria-checked')) !== 'true') {
      await toggle.click();
    }
    await waitForStoredData(page, (raw) =>
      raw.includes('"calorieTracking":true'),
    );

    await page.reload({ waitUntil: 'domcontentloaded' });
    await section(page);
    const after = page.getByRole('switch', { name: /CALORIE TRACKING/i });
    await expect(after).toHaveAttribute('aria-checked', 'true');
  });

  test('should render the advanced section header in cockpit voice', async ({
    page,
  }) => {
    await section(page);
    await expect(page.getByText('§5')).toBeVisible();
    await expect(page.getByText('ADVANCED FEATURES')).toBeVisible();
  });

  test('reaches the advanced section on mobile, where the rail is hidden', async ({
    page,
  }) => {
    // Below 768px, navigateToSettingsSection falls back to scrolling the
    // section into view by id instead of clicking the (hidden) rail entry.
    await page.setViewportSize({ width: 375, height: 812 });
    await section(page);
    await expect(
      page.getByRole('switch', { name: /CALORIE TRACKING/i }),
    ).toBeVisible();
  });
});
