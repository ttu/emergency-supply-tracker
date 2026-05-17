import { test, expect } from './fixtures';

/**
 * Design v2 onboarding is a six-step flow:
 *   1 Welcome / Language
 *   2 Theme picker
 *   3 Preset (single / couple / family / custom)
 *   4 Household profile (steppers)
 *   5 Items (10-row category toggle)
 *   6 Complete
 *
 * Each step renders the shared OnboardLayout — STEP NN / 05 header + a
 * "CONTINUE →" / "BACK" footer (cockpit voice). The last step shows
 * "OPEN OVERVIEW →" instead of CONTINUE.
 */

const clearAndReload = async (page: import('@playwright/test').Page) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
};

test.describe('Onboarding Flow', () => {
  test('should show onboarding for first-time users', async ({ page }) => {
    await clearAndReload(page);
    await expect(page.getByText(/STEP 01 \/ 05/)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /CONTINUE →/ }),
    ).toBeVisible();
  });

  test('should complete the full v2 onboarding flow', async ({ page }) => {
    await clearAndReload(page);

    // Step 1 → 2
    await page.getByRole('button', { name: /CONTINUE →/ }).click();
    await expect(page.getByText(/STEP 02 \/ 05/)).toBeVisible();
    // Step 2 → 3
    await page.getByRole('button', { name: /CONTINUE →/ }).click();
    await expect(page.getByText(/STEP 03 \/ 05/)).toBeVisible();
    // Pick couple preset (P-02) then advance
    await page.getByRole('button', { name: /P-02/ }).click();
    await page.getByRole('button', { name: /CONTINUE →/ }).click();
    await expect(page.getByText(/STEP 04 \/ 05/)).toBeVisible();
    // Household → items
    await page.getByRole('button', { name: /CONTINUE →/ }).click();
    await expect(page.getByText(/STEP 05 \/ 05/)).toBeVisible();
    // Commit baseline
    await page.getByRole('button', { name: /COMMIT BASELINE →/ }).click();
    await expect(page.getByText('PROVISIONING COMPLETE')).toBeVisible();
    // Open dashboard
    await page.getByRole('button', { name: /OPEN OVERVIEW →/ }).click();
    await expect(page.getByText('HOUSEHOLD STATUS')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should allow going back through onboarding steps', async ({ page }) => {
    await clearAndReload(page);

    await page.getByRole('button', { name: /CONTINUE →/ }).click(); // → 2
    await page.getByRole('button', { name: /CONTINUE →/ }).click(); // → 3
    await expect(page.getByText(/STEP 03 \/ 05/)).toBeVisible();

    await page.getByRole('button', { name: 'BACK' }).click();
    await expect(page.getByText(/STEP 02 \/ 05/)).toBeVisible();
  });

  test('should let user pick the family preset', async ({ page }) => {
    await clearAndReload(page);
    await page.getByRole('button', { name: /CONTINUE →/ }).click(); // 1→2
    await page.getByRole('button', { name: /CONTINUE →/ }).click(); // 2→3

    await page.getByRole('button', { name: /P-03/ }).click(); // family
    await page.getByRole('button', { name: /CONTINUE →/ }).click(); // 3→4

    // Household step shows the family numbers (adults=2, children=2).
    await expect(
      page
        .getByText('PROFILE · §2.1')
        .or(page.getByText('CONFIRM HOUSEHOLD PARAMETERS')),
    ).toBeVisible();
  });

  test('should toggle categories at step 5', async ({ page }) => {
    await clearAndReload(page);
    // Skip 1→2→3→4→5
    await page.getByRole('button', { name: /CONTINUE →/ }).click();
    await page.getByRole('button', { name: /CONTINUE →/ }).click();
    await page.getByRole('button', { name: /CONTINUE →/ }).click();
    await page.getByRole('button', { name: /CONTINUE →/ }).click();
    await expect(page.getByText(/STEP 05 \/ 05/)).toBeVisible();

    // 9 of 10 enabled by default (pets is opt-in).
    await expect(page.getByText(/CATEGORY ENABLEMENT · 9 \/ 10/)).toBeVisible();

    // Toggle FUD off → count becomes 8.
    await page.getByRole('button', { name: /FUD/ }).click();
    await expect(page.getByText(/CATEGORY ENABLEMENT · 8 \/ 10/)).toBeVisible();
  });

  test('should not show onboarding for returning users', async ({
    setupApp,
    page,
  }) => {
    await setupApp();
    await expect(page.getByText('HOUSEHOLD STATUS')).toBeVisible();
    await expect(page.getByText(/STEP 01 \/ 05/)).not.toBeVisible();
  });
});
