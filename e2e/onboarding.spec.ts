import { test, expect, APP_URL } from './fixtures';
import type { RootStorage } from '../src/shared/types';

/**
 * Design v2 onboarding is a six-step flow plus a completion screen:
 *   1 Welcome / Language
 *   2 Theme picker
 *   3 Preset (single / couple / family / custom)
 *   4 Household profile (steppers)
 *   5 Recommendation kit
 *   6 Quick setup (the starting checklist)
 *   — Complete
 *
 * Each step renders the shared OnboardLayout — STEP NN / 06 header + a
 * "CONTINUE →" / "BACK" footer (cockpit voice). Quick setup replaces CONTINUE
 * with "ADD ALL ITEMS →", and the completion screen with "OPEN OVERVIEW →".
 */

const clearAndReload = async (page: import('@playwright/test').Page) => {
  await page.goto(APP_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
};

const continueButton = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: /CONTINUE →/ });

/** Quick setup ships collapsed; the per-line controls need it opened. */
const openChecklist = (page: import('@playwright/test').Page) =>
  page.getByTestId('v2-quick-setup-details').click();

/**
 * Click CONTINUE from step 1 (Welcome) through to step 6 (Quick Setup),
 * confirming the expected STEP marker after each click rather than firing
 * five clicks blind and hoping the flow kept up.
 */
const advanceToQuickSetup = async (page: import('@playwright/test').Page) => {
  for (let step = 2; step <= 6; step++) {
    await continueButton(page).click();
    await expect(
      page.getByText(new RegExp(`STEP 0${step} / 06`)),
    ).toBeVisible();
  }
};

