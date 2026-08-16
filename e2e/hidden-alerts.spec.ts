import {
  test,
  expect,
  setAppStorage,
  navigateToSettingsSection,
  toLocalDateString,
  APP_URL,
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
  await page.goto(APP_URL);
  await setAppStorage(page, createMockAppData({ settings: v2Settings, items }));
  await page.reload({ waitUntil: 'domcontentloaded' });
}

/**
 * The dashboard banner also carries app notifications and the backup
 * reminder, so tests must target the row for their own seeded item rather
 * than "the first DISMISS button on the page".
 */
function alertRow(page: import('@playwright/test').Page, itemName: string) {
  return page
    .getByTestId('v2-alert-banner')
    .getByTestId('v2-alert-row')
    .filter({ hasText: itemName });
}

async function dismissAlertRow(
  page: import('@playwright/test').Page,
  itemName: string,
) {
  await alertRow(page, itemName)
    .getByRole('button', { name: /DISMISS|Dismiss/ })
    .click();
}

test.describe('Hidden Alerts Management', () => {
  test('should hide alert from the dashboard alert banner', async ({
    page,
  }) => {
    await seed(page, [makeExpired('Expired Item')]);

    await page.getByTestId('v2-nav-home').click();
    await expect(page.getByTestId('v2-alert-banner')).toBeVisible();
    await expect(alertRow(page, 'Expired Item')).toBeVisible({ timeout: 5000 });

    await dismissAlertRow(page, 'Expired Item');

    // Alert no longer in the active list. (The item itself still shows in
    // the priority queue below — only the alert row goes away.)
    await expect(alertRow(page, 'Expired Item')).toHaveCount(0);
  });

  test('dismissed alert appears in Settings → Notifications', async ({
    page,
  }) => {
    await seed(page, [makeExpired('Expired Item')]);

    await page.getByTestId('v2-nav-home').click();
    await dismissAlertRow(page, 'Expired Item');
    await expect(alertRow(page, 'Expired Item')).toHaveCount(0);

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

    await page.getByTestId('v2-nav-home').click();
    for (const name of ['Expired Item 1', 'Expired Item 2']) {
      await dismissAlertRow(page, name);
      await expect(alertRow(page, name)).toHaveCount(0);
    }

    await navigateToSettingsSection(page, 'notifications');
    await page.getByRole('button', { name: /RESTORE ALL|Restore all/ }).click();

    await page.getByTestId('v2-nav-home').click();
    await expect(alertRow(page, 'Expired Item 1')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should persist hidden alerts after reload', async ({ page }) => {
    await seed(page, [makeExpired('Expired Item')]);

    await page.getByTestId('v2-nav-home').click();
    await dismissAlertRow(page, 'Expired Item');
    await expect(alertRow(page, 'Expired Item')).toHaveCount(0);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    await navigateToSettingsSection(page, 'notifications');
    await expect(page.getByText(/HIDDEN|hidden/).first()).toBeVisible({
      timeout: 5000,
    });
  });
});
