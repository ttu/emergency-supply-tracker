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
import { createDateOnly } from '../src/shared/types';

/**
 * In design v2 the backup reminder surfaces in the dashboard alert banner
 * (via useDashboardAlerts). Each test sets the mock app data + navigates to
 * v2-nav-home.
 */

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

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

/**
 * The backup reminder is one row among several in the dashboard alert
 * banner. Scope to the row so the transient "Backup reminder dismissed"
 * toast can't satisfy (or defeat) these assertions.
 */
function backupAlertRow(page: import('@playwright/test').Page) {
  return page
    .getByTestId('v2-alert-banner')
    .getByTestId('v2-alert-row')
    .filter({ hasText: /backup|varmuuskopio/i });
}

test.describe('Backup Reminder', () => {
  test('should show backup reminder after 30 days without backup', async ({
    page,
  }) => {
    const old = daysAgo(31);
    const appData = createMockAppData({
      items: [
        createMockInventoryItem({
          name: 'Test Item',
          neverExpires: true,
          createdAt: old.toISOString(),
          updatedAt: old.toISOString(),
        }),
      ],
      lastModified: old.toISOString(),
      lastBackupDate: undefined,
      settings: v2Settings,
    });

    await page.goto(APP_URL);
    await setAppStorage(page, appData);
    await page.reload({ waitUntil: 'domcontentloaded' });

    await page.getByTestId('v2-nav-home').click();
    await expect(backupAlertRow(page)).toBeVisible({ timeout: 5000 });
  });

  test('should dismiss backup reminder', async ({ page }) => {
    const old = daysAgo(31);
    const appData = createMockAppData({
      items: [
        createMockInventoryItem({
          name: 'Test Item',
          neverExpires: true,
          createdAt: old.toISOString(),
          updatedAt: old.toISOString(),
        }),
      ],
      lastModified: old.toISOString(),
      lastBackupDate: undefined,
      settings: v2Settings,
    });

    await page.goto(APP_URL);
    await setAppStorage(page, appData);
    await page.reload({ waitUntil: 'domcontentloaded' });

    await page.getByTestId('v2-nav-home').click();
    const reminder = backupAlertRow(page);
    await expect(reminder).toBeVisible({ timeout: 5000 });

    // Each banner row has a "DISMISS" control (cockpit voice).
    await reminder.getByRole('button', { name: /DISMISS|Dismiss/ }).click();

    await expect(reminder).toHaveCount(0, { timeout: 3000 });
  });

  test('should not show reminder after dismissal until next month', async ({
    page,
  }) => {
    const old = daysAgo(31);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
    nextMonth.setHours(0, 0, 0, 0);

    const appData = createMockAppData({
      items: [
        createMockInventoryItem({
          name: 'Test Item',
          neverExpires: true,
          createdAt: old.toISOString(),
          updatedAt: old.toISOString(),
        }),
      ],
      lastModified: old.toISOString(),
      lastBackupDate: undefined,
      backupReminderDismissedUntil: createDateOnly(
        toLocalDateString(nextMonth),
      ),
      settings: v2Settings,
    });

    await page.goto(APP_URL);
    await setAppStorage(page, appData);
    await page.reload({ waitUntil: 'domcontentloaded' });

    await page.getByTestId('v2-nav-home').click();
    await expect(backupAlertRow(page)).toHaveCount(0, { timeout: 3000 });
  });

  test('should remove reminder when backup date is recorded', async ({
    page,
  }) => {
    const old = daysAgo(31);
    const appData = createMockAppData({
      items: [
        createMockInventoryItem({
          name: 'Test Item',
          neverExpires: true,
          createdAt: old.toISOString(),
          updatedAt: old.toISOString(),
        }),
      ],
      lastModified: old.toISOString(),
      lastBackupDate: undefined,
      settings: v2Settings,
    });

    await page.goto(APP_URL);
    await setAppStorage(page, appData);
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Reminder visible in the dashboard alert banner
    await page.getByTestId('v2-nav-home').click();
    await expect(backupAlertRow(page)).toBeVisible({ timeout: 5000 });

    // Trigger an export (records lastBackupDate)
    await navigateToSettingsSection(page, 'data');
    const exportButton = page.getByTestId('export-data-button');
    await expect(exportButton).toBeVisible({ timeout: 10000 });
    await exportButton.click();

    // Format-selection modal opens; click the primary Export button.
    const exportModalButton = page.locator('button', {
      hasText: /^Export$|^Vie$/i,
    });
    await expect(exportModalButton).toBeVisible({ timeout: 5000 });
    await exportModalButton.click();
    await page.waitForTimeout(500);

    // Back to alerts — reminder gone.
    await page.getByTestId('v2-nav-home').click();
    await page.waitForLoadState('networkidle');
    await expect(backupAlertRow(page)).toHaveCount(0, { timeout: 3000 });
  });

  test('should surface the reminder in the dashboard alert banner', async ({
    page,
  }) => {
    const old = daysAgo(35);
    const appData = createMockAppData({
      items: [
        createMockInventoryItem({
          name: 'Test Item',
          neverExpires: true,
          createdAt: old.toISOString(),
          updatedAt: old.toISOString(),
        }),
      ],
      lastModified: old.toISOString(),
      lastBackupDate: undefined,
      settings: v2Settings,
    });

    await page.goto(APP_URL);
    await setAppStorage(page, appData);
    await page.reload({ waitUntil: 'domcontentloaded' });

    await page.getByTestId('v2-nav-home').click();
    await expect(page.getByTestId('v2-alert-banner')).toBeVisible();
    await expect(backupAlertRow(page)).toBeVisible({ timeout: 5000 });
  });
});
