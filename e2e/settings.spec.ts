import {
  test,
  expect,
  navigateToSettingsSection,
  waitForStoredData,
} from './fixtures';

/**
 * The v2 Settings page exposes 11 sectioned panels driven by the
 * SettingsRail. Sub-tests here verify the major sections render +
 * the most interactive controls (language, household stepper,
 * about links). Theme + high-contrast are covered in
 * theme-switching.spec.ts; advanced toggles in advanced-features.spec.ts;
 * nutrition in nutrition-settings.spec.ts.
 */

test.describe('Settings', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  test('should display the settings page with hero + rail', async ({
    page,
  }) => {
    await page.getByTestId('v2-nav-settings').click();
    await expect(page.getByText('SYSTEM CONFIGURATION')).toBeVisible();
    // Rail exposes the 11 section buttons by data-testid.
    await expect(
      page.getByTestId('v2-settings-section-appearance'),
    ).toBeVisible();
    await expect(
      page.getByTestId('v2-settings-section-household'),
    ).toBeVisible();
    await expect(page.getByTestId('v2-settings-section-danger')).toBeVisible();
  });

  test('should change language', async ({ page }) => {
    await navigateToSettingsSection(page, 'appearance');
    // v2 language picker is two role="button" cards (EN / FI), not a select.
    await page.getByRole('button', { name: 'FI Suomi' }).click();
    // After switching to FI, the SETTINGS nav button keeps its cockpit label
    // (voice strings are theme-driven, not i18n keys), so just verify the
    // language card is now aria-pressed.
    await expect(
      page.getByRole('button', { name: 'FI Suomi' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('should update household configuration via stepper', async ({
    page,
  }) => {
    await navigateToSettingsSection(page, 'household');
    await expect(page.getByText('PROFILE · §2.1')).toBeVisible();
    const inc = page.getByRole('button', { name: /Increase ADULTS/ });
    await inc.click(); // 2 → 3
    await waitForStoredData(page, (raw) => raw.includes('"adults":3'));

    await page.getByTestId('v2-nav-home').click();
    await navigateToSettingsSection(page, 'household');
    // Scoped to the ADULTS row: a page-wide getByText('3') also matches the
    // other stepper values, so it passed whether or not adults persisted.
    const adultsValue = page
      .getByRole('button', { name: /Decrease ADULTS/ })
      .locator('xpath=following-sibling::span[1]');
    await expect(adultsValue).toHaveText(/3/);
  });

  test('should expose GitHub + bug-tracker links in About section', async ({
    page,
  }) => {
    await navigateToSettingsSection(page, 'about');
    await expect(page.getByText('§10')).toBeVisible();
    const github = page.getByRole('link', { name: /GITHUB/ });
    await expect(github).toHaveAttribute('target', '_blank');
    await expect(github).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(page.getByRole('link', { name: /BUG TRACKER/ })).toBeVisible();
  });

  test('should render the Recommendations section', async ({ page }) => {
    await navigateToSettingsSection(page, 'recommendations');
    await expect(page.getByText('§7', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'RECOMMENDATIONS', exact: true }),
    ).toBeVisible();
  });

  test('should render the Danger Zone section', async ({ page }) => {
    await navigateToSettingsSection(page, 'danger');
    await expect(page.getByText('§11')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'DANGER ZONE' }),
    ).toBeVisible();
  });

  test('SettingsRail navigation marks active section', async ({ page }) => {
    await page.getByTestId('v2-nav-settings').click();
    const data = page.getByTestId('v2-settings-section-data');
    await data.click();
    // Active section gets aria-current="true"
    await expect(data).toHaveAttribute('aria-current', 'true');
  });
});
