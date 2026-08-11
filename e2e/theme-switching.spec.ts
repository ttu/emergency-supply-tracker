import {
  test,
  expect,
  navigateToSettingsSection,
  waitForStoredData,
} from './fixtures';

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

    const themeAttribute = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    expect(themeAttribute).toBe('midnight');

    await waitForStoredData(page, (raw) => raw.includes('"theme":"midnight"'));
    await page.reload({ waitUntil: 'domcontentloaded' });

    // The theme applies via an effect once the reloaded app has read
    // storage back, not the instant the page finishes loading.
    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.theme))
      .toBe('midnight');
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

  test('should apply a v2 theme to every v2 page on a phone', async ({
    page,
  }) => {
    // Below 768px the top-nav rail becomes a bottom tab bar; the same
    // data-testids drive both, but this is the only coverage that actually
    // exercises the mobile shell rather than assuming the desktop one
    // generalizes.
    await page.setViewportSize({ width: 375, height: 812 });
    await navigateToSettingsSection(page, 'appearance');
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
  test('high contrast changes the palette on every theme', async ({ page }) => {
    // The high-contrast block only overrode the base :root values, so any
    // theme that set the same variables won it back on equal specificity —
    // the toggle did nothing on every theme except light and dark.
    const themes = [
      'light',
      'dark',
      'midnight',
      'ocean',
      'sunset',
      'forest',
      'lavender',
      'minimal',
      'cockpit',
      'civil',
      'pantry',
    ];

    const inert = await page.evaluate((themeList) => {
      const root = document.documentElement;
      const probe = () => {
        const cs = getComputedStyle(root);
        return [
          '--color-text',
          '--color-border',
          '--color-critical',
          '--color-crit',
          '--color-panel',
          '--color-rule',
        ]
          .map((name) => cs.getPropertyValue(name).trim())
          .join('|');
      };
      const failures: string[] = [];
      for (const theme of themeList) {
        root.setAttribute('data-theme', theme);
        root.setAttribute('data-high-contrast', 'true');
        const on = probe();
        root.setAttribute('data-high-contrast', 'false');
        const off = probe();
        if (on === off) failures.push(theme);
      }
      return failures;
    }, themes);

    expect(inert).toEqual([]);
  });
});
