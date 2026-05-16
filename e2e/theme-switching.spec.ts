import { test, expect, navigateToSettingsSection } from './fixtures';

test.describe('Theme Switching', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  test('should change theme via classic theme switcher', async ({ page }) => {
    await navigateToSettingsSection(page, 'appearance');

    // ClassicThemeSwitcher is the escape-hatch for v1 themes.
    const classicSelect = page.locator('#classic-theme-select');
    await expect(classicSelect).toBeVisible();
    await classicSelect.selectOption('dark');

    const themeAttribute = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    expect(themeAttribute).toBe('dark');
  });

  test('should persist classic theme after page reload', async ({ page }) => {
    await navigateToSettingsSection(page, 'appearance');

    const classicSelect = page.locator('#classic-theme-select');
    await classicSelect.selectOption('midnight');

    let themeAttribute = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    expect(themeAttribute).toBe('midnight');

    await page.waitForTimeout(1000);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    themeAttribute = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    expect(themeAttribute).toBe('midnight');
  });

  test('should apply a classic theme immediately without reload', async ({
    page,
  }) => {
    await navigateToSettingsSection(page, 'appearance');
    const classicSelect = page.locator('#classic-theme-select');

    // Each pick drops out of v2 → into v1, so we only verify the first switch.
    // Looping classic themes here would require re-entering v2 between picks.
    await classicSelect.selectOption('forest');
    const themeAttribute = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    expect(themeAttribute).toBe('forest');
  });

  test('should switch between v2 themes via ThemePicker', async ({ page }) => {
    await navigateToSettingsSection(page, 'appearance');

    const picker = page.getByRole('radiogroup', { name: 'Theme' });
    await expect(picker).toBeVisible();

    // Switch to civil
    await picker.getByRole('radio').nth(1).click();
    let themeAttribute = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    expect(themeAttribute).toBe('civil');

    // Switch to pantry
    await picker.getByRole('radio').nth(2).click();
    themeAttribute = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    expect(themeAttribute).toBe('pantry');
  });

  test('should toggle high contrast mode', async ({ page }) => {
    await navigateToSettingsSection(page, 'appearance');

    const highContrast = page.getByRole('switch', {
      name: /HIGH CONTRAST MODE/i,
    });
    await expect(highContrast).toBeVisible();

    const initial =
      (await highContrast.getAttribute('aria-checked')) === 'true';
    await highContrast.click();

    const newState =
      (await highContrast.getAttribute('aria-checked')) === 'true';
    expect(newState).toBe(!initial);

    const attr = await page.evaluate(
      () => document.documentElement.dataset.highContrast,
    );
    expect(attr).toBe(newState ? 'true' : 'false');
  });

  test('should persist high contrast mode after reload', async ({ page }) => {
    await navigateToSettingsSection(page, 'appearance');

    const highContrast = page.getByRole('switch', {
      name: /HIGH CONTRAST MODE/i,
    });
    if ((await highContrast.getAttribute('aria-checked')) !== 'true') {
      await highContrast.click();
    }

    await page.reload({ waitUntil: 'domcontentloaded' });

    await navigateToSettingsSection(page, 'appearance');
    const after = page.getByRole('switch', { name: /HIGH CONTRAST MODE/i });
    expect(await after.getAttribute('aria-checked')).toBe('true');
  });

  test('should apply a v2 theme to every v2 page', async ({ page }) => {
    await navigateToSettingsSection(page, 'appearance');
    // Switch to civil (still a v2 theme — shell stays mounted).
    await page
      .getByRole('radiogroup', { name: 'Theme' })
      .getByRole('radio')
      .nth(1)
      .click();

    for (const id of ['home', 'inv', 'settings'] as const) {
      await page.getByTestId(`v2-nav-${id}`).click();
      expect(
        await page.evaluate(() => document.documentElement.dataset.theme),
      ).toBe('civil');
    }
  });
});
