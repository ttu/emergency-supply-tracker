import {
  test,
  expect,
  setAppStorage,
  navigateToSettingsSection,
  toLocalDateString,
} from './fixtures';
import {
  createMockAppData,
  createMockInventoryItem,
} from '../src/shared/utils/test/factories';
import {
  createCategoryId,
  createQuantity,
  createDateOnly,
} from '../src/shared/types';

const v2Settings = {
  onboardingCompleted: true as const,
  language: 'en' as const,
  theme: 'cockpit' as const,
  highContrast: false,
  advancedFeatures: {
    calorieTracking: false,
    powerManagement: false,
    waterTracking: false,
  },
};

const makeExpired = (name: string) => {
  const past = new Date();
  past.setDate(past.getDate() - 5);
  return createMockInventoryItem({
    name,
    categoryId: createCategoryId('food'),
    quantity: createQuantity(5),
    unit: 'pieces',
    neverExpires: false,
    expirationDate: createDateOnly(toLocalDateString(past)),
  });
};

async function seed(
  page: import('@playwright/test').Page,
  items: ReturnType<typeof createMockInventoryItem>[],
) {
  await page.goto('/');
  await setAppStorage(page, createMockAppData({ settings: v2Settings, items }));
  await page.reload({ waitUntil: 'domcontentloaded' });
}

test.describe('Hidden Alerts Management', () => {
  test('should hide alert from the v2 Alerts page', async ({ page }) => {
    await seed(page, [makeExpired('Expired Item')]);

    await page.getByTestId('v2-nav-alerts').click();
    await expect(page.getByText('ALERTS · LOG')).toBeVisible();
    await expect(page.getByText(/expired|vanhentunut/i).first()).toBeVisible({
      timeout: 5000,
    });

    await page
      .getByRole('button', { name: /DISMISS|Dismiss/ })
      .first()
      .click();
    await page.waitForTimeout(300);

    // Alert no longer in the active list.
    const stillVisible = await page
      .getByText(/Expired Item/)
      .first()
      .isVisible()
      .catch(() => false);
    expect(stillVisible).toBe(false);
  });

  test('dismissed alert appears in Settings → Notifications', async ({
    page,
  }) => {
    await seed(page, [makeExpired('Expired Item')]);

    await page.getByTestId('v2-nav-alerts').click();
    await page
      .getByRole('button', { name: /DISMISS|Dismiss/ })
      .first()
      .click();
    await page.waitForTimeout(500);

    await navigateToSettingsSection(page, 'notifications');
    // The DISMISSED ALERTS ReadField swaps to a non-"NONE" value once any
    // alert id has been dismissed.
    await expect(
      page.getByText(/DISMISSED ALERTS|Hidden alerts/i).first(),
    ).toBeVisible();
    await expect(page.getByText(/HIDDEN|hidden/).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('RESTORE ALL re-activates every dismissed alert', async ({ page }) => {
    await seed(page, [
      makeExpired('Expired Item 1'),
      makeExpired('Expired Item 2'),
    ]);

    await page.getByTestId('v2-nav-alerts').click();
    // Dismiss every alert that has a DISMISS button on the page.
    let count = await page
      .getByRole('button', { name: /DISMISS|Dismiss/ })
      .count();
    while (count > 0) {
      await page
        .getByRole('button', { name: /DISMISS|Dismiss/ })
        .first()
        .click();
      await page.waitForTimeout(200);
      count = await page
        .getByRole('button', { name: /DISMISS|Dismiss/ })
        .count();
    }

    await navigateToSettingsSection(page, 'notifications');
    await page.getByRole('button', { name: /RESTORE ALL|Restore all/ }).click();

    await page.getByTestId('v2-nav-alerts').click();
    await expect(page.getByText(/expired|vanhentunut/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('should persist hidden alerts after reload', async ({ page }) => {
    await seed(page, [makeExpired('Expired Item')]);

    await page.getByTestId('v2-nav-alerts').click();
    await page
      .getByRole('button', { name: /DISMISS|Dismiss/ })
      .first()
      .click();
    await page.waitForTimeout(1000);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    await navigateToSettingsSection(page, 'notifications');
    await expect(page.getByText(/HIDDEN|hidden/).first()).toBeVisible({
      timeout: 5000,
    });
  });
});
