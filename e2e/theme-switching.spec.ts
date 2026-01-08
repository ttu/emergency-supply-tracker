import { test, expect } from './fixtures';

test.describe('Theme Switching', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  test('should change theme in settings', async ({ page }) => {
    await page.click('text=Settings');

    // Find theme selector
    const themeSelect = page.locator('#theme-select');
    await expect(themeSelect).toBeVisible();

    // Change theme to dark
    await themeSelect.selectOption('dark');

    // Verify theme is applied to document
    const themeAttribute = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    expect(themeAttribute).toBe('dark');
  });

  test('should persist theme after page reload', async ({ page }) => {
    await page.click('text=Settings');

    // Change theme to midnight
    const themeSelect = page.locator('#theme-select');
    await themeSelect.selectOption('midnight');

    // Verify theme is set
    let themeAttribute = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    expect(themeAttribute).toBe('midnight');

    // Wait for settings to save (localStorage update)
    await page.waitForTimeout(1000);

    // Reload page
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Verify theme persisted on document
    themeAttribute = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    expect(themeAttribute).toBe('midnight');

    // Verify theme selector shows correct value
    await page.click('text=Settings');
    await page.waitForLoadState('networkidle');
    const themeSelectAfterReload = page.locator('#theme-select');
    // Wait for selector to be visible and have the value
    await expect(themeSelectAfterReload).toBeVisible();
    await expect(themeSelectAfterReload).toHaveValue('midnight', {
      timeout: 5000,
    });
  });

  test('should apply theme immediately without reload', async ({ page }) => {
    await page.click('text=Settings');

    const themeSelect = page.locator('#theme-select');

    // Test multiple themes
    const themes = [
      'light',
      'dark',
      'ocean',
      'sunset',
      'forest',
      'lavender',
      'minimal',
    ];

    for (const theme of themes) {
      await themeSelect.selectOption(theme);

      // Verify theme is applied immediately
      const themeAttribute = await page.evaluate(
        () => document.documentElement.dataset.theme,
      );
      expect(themeAttribute).toBe(theme);
    }
  });

  test('should toggle high contrast mode', async ({ page }) => {
    await page.click('text=Settings');

    // Find high contrast checkbox
    const highContrastCheckbox = page.locator('#high-contrast-toggle');
    await expect(highContrastCheckbox).toBeVisible();

    // Toggle high contrast
    const initialState = await highContrastCheckbox.isChecked();
    await highContrastCheckbox.click();

    // Verify state changed
    const newState = await highContrastCheckbox.isChecked();
    expect(newState).toBe(!initialState);

    // Verify high contrast attribute is set
    const highContrastAttribute = await page.evaluate(
      () => document.documentElement.dataset.highContrast,
    );
    expect(highContrastAttribute).toBe(newState ? 'true' : 'false');
  });

  test('should persist high contrast mode after reload', async ({ page }) => {
    await page.click('text=Settings');

    const highContrastCheckbox = page.locator('#high-contrast-toggle');
    const initialState = await highContrastCheckbox.isChecked();

    // Toggle if not already enabled
    if (!initialState) {
      await highContrastCheckbox.click();
    }

    // Reload page
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Verify high contrast persisted
    await page.click('text=Settings');
    const highContrastCheckboxAfterReload = page.locator(
      '#high-contrast-toggle',
    );
    const stateAfterReload = await highContrastCheckboxAfterReload.isChecked();
    expect(stateAfterReload).toBe(true);
  });

  test('should apply theme to all pages', async ({ page }) => {
    await page.click('text=Settings');

    // Change theme to forest
    const themeSelect = page.locator('#theme-select');
    await themeSelect.selectOption('forest');

    // Navigate to different pages and verify theme persists
    await page.click('text=Dashboard');
    let themeAttribute = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    expect(themeAttribute).toBe('forest');

    await page.click('text=Inventory');
    themeAttribute = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    expect(themeAttribute).toBe('forest');

    await page.click('text=Settings');
    themeAttribute = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    expect(themeAttribute).toBe('forest');
  });
});