test.describe('Onboarding Flow', () => {
  test('should show onboarding for first-time users', async ({ page }) => {
    await clearAndReload(page);
    await expect(page.getByText(/STEP 01 \/ 06/)).toBeVisible();
    await expect(continueButton(page)).toBeVisible();
  });

  test('should complete the full v2 onboarding flow', async ({ page }) => {
    await clearAndReload(page);

    await continueButton(page).click(); // 1 → 2
    await expect(page.getByText(/STEP 02 \/ 06/)).toBeVisible();
    await continueButton(page).click(); // 2 → 3
    await expect(page.getByText(/STEP 03 \/ 06/)).toBeVisible();

    await page.getByRole('button', { name: /P-02/ }).click(); // couple
    await continueButton(page).click(); // 3 → 4
    await expect(page.getByText(/STEP 04 \/ 06/)).toBeVisible();

    await continueButton(page).click(); // 4 → 5
    await expect(page.getByText(/STEP 05 \/ 06/)).toBeVisible();
    await expect(page.getByTestId('v2-kit-72tuntia-standard')).toBeVisible();

    await continueButton(page).click(); // 5 → 6
    await expect(page.getByText(/STEP 06 \/ 06/)).toBeVisible();

    await page.getByRole('button', { name: /ADD ALL ITEMS →/ }).click();
    await expect(page.getByText('PROVISIONING COMPLETE')).toBeVisible();

    await page.getByRole('button', { name: /OPEN OVERVIEW →/ }).click();
    await expect(page.getByText('HOUSEHOLD STATUS')).toBeVisible({
      timeout: 5000,
    });
  });

  test('the finished inventory holds what quick setup offered', async ({
    page,
  }) => {
    await clearAndReload(page);
    await advanceToQuickSetup(page);

    await page.getByRole('button', { name: /ADD ALL ITEMS →/ }).click();
    await page.getByRole('button', { name: /OPEN OVERVIEW →/ }).click();
    await expect(page.getByText('HOUSEHOLD STATUS')).toBeVisible();

    const itemCount = await page.evaluate(() => {
      const root = JSON.parse(
        localStorage.getItem('emergencySupplyTracker') ?? '{}',
      ) as Partial<RootStorage>;
      const sets = Object.values(root.inventorySets ?? {}) as {
        items?: unknown[];
      }[];
      return sets[0]?.items?.length ?? 0;
    });
    expect(itemCount).toBeGreaterThan(0);
  });

  test('skipping quick setup finishes with an empty inventory', async ({
    page,
  }) => {
    await clearAndReload(page);
    await advanceToQuickSetup(page);

    await page.getByRole('button', { name: /SKIP FOR NOW/ }).click();
    await page.getByRole('button', { name: /OPEN OVERVIEW →/ }).click();
    await expect(page.getByText('HOUSEHOLD STATUS')).toBeVisible();

    const itemCount = await page.evaluate(() => {
      const root = JSON.parse(
        localStorage.getItem('emergencySupplyTracker') ?? '{}',
      ) as Partial<RootStorage>;
      const sets = Object.values(root.inventorySets ?? {}) as {
        items?: unknown[];
      }[];
      return sets[0]?.items?.length ?? 0;
    });
    expect(itemCount).toBe(0);
  });

  test('should allow going back through onboarding steps', async ({ page }) => {
    await clearAndReload(page);

    await continueButton(page).click(); // → 2
    await continueButton(page).click(); // → 3
    await expect(page.getByText(/STEP 03 \/ 06/)).toBeVisible();

    await page.getByRole('button', { name: 'BACK', exact: true }).click();
    await expect(page.getByText(/STEP 02 \/ 06/)).toBeVisible();
  });

  test('should let user pick the family preset', async ({ page }) => {
    await clearAndReload(page);
    await continueButton(page).click(); // 1→2
    await continueButton(page).click(); // 2→3

    await page.getByRole('button', { name: /P-03/ }).click(); // family
    await continueButton(page).click(); // 3→4

    await expect(
      page
        .getByText('PROFILE · §2.1')
        .or(page.getByText('CONFIRM HOUSEHOLD PARAMETERS')),
    ).toBeVisible();
  });

  test('quick setup untick drops the product from the seeded inventory', async ({
    page,
  }) => {
    await clearAndReload(page);
    await advanceToQuickSetup(page);

    await openChecklist(page);
    const bottledWater = page.getByTestId('v2-quick-setup-item-bottled-water');
    await expect(bottledWater).toBeChecked();
    await bottledWater.uncheck();
    await expect(bottledWater).not.toBeChecked();

    await page.getByRole('button', { name: /ADD SELECTED →/ }).click();
    await page.getByRole('button', { name: /OPEN OVERVIEW →/ }).click();
    await expect(page.getByText('HOUSEHOLD STATUS')).toBeVisible();

    const hasWater = await page.evaluate(() => {
      const root = JSON.parse(
        localStorage.getItem('emergencySupplyTracker') ?? '{}',
      ) as Partial<RootStorage>;
      const sets = Object.values(root.inventorySets ?? {}) as {
        items?: { itemType?: string }[];
      }[];
      return (sets[0]?.items ?? []).some((i) => i.itemType === 'bottled-water');
    });
    expect(hasWater).toBe(false);
  });

  test('marking a product owned seeds it stocked rather than at zero', async ({
    page,
  }) => {
    await clearAndReload(page);
    await advanceToQuickSetup(page);

    await openChecklist(page);
    await page.getByTestId('v2-quick-setup-owned-bottled-water').click();
    await page.getByRole('button', { name: /ADD ALL ITEMS →/ }).click();
    await page.getByRole('button', { name: /OPEN OVERVIEW →/ }).click();
    await expect(page.getByText('HOUSEHOLD STATUS')).toBeVisible();

    const quantities = await page.evaluate(() => {
      const root = JSON.parse(
        localStorage.getItem('emergencySupplyTracker') ?? '{}',
      ) as Partial<RootStorage>;
      const sets = Object.values(root.inventorySets ?? {}) as {
        items?: { itemType?: string; quantity?: number }[];
      }[];
      const items = sets[0]?.items ?? [];
      return {
        water: items.find((i) => i.itemType === 'bottled-water')?.quantity ?? 0,
        others: items
          .filter((i) => i.itemType !== 'bottled-water')
          .every((i) => i.quantity === 0),
      };
    });
    expect(quantities.water).toBeGreaterThan(0);
    expect(quantities.others).toBe(true);
  });

  test('the checklist stays collapsed until asked', async ({ page }) => {
    await clearAndReload(page);
    await advanceToQuickSetup(page);

    // 70-odd rows of things already agreed to is a wall to scroll past.
    await expect(
      page.getByTestId('v2-quick-setup-item-bottled-water'),
    ).toHaveCount(0);
    await expect(page.getByTestId('v2-quick-setup-select-all')).toHaveCount(0);

    await openChecklist(page);
    await expect(
      page.getByTestId('v2-quick-setup-item-bottled-water'),
    ).toBeVisible();
    await expect(page.getByTestId('v2-quick-setup-select-all')).toBeVisible();
  });

  test('demo data can be taken from the preset step', async ({ page }) => {
    await clearAndReload(page);
    await continueButton(page).click(); // → theme
    await continueButton(page).click(); // → preset

    await page.getByTestId('v2-try-demo-data').click();
    await expect(page.getByText('HOUSEHOLD STATUS')).toBeVisible({
      timeout: 5000,
    });

    const demo = await page.evaluate(() => {
      const root = JSON.parse(
        localStorage.getItem('emergencySupplyTracker') ?? '{}',
      ) as Partial<RootStorage>;
      const sets = Object.values(root.inventorySets ?? {}) as {
        items?: { quantity?: number }[];
        household?: { children?: number };
      }[];
      return {
        children: sets[0]?.household?.children,
        stocked: (sets[0]?.items ?? []).some((i) => (i.quantity ?? 0) > 0),
      };
    });
    expect(demo.children).toBe(2);
    expect(demo.stocked).toBe(true);
  });

  test('the preset step offers a backup import', async ({ page }) => {
    await clearAndReload(page);
    await continueButton(page).click();
    await continueButton(page).click();

    // Someone who already has a backup should not have to answer the
    // questionnaire first.
    await expect(page.getByTestId('v2-import-backup')).toBeVisible();
    await expect(page.getByTestId('v2-import-file-input')).toHaveAttribute(
      'accept',
      'application/json,.json',
    );
  });

  test('the quick-setup list is reachable on a phone', async ({ page }) => {
    // The v2 themes lock document scrolling for the app shells; onboarding
    // runs outside them, so it has to scroll itself or the 70-row checklist
    // is unreachable below the fold.
    await page.setViewportSize({ width: 390, height: 844 });
    await clearAndReload(page);
    await advanceToQuickSetup(page);
    // Open the checklist — collapsed it fits on screen and has nothing to
    // scroll, which is not what this test is about.
    await openChecklist(page);

    const layout = page.getByTestId('v2-onboard-layout');
    const scrolled = await layout.evaluate((el) => {
      el.scrollTop = 10_000;
      return { top: el.scrollTop, max: el.scrollHeight - el.clientHeight };
    });
    expect(scrolled.max).toBeGreaterThan(0);
    expect(scrolled.top).toBe(scrolled.max);

    // …and nothing spills sideways.
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });

  test('the side panel stacks into the flow on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await clearAndReload(page);

    // Step 1's OUTPUTS panel is a second column on a desktop; on a phone that
    // column sat half off the screen.
    await expect(page.locator('aside')).toHaveCount(0);
    await expect(page.getByText('BASELINE PROCUREMENT LIST')).toBeVisible();
  });

  test('should not show onboarding for returning users', async ({
    setupApp,
    page,
  }) => {
    await setupApp();
    await expect(page.getByText('HOUSEHOLD STATUS')).toBeVisible();
    await expect(page.getByText(/STEP 01 \/ 06/)).not.toBeVisible();
  });
});
