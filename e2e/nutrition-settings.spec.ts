import {
  test,
  expect,
  navigateToSettingsSection,
  waitForStoredData,
} from './fixtures';

/**
 * v2 NutritionSection uses StepperRow controls (− value +) instead of
 * free-form number inputs, and has no "Reset to defaults" button. These
 * tests verify the stepper structure + that incrementing/decrementing
 * persists, rather than free-typing arbitrary values.
 */

test.describe('Nutrition Settings', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  test('should render every nutrition stepper row', async ({ page }) => {
    await navigateToSettingsSection(page, 'nutrition');
    await expect(page.getByText('NUTRITION & REQUIREMENTS')).toBeVisible();
    await expect(page.getByText('KCAL · PERSON · DAY')).toBeVisible();
    await expect(page.getByText('WATER · PERSON · DAY')).toBeVisible();
    await expect(page.getByText('CHILDREN MULTIPLIER')).toBeVisible();
  });

  test('+ button on calories stepper increases the value', async ({ page }) => {
    await navigateToSettingsSection(page, 'nutrition');
    const inc = page.getByRole('button', {
      name: /Increase KCAL · PERSON · DAY/i,
    });
    const dec = page.getByRole('button', {
      name: /Decrease KCAL · PERSON · DAY/i,
    });
    await expect(inc).toBeVisible();
    await expect(dec).toBeVisible();

    // Step is 50 kcal. Click + twice → value increases.
    await inc.click();
    await inc.click();
    // The write is debounced, so reloading straight away can drop the second
    // click and leave the assertion racing the save.
    await waitForStoredData(page, (raw) => raw.includes('2100'));

    await page.reload({ waitUntil: 'domcontentloaded' });
    await navigateToSettingsSection(page, 'nutrition');
    // Default 2000 + (50 * 2) = 2100 — formatted with locale separator.
    await expect(page.getByText(/2\D?100/).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('+ button on water stepper increases by 0.5L', async ({ page }) => {
    await navigateToSettingsSection(page, 'nutrition');
    const inc = page.getByRole('button', {
      name: /Increase WATER · PERSON · DAY/i,
    });
    await inc.click();

    // Default 3.0 + 0.5 = 3.5
    await expect(page.getByText('3.5').first()).toBeVisible();
  });

  test('children multiplier - button decreases value', async ({ page }) => {
    await navigateToSettingsSection(page, 'nutrition');
    const dec = page.getByRole('button', {
      name: /Decrease CHILDREN MULTIPLIER/i,
    });
    await dec.click(); // 75 → 70
    await expect(page.getByText('70').first()).toBeVisible();
  });

  test('hygiene-water toggle flips state', async ({ page }) => {
    await navigateToSettingsSection(page, 'nutrition');
    const toggle = page.getByRole('switch', {
      name: /TRACK HYGIENE WATER SEPARATELY/i,
    });
    const initial = (await toggle.getAttribute('aria-checked')) === 'true';
    await toggle.click();
    const next = (await toggle.getAttribute('aria-checked')) === 'true';
    expect(next).toBe(!initial);
  });

  test('persists kcal change after reload', async ({ page }) => {
    await navigateToSettingsSection(page, 'nutrition');
    const inc = page.getByRole('button', {
      name: /Increase KCAL · PERSON · DAY/i,
    });
    await inc.click();
    await page.waitForTimeout(500);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await navigateToSettingsSection(page, 'nutrition');
    // 2000 + 50 = 2050
    await expect(page.getByText(/2\D?050/).first()).toBeVisible({
      timeout: 5000,
    });
  });
});
